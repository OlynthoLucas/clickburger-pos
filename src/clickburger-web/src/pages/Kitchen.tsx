import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2, CheckCircle, Clock, Flame, LogOut } from "lucide-react";
import { useOrderStore } from "../store/orderStore";
import { useAuthStore } from "../store/authStore";
import { defaultRouteForRole } from "../lib/authRouting";
import type { Order, OrderItem } from "../store/orderStore";
import styles from "./Kitchen.module.scss";

export default function Kitchen() {
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);
    const { orders, markAsReady, cancelOrder, getOrdersByTable } = useOrderStore();

    const emPreparo = orders.filter(o => o.status === "enviado");
    const prontos = orders.filter(o => o.status === "pronto");

    function handleBack() {
        // Cozinha volta para /kitchen (recarrega), outros roles vão para sua rota padrão
        const role = user?.role;
        if (role === "cozinha") {
            navigate("/kitchen");
        } else {
            navigate(defaultRouteForRole(role));
        }
    }

    function handleCancelar(orderId: string, orderNumber: string) {
        if (!confirm(`Cancelar pedido ${orderNumber}? Esta ação não pode ser desfeita.`)) return;
        cancelOrder(orderId);
    }

    return (
        <div className={styles.container}>

            {/* ── HEADER ── */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    {user?.role !== "cozinha" && (
                        <button onClick={handleBack} className={styles.backButton}>
                            <ArrowLeft size={18} />
                        </button>
                    )}
                    <div className={styles.titleGroup}>
                        <h1 className={styles.title}>🍳 Cozinha</h1>
                        <p className={styles.subtitle}>Gerenciamento de pedidos em tempo real</p>
                    </div>
                </div>

                <div className={styles.summary}>
                    <div className={`${styles.badge} ${styles.warning}`}>
                        <Flame size={14} />
                        <span>Em preparo</span>
                        <span className={styles.badgeCount}>{emPreparo.length}</span>
                    </div>
                    <div className={`${styles.badge} ${styles.success}`}>
                        <CheckCircle size={14} />
                        <span>Prontos</span>
                        <span className={styles.badgeCount}>{prontos.length}</span>
                    </div>
                    <button
                        className={styles.logoutBtn}
                        onClick={() => { logout(); navigate("/login"); }}
                        title="Sair"
                    >
                        <LogOut size={16} />
                        <span>Sair</span>
                    </button>
                </div>
            </div>

            {/* ── CONTEÚDO ── */}
            <div className={styles.content}>
                <div className={styles.grid}>

                    {/* EM PREPARO */}
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <span className={`${styles.sectionDot} ${styles.dotWarning}`} />
                            <h2 className={styles.sectionTitle}>Em preparo</h2>
                            <span className={styles.sectionCount}>{emPreparo.length} pedido{emPreparo.length !== 1 ? "s" : ""}</span>
                        </div>

                        <div className={styles.cardsGrid}>
                            {emPreparo.length === 0 && (
                                <Empty text="Nenhum pedido em preparo" />
                            )}
                            {emPreparo.map(order => {
                                const tableOrders = getOrdersByTable(order.mesaId);
                                const orderIndex = tableOrders.findIndex(o => o.id === order.id) + 1;
                                return (
                                    <OrderCard
                                        key={order.id}
                                        order={order}
                                        orderIndex={orderIndex}
                                        onFinalize={() => markAsReady(order.id)}
                                        onCancel={() => handleCancelar(order.id, order.orderNumber)}
                                        canCancel
                                    />
                                );
                            })}
                        </div>
                    </div>

                    {/* PRONTOS */}
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <span className={`${styles.sectionDot} ${styles.dotSuccess}`} />
                            <h2 className={styles.sectionTitle}>Prontos para retirada</h2>
                            <span className={styles.sectionCount}>{prontos.length} pedido{prontos.length !== 1 ? "s" : ""}</span>
                        </div>

                        <div className={styles.cardsGrid}>
                            {prontos.length === 0 && (
                                <Empty text="Nenhum pedido pronto" />
                            )}
                            {prontos.map(order => {
                                const tableOrders = getOrdersByTable(order.mesaId);
                                const orderIndex = tableOrders.findIndex(o => o.id === order.id) + 1;
                                return (
                                    <OrderCard
                                        key={order.id}
                                        order={order}
                                        orderIndex={orderIndex}
                                    />
                                );
                            })}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

// ── COMPONENTES ───────────────────────────────────────────────────────────────

function Empty({ text }: { text: string }) {
    return <div className={styles.emptyState}>{text}</div>;
}

function OrderCard({
    order,
    orderIndex,
    onFinalize,
    onCancel,
    canCancel = false,
}: {
    order: Order;
    orderIndex: number;
    onFinalize?: () => void;
    onCancel?: () => void;
    canCancel?: boolean;
}) {
    const total = order.items.reduce(
        (acc: number, i: OrderItem) => acc + i.price * i.quantity, 0
    );

    const horaFormatada = new Date(order.createdAt).toLocaleTimeString("pt-BR", {
        hour: "2-digit", minute: "2-digit",
    });

    const isPronto = order.status === "pronto";

    return (
        <div className={`${styles.orderCard} ${isPronto ? styles.orderCardPronto : ""}`}>

            {/* HEADER */}
            <div className={styles.cardHeader}>
                <div className={styles.cardHeaderLeft}>
                    <h3>Mesa {order.mesaId}</h3>
                    <span className={styles.orderIndex}>Pedido #{orderIndex}</span>
                </div>
                <div className={styles.cardHeaderRight}>
                    <span className={styles.orderNumber}>#{order.orderNumber}</span>
                    <span className={styles.orderTime}>
                        <Clock size={11} style={{ display: "inline", marginRight: 2 }} />
                        {horaFormatada}
                    </span>
                </div>
            </div>

            {/* TIPO */}
            <div className={styles.orderType}>
                {order.isOnlyDrinks ? "🥤 Apenas bebidas" : "🍽️ Inclui comida"}
            </div>

            {/* ITENS */}
            <div className={styles.itemsList}>
                {order.items.map((item: OrderItem) => (
                    <div key={item.id} className={styles.itemRow}>
                        <span>{item.quantity}x {item.name}</span>
                        <span className={styles.price}>
                            R$ {(item.price * item.quantity).toFixed(2)}
                        </span>
                    </div>
                ))}
            </div>

            {/* TOTAL */}
            <div className={styles.total}>
                <span>Total</span>
                <span>R$ {total.toFixed(2)}</span>
            </div>

            {/* AÇÕES */}
            <div className={styles.cardActions}>
                {canCancel && (
                    <button onClick={onCancel} className={styles.btnCancel} title="Cancelar pedido">
                        <Trash2 size={14} />
                        Cancelar
                    </button>
                )}

                {onFinalize && (
                    <button onClick={onFinalize} className={styles.btnFinalize}>
                        <CheckCircle size={15} />
                        Finalizar
                    </button>
                )}

                {isPronto && !onFinalize && (
                    <div className={styles.readyLabel}>
                        <CheckCircle size={15} />
                        Aguardando retirada
                    </div>
                )}
            </div>
        </div>
    );
}
