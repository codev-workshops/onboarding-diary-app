using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnboardingDiary.Api.Auth;
using OnboardingDiary.Api.DTOs.Issues;
using OnboardingDiary.Api.Services;

namespace OnboardingDiary.Api.Controllers;

[ApiController]
[Route("api/issues")]
[Authorize]
public class IssuesController : ControllerBase
{
    private readonly IIssueService _issueService;
    private readonly ICurrentUserAccessor _currentUser;

    public IssuesController(IIssueService issueService, ICurrentUserAccessor currentUser)
    {
        _issueService = issueService;
        _currentUser = currentUser;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateIssueRequest request)
    {
        var result = await _issueService.CreateAsync(_currentUser.UserId, request);
        return Created($"/api/issues/{result.Id}", result);
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? status, [FromQuery] string? severity,
        [FromQuery] DateOnly? date_from, [FromQuery] DateOnly? date_to,
        [FromQuery] int page = 1, [FromQuery] int per_page = 10)
    {
        var result = await _issueService.ListAsync(_currentUser.UserId, status, severity, date_from, date_to, page, per_page);
        return Ok(result);
    }

    [HttpGet("{issueId:guid}")]
    public async Task<IActionResult> GetById(Guid issueId)
    {
        var result = await _issueService.GetByIdAsync(issueId, _currentUser.UserId);
        return Ok(result);
    }

    [HttpPut("{issueId:guid}")]
    public async Task<IActionResult> Update(Guid issueId, [FromBody] UpdateIssueRequest request)
    {
        var result = await _issueService.UpdateAsync(issueId, _currentUser.UserId, request);
        return Ok(result);
    }

    [HttpDelete("{issueId:guid}")]
    public async Task<IActionResult> Delete(Guid issueId)
    {
        await _issueService.DeleteAsync(issueId, _currentUser.UserId);
        return NoContent();
    }
}
