import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Gradients } from '../../theme';
import { FontSizes, FontWeights, Spacing } from '../../theme';

interface ShareButtonProps {
  onPress: () => void;
  disabled?: boolean;
  variant?: 'filled' | 'outline' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  loading?: boolean;
}

export function ShareButton({
  onPress,
  disabled = false,
  variant = 'filled',
  size = 'md',
  style,
  loading = false,
}: ShareButtonProps) {
  const sizeStyles = {
    sm: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      fontSize: FontSizes.xs,
      borderRadius: 8,
    },
    md: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      fontSize: FontSizes.sm,
      borderRadius: 10,
    },
    lg: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      fontSize: FontSizes.base,
      borderRadius: 12,
    },
  };

  const currentSizeStyle = sizeStyles[size];

  if (variant === 'icon') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.7}
        style={[styles.iconButton, style]}
      >
        <Text style={styles.iconText}>{loading ? '...' : '📤'}</Text>
      </TouchableOpacity>
    );
  }

  if (variant === 'outline') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.7}
        style={[
          styles.outlineButton,
          currentSizeStyle,
          { borderColor: disabled ? Colors.gray300 : Colors.primary },
          style,
        ]}
      >
        <Text
          style={[
            styles.outlineText,
            { fontSize: currentSizeStyle.fontSize },
            { color: disabled ? Colors.gray400 : Colors.primary },
          ]}
        >
          {loading ? '...' : '📤 Partager'}
        </Text>
      </TouchableOpacity>
    );
  }

  // Filled variant (default)
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[styles.button, currentSizeStyle, style]}
    >
      <LinearGradient
        colors={Gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradient,
          currentSizeStyle,
          {
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        <Text
          style={[
            styles.text,
            { fontSize: currentSizeStyle.fontSize },
            disabled && styles.disabledText,
          ]}
        >
          {loading ? '...' : '📤 Partager'}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  gradient: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  text: {
    color: Colors.white,
    fontWeight: FontWeights.semibold as any,
    textAlign: 'center',
  },
  disabledText: {
    opacity: 0.6,
  },
  outlineButton: {
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outlineText: {
    color: Colors.primary,
    fontWeight: FontWeights.semibold as any,
    textAlign: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  iconText: {
    fontSize: FontSizes.xl,
  },
});
