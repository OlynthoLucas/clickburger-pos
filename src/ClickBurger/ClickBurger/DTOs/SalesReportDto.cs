namespace ClickBurger.DTOs;

public class SalesReportDto
{
    public int OrdersCount { get; set; }

    public decimal Revenue { get; set; }

    public decimal AverageTicket { get; set; }

    public DateOnly From { get; set; }

    public DateOnly To { get; set; }

    public List<TopProductReportDto> TopProducts { get; set; } = new();
}

public class TopProductReportDto
{
    public string MenuItemId { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public int Quantity { get; set; }

    public decimal Revenue { get; set; }
}
