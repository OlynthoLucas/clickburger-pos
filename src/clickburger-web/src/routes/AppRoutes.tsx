import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AdminLayout } from "../layouts/AdminLayout";
import { AuthLayout } from "../layouts/AuthLayout";
import { defaultRouteForRole } from "../lib/authRouting";
import Home from "../pages/Home";
import Kitchen from "../pages/Kitchen";
import { Profile } from "../pages/Profile";
import AdminDashboard from "../pages/admin/AdminDashboard";
import ProductsAdmin from "../pages/admin/ProductsAdmin";
import TablesAdmin from "../pages/admin/TablesAdmin";
import ReportsAdmin from "../pages/admin/ReportsAdmin";
import { UsersAdmin } from "../pages/admin/UsersAdmin";
import { Login } from "../pages/auth/Login";
import { Register } from "../pages/auth/Register";
import { useAuthStore } from "../store/authStore";
import { ProtectedRoute } from "./ProtectedRoute";
import { RoleRoute } from "./RoleRoute";

const ADMIN_ROLES = ["superadmin", "admin"];
const KITCHEN_ROLES = ["superadmin", "admin", "garcom", "cozinha"];
/** Inclui `user` (cadastro público pela API) para poder usar a área do garçom. */
const WAITER_ROLES = ["superadmin", "admin", "garcom", "cozinha", "user"];

export const AppRoutes = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  return (
    <BrowserRouter>
      <Routes>
        {/* ================= ROTAS PÚBLICAS ================= */}
        <Route element={<AuthLayout />}>
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to={defaultRouteForRole(user?.role)} replace />
              ) : (
                <Login />
              )
            }
          />

          <Route path="/register" element={<Register />} />
        </Route>

        {/* ================= ROTA RAIZ ================= */}
        <Route
          path="/"
          element={
            <Navigate
              to={isAuthenticated ? defaultRouteForRole(user?.role) : "/login"}
              replace
            />
          }
        />

        {/* ================= ROTAS PROTEGIDAS ================= */}
        <Route element={<ProtectedRoute />}>
          {/* ---- ADMIN (com AdminLayout) ---- */}
          <Route element={<RoleRoute allowedRoles={ADMIN_ROLES} />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<UsersAdmin />} />
              <Route path="/admin/products" element={<ProductsAdmin />} />
              <Route path="/admin/tables" element={<TablesAdmin />} />
              <Route path="/admin/reports" element={<ReportsAdmin />} />
              <Route path="/admin/settings" element={<ProductsAdmin />} />
            </Route>
          </Route>

          {/* ---- COZINHA ---- */}
          <Route element={<RoleRoute allowedRoles={KITCHEN_ROLES} />}>
            <Route path="/kitchen" element={<Kitchen />} />
          </Route>

          {/* ---- GARÇOM ---- */}
          <Route element={<RoleRoute allowedRoles={WAITER_ROLES} />}>
            <Route path="/waiter" element={<Home />} />
          </Route>

          {/* ---- PERFIL ---- */}
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* ================= FALLBACK ================= */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
