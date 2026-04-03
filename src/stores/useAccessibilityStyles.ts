/**
 * useAccessibilityStyles Hook
 * 
 * This hook provides dynamic styles based on the current accessibility settings.
 * It reads from the accessibility store and returns computed values that can be
 * used directly in components.
 */

import { useMemo } from 'react';
import { StyleSheet, TextStyle, ViewStyle, Animated } from 'react-native';
import { useAccessibilityStore } from './accessibility.store';
import {
  getThemeColors,
  getScaledFontSizes,
  getTextSpacingStyles,
  getDyslexiaFontStyles,
  getFocusHighlightStyles,
  getLinkHighlightStyles,
  getAnimationDuration,
  ThemeColors,
  FontScales,
} from '../theme/accessibility';

export interface AccessibilityStyles {
  // Theme colors
  colors: ThemeColors;
  
  // Font sizes (scaled by zoom)
  fontSizes: typeof FontScales;
  
  // Text styles
  textStyle: TextStyle;
  
  // Focus highlight (for focusable elements)
  focusStyle: ViewStyle;
  
  // Link styles
  linkStyle: TextStyle;
  
  // Animation duration modifier
  getAnimDuration: (baseMs: number) => number;
  
  // Individual settings for conditional rendering
  settings: {
    theme: 'light' | 'dark';
    contrastMode: 'off' | 'medium' | 'high';
    zoomLevel: number;
    reduceMotion: boolean;
    dyslexiaFont: boolean;
    textSpacing: boolean;
    focusHighlight: boolean;
    linkHighlight: boolean;
    language: 'fr' | 'en' | 'ar' | 'es';
  };
  
  // TTS functions
  speak: (text: string) => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;
}

/**
 * Hook that provides all accessibility-aware styles and functions
 */
export function useAccessibilityStyles(): AccessibilityStyles {
  const {
    theme,
    contrastMode,
    zoomLevel,
    reduceMotion,
    dyslexiaFont,
    textSpacing,
    focusHighlight,
    linkHighlight,
    language,
    speak,
    stopSpeaking,
    isSpeaking,
  } = useAccessibilityStore();

  // Compute theme colors
  const colors = useMemo(
    () => getThemeColors(theme, contrastMode),
    [theme, contrastMode]
  );

  // Compute scaled font sizes
  const fontSizes = useMemo(
    () => getScaledFontSizes(zoomLevel),
    [zoomLevel]
  );

  // Compute base text style
  const textStyle = useMemo<TextStyle>(() => {
    const spacingStyles = getTextSpacingStyles(textSpacing);
    const dyslexiaStyles = getDyslexiaFontStyles(dyslexiaFont);
    
    return {
      color: colors.text,
      fontSize: fontSizes.base,
      ...spacingStyles,
      ...dyslexiaStyles,
    };
  }, [colors.text, fontSizes.base, textSpacing, dyslexiaFont]);

  // Compute focus highlight style
  const focusStyle = useMemo<ViewStyle>(
    () => getFocusHighlightStyles(focusHighlight, colors) as ViewStyle,
    [focusHighlight, colors]
  );

  // Compute link style
  const linkStyle = useMemo<TextStyle>(
    () => getLinkHighlightStyles(linkHighlight, colors) as TextStyle,
    [linkHighlight, colors]
  );

  // Animation duration calculator
  const getAnimDuration = useMemo(
    () => (baseMs: number) => getAnimationDuration(baseMs, reduceMotion),
    [reduceMotion]
  );

  // Settings object for conditional rendering
  const settings = useMemo(() => ({
    theme,
    contrastMode,
    zoomLevel,
    reduceMotion,
    dyslexiaFont,
    textSpacing,
    focusHighlight,
    linkHighlight,
    language,
  }), [theme, contrastMode, zoomLevel, reduceMotion, dyslexiaFont, textSpacing, focusHighlight, linkHighlight, language]);

  return {
    colors,
    fontSizes,
    textStyle,
    focusStyle,
    linkStyle,
    getAnimDuration,
    settings,
    speak,
    stopSpeaking,
    isSpeaking,
  };
}

/**
 * Create a dynamic stylesheet based on accessibility settings
 */
export function useAccessibilityStyleSheet<T extends StyleSheet.NamedStyles<T>>(
  createStyles: (accessibility: AccessibilityStyles) => T
): T {
  const accessibility = useAccessibilityStyles();
  
  return useMemo(
    () => StyleSheet.create(createStyles(accessibility)),
    [accessibility]
  );
}

/**
 * Hook for animations that respect reduceMotion
 */
export function useAccessibleAnimation(baseConfig: Animated.TimingAnimationConfig): Animated.TimingAnimationConfig {
  const { reduceMotion } = useAccessibilityStore();
  
  return useMemo(() => ({
    ...baseConfig,
    duration: reduceMotion ? 0 : baseConfig.duration,
    useNativeDriver: baseConfig.useNativeDriver,
  }), [baseConfig, reduceMotion]);
}

export default useAccessibilityStyles;
