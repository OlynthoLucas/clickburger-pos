// TypeScript types matching the ClickBurger backend models

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  available: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MenuSection {
  title: string;
  data: MenuItem[];
}

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface OrderItem {
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  notes: string;
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
  closedAt?: string;
  updatedAt: string;
}

export type OrderStatus = 'ABERTO' | 'PREPARANDO' | 'PRONTO' | 'FECHADO' | 'CANCELADO';

export interface CreateOrderDto {
  tableId: string;
  tableNumber: number;
  items: {
    menuItemId: string;
    menuItemName: string;
    quantity: number;
    unitPrice: number;
    notes: string;
  }[];
}

export interface Table {
  id: string;
  number: number;
  status: string;
  capacity: number;
  currentOrderId?: string;
}

export interface CustomerSession {
  name: string;
  tableNumber: number;
}
