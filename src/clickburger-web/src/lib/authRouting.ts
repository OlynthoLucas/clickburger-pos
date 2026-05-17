/**
 * Destino após login conforme papel retornado pela API.
 */
export function defaultRouteForRole(role: string | undefined): string {
  switch (role) {
    case "superadmin":
    case "admin":
      return "/admin";
    case "cozinha":
      return "/kitchen";
    case "garcom":
    case "user":
    default:
      return "/waiter";
  }
}
