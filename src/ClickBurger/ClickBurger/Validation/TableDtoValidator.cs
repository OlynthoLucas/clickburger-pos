using FluentValidation;
using ClickBurger.DTOs;
using ClickBurger.Models;

namespace ClickBurger.Validation;

public class TableDtoValidator : AbstractValidator<TableDto>
{
    public TableDtoValidator()
    {
        RuleFor(x => x.Number).GreaterThan(0);
        RuleFor(x => x.Capacity).GreaterThan(0).LessThanOrEqualTo(100);
        RuleFor(x => x.Status).NotEmpty()
            .Must(s => s == TableStatus.LIVRE || s == TableStatus.OCUPADA || s == TableStatus.RESERVADA)
            .WithMessage("Status inválido.");
    }
}
