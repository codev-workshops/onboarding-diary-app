using OnboardingDiary.Api.Models.Enums;

namespace OnboardingDiary.Api.DTOs.Tasks;

public class UpdateTaskRequest
{
    public DateOnly? Date { get; set; }
    public string? Title { get; set; }
    public string? Description { get; set; }
    public TaskCategory? Category { get; set; }
    public Models.Enums.TaskStatus? Status { get; set; }
    public TaskPriority? Priority { get; set; }
}
