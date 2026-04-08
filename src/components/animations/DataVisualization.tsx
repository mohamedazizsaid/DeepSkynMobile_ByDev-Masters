import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, FontWeights } from '../../theme';
import { useAccessibilityStyles } from '../../stores/useAccessibilityStyles';

interface StatsDisplayProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
  delay?: number;
}

export function StatsDisplay({
  label,
  value,
  unit,
  icon,
  color = Colors.primary,
  trend,
  delay = 0,
}: StatsDisplayProps) {
  const { colors } = useAccessibilityStyles();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          bounciness: 10,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);
  }, []);

  const rotateZ = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getTrendColor = () => {
    if (trend === 'up') return Colors.success;
    if (trend === 'down') return Colors.error;
    return color;
  };

  return (
    <Animated.View
      style={[
        styles.statsContainer,
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={[color + '15', color + '08']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.statsBox}
      >
        <View style={styles.statsHeader}>
          {icon && (
            <Animated.View
              style={[
                styles.statsIcon,
                {
                  transform: [{ rotateZ }],
                },
              ]}
            >
              <Ionicons name={icon} size={20} color={color} />
            </Animated.View>
          )}
          <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>
            {label}
          </Text>
        </View>

        <View style={styles.statsContent}>
          <Text style={[styles.statsValue, { color }]}>
            {value}
            {unit && <Text style={[styles.statsUnit, { color: colors.textTertiary }]}> {unit}</Text>}
          </Text>

          {trend && (
            <View
              style={[
                styles.trendBadge,
                { backgroundColor: getTrendColor() + '20' },
              ]}
            >
              <Ionicons
                name={trend === 'up' ? 'arrow-up' : 'arrow-down'}
                size={12}
                color={getTrendColor()}
              />
              <Text style={[styles.trendText, { color: getTrendColor() }]}>
                {trend === 'up' ? 'Amélioration' : 'Attention'}
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  backgroundColor?: string;
  foregroundColor?: string;
  label?: string;
  duration?: number;
}

export function ProgressRing({
  percentage,
  size = 100,
  strokeWidth = 8,
  backgroundColor = Colors.gray200,
  foregroundColor = Colors.primary,
  label,
  duration = 1500,
}: ProgressRingProps) {
  const { colors } = useAccessibilityStyles();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(progressAnim, {
        toValue: percentage,
        duration,
        useNativeDriver: false,
      }),
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      ),
    ]).start();
  }, [percentage]);

  const circumference = 2 * Math.PI * ((size - strokeWidth) / 2);
  const strokeOffset = circumference - (progressAnim as any).__getValue() * (circumference / 100);

  const rotateZ = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.ringContainer, { width: size, height: size }]}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            transform: [{ rotateZ }],
          },
        ]}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={(size - strokeWidth) / 2}
            stroke={backgroundColor}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={(size - strokeWidth) / 2}
            stroke={foregroundColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
      </Animated.View>

      {label && (
        <View style={styles.ringLabel}>
          <Text style={[styles.ringLabelText, { color: colors.text }]}>
            {Math.round(percentage)}%
          </Text>
          <Text style={[styles.ringLabelSubtext, { color: colors.textSecondary }]}>
            {label}
          </Text>
        </View>
      )}
    </View>
  );
}

interface CounterProps {
  from?: number;
  to: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  useNativeDriver?: boolean;
}

export function Counter({
  from = 0,
  to,
  duration = 1000,
  prefix = '',
  suffix = '',
  useNativeDriver = false,
}: CounterProps) {
  const counterAnim = useRef(new Animated.Value(from)).current;
  const [displayValue, setDisplayValue] = React.useState(from);

  useEffect(() => {
    let animationFrame: any;

    counterAnim.addListener(({ value }) => {
      setDisplayValue(Math.floor(value));
    });

    Animated.timing(counterAnim, {
      toValue: to,
      duration,
      useNativeDriver,
    }).start();

    return () => {
      counterAnim.removeAllListeners();
    };
  }, [to]);

  return (
    <Text>
      {prefix}
      {displayValue}
      {suffix}
    </Text>
  );
}

interface SlideInTextProps {
  text: string;
  delay?: number;
  duration?: number;
  style?: any;
}

export function SlideInText({
  text,
  delay = 0,
  duration = 600,
  style,
}: SlideInTextProps) {
  const translateAnim = useRef(new Animated.Value(50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateAnim, {
          toValue: 0,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);
  }, []);

  return (
    <Animated.Text
      style={[
        style,
        {
          transform: [{ translateY: translateAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      {text}
    </Animated.Text>
  );
}

interface ShimmerProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  animated?: boolean;
}

export function Shimmer({
  width = '100%',
  height = 100,
  borderRadius = 8,
  animated = true,
}: ShimmerProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) return;

    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    shimmerAnimation.start();
    return () => shimmerAnimation.stop();
  }, [animated]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <View
      style={[
        styles.shimmerContainer,
        {
          width,
          height,
          borderRadius,
          overflow: 'hidden',
        },
      ]}
    >
      <Animated.View
        style={[
          styles.shimmerOverlay,
          {
            transform: [{ translateX }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  statsContainer: {
    marginVertical: Spacing.sm,
    marginHorizontal: Spacing.md,
  },
  statsBox: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statsIcon: {
    marginRight: Spacing.sm,
  },
  statsLabel: {
    fontSize: 12,
    fontWeight: FontWeights.medium,
  },
  statsContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsValue: {
    fontSize: 24,
    fontWeight: FontWeights.bold,
  },
  statsUnit: {
    fontSize: 14,
    fontWeight: FontWeights.medium,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  trendText: {
    fontSize: 10,
    fontWeight: FontWeights.semibold,
  },
  ringContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringLabel: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringLabelText: {
    fontSize: 20,
    fontWeight: FontWeights.bold,
  },
  ringLabelSubtext: {
    fontSize: 10,
    fontWeight: FontWeights.medium,
  },
  shimmerContainer: {
    backgroundColor: 'rgba(0,0,0,0.06)',
    overflow: 'hidden',
  },
  shimmerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
});

export default {
  StatsDisplay,
  ProgressRing,
  Counter,
  SlideInText,
  Shimmer,
};
