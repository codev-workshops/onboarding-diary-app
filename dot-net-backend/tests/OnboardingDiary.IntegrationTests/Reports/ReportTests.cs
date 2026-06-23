using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using OnboardingDiary.IntegrationTests.Helpers;

namespace OnboardingDiary.IntegrationTests.Reports;

public class ReportTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public ReportTests(CustomWebApplicationFactory factory) => _client = factory.CreateClient();

    [Fact]
    public async Task GenerateCsvReport_Returns200()
    {
        var auth = await AuthHelper.RegisterAsync(_client, $"rpt-{Guid.NewGuid()}@test.com");
        AuthHelper.SetToken(_client, auth.Token);

        await _client.PostAsJsonAsync("/api/tasks", new
        {
            date = "2024-01-15", title = "Task for report", description = "Desc",
            category = "Setup", status = "Completed", priority = "Low"
        });

        var response = await _client.GetAsync("/api/reports?date_from=2024-01-01&date_to=2024-12-31&type=combined&format=csv");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType!.MediaType.Should().Be("text/csv");
    }

    [Fact]
    public async Task GeneratePdfReport_Returns200()
    {
        var auth = await AuthHelper.RegisterAsync(_client, $"rpt-{Guid.NewGuid()}@test.com");
        AuthHelper.SetToken(_client, auth.Token);

        var response = await _client.GetAsync("/api/reports?date_from=2024-01-01&date_to=2024-12-31&format=pdf");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType!.MediaType.Should().Be("application/pdf");
    }

    [Fact]
    public async Task InvalidFormat_Returns400()
    {
        var auth = await AuthHelper.RegisterAsync(_client, $"rpt-{Guid.NewGuid()}@test.com");
        AuthHelper.SetToken(_client, auth.Token);

        var response = await _client.GetAsync("/api/reports?date_from=2024-01-01&date_to=2024-12-31&format=xlsx");
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
