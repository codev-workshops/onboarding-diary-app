using OnboardingDiary.Api.Models.Enums;

namespace OnboardingDiary.Api.DTOs.Issues;

public class CreateIssueRequest
{
    public DateOnly Date { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public IssueSeverity Severity { get; set; }
    public IssueStatus Status { get; set; }
    public string? ResolutionNotes { get; set; }
}
