using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnboardingDiary.Api.Auth;
using OnboardingDiary.Api.Services;

namespace OnboardingDiary.Api.Controllers;

[ApiController]
[Route("api/search")]
[Authorize]
public class SearchController : ControllerBase
{
    private readonly ISearchService _searchService;
    private readonly ICurrentUserAccessor _currentUser;

    public SearchController(ISearchService searchService, ICurrentUserAccessor currentUser)
    {
        _searchService = searchService;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<IActionResult> Search(
        [FromQuery] string q, [FromQuery] string? type,
        [FromQuery] int page = 1, [FromQuery] int per_page = 20)
    {
        if (string.IsNullOrWhiteSpace(q))
            return BadRequest("Search query is required.");

        var result = await _searchService.SearchAsync(_currentUser.UserId, q, type, page, per_page);
        return Ok(result);
    }
}
