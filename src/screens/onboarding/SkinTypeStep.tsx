import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Card } from '../../components';
import { Colors, Gradients, Spacing, BorderRadius, FontWeights } from '../../theme';
import { useAccessibilityStyleSheet } from '../../stores/useAccessibilityStyles';
import { useTranslation } from '../../lib/i18n/useTranslation';

interface SkinTypeStepProps {
  onNext: (data: { skinType: string }) => void;
  onBack: () => void;
  initialValue?: string;
}

export function SkinTypeStep({ onNext, onBack, initialValue }: SkinTypeStepProps) {
  const { t } = useTranslation();
  const [selectedType, setSelectedType] = useState(initialValue || '');

  const skinTypes = useMemo(() => [
    { id: 'dry', emoji: '🏜️', color: '#FEF3C7', borderColor: '#F59E0B', ...t.onboarding.skinTypes.dry },
    { id: 'oily', emoji: '✨', color: '#DCFCE7', borderColor: '#22C55E', ...t.onboarding.skinTypes.oily },
    { id: 'combination', emoji: '🎭', color: '#E0E7FF', borderColor: '#6366F1', ...t.onboarding.skinTypes.combination },
    { id: 'normal', emoji: '😊', color: '#FCE7F3', borderColor: '#EC4899', ...t.onboarding.skinTypes.normal },
    { id: 'sensitive', emoji: '🌸', color: '#FEE2E2', borderColor: '#EF4444', ...t.onboarding.skinTypes.sensitive },
  ], [t.onboarding.skinTypes]);

  const styles = useAccessibilityStyleSheet(({ colors, fontSizes }) => ({
    scroll: { flex: 1 },
    container: { paddingHorizontal: Spacing.xl, alignItems: 'center', paddingBottom: Spacing['2xl'] },
    iconBox: {
      width: 64, height: 64, borderRadius: BorderRadius.lg,
      alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl,
    },
    title: { fontSize: fontSizes['2xl'], fontWeight: FontWeights.bold, color: colors.text, textAlign: 'center', marginBottom: Spacing.md },
    subtitle: { fontSize: fontSizes.base, color: colors.textSecondary, textAlign: 'center', marginBottom: Spacing['2xl'] },
    card: { width: '100%', padding: Spacing.lg, marginBottom: Spacing.xl, backgroundColor: colors.surface },
    skinTypeList: { gap: Spacing.md },
    skinTypeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.md,
      borderRadius: BorderRadius.lg,
      borderWidth: 2,
      borderColor: colors.border,
      gap: Spacing.md,
    },
    checkBadge: {
      position: 'absolute', top: -8, right: -8,
      width: 24, height: 24, borderRadius: 12,
      backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    },
    skinTypeEmoji: { fontSize: 32 },
    skinTypeContent: { flex: 1 },
    skinTypeLabel: { fontSize: fontSizes.lg, fontWeight: FontWeights.bold, color: colors.text, marginBottom: 2 },
    skinTypeDesc: { fontSize: fontSizes.sm, color: colors.textSecondary },
    buttons: { flexDirection: 'row', gap: Spacing.md, width: '100%' },
  }));

  const handleSubmit = () => {
    onNext({ skinType: selectedType });
  };

  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        <LinearGradient colors={Gradients.primary} style={styles.iconBox}>
          <MaterialCommunityIcons name="water" size={32} color={Colors.white} />
        </LinearGradient>

        <Text style={styles.title}>{t.onboarding.steps[2]}</Text>
        <Text style={styles.subtitle}>{t.onboarding.fitzpatrick.subtitle}</Text> 
        {/* Wait, I should use a more general key if available or add one */}

        <Card variant="elevated" style={styles.card}>
          <View style={styles.skinTypeList}>
            {skinTypes.map((skin) => (
              <TouchableOpacity
                key={skin.id}
                style={[
                  styles.skinTypeButton,
                  { backgroundColor: skin.color },
                  selectedType === skin.id && { borderColor: skin.borderColor, borderWidth: 3 },
                ]}
                onPress={() => setSelectedType(skin.id)}
              >
                {selectedType === skin.id && (
                  <View style={[styles.checkBadge, { backgroundColor: skin.borderColor }]}>
                    <Ionicons name="checkmark" size={12} color={Colors.white} />
                  </View>
                )}
                <Text style={styles.skinTypeEmoji}>{skin.emoji}</Text>
                <View style={styles.skinTypeContent}>
                  <Text style={styles.skinTypeLabel}>{skin.label}</Text>
                  <Text style={styles.skinTypeDesc}>{skin.desc}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <View style={styles.buttons}>
          <Button variant="outline" onPress={onBack} style={{ flex: 1 }}>← {t.onboarding.back}</Button>
          <Button onPress={handleSubmit} style={{ flex: 1 }} disabled={!selectedType}>{t.onboarding.next} →</Button>
        </View>
      </View>
    </ScrollView>
  );
}
