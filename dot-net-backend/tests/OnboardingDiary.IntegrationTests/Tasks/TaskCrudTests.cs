using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using OnboardingDiary.Api.DTOs;
using OnboardingDiary.Api.DTOs.Tasks;
using OnboardingDiary.IntegrationTests.Helpers;

namespace OnboardingDiary.IntegrationTests.Tasks;

public class TaskCrudTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public TaskCrudTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    private async Task AuthenticateAsync()
    {
        var email = $"task-user-{Guid.NewGuid()}@test.com";
        var auth = await AuthHelper.RegisterAsync(_client, email);
        AuthHelper.SetToken(_client, auth.Token);
    }

    [Fact]
    public async Task CreateTask_Returns201()
    {
        await AuthenticateAsync();
        var response = await _client.PostAsJsonAsync("/api/tasks", new
        {
            date = "2024-01-15",
            title = "Setup IDE",
            description = "Install VS Code and extensions",
            category = "Setup",
            status = "InProgress",
            priority = "High"
        });

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var task = await response.Content.ReadAsAsync<TaskDto>();
        task!.Title.Should().Be("Setup IDE");
    }

    [Fact]
    public async Task CreateTask_Unauthenticated_Returns401()
    {
        _client.DefaultRequestHeaders.Authorization = null;
        var response = await _client.PostAsJsonAsync("/api/tasks", new
        {
            date = "2024-01-15",
            title = "Test",
            description = "Desc",
            category = "Setup",
            status = "NotStarted",
            priority = "Low"
        });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CreateTask_InvalidInput_Returns400()
    {
        await AuthenticateAsync();
        var response = await _client.PostAsJsonAsync("/api/tasks", new
        {
            date = "2024-01-15",
            title = "",
            description = "",
            category = "Setup",
            status = "NotStarted",
            priority = "Low"
        });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task ListTasks_ReturnsPagedResult()
    {
        await AuthenticateAsync();
        await _client.PostAsJsonAsync("/api/tasks", new
        {
            date = "2024-01-15",
            title = "Task 1",
            description = "Desc",
            category = "Setup",
            status = "NotStarted",
            priority = "Low"
        });

        var response = await _client.GetAsync("/api/tasks");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadAsAsync<PagedResult<TaskDto>>();
        result!.Items.Should().HaveCountGreaterThanOrEqualTo(1);
    }

    [Fact]
    public async Task GetTask_ReturnsTask()
    {
        await AuthenticateAsync();
        var createResponse = await _client.PostAsJsonAsync("/api/tasks", new
        {
            date = "2024-01-15",
            title = "Get Test",
            description = "Desc",
            category = "Training",
            status = "NotStarted",
            priority = "Medium"
        });
        var created = await createResponse.Content.ReadAsAsync<TaskDto>();

        var response = await _client.GetAsync($"/api/tasks/{created!.Id}");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var task = await response.Content.ReadAsAsync<TaskDto>();
        task!.Title.Should().Be("Get Test");
    }

    [Fact]
    public async Task UpdateTask_ReturnsUpdatedTask()
    {
        await AuthenticateAsync();
        var createResponse = await _client.PostAsJsonAsync("/api/tasks", new
        {
            date = "2024-01-15",
            title = "Original",
            description = "Desc",
            category = "Setup",
            status = "NotStarted",
            priority = "Low"
        });
        var created = await createResponse.Content.ReadAsAsync<TaskDto>();

        var response = await _client.PutAsJsonAsync($"/api/tasks/{created!.Id}", new
        {
            title = "Updated",
            status = "Completed"
        });
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var updated = await response.Content.ReadAsAsync<TaskDto>();
        updated!.Title.Should().Be("Updated");
    }

    [Fact]
    public async Task DeleteTask_Returns204()
    {
        await AuthenticateAsync();
        var createResponse = await _client.PostAsJsonAsync("/api/tasks", new
        {
            date = "2024-01-15",
            title = "To Delete",
            description = "Desc",
            category = "Setup",
            status = "NotStarted",
            priority = "Low"
        });
        var created = await createResponse.Content.ReadAsAsync<TaskDto>();

        var response = await _client.DeleteAsync($"/api/tasks/{created!.Id}");
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var getResponse = await _client.GetAsync($"/api/tasks/{created.Id}");
        getResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
