import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SensitivitiesStepProps {
  onNext: (data: { sensitivities: string[] }) => void;
  onBack: () => void;
  initialValue?: string[];
}

const sensitivities = [
  {
    id: 'fragrance',
    label: 'Parfums',
    emoji: '🌺',
    iconName: 'flower' as const,
    description: 'Réactions aux parfums synthétiques ou naturels',
    gradient: ['#EC4899', '#F472B6'] as const,
    lightBg: '#FDF2F8',
  },
  {
    id: 'alcohol',
    label: 'Alcool',
    emoji: '🧴',
    iconName: 'bottle-wine' as const,
    description: 'Alcool dénaturé dans les produits cosmétiques',
    gradient: ['#EF4444', '#F87171'] as const,
    lightBg: '#FEF2F2',
  },
  {
    id: 'retinol',
    label: 'Rétinol',
    emoji: '⚡',
    iconName: 'lightning-bolt' as const,
    description: 'Desquamation, irritation due au rétinol',
    gradient: ['#F59E0B', '#FBBF24'] as const,
    lightBg: '#FFFBEB',
  },
  {
    id: 'aha-bha',
    label: 'AHA / BHA',
    emoji: '🧪',
    iconName: 'flask' as const,
    description: 'Acides glycolique, salicylique, lactique',
    gradient: ['#8B5CF6', '#A78BFA'] as const,
    lightBg: '#F5F3FF',
  },
  {
    id: 'essential-oils',
    label: 'Huiles Essentielles',
    emoji: '🫒',
    iconName: 'water' as const,
    description: 'Huiles essentielles irritantes',
    gradient: ['#10B981', '#34D399'] as const,
    lightBg: '#ECFDF5',
  },
  {
    id: 'sulfates',
    label: 'Sulfates',
    emoji: '🫧',
    iconName: 'test-tube' as const,
    description: 'Agents moussants agressifs (SLS/SLES)',
    gradient: ['#06B6D4', '#22D3EE'] as const,
    lightBg: '#ECFEFF',
  },
  {
    id: 'parabens',
    label: 'Parabens',
    emoji: '🚫',
    iconName: 'pill' as const,
    description: 'Conservateurs chimiques controversés',
    gradient: ['#6366F1', '#818CF8'] as const,
    lightBg: '#EEF2FF',
  },
  {
    id: 'vitamin-c',
    label: 'Vitamine C',
    emoji: '🍊',
    iconName: 'flask-outline' as const,
    description: 'Concentrations élevées d\'acide ascorbique',
    gradient: ['#D97706', '#F59E0B'] as const,
    lightBg: '#FFFBEB',
  },
  {
    id: 'none',
    label: 'Aucune sensibilité',
    emoji: '✅',
    iconName: 'check-circle' as const,
    description: 'Ma peau tolère bien la plupart des ingrédients',
    gradient: ['#22C55E', '#4ADE80'] as const,
    lightBg: '#F0FDF4',
  },
];

