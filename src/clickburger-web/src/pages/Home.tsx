import { useCallback, useEffect, useRef, useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { useCashStore } from "../store/cashStore";
import { useOrderStore } from "../store/orderStore";
import { OrderModal } from "../components/OrderModal";
import { PaymentModal } from "../components/PaymentModal";
import api from "../services/api";
import styles from "./Home.module.scss";

export default function Home() {
    const { isOpen, loading: cashLoading, value, openCash, addToCash, syncCash } = useCashStore();
    const {
        orders,
        createOrder,
        deliverOrder,
        cancelOrder,
        closeTable,
        getOrdersByTable,
        getTableStatus,
        getTablePaid,
        getTableRemaining,
    } = useOrderStore();

    const [inputValor, setInputValor] = useState("");
    const [modalState, setModalState] = useState<{ orderId: string; mesaId: number } | null>(null);
    const [expandedTable, setExpandedTable] = useState<number | null>(null);
    const [paymentMesa, setPaymentMesa] = useState<number | null>(null);

    const [mesas, setMesas] = useState<number[]>([]);
    const [loadingTables, setLoadingTables] = useState(true);

    const mountedRef = useRef(true);
    useEffect(() => {
        mountedRef.current = true;
        api.get<{ id: string, number: number }[]>("/api/tables")
            .then(res => {
                if (mountedRef.current) {
                    const fetchedNumbers = res.data.map(t => t.number).sort((a, b) => a - b);
                    setMesas(fetchedNumbers);
                }
            })
            .catch(err => console.error("Erro ao carregar mesas:", err))
            .finally(() => {
                if (mountedRef.current) setLoadingTables(false);
            });

        return () => { mountedRef.current = false; };
    }, []);

    // Sincroniza estado do caixa com o backend ao carregar a página
    useEffect(() => {
        async function init() {
            await syncCash();
        }
        init().catch(console.error);
    }, [syncCash]);

    const handlePaymentFinish = useCallback((mesaId: number) => {
        const paid = getTablePaid(mesaId);
        closeTable(mesaId);
        addToCash(paid);
        setPaymentMesa(null);
        setExpandedTable(null);
    }, [getTablePaid, closeTable, addToCash]);

    // ================= LOADING DO CAIXA =================
    if (cashLoading) {
        return (
            <div className={styles.openCashWrapper}>
                <div className={styles.card}>
                    <p style={{ textAlign: "center", color: "#6b7280" }}>Verificando caixa...</p>
                </div>
            </div>
        );
    }

    // ================= ABERTURA DE CAIXA =================
    if (!isOpen) {
        return (
            <div className={styles.openCashWrapper}>
                <div className={styles.card}>
                    <h2>Abertura de Caixa</h2>
                    <input
                        value={inputValor}
                        onChange={(e) => setInputValor(e.target.value)}
                        placeholder="0,00"
                    />
                    <button onClick={() => openCash(parseFloat(inputValor || "0"))}>
                        Abrir Caixa
                    </button>
                </div>
            </div>
        );
    }

    // ================= MÉTRICAS =================
    const enviados = orders.filter(o => o.status === "enviado").length;
    const prontos = orders.filter(o => o.status === "pronto").length;
    const entregues = orders.filter(o => o.status === "entregue").length;

    // ================= HANDLERS =================

    function handleAbrirMesa(mesaId: number) {
        const orderId = createOrder(mesaId);
        setModalState({ orderId, mesaId });
    }

    function handleNovoPedido(mesaId: number) {
        const orderId = createOrder(mesaId);
        setModalState({ orderId, mesaId });
    }

    function handleEditarPedido(orderId: string, mesaId: number) {
        setModalState({ orderId, mesaId });
    }

    function handleCancelarPedido(orderId: string, orderNumber: string, mesaId: number) {
        if (!confirm(`Cancelar pedido ${orderNumber}?`)) return;
        cancelOrder(orderId);
        const restantes = getOrdersByTable(mesaId).filter(o => o.id !== orderId);
        if (restantes.length === 0) setExpandedTable(null);
    }

    function handleFecharMesa(mesaId: number) {
        const tableOrders = getOrdersByTable(mesaId);
        const allDelivered = tableOrders.every(o => o.status === "entregue");

        if (!allDelivered) {
            alert("Todos os pedidos precisam ser entregues antes de fechar a conta.");
            return;
        }

        setPaymentMesa(mesaId);
    }

    // ================= LABELS =================

    const statusLabels: Record<string, string> = {
        livre: "Disponível",
        aberto: "Pedido em andamento",
        enviado: "Na cozinha",
        pronto: "Aguardando entrega",
        entregue: "Aguardando pagamento",
    };

    const statusBadgeClass: Record<string, string> = {
        aberto: styles.badgeAberto,
        enviado: styles.badgeEnviado,
        pronto: styles.badgePronto,
        entregue: styles.badgeEntregue,
    };

    const statusOrderLabel: Record<string, string> = {
        aberto: "Em aberto",
        enviado: "Na cozinha",
        pronto: "Pronto",
        entregue: "Entregue",
    };

    return (
        <div className={styles.layout}>

            <Sidebar />

            <div className={styles.mainContent}>

                {/* ================= CONTEÚDO ESQUERDO ================= */}
                <div className={styles.contentLeft}>

                    {/* HEADER */}
                    <div className={styles.header}>
                        <div>
                            <h1 className={styles.title}>Garçom</h1>
                            <p className={styles.subtitle}>Bateu a fome, me chamou!</p>
                        </div>
                        <div className={styles.searchBox}>
                            <input placeholder="Pesquisar por mesa" />
                        </div>
                    </div>

                    {/* CAIXA */}
                    <div className={styles.cashStatus}>
                        <h2>R$ {value.toFixed(2)}</h2>
                        <p>Caixa aberto</p>
                        <span>Acompanhamento do caixa</span>
                    </div>

                    {/* LISTA DE MESAS */}
                    <div className={styles.tableList}>
                        {loadingTables && <p style={{ gridColumn: "1 / -1", textAlign: "center", color: "#6b7280" }}>Carregando mesas...</p>}
                        {!loadingTables && mesas.length === 0 && (
                            <p style={{ gridColumn: "1 / -1", textAlign: "center", color: "#6b7280" }}>Nenhuma mesa cadastrada. Solicite ao administrador.</p>
                        )}
                        {mesas.map((mesaId) => {
                            const tableStatus = getTableStatus(mesaId);
                            const tableOrders = getOrdersByTable(mesaId);
                            const allDelivered = tableOrders.length > 0 && tableOrders.every(o => o.status === "entregue");
                            const isExpanded = expandedTable === mesaId;
                            const isOccupied = tableStatus !== "livre";

                            const totalMesa = tableOrders.reduce((acc, o) => acc + o.items.reduce((s, i) => s + i.price * i.quantity, 0), 0);
                            const paidMesa = getTablePaid(mesaId);
                            const remainingMesa = getTableRemaining(mesaId);

                            return (
                                <div
                                    key={mesaId}
                                    className={`${styles.tableItem} ${isExpanded ? styles.tableItemExpanded : ""} ${isOccupied ? styles.tableItemOccupied : ""}`}
                                    onMouseEnter={() => isOccupied && setExpandedTable(mesaId)}
                                    onMouseLeave={() => setExpandedTable(null)}
                                >
                                    {/* ── LINHA PRINCIPAL ── */}
                                    <div className={styles.tableRow}>

                                        <div className={styles.tableInfo}>
                                            <div className={`${styles.tableIcon} ${isOccupied ? styles.tableIconOccupied : ""}`}>
                                                🍔
                                            </div>
                                            <div>
                                                <h3>Mesa {String(mesaId).padStart(2, "0")}</h3>
                                                <p>{statusLabels[tableStatus]}</p>
                                                {isOccupied && (
                                                    <span className={styles.tableMeta}>
                                                        {tableOrders.length} pedido{tableOrders.length !== 1 ? "s" : ""} · R$ {totalMesa.toFixed(2)}
                                                        {paidMesa > 0 && ` · Pago R$ ${paidMesa.toFixed(2)} · Restante R$ ${remainingMesa.toFixed(2)}`}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* AÇÕES PRINCIPAIS */}
                                        <div className={styles.actions}>
                                            {tableStatus === "livre" && (
                                                <button onClick={() => handleAbrirMesa(mesaId)} className={styles.btnOpen}>
                                                    Abrir mesa
                                                </button>
                                            )}

                                            {isOccupied && (
                                                <button onClick={() => handleNovoPedido(mesaId)} className={styles.btnContinue}>
                                                    + Novo pedido
                                                </button>
                                            )}

                                            {tableOrders.filter(o => o.status === "pronto").map((order) => (
                                                <button
                                                    key={order.id}
                                                    onClick={() => deliverOrder(order.id)}
                                                    className={styles.btnDeliver}
                                                >
                                                    Entregar #{tableOrders.indexOf(order) + 1}
                                                </button>
                                            ))}

                                            {allDelivered && (
                                                <button onClick={() => handleFecharMesa(mesaId)} className={styles.btnClose}>
                                                    Fechar conta
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* ── PAINEL EXPANDIDO ── */}
                                    {isExpanded && tableOrders.length > 0 && (
                                        <div className={styles.expandedPanel}>
                                            <div className={styles.expandedDivider} />
                                            <p className={styles.expandedTitle}>Pedidos da mesa</p>

                                            {tableOrders.map((order, index) => {
                                                const orderTotal = order.items.reduce(
                                                    (acc, i) => acc + i.price * i.quantity, 0
                                                );
                                                const canEdit = order.status === "aberto";
                                                const canCancel = order.status === "aberto" || order.status === "enviado";

                                                return (
                                                    <div key={order.id} className={styles.expandedOrder}>
                                                        <div className={styles.expandedOrderHeader}>
                                                            <div className={styles.expandedOrderMeta}>
                                                                <span className={styles.expandedOrderTitle}>
                                                                    {order.isOnlyDrinks ? "🥤" : "🍽️"} Pedido #{index + 1}
                                                                </span>
                                                                <span className={styles.expandedOrderNumber}>
                                                                    {order.orderNumber}
                                                                </span>
                                                                <span className={`${styles.expandedOrderBadge} ${statusBadgeClass[order.status]}`}>
                                                                    {statusOrderLabel[order.status]}
                                                                </span>
                                                            </div>
                                                            <div className={styles.expandedOrderActions}>
                                                                {canEdit && (
                                                                    <button
                                                                        onClick={() => handleEditarPedido(order.id, mesaId)}
                                                                        className={styles.btnEditOrder}
                                                                    >
                                                                        ✏️ Editar
                                                                    </button>
                                                                )}
                                                                {canCancel && (
                                                                    <button
                                                                        onClick={() => handleCancelarPedido(order.id, order.orderNumber, mesaId)}
                                                                        className={styles.btnCancelOrder}
                                                                    >
                                                                        🗑 Cancelar
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className={styles.expandedItems}>
                                                            {order.items.length === 0 ? (
                                                                <span className={styles.expandedEmpty}>Nenhum item</span>
                                                            ) : (
                                                                order.items.map(item => (
                                                                    <div key={item.id} className={styles.expandedItem}>
                                                                        <span>{item.quantity}x {item.name}</span>
                                                                        <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>

                                                        <div className={styles.expandedSubtotal}>
                                                            Subtotal: R$ {orderTotal.toFixed(2)}
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            <div className={styles.expandedTotal}>
                                                <span>Total da mesa</span>
                                                <span>R$ {totalMesa.toFixed(2)}</span>
                                            </div>

                                            {paidMesa > 0 && (
                                                <>
                                                    <div className={`${styles.expandedTotal} ${styles.expandedTotalPaid}`}>
                                                        <span>✅ Já pago</span>
                                                        <span>R$ {paidMesa.toFixed(2)}</span>
                                                    </div>
                                                    <div className={`${styles.expandedTotal} ${styles.expandedTotalRemaining}`}>
                                                        <span>Restante</span>
                                                        <span>R$ {remainingMesa.toFixed(2)}</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ================= PAINEL DIREITO ================= */}
                <div className={styles.rightPanel}>
                    <div className={styles.metricsGrid}>
                        <InfoCard title="Na cozinha" value={enviados} />
                        <InfoCard title="Prontos" value={prontos} />
                        <InfoCard title="Entregues" value={entregues} />
                        <InfoCard title="Total" value={orders.length} />
                    </div>

                    <div className={styles.readySection}>
                        <div className={styles.readyHeader}>
                            <h3>Aguardando entrega</h3>
                            <span>🛎️</span>
                        </div>

                        {orders.filter(o => o.status === "pronto").map((order) => {
                            const tableOrders = getOrdersByTable(order.mesaId);
                            const orderIndex = tableOrders.findIndex(o => o.id === order.id) + 1;

                            return (
                                <div key={order.id} className={styles.readyItem}>
                                    <div>
                                        <span>Mesa {order.mesaId} — Pedido #{orderIndex}</span>
                                        <br />
                                        <small>{order.isOnlyDrinks ? "🥤" : "🍽️"} {order.orderNumber}</small>
                                    </div>
                                    <button onClick={() => deliverOrder(order.id)}>
                                        Entregar
                                    </button>
                                </div>
                            );
                        })}

                        {orders.filter(o => o.status === "pronto").length === 0 && (
                            <p className={styles.empty}>Nenhum pedido pronto</p>
                        )}
                    </div>
                </div>
            </div>

            {/* MODAL DE PEDIDO */}
            {modalState && (
                <OrderModal
                    orderId={modalState.orderId}
                    mesaId={modalState.mesaId}
                    onClose={() => setModalState(null)}
                />
            )}

            {/* MODAL DE PAGAMENTO */}
            {paymentMesa !== null && (
                <PaymentModal
                    mesaId={paymentMesa}
                    onClose={() => setPaymentMesa(null)}
                    onFinish={() => handlePaymentFinish(paymentMesa)}
                />
            )}
        </div>
    );
}

function InfoCard({ title, value }: { title: string; value: number }) {
    return (
        <div className={styles.infoCard}>
            <p>{title}</p>
            <p>{value}</p>
        </div>
    );
}
