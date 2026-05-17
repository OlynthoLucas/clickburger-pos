import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useOrderStore } from "../store/orderStore";
import {
    Home,
    User,
    Settings,
    LogOut,
    UtensilsCrossed
} from "lucide-react";
import styles from "./Sidebar.module.scss";

export function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const logout = useAuthStore((s) => s.logout);
    const orders = useOrderStore((s) => s.orders);

    // 🔥 pedidos enviados = badge da cozinha
    const pedidosCozinha = orders.filter(o => o.status === "enviado").length;

    return (
        <aside className={styles.sidebar}>

            {/* ================= LOGO ================= */}
            <div className={styles.logoWrapper}>
                <div className={styles.logoIcon}>
                    🍔
                </div>
            </div>

            {/* ================= PRINCIPAL ================= */}
            <nav className={styles.nav}>

                <SidebarItem
                    icon={<Home size={20} />}
                    label="Dashboard"
                    active={location.pathname === "/waiter"}
                    onClick={() => navigate("/waiter")}
                />

                {/* 🔥 COZINHA (PRINCIPAL) */}
                <SidebarItem
                    icon={<UtensilsCrossed size={20} />}
                    label="Cozinha"
                    active={location.pathname === "/kitchen"}
                    onClick={() => navigate("/kitchen")}
                    badge={pedidosCozinha}
                    highlight
                />

            </nav>

            {/* ================= DIVISOR ================= */}
            <div className={styles.divider} />

            {/* ================= SECUNDÁRIO ================= */}
            <nav className={styles.nav}>

                <SidebarItem
                    icon={<User size={20} />}
                    label="Perfil"
                    active={location.pathname === "/profile"}
                    onClick={() => navigate("/profile")}
                />

                <SidebarItem
                    icon={<Settings size={20} />}
                    label="Configurações"
                    active={location.pathname === "/settings"}
                    onClick={() => navigate("/admin/settings")}
                />

            </nav>

            {/* ================= LOGOUT ================= */}
            <div className={styles.mtAuto}>
                <SidebarItem
                    icon={<LogOut size={20} />}
                    label="Sair"
                    onClick={() => {
                        logout();
                        navigate("/login");
                    }}
                    danger
                />
            </div>
        </aside>
    );
}

interface SidebarItemProps {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    active?: boolean;
    danger?: boolean;
    badge?: number;
    highlight?: boolean;
}

function SidebarItem({
    icon,
    label,
    onClick,
    active,
    danger,
    badge,
    highlight
}: SidebarItemProps) {

    return (
        <div className={styles.itemWrapper}>

            <button
                onClick={onClick}
                className={`
                    ${styles.button}
                    ${active ? styles.active : ""}
                    ${danger ? styles.danger : ""}
                    ${highlight ? styles.highlight : ""}
                `}
            >

                {/* ÍCONE + BADGE */}
                <div className={styles.iconWrapper}>
                    {icon}

                    {badge && badge > 0 && (
                        <span className={styles.badge}>
                            {badge}
                        </span>
                    )}
                </div>

                {/* TEXTO */}
                <span className={styles.labelText}>
                    {label}
                </span>
            </button>

            {/* TOOLTIP */}
            <div className={styles.tooltip}>
                {label}
            </div>
        </div>
    );
}