using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using OnboardingDiary.Api.DTOs.Feedback;
using OnboardingDiary.IntegrationTests.Helpers;

namespace OnboardingDiary.IntegrationTests.Feedback;

public class FeedbackCrudTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public FeedbackCrudTests(CustomWebApplicationFactory factory) => _client = factory.CreateClient();

    private async Task AuthenticateAsync()
    {
        var auth = await AuthHelper.RegisterAsync(_client, $"fb-{Guid.NewGuid()}@test.com");
        AuthHelper.SetToken(_client, auth.Token);
    }

    [Fact]
    public async Task CreateFeedback_Returns201()
    {
        await AuthenticateAsync();
        var response = await _client.PostAsJsonAsync("/api/feedback", new
        {
            date = "2024-02-01", subject = "Good docs", type = "Positive", details = "Well written"
        });
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var fb = await response.Content.ReadAsAsync<FeedbackDto>();
        fb!.Subject.Should().Be("Good docs");
    }

    [Fact]
    public async Task CrudCycle_WorksEndToEnd()
    {
        await AuthenticateAsync();
        var create = await _client.PostAsJsonAsync("/api/feedback", new
        {
            date = "2024-02-01", subject = "Suggestion", type = "Suggestion", details = "Add more examples"
        });
        var created = await create.Content.ReadAsAsync<FeedbackDto>();

        var get = await _client.GetAsync($"/api/feedback/{created!.Id}");
        get.StatusCode.Should().Be(HttpStatusCode.OK);

        var update = await _client.PutAsJsonAsync($"/api/feedback/{created.Id}", new { subject = "Updated" });
        update.StatusCode.Should().Be(HttpStatusCode.OK);

        var delete = await _client.DeleteAsync($"/api/feedback/{created.Id}");
        delete.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }
}
