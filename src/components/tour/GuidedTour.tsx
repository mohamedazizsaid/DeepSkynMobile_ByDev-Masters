import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Platform,
  Animated,
  findNodeHandle,
  UIManager,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Feather,
  MaterialCommunityIcons,
  Ionicons,
} from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights, Shadows } from '../../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const TOUR_STORAGE_KEY = 'deepskyn_tour_completed';

// ─────────────────────────────────────────────────────────────────────────────
// Tour Step Definition
// ─────────────────────────────────────────────────────────────────────────────
export interface TourStep {
  /** Unique identifier for the step */
  id: string;
  /** Title of the step */
  title: string;
  /** Description text */
  description: string;
  /** Which side the tooltip should appear on */
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center';
  /** Icon name from Feather icons */
  iconName: string;
  /** Gradient colors for the icon badge */
  gradient: readonly [string, string];
  /** Optional: reference to the target component */
  targetRef?: React.RefObject<View>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Default Tour Steps for DeepSkyn Mobile
// ─────────────────────────────────────────────────────────────────────────────
export const DEFAULT_TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Bienvenue sur DeepSkyn! 🎉',
    description: 'Découvrez votre assistant personnel pour prendre soin de votre peau. Laissez-nous vous guider à travers les fonctionnalités principales.',
    placement: 'center',
    iconName: 'sparkles',
    gradient: ['#0EA5E9', '#06B6D4'],
  },
  {
    id: 'dashboard',
    title: 'Tableau de bord',
    description: 'Consultez votre score de santé cutanée, suivez votre progression et accédez à vos recommandations personnalisées.',
    placement: 'bottom',
    iconName: 'grid',
    gradient: ['#0EA5E9', '#06B6D4'],
  },
  {
    id: 'analysis',
    title: 'Analyse de peau',
    description: 'Prenez une photo pour obtenir une analyse détaillée de votre peau grâce à notre IA avancée.',
    placement: 'bottom',
    iconName: 'camera',
    gradient: ['#0EA5E9', '#06B6D4'],
  },
  {
    id: 'routine',
    title: 'Vos routines',
    description: 'Créez et gérez vos routines de soin quotidiennes, matin et soir, adaptées à votre type de peau.',
    placement: 'bottom',
    iconName: 'calendar',
    gradient: ['#F9A8D4', '#F472B6'],
  },
  {
    id: 'coach',
    title: 'Coach IA',
    description: 'Posez vos questions à notre assistant intelligent qui vous guidera dans vos choix de soins.',
    placement: 'bottom',
    iconName: 'message-circle',
    gradient: ['#FBBF24', '#F59E0B'],
  },
  {
    id: 'community',
    title: 'Communauté',
    description: 'Partagez vos expériences, découvrez les conseils d\'autres utilisateurs et trouvez l\'inspiration.',
    placement: 'bottom',
    iconName: 'users',
    gradient: ['#8B5CF6', '#6366F1'],
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Restez informé de vos rappels de routine, des nouveautés et des conseils personnalisés.',
    placement: 'bottom',
    iconName: 'bell',
    gradient: ['#EF4444', '#DC2626'],
  },
  {
    id: 'profile',
    title: 'Votre profil',
    description: 'Gérez vos informations personnelles, vos préférences et votre abonnement.',
    placement: 'bottom',
    iconName: 'user',
    gradient: ['#8B5CF6', '#6366F1'],
  },
  {
    id: 'finale',
    title: 'C\'est parti! 🚀',
    description: 'Vous êtes prêt à commencer votre voyage vers une peau plus saine. Commencez par une analyse pour des recommandations personnalisées!',
    placement: 'center',
    iconName: 'check-circle',
    gradient: ['#10B981', '#059669'],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Tour Context for passing refs
// ─────────────────────────────────────────────────────────────────────────────
interface TourContextValue {
  registerTarget: (id: string, ref: React.RefObject<View>) => void;
  unregisterTarget: (id: string) => void;
}

export const TourContext = React.createContext<TourContextValue>({
  registerTarget: () => {},
  unregisterTarget: () => {},
});

// ─────────────────────────────────────────────────────────────────────────────
// Tour Target Wrapper Component
// ─────────────────────────────────────────────────────────────────────────────
interface TourTargetProps {
  id: string;
  children: React.ReactNode;
}

export function TourTarget({ id, children }: TourTargetProps) {
  const ref = useRef<View>(null);
  const { registerTarget, unregisterTarget } = React.useContext(TourContext);

  useEffect(() => {
    registerTarget(id, ref );
    return () => unregisterTarget(id);
  }, [id, registerTarget, unregisterTarget]);

  return <View ref={ref} collapsable={false}>{children}</View>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main GuidedTour Component
// ─────────────────────────────────────────────────────────────────────────────
interface GuidedTourProps {
  /** Custom tour steps (optional, defaults to DEFAULT_TOUR_STEPS) */
  steps?: TourStep[];
  /** Force the tour to display (for replay) */
  forceShow?: boolean;
  /** Temporarily disable auto start logic */
  suppressAutoStart?: boolean;
  /** Callback when tour is completed or skipped */
  onComplete?: () => void;
}

export function GuidedTour({
  steps = DEFAULT_TOUR_STEPS,
  forceShow = false,
  suppressAutoStart = false,
  onComplete,
}: GuidedTourProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRefs, setTargetRefs] = useState<Map<string, React.RefObject<View>>>(new Map());
  const [targetRect, setTargetRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Register/unregister targets
  const registerTarget = useCallback((id: string, ref: React.RefObject<View>) => {
    setTargetRefs(prev => new Map(prev).set(id, ref));
  }, []);

  const unregisterTarget = useCallback((id: string) => {
    setTargetRefs(prev => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  // Check if tour should be shown
  useEffect(() => {
    const checkTourStatus = async () => {
      if (forceShow) {
        setIsActive(true);
        setCurrentStep(0);
        return;
      }
      
      try {
        const completed = await AsyncStorage.getItem(TOUR_STORAGE_KEY);
        if (!completed && !suppressAutoStart) {
          // Small delay so screens have time to mount
          setTimeout(() => setIsActive(true), 1200);
        }
      } catch (error) {
        console.error('Error checking tour status:', error);
      }
    };

    checkTourStatus();
  }, [forceShow, suppressAutoStart]);

  // Animations
  useEffect(() => {
    if (isActive) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();

      // Pulse animation for spotlight
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isActive, fadeAnim, slideAnim, pulseAnim]);

  // Get target element position
  const measureTarget = useCallback((stepId: string) => {
    const ref = targetRefs.get(stepId);
    if (ref?.current) {
      const handle = findNodeHandle(ref.current);
      if (handle) {
        UIManager.measure(handle, (x, y, width, height, pageX, pageY) => {
          setTargetRect({ x: pageX, y: pageY, width, height });
        });
      }
    } else {
      setTargetRect(null);
    }
  }, [targetRefs]);

  useEffect(() => {
    if (isActive && steps[currentStep]) {
      measureTarget(steps[currentStep].id);
    }
  }, [isActive, currentStep, steps, measureTarget]);

  const animateStepTransition = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 30,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback();
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      animateStepTransition(() => setCurrentStep(prev => prev + 1));
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      animateStepTransition(() => setCurrentStep(prev => prev - 1));
    }
  };

  const handleSkip = async () => {
    try {
      await AsyncStorage.setItem(TOUR_STORAGE_KEY, 'true');
    } catch (error) {
      console.error('Error saving tour status:', error);
    }
    setIsActive(false);
    onComplete?.();
  };

  const handleComplete = async () => {
    try {
      await AsyncStorage.setItem(TOUR_STORAGE_KEY, 'true');
    } catch (error) {
      console.error('Error saving tour status:', error);
    }
    setIsActive(false);
    onComplete?.();
  };

  if (!isActive) return null;

  const step = steps[currentStep];
  const isCenterCard = step.placement === 'center';
  const isLastStep = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'sparkles':
        return <MaterialCommunityIcons name="shimmer" size={24} color={Colors.white} />;
      case 'grid':
        return <Feather name="grid" size={20} color={Colors.white} />;
      case 'camera':
        return <Feather name="camera" size={20} color={Colors.white} />;
      case 'calendar':
        return <Feather name="calendar" size={20} color={Colors.white} />;
      case 'message-circle':
        return <Feather name="message-circle" size={20} color={Colors.white} />;
      case 'users':
        return <Feather name="users" size={20} color={Colors.white} />;
      case 'bell':
        return <Feather name="bell" size={20} color={Colors.white} />;
      case 'user':
        return <Feather name="user" size={20} color={Colors.white} />;
      case 'check-circle':
        return <Feather name="check-circle" size={24} color={Colors.white} />;
      default:
        return <Feather name="star" size={20} color={Colors.white} />;
    }
  };

  return (
    <TourContext.Provider value={{ registerTarget, unregisterTarget }}>
      <Modal
        visible={isActive}
        transparent
        animationType="none"
        onRequestClose={handleSkip}
      >
        <View style={styles.overlay}>
          {/* Backdrop */}
          <Animated.View
            style={[
              styles.backdrop,
              { opacity: fadeAnim },
            ]}
          >
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={handleSkip}
            />
          </Animated.View>

          {/* Spotlight for non-center cards */}
          {!isCenterCard && targetRect && (
            <Animated.View
              style={[
                styles.spotlight,
                {
                  top: targetRect.y - 8,
                  left: targetRect.x - 8,
                  width: targetRect.width + 16,
                  height: targetRect.height + 16,
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            />
          )}

          {/* Tooltip Card */}
          <Animated.View
            style={[
              styles.tooltipContainer,
              isCenterCard && styles.tooltipCenter,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {Platform.OS === 'ios' ? (
              <BlurView intensity={100} tint="light" style={styles.tooltip}>
                <TooltipContent
                  step={step}
                  currentStep={currentStep}
                  totalSteps={steps.length}
                  progress={progress}
                  isLastStep={isLastStep}
                  getIconComponent={getIconComponent}
                  onPrev={handlePrev}
                  onNext={handleNext}
                  onSkip={handleSkip}
                />
              </BlurView>
            ) : (
              <View style={[styles.tooltip, styles.tooltipAndroid]}>
                <TooltipContent
                  step={step}
                  currentStep={currentStep}
                  totalSteps={steps.length}
                  progress={progress}
                  isLastStep={isLastStep}
                  getIconComponent={getIconComponent}
                  onPrev={handlePrev}
                  onNext={handleNext}
                  onSkip={handleSkip}
                />
              </View>
            )}
          </Animated.View>
        </View>
      </Modal>
    </TourContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tooltip Content Component
// ─────────────────────────────────────────────────────────────────────────────
interface TooltipContentProps {
  step: TourStep;
  currentStep: number;
  totalSteps: number;
  progress: number;
  isLastStep: boolean;
  getIconComponent: (iconName: string) => React.ReactNode;
  onPrev: () => void;
  onNext: () => void;
  onSkip: () => void;
}

function TooltipContent({
  step,
  currentStep,
  totalSteps,
  progress,
  isLastStep,
  getIconComponent,
  onPrev,
  onNext,
  onSkip,
}: TooltipContentProps) {
  return (
    <>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <LinearGradient
            colors={['#0EA5E9', '#06B6D4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: `${progress}%` }]}
          />
        </View>
        <Text style={styles.progressText}>
          {currentStep + 1} / {totalSteps}
        </Text>
      </View>

      {/* Icon Badge */}
      <View style={styles.iconBadgeContainer}>
        <LinearGradient
          colors={[...step.gradient]}
          style={styles.iconBadge}
        >
          {getIconComponent(step.iconName)}
        </LinearGradient>
      </View>

      {/* Content */}
      <Text style={styles.title}>{step.title}</Text>
      <Text style={styles.description}>{step.description}</Text>

      {/* Actions */}
      <View style={styles.actions}>
        {currentStep > 0 ? (
          <TouchableOpacity onPress={onPrev} style={styles.secondaryButton}>
            <Feather name="chevron-left" size={18} color={Colors.gray500} />
            <Text style={styles.secondaryButtonText}>Précédent</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={onSkip} style={styles.skipButton}>
            <Feather name="skip-forward" size={16} color={Colors.gray400} />
            <Text style={styles.skipButtonText}>Passer</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={onNext} activeOpacity={0.8}>
          <LinearGradient
            colors={isLastStep ? ['#10B981', '#059669'] : ['#0EA5E9', '#06B6D4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>
              {isLastStep ? 'Commencer' : 'Suivant'}
            </Text>
            <Feather
              name={isLastStep ? 'check' : 'chevron-right'}
              size={18}
              color={Colors.white}
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Step Indicators */}
      <View style={styles.indicators}>
        {Array.from({ length: totalSteps }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              index === currentStep && styles.indicatorActive,
              index < currentStep && styles.indicatorCompleted,
            ]}
          />
        ))}
      </View>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  spotlight: {
    position: 'absolute',
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: 'transparent',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  tooltipContainer: {
    position: 'absolute',
    bottom: 100,
    left: Spacing.lg,
    right: Spacing.lg,
    maxWidth: 400,
    alignSelf: 'center',
  },
  tooltipCenter: {
    bottom: undefined,
    top: '50%',
    transform: [{ translateY: -150 }],
  },
  tooltip: {
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
    padding: Spacing.lg,
  },
  tooltipAndroid: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    ...Shadows.xl,
  },

  // Progress
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.base,
    gap: Spacing.sm,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gray200,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
    color: Colors.gray400,
  },

  // Icon Badge
  iconBadgeContainer: {
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.lg,
  },

  // Content
  title: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.gray900,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  description: {
    fontSize: FontSizes.sm,
    color: Colors.gray500,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },

  // Actions
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.base,
    gap: Spacing.xs,
    ...Shadows.md,
  },
  primaryButtonText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.white,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  secondaryButtonText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.gray500,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
    opacity: 0.7,
  },
  skipButtonText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.gray400,
  },

  // Indicators
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.gray200,
  },
  indicatorActive: {
    width: 24,
    backgroundColor: Colors.primary,
  },
  indicatorCompleted: {
    backgroundColor: Colors.primaryAlpha30,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Utility to reset tour (for testing/settings)
// ─────────────────────────────────────────────────────────────────────────────
export async function resetGuidedTour(): Promise<void> {
  try {
    await AsyncStorage.removeItem(TOUR_STORAGE_KEY);
  } catch (error) {
    console.error('Error resetting tour:', error);
  }
}

export async function hasCompletedTour(): Promise<boolean> {
  try {
    const completed = await AsyncStorage.getItem(TOUR_STORAGE_KEY);
    return completed === 'true';
  } catch (error) {
    console.error('Error checking tour status:', error);
    return false;
  }
}
