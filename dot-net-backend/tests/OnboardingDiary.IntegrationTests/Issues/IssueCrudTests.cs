using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using OnboardingDiary.Api.DTOs.Issues;
using OnboardingDiary.IntegrationTests.Helpers;

namespace OnboardingDiary.IntegrationTests.Issues;

public class IssueCrudTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public IssueCrudTests(CustomWebApplicationFactory factory) => _client = factory.CreateClient();

    private async Task AuthenticateAsync()
    {
        var auth = await AuthHelper.RegisterAsync(_client, $"issue-{Guid.NewGuid()}@test.com");
        AuthHelper.SetToken(_client, auth.Token);
    }

    [Fact]
    public async Task CreateIssue_Returns201()
    {
        await AuthenticateAsync();
        var response = await _client.PostAsJsonAsync("/api/issues", new
        {
            date = "2024-02-01", title = "Broken build", description = "CI fails",
            severity = "High", status = "Open"
        });
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var issue = await response.Content.ReadAsAsync<IssueDto>();
        issue!.Title.Should().Be("Broken build");
    }

    [Fact]
    public async Task CrudCycle_WorksEndToEnd()
    {
        await AuthenticateAsync();
        var create = await _client.PostAsJsonAsync("/api/issues", new
        {
            date = "2024-02-01", title = "Test Issue", description = "Desc",
            severity = "Medium", status = "Open"
        });
        var created = await create.Content.ReadAsAsync<IssueDto>();

        var get = await _client.GetAsync($"/api/issues/{created!.Id}");
        get.StatusCode.Should().Be(HttpStatusCode.OK);

        var update = await _client.PutAsJsonAsync($"/api/issues/{created.Id}", new
        { status = "Resolved", resolutionNotes = "Fixed it" });
        update.StatusCode.Should().Be(HttpStatusCode.OK);

        var delete = await _client.DeleteAsync($"/api/issues/{created.Id}");
        delete.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }
}
