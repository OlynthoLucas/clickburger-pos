using Microsoft.AspNetCore.Http.HttpResults;
using ClickBurger.Authorization;
using ClickBurger.DTOs;
using ClickBurger.Services;
using System.Security.Claims;

namespace ClickBurger.Endpoints;

public static class CashEndpoints
{
    public static void MapCashEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/cash")
                   .WithTags("Cash")
                   .RequireAuthorization();

        // GET /api/cash/current — retorna a sessão aberta (ou 404)
        g.MapGet("/current", async Task<Results<Ok<CashSessionDto>, NotFound>> (
            CashService cash) =>
        {
            var session = await cash.GetCurrentAsync();
            if (session is null)
                return TypedResults.NotFound();

            return TypedResults.Ok(CashService.MapToDto(session));
        })
        .WithSummary("Retorna a sessão de caixa aberta no momento");

        // POST /api/cash/open — abre o caixa
        g.MapPost("/open", async Task<Results<Ok<CashSessionDto>, BadRequest<object>>> (
            OpenCashDto dto,
            CashService cash,
            ClaimsPrincipal user) =>
        {
            var username = user.FindFirst(ClaimTypes.Name)?.Value ?? "desconhecido";
            var (session, error) = await cash.OpenAsync(dto.InitialValue, username);

            if (error is not null)
                return TypedResults.BadRequest<object>(new { message = error });

            return TypedResults.Ok(CashService.MapToDto(session!));
        })
        .WithSummary("Abre o caixa com um valor inicial");

        // POST /api/cash/close — fecha o caixa
        g.MapPost("/close", async Task<Results<Ok<CashSessionDto>, BadRequest<object>>> (
            CashService cash) =>
        {
            var (session, error) = await cash.CloseAsync();

            if (error is not null)
                return TypedResults.BadRequest<object>(new { message = error });

            return TypedResults.Ok(CashService.MapToDto(session!));
        })
        .RequireAuthorization(AuthPolicies.AdminOnly)
        .WithSummary("Fecha o caixa atual (somente admin)");

        // GET /api/cash/history — histórico de sessões (somente admin)
        g.MapGet("/history", async Task<Ok<List<CashSessionDto>>> (
            CashService cash) =>
        {
            var sessions = await cash.GetHistoryAsync();
            var dtos = sessions.Select(CashService.MapToDto).ToList();
            return TypedResults.Ok(dtos);
        })
        .RequireAuthorization(AuthPolicies.AdminOnly)
        .WithSummary("Histórico de sessões de caixa");
    }
}
