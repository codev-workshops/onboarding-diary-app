using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnboardingDiary.Api.DTOs.Admin;
using OnboardingDiary.Api.Services;

namespace OnboardingDiary.Api.Controllers;

[ApiController]
[Route("api/admin/users")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;

    public AdminController(IAdminService adminService) => _adminService = adminService;

    [HttpGet]
    public async Task<IActionResult> ListUsers([FromQuery] string? role, [FromQuery] string? search,
        [FromQuery] int page = 1, [FromQuery] int per_page = 10)
    {
        var result = await _adminService.ListUsersAsync(role, search, page, per_page);
        return Ok(result);
    }

    [HttpGet("{userId:guid}")]
    public async Task<IActionResult> GetUser(Guid userId)
    {
        var result = await _adminService.GetUserAsync(userId);
        return Ok(result);
    }

    [HttpPut("{userId:guid}/role")]
    public async Task<IActionResult> UpdateRole(Guid userId, [FromBody] UpdateUserRoleRequest request)
    {
        var result = await _adminService.UpdateRoleAsync(userId, request.Role);
        return Ok(result);
    }

    [HttpPut("{userId:guid}/manager")]
    public async Task<IActionResult> AssignManager(Guid userId, [FromBody] AssignManagerRequest request)
    {
        var result = await _adminService.AssignManagerAsync(userId, request.ManagerId);
        return Ok(result);
    }

    [HttpDelete("{userId:guid}")]
    public async Task<IActionResult> DeactivateUser(Guid userId)
    {
        await _adminService.DeactivateUserAsync(userId);
        return NoContent();
    }
}
