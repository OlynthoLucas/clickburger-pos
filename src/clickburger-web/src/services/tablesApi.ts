import api from "./api";

export type TableStatus = "LIVRE" | "OCUPADA" | "RESERVADA" | "MANUTENCAO";

export interface Table {
    id: string;
    number: number;
    status: TableStatus;
    capacity: number;
    currentOrderId: string | null;
    createdAt: string;
    updatedAt: string;
}

function normalizeTable(raw: unknown): Table {
    const r = raw as Record<string, unknown>;
    return {
        id: (r.id ?? r.Id) as string,
        number: (r.number ?? r.Number) as number,
        status: (r.status ?? r.Status) as TableStatus,
        capacity: (r.capacity ?? r.Capacity ?? 0) as number,
        currentOrderId: (r.currentOrderId ?? r.CurrentOrderId ?? null) as string | null,
        createdAt: (r.createdAt ?? r.CreatedAt) as string,
        updatedAt: (r.updatedAt ?? r.UpdatedAt) as string,
    };
}

export async function listTables(): Promise<Table[]> {
    const res = await api.get<unknown[]>("/api/tables");
    return res.data.map(normalizeTable);
}
