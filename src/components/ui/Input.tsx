import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { Colors, BorderRadius, FontSizes, FontWeights, Spacing } from '../../theme';
import { useAccessibilityStyles } from '../../stores/useAccessibilityStyles';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export function Input({ label, error, icon, rightIcon, containerStyle, style, ...props }: InputProps) {
  const { colors, textStyle, fontSizes } = useAccessibilityStyles();

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, textStyle, { color: colors.text, fontSize: fontSizes.sm }]}>{label}</Text>}
      <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }, error ? styles.inputError : undefined]}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <TextInput
          style={[styles.input, textStyle, { color: colors.text, fontSize: fontSizes.base }, icon ? { paddingLeft: 0 } : undefined, rightIcon ? { paddingRight: 0 } : undefined, style]}
          placeholderTextColor={colors.textTertiary}
          {...props}
        />
        {rightIcon && <View style={styles.rightIconContainer}>{rightIcon}</View>}
      </View>
      {error && <Text style={[styles.errorText, textStyle, { color: colors.error, fontSize: fontSizes.xs }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.base,
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.gray700,
    marginBottom: Spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray50,
    borderWidth: 2,
    borderColor: Colors.gray200,
    borderRadius: BorderRadius.base,
    paddingHorizontal: Spacing.base,
  },
  inputError: {
    borderColor: Colors.error,
  },
  iconContainer: {
    marginRight: Spacing.sm,
  },
  rightIconContainer: {
    marginLeft: Spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: FontSizes.base,
    color: Colors.gray900,
  },
  errorText: {
    fontSize: FontSizes.xs,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
});
