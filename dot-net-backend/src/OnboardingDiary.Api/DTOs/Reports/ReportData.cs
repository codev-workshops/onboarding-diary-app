using OnboardingDiary.Api.DTOs.Feedback;
using OnboardingDiary.Api.DTOs.Issues;
using OnboardingDiary.Api.DTOs.Tasks;

namespace OnboardingDiary.Api.DTOs.Reports;

public class ReportData
{
    public string UserName { get; set; } = string.Empty;
    public DateOnly DateFrom { get; set; }
    public DateOnly DateTo { get; set; }
    public string Type { get; set; } = string.Empty;
    public List<TaskDto> Tasks { get; set; } = new();
    public List<IssueDto> Issues { get; set; } = new();
    public List<FeedbackDto> Feedback { get; set; } = new();
}
