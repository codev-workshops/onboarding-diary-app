using OnboardingDiary.Api.Models.Enums;

namespace OnboardingDiary.Api.Models;

public class IssueEntry : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public DateOnly Date { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public IssueSeverity Severity { get; set; }
    public IssueStatus Status { get; set; }
    public string? ResolutionNotes { get; set; }
}
