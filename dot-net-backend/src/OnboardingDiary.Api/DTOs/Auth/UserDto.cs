using OnboardingDiary.Api.Models.Enums;

namespace OnboardingDiary.Api.DTOs.Auth;

public class UserDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public string? Department { get; set; }
    public DateOnly? StartDate { get; set; }
    public Guid? ManagerId { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}
