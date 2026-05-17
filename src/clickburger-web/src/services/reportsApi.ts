import api from "./api";

// ── DTOs ──────────────────────────────────────────────────────────────────────

export interface TopProductReportDto {
    menuItemId: string;
    name: string;
    quantity: number;
    revenue: number;
}

// Alias para compatibilidade — alguns arquivos importam como TopProductDto
export type TopProductDto = TopProductReportDto;

export interface SalesReportDto {
    ordersCount: number;
    revenue: number;
    averageTicket: number;
    from: string;
    to: string;
    topProducts: TopProductReportDto[];
}

export interface DashboardStatsDto {
    totalOrders: number;
    activeOrders: number;
    closedOrders: number;
    totalTables: number;
    freeTables: number;
    occupiedTables: number;
    totalProducts: number;
    activeUsers: number;
}

export interface CashSessionDto {
    id: string;
    initialValue: number;
    openedAt: string;
    closedAt?: string;
    openedBy: string;
    isOpen: boolean;
}

interface SeedDevReportsOrdersParams {
    count: number;
    daysBack: number;
}

interface SeedDevReportsOrdersResult {
    message: string;
}

// ── RELATÓRIO ─────────────────────────────────────────────────────────────────

export async function fetchTodaySalesReport(): Promise<SalesReportDto> {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await api.get<SalesReportDto>("/api/reports/sales", {
        params: { from: today, to: today },
    });
    return data;
}

export async function fetchSalesReport(from: string, to: string): Promise<SalesReportDto> {
    const { data } = await api.get<SalesReportDto>("/api/reports/sales", {
        params: { from, to },
    });
    return data;
}

export async function fetchDashboardStats(): Promise<DashboardStatsDto> {
    const { data } = await api.get<DashboardStatsDto>("/api/reports/dashboard");
    return data;
}

// ── DEV SEED ──────────────────────────────────────────────────────────────────

// Popula pedidos fictícios no MongoDB (só disponível em modo Development)
export async function seedDevReportsOrders(
    params: SeedDevReportsOrdersParams
): Promise<SeedDevReportsOrdersResult> {
    const { data } = await api.post<SeedDevReportsOrdersResult>(
        "/api/dev/seed/reports-orders",
        params
    );
    return data;
}

// ── CAIXA ─────────────────────────────────────────────────────────────────────

export async function fetchCurrentCashSession(): Promise<CashSessionDto | null> {
    try {
        const { data } = await api.get<CashSessionDto>("/api/cash/current");
        return data;
    } catch (err: unknown) {
        if ((err as { response?: { status?: number } })?.response?.status === 404) return null;
        throw err;
    }
}

export async function openCash(initialValue: number): Promise<CashSessionDto> {
    const { data } = await api.post<CashSessionDto>("/api/cash/open", { initialValue });
    return data;
}

export async function closeCash(): Promise<CashSessionDto> {
    const { data } = await api.post<CashSessionDto>("/api/cash/close");
    return data;
}

export async function fetchCashHistory(): Promise<CashSessionDto[]> {
    const { data } = await api.get<CashSessionDto[]>("/api/cash/history");
    return data;
}
