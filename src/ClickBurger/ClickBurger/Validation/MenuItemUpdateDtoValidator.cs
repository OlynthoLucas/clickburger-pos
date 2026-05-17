using FluentValidation;
using ClickBurger.DTOs;

namespace ClickBurger.Validation;

public class MenuItemUpdateDtoValidator : AbstractValidator<MenuItemUpdateDto>
{
    public MenuItemUpdateDtoValidator()
    {
        RuleFor(x => x.Name).MaximumLength(200).When(x => x.Name != null);
        RuleFor(x => x.Description).MaximumLength(2000).When(x => x.Description != null);
        RuleFor(x => x.Price).GreaterThanOrEqualTo(0).When(x => x.Price.HasValue);
        RuleFor(x => x.Category).MaximumLength(100).When(x => x.Category != null);
        RuleFor(x => x)
            .Must(dto => dto.Name != null || dto.Description != null || dto.Price.HasValue ||
                         dto.Category != null || dto.Images != null || dto.Available.HasValue)
            .WithMessage("Informe ao menos um campo para atualizar.");
    }
}
