using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using OnboardingDiary.Api.DTOs.Notes;
using OnboardingDiary.IntegrationTests.Helpers;

namespace OnboardingDiary.IntegrationTests.Notes;

public class NoteCrudTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public NoteCrudTests(CustomWebApplicationFactory factory) => _client = factory.CreateClient();

    private async Task AuthenticateAsync()
    {
        var auth = await AuthHelper.RegisterAsync(_client, $"note-{Guid.NewGuid()}@test.com");
        AuthHelper.SetToken(_client, auth.Token);
    }

    [Fact]
    public async Task CreateNote_WithTags_Returns201()
    {
        await AuthenticateAsync();
        var response = await _client.PostAsJsonAsync("/api/notes", new
        {
            date = "2024-02-01", title = "Git tips", content = "Use rebase",
            tags = new[] { "git", "tips" }
        });
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var note = await response.Content.ReadAsAsync<NoteDto>();
        note!.Title.Should().Be("Git tips");
        note.Tags.Should().Contain("git");
    }

    [Fact]
    public async Task CrudCycle_WorksEndToEnd()
    {
        await AuthenticateAsync();
        var create = await _client.PostAsJsonAsync("/api/notes", new
        {
            date = "2024-02-01", title = "Test Note", content = "Some content",
            tags = new[] { "test" }
        });
        var created = await create.Content.ReadAsAsync<NoteDto>();

        var get = await _client.GetAsync($"/api/notes/{created!.Id}");
        get.StatusCode.Should().Be(HttpStatusCode.OK);

        var update = await _client.PutAsJsonAsync($"/api/notes/{created.Id}", new
        {
            title = "Updated",
            tags = new[] { "updated-tag" }
        });
        update.StatusCode.Should().Be(HttpStatusCode.OK);

        var delete = await _client.DeleteAsync($"/api/notes/{created.Id}");
        delete.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }
}
