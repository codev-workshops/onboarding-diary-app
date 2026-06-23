using FluentValidation;
using OnboardingDiary.Api.DTOs.Feedback;

namespace OnboardingDiary.Api.Validation;

public class CreateFeedbackRequestValidator : AbstractValidator<CreateFeedbackRequest>
{
    public CreateFeedbackRequestValidator()
    {
        RuleFor(x => x.Subject).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Details).NotEmpty().MaximumLength(2000);
        RuleFor(x => x.Date).NotEmpty();
        RuleFor(x => x.Type).IsInEnum();
    }
}
