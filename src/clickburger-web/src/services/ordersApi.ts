import api from "./api";

/**
 * Status pertencentes ao workflow do back-end (`OrderStatus` em
 * `src/ClickBurger/ClickBurger/Models/OrderConstants.cs`).
 */
export type OrderStatus =
    | "ABERTO"
    | "PREPARANDO"
    | "PRONTO"
    | "FECHADO"
    | "CANCELADO";

export type OrderItemStatus =
    | "PENDENTE"
    | "PREPARANDO"
    | "PRONTO"
    | "SERVIDO";

export interface OrderItem {
    menuItemId: string;
    menuItemName: string;
    quantity: number;
    unitPrice: number;
    notes: string;
    status: OrderItemStatus;
    addedAt: string;
}

export interface Order {
    id: string;
    tableId: string;
    tableNumber: number;
    items: OrderItem[];
    total: number;
    status: OrderStatus;
    paymentMethod: string;
    createdAt: string;
    closedAt: string | null;
    updatedAt: string;
}

export interface OrderItemPayload {
    menuItemId: string;
    menuItemName?: string;
    quantity: number;
    unitPrice?: number;
    notes?: string;
}

export interface CreateOrderPayload {
    tableId: string;
    tableNumber: number;
    items: OrderItemPayload[];
}

export interface PatchOrderPayload {
    status?: OrderStatus;
    paymentMethod?: string;
    items?: OrderItemPayload[];
}

/** ASP.NET Core retorna PascalCase por padr\u00e3o; normaliza para camelCase no front. */
function normalizeOrder(raw: unknown): Order {
    const r = raw as Record<string, unknown>;
    const rawItems = (r.items ?? r.Items ?? []) as unknown[];
    return {
        id: (r.id ?? r.Id) as string,
        tableId: (r.tableId ?? r.TableId) as string,
        tableNumber: (r.tableNumber ?? r.TableNumber) as number,
        total: Number(r.total ?? r.Total ?? 0),
        status: (r.status ?? r.Status) as OrderStatus,
        paymentMethod: (r.paymentMethod ?? r.PaymentMethod ?? "") as string,
        createdAt: (r.createdAt ?? r.CreatedAt) as string,
        closedAt: (r.closedAt ?? r.ClosedAt ?? null) as string | null,
        updatedAt: (r.updatedAt ?? r.UpdatedAt) as string,
        items: rawItems.map((it) => {
            const i = it as Record<string, unknown>;
            return {
                menuItemId: (i.menuItemId ?? i.MenuItemId) as string,
                menuItemName: (i.menuItemName ?? i.MenuItemName) as string,
                quantity: (i.quantity ?? i.Quantity) as number,
                unitPrice: Number(i.unitPrice ?? i.UnitPrice ?? 0),
                notes: (i.notes ?? i.Notes ?? "") as string,
                status: (i.status ?? i.Status) as OrderItemStatus,
                addedAt: (i.addedAt ?? i.AddedAt) as string,
            };
        }),
    };
}

export async function listOrders(params?: { tableId?: string }): Promise<Order[]> {
    const res = await api.get<unknown[]>("/api/orders", { params });
    return res.data.map(normalizeOrder);
}

export async function getOrder(id: string): Promise<Order> {
    const res = await api.get<unknown>(`/api/orders/${id}`);
    return normalizeOrder(res.data);
}

export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
    const res = await api.post<unknown>("/api/orders", payload);
    return normalizeOrder(res.data);
}

export async function patchOrder(id: string, payload: PatchOrderPayload): Promise<Order> {
    const res = await api.patch<unknown>(`/api/orders/${id}`, payload);
    return normalizeOrder(res.data);
}

export async function deleteOrder(id: string): Promise<void> {
    await api.delete(`/api/orders/${id}`);
}
