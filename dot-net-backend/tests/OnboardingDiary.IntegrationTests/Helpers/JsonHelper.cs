using System.Text.Json;
using System.Text.Json.Serialization;

namespace OnboardingDiary.IntegrationTests.Helpers;

public static class JsonHelper
{
    public static readonly JsonSerializerOptions Options = new()
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter() }
    };

    public static async Task<T?> ReadAsAsync<T>(this HttpContent content)
    {
        var stream = await content.ReadAsStreamAsync();
        return await JsonSerializer.DeserializeAsync<T>(stream, Options);
    }
}
