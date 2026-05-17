import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSize, FontWeight, Radius, Shadow } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useCartStore } from '@/store/cartStore';

export default function OnboardingScreen() {
  const router = useRouter();
  const { setSession } = useCartStore();

  const [name, setName] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [errors, setErrors] = useState<{ name?: string; table?: string }>({});

  const validate = () => {
    const newErrors: { name?: string; table?: string } = {};
    if (!name.trim()) newErrors.name = 'Informe seu nome';
    const tableNum = parseInt(tableNumber, 10);
    if (!tableNumber || isNaN(tableNum) || tableNum < 1) {
      newErrors.table = 'Informe o número da sua mesa';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEnter = () => {
    if (!validate()) return;
    const tableNum = parseInt(tableNumber, 10);
    setSession(name.trim(), tableNum);
    router.replace('/(app)/menu');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <View style={styles.hero}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>🍔</Text>
            </View>
            <Text style={styles.brandName}>ClickBurger</Text>
            <Text style={styles.tagline}>Bateu a fome? Me chamou!</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Bem-vindo!</Text>
            <Text style={styles.cardSubtitle}>
              Preencha os dados abaixo para começar a montar seu pedido
            </Text>

            <View style={styles.form}>
              <Input
                label="Seu nome"
                placeholder="Como devemos te chamar?"
                value={name}
                onChangeText={setName}
                error={errors.name}
                autoCapitalize="words"
                returnKeyType="next"
              />

              <Input
                label="Número da mesa"
                placeholder="Ex: 5"
                value={tableNumber}
                onChangeText={(v) => setTableNumber(v.replace(/\D/g, ''))}
                error={errors.table}
                keyboardType="number-pad"
                returnKeyType="done"
                onSubmitEditing={handleEnter}
              />
            </View>

            <Button
              title="Ver o cardápio 🍔"
              onPress={handleEnter}
              fullWidth
              size="lg"
              style={{ marginTop: Spacing.sm }}
            />
          </View>

          {/* Footer decoration */}
          <View style={styles.decorFooter}>
            <Text style={styles.decorText}>🍟 🥤 🍔 🧅 🥓</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  hero: {
    alignItems: 'center',
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.md,
  },
  logoEmoji: {
    fontSize: 48,
  },
  brandName: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.primary,
    letterSpacing: -0.5,
    fontFamily: 'Poppins_700Bold',
  },
  tagline: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    fontFamily: 'Poppins_400Regular',
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    gap: Spacing.sm,
    ...Shadow.md,
  },
  cardTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    fontFamily: 'Poppins_700Bold',
  },
  cardSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    lineHeight: 20,
    fontFamily: 'Poppins_400Regular',
  },
  form: {
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  decorFooter: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
  },
  decorText: {
    fontSize: 28,
    letterSpacing: 8,
    opacity: 0.4,
  },
});
