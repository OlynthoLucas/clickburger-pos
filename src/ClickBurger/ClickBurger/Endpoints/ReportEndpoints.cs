using Microsoft.AspNetCore.Http.HttpResults;
using ClickBurger.Authorization;
using ClickBurger.DTOs;
using ClickBurger.Services;
using MongoDB.Driver;
using ClickBurger.Models;

namespace ClickBurger.Endpoints;

public static class ReportEndpoints
{
    public static void MapReportEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/reports").WithTags("Reports");

        g.MapGet("/sales", async Task<Results<Ok<SalesReportDto>, BadRequest<object>>> (
                string? from,
                string? to,
                ReportService reports) =>
            {
                if (!DateOnly.TryParse(from, out var fromDate) || !DateOnly.TryParse(to, out var toDate))
                    return TypedResults.BadRequest<object>(new { message = "Informe from e to no formato yyyy-MM-dd." });

                if (fromDate > toDate)
                    return TypedResults.BadRequest<object>(new { message = "A data inicial não pode ser maior que a final." });

                var report = await reports.GetClosedOrdersSalesReportAsync(fromDate, toDate);
                return TypedResults.Ok(report);
            })
            .RequireAuthorization(AuthPolicies.AdminOnly)
            .Produces<SalesReportDto>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status400BadRequest)
            .WithSummary("Relatório de vendas (pedidos FECHADO no período)");

        g.MapGet("/dashboard", async Task<Results<Ok<DashboardStatsDto>, BadRequest<object>>> (MongoDbService db) =>
            {
                var orders = db.GetCollection<Order>("Orders");
                var tables = db.GetCollection<Table>("Tables");
                var menu = db.GetCollection<MenuItem>("MenuItems");
                var users = db.GetCollection<User>("Users");

                var totalOrders = await orders.CountDocumentsAsync(_ => true);
                var activeOrders = await orders.CountDocumentsAsync(o => o.Status != "FECHADO" && o.Status != "CANCELADO");
                var closedOrders = await orders.CountDocumentsAsync(o => o.Status == "FECHADO");

                var totalTables = await tables.CountDocumentsAsync(_ => true);
                var freeTables = await tables.CountDocumentsAsync(t => t.Status == TableStatus.LIVRE);
                var occupiedTables = await tables.CountDocumentsAsync(t => t.Status == TableStatus.OCUPADA);

                var totalProducts = await menu.CountDocumentsAsync(_ => true);
                var activeUsers = await users.CountDocumentsAsync(u => u.Active);

                return TypedResults.Ok(new DashboardStatsDto
                {
                    TotalOrders = totalOrders,
                    ActiveOrders = activeOrders,
                    ClosedOrders = closedOrders,
                    TotalTables = totalTables,
                    FreeTables = freeTables,
                    OccupiedTables = occupiedTables,
                    TotalProducts = totalProducts,
                    ActiveUsers = activeUsers
                });
            })
            .RequireAuthorization(AuthPolicies.AdminOnly)
            .Produces<DashboardStatsDto>(StatusCodes.Status200OK)
            .WithSummary("Estatísticas gerais do dashboard");
    }
}
