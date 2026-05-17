namespace ClickBurger.DTOs;

public class OrderPatchDto
{
    public string? Status { get; set; }

    public string? PaymentMethod { get; set; }

    public List<OrderItemDto>? Items { get; set; }
}
