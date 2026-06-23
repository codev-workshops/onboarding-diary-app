using OnboardingDiary.Api.Models.Enums;

namespace OnboardingDiary.Api.DTOs.Feedback;

public class CreateFeedbackRequest
{
    public DateOnly Date { get; set; }
    public string Subject { get; set; } = string.Empty;
    public FeedbackType Type { get; set; }
    public string Details { get; set; } = string.Empty;
}
