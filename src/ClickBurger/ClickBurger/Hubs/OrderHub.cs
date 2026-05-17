using Microsoft.AspNetCore.SignalR;
using ClickBurger.Authorization;
using Microsoft.AspNetCore.Authorization;

namespace ClickBurger.Hubs;

/// <summary>
/// Hub SignalR para eventos de pedidos em tempo real.
/// Grupos disponíveis:
///   - "staff"  → garçons e cozinha
///   - "admin"  → superadmin e admin
/// </summary>
[Authorize(Policy = AuthPolicies.Staff)]
public class OrderHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var user = Context.User;

        // Adiciona ao grupo correto baseado no role
        if (user?.IsInRole("superadmin") == true || user?.IsInRole("admin") == true)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, "admin");
            await Groups.AddToGroupAsync(Context.ConnectionId, "staff");
        }
        else
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, "staff");
        }

        await base.OnConnectedAsync();
    }
}
