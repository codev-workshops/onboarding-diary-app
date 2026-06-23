using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using FluentAssertions;
using Microsoft.Extensions.Options;
using OnboardingDiary.Api.Auth;
using OnboardingDiary.Api.Models;
using OnboardingDiary.Api.Models.Enums;

namespace OnboardingDiary.UnitTests.Auth;

public class JwtTokenGeneratorTests
{
    private readonly JwtTokenGenerator _sut;
    private readonly JwtSettings _settings;

    public JwtTokenGeneratorTests()
    {
        _settings = new JwtSettings
        {
            Key = "test-secret-key-must-be-at-least-32-characters-long!",
            Issuer = "TestIssuer",
            Audience = "TestAudience",
            ExpiryMinutes = 30
        };
        _sut = new JwtTokenGenerator(Options.Create(_settings));
    }

    [Fact]
    public void GenerateToken_ReturnsValidJwtString()
    {
        var user = CreateTestUser();

        var token = _sut.GenerateToken(user);

        token.Should().NotBeNullOrEmpty();
        var handler = new JwtSecurityTokenHandler();
        handler.CanReadToken(token).Should().BeTrue();
    }

    [Fact]
    public void GenerateToken_ContainsCorrectClaims()
    {
        var user = CreateTestUser();

        var token = _sut.GenerateToken(user);

        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(token);

        jwt.Claims.Should().Contain(c => c.Type == JwtRegisteredClaimNames.Sub && c.Value == user.Id.ToString());
        jwt.Claims.Should().Contain(c => c.Type == JwtRegisteredClaimNames.Email && c.Value == user.Email);
        jwt.Claims.Should().Contain(c => c.Type == ClaimTypes.Role && c.Value == "Recruit");
        jwt.Claims.Should().Contain(c => c.Type == ClaimTypes.Name && c.Value == user.FullName);
    }

    [Fact]
    public void GenerateToken_HasCorrectIssuerAndAudience()
    {
        var user = CreateTestUser();

        var token = _sut.GenerateToken(user);

        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(token);

        jwt.Issuer.Should().Be(_settings.Issuer);
        jwt.Audiences.Should().Contain(_settings.Audience);
    }

    [Fact]
    public void GenerateToken_ExpiresAtConfiguredTime()
    {
        var user = CreateTestUser();
        var beforeGeneration = DateTime.UtcNow;

        var token = _sut.GenerateToken(user);

        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(token);

        jwt.ValidTo.Should().BeCloseTo(
            beforeGeneration.AddMinutes(_settings.ExpiryMinutes),
            precision: TimeSpan.FromSeconds(5));
    }

    private static User CreateTestUser() => new()
    {
        Id = Guid.NewGuid(),
        Email = "test@example.com",
        FullName = "Test User",
        Role = UserRole.Recruit,
        PasswordHash = "hashed"
    };
}
