using OnboardingDiary.Api.Models.Enums;

namespace OnboardingDiary.Api.DTOs.Tasks;

public class TaskDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public DateOnly Date { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public TaskCategory Category { get; set; }
    public Models.Enums.TaskStatus Status { get; set; }
    public TaskPriority Priority { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
