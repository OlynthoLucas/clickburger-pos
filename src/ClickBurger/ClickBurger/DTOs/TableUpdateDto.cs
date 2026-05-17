namespace ClickBurger.DTOs;

public class TableUpdateDto
{
    public int? Capacity { get; set; }

    public string? Status { get; set; }

    public string? CurrentOrderId { get; set; }
}
