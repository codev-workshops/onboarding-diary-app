using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnboardingDiary.Api.Auth;
using OnboardingDiary.Api.DTOs.Reports;
using OnboardingDiary.Api.Services;

namespace OnboardingDiary.Api.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;
    private readonly ICurrentUserAccessor _currentUser;
    private readonly IEnumerable<IReportFormatter> _formatters;

    public ReportsController(IReportService reportService, ICurrentUserAccessor currentUser, IEnumerable<IReportFormatter> formatters)
    {
        _reportService = reportService;
        _currentUser = currentUser;
        _formatters = formatters;
    }

    [HttpGet]
    public async Task<IActionResult> Generate(
        [FromQuery] DateOnly date_from, [FromQuery] DateOnly date_to,
        [FromQuery] string type = "combined", [FromQuery] string format = "csv")
    {
        var request = new ReportRequest { DateFrom = date_from, DateTo = date_to, Type = type };
        var data = await _reportService.GetReportDataAsync(_currentUser.UserId, request);
        return FormatReport(data, format);
    }

    [HttpGet("users/{userId:guid}")]
    public async Task<IActionResult> GenerateForUser(
        Guid userId,
        [FromQuery] DateOnly date_from, [FromQuery] DateOnly date_to,
        [FromQuery] string type = "combined", [FromQuery] string format = "csv")
    {
        var request = new ReportRequest { DateFrom = date_from, DateTo = date_to, Type = type };
        var data = await _reportService.GetReportDataForUserAsync(userId, _currentUser.UserId, request);
        return FormatReport(data, format);
    }

    private IActionResult FormatReport(ReportData data, string format)
    {
        var formatter = _formatters.FirstOrDefault(f =>
            f.FileExtension.TrimStart('.').Equals(format, StringComparison.OrdinalIgnoreCase));

        if (formatter == null)
            return BadRequest($"Unsupported format: {format}. Supported: csv, pdf");

        var bytes = formatter.Generate(data);
        var fileName = $"onboarding-report-{data.DateFrom}-{data.DateTo}{formatter.FileExtension}";
        return File(bytes, formatter.ContentType, fileName);
    }
}
