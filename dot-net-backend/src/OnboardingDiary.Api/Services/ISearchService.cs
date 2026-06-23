using OnboardingDiary.Api.DTOs.Search;

namespace OnboardingDiary.Api.Services;

public interface ISearchService
{
    Task<SearchResponse> SearchAsync(Guid userId, string query, string? type, int page, int perPage);
}
