using Microsoft.EntityFrameworkCore;
using OnboardingDiary.Api.Data;
using OnboardingDiary.Api.DTOs;
using OnboardingDiary.Api.DTOs.Feedback;
using OnboardingDiary.Api.Middleware;
using OnboardingDiary.Api.Models;
using OnboardingDiary.Api.Models.Enums;

namespace OnboardingDiary.Api.Services;

public class FeedbackService : IFeedbackService
{
    private readonly AppDbContext _db;

    public FeedbackService(AppDbContext db) => _db = db;

    public async Task<FeedbackDto> CreateAsync(Guid userId, CreateFeedbackRequest request)
    {
        var entry = new FeedbackEntry
        {
            UserId = userId, Date = request.Date, Subject = request.Subject,
            Type = request.Type, Details = request.Details,
        };
        _db.FeedbackEntries.Add(entry);
        await _db.SaveChangesAsync();
        return MapToDto(entry);
    }

    public async Task<PagedResult<FeedbackDto>> ListAsync(Guid userId, string? type, DateOnly? dateFrom, DateOnly? dateTo, int page, int perPage)
    {
        var query = _db.FeedbackEntries.Where(f => f.UserId == userId);
        if (dateFrom.HasValue) query = query.Where(f => f.Date >= dateFrom.Value);
        if (dateTo.HasValue) query = query.Where(f => f.Date <= dateTo.Value);
        if (!string.IsNullOrEmpty(type) && Enum.TryParse<FeedbackType>(type, true, out var ft))
            query = query.Where(f => f.Type == ft);

        var total = await query.CountAsync();
        var items = await query.OrderByDescending(f => f.Date).ThenByDescending(f => f.CreatedAt)
            .Skip((page - 1) * perPage).Take(perPage)
            .Select(f => MapToDto(f)).ToListAsync();

        return new PagedResult<FeedbackDto> { Items = items, Total = total, Page = page, PerPage = perPage };
    }

    public async Task<FeedbackDto> GetByIdAsync(Guid feedbackId, Guid userId)
    {
        var entry = await _db.FeedbackEntries.FindAsync(feedbackId) ?? throw new NotFoundException("Feedback");
        if (entry.UserId != userId) throw new ForbiddenException();
        return MapToDto(entry);
    }

    public async Task<FeedbackDto> UpdateAsync(Guid feedbackId, Guid userId, UpdateFeedbackRequest request)
    {
        var entry = await _db.FeedbackEntries.FindAsync(feedbackId) ?? throw new NotFoundException("Feedback");
        if (entry.UserId != userId) throw new ForbiddenException();

        if (request.Date.HasValue) entry.Date = request.Date.Value;
        if (request.Subject != null) entry.Subject = request.Subject;
        if (request.Type.HasValue) entry.Type = request.Type.Value;
        if (request.Details != null) entry.Details = request.Details;

        await _db.SaveChangesAsync();
        return MapToDto(entry);
    }

    public async Task DeleteAsync(Guid feedbackId, Guid userId)
    {
        var entry = await _db.FeedbackEntries.FindAsync(feedbackId) ?? throw new NotFoundException("Feedback");
        if (entry.UserId != userId) throw new ForbiddenException();
        _db.FeedbackEntries.Remove(entry);
        await _db.SaveChangesAsync();
    }

    private static FeedbackDto MapToDto(FeedbackEntry e) => new()
    {
        Id = e.Id, UserId = e.UserId, Date = e.Date, Subject = e.Subject,
        Type = e.Type, Details = e.Details, CreatedAt = e.CreatedAt, UpdatedAt = e.UpdatedAt,
    };
}
