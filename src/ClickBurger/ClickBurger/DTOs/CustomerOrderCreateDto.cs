namespace ClickBurger.DTOs;

/// <summary>
/// DTO para pedidos criados pelo app mobile do cliente.
/// Usa tableNumber em vez de tableId — o backend resolve internamente.
/// </summary>
public class CustomerOrderCreateDto
{
    public int TableNumber { get; set; }

    public List<CustomerOrderItemDto> Items { get; set; } = new();
}

public class CustomerOrderItemDto
{
    public string MenuItemId { get; set; } = string.Empty;

    public string MenuItemName { get; set; } = string.Empty;

    public int Quantity { get; set; }

    public decimal UnitPrice { get; set; }

    public string? Notes { get; set; }
}
