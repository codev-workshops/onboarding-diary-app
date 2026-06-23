using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using OnboardingDiary.Api.DTOs.Auth;
using OnboardingDiary.IntegrationTests.Helpers;

namespace OnboardingDiary.IntegrationTests.Auth;

public class MeTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public MeTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetMe_WithValidToken_Returns200WithUser()
    {
        var email = $"me-{Guid.NewGuid()}@test.com";
        var auth = await AuthHelper.RegisterAsync(_client, email);
        AuthHelper.SetToken(_client, auth.Token);

        var response = await _client.GetAsync("/api/auth/me");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var user = await response.Content.ReadFromJsonAsync<UserDto>();
        user!.Email.Should().Be(email);
    }

    [Fact]
    public async Task GetMe_WithoutToken_Returns401()
    {
        _client.DefaultRequestHeaders.Authorization = null;

        var response = await _client.GetAsync("/api/auth/me");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
