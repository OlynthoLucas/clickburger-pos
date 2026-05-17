using Microsoft.AspNetCore.Http.HttpResults;
using MongoDB.Driver;
using ClickBurger.Authorization;
using ClickBurger.DTOs;
using ClickBurger.Filters;
using ClickBurger.Models;
using ClickBurger.Services;
using ClickBurger.Validation;

namespace ClickBurger.Endpoints;

public static class MenuEndpoints
{
    public static void MapMenuEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/menu").WithTags("Menu");

        g.MapGet("/", async Task<Ok<List<MenuItem>>> (MongoDbService db) =>
            {
                var col = db.GetCollection<MenuItem>("MenuItems");
                var items = await col.Find(x => x.Available).ToListAsync();
                return TypedResults.Ok(items);
            })
            .Produces<List<MenuItem>>(StatusCodes.Status200OK)
            .WithSummary("Cardápio público (apenas itens disponíveis)");

        g.MapGet("/admin", async Task<Ok<List<MenuItem>>> (MongoDbService db) =>
            {
                var col = db.GetCollection<MenuItem>("MenuItems");
                return TypedResults.Ok(await col.Find(_ => true).ToListAsync());
            })
            .RequireAuthorization(AuthPolicies.AdminOnly)
            .Produces<List<MenuItem>>(StatusCodes.Status200OK)
            .WithSummary("Lista completa (admin)");

        g.MapGet("/{id}", async Task<Results<Ok<MenuItem>, NotFound>> (string id, MongoDbService db) =>
            {
                var col = db.GetCollection<MenuItem>("MenuItems");
                var item = await col.Find(x => x.Id == id).FirstOrDefaultAsync();
                return item == null ? TypedResults.NotFound() : TypedResults.Ok(item);
            })
            .Produces<MenuItem>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status404NotFound);

        g.MapPost("/", async Task<Results<Created<MenuItem>, BadRequest<string>>> (
                MenuItemDto dto,
                MongoDbService db,
                StorageService storage) =>
            {
                var col = db.GetCollection<MenuItem>("MenuItems");
                var images = new List<string>();
                foreach (var img in dto.Images)
                {
                    if (img.StartsWith("data:", StringComparison.OrdinalIgnoreCase))
                    {
                        var urls = storage.UploadImages(new List<string> { img }, Guid.NewGuid().ToString());
                        images.AddRange(urls);
                    }
                    else
                        images.Add(img);
                }

                var menuItem = new MenuItem
                {
                    Name = dto.Name,
                    Description = dto.Description,
                    Price = dto.Price,
                    Category = dto.Category,
                    Available = dto.Available,
                    Images = images
                };

                await col.InsertOneAsync(menuItem);
                return TypedResults.Created($"/api/menu/{menuItem.Id}", menuItem);
            })
            .AddEndpointFilter(new ValidationFilter<MenuItemDto>())
            .RequireAuthorization(AuthPolicies.AdminOnly)
            .Produces<MenuItem>(StatusCodes.Status201Created)
            .Produces(StatusCodes.Status400BadRequest);

        g.MapPatch("/{id}", async Task<Results<Ok<MenuItem>, NotFound, BadRequest<string>>> (
                string id,
                MenuItemUpdateDto dto,
                MongoDbService db) =>
            {
                var col = db.GetCollection<MenuItem>("MenuItems");
                var existing = await col.Find(x => x.Id == id).FirstOrDefaultAsync();
                if (existing == null)
                    return TypedResults.NotFound();

                if (dto.Name != null) existing.Name = dto.Name;
                if (dto.Description != null) existing.Description = dto.Description;
                if (dto.Price.HasValue) existing.Price = dto.Price.Value;
                if (dto.Category != null) existing.Category = dto.Category;
                if (dto.Images != null) existing.Images = dto.Images;
                if (dto.Available.HasValue) existing.Available = dto.Available.Value;
                existing.UpdatedAt = DateTime.UtcNow;

                await col.ReplaceOneAsync(x => x.Id == id, existing);
                return TypedResults.Ok(existing);
            })
            .AddEndpointFilter(new ValidationFilter<MenuItemUpdateDto>())
            .RequireAuthorization(AuthPolicies.AdminOnly)
            .Produces<MenuItem>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status404NotFound);

        g.MapDelete("/{id}", async Task<Results<NoContent, NotFound>> (string id, MongoDbService db) =>
            {
                var col = db.GetCollection<MenuItem>("MenuItems");
                var existing = await col.Find(x => x.Id == id).FirstOrDefaultAsync();
                if (existing == null)
                    return TypedResults.NotFound();

                await col.DeleteOneAsync(x => x.Id == id);
                return TypedResults.NoContent();
            })
            .RequireAuthorization(AuthPolicies.AdminOnly)
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound)
            .WithSummary("Desativa item (soft delete)");
    }
}
