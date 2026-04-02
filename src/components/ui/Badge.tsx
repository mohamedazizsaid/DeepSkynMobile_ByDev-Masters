import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, FontSizes, FontWeights, Spacing } from '../../theme';
import { useAccessibilityStyles } from '../../stores/useAccessibilityStyles';

interface BadgeProps {
  text: string;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'neutral';
  size?: 'sm' | 'md';
}

export function Badge({ text, variant = 'primary', size = 'sm' }: BadgeProps) {
  const { fontSizes, textStyle, colors } = useAccessibilityStyles();

  const variantStyles = {
    primary: { bg: Colors.primaryAlpha10, text: Colors.primary },
    success: { bg: Colors.successAlpha10, text: Colors.success },
    warning: { bg: Colors.warningAlpha10, text: Colors.amber },
    error: { bg: Colors.errorAlpha10, text: Colors.error },
    neutral: { bg: colors.backgroundTertiary, text: colors.textSecondary },
  };

  const v = variantStyles[variant];

  return (
    <View style={[styles.badge, { backgroundColor: v.bg }, size === 'md' ? styles.badgeMd : undefined]}>
      <Text style={[styles.text, textStyle, { color: v.text, fontSize: size === 'md' ? fontSizes.sm : fontSizes.xs }, size === 'md' ? styles.textMd : undefined]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  badgeMd: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
  },
  text: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
  },
  textMd: {
    fontSize: FontSizes.sm,
  },
});
