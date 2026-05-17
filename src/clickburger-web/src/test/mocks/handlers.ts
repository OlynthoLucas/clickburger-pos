import { http, HttpResponse } from "msw";

/**
 * BaseURL alinhada com `src/services/api.ts`. Quando `VITE_API_BASE_URL` não
 * está definida (caso dos testes), o axios cai em `http://localhost:5004`.
 */
const API = "http://localhost:5004";

/**
 * Handlers padrão devolvem coleções vazias ou OK genérico. Cada teste deve
 * sobrescrever via `server.use(http.get(...))` para casos específicos. Isso
 * mantém os testes auto-explicativos (cada um diz exatamente o que espera
 * da API) sem precisar editar este arquivo.
 */
export const handlers = [
    // ---- Menu ----
    http.get(`${API}/api/menu`, () => HttpResponse.json([])),
    http.get(`${API}/api/menu/admin`, () => HttpResponse.json([])),
    http.post(`${API}/api/menu`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
            { id: "mock-menu-id", available: true, ...body },
            { status: 201 }
        );
    }),
    http.patch(`${API}/api/menu/:id`, async ({ request, params }) => {
        const body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ id: params.id, ...body });
    }),
    http.delete(`${API}/api/menu/:id`, () => new HttpResponse(null, { status: 204 })),

    // ---- Orders ----
    http.get(`${API}/api/orders`, () => HttpResponse.json([])),
    http.post(`${API}/api/orders`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
            {
                id: "mock-order-id",
                status: "ABERTO",
                total: 0,
                items: [],
                paymentMethod: "",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                closedAt: null,
                ...body,
            },
            { status: 201 }
        );
    }),
    http.patch(`${API}/api/orders/:id`, async ({ request, params }) => {
        const body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
            id: params.id,
            status: "ABERTO",
            total: 0,
            items: [],
            paymentMethod: "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            closedAt: null,
            ...body,
        });
    }),

    // ---- Tables ----
    http.get(`${API}/api/tables`, () => HttpResponse.json([])),

    // ---- Auth (apenas o que pode ser disparado por interceptors) ----
    http.post(`${API}/api/auth/refresh`, () =>
        HttpResponse.json({ token: "mock-token", refreshToken: "mock-refresh" })
    ),
];
