using FluentValidation;
using ClickBurger.DTOs;
using ClickBurger.Models;

namespace ClickBurger.Validation;

public class OrderPatchDtoValidator : AbstractValidator<OrderPatchDto>
{
    public OrderPatchDtoValidator()
    {
        RuleFor(x => x.Status)
            .Must(s => s == null || s == OrderStatus.ABERTO || s == OrderStatus.PREPARANDO || s == OrderStatus.PRONTO
                || s == OrderStatus.FECHADO || s == OrderStatus.CANCELADO)
            .WithMessage("Status inválido.");
        RuleFor(x => x.PaymentMethod)
            .Must(p => p == null || p == PaymentMethods.DINHEIRO || p == PaymentMethods.CARTAO || p == PaymentMethods.PIX)
            .WithMessage("Forma de pagamento inválida.");
        RuleForEach(x => x.Items!).SetValidator(new OrderItemDtoValidator()).When(x => x.Items != null && x.Items.Count > 0);
        RuleFor(x => x)
            .Must(d => d.Status != null || d.PaymentMethod != null || (d.Items != null && d.Items.Count > 0))
            .WithMessage("Informe ao menos um campo para atualizar.");
    }
}
