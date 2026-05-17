using FluentValidation;
using ClickBurger.DTOs;
using ClickBurger.Models;

namespace ClickBurger.Validation;

public class TableUpdateDtoValidator : AbstractValidator<TableUpdateDto>
{
    public TableUpdateDtoValidator()
    {
        RuleFor(x => x.Capacity).GreaterThan(0).LessThanOrEqualTo(100).When(x => x.Capacity.HasValue);
        RuleFor(x => x.Status)
            .Must(s => s == null || s == TableStatus.LIVRE || s == TableStatus.OCUPADA || s == TableStatus.RESERVADA)
            .WithMessage("Status inválido.");
        RuleFor(x => x)
            .Must(dto => dto.Capacity.HasValue || dto.Status != null || dto.CurrentOrderId != null)
            .WithMessage("Informe ao menos um campo para atualizar.");
    }
}
