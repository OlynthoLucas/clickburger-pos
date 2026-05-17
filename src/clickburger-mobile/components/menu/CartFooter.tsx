import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Radius, FontSize, FontWeight, Shadow, Spacing } from '@/constants/theme';
import { useCartStore } from '@/store/cartStore';

export function CartFooter() {
  const router = useRouter();
  const { items, tableNumber } = useCartStore();

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const slideAnim = React.useRef(new Animated.Value(100)).current;
  const visible = itemCount > 0;

  React.useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: visible ? 0 : 100,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();
  }, [visible, slideAnim]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.inner}>
        <View style={styles.info}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{itemCount}</Text>
          </View>
          <View>
            <Text style={styles.label}>Meu pedido</Text>
            {tableNumber && (
              <Text style={styles.table}>Mesa {tableNumber}</Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/(app)/checkout')}
          activeOpacity={0.9}
        >
          <Text style={styles.buttonText}>
            Ver pedido · R$ {total.toFixed(2).replace('.', ',')}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.md,
    paddingBottom: 24,
    paddingTop: Spacing.sm,
  },
  inner: {
    backgroundColor: Colors.text,
    borderRadius: Radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    ...Shadow.lg,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  badge: {
    backgroundColor: Colors.primary,
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  label: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  table: {
    color: Colors.textLight,
    fontSize: FontSize.xs,
    marginTop: 1,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.lg,
  },
  buttonText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
});
