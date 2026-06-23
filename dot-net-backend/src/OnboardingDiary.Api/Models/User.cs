using OnboardingDiary.Api.Models.Enums;

namespace OnboardingDiary.Api.Models;

public class User : BaseEntity
{
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Recruit;
    public string? Department { get; set; }
    public DateOnly? StartDate { get; set; }
    public Guid? ManagerId { get; set; }
    public User? Manager { get; set; }
    public bool IsActive { get; set; } = true;
}
