using OnboardingDiary.Api.DTOs.Reports;

namespace OnboardingDiary.Api.Services;

public interface IReportService
{
    Task<ReportData> GetReportDataAsync(Guid userId, ReportRequest request);
    Task<ReportData> GetReportDataForUserAsync(Guid targetUserId, Guid requesterId, ReportRequest request);
}
