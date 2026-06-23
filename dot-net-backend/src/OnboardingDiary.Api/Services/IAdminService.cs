using OnboardingDiary.Api.DTOs;
using OnboardingDiary.Api.DTOs.Auth;
using OnboardingDiary.Api.Models.Enums;

namespace OnboardingDiary.Api.Services;

public interface IAdminService
{
    Task<PagedResult<UserDto>> ListUsersAsync(string? role, string? search, int page, int perPage);
    Task<UserDto> GetUserAsync(Guid userId);
    Task<UserDto> UpdateRoleAsync(Guid userId, UserRole role);
    Task<UserDto> AssignManagerAsync(Guid userId, Guid managerId);
    Task DeactivateUserAsync(Guid userId);
}
