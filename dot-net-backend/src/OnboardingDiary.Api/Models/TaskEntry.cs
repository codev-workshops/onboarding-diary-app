using OnboardingDiary.Api.Models.Enums;

namespace OnboardingDiary.Api.Models;

public class TaskEntry : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public DateOnly Date { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public TaskCategory Category { get; set; }
    public Enums.TaskStatus Status { get; set; }
    public TaskPriority Priority { get; set; }
}
