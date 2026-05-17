import { ShieldAlert, LogOut, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { defaultRouteForRole } from "../lib/authRouting";

/**
 * Pagina exibida quando um usuario autenticado tenta acessar uma rota
 * para a qual nao tem permissao. Substitui o redirect cego para /login,
 * que confundia o usuario ("logo, mas volta direto pra tela de login").
 */
export default function Forbidden() {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();

    const goHome = () => {
        if (user) {
            navigate(defaultRouteForRole(user.role), { replace: true });
        } else {
            navigate("/login", { replace: true });
        }
    };

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "2rem",
                background: "#fff7ed",
                color: "#3a3232",
                textAlign: "center",
            }}
        >
            <div
                style={{
                    width: 120,
                    height: 120,
                    borderRadius: "50%",
                    background: "#fee2e2",
                    color: "#b91c1c",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "1.5rem",
                }}
            >
                <ShieldAlert size={64} />
            </div>

            <h1 style={{ fontSize: "2rem", margin: 0, marginBottom: "0.5rem" }}>
                Acesso negado
            </h1>

            <p style={{ color: "#6b7280", maxWidth: 520, margin: 0, marginBottom: "0.5rem" }}>
                Voc\u00ea est\u00e1 logado como <strong>{user?.username ?? "usu\u00e1rio"}</strong>
                {user?.role ? (
                    <>
                        {" "}
                        (cargo: <strong>{user.role}</strong>)
                    </>
                ) : null}
                , mas n\u00e3o tem permiss\u00e3o para acessar essa \u00e1rea.
            </p>

            <p style={{ color: "#6b7280", maxWidth: 520, margin: 0, marginBottom: "2rem" }}>
                Se voc\u00ea precisa de acesso, pe\u00e7a ao administrador para ajustar o seu cargo
                em <code>/admin/users</code>.
            </p>

            <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                    onClick={goHome}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "0.6rem 1.25rem",
                        background: "#f97316",
                        color: "white",
                        border: "none",
                        borderRadius: 8,
                        fontSize: "0.95rem",
                        cursor: "pointer",
                    }}
                >
                    <Home size={18} />
                    Ir para a tela inicial
                </button>

                <button
                    onClick={handleLogout}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "0.6rem 1.25rem",
                        background: "transparent",
                        color: "#3a3232",
                        border: "1px solid #d1d5db",
                        borderRadius: 8,
                        fontSize: "0.95rem",
                        cursor: "pointer",
                    }}
                >
                    <LogOut size={18} />
                    Sair
                </button>
            </div>
        </div>
    );
}
