using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using OnboardingDiary.Api.DTOs.Dashboard;
using OnboardingDiary.IntegrationTests.Helpers;

namespace OnboardingDiary.IntegrationTests.Dashboard;

public class DashboardTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public DashboardTests(CustomWebApplicationFactory factory) => _client = factory.CreateClient();

    [Fact]
    public async Task GetDashboard_Authenticated_Returns200()
    {
        var auth = await AuthHelper.RegisterAsync(_client, $"dash-{Guid.NewGuid()}@test.com");
        AuthHelper.SetToken(_client, auth.Token);

        await _client.PostAsJsonAsync("/api/tasks", new
        {
            date = "2024-01-15", title = "Task", description = "Desc",
            category = "Setup", status = "Completed", priority = "Low"
        });

        var response = await _client.GetAsync("/api/dashboard");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var dashboard = await response.Content.ReadAsAsync<DashboardDto>();
        dashboard!.TotalTasks.Should().BeGreaterThanOrEqualTo(1);
        dashboard.CompletedTasks.Should().BeGreaterThanOrEqualTo(1);
    }

    [Fact]
    public async Task GetDashboard_Unauthenticated_Returns401()
    {
        _client.DefaultRequestHeaders.Authorization = null;
        var response = await _client.GetAsync("/api/dashboard");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
