using FluentAssertions;
using OnboardingDiary.Api.DTOs.Notes;
using OnboardingDiary.Api.Middleware;
using OnboardingDiary.Api.Models;
using OnboardingDiary.Api.Services;
using OnboardingDiary.UnitTests.Helpers;

namespace OnboardingDiary.UnitTests.Services;

public class NoteServiceTests
{
    private static readonly Guid UserId = Guid.NewGuid();

    [Fact]
    public async Task Create_WithTags_ReturnsDto()
    {
        using var db = TestDbContext.Create();
        var sut = new NoteService(db);
        var result = await sut.CreateAsync(UserId, new CreateNoteRequest
        {
            Date = DateOnly.FromDateTime(DateTime.Today),
            Title = "Git tips",
            Content = "Use rebase for clean history",
            Tags = new List<string> { "git", "tips" },
        });
        result.Title.Should().Be("Git tips");
        result.Tags.Should().BeEquivalentTo(new[] { "git", "tips" });
    }

    [Fact]
    public async Task GetById_WrongUser_ThrowsForbidden()
    {
        using var db = TestDbContext.Create();
        var sut = new NoteService(db);
        var entry = new NoteEntry { Id = Guid.NewGuid(), UserId = Guid.NewGuid(), Date = DateOnly.FromDateTime(DateTime.Today), Title = "T", Content = "C" };
        db.NoteEntries.Add(entry);
        await db.SaveChangesAsync();

        await sut.Invoking(s => s.GetByIdAsync(entry.Id, UserId)).Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task Update_ReplacesTags()
    {
        using var db = TestDbContext.Create();
        var sut = new NoteService(db);
        var entry = new NoteEntry
        {
            Id = Guid.NewGuid(),
            UserId = UserId,
            Date = DateOnly.FromDateTime(DateTime.Today),
            Title = "Old",
            Content = "C",
            Tags = new List<NoteTag> { new() { Tag = "old-tag" } },
        };
        db.NoteEntries.Add(entry);
        await db.SaveChangesAsync();

        var result = await sut.UpdateAsync(entry.Id, UserId, new UpdateNoteRequest
        {
            Tags = new List<string> { "new-tag" }
        });
        result.Tags.Should().BeEquivalentTo(new[] { "new-tag" });
    }

    [Fact]
    public async Task Delete_RemovesEntry()
    {
        using var db = TestDbContext.Create();
        var sut = new NoteService(db);
        var entry = new NoteEntry { Id = Guid.NewGuid(), UserId = UserId, Date = DateOnly.FromDateTime(DateTime.Today), Title = "T", Content = "C" };
        db.NoteEntries.Add(entry);
        await db.SaveChangesAsync();

        await sut.DeleteAsync(entry.Id, UserId);
        db.NoteEntries.Should().BeEmpty();
    }
}
