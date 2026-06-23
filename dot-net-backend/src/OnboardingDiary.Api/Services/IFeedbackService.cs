using OnboardingDiary.Api.DTOs;
using OnboardingDiary.Api.DTOs.Feedback;

namespace OnboardingDiary.Api.Services;

public interface IFeedbackService
{
    Task<FeedbackDto> CreateAsync(Guid userId, CreateFeedbackRequest request);
    Task<PagedResult<FeedbackDto>> ListAsync(Guid userId, string? type, DateOnly? dateFrom, DateOnly? dateTo, int page, int perPage);
    Task<FeedbackDto> GetByIdAsync(Guid feedbackId, Guid userId);
    Task<FeedbackDto> UpdateAsync(Guid feedbackId, Guid userId, UpdateFeedbackRequest request);
    Task DeleteAsync(Guid feedbackId, Guid userId);
}
