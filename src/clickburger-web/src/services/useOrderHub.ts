import { useEffect, useRef, useState } from "react";
import { orderHubClient, type OrderHub, type OrderHubEvent } from "./orderHub";
import { useAuthStore } from "../store/authStore";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5004";

export type HubConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

interface UseOrderHubOptions {
    // Filtra apenas pedidos com status específico (ex: só FECHADO)
    filterStatus?: string;
    // Quantos eventos manter no histórico
    maxEvents?: number;
}

export function useOrderHub(options: UseOrderHubOptions = {}) {
    const { filterStatus, maxEvents = 50 } = options;
    const token = useAuthStore((s) => s.token);

    const [status, setStatus] = useState<HubConnectionStatus>("disconnected");
    const [orders, setOrders] = useState<OrderHub[]>([]);
    const [lastEvent, setLastEvent] = useState<OrderHubEvent | null>(null);

    const mountedRef = useRef(true);
    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    useEffect(() => {
        if (!token) return;

        const unsub = orderHubClient.subscribe((event) => {
            if (!mountedRef.current) return;

            setLastEvent(event);

            if (event.type === "OrderCreated" || event.type === "OrderUpdated") {
                const order = event.order;
                if (filterStatus && order.status !== filterStatus) return;

                setOrders((prev) => {
                    const exists = prev.findIndex((o) => o.id === order.id);
                    if (exists >= 0) {
                        const updated = [...prev];
                        updated[exists] = order;
                        return updated;
                    }
                    return [order, ...prev].slice(0, maxEvents);
                });
            }

            if (event.type === "OrderDeleted") {
                setOrders((prev) => prev.filter((o) => o.id !== event.orderId));
            }
        });

        async function connect() {
            if (mountedRef.current) setStatus("connecting");
            try {
                await orderHubClient.connect(token!, API_BASE_URL);
                if (mountedRef.current) setStatus("connected");
            } catch {
                if (mountedRef.current) setStatus("error");
            }
        }

        connect().catch(console.error);

        return () => { unsub(); };
    }, [token, filterStatus, maxEvents]);

    return { status, orders, lastEvent };
}
