import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Card } from '../../components';
import { Colors, Gradients, Spacing, BorderRadius, FontSizes, FontWeights } from '../../theme';
import { useAccessibilityStyles } from '../../stores/useAccessibilityStyles';

interface SkinTypeStepProps {
  onNext: (data: { skinType: string }) => void;
  onBack: () => void;
  initialValue?: string;
}

const skinTypes = [
  { 
    id: 'dry', 
    label: 'Sèche', 
    emoji: '🏜️',
    description: 'Tiraillements, desquamations, manque de confort',
    color: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  { 
    id: 'oily', 
    label: 'Grasse', 
    emoji: '✨',
    description: 'Brillances, pores dilatés, excès de sébum',
    color: '#DCFCE7',
    borderColor: '#22C55E',
  },
  { 
    id: 'combination', 
    label: 'Mixte', 
    emoji: '🎭',
    description: 'Zone T grasse, joues normales à sèches',
    color: '#E0E7FF',
    borderColor: '#6366F1',
  },
  { 
    id: 'normal', 
    label: 'Normale', 
    emoji: '😊',
    description: 'Équilibrée, peu de problèmes',
    color: '#FCE7F3',
    borderColor: '#EC4899',
  },
  { 
    id: 'sensitive', 
    label: 'Sensible', 
    emoji: '🌸',
    description: 'Réactive, rougeurs, irritations fréquentes',
    color: '#FEE2E2',
    borderColor: '#EF4444',
  },
];

export function SkinTypeStep({ onNext, onBack, initialValue }: SkinTypeStepProps) {
  const { colors, fontSizes } = useAccessibilityStyles();
  const [selectedType, setSelectedType] = useState(initialValue || '');

  const dynamicStyles = useMemo(() => ({
    title: {
      fontSize: fontSizes['2xl'],
      color: colors.text,
    },
    subtitle: {
      fontSize: fontSizes.base,
      color: colors.textSecondary,
    },
    skinTypeLabel: {
      fontSize: fontSizes.lg,
      color: colors.text,
    },
    skinTypeDesc: {
      fontSize: fontSizes.sm,
      color: colors.textSecondary,
    },
  }), [colors, fontSizes]);

  const handleSubmit = () => {
    onNext({ skinType: selectedType });
  };

  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        <LinearGradient colors={Gradients.primary} style={styles.iconBox}>
          <MaterialCommunityIcons name="water" size={32} color={Colors.white} />
        </LinearGradient>

        <Text style={[styles.title, dynamicStyles.title]}>Votre type de peau</Text>
        <Text style={[styles.subtitle, dynamicStyles.subtitle]}>Sélectionnez le type qui correspond le mieux à votre peau</Text>

        {/* Skin Type Selection */}
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
                  <Text style={[styles.skinTypeLabel, dynamicStyles.skinTypeLabel]}>{skin.label}</Text>
                  <Text style={[styles.skinTypeDesc, dynamicStyles.skinTypeDesc]}>{skin.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <View style={styles.buttons}>
          <Button variant="outline" onPress={onBack} style={{ flex: 1 }}>← Retour</Button>
          <Button onPress={handleSubmit} style={{ flex: 1 }} disabled={!selectedType}>Suivant →</Button>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { paddingHorizontal: Spacing.xl, alignItems: 'center', paddingBottom: Spacing['2xl'] },
  iconBox: {
    width: 64, height: 64, borderRadius: BorderRadius.lg,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl,
  },
  title: { fontSize: FontSizes['2xl'], fontWeight: FontWeights.bold, color: Colors.gray900, textAlign: 'center', marginBottom: Spacing.md },
  subtitle: { fontSize: FontSizes.base, color: Colors.gray500, textAlign: 'center', marginBottom: Spacing['2xl'] },
  card: { width: '100%', padding: Spacing.lg, marginBottom: Spacing.xl },
  skinTypeList: { gap: Spacing.md },
  skinTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.gray200,
    gap: Spacing.md,
  },
  checkBadge: {
    position: 'absolute', top: -8, right: -8,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  skinTypeEmoji: { fontSize: 32 },
  skinTypeContent: { flex: 1 },
  skinTypeLabel: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.gray900, marginBottom: 2 },
  skinTypeDesc: { fontSize: FontSizes.sm, color: Colors.gray500 },
  buttons: { flexDirection: 'row', gap: Spacing.md, width: '100%' },
});
