import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card } from '../../components';
import { Colors, Spacing, BorderRadius, FontWeights } from '../../theme';
import { useAccessibilityStyleSheet } from '../../stores/useAccessibilityStyles';
import { useTranslation } from '../../lib/i18n/useTranslation';

interface SkinConcernsStepProps {
  onNext: (data: any) => void;
  onBack: () => void;
  initialValue?: string[];
}

const concernMetadata = [
  { id: 'acne', icon: 'alert-circle-outline' as const, color: '#EF4444' },
  { id: 'wrinkles', icon: 'water-outline' as const, color: '#8B5CF6' },
  { id: 'dark-spots', icon: 'sunny-outline' as const, color: '#F59E0B' },
  { id: 'dryness', icon: 'water-outline' as const, color: '#06B6D4' },
  { id: 'sensitivity', icon: 'sparkles-outline' as const, color: '#F9A8D4' },
  { id: 'redness', icon: 'alert-circle-outline' as const, color: '#FB7185' },
  { id: 'large-pores', icon: 'cloudy-outline' as const, color: '#14B8A6' },
  { id: 'dark-circles', icon: 'eye-outline' as const, color: '#6366F1' },
  { id: 'uneven-texture', icon: 'sparkles-outline' as const, color: '#EC4899' },
  { id: 'dullness', icon: 'sunny-outline' as const, color: '#A855F7' },
];

export function SkinConcernsStep({ onNext, onBack, initialValue }: SkinConcernsStepProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string[]>(initialValue || []);

  const styles = useAccessibilityStyleSheet(({ colors, fontSizes }) => ({
    scroll: { flex: 1 },
    container: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing['2xl'] },
    title: { fontSize: fontSizes['2xl'], fontWeight: FontWeights.bold, color: colors.text, textAlign: 'center', marginBottom: Spacing.md },
    subtitle: { fontSize: fontSizes.base, color: colors.textSecondary, textAlign: 'center', marginBottom: Spacing['2xl'] },
    card: { padding: Spacing.xl, marginBottom: Spacing.xl, backgroundColor: colors.surface },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, justifyContent: 'center' },
    concernButton: {
      width: '45%', padding: Spacing.lg, borderRadius: BorderRadius.base,
      borderWidth: 2, borderColor: colors.border, alignItems: 'center',
    },
    concernActive: { borderColor: colors.primary, backgroundColor: colors.primary + '10' },
    checkBadge: {
      position: 'absolute', top: -8, right: -8,
      width: 22, height: 22, borderRadius: 11,
      backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    },
    concernIcon: {
      width: 48, height: 48, borderRadius: BorderRadius.base,
      alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm,
    },
    concernLabel: { fontSize: fontSizes.sm, fontWeight: FontWeights.medium, color: colors.text, textAlign: 'center' },
    selectionInfo: {
      marginTop: Spacing.xl, padding: Spacing.base,
      backgroundColor: colors.primary + '15', borderRadius: BorderRadius.base,
    },
    selectionText: { fontSize: fontSizes.sm, color: colors.primary, lineHeight: 20 },
    buttons: { flexDirection: 'row', gap: Spacing.md },
  }));

  const toggleConcern = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);
  };

  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        <Text style={styles.title}>{t.onboarding.concerns.title}</Text>
        <Text style={styles.subtitle}>{t.onboarding.concerns.subtitle}</Text>

        <Card variant="elevated" style={styles.card}>
          <View style={styles.grid}>
            {concernMetadata.map((concern) => {
              const isSelected = selected.includes(concern.id);
              const label = (t.onboarding.concerns.labels as any)[concern.id] || concern.id;
              return (
                <TouchableOpacity
                  key={concern.id}
                  style={[styles.concernButton, isSelected ? styles.concernActive : undefined]}
                  onPress={() => toggleConcern(concern.id)}
                  activeOpacity={0.7}
                >
                  {isSelected && (
                    <View style={styles.checkBadge}>
                      <Ionicons name="checkmark" size={12} color={Colors.white} />
                    </View>
                  )}
                  <View style={[styles.concernIcon, { backgroundColor: concern.color + '20' }]}>
                    <Ionicons name={concern.icon} size={24} color={concern.color} />
                  </View>
                  <Text style={styles.concernLabel}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {selected.length > 0 && (
            <View style={styles.selectionInfo}>
              <Text style={styles.selectionText}>
                {t.onboarding.concerns.selection.replace('{count}', selected.length.toString())}
              </Text>
            </View>
          )}
        </Card>

        <View style={styles.buttons}>
          <Button variant="outline" onPress={onBack} style={{ flex: 1 }}>← {t.onboarding.back}</Button>
          <Button onPress={() => onNext({ concerns: selected })} style={{ flex: 1 }} disabled={selected.length === 0}>
            {t.onboarding.next} →
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}
