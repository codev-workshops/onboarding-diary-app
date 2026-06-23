using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnboardingDiary.Api.Auth;
using OnboardingDiary.Api.DTOs.Tasks;
using OnboardingDiary.Api.Services;

namespace OnboardingDiary.Api.Controllers;

[ApiController]
[Route("api/tasks")]
[Authorize]
public class TasksController : ControllerBase
{
    private readonly ITaskService _taskService;
    private readonly ICurrentUserAccessor _currentUser;

    public TasksController(ITaskService taskService, ICurrentUserAccessor currentUser)
    {
        _taskService = taskService;
        _currentUser = currentUser;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTaskRequest request)
    {
        var result = await _taskService.CreateAsync(_currentUser.UserId, request);
        return Created($"/api/tasks/{result.Id}", result);
    }

    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] DateOnly? date_from,
        [FromQuery] DateOnly? date_to,
        [FromQuery] string? category,
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int per_page = 10)
    {
        var result = await _taskService.ListAsync(
            _currentUser.UserId, date_from, date_to, category, status, page, per_page);
        return Ok(result);
    }

    [HttpGet("{taskId:guid}")]
    public async Task<IActionResult> GetById(Guid taskId)
    {
        var result = await _taskService.GetByIdAsync(taskId, _currentUser.UserId);
        return Ok(result);
    }

    [HttpPut("{taskId:guid}")]
    public async Task<IActionResult> Update(Guid taskId, [FromBody] UpdateTaskRequest request)
    {
        var result = await _taskService.UpdateAsync(taskId, _currentUser.UserId, request);
        return Ok(result);
    }

    [HttpDelete("{taskId:guid}")]
    public async Task<IActionResult> Delete(Guid taskId)
    {
        await _taskService.DeleteAsync(taskId, _currentUser.UserId);
        return NoContent();
    }
}

[ApiController]
[Route("api/users/{userId:guid}/tasks")]
[Authorize]
public class UserTasksController : ControllerBase
{
    private readonly ITaskService _taskService;
    private readonly ICurrentUserAccessor _currentUser;

    public UserTasksController(ITaskService taskService, ICurrentUserAccessor currentUser)
    {
        _taskService = taskService;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<IActionResult> ListForUser(
        Guid userId,
        [FromQuery] DateOnly? date_from,
        [FromQuery] DateOnly? date_to,
        [FromQuery] string? category,
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int per_page = 10)
    {
        var result = await _taskService.ListForUserAsync(
            userId, _currentUser.UserId, date_from, date_to, category, status, page, per_page);
        return Ok(result);
    }
}
