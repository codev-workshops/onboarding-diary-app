using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using OnboardingDiary.Api.DTOs.Search;
using OnboardingDiary.IntegrationTests.Helpers;

namespace OnboardingDiary.IntegrationTests.Search;

public class SearchTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public SearchTests(CustomWebApplicationFactory factory) => _client = factory.CreateClient();

    [Fact]
    public async Task Search_FindsCreatedTask()
    {
        var auth = await AuthHelper.RegisterAsync(_client, $"search-{Guid.NewGuid()}@test.com");
        AuthHelper.SetToken(_client, auth.Token);

        await _client.PostAsJsonAsync("/api/tasks", new
        {
            date = "2024-01-15", title = "UniqueSearchTarget123", description = "Desc",
            category = "Setup", status = "NotStarted", priority = "Low"
        });

        var response = await _client.GetAsync("/api/search?q=UniqueSearchTarget123");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadAsAsync<SearchResponse>();
        result!.Total.Should().BeGreaterThanOrEqualTo(1);
    }

    [Fact]
    public async Task Search_EmptyQuery_Returns400()
    {
        var auth = await AuthHelper.RegisterAsync(_client, $"search-{Guid.NewGuid()}@test.com");
        AuthHelper.SetToken(_client, auth.Token);

        var response = await _client.GetAsync("/api/search?q=");
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
