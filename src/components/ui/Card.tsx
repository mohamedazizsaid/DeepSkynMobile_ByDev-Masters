import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Shadows, Spacing } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'outlined' | 'elevated';
}

export function Card({ children, style, variant = 'default' }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        ...(variant === 'elevated' ? [Shadows.lg] : []),
        ...(variant === 'outlined' ? [styles.outlined] : []),
        ...(variant === 'default' ? [Shadows.sm] : []),
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
