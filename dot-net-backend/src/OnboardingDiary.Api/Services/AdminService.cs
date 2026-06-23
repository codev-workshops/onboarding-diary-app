using Microsoft.EntityFrameworkCore;
using OnboardingDiary.Api.Data;
using OnboardingDiary.Api.DTOs;
using OnboardingDiary.Api.DTOs.Auth;
using OnboardingDiary.Api.Middleware;
using OnboardingDiary.Api.Models.Enums;

namespace OnboardingDiary.Api.Services;

public class AdminService : IAdminService
{
    private readonly AppDbContext _db;

    public AdminService(AppDbContext db) => _db = db;

    public async Task<PagedResult<UserDto>> ListUsersAsync(string? role, string? search, int page, int perPage)
    {
        var query = _db.Users.AsQueryable();

        if (!string.IsNullOrEmpty(role) && Enum.TryParse<UserRole>(role, true, out var r))
            query = query.Where(u => u.Role == r);

        if (!string.IsNullOrEmpty(search))
            query = query.Where(u => u.FullName.Contains(search) || u.Email.Contains(search));

        var total = await query.CountAsync();
        var items = await query.OrderBy(u => u.FullName)
            .Skip((page - 1) * perPage).Take(perPage)
            .Select(u => new UserDto
            {
                Id = u.Id, Email = u.Email, FullName = u.FullName, Role = u.Role,
                Department = u.Department, StartDate = u.StartDate, ManagerId = u.ManagerId,
                IsActive = u.IsActive, CreatedAt = u.CreatedAt,
            }).ToListAsync();

        return new PagedResult<UserDto> { Items = items, Total = total, Page = page, PerPage = perPage };
    }

    public async Task<UserDto> GetUserAsync(Guid userId)
    {
        var user = await _db.Users.FindAsync(userId) ?? throw new NotFoundException("User");
        return MapToDto(user);
    }

    public async Task<UserDto> UpdateRoleAsync(Guid userId, UserRole role)
    {
        var user = await _db.Users.FindAsync(userId) ?? throw new NotFoundException("User");
        user.Role = role;
        await _db.SaveChangesAsync();
        return MapToDto(user);
    }

    public async Task<UserDto> AssignManagerAsync(Guid userId, Guid managerId)
    {
        var user = await _db.Users.FindAsync(userId) ?? throw new NotFoundException("User");
        var manager = await _db.Users.FindAsync(managerId) ?? throw new NotFoundException("Manager");

        if (manager.Role != UserRole.Manager && manager.Role != UserRole.Admin)
            throw new ValidationException("Assigned user must have Manager or Admin role.");

        user.ManagerId = managerId;
        await _db.SaveChangesAsync();
        return MapToDto(user);
    }

    public async Task DeactivateUserAsync(Guid userId)
    {
        var user = await _db.Users.FindAsync(userId) ?? throw new NotFoundException("User");
        user.IsActive = false;
        await _db.SaveChangesAsync();
    }

    private static UserDto MapToDto(Models.User u) => new()
    {
        Id = u.Id, Email = u.Email, FullName = u.FullName, Role = u.Role,
        Department = u.Department, StartDate = u.StartDate, ManagerId = u.ManagerId,
        IsActive = u.IsActive, CreatedAt = u.CreatedAt,
    };
}
