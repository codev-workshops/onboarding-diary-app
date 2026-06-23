using FluentAssertions;
using OnboardingDiary.Api.DTOs.Feedback;
using OnboardingDiary.Api.Middleware;
using OnboardingDiary.Api.Models;
using OnboardingDiary.Api.Models.Enums;
using OnboardingDiary.Api.Services;
using OnboardingDiary.UnitTests.Helpers;

namespace OnboardingDiary.UnitTests.Services;

public class FeedbackServiceTests
{
    private static readonly Guid UserId = Guid.NewGuid();

    [Fact]
    public async Task Create_ReturnsDto()
    {
        using var db = TestDbContext.Create();
        var sut = new FeedbackService(db);
        var result = await sut.CreateAsync(UserId, new CreateFeedbackRequest
        {
            Date = DateOnly.FromDateTime(DateTime.Today),
            Subject = "Great mentoring",
            Type = FeedbackType.Positive,
            Details = "Very helpful",
        });
        result.Subject.Should().Be("Great mentoring");
        result.Type.Should().Be(FeedbackType.Positive);
    }

    [Fact]
    public async Task GetById_WrongUser_ThrowsForbidden()
    {
        using var db = TestDbContext.Create();
        var sut = new FeedbackService(db);
        var entry = new FeedbackEntry { Id = Guid.NewGuid(), UserId = Guid.NewGuid(), Date = DateOnly.FromDateTime(DateTime.Today), Subject = "S", Details = "D" };
        db.FeedbackEntries.Add(entry);
        await db.SaveChangesAsync();

        await sut.Invoking(s => s.GetByIdAsync(entry.Id, UserId)).Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task Update_ChangesFields()
    {
        using var db = TestDbContext.Create();
        var sut = new FeedbackService(db);
        var entry = new FeedbackEntry { Id = Guid.NewGuid(), UserId = UserId, Date = DateOnly.FromDateTime(DateTime.Today), Subject = "Old", Details = "D", Type = FeedbackType.Positive };
        db.FeedbackEntries.Add(entry);
        await db.SaveChangesAsync();

        var result = await sut.UpdateAsync(entry.Id, UserId, new UpdateFeedbackRequest { Subject = "Updated", Type = FeedbackType.Concern });
        result.Subject.Should().Be("Updated");
        result.Type.Should().Be(FeedbackType.Concern);
    }

    [Fact]
    public async Task Delete_RemovesEntry()
    {
        using var db = TestDbContext.Create();
        var sut = new FeedbackService(db);
        var entry = new FeedbackEntry { Id = Guid.NewGuid(), UserId = UserId, Date = DateOnly.FromDateTime(DateTime.Today), Subject = "S", Details = "D" };
        db.FeedbackEntries.Add(entry);
        await db.SaveChangesAsync();

        await sut.DeleteAsync(entry.Id, UserId);
        db.FeedbackEntries.Should().BeEmpty();
    }
}
