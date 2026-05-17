import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSize, FontWeight, Radius, Shadow } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { useCartStore } from '@/store/cartStore';
import { createOrder } from '@/services/ordersApi';

export default function CheckoutScreen() {
  const router = useRouter();
  const { items, customerName, tableNumber, clearCart, updateQuantity, removeItem } = useCartStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const handleConfirm = async () => {
    if (items.length === 0) {
      Alert.alert('Carrinho vazio', 'Adicione itens ao pedido antes de confirmar.');
      return;
    }

    if (!tableNumber) {
      Alert.alert('Erro', 'Número da mesa não informado. Volte e informe a mesa.');
      return;
    }

    try {
      setIsSubmitting(true);

      const order = await createOrder({
        tableNumber: tableNumber,
        items: items.map((item) => ({
          menuItemId: item.menuItemId,
          menuItemName: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          notes: '',
        })),
      });

      clearCart();
      router.replace(`/(app)/order/${order.id}`);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ??
        'Não foi possível enviar o pedido. Verifique sua conexão.';
      Alert.alert('Erro ao enviar pedido', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Meu pedido</Text>
          <View style={{ width: 80 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyTitle}>Carrinho vazio</Text>
          <Text style={styles.emptyDesc}>Volte ao cardápio e adicione itens</Text>
          <Button title="Ver cardápio" onPress={() => router.back()} style={{ marginTop: Spacing.lg }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Cardápio</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meu pedido</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Session info */}
        <View style={styles.sessionCard}>
          <View style={styles.sessionRow}>
            <Text style={styles.sessionIcon}>🧑</Text>
            <View>
              <Text style={styles.sessionLabel}>Cliente</Text>
              <Text style={styles.sessionValue}>{customerName}</Text>
            </View>
          </View>
          <View style={styles.sessionDivider} />
          <View style={styles.sessionRow}>
            <Text style={styles.sessionIcon}>🪑</Text>
            <View>
              <Text style={styles.sessionLabel}>Mesa</Text>
              <Text style={styles.sessionValue}>{tableNumber}</Text>
            </View>
          </View>
        </View>

        {/* Items */}
        <Text style={styles.sectionTitle}>Itens do pedido</Text>
        <View style={styles.itemsList}>
          {items.map((item) => (
            <View key={item.menuItemId} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>
                  R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                </Text>
              </View>

              <View style={styles.itemControls}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => {
                    if (item.quantity === 1) {
                      Alert.alert(
                        'Remover item',
                        `Deseja remover ${item.name} do pedido?`,
                        [
                          { text: 'Cancelar', style: 'cancel' },
                          { text: 'Remover', style: 'destructive', onPress: () => removeItem(item.menuItemId) },
                        ]
                      );
                    } else {
                      updateQuantity(item.menuItemId, item.quantity - 1);
                    }
                  }}
                >
                  <Text style={styles.qtyBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.qtyValue}>{item.quantity}</Text>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                >
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Itens</Text>
            <Text style={styles.summaryValue}>
              {items.reduce((s, i) => s + i.quantity, 0)}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              R$ {total.toFixed(2).replace('.', ',')}
            </Text>
          </View>
        </View>

        {/* Note */}
        <View style={styles.noteBox}>
          <Text style={styles.noteText}>
            💡 Após confirmar, o pedido será enviado para a cozinha automaticamente.
            Você poderá acompanhar o andamento em tempo real.
          </Text>
        </View>
      </ScrollView>

      {/* Confirm button */}
      <View style={styles.footer}>
        <Button
          title={isSubmitting ? 'Enviando...' : `Confirmar pedido · R$ ${total.toFixed(2).replace('.', ',')}`}
          onPress={handleConfirm}
          disabled={isSubmitting}
          loading={isSubmitting}
          fullWidth
          size="lg"
        />
      </View>
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
  backBtn: { minWidth: 80 },
  backBtnText: {
    fontSize: FontSize.md,
    color: Colors.primary,
    fontWeight: FontWeight.medium,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    fontFamily: 'Poppins_700Bold',
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  sessionCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadow.sm,
  },
  sessionRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sessionIcon: { fontSize: 24 },
  sessionDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.borderLight,
  },
  sessionLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sessionValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    fontFamily: 'Poppins_700Bold',
    marginTop: Spacing.xs,
  },
  itemsList: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  itemInfo: { flex: 1, gap: 3 },
  itemName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.text,
  },
  itemPrice: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
  itemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    lineHeight: 20,
  },
  qtyValue: {
    width: 28,
    textAlign: 'center',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
  },
  summaryValue: {
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: FontWeight.medium,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.sm,
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
  noteBox: {
    backgroundColor: Colors.primary + '10',
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  noteText: {
    fontSize: FontSize.sm,
    color: Colors.text,
    lineHeight: 20,
  },
  footer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.xl,
  },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    fontFamily: 'Poppins_700Bold',
  },
  emptyDesc: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
