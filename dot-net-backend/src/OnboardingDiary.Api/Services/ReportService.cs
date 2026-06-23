using Microsoft.EntityFrameworkCore;
using OnboardingDiary.Api.Data;
using OnboardingDiary.Api.DTOs.Feedback;
using OnboardingDiary.Api.DTOs.Issues;
using OnboardingDiary.Api.DTOs.Reports;
using OnboardingDiary.Api.DTOs.Tasks;
using OnboardingDiary.Api.Middleware;
using OnboardingDiary.Api.Models.Enums;

namespace OnboardingDiary.Api.Services;

public class ReportService : IReportService
{
    private readonly AppDbContext _db;

    public ReportService(AppDbContext db) => _db = db;

    public async Task<ReportData> GetReportDataAsync(Guid userId, ReportRequest request)
    {
        var user = await _db.Users.FindAsync(userId) ?? throw new NotFoundException("User");
        return await BuildReportAsync(userId, user.FullName, request);
    }

    public async Task<ReportData> GetReportDataForUserAsync(Guid targetUserId, Guid requesterId, ReportRequest request)
    {
        var requester = await _db.Users.FindAsync(requesterId) ?? throw new NotFoundException("User");
        if (requester.Role == UserRole.Recruit) throw new ForbiddenException();

        if (requester.Role == UserRole.Manager)
        {
            var target = await _db.Users.FindAsync(targetUserId) ?? throw new NotFoundException("User");
            if (target.ManagerId != requesterId) throw new ForbiddenException();
        }

        var targetUser = await _db.Users.FindAsync(targetUserId) ?? throw new NotFoundException("User");
        return await BuildReportAsync(targetUserId, targetUser.FullName, request);
    }

    private async Task<ReportData> BuildReportAsync(Guid userId, string userName, ReportRequest request)
    {
        var data = new ReportData
        {
            UserName = userName,
            DateFrom = request.DateFrom,
            DateTo = request.DateTo,
            Type = request.Type,
        };

        if (request.Type is "tasks" or "combined")
        {
            data.Tasks = await _db.TaskEntries
                .Where(t => t.UserId == userId && t.Date >= request.DateFrom && t.Date <= request.DateTo)
                .OrderBy(t => t.Date)
                .Select(t => new TaskDto
                {
                    Id = t.Id, UserId = t.UserId, Date = t.Date, Title = t.Title,
                    Description = t.Description, Category = t.Category, Status = t.Status,
                    Priority = t.Priority, CreatedAt = t.CreatedAt, UpdatedAt = t.UpdatedAt,
                }).ToListAsync();
        }

        if (request.Type is "issues" or "combined")
        {
            data.Issues = await _db.IssueEntries
                .Where(i => i.UserId == userId && i.Date >= request.DateFrom && i.Date <= request.DateTo)
                .OrderBy(i => i.Date)
                .Select(i => new IssueDto
                {
                    Id = i.Id, UserId = i.UserId, Date = i.Date, Title = i.Title,
                    Description = i.Description, Severity = i.Severity, Status = i.Status,
                    ResolutionNotes = i.ResolutionNotes, CreatedAt = i.CreatedAt, UpdatedAt = i.UpdatedAt,
                }).ToListAsync();
        }

        if (request.Type is "feedback" or "combined")
        {
            data.Feedback = await _db.FeedbackEntries
                .Where(f => f.UserId == userId && f.Date >= request.DateFrom && f.Date <= request.DateTo)
                .OrderBy(f => f.Date)
                .Select(f => new FeedbackDto
                {
                    Id = f.Id, UserId = f.UserId, Date = f.Date, Subject = f.Subject,
                    Type = f.Type, Details = f.Details, CreatedAt = f.CreatedAt, UpdatedAt = f.UpdatedAt,
                }).ToListAsync();
        }

        return data;
    }
}
