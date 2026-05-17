using System.Security.Claims;
using Microsoft.AspNetCore.Http.HttpResults;
using ClickBurger.Authorization;
using ClickBurger.DTOs;
using ClickBurger.Filters;
using ClickBurger.Services;
using ClickBurger.Validation;

namespace ClickBurger.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/auth").WithTags("Auth");

        g.MapPost("/login", async Task<Results<Ok<LoginResponse>, UnauthorizedHttpResult>> (
                LoginRequest request,
                AuthService authService) =>
            {
                var response = await authService.LoginAsync(request);
                return response.Success
                    ? TypedResults.Ok(response)
                    : TypedResults.Unauthorized();
            })
            .AddEndpointFilter(new ValidationFilter<LoginRequest>())
            .Produces<LoginResponse>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status401Unauthorized)
            .WithSummary("Login com JWT e refresh token");

        g.MapPost("/register", async Task<Results<Ok<object>, BadRequest<object>>> (
                RegisterRequest request,
                AuthService authService) =>
            {
                var success = await authService.RegisterAsync(request);
                return success
                    ? TypedResults.Ok<object>(new { message = "Usuário registrado com sucesso." })
                    : TypedResults.BadRequest<object>(new { message = "Usuário já existe." });
            })
            .AddEndpointFilter(new ValidationFilter<RegisterRequest>())
            .Produces(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status400BadRequest)
            .WithSummary("Registro público; primeiro usuário do banco vazio vira admin, demais user");

        g.MapPost("/refresh", async Task<Results<Ok<LoginResponse>, UnauthorizedHttpResult>> (
                RefreshTokenRequest request,
                AuthService authService) =>
            {
                var response = await authService.RefreshAccessTokenAsync(request.RefreshToken);
                return response != null
                    ? TypedResults.Ok(response)
                    : TypedResults.Unauthorized();
            })
            .AddEndpointFilter(new ValidationFilter<RefreshTokenRequest>())
            .Produces<LoginResponse>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status401Unauthorized)
            .WithSummary("Renovar access token (OAuth2 refresh token grant, RFC 6749)");
    }

    public static void MapUserEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/users").WithTags("Users");

        g.MapGet("/", async Task<Ok<List<UserDto>>> (AuthService auth) =>
                TypedResults.Ok(await auth.ListUsersAsync()))
            .RequireAuthorization(AuthPolicies.AdminOnly)
            .Produces<List<UserDto>>(StatusCodes.Status200OK);

        g.MapGet("/me", Ok<UserDto> (ClaimsPrincipal principal) =>
                TypedResults.Ok(new UserDto
                {
                    Id = principal.FindFirstValue(ClaimTypes.NameIdentifier) ?? "",
                    Username = principal.FindFirstValue(ClaimTypes.Name) ?? "",
                    Email = principal.FindFirstValue(ClaimTypes.Email) ?? "",
                    Role = principal.FindFirstValue(ClaimTypes.Role) ?? ""
                }))
            .RequireAuthorization()
            .Produces<UserDto>(StatusCodes.Status200OK);

        g.MapPost("/staff", async Task<Results<Created<UserDto>, BadRequest<object>>> (
                StaffUserCreateDto dto,
                AuthService authService,
                ClaimsPrincipal principal) =>
            {
                var callerRole = principal.FindFirstValue(ClaimTypes.Role) ?? "";
                var (success, error, created) = await authService.RegisterStaffAsync(dto, callerRole);
                if (!success || created == null)
                    return TypedResults.BadRequest<object>(new { message = error });

                return TypedResults.Created($"/api/users/{created.Id}", created);
            })
            .AddEndpointFilter(new ValidationFilter<StaffUserCreateDto>())
            .RequireAuthorization(AuthPolicies.AdminOnly)
            .Produces<UserDto>(StatusCodes.Status201Created)
            .Produces(StatusCodes.Status400BadRequest)
            .WithSummary("Criar garçom ou admin (somente admin/superadmin)");

        g.MapDelete("/{id}", async Task<Results<Ok<object>, BadRequest<object>>> (
                string id,
                AuthService authService,
                ClaimsPrincipal principal) =>
            {
                var callerRole = principal.FindFirstValue(ClaimTypes.Role) ?? "";
                var (success, error) = await authService.DeleteUserAsync(id, callerRole);
                
                if (!success)
                    return TypedResults.BadRequest<object>(new { message = error });
                    
                return TypedResults.Ok<object>(new { message = "Usuário excluído com sucesso." });
            })
            .RequireAuthorization(AuthPolicies.AdminOnly)
            .Produces(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status400BadRequest)
            .WithSummary("Excluir usuário (admin normal não exclui superadmin)");
        g.MapPut("/{id}", async Task<Results<Ok<object>, BadRequest<object>>> (
                string id,
                UserUpdateDto dto,
                AuthService authService,
                ClaimsPrincipal principal) =>
            {
                var callerRole = principal.FindFirstValue(ClaimTypes.Role) ?? "";
                var (success, error) = await authService.UpdateUserAsync(id, dto, callerRole);
                
                if (!success)
                    return TypedResults.BadRequest<object>(new { message = error });
                    
                return TypedResults.Ok<object>(new { message = "Usuário atualizado com sucesso." });
            })
            .AddEndpointFilter(new ValidationFilter<UserUpdateDto>())
            .RequireAuthorization(AuthPolicies.AdminOnly)
            .Produces(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status400BadRequest)
            .WithSummary("Atualizar usuário (admin normal não promove a superadmin)");
    }
}
