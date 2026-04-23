import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
  withDelay,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights } from '../../theme';

const { width } = Dimensions.get('window');
const SCAN_SIZE = width * 0.75;

interface AnalysisScanAnimationProps {
  progress: number; // 0-100
  status: 'scanning' | 'processing' | 'complete' | 'error';
  message?: string;
  capturedPreviewImages?: Partial<Record<'front' | 'left' | 'right', string>>;
}

export function AnalysisScanAnimation({ 
  progress, 
  status, 
  message = 'Analyse en cours...',
  capturedPreviewImages = {},
}: AnalysisScanAnimationProps) {
  // Animation values
  const scanLineY = useSharedValue(0);
  const orbitRotation = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.1);
  const glowIntensity = useSharedValue(0.3);

  useEffect(() => {
    if (status === 'scanning' || status === 'processing') {
      // Scan line animation (top to bottom)
      scanLineY.value = withRepeat(
        withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );

      // Orbit rotation
      orbitRotation.value = withRepeat(
        withTiming(360, { duration: 3000, easing: Easing.linear }),
        -1,
        false
      );

      // Pulse effect
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );

      // Pulse opacity
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.25, { duration: 1500 }),
          withTiming(0.1, { duration: 1500 })
        ),
        -1,
        true
      );

      // Glow intensity
      glowIntensity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 2000 }),
          withTiming(0.3, { duration: 2000 })
        ),
        -1,
        true
      );
    } else if (status === 'complete') {
      // Complete animation - stop and scale up
      pulseScale.value = withSequence(
        withTiming(1.15, { duration: 200 }),
        withTiming(1, { duration: 300 })
      );
    }
  }, [status]);

  // Animated styles
  const animatedLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(scanLineY.value, [0, 1], [0, SCAN_SIZE - 4]) }],
    opacity: interpolate(scanLineY.value, [0, 0.1, 0.9, 1], [0.3, 1, 1, 0.3]),
  }));

  const animatedOrbitStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${orbitRotation.value}deg` }],
  }));

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowIntensity.value,
  }));

  // Progress circle calculations
  const circumference = 2 * Math.PI * (SCAN_SIZE / 2 - 8);
  const strokeDashoffset = circumference * (1 - progress / 100);

  const getStatusColor = () => {
    switch (status) {
      case 'complete': return Colors.success;
      case 'error': return Colors.error;
      default: return Colors.primary;
    }
  };

  const getStatusIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (status) {
      case 'complete': return 'checkmark-circle';
      case 'error': return 'close-circle';
      case 'processing': return 'sync';
      default: return 'scan';
    }
  };

  return (
    <View style={styles.container}>
      {/* Background pulse */}
      <Animated.View style={[styles.pulseBackground, animatedPulseStyle]}>
        <LinearGradient
          colors={[`${getStatusColor()}20`, 'transparent']}
          style={styles.pulseGradient}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 0.5, y: 0 }}
        />
      </Animated.View>

      {/* Outer glow ring */}
      <Animated.View style={[styles.glowRing, animatedGlowStyle, { borderColor: getStatusColor() }]} />

      {/* Progress circle */}
      <View style={styles.progressContainer}>
        <Svg width={SCAN_SIZE} height={SCAN_SIZE} style={styles.progressSvg}>
          {/* Background circle */}
          <Circle
            cx={SCAN_SIZE / 2}
            cy={SCAN_SIZE / 2}
            r={SCAN_SIZE / 2 - 8}
            stroke={Colors.gray700}
            strokeWidth={4}
            fill="none"
          />
          {/* Progress circle */}
          <Circle
            cx={SCAN_SIZE / 2}
            cy={SCAN_SIZE / 2}
            r={SCAN_SIZE / 2 - 8}
            stroke={getStatusColor()}
            strokeWidth={4}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={strokeDashoffset}
            rotation={-90}
            origin={`${SCAN_SIZE / 2}, ${SCAN_SIZE / 2}`}
          />
        </Svg>
      </View>

      {/* Scan area */}
      <View style={styles.scanArea}>
        {/* Orbiting dot */}
        {(status === 'scanning' || status === 'processing') && (
          <Animated.View style={[styles.orbitContainer, animatedOrbitStyle]}>
            <View style={[styles.orbitDot, { backgroundColor: getStatusColor() }]}>
              <View style={[styles.orbitDotGlow, { backgroundColor: getStatusColor() }]} />
            </View>
          </Animated.View>
        )}

        {/* Scan line */}
        {status === 'scanning' && (
          <Animated.View style={[styles.scanLine, animatedLineStyle]}>
            <LinearGradient
              colors={['transparent', getStatusColor(), 'transparent']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.scanLineGradient}
            />
          </Animated.View>
        )}

        {/* Center content */}
        <View style={styles.centerContent}>
          {(capturedPreviewImages.front || capturedPreviewImages.left || capturedPreviewImages.right) && (
            <View style={styles.previewRow}>
              <PreviewThumb label="G" uri={capturedPreviewImages.left} />
              <PreviewThumb label="F" uri={capturedPreviewImages.front} large />
              <PreviewThumb label="D" uri={capturedPreviewImages.right} />
            </View>
          )}
          <View style={[styles.iconContainer, { backgroundColor: `${getStatusColor()}20` }]}>
            <Ionicons 
              name={getStatusIcon()} 
              size={48} 
              color={getStatusColor()} 
            />
          </View>
          <Text style={[styles.progressText, { color: getStatusColor() }]}>
            {progress}%
          </Text>
        </View>

        {/* Corner brackets */}
        <View style={[styles.corner, styles.topLeft, { borderColor: getStatusColor() }]} />
        <View style={[styles.corner, styles.topRight, { borderColor: getStatusColor() }]} />
        <View style={[styles.corner, styles.bottomLeft, { borderColor: getStatusColor() }]} />
        <View style={[styles.corner, styles.bottomRight, { borderColor: getStatusColor() }]} />
      </View>

      {/* Status message */}
      <View style={styles.messageContainer}>
        <Text style={styles.statusMessage}>{message}</Text>
        
        {/* Analysis steps */}
        <View style={styles.stepsContainer}>
          <AnalysisStep 
            label="Détection visage" 
            complete={progress >= 20} 
            active={progress < 20 && status === 'scanning'} 
          />
          <AnalysisStep 
            label="Analyse texture" 
            complete={progress >= 45} 
            active={progress >= 20 && progress < 45} 
          />
          <AnalysisStep 
            label="Détection conditions" 
            complete={progress >= 70} 
            active={progress >= 45 && progress < 70} 
          />
          <AnalysisStep 
            label="Génération résultats" 
            complete={progress >= 100} 
            active={progress >= 70 && progress < 100} 
          />
        </View>
      </View>
    </View>
  );
}

interface AnalysisStepProps {
  label: string;
  complete: boolean;
  active: boolean;
}

function AnalysisStep({ label, complete, active }: AnalysisStepProps) {
  const dotScale = useSharedValue(1);

  useEffect(() => {
    if (active) {
      dotScale.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        true
      );
    } else {
      dotScale.value = 1;
    }
  }, [active]);

  const animatedDotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
  }));

  return (
    <View style={styles.stepRow}>
      <Animated.View 
        style={[
          styles.stepDot,
          complete && styles.stepDotComplete,
          active && styles.stepDotActive,
          animatedDotStyle,
        ]} 
      />
      <Text style={[
        styles.stepLabel,
        complete && styles.stepLabelComplete,
        active && styles.stepLabelActive,
      ]}>
        {label}
      </Text>
      {complete && (
        <Ionicons name="checkmark" size={14} color={Colors.success} style={{ marginLeft: 4 }} />
      )}
    </View>
  );
}

interface PreviewThumbProps {
  label: string;
  uri?: string;
  large?: boolean;
}

function PreviewThumb({ label, uri, large = false }: PreviewThumbProps) {
  const size = large ? 72 : 52;

  return (
    <View style={[styles.previewThumbContainer, { width: size, height: size + 16 }]}>
      <View style={[styles.previewThumb, { width: size, height: size, borderRadius: size / 2 }]}>
        {uri ? (
          <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />
        ) : (
          <View style={[styles.previewPlaceholder, { width: size, height: size, borderRadius: size / 2 }]}>
            <Ionicons name="camera-outline" size={large ? 24 : 18} color={Colors.gray400} />
          </View>
        )}
      </View>
      <Text style={styles.previewLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  pulseBackground: {
    position: 'absolute',
    width: SCAN_SIZE * 1.3,
    height: SCAN_SIZE * 1.3,
    borderRadius: SCAN_SIZE * 0.65,
    overflow: 'hidden',
  },
  pulseGradient: {
    flex: 1,
    borderRadius: SCAN_SIZE * 0.65,
  },
  glowRing: {
    position: 'absolute',
    width: SCAN_SIZE + 20,
    height: SCAN_SIZE + 20,
    borderRadius: (SCAN_SIZE + 20) / 2,
    borderWidth: 2,
  },
  progressContainer: {
    position: 'absolute',
  },
  progressSvg: {
    transform: [{ rotate: '-90deg' }],
  },
  scanArea: {
    width: SCAN_SIZE,
    height: SCAN_SIZE,
    borderRadius: SCAN_SIZE / 2,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  orbitContainer: {
    position: 'absolute',
    width: SCAN_SIZE - 30,
    height: SCAN_SIZE - 30,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  orbitDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbitDotGlow: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    opacity: 0.4,
  },
  scanLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  scanLineGradient: {
    flex: 1,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 10,
    marginBottom: Spacing.md,
  },
  previewThumbContainer: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  previewThumb: {
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.white,
    backgroundColor: Colors.gray800,
  },
  previewPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.gray800,
  },
  previewLabel: {
    marginTop: 2,
    fontSize: FontSizes.xs,
    color: Colors.gray300,
    fontWeight: FontWeights.medium,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  progressText: {
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.bold,
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderWidth: 3,
  },
  topLeft: {
    top: 20,
    left: 20,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 20,
    right: 20,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 20,
    left: 20,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 20,
    right: 20,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 8,
  },
  messageContainer: {
    marginTop: Spacing.xl,
    alignItems: 'center',
  },
  statusMessage: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.white,
    marginBottom: Spacing.lg,
  },
  stepsContainer: {
    gap: Spacing.sm,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.gray600,
  },
  stepDotComplete: {
    backgroundColor: Colors.success,
  },
  stepDotActive: {
    backgroundColor: Colors.primary,
  },
  stepLabel: {
    fontSize: FontSizes.sm,
    color: Colors.gray500,
  },
  stepLabelComplete: {
    color: Colors.success,
  },
  stepLabelActive: {
    color: Colors.primary,
    fontWeight: FontWeights.medium,
  },
});