export function SensitivitiesStep({ onNext, onBack, initialValue }: SensitivitiesStepProps) {
  const { colors, fontSizes, getAnimDuration } = useAccessibilityStyles();
  const [selected, setSelected] = useState<string[]>(initialValue || []);

  const dynamicStyles = useMemo(() => ({
    title: {
      fontSize: fontSizes['2xl'],
      color: colors.text,
    },
    subtitle: {
      fontSize: fontSizes.base,
      color: colors.textSecondary,
    },
    cardLabel: {
      fontSize: fontSizes.sm,
      color: colors.text,
    },
    cardDescription: {
      color: colors.textSecondary,
    },
    countText: {
      fontSize: fontSizes.sm,
      color: colors.text,
    },
  }), [colors, fontSizes]);

  const toggleSensitivity = (id: string) => {
    if (id === 'none') {
      setSelected(prev => prev.includes('none') ? [] : ['none']);
      return;
    }
    setSelected(prev => {
      const withoutNone = prev.filter(s => s !== 'none');
      return withoutNone.includes(id)
        ? withoutNone.filter(s => s !== id)
        : [...withoutNone, id];
    });
  };

  const handleSubmit = () => {
    const finalSensitivities = selected.filter(s => s !== 'none');
    onNext({ sensitivities: finalSensitivities });
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'flower':
        return <MaterialCommunityIcons name="flower" size={20} color={Colors.white} />;
      case 'bottle-wine':
        return <MaterialCommunityIcons name="bottle-wine" size={20} color={Colors.white} />;
      case 'lightning-bolt':
        return <MaterialCommunityIcons name="lightning-bolt" size={20} color={Colors.white} />;
      case 'flask':
        return <MaterialCommunityIcons name="flask" size={20} color={Colors.white} />;
      case 'water':
        return <MaterialCommunityIcons name="water" size={20} color={Colors.white} />;
      case 'test-tube':
        return <MaterialCommunityIcons name="test-tube" size={20} color={Colors.white} />;
      case 'pill':
        return <MaterialCommunityIcons name="pill" size={20} color={Colors.white} />;
      case 'flask-outline':
        return <MaterialCommunityIcons name="flask-outline" size={20} color={Colors.white} />;
      case 'check-circle':
        return <Feather name="check-circle" size={20} color={Colors.white} />;
      default:
        return <Feather name="alert-circle" size={20} color={Colors.white} />;
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Animated.View entering={FadeInUp.delay(getAnimDuration(200)).duration(getAnimDuration(500))} style={styles.header}>
        <Animated.View entering={ZoomIn.delay(getAnimDuration(300)).duration(getAnimDuration(400))}>
          <LinearGradient
            colors={['#EF4444', '#F87171']}
            style={styles.iconBadge}
          >
            <Feather name="shield" size={32} color={Colors.white} />
          </LinearGradient>
        </Animated.View>

        <Text style={[styles.title, dynamicStyles.title]}>Sensibilités connues</Text>
        <Text style={[styles.subtitle, dynamicStyles.subtitle]}>
          Sélectionnez les ingrédients auxquels votre peau réagit mal
        </Text>
      </Animated.View>

      {/* Sensitivities Grid */}
      <View style={styles.cardContainer}>
        <View style={styles.grid}>
          {sensitivities.map((item, index) => {
            const isSelected = selected.includes(item.id);

            return (
              <Animated.View
                key={item.id}
                entering={FadeInDown.delay(getAnimDuration(300 + index * 40)).duration(getAnimDuration(400))}
              >
                <TouchableOpacity
                  onPress={() => toggleSensitivity(item.id)}
                  activeOpacity={0.7}
                  style={[
                    styles.sensitivityCard,
                    isSelected && styles.sensitivityCardSelected,
                    { backgroundColor: isSelected ? item.lightBg : Colors.white },
                  ]}
                >
                  {/* Selection Badge */}
                  {isSelected && (
                    <View style={styles.selectionBadge}>
                      <Feather name="check" size={10} color={Colors.white} />
                    </View>
                  )}

                  <View style={styles.cardContent}>
                    <LinearGradient
                      colors={[...item.gradient]}
                      style={styles.iconContainer}
                    >
                      {getIcon(item.iconName)}
                    </LinearGradient>
                    <View style={styles.textContent}>
                      <Text style={[styles.cardLabel, dynamicStyles.cardLabel]}>
                        {item.emoji} {item.label}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.cardDescription, dynamicStyles.cardDescription]}>{item.description}</Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      </View>

      {/* Selected Count */}
      {selected.length > 0 && !selected.includes('none') && (
        <Animated.View entering={FadeInUp.duration(getAnimDuration(300))} style={styles.countBox}>
          <Text style={[styles.countText, dynamicStyles.countText]}>
            ⚠️ <Text style={styles.countNumber}>{selected.length}</Text> sensibilité(s) sélectionnée(s)
          </Text>
        </Animated.View>
      )}

      {/* Navigation Buttons */}
      <Animated.View entering={FadeInUp.delay(getAnimDuration(900)).duration(getAnimDuration(400))} style={styles.buttons}>
        <Button
          variant="outline"
          onPress={onBack}
          style={styles.buttonHalf}
        >
          ← Retour
        </Button>
        <Button
          onPress={handleSubmit}
          disabled={selected.length === 0}
          style={styles.buttonHalf}
        >
          Suivant →
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

  // Header
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.lg,
  },
  title: {
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.bold,
    color: Colors.gray900,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSizes.base,
    color: Colors.gray500,
    textAlign: 'center',
    maxWidth: 300,
  },

  // Card Container
  cardContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    marginBottom: Spacing.lg,
    ...Shadows.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  sensitivityCard: {
    width: (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.base * 2 - Spacing.sm) / 2,
    padding: Spacing.md,
    borderRadius: BorderRadius.base,
    borderWidth: 2,
    borderColor: Colors.gray200,
    marginBottom: Spacing.xs,
  },
  sensitivityCardSelected: {
    borderColor: Colors.primary,
    ...Shadows.md,
  },
  selectionBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    ...Shadows.sm,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.base,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  textContent: {
    flex: 1,
  },
  cardLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.gray700,
  },
  cardDescription: {
    fontSize: 10,
    color: Colors.gray400,
    lineHeight: 14,
    marginLeft: 44,
  },

  // Count Box
  countBox: {
    backgroundColor: Colors.errorAlpha10,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.error + '20',
  },
  countText: {
    fontSize: FontSizes.sm,
    color: Colors.gray700,
    textAlign: 'center',
  },
  countNumber: {
    fontWeight: FontWeights.bold,
    color: Colors.error,
  },

  // Buttons
  buttons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  buttonHalf: {
    flex: 1,
  },
});
