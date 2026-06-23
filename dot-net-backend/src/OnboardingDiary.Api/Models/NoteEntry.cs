namespace OnboardingDiary.Api.Models;

public class NoteEntry : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public DateOnly Date { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public List<NoteTag> Tags { get; set; } = new();
}

public class NoteTag
{
    public Guid Id { get; set; }
    public Guid NoteId { get; set; }
    public NoteEntry Note { get; set; } = null!;
    public string Tag { get; set; } = string.Empty;
}
