import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import {
    LayoutDashboard,
    Users,
    UtensilsCrossed,
    BarChart3,
    Settings,
    LogOut,
    ChefHat,
} from "lucide-react";
import * as Tooltip from "@radix-ui/react-tooltip";
import styles from "./AdminLayout.module.scss";

export function AdminLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const logout = useAuthStore((s) => s.logout);
    const user = useAuthStore((s) => s.user);

    const navItems = [
        { icon: <LayoutDashboard size={20} />, label: "Dashboard", path: "/admin" },
        { icon: <Users size={20} />, label: "Usuários", path: "/admin/users" },
        { icon: <UtensilsCrossed size={20} />, label: "Produtos", path: "/admin/products" },
        { icon: <ChefHat size={20} />, label: "Mesas", path: "/admin/tables" },
        { icon: <BarChart3 size={20} />, label: "Relatórios", path: "/admin/reports" },
        { icon: <Settings size={20} />, label: "Configurações", path: "/admin/settings" },
    ];

    return (
        <Tooltip.Provider delayDuration={200}>
            <div className={styles.layout}>
                {/* ================= SIDEBAR ================= */}
                <aside className={styles.sidebar}>
                    {/* LOGO */}
                    <div className={styles.logoWrapper}>
                        <div className={styles.logoIcon}>
                            <span>g</span>
                        </div>
                        <span className={styles.logoText}>
                            Garçom
                        </span>
                    </div>

                    {/* PERFIL */}
                    <div className={styles.profile}>
                        <div className={styles.avatar}>
                            {user?.username?.[0]?.toUpperCase() ?? "A"}
                        </div>
                        <div className={styles.info}>
                            <p className={styles.name}>{user?.username ?? "Admin"}</p>
                            <p className={styles.role}>Administrador</p>
                        </div>
                    </div>

                    {/* DIVIDER */}
                    <div className={styles.menuDivider}>
                        Menu
                    </div>

                    {/* NAV ITEMS */}
                    <nav className={styles.nav}>
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path ||
                                (item.path !== "/admin" && location.pathname.startsWith(item.path));
                            return (
                                <AdminSidebarItem
                                    key={item.path}
                                    icon={item.icon}
                                    label={item.label}
                                    active={isActive}
                                    onClick={() => navigate(item.path)}
                                />
                            );
                        })}
                    </nav>

                    {/* LOGOUT */}
                    <div className={styles.mtAuto}>
                        <AdminSidebarItem
                            icon={<LogOut size={20} />}
                            label="Sair"
                            danger
                            onClick={() => {
                                logout();
                                navigate("/login");
                            }}
                        />
                    </div>
                </aside>

                {/* ================= CONTEÚDO ================= */}
                <div className={styles.mainContent}>
                    <main>
                        <Outlet />
                    </main>
                </div>
            </div>
        </Tooltip.Provider>
    );
}

// ---- Sidebar Item Component ----
interface AdminSidebarItemProps {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    active?: boolean;
    danger?: boolean;
}

function AdminSidebarItem({ icon, label, onClick, active, danger }: AdminSidebarItemProps) {
    return (
        <Tooltip.Root>
            <Tooltip.Trigger asChild>
                <button
                    onClick={onClick}
                    className={`
                        ${styles.itemButton}
                        ${active ? styles.active : styles.inactive}
                        ${danger ? styles.danger : ""}
                    `}
                >
                    <div className={styles.iconWrapper}>
                        {icon}
                    </div>
                    <span className={styles.labelText}>
                        {label}
                    </span>
                </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
                <Tooltip.Content 
                    side="right" 
                    sideOffset={10} 
                    className={styles.tooltipContent}
                >
                    {label}
                    <Tooltip.Arrow style={{ fill: '#3a3232' }} />
                </Tooltip.Content>
            </Tooltip.Portal>
        </Tooltip.Root>
    );
}
