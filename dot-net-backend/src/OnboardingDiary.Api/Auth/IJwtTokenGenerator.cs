using OnboardingDiary.Api.Models;

namespace OnboardingDiary.Api.Auth;

public interface IJwtTokenGenerator
{
    string GenerateToken(User user);
}
