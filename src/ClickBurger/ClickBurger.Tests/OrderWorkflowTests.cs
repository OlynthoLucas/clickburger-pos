using ClickBurger.Models;
using ClickBurger.Services;

namespace ClickBurger.Tests;

public class OrderWorkflowTests
{
    [Theory]
    [InlineData(OrderStatus.ABERTO, OrderStatus.PREPARANDO, true)]
    [InlineData(OrderStatus.ABERTO, OrderStatus.CANCELADO, true)]
    [InlineData(OrderStatus.ABERTO, OrderStatus.FECHADO, false)]
    [InlineData(OrderStatus.PREPARANDO, OrderStatus.PRONTO, true)]
    [InlineData(OrderStatus.PRONTO, OrderStatus.FECHADO, true)]
    [InlineData(OrderStatus.FECHADO, OrderStatus.ABERTO, false)]
    [InlineData(OrderStatus.CANCELADO, OrderStatus.ABERTO, false)]
    public void CanTransitionTo_respects_rules(string from, string to, bool expected) =>
        Assert.Equal(expected, OrderWorkflow.CanTransitionTo(from, to));

    [Fact]
    public void Same_status_is_allowed() =>
        Assert.True(OrderWorkflow.CanTransitionTo(OrderStatus.ABERTO, OrderStatus.ABERTO));

    [Fact]
    public void Terminal_status_detected() =>
        Assert.True(OrderWorkflow.IsTerminal(OrderStatus.FECHADO));
}
