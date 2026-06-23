namespace OnboardingDiary.Api.DTOs.Search;

public class SearchResultDto
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Snippet { get; set; } = string.Empty;
    public DateOnly Date { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class SearchResponse
{
    public List<SearchResultDto> Results { get; set; } = new();
    public int Total { get; set; }
}
