// Design tokens matching the ClickBurger web app identity
export const Colors = {
  // Brand
  primary: '#D43621',
  primaryDark: '#b82d1b',
  primaryLight: '#f05a48',

  // Backgrounds
  background: '#F4F5EF',
  surface: '#F2EFE8',
  surfaceElevated: '#FFFFFF',

  // Text
  text: '#333333',
  textMuted: '#666666',
  textLight: '#9CA3AF',
  textOnPrimary: '#FFFFFF',

  // UI
  border: '#D1D5DB',
  borderLight: '#E5E7EB',
  error: '#EF4444',
  success: '#22C55E',
  warning: '#F59E0B',

  // Status colors
  statusAberto: '#F59E0B',
  statusPreparando: '#3B82F6',
  statusPronto: '#22C55E',
  statusFechado: '#6B7280',
  statusCancelado: '#EF4444',

  // Overlay
  overlay: 'rgba(0,0,0,0.4)',
  white: '#FFFFFF',
  black: '#000000',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const Radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 26,
  xxxl: 34,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

// Order status mapping
export const OrderStatusLabels: Record<string, string> = {
  ABERTO: 'Pedido recebido',
  PREPARANDO: 'Em preparação',
  PRONTO: 'Pronto para entrega!',
  FECHADO: 'Entregue ✓',
  CANCELADO: 'Cancelado',
};

export const OrderStatusColors: Record<string, string> = {
  ABERTO: Colors.statusAberto,
  PREPARANDO: Colors.statusPreparando,
  PRONTO: Colors.statusPronto,
  FECHADO: Colors.statusFechado,
  CANCELADO: Colors.statusCancelado,
};

// API config
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:5004';
