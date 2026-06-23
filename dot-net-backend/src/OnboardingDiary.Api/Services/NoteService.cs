using Microsoft.EntityFrameworkCore;
using OnboardingDiary.Api.Data;
using OnboardingDiary.Api.DTOs;
using OnboardingDiary.Api.DTOs.Notes;
using OnboardingDiary.Api.Middleware;
using OnboardingDiary.Api.Models;

namespace OnboardingDiary.Api.Services;

public class NoteService : INoteService
{
    private readonly AppDbContext _db;

    public NoteService(AppDbContext db) => _db = db;

    public async Task<NoteDto> CreateAsync(Guid userId, CreateNoteRequest request)
    {
        var entry = new NoteEntry
        {
            UserId = userId, Date = request.Date, Title = request.Title,
            Content = request.Content,
            Tags = request.Tags.Select(t => new NoteTag { Tag = t }).ToList(),
        };
        _db.NoteEntries.Add(entry);
        await _db.SaveChangesAsync();
        return MapToDto(entry);
    }

    public async Task<PagedResult<NoteDto>> ListAsync(Guid userId, string? tag, DateOnly? dateFrom, DateOnly? dateTo, int page, int perPage)
    {
        var query = _db.NoteEntries.Include(n => n.Tags).Where(n => n.UserId == userId);
        if (dateFrom.HasValue) query = query.Where(n => n.Date >= dateFrom.Value);
        if (dateTo.HasValue) query = query.Where(n => n.Date <= dateTo.Value);
        if (!string.IsNullOrEmpty(tag))
            query = query.Where(n => n.Tags.Any(t => t.Tag == tag));

        var total = await query.CountAsync();
        var items = await query.OrderByDescending(n => n.Date).ThenByDescending(n => n.CreatedAt)
            .Skip((page - 1) * perPage).Take(perPage).ToListAsync();

        return new PagedResult<NoteDto>
        {
            Items = items.Select(MapToDto).ToList(),
            Total = total, Page = page, PerPage = perPage
        };
    }

    public async Task<NoteDto> GetByIdAsync(Guid noteId, Guid userId)
    {
        var entry = await _db.NoteEntries.Include(n => n.Tags).FirstOrDefaultAsync(n => n.Id == noteId)
            ?? throw new NotFoundException("Note");
        if (entry.UserId != userId) throw new ForbiddenException();
        return MapToDto(entry);
    }

    public async Task<NoteDto> UpdateAsync(Guid noteId, Guid userId, UpdateNoteRequest request)
    {
        var entry = await _db.NoteEntries.Include(n => n.Tags).FirstOrDefaultAsync(n => n.Id == noteId)
            ?? throw new NotFoundException("Note");
        if (entry.UserId != userId) throw new ForbiddenException();

        if (request.Date.HasValue) entry.Date = request.Date.Value;
        if (request.Title != null) entry.Title = request.Title;
        if (request.Content != null) entry.Content = request.Content;
        if (request.Tags != null)
        {
            _db.RemoveRange(entry.Tags);
            entry.Tags = request.Tags.Select(t => new NoteTag { Tag = t, NoteId = entry.Id }).ToList();
        }

        await _db.SaveChangesAsync();
        return MapToDto(entry);
    }

    public async Task DeleteAsync(Guid noteId, Guid userId)
    {
        var entry = await _db.NoteEntries.FindAsync(noteId) ?? throw new NotFoundException("Note");
        if (entry.UserId != userId) throw new ForbiddenException();
        _db.NoteEntries.Remove(entry);
        await _db.SaveChangesAsync();
    }

    private static NoteDto MapToDto(NoteEntry e) => new()
    {
        Id = e.Id, UserId = e.UserId, Date = e.Date, Title = e.Title,
        Content = e.Content, Tags = e.Tags.Select(t => t.Tag).ToList(),
        CreatedAt = e.CreatedAt, UpdatedAt = e.UpdatedAt,
    };
}
