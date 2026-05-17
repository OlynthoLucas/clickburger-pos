import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, FontSize, FontWeight, Spacing } from '@/constants/theme';
import type { OrderStatus } from '@/types';

const STEPS: { status: OrderStatus; label: string; description: string; icon: string }[] = [
  {
    status: 'ABERTO',
    label: 'Pedido recebido',
    description: 'Seu pedido foi enviado para o restaurante',
    icon: '📋',
  },
  {
    status: 'PREPARANDO',
    label: 'Em preparação',
    description: 'A cozinha está preparando seu pedido',
    icon: '👨‍🍳',
  },
  {
    status: 'PRONTO',
    label: 'Pronto!',
    description: 'Seu pedido está pronto para ser entregue',
    icon: '🔔',
  },
  {
    status: 'FECHADO',
    label: 'Entregue',
    description: 'Bom apetite! 🍔',
    icon: '✅',
  },
];

const STATUS_ORDER: Record<string, number> = {
  ABERTO: 0,
  PREPARANDO: 1,
  PRONTO: 2,
  FECHADO: 3,
  CANCELADO: -1,
};

interface OrderStatusTimelineProps {
  currentStatus: string;
}

export function OrderStatusTimeline({ currentStatus }: OrderStatusTimelineProps) {
  const currentIndex = STATUS_ORDER[currentStatus] ?? 0;
  const isCancelled = currentStatus === 'CANCELADO';

  if (isCancelled) {
    return (
      <View style={styles.cancelledContainer}>
        <Text style={styles.cancelledIcon}>❌</Text>
        <Text style={styles.cancelledTitle}>Pedido cancelado</Text>
        <Text style={styles.cancelledDesc}>Entre em contato com o garçom se precisar de ajuda</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isActive = index === currentIndex;
        const isUpcoming = index > currentIndex;

        return (
          <View key={step.status} style={styles.step}>
            {/* Connector line */}
            {index > 0 && (
              <View
                style={[
                  styles.connector,
                  isCompleted || isActive ? styles.connectorActive : styles.connectorInactive,
                ]}
              />
            )}

            {/* Step indicator */}
            <View style={styles.stepRow}>
              <View
                style={[
                  styles.stepCircle,
                  isCompleted && styles.stepCircleCompleted,
                  isActive && styles.stepCircleActive,
                  isUpcoming && styles.stepCircleUpcoming,
                ]}
              >
                <Text style={styles.stepIcon}>{isCompleted ? '✓' : step.icon}</Text>
              </View>

              <View style={styles.stepContent}>
                <Text
                  style={[
                    styles.stepLabel,
                    isActive && styles.stepLabelActive,
                    isUpcoming && styles.stepLabelUpcoming,
                  ]}
                >
                  {step.label}
                </Text>
                {(isActive || isCompleted) && (
                  <Text style={styles.stepDesc}>{step.description}</Text>
                )}
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.sm,
  },
  step: {
    position: 'relative',
  },
  connector: {
    width: 2,
    height: 24,
    marginLeft: 19,
    marginVertical: 2,
  },
  connectorActive: {
    backgroundColor: Colors.primary,
  },
  connectorInactive: {
    backgroundColor: Colors.borderLight,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  stepCircleCompleted: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  stepCircleActive: {
    backgroundColor: Colors.primary + '15',
    borderColor: Colors.primary,
  },
  stepCircleUpcoming: {
    backgroundColor: Colors.background,
    borderColor: Colors.border,
  },
  stepIcon: {
    fontSize: 18,
  },
  stepContent: {
    flex: 1,
    paddingTop: 8,
    paddingBottom: Spacing.sm,
  },
  stepLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  stepLabelActive: {
    color: Colors.primary,
  },
  stepLabelUpcoming: {
    color: Colors.textMuted,
    fontWeight: FontWeight.regular,
  },
  stepDesc: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },

  // Cancelled state
  cancelledContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  cancelledIcon: {
    fontSize: 48,
  },
  cancelledTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.error,
  },
  cancelledDesc: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
