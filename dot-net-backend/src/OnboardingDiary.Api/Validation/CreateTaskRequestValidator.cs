using FluentValidation;
using OnboardingDiary.Api.DTOs.Tasks;

namespace OnboardingDiary.Api.Validation;

public class CreateTaskRequestValidator : AbstractValidator<CreateTaskRequest>
{
    public CreateTaskRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required.")
            .MaximumLength(200);

        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Description is required.")
            .MaximumLength(2000);

        RuleFor(x => x.Date)
            .NotEmpty().WithMessage("Date is required.");

        RuleFor(x => x.Category)
            .IsInEnum().WithMessage("Invalid category.");

        RuleFor(x => x.Status)
            .IsInEnum().WithMessage("Invalid status.");

        RuleFor(x => x.Priority)
            .IsInEnum().WithMessage("Invalid priority.");
    }
}
