import axios from "axios";
import {
    ArrowUpRight,
    Bell,
    ChefHat,
    ChevronDown,
    ChevronUp,
    Clock,
    DollarSign,
    Pause,
    Play,
    RefreshCw,
    Search,
    TrendingUp,
    Users,
    UtensilsCrossed,
    Wifi,
    WifiOff,
    X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api from "../../services/api";
import {
    fetchCashHistory,
    fetchSalesReport,
    type CashSessionDto,
    type SalesReportDto,
} from "../../services/reportsApi";
import { useCashStore } from "../../store/cashStore";
import { useOrderHub } from "../../services/useOrderHub";
import {
    fetchDashboardStats,
    type DashboardStatsDto,
} from "../../services/reportsApi";
import styles from "./AdminDashboard.module.scss";

const AUTO_REFRESH_INTERVAL = 30;

interface UserRow {
    id: string;
    username: string;
    email: string;
    role: string;
}

function toISODate(d: Date) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function addDays(base: Date, deltaDays: number) {
    const d = new Date(base);
    d.setDate(d.getDate() + deltaDays);
    return d;
}

function formatBRL(value: number) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function parseApiMessage(err: unknown): string {
    if (axios.isAxiosError(err)) {
        const data = err.response?.data as { message?: string } | undefined;
        if (data?.message) return data.message;
        if (typeof err.response?.data === "string") return err.response.data;
    }
    if (err instanceof Error) return err.message;
    return "Não foi possível carregar os dados.";
}


const ROLE_BADGE: Record<string, string> = {
    superadmin: `${styles.bgRed100} ${styles.textRed600}`,
    admin: `${styles.bgRed100} ${styles.textRed600}`,
    garcom: `${styles.bgBlue100} ${styles.textBlue700}`,
    cozinha: `${styles.bgGreen100} ${styles.textGreen700}`,
    user: `${styles.bgAmber50} ${styles.textAmber600}`,
};

const ROLE_LABEL: Record<string, string> = {
    superadmin: "Superadmin",
    admin: "Admin",
    garcom: "Garçom",
    cozinha: "Cozinha",
    user: "Cliente",
};

export default function AdminDashboard() {
    const navigate = useNavigate();

    const { isOpen, session, syncCash, closeCash } = useCashStore();

    // ── DADOS GERAIS ──────────────────────────────────────────────────────────
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<UserRow[]>([]);
    const [productCount, setProductCount] = useState(0);
    const [todayReport, setTodayReport] = useState<SalesReportDto | null>(null);
    const [yesterdayReport, setYesterdayReport] = useState<SalesReportDto | null>(null);
    const [dashboardStats, setDashboardStats] = useState<DashboardStatsDto | null>(null);
    const [userSearch, setUserSearch] = useState("");
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    // ── AUTO-REFRESH ──────────────────────────────────────────────────────────
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [countdown, setCountdown] = useState(AUTO_REFRESH_INTERVAL);

    // ── CAIXA ─────────────────────────────────────────────────────────────────
    const [history, setHistory] = useState<CashSessionDto[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [closeModalOpen, setCloseModalOpen] = useState(false);
    const [closing, setClosing] = useState(false);

    const { status: hubStatus, orders: liveOrders, lastEvent } = useOrderHub({
        maxEvents: 30,
    });

    const mountedRef = useRef(true);
    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    // ── LOAD ALL DATA ─────────────────────────────────────────────────────────

    const loadData = useCallback(async () => {
        if (!mountedRef.current) return;
        setLoading(true);
        const todayStr = toISODate(new Date());
        const yesterdayStr = toISODate(addDays(new Date(), -1));

        const settled = await Promise.allSettled([
            api.get<UserRow[]>("/api/users"),
            api.get<unknown[]>("/api/menu/admin"),
            fetchSalesReport(todayStr, todayStr),
            fetchSalesReport(yesterdayStr, yesterdayStr),
            fetchDashboardStats(),
        ]);

        if (!mountedRef.current) return;

        const errs: string[] = [];

        if (settled[0].status === "fulfilled") setUsers(settled[0].value.data ?? []);
        else { setUsers([]); errs.push("usuários"); }

        if (settled[1].status === "fulfilled") setProductCount(settled[1].value.data?.length ?? 0);
        else { setProductCount(0); errs.push("cardápio"); }

        if (settled[2].status === "fulfilled") setTodayReport(settled[2].value);
        else { setTodayReport(null); errs.push("relatório de hoje"); }

        if (settled[3].status === "fulfilled") setYesterdayReport(settled[3].value);
        else { setYesterdayReport(null); errs.push("relatório de ontem"); }

        if (settled[4].status === "fulfilled") setDashboardStats(settled[4].value);
        else { setDashboardStats(null); errs.push("estatísticas do dashboard"); }

        if (errs.length > 0) {
            const firstRejected = settled.find((s): s is PromiseRejectedResult => s.status === "rejected");
            toast.error(
                errs.length === 5 && firstRejected
                    ? parseApiMessage(firstRejected.reason)
                    : `Não foi possível carregar: ${errs.join(", ")}.`
            );
        }

        setLastUpdated(new Date());
        setCountdown(AUTO_REFRESH_INTERVAL);
        setLoading(false);
    }, []);

    useEffect(() => {
        async function init() {
            await syncCash();
            await loadData();
        }
        init().catch(console.error);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Atualiza ao receber qualquer evento via SignalR
    useEffect(() => {
        if (lastEvent) {
            loadData().catch(console.error);
        }
    }, [lastEvent, loadData]);

    // ── AUTO-REFRESH TIMER ────────────────────────────────────────────────────

    useEffect(() => {
        if (!autoRefresh) return;
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    loadData().catch(console.error);
                    return AUTO_REFRESH_INTERVAL;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [autoRefresh, loadData]);

    // ── HISTÓRICO ─────────────────────────────────────────────────────────────

    async function loadHistory() {
        setLoadingHistory(true);
        try {
            const data = await fetchCashHistory();
            if (mountedRef.current) setHistory(data);
        } catch { /* silencioso */ }
        finally { if (mountedRef.current) setLoadingHistory(false); }
    }

    function handleToggleHistory() {
        if (!showHistory && history.length === 0) loadHistory().catch(console.error);
        setShowHistory((v) => !v);
    }

    // ── FECHAR CAIXA ──────────────────────────────────────────────────────────

    async function handleCloseCash() {
        setClosing(true);
        try {
            await closeCash();
            setCloseModalOpen(false);
            await loadData();
        } catch { /* mantém modal */ }
        finally { if (mountedRef.current) setClosing(false); }
    }

    // ── HELPERS ───────────────────────────────────────────────────────────────

    function formatTime(iso: string) {
        return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    }

    function formatDate(iso: string) {
        return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
    }

    function sessionDuration(s: CashSessionDto) {
        const end = s.closedAt ? new Date(s.closedAt) : new Date();
        const diffMs = end.getTime() - new Date(s.openedAt).getTime();
        const h = Math.floor(diffMs / 3600000);
        const m = Math.floor((diffMs % 3600000) / 60000);
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    }

    // ── STATS ─────────────────────────────────────────────────────────────────

    const recentUsers = useMemo(() => {
        const q = userSearch.trim().toLowerCase();
        const sorted = [...users].sort((a, b) => b.id.localeCompare(a.id));
        const filtered = q
            ? sorted.filter(u => u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
            : sorted;
        return filtered.slice(0, 5);
    }, [users, userSearch]);

    const stats = useMemo(() => {
        const ordersToday = todayReport?.ordersCount ?? 0;
        const revenueToday = todayReport?.revenue ?? 0;
        return [
            {
                id: "stat-revenue", title: "Faturamento (Hoje)",
                value: loading ? "—" : formatBRL(Number(revenueToday)),
                change: loading ? "…" : `${ordersToday} pedidos hoje`,
                positive: true, icon: <DollarSign size={24} />,
                lightColor: styles.bgEmerald50, textColor: styles.textEmerald600,
                DeltaIcon: ArrowUpRight,
            },
            {
                id: "stat-orders", title: "Pedidos em Andamento",
                value: loading ? "—" : String(dashboardStats?.activeOrders ?? 0),
                change: loading ? "…" : `${dashboardStats?.closedOrders ?? 0} finalizados (${dashboardStats?.totalOrders ?? 0} total)`,
                positive: true, icon: <TrendingUp size={24} />,
                lightColor: styles.bgBlue50, textColor: styles.textBlue600,
                DeltaIcon: ArrowUpRight,
            },
            {
                id: "stat-tables", title: "Mesas",
                value: loading ? "—" : String(dashboardStats?.totalTables ?? 0),
                change: loading ? "…" : `${dashboardStats?.occupiedTables ?? 0} ocupadas / ${dashboardStats?.freeTables ?? 0} livres`,
                positive: true, icon: <ChefHat size={24} />,
                lightColor: styles.bgAmber50, textColor: styles.textAmber600,
                DeltaIcon: ArrowUpRight,
            },
            {
                id: "stat-products", title: "Cadastros",
                value: loading ? "—" : `${dashboardStats?.totalProducts ?? productCount} produtos`,
                change: loading ? "…" : `${dashboardStats?.activeUsers ?? users.length} usuários ativos`,
                positive: true, icon: <Users size={24} />,
                lightColor: styles.bgRed50, textColor: styles.textRed600,
                DeltaIcon: ArrowUpRight,
            },
        ];
    }, [loading, users.length, productCount, todayReport, yesterdayReport, dashboardStats]);

    const hubConnected = hubStatus === "connected";

    return (
        <div className={styles.dashboard}>

            {/* ===== HEADER ===== */}
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Painel Admin</h1>
                    <p className={styles.subtitle}>
                        Visão geral do sistema ClickBurger
                        {lastUpdated && (
                            <span className={styles.lastUpdated}>
                                {" "}· atualizado às {lastUpdated.toLocaleTimeString("pt-BR", {
                                    hour: "2-digit", minute: "2-digit", second: "2-digit",
                                })}
                            </span>
                        )}
                    </p>
                </div>
                <div className={styles.headerActions}>
                    <div className={styles.searchBox}>
                        <input
                            type="text"
                            placeholder="Filtrar usuários recentes..."
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                        />
                        <Search size={18} className={styles.searchIcon} />
                    </div>

                    {/* Hub status */}
                    <div className={`${styles.hubStatus} ${hubConnected ? styles.hubConnected : styles.hubDisconnected}`}
                        title={hubConnected ? "Tempo real ativo" : "Sem conexão em tempo real"}>
                        {hubConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
                        <span>{hubConnected ? "Ao vivo" : "Offline"}</span>
                    </div>

                    {/* Refresh controls */}
                    <div className={styles.refreshControls}>
                        <button className={styles.refreshBtn}
                            onClick={() => { loadData().catch(console.error); }}
                            title="Atualizar agora">
                            <RefreshCw size={16} className={loading ? styles.spinning : ""} />
                        </button>
                        <button
                            className={`${styles.autoRefreshBtn} ${autoRefresh ? styles.autoRefreshActive : ""}`}
                            onClick={() => setAutoRefresh(v => !v)}>
                            {autoRefresh ? <Pause size={14} /> : <Play size={14} />}
                            {autoRefresh
                                ? <span className={styles.countdown}>{countdown}s</span>
                                : <span>Pausado</span>}
                        </button>
                    </div>

                    <button type="button" className={styles.notifications} aria-label="Notificações">
                        <Bell size={24} />
                        <span className={styles.badge} />
                    </button>
                </div>
            </div>

            {/* ===== STATS GRID ===== */}
            <div className={styles.statsGrid}>
                {stats.map((stat) => {
                    const DeltaIco = stat.DeltaIcon;
                    return (
                        <div key={stat.id} id={stat.id} className={styles.statCard}>
                            <div className={styles.statHeader}>
                                <div className={`${styles.iconWrapper} ${stat.lightColor} ${stat.textColor}`}>
                                    {stat.icon}
                                </div>
                                <span className={`${styles.changeBadge} ${stat.positive ? styles.positive : styles.negative}`}>
                                    <DeltaIco size={14} />
                                    {stat.change}
                                </span>
                            </div>
                            <div>
                                <p className={styles.statTitle}>{stat.title}</p>
                                <p className={styles.statValue}>{stat.value}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ===== CONTENT ROW ===== */}
            <div className={styles.contentRow}>

                {/* RECENT USERS */}
                <div className={styles.recentUsers}>
                    <div className={styles.recentHeader}>
                        <h2>Usuários Recentes</h2>
                        <button id="btn-manage-users" onClick={() => navigate("/admin/users")} className={styles.viewAll}>
                            Ver todos <ArrowUpRight size={16} />
                        </button>
                    </div>
                    <div className={styles.usersList}>
                        {loading ? (
                            <p className={styles.emptyMessage}>Carregando usuários…</p>
                        ) : recentUsers.length === 0 ? (
                            <p className={styles.emptyMessage}>
                                {userSearch.trim() ? "Nenhum usuário encontrado." : "Nenhum usuário cadastrado."}
                            </p>
                        ) : (
                            recentUsers.map((u) => (
                                <div key={u.id} className={styles.userItem}>
                                    <div className={styles.userInfo}>
                                        <div className={styles.avatar}>{u.username[0]?.toUpperCase() ?? "?"}</div>
                                        <div>
                                            <p className={styles.userName}>{u.username}</p>
                                            <p className={styles.userEmail}>{u.email}</p>
                                        </div>
                                    </div>
                                    <div className={styles.userMeta}>
                                        <span className={`${styles.roleBadge} ${ROLE_BADGE[u.role] ?? `${styles.bgAmber50} ${styles.textAmber600}`}`}>
                                            {ROLE_LABEL[u.role] ?? u.role}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* CAIXA + AÇÕES */}
                <div className={styles.rightCol}>

                    {/* ── CAIXA CARD ── */}
                    <div className={`${styles.cashCard} ${!isOpen ? styles.cashClosed : ""}`}>
                        <div className={styles.cashHeader}>
                            <div>
                                <p className={styles.cashTitle}>
                                    <span className={isOpen ? styles.dotGreen : styles.dotRed} />
                                    {isOpen ? "Caixa Aberto" : "Caixa Fechado"}
                                </p>
                                <p className={styles.cashValue}>
                                    {loading ? "—" : formatBRL((isOpen ? (session?.initialValue ?? 0) : 0) + Number(todayReport?.revenue ?? 0))}
                                </p>
                                <p className={styles.cashSubtitle}>
                                    {loading ? "Carregando…" : `${todayReport?.ordersCount ?? 0} pedidos fechados hoje`}
                                </p>
                                {isOpen && session && (session.initialValue ?? 0) > 0 && (
                                    <p className={styles.cashSubtitle}>
                                        Inicial {formatBRL(session.initialValue)} + vendas {formatBRL(Number(todayReport?.revenue ?? 0))}
                                    </p>
                                )}
                            </div>
                            {isOpen && (
                                <div className={styles.cashLiveTag}>
                                    <span className={styles.liveDot} />AO VIVO
                                </div>
                            )}
                        </div>

                        {isOpen && session && (
                            <div className={styles.sessionDetails}>
                                <div className={styles.sessionRow}>
                                    <Clock size={14} />
                                    <span>Aberto às {formatTime(session.openedAt)} por <strong>{session.openedBy}</strong></span>
                                </div>
                                <div className={styles.sessionRow}>
                                    <span>Duração: <strong>{sessionDuration(session)}</strong></span>
                                </div>
                                <div className={styles.sessionRow}>
                                    <span>Valor inicial: <strong>{formatBRL(session.initialValue)}</strong></span>
                                </div>
                            </div>
                        )}

                        {isOpen && todayReport && (
                            <div className={styles.liveMetrics}>
                                <div className={styles.liveMetric}>
                                    <span>Faturado</span>
                                    <strong>{formatBRL(Number(todayReport.revenue))}</strong>
                                </div>
                                <div className={styles.liveMetricDivider} />
                                <div className={styles.liveMetric}>
                                    <span>Pedidos</span>
                                    <strong>{todayReport.ordersCount}</strong>
                                </div>
                                <div className={styles.liveMetricDivider} />
                                <div className={styles.liveMetric}>
                                    <span>Ticket médio</span>
                                    <strong>{formatBRL(Number(todayReport.averageTicket))}</strong>
                                </div>
                            </div>
                        )}

                        {isOpen && (
                            <button className={styles.closeCashBtn} onClick={() => setCloseModalOpen(true)}>
                                Fechar caixa
                            </button>
                        )}

                        <button className={styles.historyToggle} onClick={handleToggleHistory}>
                            {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            {showHistory ? "Ocultar histórico" : "Ver histórico de sessões"}
                        </button>

                        {showHistory && (
                            <div className={styles.historyList}>
                                {loadingHistory && <p className={styles.historyEmpty}>Carregando...</p>}
                                {!loadingHistory && history.length === 0 && (
                                    <p className={styles.historyEmpty}>Nenhuma sessão registrada.</p>
                                )}
                                {history.map((s) => (
                                    <div key={s.id} className={styles.historyItem}>
                                        <div className={styles.historyLeft}>
                                            <span className={s.isOpen ? styles.dotGreen : styles.dotGray} />
                                            <div>
                                                <p className={styles.historyDate}>{formatDate(s.openedAt)}</p>
                                                <p className={styles.historyMeta}>
                                                    {formatTime(s.openedAt)}{s.closedAt && ` → ${formatTime(s.closedAt)}`}
                                                    {" · "}{sessionDuration(s)}
                                                </p>
                                                <p className={styles.historyMeta}>por {s.openedBy}</p>
                                            </div>
                                        </div>
                                        <div className={styles.historyRight}>
                                            <span className={`${styles.historyStatus} ${s.isOpen ? styles.historyOpen : styles.historyClosed}`}>
                                                {s.isOpen ? "Aberto" : "Fechado"}
                                            </span>
                                            <p className={styles.historyInitial}>Inicial: {formatBRL(s.initialValue)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* AÇÕES RÁPIDAS */}
                    <div className={styles.quickActions}>
                        <h2>Ações Rápidas</h2>
                        <div className={styles.actionsList}>
                            <QuickAction id="qa-users" icon={<Users size={20} />} label="Gerenciar Usuários"
                                color={`${styles.textBlue600} ${styles.bgBlue50}`} onClick={() => navigate("/admin/users")} />
                            <QuickAction id="qa-products" icon={<UtensilsCrossed size={20} />} label="Gerenciar Produtos"
                                color={`${styles.textRed600} ${styles.bgRed50}`} onClick={() => navigate("/admin/products")} />
                            <QuickAction id="qa-tables" icon={<ChefHat size={20} />} label="Gerenciar Mesas"
                                color={`${styles.textAmber600} ${styles.bgAmber50}`} onClick={() => navigate("/admin/tables")} />
                        </div>
                    </div>
                </div>
            </div>

            {/* ===== PEDIDOS EM TEMPO REAL ===== */}
            <div className={styles.realtimeSection}>
                <div className={styles.realtimeHeader}>
                    <div>
                        <h2>Pedidos — Tempo Real</h2>
                        <p>Atualizações via WebSocket · {liveOrders.length} pedido{liveOrders.length !== 1 ? "s" : ""} recente{liveOrders.length !== 1 ? "s" : ""}</p>
                    </div>
                    <div className={`${styles.hubPill} ${hubConnected ? styles.hubPillOn : styles.hubPillOff}`}>
                        {hubConnected ? <Wifi size={13} /> : <WifiOff size={13} />}
                        {hubConnected ? "Conectado" : hubStatus === "connecting" ? "Conectando..." : "Desconectado"}
                    </div>
                </div>

                {liveOrders.length === 0 ? (
                    <div className={styles.realtimeEmpty}>
                        <p>Nenhuma atividade recente recebida.</p>
                        <p>Os pedidos aparecerão aqui automaticamente quando criados ou atualizados.</p>
                    </div>
                ) : (
                    <div className={styles.realtimeGrid}>
                        {liveOrders.map((order) => (
                            <div key={order.id} className={styles.realtimeCard}>
                                <div className={styles.realtimeCardHeader}>
                                    <div>
                                        <span className={styles.realtimeTable}>Mesa {order.tableNumber}</span>
                                        <span className={`${styles.badge} ${styles[order.status.toLowerCase()] || styles.defaultBadge}`}>
                                            {order.status}
                                        </span>
                                        <span className={styles.realtimeTime}>
                                            {order.closedAt ? formatTime(order.closedAt) : formatTime(order.updatedAt)}
                                        </span>
                                    </div>
                                    <span className={styles.realtimeTotal}>{formatBRL(order.total)}</span>
                                </div>
                                <div className={styles.realtimeItems}>
                                    {order.items.map((item, i) => (
                                        <div key={i} className={styles.realtimeItem}>
                                            <span>{item.quantity}x {item.menuItemName}</span>
                                            <span>{formatBRL(item.unitPrice * item.quantity)}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className={styles.realtimeFooter}>
                                    <span className={styles.realtimePayment}>
                                        {order.paymentMethod?.toLowerCase() ?? "—"}
                                    </span>
                                    <span className={`${styles.realtimeStatus} ${styles.realtimeStatusFechado}`}>
                                        Fechado
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ===== MODAL FECHAR CAIXA ===== */}
            {closeModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.closeModal}>
                        <div className={styles.closeModalHeader}>
                            <h2>Fechar Caixa</h2>
                            <button className={styles.closeModalX} onClick={() => setCloseModalOpen(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className={styles.closeSummary}>
                            <p className={styles.closeSummaryTitle}>Resumo do dia</p>
                            <div className={styles.closeSummaryGrid}>
                                <div className={styles.closeSummaryItem}>
                                    <span>Faturamento total</span>
                                    <strong>{formatBRL(Number(todayReport?.revenue ?? 0))}</strong>
                                </div>
                                <div className={styles.closeSummaryItem}>
                                    <span>Pedidos fechados</span>
                                    <strong>{todayReport?.ordersCount ?? 0}</strong>
                                </div>
                                <div className={styles.closeSummaryItem}>
                                    <span>Ticket médio</span>
                                    <strong>{formatBRL(Number(todayReport?.averageTicket ?? 0))}</strong>
                                </div>
                                <div className={styles.closeSummaryItem}>
                                    <span>Valor inicial</span>
                                    <strong>{formatBRL(session?.initialValue ?? 0)}</strong>
                                </div>
                                <div className={styles.closeSummaryItem}>
                                    <span>Duração</span>
                                    <strong>{session ? sessionDuration(session) : "—"}</strong>
                                </div>
                                <div className={styles.closeSummaryItem}>
                                    <span>Aberto por</span>
                                    <strong>{session?.openedBy ?? "—"}</strong>
                                </div>
                            </div>
                            {(todayReport?.topProducts.length ?? 0) > 0 && (
                                <div className={styles.closeTopProducts}>
                                    <p className={styles.closeTopTitle}>Top produtos do dia</p>
                                    {todayReport!.topProducts.slice(0, 3).map((p, i) => (
                                        <div key={p.menuItemId || p.name} className={styles.closeTopItem}>
                                            <span>#{i + 1} {p.name}</span>
                                            <span>{p.quantity}x · {formatBRL(p.revenue)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className={styles.closeModalActions}>
                            <button className={styles.closeModalCancel} onClick={() => setCloseModalOpen(false)} disabled={closing}>
                                Cancelar
                            </button>
                            <button className={styles.closeModalConfirm}
                                onClick={() => { handleCloseCash().catch(console.error); }} disabled={closing}>
                                {closing ? "Fechando..." : "Confirmar fechamento"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

interface QuickActionProps {
    id: string; icon: React.ReactNode; label: string; color: string; onClick: () => void;
}

function QuickAction({ id, icon, label, color, onClick }: QuickActionProps) {
    return (
        <button id={id} onClick={onClick} className={styles.actionItem}>
            <div className={styles.actionContent}>
                <div className={`${styles.actionIcon} ${color}`}>{icon}</div>
                <p className={styles.actionLabel}>{label}</p>
            </div>
            <ArrowUpRight size={18} className={styles.arrowIcon} />
        </button>
    );
}
