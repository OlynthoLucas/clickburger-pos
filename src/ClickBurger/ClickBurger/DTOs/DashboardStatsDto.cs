namespace ClickBurger.DTOs;

public class DashboardStatsDto
{
    public long TotalOrders { get; set; }
    public long ActiveOrders { get; set; }
    public long ClosedOrders { get; set; }
    public long TotalTables { get; set; }
    public long FreeTables { get; set; }
    public long OccupiedTables { get; set; }
    public long TotalProducts { get; set; }
    public long ActiveUsers { get; set; }
}
