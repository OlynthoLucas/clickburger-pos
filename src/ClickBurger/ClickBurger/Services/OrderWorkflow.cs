using ClickBurger.Models;

namespace ClickBurger.Services;

public static class OrderWorkflow
{
    public static bool CanTransitionTo(string currentStatus, string newStatus)
    {
        if (newStatus == currentStatus)
            return true;

        return currentStatus switch
        {
            OrderStatus.ABERTO => newStatus is OrderStatus.PREPARANDO or OrderStatus.CANCELADO,
            OrderStatus.PREPARANDO => newStatus is OrderStatus.PRONTO or OrderStatus.CANCELADO,
            OrderStatus.PRONTO => newStatus is OrderStatus.FECHADO or OrderStatus.CANCELADO,
            OrderStatus.FECHADO => false,
            OrderStatus.CANCELADO => false,
            _ => false
        };
    }

    public static bool IsTerminal(string status) =>
        status is OrderStatus.FECHADO or OrderStatus.CANCELADO;
}
