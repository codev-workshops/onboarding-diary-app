using OnboardingDiary.Api.DTOs;
using OnboardingDiary.Api.DTOs.Notes;

namespace OnboardingDiary.Api.Services;

public interface INoteService
{
    Task<NoteDto> CreateAsync(Guid userId, CreateNoteRequest request);
    Task<PagedResult<NoteDto>> ListAsync(Guid userId, string? tag, DateOnly? dateFrom, DateOnly? dateTo, int page, int perPage);
    Task<NoteDto> GetByIdAsync(Guid noteId, Guid userId);
    Task<NoteDto> UpdateAsync(Guid noteId, Guid userId, UpdateNoteRequest request);
    Task DeleteAsync(Guid noteId, Guid userId);
}
