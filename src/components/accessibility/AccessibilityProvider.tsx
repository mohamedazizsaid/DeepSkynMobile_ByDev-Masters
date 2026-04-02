/**
 * AccessibilityProvider
 * 
 * Global provider that wraps the app and provides accessibility context.
 * - Loads preferences on app start
 * - Provides theme colors to StatusBar
 * - Handles system accessibility settings
 */

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { StatusBar, useColorScheme, AccessibilityInfo, Platform, Text, TextInput } from 'react-native';
import { useAccessibilityStore } from '../../stores/accessibility.store';
import { useAccessibilityStyles, AccessibilityStyles } from '../../stores/useAccessibilityStyles';

// Create context
const AccessibilityContext = createContext<AccessibilityStyles | null>(null);
const originalTextDefaultProps = Text.defaultProps ? { ...Text.defaultProps } : {};
const originalTextInputDefaultProps = TextInput.defaultProps ? { ...TextInput.defaultProps } : {};

interface AccessibilityProviderProps {
  children: ReactNode;
}

/**
 * AccessibilityProvider component
 * Wrap your app with this to enable accessibility features
 */
export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const { loadPreferences, setTheme, toggleReduceMotion } = useAccessibilityStore();
  const accessibilityStyles = useAccessibilityStyles();
  const systemColorScheme = useColorScheme();
  
  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);
  
  // Sync with system reduce motion setting
  useEffect(() => {
    const checkReduceMotion = async () => {
      const isReduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled();
      if (isReduceMotionEnabled && !accessibilityStyles.settings.reduceMotion) {
        toggleReduceMotion();
      }
    };
    
    checkReduceMotion();
    
    // Listen for changes
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (isEnabled) => {
        if (isEnabled !== accessibilityStyles.settings.reduceMotion) {
          toggleReduceMotion();
        }
      }
    );
    
    return () => {
      subscription?.remove();
    };
  }, []);
  
  // StatusBar style based on theme
  const statusBarStyle = accessibilityStyles.settings.theme === 'dark' 
    ? 'light-content' 
    : 'dark-content';
  
  const statusBarBackground = accessibilityStyles.colors.background;

  // Apply dyslexia font + text spacing globally to native Text/TextInput
  useEffect(() => {
    const baseTextStyle: any = {
      color: accessibilityStyles.colors.text,
    };

    if (accessibilityStyles.settings.textSpacing) {
      baseTextStyle.letterSpacing = 0.8;
      baseTextStyle.lineHeight = 24;
    }

    if (accessibilityStyles.settings.dyslexiaFont) {
      baseTextStyle.fontFamily = Platform.select({
        ios: 'Courier',
        android: 'monospace',
        default: 'System',
      });
    }

    const baseInputStyle: any = {
      color: accessibilityStyles.colors.text,
    };

    if (accessibilityStyles.settings.textSpacing) {
      baseInputStyle.letterSpacing = 0.8;
    }

    if (accessibilityStyles.settings.dyslexiaFont) {
      baseInputStyle.fontFamily = Platform.select({
        ios: 'Courier',
        android: 'monospace',
        default: 'System',
      });
    }

    Text.defaultProps = Text.defaultProps || {};
    Text.defaultProps = {
      ...originalTextDefaultProps,
      ...Text.defaultProps,
      style: [originalTextDefaultProps.style, baseTextStyle],
    };

    TextInput.defaultProps = TextInput.defaultProps || {};
    TextInput.defaultProps = {
      ...originalTextInputDefaultProps,
      ...TextInput.defaultProps,
      style: [originalTextInputDefaultProps.style, baseInputStyle],
    };

    return () => {
      Text.defaultProps = { ...originalTextDefaultProps };
      TextInput.defaultProps = { ...originalTextInputDefaultProps };
    };
  }, [
    accessibilityStyles.colors.text,
    accessibilityStyles.settings.textSpacing,
    accessibilityStyles.settings.dyslexiaFont,
  ]);
  
  return (
    <AccessibilityContext.Provider value={accessibilityStyles}>
      <StatusBar 
        barStyle={statusBarStyle}
        backgroundColor={statusBarBackground}
        translucent={Platform.OS === 'android'}
      />
      {children}
    </AccessibilityContext.Provider>
  );
}

/**
 * Hook to access accessibility styles from context
 * Falls back to direct store access if not in provider
 */
export function useAccessibility(): AccessibilityStyles {
  const context = useContext(AccessibilityContext);
  const directStyles = useAccessibilityStyles();
  
  return context || directStyles;
}

/**
 * HOC to wrap a component with accessibility styles
 */
export function withAccessibility<P extends object>(
  WrappedComponent: React.ComponentType<P & { accessibility: AccessibilityStyles }>
) {
  return function AccessibilityWrapper(props: P) {
    const accessibility = useAccessibility();
    return <WrappedComponent {...props} accessibility={accessibility} />;
  };
}

export default AccessibilityProvider;
