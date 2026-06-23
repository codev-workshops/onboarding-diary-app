using FluentAssertions;
using OnboardingDiary.Api.Middleware;
using OnboardingDiary.Api.Models;
using OnboardingDiary.Api.Models.Enums;
using OnboardingDiary.Api.Services;
using OnboardingDiary.UnitTests.Helpers;

namespace OnboardingDiary.UnitTests.Services;

public class AdminServiceTests
{
    [Fact]
    public async Task ListUsers_ReturnsAll()
    {
        using var db = TestDbContext.Create();
        db.Users.AddRange(
            new User { FullName = "Alice", Email = "a@t.com", PasswordHash = "h" },
            new User { FullName = "Bob", Email = "b@t.com", PasswordHash = "h" }
        );
        await db.SaveChangesAsync();

        var sut = new AdminService(db);
        var result = await sut.ListUsersAsync(null, null, 1, 10);
        result.Total.Should().Be(2);
    }

    [Fact]
    public async Task ListUsers_FiltersByRole()
    {
        using var db = TestDbContext.Create();
        db.Users.AddRange(
            new User { FullName = "Recruit", Email = "r@t.com", PasswordHash = "h", Role = UserRole.Recruit },
            new User { FullName = "Admin", Email = "a@t.com", PasswordHash = "h", Role = UserRole.Admin }
        );
        await db.SaveChangesAsync();

        var sut = new AdminService(db);
        var result = await sut.ListUsersAsync("Admin", null, 1, 10);
        result.Total.Should().Be(1);
        result.Items[0].FullName.Should().Be("Admin");
    }

    [Fact]
    public async Task UpdateRole_ChangesRole()
    {
        using var db = TestDbContext.Create();
        var user = new User { FullName = "Test", Email = "t@t.com", PasswordHash = "h", Role = UserRole.Recruit };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var sut = new AdminService(db);
        var result = await sut.UpdateRoleAsync(user.Id, UserRole.Manager);
        result.Role.Should().Be(UserRole.Manager);
    }

    [Fact]
    public async Task AssignManager_SetsManagerId()
    {
        using var db = TestDbContext.Create();
        var manager = new User { FullName = "Manager", Email = "m@t.com", PasswordHash = "h", Role = UserRole.Manager };
        var recruit = new User { FullName = "Recruit", Email = "r@t.com", PasswordHash = "h", Role = UserRole.Recruit };
        db.Users.AddRange(manager, recruit);
        await db.SaveChangesAsync();

        var sut = new AdminService(db);
        var result = await sut.AssignManagerAsync(recruit.Id, manager.Id);
        result.ManagerId.Should().Be(manager.Id);
    }

    [Fact]
    public async Task AssignManager_NonManagerRole_ThrowsValidation()
    {
        using var db = TestDbContext.Create();
        var nonManager = new User { FullName = "Recruit2", Email = "r2@t.com", PasswordHash = "h", Role = UserRole.Recruit };
        var recruit = new User { FullName = "Recruit", Email = "r@t.com", PasswordHash = "h", Role = UserRole.Recruit };
        db.Users.AddRange(nonManager, recruit);
        await db.SaveChangesAsync();

        var sut = new AdminService(db);
        await sut.Invoking(s => s.AssignManagerAsync(recruit.Id, nonManager.Id))
            .Should().ThrowAsync<ValidationException>();
    }

    [Fact]
    public async Task DeactivateUser_SetsIsActiveFalse()
    {
        using var db = TestDbContext.Create();
        var user = new User { FullName = "Test", Email = "t@t.com", PasswordHash = "h" };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var sut = new AdminService(db);
        await sut.DeactivateUserAsync(user.Id);
        var updated = await db.Users.FindAsync(user.Id);
        updated!.IsActive.Should().BeFalse();
    }
}
