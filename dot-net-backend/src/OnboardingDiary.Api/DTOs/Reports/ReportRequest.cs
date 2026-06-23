namespace OnboardingDiary.Api.DTOs.Reports;

public class ReportRequest
{
    public DateOnly DateFrom { get; set; }
    public DateOnly DateTo { get; set; }
    public string Type { get; set; } = "combined";
}
