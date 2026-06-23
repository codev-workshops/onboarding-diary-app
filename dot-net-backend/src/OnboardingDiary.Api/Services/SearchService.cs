using Microsoft.EntityFrameworkCore;
using OnboardingDiary.Api.Data;
using OnboardingDiary.Api.DTOs.Search;

namespace OnboardingDiary.Api.Services;

public class SearchService : ISearchService
{
    private readonly AppDbContext _db;

    public SearchService(AppDbContext db) => _db = db;

    public async Task<SearchResponse> SearchAsync(Guid userId, string query, string? type, int page, int perPage)
    {
        var results = new List<SearchResultDto>();
        var q = query.ToLower();

        if (type is null or "tasks")
        {
            var tasks = await _db.TaskEntries
                .Where(t => t.UserId == userId && (t.Title.ToLower().Contains(q) || t.Description.ToLower().Contains(q)))
                .Select(t => new SearchResultDto { Id = t.Id, Type = "Task", Title = t.Title, Snippet = t.Description.Substring(0, Math.Min(100, t.Description.Length)), Date = t.Date, CreatedAt = t.CreatedAt })
                .ToListAsync();
            results.AddRange(tasks);
        }

        if (type is null or "issues")
        {
            var issues = await _db.IssueEntries
                .Where(i => i.UserId == userId && (i.Title.ToLower().Contains(q) || i.Description.ToLower().Contains(q)))
                .Select(i => new SearchResultDto { Id = i.Id, Type = "Issue", Title = i.Title, Snippet = i.Description.Substring(0, Math.Min(100, i.Description.Length)), Date = i.Date, CreatedAt = i.CreatedAt })
                .ToListAsync();
            results.AddRange(issues);
        }

        if (type is null or "feedback")
        {
            var feedback = await _db.FeedbackEntries
                .Where(f => f.UserId == userId && (f.Subject.ToLower().Contains(q) || f.Details.ToLower().Contains(q)))
                .Select(f => new SearchResultDto { Id = f.Id, Type = "Feedback", Title = f.Subject, Snippet = f.Details.Substring(0, Math.Min(100, f.Details.Length)), Date = f.Date, CreatedAt = f.CreatedAt })
                .ToListAsync();
            results.AddRange(feedback);
        }

        if (type is null or "notes")
        {
            var notes = await _db.NoteEntries
                .Where(n => n.UserId == userId && (n.Title.ToLower().Contains(q) || n.Content.ToLower().Contains(q)))
                .Select(n => new SearchResultDto { Id = n.Id, Type = "Note", Title = n.Title, Snippet = n.Content.Substring(0, Math.Min(100, n.Content.Length)), Date = n.Date, CreatedAt = n.CreatedAt })
                .ToListAsync();
            results.AddRange(notes);
        }

        var ordered = results.OrderByDescending(r => r.CreatedAt).ToList();
        var total = ordered.Count;
        var paged = ordered.Skip((page - 1) * perPage).Take(perPage).ToList();

        return new SearchResponse { Results = paged, Total = total };
    }
}
