using FluentValidation;
using OnboardingDiary.Api.DTOs.Issues;

namespace OnboardingDiary.Api.Validation;

public class CreateIssueRequestValidator : AbstractValidator<CreateIssueRequest>
{
    public CreateIssueRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).NotEmpty().MaximumLength(2000);
        RuleFor(x => x.Date).NotEmpty();
        RuleFor(x => x.Severity).IsInEnum();
        RuleFor(x => x.Status).IsInEnum();
    }
}
