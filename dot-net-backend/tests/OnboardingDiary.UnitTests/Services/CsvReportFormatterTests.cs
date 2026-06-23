using System.Text;
using FluentAssertions;
using OnboardingDiary.Api.DTOs.Feedback;
using OnboardingDiary.Api.DTOs.Issues;
using OnboardingDiary.Api.DTOs.Reports;
using OnboardingDiary.Api.DTOs.Tasks;
using OnboardingDiary.Api.Models.Enums;
using OnboardingDiary.Api.Services;

namespace OnboardingDiary.UnitTests.Services;

public class CsvReportFormatterTests
{
    private readonly CsvReportFormatter _formatter = new();

    [Fact]
    public void ContentType_IsCsv()
    {
        _formatter.ContentType.Should().Be("text/csv");
    }

    [Fact]
    public void Generate_WithTasks_ContainsTaskData()
    {
        var data = new ReportData
        {
            UserName = "Test", DateFrom = new DateOnly(2024, 1, 1), DateTo = new DateOnly(2024, 1, 31), Type = "tasks",
            Tasks = new() { new TaskDto { Title = "Setup IDE", Category = TaskCategory.Setup, Status = OnboardingDiary.Api.Models.Enums.TaskStatus.Completed, Priority = TaskPriority.High, Date = new DateOnly(2024, 1, 15) } },
        };
        var bytes = _formatter.Generate(data);
        var csv = Encoding.UTF8.GetString(bytes);
        csv.Should().Contain("Setup IDE");
        csv.Should().Contain("Tasks");
    }

    [Fact]
    public void Generate_Combined_ContainsAllSections()
    {
        var data = new ReportData
        {
            UserName = "Test", DateFrom = new DateOnly(2024, 1, 1), DateTo = new DateOnly(2024, 1, 31), Type = "combined",
            Tasks = new() { new TaskDto { Title = "T1", Date = new DateOnly(2024, 1, 15) } },
            Issues = new() { new IssueDto { Title = "I1", Date = new DateOnly(2024, 1, 15) } },
            Feedback = new() { new FeedbackDto { Subject = "F1", Date = new DateOnly(2024, 1, 15) } },
        };
        var bytes = _formatter.Generate(data);
        var csv = Encoding.UTF8.GetString(bytes);
        csv.Should().Contain("Tasks").And.Contain("Issues").And.Contain("Feedback");
    }
}
