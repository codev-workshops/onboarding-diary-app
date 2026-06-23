using FluentAssertions;
using OnboardingDiary.Api.DTOs.Reports;
using OnboardingDiary.Api.DTOs.Tasks;
using OnboardingDiary.Api.Services;
using QuestPDF.Infrastructure;

namespace OnboardingDiary.UnitTests.Services;

public class PdfReportFormatterTests
{
    public PdfReportFormatterTests()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    private readonly PdfReportFormatter _formatter = new();

    [Fact]
    public void ContentType_IsPdf()
    {
        _formatter.ContentType.Should().Be("application/pdf");
    }

    [Fact]
    public void Generate_ProducesPdfBytes()
    {
        var data = new ReportData
        {
            UserName = "Test User", DateFrom = new DateOnly(2024, 1, 1), DateTo = new DateOnly(2024, 1, 31), Type = "tasks",
            Tasks = new() { new TaskDto { Title = "Setup", Date = new DateOnly(2024, 1, 15) } },
        };
        var bytes = _formatter.Generate(data);
        bytes.Should().NotBeEmpty();
        bytes[..4].Should().BeEquivalentTo(new byte[] { 0x25, 0x50, 0x44, 0x46 }); // %PDF
    }
}
