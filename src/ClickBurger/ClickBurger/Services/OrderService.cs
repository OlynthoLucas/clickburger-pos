using Microsoft.AspNetCore.SignalR;
using MongoDB.Driver;
using ClickBurger.DTOs;
using ClickBurger.Hubs;
using ClickBurger.Models;

namespace ClickBurger.Services;

public class OrderService
{
    private readonly IMongoCollection<Order> _orders;
    private readonly IMongoCollection<Table> _tables;
    private readonly IMongoCollection<MenuItem> _menuItems;
    private readonly IHubContext<OrderHub> _hub;

    public OrderService(MongoDbService mongo, IHubContext<OrderHub> hub)
    {
        _orders = mongo.GetCollection<Order>("Orders");
        _tables = mongo.GetCollection<Table>("Tables");
        _menuItems = mongo.GetCollection<MenuItem>("MenuItems");
        _hub = hub;
    }

    public async Task<(Order? order, string? error, int statusCode)> CreateAsync(OrderCreateDto dto)
    {
        if (dto.Items == null || dto.Items.Count == 0)
            return (null, "O pedido deve conter ao menos um item.", 400);

        var table = await _tables.Find(t => t.Id == dto.TableId).FirstOrDefaultAsync();
        if (table == null)
            return (null, "Mesa não encontrada.", 404);

        if (table.Number != dto.TableNumber)
            return (null, "TableNumber não corresponde à mesa informada.", 400);

        if (!string.IsNullOrEmpty(table.CurrentOrderId))
        {
            var open = await _orders.Find(o => o.Id == table.CurrentOrderId).FirstOrDefaultAsync();
            if (open != null && !OrderWorkflow.IsTerminal(open.Status))
                return (null, "Mesa já possui um pedido em aberto.", 409);
        }

        var items = new List<OrderItem>();
        decimal total = 0;

        foreach (var line in dto.Items)
        {
            if (line.Quantity <= 0)
                return (null, "Quantidade deve ser maior que zero.", 400);

            var menu = await _menuItems.Find(m => m.Id == line.MenuItemId).FirstOrDefaultAsync();
            if (menu == null)
                return (null, $"Item de cardápio não encontrado: {line.MenuItemId}.", 404);

            if (!menu.Available)
                return (null, $"Item indisponível: {menu.Name}.", 409);

            var unit = line.UnitPrice > 0 ? line.UnitPrice : menu.Price;
            var name = string.IsNullOrWhiteSpace(line.MenuItemName) ? menu.Name : line.MenuItemName;

            items.Add(new OrderItem
            {
                MenuItemId = line.MenuItemId,
                MenuItemName = name,
                Quantity = line.Quantity,
                UnitPrice = unit,
                Notes = line.Notes ?? string.Empty,
                Status = OrderItemStatus.PENDENTE
            });

            total += unit * line.Quantity;
        }

        var order = new Order
        {
            TableId = dto.TableId,
            TableNumber = dto.TableNumber,
            Items = items,
            Total = total,
            Status = OrderStatus.ABERTO,
            PaymentMethod = PaymentMethods.DINHEIRO
        };

        await _orders.InsertOneAsync(order);

        var tableUpdate = Builders<Table>.Update
            .Set(t => t.Status, TableStatus.OCUPADA)
            .Set(t => t.CurrentOrderId, order.Id)
            .Set(t => t.UpdatedAt, DateTime.UtcNow);

        await _tables.UpdateOneAsync(t => t.Id == dto.TableId, tableUpdate);

        // ← Emite evento para todos os conectados (garçons + admins)
        await _hub.Clients.Group("staff")
            .SendAsync(OrderHubEvents.OrderCreated, order);

        return (order, null, 201);
    }

    public async Task<(Order? order, string? error, int statusCode)> PatchAsync(string id, OrderPatchDto dto)
    {
        var order = await _orders.Find(o => o.Id == id).FirstOrDefaultAsync();
        if (order == null)
            return (null, "Pedido não encontrado.", 404);

        if (dto.Status != null)
        {
            if (!OrderWorkflow.CanTransitionTo(order.Status, dto.Status))
                return (null, $"Transição de status inválida: {order.Status} -> {dto.Status}.", 400);

            order.Status = dto.Status;
            if (dto.Status == OrderStatus.FECHADO || dto.Status == OrderStatus.CANCELADO)
                order.ClosedAt = DateTime.UtcNow;
        }

        if (dto.PaymentMethod != null)
            order.PaymentMethod = dto.PaymentMethod;

        if (dto.Items is { Count: > 0 })
        {
            if (OrderWorkflow.IsTerminal(order.Status))
                return (null, "Não é possível alterar itens de um pedido encerrado.", 400);

            var rebuilt = new List<OrderItem>();
            decimal total = 0;
            foreach (var line in dto.Items)
            {
                if (line.Quantity <= 0)
                    return (null, "Quantidade deve ser maior que zero.", 400);

                var menu = await _menuItems.Find(m => m.Id == line.MenuItemId).FirstOrDefaultAsync();
                if (menu == null)
                    return (null, $"Item de cardápio não encontrado: {line.MenuItemId}.", 404);

                var unit = line.UnitPrice > 0 ? line.UnitPrice : menu.Price;
                var name = string.IsNullOrWhiteSpace(line.MenuItemName) ? menu.Name : line.MenuItemName;

                rebuilt.Add(new OrderItem
                {
                    MenuItemId = line.MenuItemId,
                    MenuItemName = name,
                    Quantity = line.Quantity,
                    UnitPrice = unit,
                    Notes = line.Notes ?? string.Empty,
                    Status = OrderItemStatus.PENDENTE
                });
                total += unit * line.Quantity;
            }

            order.Items = rebuilt;
            order.Total = total;
        }

        order.UpdatedAt = DateTime.UtcNow;

        await _orders.ReplaceOneAsync(o => o.Id == id, order);

        if (dto.Status is OrderStatus.FECHADO or OrderStatus.CANCELADO)
            await ClearTableOrderIfMatchAsync(order.TableId, id);

        // ← Emite evento de atualização para todos
        await _hub.Clients.Group("staff")
            .SendAsync(OrderHubEvents.OrderUpdated, order);

        // ← Se fechado, emite também para o grupo admin (para atualizar métricas)
        if (order.Status == OrderStatus.FECHADO)
        {
            await _hub.Clients.Group("admin")
                .SendAsync(OrderHubEvents.OrderUpdated, order);
        }

        return (order, null, 200);
    }

    public async Task<(string? error, int statusCode)> DeleteAsync(string id)
    {
        var order = await _orders.Find(o => o.Id == id).FirstOrDefaultAsync();
        if (order == null)
            return ("Pedido não encontrado.", 404);

        await ClearTableOrderIfMatchAsync(order.TableId, id);
        await _orders.DeleteOneAsync(o => o.Id == id);

        // ← Emite evento de exclusão
        await _hub.Clients.Group("staff")
            .SendAsync(OrderHubEvents.OrderDeleted, new { orderId = id });

        return (null, 204);
    }

    private async Task ClearTableOrderIfMatchAsync(string tableId, string orderId)
    {
        var table = await _tables.Find(t => t.Id == tableId).FirstOrDefaultAsync();
        if (table?.CurrentOrderId != orderId)
            return;

        var upd = Builders<Table>.Update
            .Set(t => t.Status, TableStatus.LIVRE)
            .Set(t => t.CurrentOrderId, (string?)null)
            .Set(t => t.UpdatedAt, DateTime.UtcNow);

        await _tables.UpdateOneAsync(t => t.Id == tableId, upd);
    }
}
