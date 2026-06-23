using FluentAssertions;
using OnboardingDiary.Api.Models;
using OnboardingDiary.Api.Models.Enums;
using OnboardingDiary.Api.Services;
using OnboardingDiary.UnitTests.Helpers;

namespace OnboardingDiary.UnitTests.Services;

public class DashboardServiceTests
{
    private static readonly Guid UserId = Guid.NewGuid();

    [Fact]
    public async Task EmptyData_ReturnsZeros()
    {
        using var db = TestDbContext.Create();
        var sut = new DashboardService(db);

        var result = await sut.GetDashboardAsync(UserId);

        result.TotalTasks.Should().Be(0);
        result.TotalIssues.Should().Be(0);
        result.TaskCompletionRate.Should().Be(0);
    }

    [Fact]
    public async Task WithData_ReturnsCorrectCounts()
    {
        using var db = TestDbContext.Create();
        db.TaskEntries.AddRange(
            new TaskEntry { UserId = UserId, Date = DateOnly.FromDateTime(DateTime.Today), Title = "T1", Description = "D", Status = Api.Models.Enums.TaskStatus.Completed },
            new TaskEntry { UserId = UserId, Date = DateOnly.FromDateTime(DateTime.Today), Title = "T2", Description = "D", Status = Api.Models.Enums.TaskStatus.InProgress }
        );
        db.IssueEntries.Add(new IssueEntry { UserId = UserId, Date = DateOnly.FromDateTime(DateTime.Today), Title = "I1", Description = "D", Status = IssueStatus.Open });
        db.FeedbackEntries.Add(new FeedbackEntry { UserId = UserId, Date = DateOnly.FromDateTime(DateTime.Today), Subject = "F1", Details = "D", Type = FeedbackType.Positive });
        db.NoteEntries.Add(new NoteEntry { UserId = UserId, Date = DateOnly.FromDateTime(DateTime.Today), Title = "N1", Content = "C" });
        await db.SaveChangesAsync();

        var sut = new DashboardService(db);
        var result = await sut.GetDashboardAsync(UserId);

        result.TotalTasks.Should().Be(2);
        result.CompletedTasks.Should().Be(1);
        result.InProgressTasks.Should().Be(1);
        result.TotalIssues.Should().Be(1);
        result.OpenIssues.Should().Be(1);
        result.TotalFeedback.Should().Be(1);
        result.TotalNotes.Should().Be(1);
        result.TaskCompletionRate.Should().Be(50);
    }

    [Fact]
    public async Task RecentActivity_IncludesTasksAndIssues()
    {
        using var db = TestDbContext.Create();
        db.TaskEntries.Add(new TaskEntry { UserId = UserId, Date = DateOnly.FromDateTime(DateTime.Today), Title = "Recent Task", Description = "D" });
        db.IssueEntries.Add(new IssueEntry { UserId = UserId, Date = DateOnly.FromDateTime(DateTime.Today), Title = "Recent Issue", Description = "D" });
        await db.SaveChangesAsync();

        var sut = new DashboardService(db);
        var result = await sut.GetDashboardAsync(UserId);

        result.RecentActivity.Should().HaveCount(2);
        result.RecentActivity.Should().Contain(r => r.Type == "Task");
        result.RecentActivity.Should().Contain(r => r.Type == "Issue");
    }

    [Fact]
    public async Task OnlyReturnsCurrentUserData()
    {
        using var db = TestDbContext.Create();
        db.TaskEntries.Add(new TaskEntry { UserId = Guid.NewGuid(), Date = DateOnly.FromDateTime(DateTime.Today), Title = "Other", Description = "D" });
        await db.SaveChangesAsync();

        var sut = new DashboardService(db);
        var result = await sut.GetDashboardAsync(UserId);

        result.TotalTasks.Should().Be(0);
    }
}
