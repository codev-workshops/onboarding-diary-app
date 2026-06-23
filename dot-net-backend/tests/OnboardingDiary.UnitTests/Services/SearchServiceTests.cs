using FluentAssertions;
using OnboardingDiary.Api.Models;
using OnboardingDiary.Api.Services;
using OnboardingDiary.UnitTests.Helpers;

namespace OnboardingDiary.UnitTests.Services;

public class SearchServiceTests
{
    private static readonly Guid UserId = Guid.NewGuid();

    [Fact]
    public async Task Search_FindsTaskByTitle()
    {
        using var db = TestDbContext.Create();
        db.TaskEntries.Add(new TaskEntry { UserId = UserId, Date = DateOnly.FromDateTime(DateTime.Today), Title = "Setup IDE", Description = "Install tools" });
        await db.SaveChangesAsync();

        var sut = new SearchService(db);
        var result = await sut.SearchAsync(UserId, "setup", null, 1, 20);
        result.Total.Should().Be(1);
        result.Results[0].Type.Should().Be("Task");
    }

    [Fact]
    public async Task Search_FindsIssueByDescription()
    {
        using var db = TestDbContext.Create();
        db.IssueEntries.Add(new IssueEntry { UserId = UserId, Date = DateOnly.FromDateTime(DateTime.Today), Title = "Build problem", Description = "CI pipeline broken" });
        await db.SaveChangesAsync();

        var sut = new SearchService(db);
        var result = await sut.SearchAsync(UserId, "pipeline", null, 1, 20);
        result.Total.Should().Be(1);
    }

    [Fact]
    public async Task Search_FiltersByType()
    {
        using var db = TestDbContext.Create();
        db.TaskEntries.Add(new TaskEntry { UserId = UserId, Date = DateOnly.FromDateTime(DateTime.Today), Title = "Common word", Description = "D" });
        db.IssueEntries.Add(new IssueEntry { UserId = UserId, Date = DateOnly.FromDateTime(DateTime.Today), Title = "Common word", Description = "D" });
        await db.SaveChangesAsync();

        var sut = new SearchService(db);
        var result = await sut.SearchAsync(UserId, "common", "tasks", 1, 20);
        result.Total.Should().Be(1);
        result.Results[0].Type.Should().Be("Task");
    }

    [Fact]
    public async Task Search_DoesNotReturnOtherUserData()
    {
        using var db = TestDbContext.Create();
        db.TaskEntries.Add(new TaskEntry { UserId = Guid.NewGuid(), Date = DateOnly.FromDateTime(DateTime.Today), Title = "Secret task", Description = "D" });
        await db.SaveChangesAsync();

        var sut = new SearchService(db);
        var result = await sut.SearchAsync(UserId, "secret", null, 1, 20);
        result.Total.Should().Be(0);
    }
}
