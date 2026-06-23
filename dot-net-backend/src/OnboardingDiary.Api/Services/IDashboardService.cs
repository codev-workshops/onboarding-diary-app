using OnboardingDiary.Api.DTOs.Dashboard;

namespace OnboardingDiary.Api.Services;

public interface IDashboardService
{
    Task<DashboardDto> GetDashboardAsync(Guid userId);
}
