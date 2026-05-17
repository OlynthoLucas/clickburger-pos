namespace ClickBurger.DTOs;

public class OrderCreateDto
{
    public string TableId { get; set; } = string.Empty;

    public int TableNumber { get; set; }

    public List<OrderItemDto> Items { get; set; } = new();
}

public class OrderItemDto
{
    public string MenuItemId { get; set; } = string.Empty;

    public string MenuItemName { get; set; } = string.Empty;

    public int Quantity { get; set; }

    public decimal UnitPrice { get; set; }

    public string Notes { get; set; } = string.Empty;
}
