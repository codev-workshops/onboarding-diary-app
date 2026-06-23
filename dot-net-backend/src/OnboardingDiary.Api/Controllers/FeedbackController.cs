using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnboardingDiary.Api.Auth;
using OnboardingDiary.Api.DTOs.Feedback;
using OnboardingDiary.Api.Services;

namespace OnboardingDiary.Api.Controllers;

[ApiController]
[Route("api/feedback")]
[Authorize]
public class FeedbackController : ControllerBase
{
    private readonly IFeedbackService _feedbackService;
    private readonly ICurrentUserAccessor _currentUser;

    public FeedbackController(IFeedbackService feedbackService, ICurrentUserAccessor currentUser)
    {
        _feedbackService = feedbackService;
        _currentUser = currentUser;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateFeedbackRequest request)
    {
        var result = await _feedbackService.CreateAsync(_currentUser.UserId, request);
        return Created($"/api/feedback/{result.Id}", result);
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? type,
        [FromQuery] DateOnly? date_from, [FromQuery] DateOnly? date_to,
        [FromQuery] int page = 1, [FromQuery] int per_page = 10)
    {
        var result = await _feedbackService.ListAsync(_currentUser.UserId, type, date_from, date_to, page, per_page);
        return Ok(result);
    }

    [HttpGet("{feedbackId:guid}")]
    public async Task<IActionResult> GetById(Guid feedbackId)
    {
        var result = await _feedbackService.GetByIdAsync(feedbackId, _currentUser.UserId);
        return Ok(result);
    }

    [HttpPut("{feedbackId:guid}")]
    public async Task<IActionResult> Update(Guid feedbackId, [FromBody] UpdateFeedbackRequest request)
    {
        var result = await _feedbackService.UpdateAsync(feedbackId, _currentUser.UserId, request);
        return Ok(result);
    }

    [HttpDelete("{feedbackId:guid}")]
    public async Task<IActionResult> Delete(Guid feedbackId)
    {
        await _feedbackService.DeleteAsync(feedbackId, _currentUser.UserId);
        return NoContent();
    }
}
