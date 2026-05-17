import api from './api';
import type { Order, CreateOrderDto } from '@/types';

/**
 * POST /api/customer/orders — public endpoint, no auth required
 * Creates an anonymous order by table NUMBER (backend resolves tableId internally)
 */
export async function createOrder(dto: Omit<CreateOrderDto, 'tableId'>): Promise<Order> {
  const response = await api.post<Order>('/api/customer/orders', {
    tableNumber: dto.tableNumber,
    items: dto.items,
  });
  return response.data;
}

/**
 * GET /api/customer/orders/{id} — public endpoint, no auth required
 * Returns order with current status for tracking (polling)
 */
export async function fetchOrder(orderId: string): Promise<Order> {
  const response = await api.get<Order>(`/api/customer/orders/${orderId}`);
  return response.data;
}
