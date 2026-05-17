using Microsoft.AspNetCore.Http.HttpResults;
using MongoDB.Driver;
using ClickBurger.Authorization;
using ClickBurger.DTOs;
using ClickBurger.Filters;
using ClickBurger.Models;
using ClickBurger.Services;
using ClickBurger.Validation;

namespace ClickBurger.Endpoints;

public static class TableEndpoints
{
    public static void MapTableEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/tables").WithTags("Tables");

        g.MapGet("/", async Task<Ok<List<Table>>> (MongoDbService db) =>
            {
                var col = db.GetCollection<Table>("Tables");
                return TypedResults.Ok(await col.Find(_ => true).SortBy(t => t.Number).ToListAsync());
            })
            .RequireAuthorization(AuthPolicies.AnyUser)
            .Produces<List<Table>>(StatusCodes.Status200OK);

        g.MapGet("/{id}", async Task<Results<Ok<Table>, NotFound>> (string id, MongoDbService db) =>
            {
                var col = db.GetCollection<Table>("Tables");
                var t = await col.Find(x => x.Id == id).FirstOrDefaultAsync();
                return t == null ? TypedResults.NotFound() : TypedResults.Ok(t);
            })
            .RequireAuthorization(AuthPolicies.AnyUser)
            .Produces<Table>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status404NotFound);

        g.MapPost("/", async Task<Results<Created<Table>, Conflict<object>, BadRequest<object>>> (
                TableDto dto,
                MongoDbService db) =>
            {
                var col = db.GetCollection<Table>("Tables");
                var dup = await col.Find(x => x.Number == dto.Number).AnyAsync();
                if (dup)
                    return TypedResults.Conflict<object>(new { message = "Já existe mesa com este número." });

                var table = new Table
                {
                    Number = dto.Number,
                    Capacity = dto.Capacity,
                    Status = dto.Status
                };

                try
                {
                    await col.InsertOneAsync(table);
                }
                catch (MongoWriteException)
                {
                    return TypedResults.Conflict<object>(new { message = "Já existe mesa com este número." });
                }

                return TypedResults.Created($"/api/tables/{table.Id}", table);
            })
            .AddEndpointFilter(new ValidationFilter<TableDto>())
            .RequireAuthorization(AuthPolicies.Staff)
            .Produces<Table>(StatusCodes.Status201Created)
            .Produces(StatusCodes.Status409Conflict);

        g.MapPatch("/{id}", async Task<Results<Ok<Table>, NotFound>> (
                string id,
                TableUpdateDto dto,
                MongoDbService db) =>
            {
                var col = db.GetCollection<Table>("Tables");
                var table = await col.Find(x => x.Id == id).FirstOrDefaultAsync();
                if (table == null)
                    return TypedResults.NotFound();

                if (dto.Capacity.HasValue) table.Capacity = dto.Capacity.Value;
                if (dto.Status != null) table.Status = dto.Status;
                if (dto.CurrentOrderId != null) table.CurrentOrderId = dto.CurrentOrderId;
                table.UpdatedAt = DateTime.UtcNow;

                await col.ReplaceOneAsync(x => x.Id == id, table);
                return TypedResults.Ok(table);
            })
            .AddEndpointFilter(new ValidationFilter<TableUpdateDto>())
            .RequireAuthorization(AuthPolicies.Staff)
            .Produces<Table>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status404NotFound);

        g.MapDelete("/{id}", async Task<Results<NoContent, NotFound, Conflict<object>>> (
                string id,
                MongoDbService db) =>
            {
                var tables = db.GetCollection<Table>("Tables");
                var orders = db.GetCollection<Order>("Orders");
                var table = await tables.Find(t => t.Id == id).FirstOrDefaultAsync();
                if (table == null)
                    return TypedResults.NotFound();

                if (!string.IsNullOrEmpty(table.CurrentOrderId))
                {
                    var open = await orders.Find(o => o.Id == table.CurrentOrderId).FirstOrDefaultAsync();
                    if (open != null && !OrderWorkflow.IsTerminal(open.Status))
                        return TypedResults.Conflict<object>(new { message = "Não é possível excluir mesa com pedido em aberto." });
                }

                await tables.DeleteOneAsync(t => t.Id == id);
                return TypedResults.NoContent();
            })
            .RequireAuthorization(AuthPolicies.Staff)
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status409Conflict);
    }
}
