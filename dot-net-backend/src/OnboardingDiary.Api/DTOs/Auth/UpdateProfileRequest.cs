namespace OnboardingDiary.Api.DTOs.Auth;

public class UpdateProfileRequest
{
    public string FullName { get; set; } = string.Empty;
    public string? Department { get; set; }
    public DateOnly? StartDate { get; set; }
}
