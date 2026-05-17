import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";

export type OrderStatus = "aberto" | "enviado" | "pronto" | "entregue";

export interface OrderItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    isDrink?: boolean;
}

export interface Order {
    id: string;
    orderNumber: string;
    mesaId: number;
    status: OrderStatus;
    items: OrderItem[];
    isOnlyDrinks: boolean;
    createdAt: Date;
}

interface OrderState {
    orders: Order[];

    // Pagamento parcial: saldo já pago por mesa
    paidAmounts: Record<number, number>;

    // Helpers
    hasOpenTable: (mesaId: number) => boolean;
    getOrdersByTable: (mesaId: number) => Order[];
    getTableStatus: (mesaId: number) => "livre" | "aberto" | "enviado" | "pronto" | "entregue";
    getTableTotal: (mesaId: number) => number;
    getTablePaid: (mesaId: number) => number;
    getTableRemaining: (mesaId: number) => number;

    // Pedido
    createOrder: (mesaId: number) => string;
    addItem: (orderId: string, item: Omit<OrderItem, "quantity">) => void;
    removeItem: (orderId: string, itemId: string) => void;
    updateQuantity: (orderId: string, itemId: string, quantity: number) => void;

    // Fluxo
    sendOrder: (orderId: string) => void;
    markAsReady: (orderId: string) => void;
    deliverOrder: (orderId: string) => void;
    cancelOrder: (orderId: string) => void;

    // Pagamento
    registerPayment: (mesaId: number, amount: number) => void; // registra pagamento parcial ou total
    closeTable: (mesaId: number) => number;                    // fecha mesa, retorna total pago
}

function calcIsOnlyDrinks(items: OrderItem[]): boolean {
    return items.length > 0 && items.every(i => i.isDrink === true);
}

function generateOrderNumber(): string {
    const now = new Date();
    const hhmm = now.toTimeString().slice(0, 5).replace(":", "");
    const suffix = uuidv4().slice(0, 4).toUpperCase();
    return `${hhmm}-${suffix}`;
}

export const useOrderStore = create<OrderState>((set, get) => ({
    orders: [],
    paidAmounts: {},

    hasOpenTable: (mesaId) =>
        get().orders.some(o => o.mesaId === mesaId),

    getOrdersByTable: (mesaId) =>
        get().orders.filter(o => o.mesaId === mesaId),

    getTableStatus: (mesaId) => {
        const tableOrders = get().orders.filter(o => o.mesaId === mesaId);
        if (tableOrders.length === 0) return "livre";

        const priority: Record<OrderStatus, number> = {
            aberto: 4,
            enviado: 3,
            pronto: 2,
            entregue: 1,
        };

        return tableOrders.reduce((prev, curr) =>
            priority[curr.status] > priority[prev.status] ? curr : prev
        ).status;
    },

    getTableTotal: (mesaId) => {
        return get().orders
            .filter(o => o.mesaId === mesaId)
            .reduce((acc, o) => acc + o.items.reduce((s, i) => s + i.price * i.quantity, 0), 0);
    },

    getTablePaid: (mesaId) =>
        get().paidAmounts[mesaId] ?? 0,

    getTableRemaining: (mesaId) => {
        const total = get().getTableTotal(mesaId);
        const paid = get().paidAmounts[mesaId] ?? 0;
        return Math.max(0, total - paid);
    },

    createOrder: (mesaId) => {
        const id = uuidv4();
        set(state => ({
            orders: [
                ...state.orders,
                {
                    id,
                    orderNumber: generateOrderNumber(),
                    mesaId,
                    status: "aberto",
                    items: [],
                    isOnlyDrinks: false,
                    createdAt: new Date(),
                }
            ]
        }));
        return id;
    },

    addItem: (orderId, item) => {
        set(state => ({
            orders: state.orders.map(order => {
                if (order.id !== orderId) return order;
                const existing = order.items.find(i => i.id === item.id);
                const updatedItems = existing
                    ? order.items.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
                    : [...order.items, { ...item, quantity: 1 }];
                return { ...order, items: updatedItems, isOnlyDrinks: calcIsOnlyDrinks(updatedItems) };
            })
        }));
    },

    removeItem: (orderId, itemId) => {
        set(state => ({
            orders: state.orders.map(order => {
                if (order.id !== orderId) return order;
                const updatedItems = order.items.filter(i => i.id !== itemId);
                return { ...order, items: updatedItems, isOnlyDrinks: calcIsOnlyDrinks(updatedItems) };
            })
        }));
    },

    updateQuantity: (orderId, itemId, quantity) => {
        if (quantity <= 0) {
            get().removeItem(orderId, itemId);
            return;
        }
        set(state => ({
            orders: state.orders.map(order =>
                order.id === orderId
                    ? { ...order, items: order.items.map(i => i.id === itemId ? { ...i, quantity } : i) }
                    : order
            )
        }));
    },

    sendOrder: (orderId) => {
        const order = get().orders.find(o => o.id === orderId);
        if (!order || order.items.length === 0) return;
        const nextStatus: OrderStatus = order.isOnlyDrinks ? "pronto" : "enviado";
        set(state => ({
            orders: state.orders.map(o => o.id === orderId ? { ...o, status: nextStatus } : o)
        }));
    },

    markAsReady: (orderId) => {
        set(state => ({
            orders: state.orders.map(o => o.id === orderId ? { ...o, status: "pronto" } : o)
        }));
    },

    deliverOrder: (orderId) => {
        set(state => ({
            orders: state.orders.map(o => o.id === orderId ? { ...o, status: "entregue" } : o)
        }));
    },

    cancelOrder: (orderId) => {
        set(state => ({
            orders: state.orders.filter(o => o.id !== orderId)
        }));
    },

    // Registra um pagamento (parcial ou total) — acumula o valor pago na mesa
    registerPayment: (mesaId, amount) => {
        set(state => ({
            paidAmounts: {
                ...state.paidAmounts,
                [mesaId]: (state.paidAmounts[mesaId] ?? 0) + amount,
            }
        }));
    },

    // Fecha a mesa: limpa pedidos e saldo pago, retorna o total recebido
    closeTable: (mesaId) => {
        const paid = get().paidAmounts[mesaId] ?? 0;

        set(state => ({
            orders: state.orders.filter(o => o.mesaId !== mesaId),
            paidAmounts: Object.fromEntries(
                Object.entries(state.paidAmounts).filter(([key]) => Number(key) !== mesaId)
            ),
        }));

        return paid;
    },
}));
