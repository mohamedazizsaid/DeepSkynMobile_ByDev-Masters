/**
 * AccessibleText Component
 * 
 * A Text wrapper that automatically applies accessibility settings:
 * - Dyslexia-friendly font when enabled
 * - Text spacing when enabled
 * - Scaled font sizes based on zoom level
 * - Theme-aware colors
 * - Text-to-speech support
 */

import React, { useCallback } from 'react';
import {
  Text,
  TextProps,
  TextStyle,
  StyleSheet,
  TouchableOpacity,
  AccessibilityProps,
} from 'react-native';
import { useAccessibilityStyles } from '../../stores/useAccessibilityStyles';

export interface AccessibleTextProps extends TextProps {
  /**
   * Font size key or number. Will be scaled by zoom level.
   */
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | number;
  
  /**
   * Font weight
   */
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  
  /**
   * Color variant
   */
  color?: 'text' | 'textSecondary' | 'textTertiary' | 'primary' | 'success' | 'error' | 'warning' | 'link';
  
  /**
   * Enable text-to-speech on long press
   */
  speakable?: boolean;
  
  /**
   * Is this a link? Applies link styles if linkHighlight is enabled
   */
  isLink?: boolean;
  
  /**
   * Custom speak text (if different from children)
   */
  speakText?: string;
  
  /**
   * Children text content
   */
  children?: React.ReactNode;
}

const fontWeights: Record<string, TextStyle['fontWeight']> = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

export function AccessibleText({
  size = 'base',
  weight = 'normal',
  color = 'text',
  speakable = false,
  isLink = false,
  speakText,
  style,
  children,
  onLongPress,
  ...props
}: AccessibleTextProps) {
  const { colors, fontSizes, textStyle, linkStyle, speak, settings } = useAccessibilityStyles();
  
  // Compute font size
  const fontSize = typeof size === 'number' 
    ? Math.round(size * (settings.zoomLevel / 100))
    : fontSizes[size];
  
  // Compute color
  const textColor = colors[color as keyof typeof colors] || colors.text;
  
  // Build computed style
  const computedStyle: TextStyle = {
    ...textStyle,
    fontSize,
    fontWeight: fontWeights[weight],
    color: textColor,
    // Apply link styles if this is a link and linkHighlight is enabled
    ...(isLink ? linkStyle : {}),
  };
  
  // Handle long press for TTS
  const handleLongPress = useCallback(() => {
    if (speakable) {
      const textToSpeak = speakText || (typeof children === 'string' ? children : '');
      if (textToSpeak) {
        speak(textToSpeak);
      }
    }
    onLongPress?.({} as any);
  }, [speakable, speakText, children, speak, onLongPress]);
  
  // Accessibility properties
  const a11yProps: AccessibilityProps = {
    accessible: true,
    accessibilityRole: isLink ? 'link' : 'text',
    accessibilityHint: speakable ? 'Appuyez longuement pour écouter' : undefined,
    ...props,
  };
  
  // If speakable, wrap in TouchableOpacity
  if (speakable) {
    return (
      <TouchableOpacity onLongPress={handleLongPress} activeOpacity={0.7}>
        <Text style={[computedStyle, style]} {...a11yProps}>
          {children}
        </Text>
      </TouchableOpacity>
    );
  }
  
  return (
    <Text style={[computedStyle, style]} {...a11yProps}>
      {children}
    </Text>
  );
}

/**
 * Pre-styled heading components
 */
export function AccessibleH1(props: Omit<AccessibleTextProps, 'size' | 'weight'>) {
  return <AccessibleText size="3xl" weight="bold" {...props} />;
}

export function AccessibleH2(props: Omit<AccessibleTextProps, 'size' | 'weight'>) {
  return <AccessibleText size="2xl" weight="bold" {...props} />;
}

export function AccessibleH3(props: Omit<AccessibleTextProps, 'size' | 'weight'>) {
  return <AccessibleText size="xl" weight="semibold" {...props} />;
}

export function AccessibleH4(props: Omit<AccessibleTextProps, 'size' | 'weight'>) {
  return <AccessibleText size="lg" weight="semibold" {...props} />;
}

export function AccessibleParagraph(props: Omit<AccessibleTextProps, 'size'>) {
  return <AccessibleText size="base" {...props} />;
}

export function AccessibleCaption(props: Omit<AccessibleTextProps, 'size' | 'color'>) {
  return <AccessibleText size="sm" color="textSecondary" {...props} />;
}

export function AccessibleLink(props: Omit<AccessibleTextProps, 'isLink'>) {
  return <AccessibleText isLink color="link" {...props} />;
}

export default AccessibleText;
