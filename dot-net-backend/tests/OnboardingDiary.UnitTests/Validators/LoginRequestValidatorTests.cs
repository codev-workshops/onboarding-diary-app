using FluentAssertions;
using OnboardingDiary.Api.DTOs.Auth;
using OnboardingDiary.Api.Validation;

namespace OnboardingDiary.UnitTests.Validators;

public class LoginRequestValidatorTests
{
    private readonly LoginRequestValidator _validator = new();

    [Fact]
    public void ValidRequest_Passes()
    {
        var result = _validator.Validate(new LoginRequest
        {
            Email = "user@example.com",
            Password = "password"
        });
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void EmptyEmail_Fails()
    {
        var result = _validator.Validate(new LoginRequest { Email = "", Password = "pass" });
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Email");
    }

    [Fact]
    public void EmptyPassword_Fails()
    {
        var result = _validator.Validate(new LoginRequest { Email = "user@test.com", Password = "" });
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Password");
    }
}
