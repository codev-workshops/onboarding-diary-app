using FluentAssertions;
using Moq;
using OnboardingDiary.Api.Auth;
using OnboardingDiary.Api.DTOs.Auth;
using OnboardingDiary.Api.Middleware;
using OnboardingDiary.Api.Models;
using OnboardingDiary.Api.Models.Enums;
using OnboardingDiary.Api.Services;
using OnboardingDiary.UnitTests.Helpers;

namespace OnboardingDiary.UnitTests.Services;

public class AuthServiceTests
{
    private readonly Mock<IJwtTokenGenerator> _jwtMock;

    public AuthServiceTests()
    {
        _jwtMock = new Mock<IJwtTokenGenerator>();
        _jwtMock.Setup(x => x.GenerateToken(It.IsAny<User>())).Returns("test-token");
    }

    private AuthService CreateService(Api.Data.AppDbContext db) => new(db, _jwtMock.Object);

    [Fact]
    public async Task Register_ValidInput_CreatesUserAndReturnsToken()
    {
        using var db = TestDbContext.Create();
        var sut = CreateService(db);
        var request = new RegisterRequest
        {
            Email = "newuser@test.com",
            Password = "P@ssw0rd!",
            FullName = "New User",
            Department = "Engineering"
        };

        var result = await sut.RegisterAsync(request);

        result.Token.Should().Be("test-token");
        result.User.Email.Should().Be("newuser@test.com");
        result.User.FullName.Should().Be("New User");
        result.User.Role.Should().Be(UserRole.Recruit);
        db.Users.Should().HaveCount(1);
    }

    [Fact]
    public async Task Register_HashesPassword()
    {
        using var db = TestDbContext.Create();
        var sut = CreateService(db);
        var request = new RegisterRequest
        {
            Email = "user@test.com",
            Password = "P@ssw0rd!",
            FullName = "User"
        };

        await sut.RegisterAsync(request);

        var user = db.Users.Single();
        user.PasswordHash.Should().NotBe("P@ssw0rd!");
        BCrypt.Net.BCrypt.Verify("P@ssw0rd!", user.PasswordHash).Should().BeTrue();
    }

    [Fact]
    public async Task Register_DuplicateEmail_ThrowsConflict()
    {
        using var db = TestDbContext.Create();
        var sut = CreateService(db);
        db.Users.Add(new User
        {
            Email = "existing@test.com",
            PasswordHash = "hash",
            FullName = "Existing"
        });
        await db.SaveChangesAsync();

        var request = new RegisterRequest
        {
            Email = "existing@test.com",
            Password = "P@ssw0rd!",
            FullName = "Duplicate"
        };

        await sut.Invoking(s => s.RegisterAsync(request))
            .Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task Login_ValidCredentials_ReturnsToken()
    {
        using var db = TestDbContext.Create();
        var sut = CreateService(db);
        db.Users.Add(new User
        {
            Email = "user@test.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("P@ssw0rd!"),
            FullName = "User"
        });
        await db.SaveChangesAsync();

        var result = await sut.LoginAsync(new LoginRequest
        {
            Email = "user@test.com",
            Password = "P@ssw0rd!"
        });

        result.Token.Should().Be("test-token");
        result.User.Email.Should().Be("user@test.com");
    }

    [Fact]
    public async Task Login_WrongPassword_ThrowsUnauthorized()
    {
        using var db = TestDbContext.Create();
        var sut = CreateService(db);
        db.Users.Add(new User
        {
            Email = "user@test.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("P@ssw0rd!"),
            FullName = "User"
        });
        await db.SaveChangesAsync();

        await sut.Invoking(s => s.LoginAsync(new LoginRequest
        {
            Email = "user@test.com",
            Password = "WrongPassword!"
        })).Should().ThrowAsync<UnauthorizedException>();
    }

    [Fact]
    public async Task Login_NonExistentEmail_ThrowsUnauthorized()
    {
        using var db = TestDbContext.Create();
        var sut = CreateService(db);

        await sut.Invoking(s => s.LoginAsync(new LoginRequest
        {
            Email = "nobody@test.com",
            Password = "P@ssw0rd!"
        })).Should().ThrowAsync<UnauthorizedException>();
    }

    [Fact]
    public async Task Login_InactiveUser_ThrowsForbidden()
    {
        using var db = TestDbContext.Create();
        var sut = CreateService(db);
        db.Users.Add(new User
        {
            Email = "inactive@test.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("P@ssw0rd!"),
            FullName = "Inactive",
            IsActive = false
        });
        await db.SaveChangesAsync();

        await sut.Invoking(s => s.LoginAsync(new LoginRequest
        {
            Email = "inactive@test.com",
            Password = "P@ssw0rd!"
        })).Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task GetCurrentUser_ExistingUser_ReturnsDto()
    {
        using var db = TestDbContext.Create();
        var sut = CreateService(db);
        var userId = Guid.NewGuid();
        db.Users.Add(new User
        {
            Id = userId,
            Email = "user@test.com",
            PasswordHash = "hash",
            FullName = "Test User"
        });
        await db.SaveChangesAsync();

        var result = await sut.GetCurrentUserAsync(userId);

        result.Email.Should().Be("user@test.com");
        result.FullName.Should().Be("Test User");
    }

    [Fact]
    public async Task GetCurrentUser_NonExistent_ThrowsNotFound()
    {
        using var db = TestDbContext.Create();
        var sut = CreateService(db);

        await sut.Invoking(s => s.GetCurrentUserAsync(Guid.NewGuid()))
            .Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task UpdateProfile_ValidInput_UpdatesAndReturnsDto()
    {
        using var db = TestDbContext.Create();
        var sut = CreateService(db);
        var userId = Guid.NewGuid();
        db.Users.Add(new User
        {
            Id = userId,
            Email = "user@test.com",
            PasswordHash = "hash",
            FullName = "Old Name"
        });
        await db.SaveChangesAsync();

        var result = await sut.UpdateProfileAsync(userId, new UpdateProfileRequest
        {
            FullName = "New Name",
            Department = "Engineering"
        });

        result.FullName.Should().Be("New Name");
        result.Department.Should().Be("Engineering");
    }
}
