import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, FontWeights } from '../../theme';

interface AnimatedCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  delay?: number;
  backgroundColor?: string;
  gradient?: [string, string];
  style?: ViewStyle;
  onPress?: () => void;
}

export function AnimatedCard({
  title,
  subtitle,
  icon,
  children,
  delay = 0,
  backgroundColor,
  gradient = [Colors.primary, Colors.primaryLight || Colors.primary],
  style,
  onPress,
}: AnimatedCardProps) {
  const slideUp = useRef(new Animated.Value(50)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const scaleIn = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(slideUp, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 8,
        }),
        Animated.timing(fadeIn, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleIn, {
          toValue: 1,
          useNativeDriver: true,
          bounciness: 8,
        }),
      ]).start();
    }, delay);
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeIn,
          transform: [
            { translateY: slideUp },
            { scale: scaleIn },
          ],
        },
        style,
      ]}
    >
      {gradient ? (
        <LinearGradient colors={gradient} style={styles.gradientBox}>
          <View style={styles.content}>
            {icon && <View style={styles.iconContainer}>{icon}</View>}
            <View style={styles.textContainer}>
              <Text style={styles.title}>{title}</Text>
              {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
            {children}
          </View>
        </LinearGradient>
      ) : (
        <View style={[styles.box, { backgroundColor }]}>
          <View style={styles.content}>
            {icon && <View style={styles.iconContainer}>{icon}</View>}
            <View style={styles.textContainer}>
              <Text style={styles.title}>{title}</Text>
              {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
            {children}
          </View>
        </View>
      )}
    </Animated.View>
  );
}

interface PulseIndicatorProps {
  color?: string;
  size?: number;
}

export function PulseIndicator({ color = Colors.primary, size = 12 }: PulseIndicatorProps) {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const scale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.5],
  });

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  return (
    <View style={[styles.pulseContainer, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.pulseDot,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            transform: [{ scale }],
            opacity,
            position: 'absolute',
          },
        ]}
      />
      <View
        style={[
          styles.pulseDot,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

interface SkeletonLoaderProps {
  width?: string | number;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonLoader({
  width = '100%',
  height = 16,
  borderRadius = 4,
  style,
}: SkeletonLoaderProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    shimmer.start();
    return () => shimmer.stop();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.6, 0.3],
  });

  return (
    <Animated.View
      style={[
        styles.skeletonBox,
        {
width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

interface FloatingActionButtonProps {
  onPress: () => void;
  icon: React.ReactNode;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export function FloatingActionButton({
  onPress,
  icon,
  color = Colors.primary,
  size = 'md',
  label,
}: FloatingActionButtonProps) {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const sizeMap = {
    sm: 48,
    md: 56,
    lg: 64,
  };

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => onPress());
  };

  useEffect(() => {
    const bounce = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -4,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    bounce.start();
    return () => bounce.stop();
  }, []);

  const fabSize = sizeMap[size];

  return (
    <Animated.View
      style={[
        styles.fab,
        {
          width: fabSize,
          height: fabSize,
          borderRadius: fabSize / 2,
          backgroundColor: color,
          transform: [{ scale: scaleAnim }, { translateY: bounceAnim }],
        },
      ]}
    >
      <View style={styles.fabContent} onTouchEnd={handlePress}>
        {icon}
        {label && <Text style={styles.fabLabel}>{label}</Text>}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.md,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  gradientBox: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  box: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  content: {
    flex: 1,
  },
  iconContainer: {
    marginBottom: Spacing.md,
  },
  textContainer: {
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: FontWeights.bold,
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: FontWeights.medium,
    color: 'rgba(255,255,255,0.8)',
  },
  pulseContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseDot: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeletonBox: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginVertical: Spacing.sm,
  },
  fab: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabLabel: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: FontWeights.semibold,
    marginTop: Spacing.xs,
  },
});

export default {
  AnimatedCard,
  PulseIndicator,
  SkeletonLoader,
  FloatingActionButton,
};
