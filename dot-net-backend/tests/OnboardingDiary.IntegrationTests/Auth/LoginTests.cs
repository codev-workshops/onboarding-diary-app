using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using OnboardingDiary.Api.DTOs.Auth;
using OnboardingDiary.IntegrationTests.Helpers;

namespace OnboardingDiary.IntegrationTests.Auth;

public class LoginTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public LoginTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Login_ValidCredentials_Returns200WithToken()
    {
        var email = $"login-{Guid.NewGuid()}@test.com";
        await AuthHelper.RegisterAsync(_client, email);

        var response = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            email,
            password = "P@ssw0rd!"
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadAsAsync<AuthResponse>();
        result!.Token.Should().NotBeNullOrEmpty();
        result.User.Email.Should().Be(email);
    }

    [Fact]
    public async Task Login_WrongPassword_Returns401()
    {
        var email = $"login-{Guid.NewGuid()}@test.com";
        await AuthHelper.RegisterAsync(_client, email);

        var response = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            email,
            password = "WrongPassword!"
        });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Login_NonExistentEmail_Returns401()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            email = "nobody@test.com",
            password = "P@ssw0rd!"
        });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
