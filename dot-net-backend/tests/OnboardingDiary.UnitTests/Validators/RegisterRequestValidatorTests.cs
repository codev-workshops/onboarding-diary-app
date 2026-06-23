using FluentAssertions;
using OnboardingDiary.Api.DTOs.Auth;
using OnboardingDiary.Api.Validation;

namespace OnboardingDiary.UnitTests.Validators;

public class RegisterRequestValidatorTests
{
    private readonly RegisterRequestValidator _validator = new();

    private static RegisterRequest ValidRequest() => new()
    {
        Email = "user@example.com",
        Password = "P@ssw0rd!",
        FullName = "Test User"
    };

    [Fact]
    public void ValidRequest_Passes()
    {
        var result = _validator.Validate(ValidRequest());
        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData("")]
    [InlineData("not-an-email")]
    [InlineData("missing@")]
    public void Email_Invalid_Fails(string email)
    {
        var request = ValidRequest();
        request.Email = email;
        var result = _validator.Validate(request);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Email");
    }

    [Theory]
    [InlineData("")]
    [InlineData("short")]
    [InlineData("nouppercase1!")]
    [InlineData("NOLOWERCASE1!")]
    [InlineData("NoDigit!!aa")]
    [InlineData("NoSpecial1aa")]
    public void Password_Invalid_Fails(string password)
    {
        var request = ValidRequest();
        request.Password = password;
        var result = _validator.Validate(request);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Password");
    }

    [Theory]
    [InlineData("")]
    [InlineData("A")]
    public void FullName_TooShort_Fails(string name)
    {
        var request = ValidRequest();
        request.FullName = name;
        var result = _validator.Validate(request);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "FullName");
    }

    [Fact]
    public void Department_TooLong_Fails()
    {
        var request = ValidRequest();
        request.Department = new string('a', 101);
        var result = _validator.Validate(request);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Department");
    }
}
