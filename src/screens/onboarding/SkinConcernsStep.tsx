import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card } from '../../components';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights } from '../../theme';
import { useAccessibilityStyles } from '../../stores/useAccessibilityStyles';

interface SkinConcernsStepProps {
  onNext: (data: any) => void;
  onBack: () => void;
}

const concerns = [
  { id: 'acne', label: 'Acne & Breakouts', icon: 'alert-circle-outline' as const, color: '#EF4444' },
  { id: 'wrinkles', label: 'Wrinkles & Fine Lines', icon: 'water-outline' as const, color: '#8B5CF6' },
  { id: 'dark-spots', label: 'Dark Spots', icon: 'sunny-outline' as const, color: '#F59E0B' },
  { id: 'dryness', label: 'Dryness', icon: 'water-outline' as const, color: '#06B6D4' },
  { id: 'sensitivity', label: 'Sensitivity', icon: 'sparkles-outline' as const, color: '#F9A8D4' },
  { id: 'redness', label: 'Redness', icon: 'alert-circle-outline' as const, color: '#FB7185' },
  { id: 'large-pores', label: 'Large Pores', icon: 'cloudy-outline' as const, color: '#14B8A6' },
  { id: 'dark-circles', label: 'Dark Circles', icon: 'eye-outline' as const, color: '#6366F1' },
  { id: 'uneven-texture', label: 'Uneven Texture', icon: 'sparkles-outline' as const, color: '#EC4899' },
  { id: 'dullness', label: 'Dullness', icon: 'sunny-outline' as const, color: '#A855F7' },
];

export function SkinConcernsStep({ onNext, onBack }: SkinConcernsStepProps) {
  const { colors, fontSizes } = useAccessibilityStyles();
  const [selected, setSelected] = useState<string[]>([]);

  const dynamicStyles = useMemo(() => ({
    title: {
      fontSize: fontSizes['2xl'],
      color: colors.text,
    },
    subtitle: {
      fontSize: fontSizes.base,
      color: colors.textSecondary,
    },
    concernLabel: {
      fontSize: fontSizes.sm,
      color: colors.text,
    },
    selectionText: {
      fontSize: fontSizes.sm,
      color: colors.primary,
    },
  }), [colors, fontSizes]);

  const toggleConcern = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);
  };

  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        <Text style={[styles.title, dynamicStyles.title]}>What Are Your Skin Concerns?</Text>
        <Text style={[styles.subtitle, dynamicStyles.subtitle]}>Select all that apply - this helps us personalize your routine</Text>

        <Card variant="elevated" style={styles.card}>
          <View style={styles.grid}>
            {concerns.map((concern) => {
              const isSelected = selected.includes(concern.id);
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
                    <Ionicons name={concern.icon as any} size={24} color={concern.color} />
                  </View>
                  <Text style={[styles.concernLabel, dynamicStyles.concernLabel]}>{concern.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {selected.length > 0 && (
            <View style={styles.selectionInfo}>
              <Text style={[styles.selectionText, dynamicStyles.selectionText]}>
                ✨ You've selected <Text style={{ fontWeight: FontWeights.bold }}>{selected.length}</Text> concern{selected.length !== 1 ? 's' : ''}. We'll tailor your skincare routine to address these.
              </Text>
            </View>
          )}
        </Card>

        <View style={styles.buttons}>
          <Button variant="outline" onPress={onBack} style={{ flex: 1 }}>Back</Button>
          <Button onPress={() => onNext({ concerns: selected })} style={{ flex: 1 }} disabled={selected.length === 0}>
            Continue
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing['2xl'] },
  title: { fontSize: FontSizes['2xl'], fontWeight: FontWeights.bold, color: Colors.gray900, textAlign: 'center', marginBottom: Spacing.md },
  subtitle: { fontSize: FontSizes.base, color: Colors.gray500, textAlign: 'center', marginBottom: Spacing['2xl'] },
  card: { padding: Spacing['2xl'], marginBottom: Spacing.xl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, justifyContent: 'center' },
  concernButton: {
    width: '45%', padding: Spacing.lg, borderRadius: BorderRadius.base,
    borderWidth: 2, borderColor: Colors.gray200, alignItems: 'center',
  },
  concernActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryAlpha5 },
  checkBadge: {
    position: 'absolute', top: -8, right: -8,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  concernIcon: {
    width: 48, height: 48, borderRadius: BorderRadius.base,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm,
  },
  concernLabel: { fontSize: FontSizes.sm, fontWeight: FontWeights.medium, color: Colors.gray700, textAlign: 'center' },
  selectionInfo: {
    marginTop: Spacing.xl, padding: Spacing.base,
    backgroundColor: Colors.primaryAlpha10, borderRadius: BorderRadius.base,
  },
  selectionText: { fontSize: FontSizes.sm, color: Colors.primary, lineHeight: 20 },
  buttons: { flexDirection: 'row', gap: Spacing.md },
});
