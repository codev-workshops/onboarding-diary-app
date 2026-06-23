using OnboardingDiary.Api.Models.Enums;

namespace OnboardingDiary.Api.Auth;

public interface ICurrentUserAccessor
{
    Guid UserId { get; }
    UserRole Role { get; }
}
