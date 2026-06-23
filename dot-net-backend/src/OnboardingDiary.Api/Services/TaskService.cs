using Microsoft.EntityFrameworkCore;
using OnboardingDiary.Api.Data;
using OnboardingDiary.Api.DTOs;
using OnboardingDiary.Api.DTOs.Tasks;
using OnboardingDiary.Api.Middleware;
using OnboardingDiary.Api.Models;
using OnboardingDiary.Api.Models.Enums;

namespace OnboardingDiary.Api.Services;

public class TaskService : ITaskService
{
    private readonly AppDbContext _db;

    public TaskService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<TaskDto> CreateAsync(Guid userId, CreateTaskRequest request)
    {
        var entry = new TaskEntry
        {
            UserId = userId,
            Date = request.Date,
            Title = request.Title,
            Description = request.Description,
            Category = request.Category,
            Status = request.Status,
            Priority = request.Priority,
        };

        _db.TaskEntries.Add(entry);
        await _db.SaveChangesAsync();
        return MapToDto(entry);
    }

    public async Task<PagedResult<TaskDto>> ListAsync(
        Guid userId, DateOnly? dateFrom, DateOnly? dateTo,
        string? category, string? status, int page, int perPage)
    {
        var query = _db.TaskEntries.Where(t => t.UserId == userId);
        query = ApplyFilters(query, dateFrom, dateTo, category, status);
        return await PaginateAsync(query, page, perPage);
    }

    public async Task<TaskDto> GetByIdAsync(Guid taskId, Guid userId)
    {
        var entry = await _db.TaskEntries.FindAsync(taskId)
            ?? throw new NotFoundException("Task");

        if (entry.UserId != userId)
            throw new ForbiddenException();

        return MapToDto(entry);
    }

    public async Task<TaskDto> UpdateAsync(Guid taskId, Guid userId, UpdateTaskRequest request)
    {
        var entry = await _db.TaskEntries.FindAsync(taskId)
            ?? throw new NotFoundException("Task");

        if (entry.UserId != userId)
            throw new ForbiddenException();

        if (request.Date.HasValue) entry.Date = request.Date.Value;
        if (request.Title != null) entry.Title = request.Title;
        if (request.Description != null) entry.Description = request.Description;
        if (request.Category.HasValue) entry.Category = request.Category.Value;
        if (request.Status.HasValue) entry.Status = request.Status.Value;
        if (request.Priority.HasValue) entry.Priority = request.Priority.Value;

        await _db.SaveChangesAsync();
        return MapToDto(entry);
    }

    public async Task DeleteAsync(Guid taskId, Guid userId)
    {
        var entry = await _db.TaskEntries.FindAsync(taskId)
            ?? throw new NotFoundException("Task");

        if (entry.UserId != userId)
            throw new ForbiddenException();

        _db.TaskEntries.Remove(entry);
        await _db.SaveChangesAsync();
    }

    public async Task<PagedResult<TaskDto>> ListForUserAsync(
        Guid targetUserId, Guid requesterId,
        DateOnly? dateFrom, DateOnly? dateTo,
        string? category, string? status, int page, int perPage)
    {
        var requester = await _db.Users.FindAsync(requesterId)
            ?? throw new NotFoundException("User");

        if (requester.Role == UserRole.Recruit)
            throw new ForbiddenException();

        if (requester.Role == UserRole.Manager)
        {
            var target = await _db.Users.FindAsync(targetUserId)
                ?? throw new NotFoundException("User");
            if (target.ManagerId != requesterId)
                throw new ForbiddenException();
        }

        var query = _db.TaskEntries.Where(t => t.UserId == targetUserId);
        query = ApplyFilters(query, dateFrom, dateTo, category, status);
        return await PaginateAsync(query, page, perPage);
    }

    private static IQueryable<TaskEntry> ApplyFilters(
        IQueryable<TaskEntry> query, DateOnly? dateFrom, DateOnly? dateTo,
        string? category, string? status)
    {
        if (dateFrom.HasValue)
            query = query.Where(t => t.Date >= dateFrom.Value);
        if (dateTo.HasValue)
            query = query.Where(t => t.Date <= dateTo.Value);
        if (!string.IsNullOrEmpty(category) && Enum.TryParse<TaskCategory>(category, true, out var cat))
            query = query.Where(t => t.Category == cat);
        if (!string.IsNullOrEmpty(status) && Enum.TryParse<Models.Enums.TaskStatus>(status, true, out var stat))
            query = query.Where(t => t.Status == stat);
        return query;
    }

    private static async Task<PagedResult<TaskDto>> PaginateAsync(
        IQueryable<TaskEntry> query, int page, int perPage)
    {
        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(t => t.Date)
            .ThenByDescending(t => t.CreatedAt)
            .Skip((page - 1) * perPage)
            .Take(perPage)
            .Select(t => MapToDto(t))
            .ToListAsync();

        return new PagedResult<TaskDto>
        {
            Items = items,
            Total = total,
            Page = page,
            PerPage = perPage
        };
    }

    private static TaskDto MapToDto(TaskEntry entry) => new()
    {
        Id = entry.Id,
        UserId = entry.UserId,
        Date = entry.Date,
        Title = entry.Title,
        Description = entry.Description,
        Category = entry.Category,
        Status = entry.Status,
        Priority = entry.Priority,
        CreatedAt = entry.CreatedAt,
        UpdatedAt = entry.UpdatedAt,
    };
}
