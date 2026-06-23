using Microsoft.EntityFrameworkCore;
using OnboardingDiary.Api.Data;
using OnboardingDiary.Api.DTOs.Dashboard;
using OnboardingDiary.Api.Models.Enums;

namespace OnboardingDiary.Api.Services;

public class DashboardService : IDashboardService
{
    private readonly AppDbContext _db;

    public DashboardService(AppDbContext db) => _db = db;

    public async Task<DashboardDto> GetDashboardAsync(Guid userId)
    {
        var tasks = _db.TaskEntries.Where(t => t.UserId == userId);
        var issues = _db.IssueEntries.Where(i => i.UserId == userId);

        var totalTasks = await tasks.CountAsync();
        var completedTasks = await tasks.CountAsync(t => t.Status == Models.Enums.TaskStatus.Completed);
        var inProgressTasks = await tasks.CountAsync(t => t.Status == Models.Enums.TaskStatus.InProgress);

        var totalIssues = await issues.CountAsync();
        var openIssues = await issues.CountAsync(i => i.Status == IssueStatus.Open);
        var resolvedIssues = await issues.CountAsync(i => i.Status == IssueStatus.Resolved);

        var totalFeedback = await _db.FeedbackEntries.CountAsync(f => f.UserId == userId);
        var totalNotes = await _db.NoteEntries.CountAsync(n => n.UserId == userId);

        var recentTasks = await tasks.OrderByDescending(t => t.CreatedAt).Take(5)
            .Select(t => new RecentEntryDto { Id = t.Id, Type = "Task", Title = t.Title, Date = t.Date, CreatedAt = t.CreatedAt })
            .ToListAsync();

        var recentIssues = await issues.OrderByDescending(i => i.CreatedAt).Take(5)
            .Select(i => new RecentEntryDto { Id = i.Id, Type = "Issue", Title = i.Title, Date = i.Date, CreatedAt = i.CreatedAt })
            .ToListAsync();

        var recentActivity = recentTasks.Concat(recentIssues)
            .OrderByDescending(r => r.CreatedAt).Take(10).ToList();

        return new DashboardDto
        {
            TotalTasks = totalTasks,
            CompletedTasks = completedTasks,
            InProgressTasks = inProgressTasks,
            TotalIssues = totalIssues,
            OpenIssues = openIssues,
            ResolvedIssues = resolvedIssues,
            TotalFeedback = totalFeedback,
            TotalNotes = totalNotes,
            TaskCompletionRate = totalTasks > 0 ? Math.Round((double)completedTasks / totalTasks * 100, 1) : 0,
            RecentActivity = recentActivity,
        };
    }
}
