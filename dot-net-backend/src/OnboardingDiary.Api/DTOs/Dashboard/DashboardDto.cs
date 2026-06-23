namespace OnboardingDiary.Api.DTOs.Dashboard;

public class DashboardDto
{
    public int TotalTasks { get; set; }
    public int CompletedTasks { get; set; }
    public int InProgressTasks { get; set; }
    public int TotalIssues { get; set; }
    public int OpenIssues { get; set; }
    public int ResolvedIssues { get; set; }
    public int TotalFeedback { get; set; }
    public int TotalNotes { get; set; }
    public double TaskCompletionRate { get; set; }
    public List<RecentEntryDto> RecentActivity { get; set; } = new();
}

public class RecentEntryDto
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public DateOnly Date { get; set; }
    public DateTime CreatedAt { get; set; }
}
