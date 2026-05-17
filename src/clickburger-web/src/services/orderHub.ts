import * as signalR from "@microsoft/signalr";

// ── TIPOS ─────────────────────────────────────────────────────────────────────

export interface OrderItemHub {
    menuItemId: string;
    menuItemName: string;
    quantity: number;
    unitPrice: number;
    notes: string;
    status: string;
}

export interface OrderHub {
    id: string;
    tableId: string;
    tableNumber: number;
    items: OrderItemHub[];
    total: number;
    status: string;
    paymentMethod: string;
    createdAt: string;
    updatedAt: string;
    closedAt?: string;
}

// ── EVENTOS ───────────────────────────────────────────────────────────────────

export type OrderHubEvent =
    | { type: "OrderCreated"; order: OrderHub }
    | { type: "OrderUpdated"; order: OrderHub }
    | { type: "OrderDeleted"; orderId: string };

type EventHandler = (event: OrderHubEvent) => void;

// ── CLIENTE ───────────────────────────────────────────────────────────────────

class OrderHubClient {
    private connection: signalR.HubConnection | null = null;
    private handlers: Set<EventHandler> = new Set();

    async connect(token: string, baseUrl: string) {
        if (this.connection?.state === signalR.HubConnectionState.Connected) return;

        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(`${baseUrl}/hubs/orders`, {
                accessTokenFactory: () => token,
                // Fallback para Long Polling se WebSocket não estiver disponível
                transport: signalR.HttpTransportType.WebSockets |
                    signalR.HttpTransportType.LongPolling,
            })
            .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
            .configureLogging(signalR.LogLevel.Warning)
            .build();

        // Registra handlers de eventos
        this.connection.on("OrderCreated", (order: OrderHub) => {
            this.emit({ type: "OrderCreated", order });
        });

        this.connection.on("OrderUpdated", (order: OrderHub) => {
            this.emit({ type: "OrderUpdated", order });
        });

        this.connection.on("OrderDeleted", (payload: { orderId: string }) => {
            this.emit({ type: "OrderDeleted", orderId: payload.orderId });
        });

        this.connection.onreconnecting(() => {
            console.info("[OrderHub] Reconectando...");
        });

        this.connection.onreconnected(() => {
            console.info("[OrderHub] Reconectado.");
        });

        this.connection.onclose(() => {
            console.info("[OrderHub] Conexão encerrada.");
        });

        await this.connection.start();
    }

    async disconnect() {
        if (this.connection) {
            await this.connection.stop();
            this.connection = null;
        }
    }

    get state() {
        return this.connection?.state ?? signalR.HubConnectionState.Disconnected;
    }

    subscribe(handler: EventHandler) {
        this.handlers.add(handler);
        return () => this.handlers.delete(handler);
    }

    private emit(event: OrderHubEvent) {
        this.handlers.forEach((h) => h(event));
    }
}

// Singleton — uma conexão por sessão
export const orderHubClient = new OrderHubClient();
