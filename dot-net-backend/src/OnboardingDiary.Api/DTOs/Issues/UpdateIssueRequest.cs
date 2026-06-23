using OnboardingDiary.Api.Models.Enums;

namespace OnboardingDiary.Api.DTOs.Issues;

public class UpdateIssueRequest
{
    public DateOnly? Date { get; set; }
    public string? Title { get; set; }
    public string? Description { get; set; }
    public IssueSeverity? Severity { get; set; }
    public IssueStatus? Status { get; set; }
    public string? ResolutionNotes { get; set; }
}
