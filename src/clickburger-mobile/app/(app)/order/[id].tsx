import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Colors, Spacing, FontSize, FontWeight, Radius, Shadow } from '@/constants/theme';
import { OrderStatusLabels, OrderStatusColors } from '@/constants/theme';
import { fetchOrder } from '@/services/ordersApi';
import { OrderStatusTimeline } from '@/components/order/OrderStatusTimeline';
import { useCartStore } from '@/store/cartStore';

const POLLING_INTERVAL = 5000; // 5 seconds

export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { customerName, tableNumber } = useCartStore();

  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Animated pulse for "live" indicator
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const {
    data: order,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['order', id],
    queryFn: () => fetchOrder(id!),
    enabled: !!id,
    refetchInterval: (query) => {
      // Stop polling when order is in a terminal state
      const status = query.state.data?.status;
      if (status === 'FECHADO' || status === 'CANCELADO') return false;
      return POLLING_INTERVAL;
    },
    staleTime: 0, // Always fetch fresh data
  });

  const isTerminal = order?.status === 'FECHADO' || order?.status === 'CANCELADO';

  const handleNewOrder = () => {
    router.replace('/(app)/menu');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Carregando pedido...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !order) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorEmoji}>😕</Text>
          <Text style={styles.errorTitle}>Pedido não encontrado</Text>
          <Text style={styles.errorDesc}>
            Não conseguimos encontrar seu pedido. Entre em contato com o garçom.
          </Text>
          <TouchableOpacity style={styles.button} onPress={() => router.replace('/')}>
            <Text style={styles.buttonText}>Voltar ao início</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusColor = OrderStatusColors[order.status] ?? Colors.textMuted;
  const statusLabel = OrderStatusLabels[order.status] ?? order.status;
  const orderTotal = order.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Acompanhar pedido</Text>
          <Text style={styles.headerSub}>Mesa {order.tableNumber}</Text>
        </View>

        {!isTerminal && (
          <Animated.View style={[styles.liveIndicator, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Ao vivo</Text>
          </Animated.View>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status hero */}
        <View style={[styles.statusHero, { borderColor: statusColor + '40' }]}>
          <View style={[styles.statusIconCircle, { backgroundColor: statusColor + '20' }]}>
            <Text style={styles.statusIcon}>
              {order.status === 'ABERTO' ? '📋'
                : order.status === 'PREPARANDO' ? '👨‍🍳'
                : order.status === 'PRONTO' ? '🔔'
                : order.status === 'FECHADO' ? '✅'
                : '❌'}
            </Text>
          </View>
          <Text style={[styles.statusLabel, { color: statusColor }]}>{statusLabel}</Text>
          {!isTerminal && (
            <Text style={styles.pollingNote}>Atualizando a cada 5 segundos...</Text>
          )}
        </View>

        {/* Timeline */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Progresso do pedido</Text>
          <OrderStatusTimeline currentStatus={order.status} />
        </View>

        {/* Order details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Itens pedidos</Text>
          {order.items.map((item, index) => (
            <View
              key={`${item.menuItemId}-${index}`}
              style={[
                styles.itemRow,
                index < order.items.length - 1 && styles.itemRowBorder,
              ]}
            >
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.menuItemName}</Text>
                <Text style={styles.itemQty}>{item.quantity}x</Text>
              </View>
              <Text style={styles.itemPrice}>
                R$ {(item.unitPrice * item.quantity).toFixed(2).replace('.', ',')}
              </Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              R$ {orderTotal.toFixed(2).replace('.', ',')}
            </Text>
          </View>
        </View>

        {/* Customer info */}
        {customerName && (
          <View style={styles.customerCard}>
            <Text style={styles.customerText}>
              👤 {customerName} · Mesa {order.tableNumber}
            </Text>
          </View>
        )}

        {/* CTA — always visible (user can order again anytime) */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Quer mais alguma coisa?</Text>
          <Text style={styles.ctaDesc}>
            Você pode fazer um novo pedido a qualquer momento!
          </Text>
          <TouchableOpacity style={styles.newOrderBtn} onPress={handleNewOrder}>
            <Text style={styles.newOrderBtnText}>+ Fazer novo pedido</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    fontFamily: 'Poppins_700Bold',
  },
  headerSub: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontFamily: 'Poppins_400Regular',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.error + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
  },
  liveText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.error,
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  statusHero: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 2,
    ...Shadow.md,
  },
  statusIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIcon: { fontSize: 40 },
  statusLabel: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    fontFamily: 'Poppins_700Bold',
  },
  pollingNote: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
    fontFamily: 'Poppins_400Regular',
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  cardTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    fontFamily: 'Poppins_700Bold',
    marginBottom: Spacing.xs,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  itemInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  itemQty: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    backgroundColor: Colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  itemName: {
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: FontWeight.medium,
    flex: 1,
  },
  itemPrice: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    marginTop: Spacing.xs,
  },
  totalLabel: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    fontFamily: 'Poppins_700Bold',
  },
  totalValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    color: Colors.primary,
    fontFamily: 'Poppins_700Bold',
  },
  customerCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  customerText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  ctaSection: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  ctaTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    fontFamily: 'Poppins_700Bold',
  },
  ctaDesc: {
    fontSize: FontSize.sm,
    color: Colors.white + 'CC',
    textAlign: 'center',
    fontFamily: 'Poppins_400Regular',
  },
  newOrderBtn: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    marginTop: Spacing.xs,
  },
  newOrderBtnText: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.md,
    fontFamily: 'Poppins_700Bold',
  },

  // Error/Loading
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
  },
  errorEmoji: { fontSize: 56 },
  errorTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    textAlign: 'center',
    fontFamily: 'Poppins_700Bold',
  },
  errorDesc: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    marginTop: Spacing.sm,
  },
  buttonText: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.md,
  },
});
