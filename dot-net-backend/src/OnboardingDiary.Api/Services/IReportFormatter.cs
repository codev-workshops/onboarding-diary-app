using OnboardingDiary.Api.DTOs.Reports;

namespace OnboardingDiary.Api.Services;

public interface IReportFormatter
{
    string ContentType { get; }
    string FileExtension { get; }
    byte[] Generate(ReportData data);
}
