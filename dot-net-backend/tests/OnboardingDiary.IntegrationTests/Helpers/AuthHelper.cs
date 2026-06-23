using System.Net.Http.Headers;
using System.Net.Http.Json;
using OnboardingDiary.Api.DTOs.Auth;

namespace OnboardingDiary.IntegrationTests.Helpers;

public static class AuthHelper
{
    public static async Task<AuthResponse> RegisterAsync(HttpClient client, string email = "test@example.com", string password = "P@ssw0rd!")
    {
        var response = await client.PostAsJsonAsync("/api/auth/register", new
        {
            email,
            password,
            fullName = "Test User",
            department = "Engineering"
        });
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadAsAsync<AuthResponse>())!;
    }

    public static async Task<AuthResponse> LoginAsync(HttpClient client, string email, string password = "P@ssw0rd!")
    {
        var response = await client.PostAsJsonAsync("/api/auth/login", new { email, password });
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadAsAsync<AuthResponse>())!;
    }

    public static void SetToken(HttpClient client, string token)
    {
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
    }
}
