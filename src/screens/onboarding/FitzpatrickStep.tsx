import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { Button } from '../../components/ui/Button';
import { Colors, Spacing, BorderRadius, FontWeights, Shadows } from '../../theme';
import { useAccessibilityStyleSheet } from '../../stores/useAccessibilityStyles';
import { useTranslation } from '../../lib/i18n/useTranslation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FitzpatrickStepProps {
  onNext: (data: { fitzpatrickType: number }) => void;
  onBack: () => void;
  initialValue?: number;
}

export function FitzpatrickStep({ onNext, onBack, initialValue }: FitzpatrickStepProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<number | null>(initialValue || null);
  const [showInfo, setShowInfo] = useState(false);

  const fitzpatrickTypes = useMemo(() => {
    const emojis = ['👩🏻', '👩🏻', '👩🏽', '👩🏽', '👩🏾', '👩🏿'];
    const skinColors = ['#FDEBD0', '#FAD7A0', '#E8C495', '#D4A76A', '#A67B5B', '#795548'];
    const borderColors = ['#F5CBA7', '#F0C27A', '#D4A76A', '#C19A6B', '#8C6744', '#5D4037'];
    
    return t.onboarding.fitzpatrick.types.map((type: any, index: number) => ({
      ...type,
      type: index + 1,
      emoji: emojis[index],
      skinColor: skinColors[index],
      borderColor: borderColors[index],
    }));
  }, [t.onboarding.fitzpatrick.types]);

  const styles = useAccessibilityStyleSheet(({ colors, fontSizes }) => ({
    container: { flex: 1, backgroundColor: colors.background },
    contentContainer: { padding: Spacing.lg, paddingBottom: Spacing['3xl'] },
    header: { alignItems: 'center', marginBottom: Spacing.xl },
    iconBadge: { width: 64, height: 64, borderRadius: BorderRadius.xl, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg, ...Shadows.lg },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
    title: { fontSize: fontSizes['2xl'], fontWeight: FontWeights.bold, color: colors.text },
    infoButton: { padding: Spacing.xs },
    subtitle: { fontSize: fontSizes.base, color: colors.textSecondary, textAlign: 'center' },
    infoBox: { backgroundColor: colors.backgroundSecondary, borderRadius: BorderRadius.lg, padding: Spacing.base, marginBottom: Spacing.lg, borderWidth: 1, borderColor: colors.border },
    infoText: { fontSize: fontSizes.sm, color: colors.text, lineHeight: 22 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: Spacing.sm, marginBottom: Spacing.lg },
    typeCard: { width: (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.sm) / 2, padding: Spacing.base, borderRadius: BorderRadius.lg, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border, marginBottom: Spacing.sm },
    typeCardSelected: { borderColor: colors.primary, ...Shadows.lg },
    selectionBadge: { position: 'absolute', top: -8, right: -8, width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...Shadows.md },
    swatchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
    swatch: { width: 40, height: 40, borderRadius: BorderRadius.base, borderWidth: 2 },
    swatchInfo: { flex: 1 },
    typeLabel: { fontSize: fontSizes.sm, fontWeight: FontWeights.bold, color: colors.text },
    shortDesc: { fontSize: fontSizes.xs, color: colors.textSecondary },
    description: { fontSize: fontSizes.xs, color: colors.textSecondary, lineHeight: 18 },
    expandedInfo: { marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
    details: { fontSize: 10, color: colors.textSecondary, marginBottom: Spacing.xs },
    spfRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
    spfText: { fontSize: 11, fontWeight: FontWeights.medium, color: colors.primary },
    skipButton: { alignItems: 'center', marginBottom: Spacing.lg },
    skipText: { fontSize: fontSizes.sm, color: colors.textSecondary, textDecorationLine: 'underline' },
    buttons: { flexDirection: 'row', gap: Spacing.md },
    buttonHalf: { flex: 1 },
  }));

  const handleSubmit = () => {
    if (selected !== null) {
      onNext({ fitzpatrickType: selected });
    }
  };

  const handleSkip = () => {
    onNext({ fitzpatrickType: 1 });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.header}>
        <Animated.View entering={ZoomIn.delay(300).duration(400)}>
          <LinearGradient
            colors={['#FBBF24', '#F59E0B']}
            style={styles.iconBadge}
          >
            <Feather name="sun" size={32} color={Colors.white} />
          </LinearGradient>
        </Animated.View>

        <View style={styles.titleRow}>
          <Text style={styles.title}>{t.onboarding.fitzpatrick.title}</Text>
          <TouchableOpacity
            onPress={() => setShowInfo(!showInfo)}
            style={styles.infoButton}
          >
            <Feather name="help-circle" size={20} color={Colors.gray400} />
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>
          {t.onboarding.fitzpatrick.subtitle}
        </Text>
      </Animated.View>

      {showInfo && (
        <Animated.View entering={FadeInDown.duration(300)} style={styles.infoBox}>
          <Text style={styles.infoText}>
            {t.onboarding.fitzpatrick.info}
          </Text>
        </Animated.View>
      )}

      <View style={styles.grid}>
        {fitzpatrickTypes.map((type: any, index: number) => {
          const isSelected = selected === type.type;

          return (
            <Animated.View
              key={type.type}
              entering={FadeInDown.delay(300 + index * 70).duration(400)}
            >
              <TouchableOpacity
                onPress={() => setSelected(type.type)}
                activeOpacity={0.7}
                style={[
                  styles.typeCard,
                  isSelected && styles.typeCardSelected,
                ]}
              >
                {isSelected && (
                  <View style={styles.selectionBadge}>
                    <Feather name="check" size={12} color={Colors.white} />
                  </View>
                )}

                <View style={styles.swatchRow}>
                  <View
                    style={[
                      styles.swatch,
                      {
                        backgroundColor: type.skinColor,
                        borderColor: type.borderColor,
                      },
                    ]}
                  />
                  <View style={styles.swatchInfo}>
                    <Text style={styles.typeLabel}>{type.label}</Text>
                    <Text style={styles.shortDesc}>{type.short}</Text>
                  </View>
                </View>

                <Text style={styles.description}>{type.desc}</Text>

                    <View style={styles.spfRow}>
                      <Feather name="sun" size={12} color="#F59E0B" />
                      <Text style={styles.spfText}>{type.spf}</Text>
                    </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>

      <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
        <Text style={styles.skipText}>{t.onboarding.fitzpatrick.skip}</Text>
      </TouchableOpacity>

      <Animated.View entering={FadeInUp.delay(900).duration(400)} style={styles.buttons}>
        <Button
          variant="outline"
          onPress={onBack}
          style={styles.buttonHalf}
        >
          ← {t.onboarding.back}
        </Button>
        <Button
          onPress={handleSubmit}
          disabled={selected === null}
          style={styles.buttonHalf}
        >
          {t.onboarding.next} →
        </Button>
      </Animated.View>
    </ScrollView>
  );
}
