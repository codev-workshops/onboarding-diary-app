using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnboardingDiary.Api.Auth;
using OnboardingDiary.Api.DTOs.Notes;
using OnboardingDiary.Api.Services;

namespace OnboardingDiary.Api.Controllers;

[ApiController]
[Route("api/notes")]
[Authorize]
public class NotesController : ControllerBase
{
    private readonly INoteService _noteService;
    private readonly ICurrentUserAccessor _currentUser;

    public NotesController(INoteService noteService, ICurrentUserAccessor currentUser)
    {
        _noteService = noteService;
        _currentUser = currentUser;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateNoteRequest request)
    {
        var result = await _noteService.CreateAsync(_currentUser.UserId, request);
        return Created($"/api/notes/{result.Id}", result);
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? tag,
        [FromQuery] DateOnly? date_from, [FromQuery] DateOnly? date_to,
        [FromQuery] int page = 1, [FromQuery] int per_page = 10)
    {
        var result = await _noteService.ListAsync(_currentUser.UserId, tag, date_from, date_to, page, per_page);
        return Ok(result);
    }

    [HttpGet("{noteId:guid}")]
    public async Task<IActionResult> GetById(Guid noteId)
    {
        var result = await _noteService.GetByIdAsync(noteId, _currentUser.UserId);
        return Ok(result);
    }

    [HttpPut("{noteId:guid}")]
    public async Task<IActionResult> Update(Guid noteId, [FromBody] UpdateNoteRequest request)
    {
        var result = await _noteService.UpdateAsync(noteId, _currentUser.UserId, request);
        return Ok(result);
    }

    [HttpDelete("{noteId:guid}")]
    public async Task<IActionResult> Delete(Guid noteId)
    {
        await _noteService.DeleteAsync(noteId, _currentUser.UserId);
        return NoContent();
    }
}
