using OnboardingDiary.Api.Models.Enums;

namespace OnboardingDiary.Api.DTOs.Feedback;

public class FeedbackDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public DateOnly Date { get; set; }
    public string Subject { get; set; } = string.Empty;
    public FeedbackType Type { get; set; }
    public string Details { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
