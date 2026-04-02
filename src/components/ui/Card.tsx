import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Shadows, Spacing } from '../../theme';
import { useAccessibilityStyles } from '../../stores/useAccessibilityStyles';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'outlined' | 'elevated';
}

export function Card({ children, style, variant = 'default' }: CardProps) {
  const { colors, settings, focusStyle } = useAccessibilityStyles();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        ...(variant === 'elevated' ? [Shadows.lg] : []),
        ...(variant === 'outlined' ? [styles.outlined] : []),
        ...(variant === 'default' ? [Shadows.sm] : []),
        settings.focusHighlight ? focusStyle : undefined,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  outlined: {
    borderWidth: 2,
    borderColor: Colors.gray200,
  },
});
