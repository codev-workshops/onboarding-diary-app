using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using OnboardingDiary.Api.DTOs.Auth;
using OnboardingDiary.IntegrationTests.Helpers;

namespace OnboardingDiary.IntegrationTests.Auth;

public class RegisterTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public RegisterTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Register_ValidInput_Returns201WithToken()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/register", new
        {
            email = $"user-{Guid.NewGuid()}@test.com",
            password = "P@ssw0rd!",
            fullName = "Test User",
            department = "Engineering"
        });

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var result = await response.Content.ReadFromJsonAsync<AuthResponse>();
        result!.Token.Should().NotBeNullOrEmpty();
        result.User.Email.Should().Contain("@test.com");
        result.User.FullName.Should().Be("Test User");
    }

    [Fact]
    public async Task Register_DuplicateEmail_Returns409()
    {
        var email = $"dup-{Guid.NewGuid()}@test.com";
        await AuthHelper.RegisterAsync(_client, email);

        var response = await _client.PostAsJsonAsync("/api/auth/register", new
        {
            email,
            password = "P@ssw0rd!",
            fullName = "Another User"
        });

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Register_InvalidEmail_Returns400()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/register", new
        {
            email = "not-an-email",
            password = "P@ssw0rd!",
            fullName = "Test User"
        });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Register_WeakPassword_Returns400()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/register", new
        {
            email = $"user-{Guid.NewGuid()}@test.com",
            password = "weak",
            fullName = "Test User"
        });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
