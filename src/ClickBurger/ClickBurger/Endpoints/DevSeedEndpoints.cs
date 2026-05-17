using Microsoft.AspNetCore.Http.HttpResults;
using ClickBurger.Authorization;
using ClickBurger.DTOs;
using ClickBurger.Services;

namespace ClickBurger.Endpoints;

public static class DevSeedEndpoints
{
    /// <summary>
    /// Registra rotas de seed apenas em Development (não aparecem em produção).
    /// </summary>
    public static void MapDevSeedEndpoints(this WebApplication app)
    {
        if (!app.Environment.IsDevelopment())
            return;

        var g = app.MapGroup("/api/dev").WithTags("Dev");

        g.MapPost("/seed-reports-orders", async Task<Results<Ok<SeedReportsOrdersResultDto>, BadRequest<object>>> (
                SeedReportsOrdersRequestDto? body,
                DevSeedService seed) =>
            {
                body ??= new SeedReportsOrdersRequestDto();
                var result = await seed.SeedClosedOrdersForReportsAsync(body.Count, body.DaysBack);
                if (result.InsertedOrders == 0)
                    return TypedResults.BadRequest<object>(new { message = result.Message });

                return TypedResults.Ok(result);
            })
            .RequireAuthorization(AuthPolicies.AdminOnly)
            .Produces<SeedReportsOrdersResultDto>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status400BadRequest)
            .WithSummary("[DEV] Insere pedidos FECHADO aleatórios para testar relatórios");
    }
}
