import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius, FontSizes, FontWeights, Shadows } from '../../theme';
import { useAccessibilityStyles } from '../../stores/useAccessibilityStyles';

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle: customTextStyle,
  fullWidth = false,
}: ButtonProps) {
  const { colors, textStyle, focusStyle, settings, fontSizes } = useAccessibilityStyles();
  const sizeStyles = {
    sm: { paddingVertical: 8, paddingHorizontal: 16, fontSize: FontSizes.sm },
    md: { paddingVertical: 12, paddingHorizontal: 24, fontSize: FontSizes.base },
    lg: { paddingVertical: 16, paddingHorizontal: 32, fontSize: FontSizes.lg },
  };

  const isDisabled = disabled || loading;

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.8}
        style={[fullWidth ? { width: '100%' } : undefined, style]}
      >
        <LinearGradient
          colors={['#0EA5E9', '#06B6D4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.base,
            {
              paddingVertical: sizeStyles[size].paddingVertical,
              paddingHorizontal: sizeStyles[size].paddingHorizontal,
            },
            isDisabled ? styles.disabled : undefined,
            settings.focusHighlight ? focusStyle : undefined,
            Shadows.md,
          ]}
        >
          {loading && <ActivityIndicator color={Colors.white} size="small" style={{ marginRight: 8 }} />}
          <Text
            style={[
              styles.primaryText,
              textStyle,
              { fontSize: Math.round(sizeStyles[size].fontSize * (fontSizes.base / FontSizes.base)), color: colors.textInverse },
              customTextStyle,
            ]}
          >
            {children}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[
        styles.base,
        {
          paddingVertical: sizeStyles[size].paddingVertical,
          paddingHorizontal: sizeStyles[size].paddingHorizontal,
        },
        variant === 'outline' ? styles.outline : undefined,
        variant === 'outline' ? { borderColor: colors.border, backgroundColor: colors.surface } : undefined,
        variant === 'ghost' ? styles.ghost : undefined,
        isDisabled ? styles.disabled : undefined,
        settings.focusHighlight ? focusStyle : undefined,
        fullWidth ? { width: '100%' } : undefined,
        style,
      ]}
    >
      {loading && (
        <ActivityIndicator
          color={variant === 'outline' ? colors.primary : colors.textSecondary}
          size="small"
          style={{ marginRight: 8 }}
        />
      )}
      <Text
        style={[
          variant === 'outline' ? styles.outlineText : styles.ghostText,
          textStyle,
          { fontSize: Math.round(sizeStyles[size].fontSize * (fontSizes.base / FontSizes.base)) },
          variant === 'outline' ? { color: colors.text } : { color: colors.textSecondary },
          customTextStyle,
        ]}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.base,
  },
  primaryText: {
    color: Colors.white,
    fontWeight: FontWeights.semibold,
  },
  outline: {
    borderWidth: 2,
    borderColor: Colors.gray200,
    backgroundColor: Colors.white,
  },
  outlineText: {
    color: Colors.gray700,
    fontWeight: FontWeights.medium,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  ghostText: {
    color: Colors.gray500,
    fontWeight: FontWeights.medium,
  },
  disabled: {
    opacity: 0.5,
  },
});
