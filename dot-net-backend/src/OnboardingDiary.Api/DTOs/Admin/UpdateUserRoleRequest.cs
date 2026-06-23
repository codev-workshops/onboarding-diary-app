using OnboardingDiary.Api.Models.Enums;

namespace OnboardingDiary.Api.DTOs.Admin;

public class UpdateUserRoleRequest
{
    public UserRole Role { get; set; }
}
