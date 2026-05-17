using ClickBurger.DTOs;
using ClickBurger.Models;
using ClickBurger.Services;
using Microsoft.AspNetCore.Http.HttpResults;
using MongoDB.Driver;

namespace ClickBurger.Endpoints;

/// <summary>
/// Endpoints públicos (sem autenticação) para o app mobile dos clientes.
/// </summary>
public static class CustomerEndpoints
{
    public static void MapCustomerEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/customer").WithTags("Customer Mobile");

        // POST /api/customer/orders — criar pedido por número de mesa (sem auth)
        g.MapPost("/orders", async Task<Results<Created<Order>, BadRequest<object>, NotFound<object>, Conflict<object>>> (
                CustomerOrderCreateDto dto,
                MongoDbService db,
                OrderService orders) =>
            {
                // Resolve tableId a partir do tableNumber
                var tables = db.GetCollection<Table>("Tables");
                var table = await tables.Find(t => t.Number == dto.TableNumber).FirstOrDefaultAsync();
                if (table == null)
                    return TypedResults.NotFound<object>(new { message = $"Mesa {dto.TableNumber} não encontrada. Verifique o número da mesa." });

                // Monta o DTO do serviço existente com o tableId resolvido
                var serviceDto = new OrderCreateDto
                {
                    TableId = table.Id!,
                    TableNumber = table.Number,
                    Items = dto.Items.Select(i => new OrderItemDto
                    {
                        MenuItemId = i.MenuItemId,
                        MenuItemName = i.MenuItemName,
                        Quantity = i.Quantity,
                        UnitPrice = i.UnitPrice,
                        Notes = i.Notes ?? string.Empty,
                    }).ToList()
                };

                var (order, error, code) = await orders.CreateAsync(serviceDto);
                if (code == 404)
                    return TypedResults.NotFound<object>(new { message = error });
                if (code == 400)
                    return TypedResults.BadRequest<object>(new { message = error });
                if (code == 409)
                    return TypedResults.Conflict<object>(new { message = error });

                return TypedResults.Created($"/api/orders/{order!.Id}", order);
            })
            .AllowAnonymous()
            .Produces<Order>(StatusCodes.Status201Created)
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status409Conflict)
            .WithSummary("Cria pedido de cliente anônimo por número de mesa");

        // GET /api/customer/orders/{id} — acompanhar status do pedido (sem auth)
        g.MapGet("/orders/{id}", async Task<Results<Ok<Order>, NotFound>> (string id, MongoDbService db) =>
            {
                var col = db.GetCollection<Order>("Orders");
                var o = await col.Find(x => x.Id == id).FirstOrDefaultAsync();
                return o == null ? TypedResults.NotFound() : TypedResults.Ok(o);
            })
            .AllowAnonymous()
            .Produces<Order>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status404NotFound)
            .WithSummary("Acompanha status do pedido pelo cliente (polling)");
    }
}
