using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnboardingDiary.Api.Auth;
using OnboardingDiary.Api.DTOs.Auth;
using OnboardingDiary.Api.Services;

namespace OnboardingDiary.Api.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ICurrentUserAccessor _currentUser;

    public UsersController(IAuthService authService, ICurrentUserAccessor currentUser)
    {
        _authService = authService;
        _currentUser = currentUser;
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var result = await _authService.UpdateProfileAsync(_currentUser.UserId, request);
        return Ok(result);
    }
}
