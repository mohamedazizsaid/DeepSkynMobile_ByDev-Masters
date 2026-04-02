/**
 * Accessibility Theme Configuration
 * 
 * This file contains all accessibility-related color palettes,
 * font configurations, and helper functions for applying
 * accessibility settings across the app.
 */

import { Platform } from 'react-native';
import { Colors } from './colors';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type Theme = 'light' | 'dark';
export type ContrastMode = 'off' | 'medium' | 'high';

export interface ThemeColors {
  // Backgrounds
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  surface: string;
  surfaceElevated: string;
  
  // Text
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  
  // Borders
  border: string;
  borderLight: string;
  borderStrong: string;
  
  // Primary
  primary: string;
  primaryLight: string;
  primaryDark: string;
  
  // Status
  success: string;
  error: string;
  warning: string;
  info: string;
  
  // Overlays
  overlay: string;
  overlayLight: string;
  
  // Links
  link: string;
  linkVisited: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Color Palettes
// ─────────────────────────────────────────────────────────────────────────────

export const LightTheme: ThemeColors = {
  // Backgrounds
  background: Colors.white,
  backgroundSecondary: Colors.gray50,
  backgroundTertiary: Colors.gray100,
  surface: Colors.white,
  surfaceElevated: Colors.white,
  
  // Text
  text: Colors.gray900,
  textSecondary: Colors.gray600,
  textTertiary: Colors.gray400,
  textInverse: Colors.white,
  
  // Borders
  border: Colors.gray200,
  borderLight: Colors.gray100,
  borderStrong: Colors.gray300,
  
  // Primary
  primary: Colors.primary,
  primaryLight: Colors.primaryLight,
  primaryDark: Colors.primaryDark,
  
  // Status
  success: Colors.success,
  error: Colors.error,
  warning: Colors.warning,
  info: Colors.info,
  
  // Overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.2)',
  
  // Links
  link: Colors.primary,
  linkVisited: Colors.purpleDark,
};

export const DarkTheme: ThemeColors = {
  // Backgrounds
  background: '#0F172A',       // slate-900
  backgroundSecondary: '#1E293B', // slate-800
  backgroundTertiary: '#334155', // slate-700
  surface: '#1E293B',
  surfaceElevated: '#334155',
  
  // Text
  text: '#F1F5F9',              // slate-100
  textSecondary: '#94A3B8',     // slate-400
  textTertiary: '#64748B',      // slate-500
  textInverse: Colors.gray900,
  
  // Borders
  border: '#334155',            // slate-700
  borderLight: '#1E293B',       // slate-800
  borderStrong: '#475569',      // slate-600
  
  // Primary
  primary: '#38BDF8',           // sky-400
  primaryLight: '#7DD3FC',      // sky-300
  primaryDark: '#0EA5E9',       // sky-500
  
  // Status
  success: '#34D399',           // emerald-400
  error: '#F87171',             // red-400
  warning: '#FBBF24',           // amber-400
  info: '#38BDF8',              // sky-400
  
  // Overlays
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(0, 0, 0, 0.4)',
  
  // Links
  link: '#38BDF8',
  linkVisited: '#A78BFA',       // violet-400
};

// ─────────────────────────────────────────────────────────────────────────────
// Contrast Adjustments
// ─────────────────────────────────────────────────────────────────────────────

export const MediumContrastLight: Partial<ThemeColors> = {
  text: '#000000',
  textSecondary: Colors.gray800,
  textTertiary: Colors.gray600,
  border: Colors.gray400,
  borderStrong: Colors.gray500,
};

export const HighContrastLight: Partial<ThemeColors> = {
  background: '#FFFFFF',
  backgroundSecondary: '#FFFFFF',
  text: '#000000',
  textSecondary: '#000000',
  textTertiary: Colors.gray700,
  border: '#000000',
  borderLight: Colors.gray600,
  borderStrong: '#000000',
  primary: '#0066CC',
  link: '#0000EE',
  linkVisited: '#551A8B',
};

export const MediumContrastDark: Partial<ThemeColors> = {
  text: '#FFFFFF',
  textSecondary: '#E2E8F0',
  textTertiary: '#CBD5E1',
  border: '#64748B',
  borderStrong: '#94A3B8',
};

export const HighContrastDark: Partial<ThemeColors> = {
  background: '#000000',
  backgroundSecondary: '#000000',
  text: '#FFFFFF',
  textSecondary: '#FFFFFF',
  textTertiary: '#E2E8F0',
  border: '#FFFFFF',
  borderLight: '#94A3B8',
  borderStrong: '#FFFFFF',
  primary: '#00BFFF',
  link: '#00FFFF',
  linkVisited: '#FF00FF',
};

// ─────────────────────────────────────────────────────────────────────────────
// Font Configuration
// ─────────────────────────────────────────────────────────────────────────────

export const Fonts = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  dyslexic: 'OpenDyslexic', // Will need to be loaded
};

