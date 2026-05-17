namespace ClickBurger.Hubs;

/// <summary>
/// Nomes dos eventos emitidos pelo OrderHub.
/// Usar constantes evita typos entre backend e frontend.
/// </summary>
public static class OrderHubEvents
{
    /// <summary>Novo pedido criado. Payload: Order</summary>
    public const string OrderCreated = "OrderCreated";

    /// <summary>Pedido atualizado (status, itens, pagamento). Payload: Order</summary>
    public const string OrderUpdated = "OrderUpdated";

    /// <summary>Pedido excluído. Payload: { orderId: string }</summary>
    public const string OrderDeleted = "OrderDeleted";
}
