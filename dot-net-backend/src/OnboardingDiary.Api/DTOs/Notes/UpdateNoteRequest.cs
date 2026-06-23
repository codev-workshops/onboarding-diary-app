namespace OnboardingDiary.Api.DTOs.Notes;

public class UpdateNoteRequest
{
    public DateOnly? Date { get; set; }
    public string? Title { get; set; }
    public string? Content { get; set; }
    public List<string>? Tags { get; set; }
}
