namespace OnboardingDiary.Api.DTOs.Notes;

public class CreateNoteRequest
{
    public DateOnly Date { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public List<string> Tags { get; set; } = new();
}
