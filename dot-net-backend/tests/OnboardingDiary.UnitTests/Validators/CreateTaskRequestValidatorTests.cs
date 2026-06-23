using FluentAssertions;
using OnboardingDiary.Api.DTOs.Tasks;
using OnboardingDiary.Api.Models.Enums;
using OnboardingDiary.Api.Validation;

namespace OnboardingDiary.UnitTests.Validators;

public class CreateTaskRequestValidatorTests
{
    private readonly CreateTaskRequestValidator _validator = new();

    private static CreateTaskRequest ValidRequest() => new()
    {
        Date = DateOnly.FromDateTime(DateTime.Today),
        Title = "Valid Title",
        Description = "Valid description",
        Category = TaskCategory.Setup,
        Status = OnboardingDiary.Api.Models.Enums.TaskStatus.NotStarted,
        Priority = TaskPriority.Medium,
    };

    [Fact]
    public void ValidRequest_Passes()
    {
        var result = _validator.Validate(ValidRequest());
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void EmptyTitle_Fails()
    {
        var request = ValidRequest();
        request.Title = "";
        var result = _validator.Validate(request);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Title");
    }

    [Fact]
    public void TitleTooLong_Fails()
    {
        var request = ValidRequest();
        request.Title = new string('a', 201);
        var result = _validator.Validate(request);
        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void EmptyDescription_Fails()
    {
        var request = ValidRequest();
        request.Description = "";
        var result = _validator.Validate(request);
        result.IsValid.Should().BeFalse();
    }
}
