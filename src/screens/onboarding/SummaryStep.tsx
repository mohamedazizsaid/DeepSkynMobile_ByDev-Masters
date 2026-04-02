import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInUp,
  ZoomIn,
} from 'react-native-reanimated';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '../../components/ui/Button';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights, Shadows } from '../../theme';
import { useAccessibilityStyles } from '../../stores/useAccessibilityStyles';

interface SummaryStepProps {
  data: {
    skinType?: string;
    fitzpatrickType?: number;
    concerns?: string[];
    sensitivities?: string[];
  };
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

// Labels for skin types
const skinTypeLabels: Record<string, string> = {
  dry: 'Sèche',
  oily: 'Grasse',
  combination: 'Mixte',
  normal: 'Normale',
  sensitive: 'Sensible',
};

// Labels for Fitzpatrick types
const fitzpatrickLabels: Record<string, string> = {
  '1': 'Type I - Très claire',
  '2': 'Type II - Claire',
  '3': 'Type III - Intermédiaire',
  '4': 'Type IV - Mate',
  '5': 'Type V - Foncée',
  '6': 'Type VI - Très foncée',
};

export function SummaryStep({ data, onSubmit, onBack, isSubmitting }: SummaryStepProps) {
  const { colors, fontSizes, getAnimDuration } = useAccessibilityStyles();
  const [showConfetti, setShowConfetti] = useState(false);

  const dynamicStyles = useMemo(() => ({
    title: {
      fontSize: fontSizes['2xl'],
      color: colors.text,
    },
    subtitle: {
      fontSize: fontSizes.base,
      color: colors.textSecondary,
    },
    sectionValue: {
      fontSize: fontSizes.base,
      color: colors.text,
    },
    privacyText: {
      fontSize: fontSizes.xs,
      color: colors.textSecondary,
    },
  }), [colors, fontSizes]);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(true), getAnimDuration(600));
    return () => clearTimeout(timer);
  }, [getAnimDuration]);

  const sections = [
    {
      icon: <MaterialCommunityIcons name="water" size={20} color={Colors.white} />,
      label: 'Type de peau',
      value: data.skinType
        ? skinTypeLabels[data.skinType] || data.skinType
        : 'Non renseigné',
      gradient: ['#0EA5E9', '#06B6D4'] as const,
    },
    {
      icon: <Feather name="sun" size={20} color={Colors.white} />,
      label: 'Phototype',
      value: data.fitzpatrickType
        ? fitzpatrickLabels[data.fitzpatrickType.toString()] || `Type ${data.fitzpatrickType}`
        : 'Non renseigné',
      gradient: ['#F59E0B', '#FBBF24'] as const,
    },
    {
      icon: <Feather name="alert-circle" size={20} color={Colors.white} />,
      label: 'Préoccupations',
      value:
        data.concerns && data.concerns.length > 0
          ? data.concerns.join(', ')
          : 'Aucune',
      gradient: ['#EC4899', '#F472B6'] as const,
    },
    {
      icon: <Feather name="shield" size={20} color={Colors.white} />,
      label: 'Sensibilités',
      value:
        data.sensitivities && data.sensitivities.length > 0
          ? data.sensitivities.join(', ')
          : 'Aucune',
      gradient: ['#EF4444', '#F87171'] as const,
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Confetti Effect (simplified) */}
      {showConfetti && (
        <View style={styles.confettiContainer}>
          {[...Array(12)].map((_, i) => (
            <Animated.View
              key={i}
              entering={FadeInDown.delay(getAnimDuration(i * 80))
                .duration(getAnimDuration(2000))}
              style={[
                styles.confetti,
                {
                  left: `${10 + Math.random() * 80}%`,
                  backgroundColor: [
                    Colors.primary,
                    Colors.pink,
                    Colors.success,
                    Colors.amber,
                    Colors.purple,
                    Colors.error,
                  ][i % 6],
                },
              ]}
            />
          ))}
        </View>
      )}

      {/* Header */}
      <Animated.View entering={FadeInUp.delay(getAnimDuration(200)).duration(getAnimDuration(500))} style={styles.header}>
        <Animated.View entering={ZoomIn.delay(getAnimDuration(300)).duration(getAnimDuration(400))}>
          <View style={styles.iconWrapper}>
            <View style={styles.iconGlow} />
            <LinearGradient
              colors={['#10B981', '#34D399']}
              style={styles.iconBadge}
            >
              <Feather name="heart" size={36} color={Colors.white} />
            </LinearGradient>
          </View>
        </Animated.View>

        <Text style={[styles.title, dynamicStyles.title]}>Récapitulatif</Text>
        <Text style={[styles.subtitle, dynamicStyles.subtitle]}>
          Vérifiez vos informations avant de continuer
        </Text>
      </Animated.View>

      {/* Summary Card */}
      <Animated.View
        entering={FadeInUp.delay(getAnimDuration(500)).duration(getAnimDuration(400))}
        style={styles.summaryCard}
      >
        {sections.map((section, index) => (
          <Animated.View
            key={index}
            entering={FadeInDown.delay(getAnimDuration(600 + index * 100)).duration(getAnimDuration(400))}
            style={styles.sectionItem}
          >
            <LinearGradient
              colors={[...section.gradient]}
              style={styles.sectionIcon}
            >
              {section.icon}
            </LinearGradient>

            <View style={styles.sectionContent}>
              <Text style={styles.sectionLabel}>{section.label}</Text>
              <Text style={[styles.sectionValue, dynamicStyles.sectionValue]}>{section.value}</Text>
            </View>

            <View style={styles.checkContainer}>
              <Feather name="check-circle" size={20} color={Colors.success} />
            </View>
          </Animated.View>
        ))}
      </Animated.View>

      {/* Privacy Note */}
      <Animated.View entering={FadeInUp.delay(getAnimDuration(1000)).duration(getAnimDuration(400))} style={styles.privacyNote}>
        <MaterialCommunityIcons name="shimmer" size={16} color={Colors.primary} />
        <Text style={[styles.privacyText, dynamicStyles.privacyText]}>
          Vos données sont sécurisées et confidentielles
        </Text>
      </Animated.View>

      {/* Navigation Buttons */}
      <Animated.View entering={FadeInUp.delay(getAnimDuration(1100)).duration(getAnimDuration(400))} style={styles.buttons}>
        <Button
          variant="outline"
          onPress={onBack}
          disabled={isSubmitting}
          style={styles.buttonHalf}
        >
          ← Modifier
        </Button>
        <Button
          onPress={onSubmit}
          loading={isSubmitting}
          style={[styles.buttonHalf, styles.confirmButton]}
        >
          {isSubmitting ? 'Enregistrement...' : 'Confirmer →'}
        </Button>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },

  // Confetti
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    top: -20,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  iconWrapper: {
    position: 'relative',
    marginBottom: Spacing.lg,
  },
  iconGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: BorderRadius['2xl'],
    backgroundColor: Colors.success,
    opacity: 0.2,
    top: -8,
    left: -8,
  },
  iconBadge: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.xl,
  },
  title: {
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.bold,
    color: Colors.gray900,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSizes.base,
    color: Colors.gray500,
    textAlign: 'center',
  },

  // Summary Card
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.xl,
  },
  sectionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.base,
    borderRadius: BorderRadius.base,
    backgroundColor: Colors.gray50,
    borderWidth: 1,
    borderColor: Colors.gray100,
    marginBottom: Spacing.md,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.base,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    ...Shadows.sm,
  },
  sectionContent: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: FontWeights.bold,
    color: Colors.gray400,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  sectionValue: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.medium,
    color: Colors.gray900,
    textTransform: 'capitalize',
    lineHeight: 22,
  },
  checkContainer: {
    marginLeft: Spacing.sm,
    marginTop: 2,
  },

  // Privacy Note
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  privacyText: {
    fontSize: FontSizes.xs,
    color: Colors.gray500,
  },

  // Buttons
  buttons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  buttonHalf: {
    flex: 1,
  },
  confirmButton: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
});
