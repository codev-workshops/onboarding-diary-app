using OnboardingDiary.Api.Models.Enums;

namespace OnboardingDiary.Api.DTOs.Feedback;

public class UpdateFeedbackRequest
{
    public DateOnly? Date { get; set; }
    public string? Subject { get; set; }
    public FeedbackType? Type { get; set; }
    public string? Details { get; set; }
}
