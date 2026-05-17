import axios from "axios";
import { useAuthStore } from "../store/authStore";
import type { Order, OrderItem } from "../store/orderStore";

// ── INSTÂNCIA PRÓPRIA ─────────────────────────────────────────────────────────
// Usa instância separada do axios para NÃO disparar o interceptor de logout
// quando receber 401/403. Isso evita deslogar o garçom ao fechar a conta.

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5004";

const orderApi = axios.create({
    baseURL: BASE_URL,
    headers: { "Content-Type": "application/json" },
});

// Adiciona o token em cada requisição, mas SEM interceptor de logout
orderApi.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// ── TIPOS DO BACKEND ──────────────────────────────────────────────────────────

interface BackendTable {
    id: string;
    number: number;
    currentOrderId?: string;
}

interface BackendMenuItem {
    id: string;
    name: string;
    price: number;
    available: boolean;
}

interface BackendOrderItemDto {
    menuItemId: string;
    menuItemName: string;
    quantity: number;
    unitPrice: number;
    notes: string;
}

interface BackendOrderCreateDto {
    tableId: string;
    tableNumber: number;
    items: BackendOrderItemDto[];
}

interface BackendOrderPatchDto {
    status: "FECHADO";
    paymentMethod: "DINHEIRO" | "CARTAO" | "PIX";
}

interface BackendOrder {
    id: string;
    status: string;
    total: number;
}

// ── CACHE LOCAL ───────────────────────────────────────────────────────────────

let tablesCache: BackendTable[] | null = null;
let menuCache: BackendMenuItem[] | null = null;

export function invalidateOrderApiCache() {
    tablesCache = null;
    menuCache = null;
}

async function getTables(): Promise<BackendTable[]> {
    if (tablesCache) return tablesCache;
    const { data } = await orderApi.get<BackendTable[]>("/api/tables");
    tablesCache = data;
    return data;
}

async function getMenuItems(): Promise<BackendMenuItem[]> {
    if (menuCache) return menuCache;
    // Tenta /api/menu (acessível ao garçom)
    const { data } = await orderApi.get<BackendMenuItem[]>("/api/menu");
    menuCache = data;
    return data;
}

// ── GARANTE QUE ITEM EXISTE NO CARDÁPIO ──────────────────────────────────────

async function ensureMenuItemExists(
    item: OrderItem,
    menuItems: BackendMenuItem[]
): Promise<string | null> {
    // Busca pelo nome (case-insensitive)
    const found = menuItems.find(
        m => m.name.toLowerCase() === item.name.toLowerCase()
    );
    if (found) return found.id;

    // Não encontrou — cria no cardápio
    try {
        const { data } = await orderApi.post<BackendMenuItem>("/api/menu", {
            name: item.name,
            description: "",
            category: item.isDrink ? "Bebidas" : "Lanches",
            price: item.price,
            images: [],
            available: true,
        });
        menuCache?.push(data);
        return data.id;
    } catch {
        console.warn(`[orderApi] Não foi possível criar item "${item.name}" no cardápio.`);
        return null;
    }
}

// ── FECHA PEDIDOS NO BACKEND ──────────────────────────────────────────────────

export async function closeOrdersInBackend(
    mesaId: number,
    orders: Order[],
    paymentMethod: "DINHEIRO" | "CARTAO" | "PIX" = "DINHEIRO"
): Promise<{ success: boolean; closedCount: number }> {
    const ordersWithItems = orders.filter(o => o.items.length > 0);
    if (ordersWithItems.length === 0) return { success: false, closedCount: 0 };

    // Busca mesa e cardápio em paralelo
    const fetchResult = await (async () => {
        try {
            const [tables, menu] = await Promise.all([getTables(), getMenuItems()]);
            return { tables, menu, error: false };
        } catch {
            return { tables: [] as BackendTable[], menu: [] as BackendMenuItem[], error: true };
        }
    })();

    if (fetchResult.error) {
        console.error("[orderApi] Erro ao buscar mesas/cardápio.");
        return { success: false, closedCount: 0 };
    }

    let table = fetchResult.tables.find(t => t.number === mesaId);
    const menuItemsList = fetchResult.menu;

    // Cria a mesa no backend se não existir
    if (!table) {
        try {
            const { data: newTable } = await orderApi.post<BackendTable>("/api/tables", {
                number: mesaId,
                capacity: 4,
                status: "LIVRE",
            });
            table = newTable;
            tablesCache = null;
        } catch {
            console.error(`[orderApi] Mesa ${mesaId} não encontrada e não foi possível criar.`);
            return { success: false, closedCount: 0 };
        }
    }

    let closedCount = 0;

    for (const order of ordersWithItems) {
        try {
            const mappedItems: BackendOrderItemDto[] = [];

            for (const item of order.items) {
                const menuItemId = await ensureMenuItemExists(item, menuItemsList);
                if (!menuItemId) continue;

                mappedItems.push({
                    menuItemId,
                    menuItemName: item.name,
                    quantity: item.quantity,
                    unitPrice: item.price,
                    notes: "",
                });
            }

            if (mappedItems.length === 0) continue;

            // Se a mesa tem um pedido aberto no backend, cancela antes de criar novo
            const currentOrderId = table.currentOrderId;
            if (currentOrderId) {
                await orderApi.patch(`/api/orders/${currentOrderId}`, {
                    status: "CANCELADO",
                }).catch(() => { });
                // Atualiza o cache local da mesa
                table = { ...table, currentOrderId: undefined };
            }

            // Cria o pedido (status inicial: ABERTO)
            const orderRequest: BackendOrderCreateDto = {
                tableId: table.id,
                tableNumber: table.number,
                items: mappedItems,
            };

            const response = await orderApi.post<BackendOrder>("/api/orders", orderRequest);
            const createdOrder = response.data;

            // Segue o fluxo: ABERTO → PREPARANDO → PRONTO → FECHADO
            await orderApi.patch(`/api/orders/${createdOrder.id}`, { status: "PREPARANDO" });
            await orderApi.patch(`/api/orders/${createdOrder.id}`, { status: "PRONTO" });
            await orderApi.patch(`/api/orders/${createdOrder.id}`, {
                status: "FECHADO",
                paymentMethod: paymentMethod,
            } as BackendOrderPatchDto);

            // Atualiza currentOrderId para o próximo pedido da mesma mesa
            table = { ...table, currentOrderId: createdOrder.id };
            closedCount++;

        } catch (err) {
            console.error(`[orderApi] Erro ao fechar pedido ${order.id}:`, err);
        }
    }

    return { success: closedCount > 0, closedCount };
}
