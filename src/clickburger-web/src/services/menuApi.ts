import api from "./api";

export interface MenuItem {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    images: string[];
    available: boolean;
}

function normalizeMenuItem(raw: unknown): MenuItem {
    const r = raw as Record<string, unknown>;
    return {
        id: (r.id ?? r.Id) as string,
        name: (r.name ?? r.Name ?? "") as string,
        description: (r.description ?? r.Description ?? "") as string,
        price: Number(r.price ?? r.Price ?? 0),
        category: (r.category ?? r.Category ?? "") as string,
        images: (r.images ?? r.Images ?? []) as string[],
        available: (r.available ?? r.Available ?? true) as boolean,
    };
}

/** Card\u00e1pio p\u00fablico (apenas itens dispon\u00edveis). N\u00e3o exige autentica\u00e7\u00e3o. */
export async function listMenu(): Promise<MenuItem[]> {
    const res = await api.get<unknown[]>("/api/menu");
    return res.data.map(normalizeMenuItem);
}
