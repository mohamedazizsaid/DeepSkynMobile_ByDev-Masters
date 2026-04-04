/**
 * AccessibleView Component
 * 
 * A View wrapper that automatically applies accessibility settings:
 * - Theme-aware background colors
 * - Focus highlight when enabled
 * - Reduced motion animations
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  ViewProps,
  ViewStyle,
  Animated,
  Pressable,
  PressableProps,
  StyleSheet,
} from 'react-native';
import { useAccessibilityStyles } from '../../stores/useAccessibilityStyles';

export interface AccessibleViewProps extends ViewProps {
  /**
   * Background variant
   */
  background?: 'background' | 'backgroundSecondary' | 'backgroundTertiary' | 'surface' | 'surfaceElevated' | 'transparent';
  
  /**
   * Apply focus highlight styles when focused
   */
  focusable?: boolean;
  
  /**
   * Border color variant
   */
  borderColor?: 'border' | 'borderLight' | 'borderStrong' | 'primary';
  
  /**
   * Children
   */
  children?: React.ReactNode;
}

export function AccessibleView({
  background = 'transparent',
  focusable = false,
  borderColor,
  style,
  children,
  ...props
}: AccessibleViewProps) {
  const { colors, focusStyle, settings } = useAccessibilityStyles();
  const [isFocused, setIsFocused] = useState(false);
  
  // Compute background color
  const backgroundColor = background === 'transparent' 
    ? 'transparent' 
    : colors[background as keyof typeof colors];
  
  // Compute border color
  const borderColorValue = borderColor 
    ? colors[borderColor as keyof typeof colors] 
    : undefined;
  
  // Build computed style
  const computedStyle: ViewStyle = {
    backgroundColor,
    ...(borderColorValue ? { borderColor: borderColorValue } : {}),
    ...(focusable && isFocused && settings.focusHighlight ? focusStyle : {}),
  };
  
  // Handle focus state
  const handleFocus = useCallback(() => setIsFocused(true), []);
  const handleBlur = useCallback(() => setIsFocused(false), []);
  
  return (
    <View 
      style={[computedStyle, style]} 
      onAccessibilityEscape={handleBlur}
      {...props}
    >
      {children}
    </View>
  );
}

/**
 * AccessiblePressable - A Pressable with accessibility features
 */
export interface AccessiblePressableProps extends PressableProps {
  /**
   * Background variant
   */
  background?: 'background' | 'backgroundSecondary' | 'backgroundTertiary' | 'surface' | 'surfaceElevated' | 'transparent';
  
  /**
   * Apply focus highlight when pressed/focused
   */
  showFocusHighlight?: boolean;
  
  /**
   * Children
   */
  children?: React.ReactNode;
}

export function AccessiblePressable({
  background = 'transparent',
  showFocusHighlight = true,
  style,
  children,
  ...props
}: AccessiblePressableProps) {
  const { colors, focusStyle, settings } = useAccessibilityStyles();
  
  const backgroundColor = background === 'transparent' 
    ? 'transparent' 
    : colors[background as keyof typeof colors];
  
  return (
    <Pressable
      style={({ pressed }) => [
        { backgroundColor },
        showFocusHighlight && pressed && settings.focusHighlight ? focusStyle : {},
        typeof style === 'function' ? style({ pressed }) : style,
      ]}
      {...props}
    >
      {children}
    </Pressable>
  );
}

/**
 * AccessibleCard - A card container with theme-aware styling
 */
export interface AccessibleCardProps extends ViewProps {
  /**
   * Elevated appearance
   */
  elevated?: boolean;
  
  /**
   * Children
   */
  children?: React.ReactNode;
}

export function AccessibleCard({
  elevated = false,
  style,
  children,
  ...props
}: AccessibleCardProps) {
  const { colors, settings } = useAccessibilityStyles();
  
  const cardStyle: ViewStyle = {
    backgroundColor: elevated ? colors.surfaceElevated : colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    // Shadow for elevated cards
    ...(elevated ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: settings.theme === 'dark' ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    } : {}),
  };
  
  return (
    <View style={[cardStyle, style]} {...props}>
      {children}
    </View>
  );
}

/**
 * AccessibleDivider - A themed divider line
 */
export interface AccessibleDividerProps extends ViewProps {
  /**
   * Divider thickness
   */
  thickness?: number;
  
  /**
   * Color variant
   */
  color?: 'border' | 'borderLight' | 'borderStrong';
}

export function AccessibleDivider({
  thickness = 1,
  color = 'border',
  style,
  ...props
}: AccessibleDividerProps) {
  const { colors } = useAccessibilityStyles();
  
  return (
    <View
      style={[
        {
          height: thickness,
          backgroundColor: colors[color],
          marginVertical: 8,
        },
        style,
      ]}
      {...props}
    />
  );
}

/**
 * AccessibleContainer - Full screen container with theme background
 */
export interface AccessibleContainerProps extends ViewProps {
  /**
   * Safe area padding (for notches, etc.)
   */
  safe?: boolean;
  
  /**
   * Children
   */
  children?: React.ReactNode;
}

export function AccessibleContainer({
  safe = true,
  style,
  children,
  ...props
}: AccessibleContainerProps) {
  const { colors } = useAccessibilityStyles();
  
  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: colors.background,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

export default AccessibleView;
