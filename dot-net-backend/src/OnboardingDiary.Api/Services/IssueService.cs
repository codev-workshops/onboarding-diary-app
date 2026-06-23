using Microsoft.EntityFrameworkCore;
using OnboardingDiary.Api.Data;
using OnboardingDiary.Api.DTOs;
using OnboardingDiary.Api.DTOs.Issues;
using OnboardingDiary.Api.Middleware;
using OnboardingDiary.Api.Models;
using OnboardingDiary.Api.Models.Enums;

namespace OnboardingDiary.Api.Services;

public class IssueService : IIssueService
{
    private readonly AppDbContext _db;

    public IssueService(AppDbContext db) => _db = db;

    public async Task<IssueDto> CreateAsync(Guid userId, CreateIssueRequest request)
    {
        var entry = new IssueEntry
        {
            UserId = userId,
            Date = request.Date,
            Title = request.Title,
            Description = request.Description,
            Severity = request.Severity,
            Status = request.Status,
            ResolutionNotes = request.ResolutionNotes,
        };
        _db.IssueEntries.Add(entry);
        await _db.SaveChangesAsync();
        return MapToDto(entry);
    }

    public async Task<PagedResult<IssueDto>> ListAsync(Guid userId, string? status, string? severity, DateOnly? dateFrom, DateOnly? dateTo, int page, int perPage)
    {
        var query = _db.IssueEntries.Where(i => i.UserId == userId);
        if (dateFrom.HasValue) query = query.Where(i => i.Date >= dateFrom.Value);
        if (dateTo.HasValue) query = query.Where(i => i.Date <= dateTo.Value);
        if (!string.IsNullOrEmpty(status) && Enum.TryParse<IssueStatus>(status, true, out var s))
            query = query.Where(i => i.Status == s);
        if (!string.IsNullOrEmpty(severity) && Enum.TryParse<IssueSeverity>(severity, true, out var sev))
            query = query.Where(i => i.Severity == sev);

        var total = await query.CountAsync();
        var items = await query.OrderByDescending(i => i.Date).ThenByDescending(i => i.CreatedAt)
            .Skip((page - 1) * perPage).Take(perPage)
            .Select(i => MapToDto(i)).ToListAsync();

        return new PagedResult<IssueDto> { Items = items, Total = total, Page = page, PerPage = perPage };
    }

    public async Task<IssueDto> GetByIdAsync(Guid issueId, Guid userId)
    {
        var entry = await _db.IssueEntries.FindAsync(issueId) ?? throw new NotFoundException("Issue");
        if (entry.UserId != userId) throw new ForbiddenException();
        return MapToDto(entry);
    }

    public async Task<IssueDto> UpdateAsync(Guid issueId, Guid userId, UpdateIssueRequest request)
    {
        var entry = await _db.IssueEntries.FindAsync(issueId) ?? throw new NotFoundException("Issue");
        if (entry.UserId != userId) throw new ForbiddenException();

        if (request.Date.HasValue) entry.Date = request.Date.Value;
        if (request.Title != null) entry.Title = request.Title;
        if (request.Description != null) entry.Description = request.Description;
        if (request.Severity.HasValue) entry.Severity = request.Severity.Value;
        if (request.Status.HasValue) entry.Status = request.Status.Value;
        if (request.ResolutionNotes != null) entry.ResolutionNotes = request.ResolutionNotes;

        await _db.SaveChangesAsync();
        return MapToDto(entry);
    }

    public async Task DeleteAsync(Guid issueId, Guid userId)
    {
        var entry = await _db.IssueEntries.FindAsync(issueId) ?? throw new NotFoundException("Issue");
        if (entry.UserId != userId) throw new ForbiddenException();
        _db.IssueEntries.Remove(entry);
        await _db.SaveChangesAsync();
    }

    private static IssueDto MapToDto(IssueEntry e) => new()
    {
        Id = e.Id, UserId = e.UserId, Date = e.Date, Title = e.Title,
        Description = e.Description, Severity = e.Severity, Status = e.Status,
        ResolutionNotes = e.ResolutionNotes, CreatedAt = e.CreatedAt, UpdatedAt = e.UpdatedAt,
    };
}
