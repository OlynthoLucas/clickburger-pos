using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using ClickBurger.Models;

namespace ClickBurger.Authorization;

public static class AuthPolicies
{
    public const string SuperAdminOnly = "SuperAdminOnly";
    public const string AdminOnly = "AdminOnly";
    public const string Staff = "Staff";
    public const string AnyUser = "AnyUser";

    public static void AddClickBurgerAuthorization(this IServiceCollection services)
    {
        var scheme = JwtBearerDefaults.AuthenticationScheme;

        services.AddAuthorization(options =>
        {
            options.DefaultPolicy = new AuthorizationPolicyBuilder()
                .AddAuthenticationSchemes(scheme)
                .RequireAuthenticatedUser()
                .Build();

            options.AddPolicy(SuperAdminOnly, p =>
            {
                p.AddAuthenticationSchemes(scheme);
                p.RequireRole(UserRoles.SUPERADMIN);
            });

            options.AddPolicy(AdminOnly, p =>
            {
                p.AddAuthenticationSchemes(scheme);
                p.RequireRole(UserRoles.SUPERADMIN, UserRoles.ADMIN);
            });

            options.AddPolicy(Staff, p =>
            {
                p.AddAuthenticationSchemes(scheme);
                p.RequireRole(UserRoles.SUPERADMIN, UserRoles.ADMIN, UserRoles.GARCOM, UserRoles.COZINHA);
            });

            options.AddPolicy(AnyUser, p =>
            {
                p.AddAuthenticationSchemes(scheme);
                p.RequireRole(UserRoles.SUPERADMIN, UserRoles.ADMIN, UserRoles.GARCOM, UserRoles.USER, UserRoles.COZINHA);
            });
        });
    }
}
