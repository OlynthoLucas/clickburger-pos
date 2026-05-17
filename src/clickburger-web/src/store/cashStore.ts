import { create } from "zustand";
import {
    fetchCurrentCashSession,
    openCash as apiOpenCash,
    closeCash as apiCloseCash,
    type CashSessionDto,
} from "../services/reportsApi";

interface CashState {
    isOpen: boolean;
    value: number;
    session: CashSessionDto | null;
    loading: boolean;

    syncCash: () => Promise<void>;
    openCash: (initialValue: number) => Promise<void>;
    addToCash: (amount: number) => void;
    closeCash: () => Promise<void>;
}

export const useCashStore = create<CashState>((set) => ({
    isOpen: false,
    value: 0,
    session: null,
    loading: false,

    syncCash: async () => {
        set({ loading: true });
        try {
            const session = await fetchCurrentCashSession();
            if (session) {
                set({ isOpen: true, value: session.initialValue, session });
            } else {
                set({ isOpen: false, value: 0, session: null });
            }
        } catch {
            // offline fallback — mantém estado local
        } finally {
            set({ loading: false });
        }
    },

    openCash: async (initialValue: number) => {
        set({ loading: true });
        try {
            const session = await apiOpenCash(initialValue);
            set({ isOpen: true, value: session.initialValue, session });
        } finally {
            set({ loading: false });
        }
    },

    addToCash: (amount: number) => {
        set((state) => ({ value: state.value + amount }));
    },

    closeCash: async () => {
        set({ loading: true });
        try {
            await apiCloseCash();
            set({ isOpen: false, value: 0, session: null });
        } finally {
            set({ loading: false });
        }
    },
}));