export const FontScales = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get theme colors based on theme and contrast mode
 */
export function getThemeColors(
  theme: Theme,
  contrastMode: ContrastMode = 'off'
): ThemeColors {
  const baseTheme = theme === 'dark' ? { ...DarkTheme } : { ...LightTheme };
  
  if (contrastMode === 'off') {
    return baseTheme;
  }
  
  const contrastAdjustments = theme === 'dark'
    ? (contrastMode === 'high' ? HighContrastDark : MediumContrastDark)
    : (contrastMode === 'high' ? HighContrastLight : MediumContrastLight);
  
  return { ...baseTheme, ...contrastAdjustments };
}

/**
 * Scale a font size based on zoom level
 */
export function scaleFontSize(baseSizeOrKey: number | keyof typeof FontScales, zoomLevel: number): number {
  const baseSize = typeof baseSizeOrKey === 'number' 
    ? baseSizeOrKey 
    : FontScales[baseSizeOrKey];
  return Math.round(baseSize * (zoomLevel / 100));
}

/**
 * Get all scaled font sizes based on zoom level
 */
export function getScaledFontSizes(zoomLevel: number): typeof FontScales {
  const scaled: any = {};
  for (const [key, value] of Object.entries(FontScales)) {
    scaled[key] = scaleFontSize(value, zoomLevel);
  }
  return scaled;
}

/**
 * Get text spacing styles
 */
export function getTextSpacingStyles(enabled: boolean) {
  if (!enabled) {
    return {};
  }
  return {
    letterSpacing: 0.8,
    lineHeight: 24,
  };
}

/**
 * Get dyslexia font styles
 */
export function getDyslexiaFontStyles(enabled: boolean) {
  if (!enabled) {
    return {};
  }
  return {
    fontFamily: Platform.select({
      ios: 'Courier',
      android: 'monospace',
      default: 'System',
    }),
    letterSpacing: 0.5,
  };
}

/**
 * Get focus highlight styles
 */
export function getFocusHighlightStyles(enabled: boolean, colors: ThemeColors) {
  if (!enabled) {
    return {};
  }
  return {
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  };
}

/**
 * Get link highlight styles
 */
export function getLinkHighlightStyles(enabled: boolean, colors: ThemeColors) {
  if (!enabled) {
    return {};
  }
  return {
    textDecorationLine: 'underline' as const,
    textDecorationColor: colors.link,
    textDecorationStyle: 'solid' as const,
    color: colors.link,
  };
}

/**
 * Get animation duration based on reduceMotion setting
 */
export function getAnimationDuration(baseMs: number, reduceMotion: boolean): number {
  return reduceMotion ? 0 : baseMs;
}

/**
 * Language codes for TTS
 */
export const LanguageCodes = {
  fr: 'fr-FR',
  en: 'en-US',
  ar: 'ar-SA',
};
