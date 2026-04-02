import React, { useState } from 'react';
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
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '../../components/ui/Button';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights, Shadows } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FitzpatrickStepProps {
  onNext: (data: { fitzpatrickType: number }) => void;
  onBack: () => void;
  initialValue?: number;
}

const fitzpatrickTypes = [
  {
    type: 1,
    label: 'Type I',
    emoji: '👩🏻',
    shortDesc: 'Très claire',
    description: 'Brûle toujours, ne bronze jamais',
    details: 'Peau très pâle, taches de rousseur, cheveux roux/blonds',
    skinColor: '#FDEBD0',
    borderColor: '#F5CBA7',
    spf: 'SPF 50+ indispensable',
  },
  {
    type: 2,
    label: 'Type II',
    emoji: '👩🏻',
    shortDesc: 'Claire',
    description: 'Brûle facilement, bronze légèrement',
    details: 'Peau claire, cheveux blonds à châtains',
    skinColor: '#FAD7A0',
    borderColor: '#F0C27A',
    spf: 'SPF 50 recommandé',
  },
  {
    type: 3,
    label: 'Type III',
    emoji: '👩🏽',
    shortDesc: 'Intermédiaire',
    description: 'Brûle modérément, bronze graduellement',
    details: 'Peau mate claire, cheveux châtains',
    skinColor: '#E8C495',
    borderColor: '#D4A76A',
    spf: 'SPF 30-50 recommandé',
  },
  {
    type: 4,
    label: 'Type IV',
    emoji: '👩🏽',
    shortDesc: 'Mate',
    description: 'Brûle rarement, bronze facilement',
    details: 'Peau mate, cheveux bruns/noirs',
    skinColor: '#D4A76A',
    borderColor: '#C19A6B',
    spf: 'SPF 30 recommandé',
  },
  {
    type: 5,
    label: 'Type V',
    emoji: '👩🏾',
    shortDesc: 'Foncée',
    description: 'Brûle très rarement, bronze très facilement',
    details: 'Peau brune, cheveux noirs',
    skinColor: '#A67B5B',
    borderColor: '#8C6744',
    spf: 'SPF 15-30 recommandé',
  },
  {
    type: 6,
    label: 'Type VI',
    emoji: '👩🏿',
    shortDesc: 'Très foncée',
    description: 'Ne brûle jamais, pigmentation profonde',
    details: 'Peau très foncée, cheveux noirs',
    skinColor: '#795548',
    borderColor: '#5D4037',
    spf: 'SPF 15 minimum',
  },
];

export function FitzpatrickStep({ onNext, onBack, initialValue }: FitzpatrickStepProps) {
  const [selected, setSelected] = useState<number | null>(initialValue || null);
  const [showInfo, setShowInfo] = useState(false);

  const handleSubmit = () => {
    if (selected !== null) {
      onNext({ fitzpatrickType: selected });
    }
  };

  const handleSkip = () => {
    onNext({ fitzpatrickType: undefined });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
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
          <Text style={styles.title}>Phototype de peau</Text>
          <TouchableOpacity
            onPress={() => setShowInfo(!showInfo)}
            style={styles.infoButton}
          >
            <Feather name="help-circle" size={20} color={Colors.gray400} />
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>
          Comment votre peau réagit-elle au soleil ?
        </Text>
      </Animated.View>

      {/* Info Box */}
      {showInfo && (
        <Animated.View entering={FadeInDown.duration(300)} style={styles.infoBox}>
          <Text style={styles.infoText}>
            Le phototype (échelle Fitzpatrick) détermine la sensibilité de votre peau au soleil. 
            Cela nous aide à vous recommander la protection solaire adaptée.
          </Text>
        </Animated.View>
      )}

      {/* Fitzpatrick Types Grid */}
      <View style={styles.grid}>
        {fitzpatrickTypes.map((type, index) => {
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
                {/* Selection Badge */}
                {isSelected && (
                  <View style={styles.selectionBadge}>
                    <Feather name="check" size={12} color={Colors.white} />
                  </View>
                )}

                {/* Skin Color Swatch */}
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
                    <Text style={styles.shortDesc}>{type.shortDesc}</Text>
                  </View>
                </View>

                <Text style={styles.description}>{type.description}</Text>

                {isSelected && (
                  <View style={styles.expandedInfo}>
                    <Text style={styles.details}>{type.details}</Text>
                    <View style={styles.spfRow}>
                      <Feather name="sun" size={12} color={Colors.amber} />
                      <Text style={styles.spfText}>{type.spf}</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>

      {/* Skip Option */}
      <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
        <Text style={styles.skipText}>Passer cette étape</Text>
      </TouchableOpacity>

      {/* Navigation Buttons */}
      <Animated.View entering={FadeInUp.delay(900).duration(400)} style={styles.buttons}>
        <Button
          variant="outline"
          onPress={onBack}
          style={styles.buttonHalf}
        >
          ← Retour
        </Button>
        <Button
          onPress={handleSubmit}
          disabled={selected === null}
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.bold,
    color: Colors.gray900,
  },
  infoButton: {
    padding: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSizes.base,
    color: Colors.gray500,
    textAlign: 'center',
  },

  // Info Box
  infoBox: {
    backgroundColor: Colors.warningAlpha10,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.warning + '30',
  },
  infoText: {
    fontSize: FontSizes.sm,
    color: Colors.gray700,
    lineHeight: 22,
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  typeCard: {
    width: (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.sm) / 2,
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.gray200,
    marginBottom: Spacing.sm,
  },
  typeCardSelected: {
    borderColor: Colors.primary,
    ...Shadows.lg,
  },
  selectionBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  swatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.base,
    borderWidth: 2,
  },
  swatchInfo: {
    flex: 1,
  },
  typeLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.gray900,
  },
  shortDesc: {
    fontSize: FontSizes.xs,
    color: Colors.gray500,
  },
  description: {
    fontSize: FontSizes.xs,
    color: Colors.gray600,
    lineHeight: 18,
  },
  expandedInfo: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
  },
  details: {
    fontSize: 10,
    color: Colors.gray400,
    marginBottom: Spacing.xs,
  },
  spfRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  spfText: {
    fontSize: 11,
    fontWeight: FontWeights.medium,
    color: Colors.amber,
  },

  // Skip
  skipButton: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  skipText: {
    fontSize: FontSizes.sm,
    color: Colors.gray400,
    textDecorationLine: 'underline',
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
