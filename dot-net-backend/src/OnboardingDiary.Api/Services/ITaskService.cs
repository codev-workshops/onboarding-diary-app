using OnboardingDiary.Api.DTOs;
using OnboardingDiary.Api.DTOs.Tasks;

namespace OnboardingDiary.Api.Services;

public interface ITaskService
{
    Task<TaskDto> CreateAsync(Guid userId, CreateTaskRequest request);
    Task<PagedResult<TaskDto>> ListAsync(Guid userId, DateOnly? dateFrom, DateOnly? dateTo, string? category, string? status, int page, int perPage);
    Task<TaskDto> GetByIdAsync(Guid taskId, Guid userId);
    Task<TaskDto> UpdateAsync(Guid taskId, Guid userId, UpdateTaskRequest request);
    Task DeleteAsync(Guid taskId, Guid userId);
    Task<PagedResult<TaskDto>> ListForUserAsync(Guid targetUserId, Guid requesterId, DateOnly? dateFrom, DateOnly? dateTo, string? category, string? status, int page, int perPage);
}
