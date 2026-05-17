using MongoDB.Driver;
using ClickBurger.DTOs;
using ClickBurger.Models;

namespace ClickBurger.Services;

public class ReportService
{
    private readonly IMongoCollection<Order> _orders;

    public ReportService(MongoDbService mongo)
    {
        _orders = mongo.GetCollection<Order>("Orders");
    }

    /// <summary>
    /// Agrega vendas de pedidos <see cref="OrderStatus.FECHADO"/> no intervalo [from, to] (datas UTC, inclusivo).
    /// Usa <see cref="Order.ClosedAt"/> quando existir; caso contrário <see cref="Order.UpdatedAt"/>.
    /// </summary>
    public async Task<SalesReportDto> GetClosedOrdersSalesReportAsync(DateOnly from, DateOnly to)
    {
        var fromUtc = DateTime.SpecifyKind(from.ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc);
        var toExclusiveUtc = DateTime.SpecifyKind(to.AddDays(1).ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc);

        var fechado = Builders<Order>.Filter.Eq(o => o.Status, OrderStatus.FECHADO);

        var closedAtInRange = Builders<Order>.Filter.And(
            Builders<Order>.Filter.Ne(o => o.ClosedAt, null),
            Builders<Order>.Filter.Gte(o => o.ClosedAt, fromUtc),
            Builders<Order>.Filter.Lt(o => o.ClosedAt, toExclusiveUtc));

        var fallbackUpdatedInRange = Builders<Order>.Filter.And(
            Builders<Order>.Filter.Eq(o => o.ClosedAt, null),
            Builders<Order>.Filter.Gte(o => o.UpdatedAt, fromUtc),
            Builders<Order>.Filter.Lt(o => o.UpdatedAt, toExclusiveUtc));

        var filter = Builders<Order>.Filter.And(
            fechado,
            Builders<Order>.Filter.Or(closedAtInRange, fallbackUpdatedInRange));

        var orders = await _orders.Find(filter).ToListAsync();

        var ordersCount = orders.Count;
        var revenue = orders.Sum(o => o.Total);
        var averageTicket = ordersCount > 0 ? decimal.Round(revenue / ordersCount, 2, MidpointRounding.AwayFromZero) : 0m;

        var agg = new Dictionary<string, AggRow>(StringComparer.Ordinal);
        foreach (var order in orders)
        {
            foreach (var line in order.Items)
            {
                var key = string.IsNullOrWhiteSpace(line.MenuItemId)
                    ? $"name:{line.MenuItemName}"
                    : $"id:{line.MenuItemId}";
                var lineRev = line.UnitPrice * line.Quantity;
                if (agg.TryGetValue(key, out var row))
                {
                    row.Quantity += line.Quantity;
                    row.Revenue += lineRev;
                }
                else
                {
                    agg[key] = new AggRow(
                        string.IsNullOrWhiteSpace(line.MenuItemId) ? "" : line.MenuItemId,
                        string.IsNullOrWhiteSpace(line.MenuItemName) ? "(sem nome)" : line.MenuItemName,
                        line.Quantity,
                        lineRev);
                }
            }
        }

        var topProducts = agg.Values
            .Select(v => new TopProductReportDto
            {
                MenuItemId = v.MenuItemId,
                Name = v.Name,
                Quantity = v.Quantity,
                Revenue = decimal.Round(v.Revenue, 2, MidpointRounding.AwayFromZero),
            })
            .OrderByDescending(p => p.Revenue)
            .ThenByDescending(p => p.Quantity)
            .Take(50)
            .ToList();

        return new SalesReportDto
        {
            OrdersCount = ordersCount,
            Revenue = decimal.Round(revenue, 2, MidpointRounding.AwayFromZero),
            AverageTicket = averageTicket,
            From = from,
            To = to,
            TopProducts = topProducts,
        };
    }

    private sealed class AggRow
    {
        public string MenuItemId { get; set; }
        public string Name { get; set; }
        public int Quantity { get; set; }
        public decimal Revenue { get; set; }

        public AggRow(string menuItemId, string name, int quantity, decimal revenue)
        {
            MenuItemId = menuItemId;
            Name = name;
            Quantity = quantity;
            Revenue = revenue;
        }
    }
}
