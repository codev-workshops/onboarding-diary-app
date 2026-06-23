using FluentAssertions;
using OnboardingDiary.Api.DTOs.Issues;
using OnboardingDiary.Api.Middleware;
using OnboardingDiary.Api.Models;
using OnboardingDiary.Api.Models.Enums;
using OnboardingDiary.Api.Services;
using OnboardingDiary.UnitTests.Helpers;

namespace OnboardingDiary.UnitTests.Services;

public class IssueServiceTests
{
    private static readonly Guid UserId = Guid.NewGuid();

    [Fact]
    public async Task Create_ReturnsDto()
    {
        using var db = TestDbContext.Create();
        var sut = new IssueService(db);
        var result = await sut.CreateAsync(UserId, new CreateIssueRequest
        {
            Date = DateOnly.FromDateTime(DateTime.Today),
            Title = "VPN not working",
            Description = "Cannot connect",
            Severity = IssueSeverity.High,
            Status = IssueStatus.Open,
        });
        result.Title.Should().Be("VPN not working");
        result.UserId.Should().Be(UserId);
    }

    [Fact]
    public async Task GetById_WrongUser_ThrowsForbidden()
    {
        using var db = TestDbContext.Create();
        var sut = new IssueService(db);
        var entry = new IssueEntry { Id = Guid.NewGuid(), UserId = Guid.NewGuid(), Date = DateOnly.FromDateTime(DateTime.Today), Title = "T", Description = "D" };
        db.IssueEntries.Add(entry);
        await db.SaveChangesAsync();

        await sut.Invoking(s => s.GetByIdAsync(entry.Id, UserId)).Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task Update_ChangesFields()
    {
        using var db = TestDbContext.Create();
        var sut = new IssueService(db);
        var entry = new IssueEntry { Id = Guid.NewGuid(), UserId = UserId, Date = DateOnly.FromDateTime(DateTime.Today), Title = "Old", Description = "D", Status = IssueStatus.Open };
        db.IssueEntries.Add(entry);
        await db.SaveChangesAsync();

        var result = await sut.UpdateAsync(entry.Id, UserId, new UpdateIssueRequest { Status = IssueStatus.Resolved, ResolutionNotes = "Fixed" });
        result.Status.Should().Be(IssueStatus.Resolved);
        result.ResolutionNotes.Should().Be("Fixed");
    }

    [Fact]
    public async Task Delete_RemovesEntry()
    {
        using var db = TestDbContext.Create();
        var sut = new IssueService(db);
        var entry = new IssueEntry { Id = Guid.NewGuid(), UserId = UserId, Date = DateOnly.FromDateTime(DateTime.Today), Title = "T", Description = "D" };
        db.IssueEntries.Add(entry);
        await db.SaveChangesAsync();

        await sut.DeleteAsync(entry.Id, UserId);
        db.IssueEntries.Should().BeEmpty();
    }

    [Fact]
    public async Task List_FiltersByUser()
    {
        using var db = TestDbContext.Create();
        var sut = new IssueService(db);
        db.IssueEntries.AddRange(
            new IssueEntry { UserId = UserId, Date = DateOnly.FromDateTime(DateTime.Today), Title = "Mine", Description = "D" },
            new IssueEntry { UserId = Guid.NewGuid(), Date = DateOnly.FromDateTime(DateTime.Today), Title = "Other", Description = "D" }
        );
        await db.SaveChangesAsync();

        var result = await sut.ListAsync(UserId, null, null, null, null, 1, 10);
        result.Total.Should().Be(1);
    }
}
