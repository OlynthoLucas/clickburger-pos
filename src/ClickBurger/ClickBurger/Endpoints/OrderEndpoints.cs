using Microsoft.AspNetCore.Http.HttpResults;
using MongoDB.Driver;
using ClickBurger.Authorization;
using ClickBurger.DTOs;
using ClickBurger.Filters;
using ClickBurger.Models;
using ClickBurger.Services;
using ClickBurger.Validation;

namespace ClickBurger.Endpoints;

public static class OrderEndpoints
{
    public static void MapOrderEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/orders").WithTags("Orders");

        g.MapGet("/", async Task<Ok<List<Order>>> (string? tableId, MongoDbService db) =>
            {
                var col = db.GetCollection<Order>("Orders");
                FilterDefinition<Order> filter = string.IsNullOrEmpty(tableId)
                    ? FilterDefinition<Order>.Empty
                    : Builders<Order>.Filter.Eq(o => o.TableId, tableId);

                var list = await col.Find(filter).SortByDescending(o => o.CreatedAt).Limit(200).ToListAsync();
                return TypedResults.Ok(list);
            })
            .RequireAuthorization(AuthPolicies.AnyUser)
            .Produces<List<Order>>(StatusCodes.Status200OK);

        g.MapGet("/{id}", async Task<Results<Ok<Order>, NotFound>> (string id, MongoDbService db) =>
            {
                var col = db.GetCollection<Order>("Orders");
                var o = await col.Find(x => x.Id == id).FirstOrDefaultAsync();
                return o == null ? TypedResults.NotFound() : TypedResults.Ok(o);
            })
            .RequireAuthorization(AuthPolicies.AnyUser)
            .Produces<Order>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status404NotFound);

        g.MapPost("/", async Task<Results<Created<Order>, BadRequest<object>, NotFound<object>, Conflict<object>>> (
                OrderCreateDto dto,
                OrderService orders) =>
            {
                var (order, error, code) = await orders.CreateAsync(dto);
                if (code == 404)
                    return TypedResults.NotFound<object>(new { message = error });
                if (code == 400)
                    return TypedResults.BadRequest<object>(new { message = error });
                if (code == 409)
                    return TypedResults.Conflict<object>(new { message = error });
                return TypedResults.Created($"/api/orders/{order!.Id}", order);
            })
            .AddEndpointFilter(new ValidationFilter<OrderCreateDto>())
            .RequireAuthorization(AuthPolicies.AnyUser)
            .Produces<Order>(StatusCodes.Status201Created)
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status409Conflict);

        g.MapPatch("/{id}", async Task<Results<Ok<Order>, BadRequest<object>, NotFound<object>>> (
                string id,
                OrderPatchDto dto,
                OrderService orders) =>
            {
                var (order, error, code) = await orders.PatchAsync(id, dto);
                if (code == 404)
                    return TypedResults.NotFound<object>(new { message = error });
                if (code == 400)
                    return TypedResults.BadRequest<object>(new { message = error });
                return TypedResults.Ok(order!);
            })
            .AddEndpointFilter(new ValidationFilter<OrderPatchDto>())
            .RequireAuthorization(AuthPolicies.AnyUser)
            .Produces<Order>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status404NotFound);

        g.MapDelete("/{id}", async Task<Results<NoContent, NotFound<object>>> (
                string id,
                OrderService orders) =>
            {
                var (error, code) = await orders.DeleteAsync(id);
                if (code == 404)
                    return TypedResults.NotFound<object>(new { message = error });
                return TypedResults.NoContent();
            })
            .RequireAuthorization(AuthPolicies.AnyUser)
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound);
    }
}
