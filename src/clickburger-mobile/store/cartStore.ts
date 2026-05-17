import { create } from 'zustand';
import type { CartItem } from '@/types';

interface CartState {
  // Customer session
  customerName: string;
  tableNumber: number | null;

  // Cart items
  items: CartItem[];

  // Computed total
  get total(): number;

  // Actions
  setSession: (name: string, tableNumber: number) => void;
  clearSession: () => void;

  addItem: (item: CartItem) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;

  itemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  customerName: '',
  tableNumber: null,
  items: [],

  get total() {
    return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },

  setSession: (name, tableNumber) => set({ customerName: name, tableNumber }),

  clearSession: () => set({ customerName: '', tableNumber: null }),

  addItem: (newItem) =>
    set((state) => {
      const existing = state.items.find((i) => i.menuItemId === newItem.menuItemId);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.menuItemId === newItem.menuItemId
              ? { ...i, quantity: i.quantity + newItem.quantity }
              : i
          ),
        };
      }
      return { items: [...state.items, newItem] };
    }),

  removeItem: (menuItemId) =>
    set((state) => ({
      items: state.items.filter((i) => i.menuItemId !== menuItemId),
    })),

  updateQuantity: (menuItemId, quantity) =>
    set((state) => {
      if (quantity <= 0) {
        return { items: state.items.filter((i) => i.menuItemId !== menuItemId) };
      }
      return {
        items: state.items.map((i) =>
          i.menuItemId === menuItemId ? { ...i, quantity } : i
        ),
      };
    }),

  clearCart: () => set({ items: [] }),

  itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}));
