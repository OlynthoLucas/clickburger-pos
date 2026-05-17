import api from './api';
import type { MenuItem } from '@/types';

/**
 * GET /api/menu — public endpoint, no auth required
 * Returns only available items
 */
export async function fetchMenu(): Promise<MenuItem[]> {
  const response = await api.get<MenuItem[]>('/api/menu');
  return response.data;
}

/**
 * Groups menu items by category for SectionList
 */
export function groupMenuByCategory(items: MenuItem[]) {
  const groups: Record<string, MenuItem[]> = {};

  for (const item of items) {
    const cat = item.category || 'Outros';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(item);
  }

  return Object.entries(groups).map(([title, data]) => ({ title, data }));
}
