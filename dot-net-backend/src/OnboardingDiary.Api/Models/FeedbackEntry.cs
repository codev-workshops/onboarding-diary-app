using OnboardingDiary.Api.Models.Enums;

namespace OnboardingDiary.Api.Models;

public class FeedbackEntry : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public DateOnly Date { get; set; }
    public string Subject { get; set; } = string.Empty;
    public FeedbackType Type { get; set; }
    public string Details { get; set; } = string.Empty;
}
