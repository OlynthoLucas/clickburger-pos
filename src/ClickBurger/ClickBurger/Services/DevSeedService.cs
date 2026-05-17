using MongoDB.Driver;
using ClickBurger.DTOs;
using ClickBurger.Models;

namespace ClickBurger.Services;

public class DevSeedService
{
    private readonly IMongoCollection<Order> _orders;
    private readonly IMongoCollection<Table> _tables;
    private readonly IMongoCollection<MenuItem> _menuItems;

    public DevSeedService(MongoDbService mongo)
    {
        _orders = mongo.GetCollection<Order>("Orders");
        _tables = mongo.GetCollection<Table>("Tables");
        _menuItems = mongo.GetCollection<MenuItem>("MenuItems");
    }

    public async Task<SeedReportsOrdersResultDto> SeedClosedOrdersForReportsAsync(int count, int daysBack)
    {
        count = Math.Clamp(count, 1, 500);
        daysBack = Math.Clamp(daysBack, 1, 365);

        var tablesEnsured = await EnsureDevTablesAsync();
        var menuEnsured = await EnsureDevMenuItemsAsync();

        var tables = await _tables.Find(_ => true).ToListAsync();
        var menus = await _menuItems.Find(_ => true).ToListAsync();

        if (tables.Count == 0 || menus.Count == 0)
            return new SeedReportsOrdersResultDto
            {
                Message = "Não foi possível garantir mesas ou itens de cardápio.",
                TablesEnsured = tablesEnsured,
                MenuItemsEnsured = menuEnsured,
            };

        var paymentMethods = new[] { PaymentMethods.DINHEIRO, PaymentMethods.CARTAO, PaymentMethods.PIX };
        var orders = new List<Order>(count);
        var now = DateTime.UtcNow;

        for (var i = 0; i < count; i++)
        {
            var table = tables[Random.Shared.Next(tables.Count)];
            var closedAt = RandomClosedAtUtc(now, daysBack);
            var createdAt = closedAt.AddMinutes(-Random.Shared.Next(15, 120));
            if (createdAt >= closedAt)
                createdAt = closedAt.AddMinutes(-10);

            var lineCount = Random.Shared.Next(1, 5);
            var items = new List<OrderItem>();
            decimal total = 0;

            for (var l = 0; l < lineCount; l++)
            {
                var menu = menus[Random.Shared.Next(menus.Count)];
                var qty = Random.Shared.Next(1, 4);
                var unit = menu.Price;
                var rev = unit * qty;
                total += rev;
            items.Add(new OrderItem
            {
                MenuItemId = menu.Id ?? "",
                MenuItemName = menu.Name,
                Quantity = qty,
                UnitPrice = unit,
                Notes = "",
                Status = OrderItemStatus.SERVIDO,
                AddedAt = DateTime.SpecifyKind(createdAt, DateTimeKind.Utc),
            });
            }

            orders.Add(new Order
            {
                TableId = table.Id ?? "",
                TableNumber = table.Number,
                Items = items,
                Total = decimal.Round(total, 2, MidpointRounding.AwayFromZero),
                Status = OrderStatus.FECHADO,
                PaymentMethod = paymentMethods[Random.Shared.Next(paymentMethods.Length)],
                CreatedAt = DateTime.SpecifyKind(createdAt, DateTimeKind.Utc),
                ClosedAt = closedAt,
                UpdatedAt = closedAt,
            });
        }

        await _orders.InsertManyAsync(orders);

        return new SeedReportsOrdersResultDto
        {
            InsertedOrders = orders.Count,
            TablesEnsured = tablesEnsured,
            MenuItemsEnsured = menuEnsured,
            Message =
                $"Inseridos {orders.Count} pedidos FECHADO nos últimos {daysBack} dias (ambiente Development apenas).",
        };
    }

    private static DateTime RandomClosedAtUtc(DateTime utcNow, int daysBack)
    {
        var dayOffset = Random.Shared.Next(0, daysBack + 1);
        var midnightUtc = new DateTime(utcNow.Year, utcNow.Month, utcNow.Day, 0, 0, 0, DateTimeKind.Utc);
        var dayStart = midnightUtc.AddDays(-dayOffset);
        var candidate = dayStart
            .AddHours(Random.Shared.Next(11, 23))
            .AddMinutes(Random.Shared.Next(0, 59));

        if (candidate > utcNow)
            candidate = utcNow.AddMinutes(-Random.Shared.Next(10, 180));

        return DateTime.SpecifyKind(candidate, DateTimeKind.Utc);
    }

    private async Task<bool> EnsureDevTablesAsync()
    {
        var existing = await _tables.CountDocumentsAsync(FilterDefinition<Table>.Empty);
        if (existing > 0)
            return false;

        var now = DateTime.UtcNow;
        var batch = Enumerable.Range(1, 8).Select(n => new Table
        {
            Number = n,
            Capacity = n <= 4 ? 4 : 6,
            Status = TableStatus.LIVRE,
            CurrentOrderId = null,
            CreatedAt = now,
            UpdatedAt = now,
        }).ToList();

        await _tables.InsertManyAsync(batch);
        return true;
    }

    private async Task<bool> EnsureDevMenuItemsAsync()
    {
        var existing = await _menuItems.CountDocumentsAsync(FilterDefinition<MenuItem>.Empty);
        if (existing > 0)
            return false;

        var now = DateTime.UtcNow;
        var seed = new[]
        {
            ("X-Burger Clássico", 24.90m, "Lanches"),
            ("X-Burger Duplo", 32.50m, "Lanches"),
            ("Chicken Crocante", 28.00m, "Lanches"),
            ("Batata média", 14.00m, "Acompanhamentos"),
            ("Batata grande", 18.50m, "Acompanhamentos"),
            ("Refrigerante Lata", 6.50m, "Bebidas"),
            ("Suco Natural 500ml", 12.00m, "Bebidas"),
            ("Milkshake Chocolate", 16.90m, "Sobremesas"),
        };

        var docs = seed.Select(t => new MenuItem
        {
            Name = t.Item1,
            Description = "Seed dev — relatórios",
            Price = t.Item2,
            Category = t.Item3,
            Available = true,
            Images = new List<string>(),
            CreatedAt = now,
            UpdatedAt = now,
        }).ToList();

        await _menuItems.InsertManyAsync(docs);
        return true;
    }
}
