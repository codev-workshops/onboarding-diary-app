using OnboardingDiary.Api.DTOs;
using OnboardingDiary.Api.DTOs.Issues;

namespace OnboardingDiary.Api.Services;

public interface IIssueService
{
    Task<IssueDto> CreateAsync(Guid userId, CreateIssueRequest request);
    Task<PagedResult<IssueDto>> ListAsync(Guid userId, string? status, string? severity, DateOnly? dateFrom, DateOnly? dateTo, int page, int perPage);
    Task<IssueDto> GetByIdAsync(Guid issueId, Guid userId);
    Task<IssueDto> UpdateAsync(Guid issueId, Guid userId, UpdateIssueRequest request);
    Task DeleteAsync(Guid issueId, Guid userId);
}
