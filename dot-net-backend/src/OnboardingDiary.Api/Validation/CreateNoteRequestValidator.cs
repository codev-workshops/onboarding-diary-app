using FluentValidation;
using OnboardingDiary.Api.DTOs.Notes;

namespace OnboardingDiary.Api.Validation;

public class CreateNoteRequestValidator : AbstractValidator<CreateNoteRequest>
{
    public CreateNoteRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Content).NotEmpty().MaximumLength(5000);
        RuleFor(x => x.Date).NotEmpty();
        RuleForEach(x => x.Tags).MaximumLength(50);
    }
}
