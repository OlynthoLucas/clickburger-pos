import React, { useMemo } from 'react';
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Colors, Spacing, FontSize, FontWeight, Radius, Shadow } from '@/constants/theme';
import { fetchMenu, groupMenuByCategory } from '@/services/menuApi';
import { MenuItemCard } from '@/components/menu/MenuItemCard';
import { CartFooter } from '@/components/menu/CartFooter';
import { useCartStore } from '@/store/cartStore';
import type { MenuItem } from '@/types';

export default function MenuScreen() {
  const router = useRouter();
  const { customerName, tableNumber } = useCartStore();

  // Redirect if no session
  React.useEffect(() => {
    if (!tableNumber) {
      router.replace('/');
    }
  }, [tableNumber, router]);

  const { data: menuItems = [], isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['menu'],
    queryFn: fetchMenu,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const sections = useMemo(() => groupMenuByCategory(menuItems), [menuItems]);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Carregando cardápio...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorEmoji}>😕</Text>
        <Text style={styles.errorTitle}>Não conseguimos carregar o cardápio</Text>
        <Text style={styles.errorDesc}>Verifique sua conexão e tente novamente</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Olá, {customerName || 'visitante'}! 👋
          </Text>
          <Text style={styles.subtitle}>
            Mesa {tableNumber} · O que vai querer hoje?
          </Text>
        </View>
        <View style={styles.logoCircle}>
          <Text style={styles.logoEmoji}>🍔</Text>
        </View>
      </View>

      {/* Category nav pills */}
      {sections.length > 0 && (
        <View style={styles.categoryNav}>
          <Text style={styles.categoryNavLabel}>Categorias</Text>
        </View>
      )}

      {/* Menu SectionList */}
      <SectionList
        sections={sections}
        keyExtractor={(item: MenuItem) => item.id}
        renderItem={({ item }) => <MenuItemCard item={item} />}
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <View style={styles.sectionLine} />
          </View>
        )}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={refetch}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🍽️</Text>
            <Text style={styles.emptyText}>Nenhum item no cardápio no momento</Text>
          </View>
        }
      />

      {/* Floating cart footer */}
      <CartFooter />
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
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  greeting: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    fontFamily: 'Poppins_700Bold',
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
    fontFamily: 'Poppins_400Regular',
  },
  logoCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: {
    fontSize: 24,
  },
  categoryNav: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
  },
  categoryNavLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontFamily: 'Poppins_600SemiBold',
  },
  sectionHeader: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    fontFamily: 'Poppins_700Bold',
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.borderLight,
  },
  listContent: {
    paddingBottom: 120, // space for CartFooter
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  loadingText: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    fontFamily: 'Poppins_400Regular',
  },
  errorEmoji: { fontSize: 48 },
  errorTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    textAlign: 'center',
    fontFamily: 'Poppins_600SemiBold',
  },
  errorDesc: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    fontFamily: 'Poppins_400Regular',
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    marginTop: Spacing.sm,
  },
  retryText: {
    color: Colors.white,
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.md,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: Spacing.xxl,
    gap: Spacing.md,
  },
  emptyEmoji: { fontSize: 48 },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
