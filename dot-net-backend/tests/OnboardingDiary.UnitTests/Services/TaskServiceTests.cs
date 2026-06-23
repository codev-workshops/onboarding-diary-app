using FluentAssertions;
using OnboardingDiary.Api.DTOs.Tasks;
using OnboardingDiary.Api.Middleware;
using OnboardingDiary.Api.Models;
using OnboardingDiary.Api.Models.Enums;
using OnboardingDiary.Api.Services;
using OnboardingDiary.UnitTests.Helpers;

namespace OnboardingDiary.UnitTests.Services;

public class TaskServiceTests
{
    private static Guid _userId = Guid.NewGuid();

    private TaskService CreateService(Api.Data.AppDbContext db) => new(db);

    private static CreateTaskRequest ValidCreateRequest() => new()
    {
        Date = DateOnly.FromDateTime(DateTime.Today),
        Title = "Setup dev environment",
        Description = "Install IDE and tools",
        Category = TaskCategory.Setup,
        Status = OnboardingDiary.Api.Models.Enums.TaskStatus.InProgress,
        Priority = TaskPriority.High,
    };

    [Fact]
    public async Task Create_ValidInput_ReturnsDto()
    {
        using var db = TestDbContext.Create();
        var sut = CreateService(db);

        var result = await sut.CreateAsync(_userId, ValidCreateRequest());

        result.Title.Should().Be("Setup dev environment");
        result.UserId.Should().Be(_userId);
        result.Status.Should().Be(OnboardingDiary.Api.Models.Enums.TaskStatus.InProgress);
        db.TaskEntries.Should().HaveCount(1);
    }

    [Fact]
    public async Task GetById_ExistingTask_ReturnsDto()
    {
        using var db = TestDbContext.Create();
        var sut = CreateService(db);
        var entry = new TaskEntry
        {
            Id = Guid.NewGuid(),
            UserId = _userId,
            Date = DateOnly.FromDateTime(DateTime.Today),
            Title = "Test",
            Description = "Desc",
        };
        db.TaskEntries.Add(entry);
        await db.SaveChangesAsync();

        var result = await sut.GetByIdAsync(entry.Id, _userId);

        result.Title.Should().Be("Test");
    }

    [Fact]
    public async Task GetById_NonExistent_ThrowsNotFound()
    {
        using var db = TestDbContext.Create();
        var sut = CreateService(db);

        await sut.Invoking(s => s.GetByIdAsync(Guid.NewGuid(), _userId))
            .Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task GetById_WrongUser_ThrowsForbidden()
    {
        using var db = TestDbContext.Create();
        var sut = CreateService(db);
        var entry = new TaskEntry
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            Date = DateOnly.FromDateTime(DateTime.Today),
            Title = "Test",
            Description = "Desc",
        };
        db.TaskEntries.Add(entry);
        await db.SaveChangesAsync();

        await sut.Invoking(s => s.GetByIdAsync(entry.Id, _userId))
            .Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task Update_ValidInput_UpdatesFields()
    {
        using var db = TestDbContext.Create();
        var sut = CreateService(db);
        var entry = new TaskEntry
        {
            Id = Guid.NewGuid(),
            UserId = _userId,
            Date = DateOnly.FromDateTime(DateTime.Today),
            Title = "Old Title",
            Description = "Old Desc",
        };
        db.TaskEntries.Add(entry);
        await db.SaveChangesAsync();

        var result = await sut.UpdateAsync(entry.Id, _userId, new UpdateTaskRequest
        {
            Title = "New Title",
            Status = OnboardingDiary.Api.Models.Enums.TaskStatus.Completed
        });

        result.Title.Should().Be("New Title");
        result.Status.Should().Be(OnboardingDiary.Api.Models.Enums.TaskStatus.Completed);
        result.Description.Should().Be("Old Desc");
    }

    [Fact]
    public async Task Delete_ValidOwner_RemovesEntry()
    {
        using var db = TestDbContext.Create();
        var sut = CreateService(db);
        var entry = new TaskEntry
        {
            Id = Guid.NewGuid(),
            UserId = _userId,
            Date = DateOnly.FromDateTime(DateTime.Today),
            Title = "To Delete",
            Description = "Desc",
        };
        db.TaskEntries.Add(entry);
        await db.SaveChangesAsync();

        await sut.DeleteAsync(entry.Id, _userId);

        db.TaskEntries.Should().BeEmpty();
    }

    [Fact]
    public async Task Delete_WrongUser_ThrowsForbidden()
    {
        using var db = TestDbContext.Create();
        var sut = CreateService(db);
        var entry = new TaskEntry
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            Date = DateOnly.FromDateTime(DateTime.Today),
            Title = "Test",
            Description = "Desc",
        };
        db.TaskEntries.Add(entry);
        await db.SaveChangesAsync();

        await sut.Invoking(s => s.DeleteAsync(entry.Id, _userId))
            .Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task List_FiltersByUserId()
    {
        using var db = TestDbContext.Create();
        var sut = CreateService(db);
        var otherUser = Guid.NewGuid();
        db.TaskEntries.AddRange(
            new TaskEntry { UserId = _userId, Date = DateOnly.FromDateTime(DateTime.Today), Title = "Mine", Description = "D" },
            new TaskEntry { UserId = otherUser, Date = DateOnly.FromDateTime(DateTime.Today), Title = "Other", Description = "D" }
        );
        await db.SaveChangesAsync();

        var result = await sut.ListAsync(_userId, null, null, null, null, 1, 10);

        result.Total.Should().Be(1);
        result.Items.Should().ContainSingle(t => t.Title == "Mine");
    }

    [Fact]
    public async Task List_PaginatesCorrectly()
    {
        using var db = TestDbContext.Create();
        var sut = CreateService(db);
        for (int i = 0; i < 5; i++)
        {
            db.TaskEntries.Add(new TaskEntry
            {
                UserId = _userId,
                Date = DateOnly.FromDateTime(DateTime.Today),
                Title = $"Task {i}",
                Description = "D"
            });
        }
        await db.SaveChangesAsync();

        var page1 = await sut.ListAsync(_userId, null, null, null, null, 1, 2);
        var page2 = await sut.ListAsync(_userId, null, null, null, null, 2, 2);

        page1.Items.Should().HaveCount(2);
        page1.Total.Should().Be(5);
        page2.Items.Should().HaveCount(2);
    }
}
