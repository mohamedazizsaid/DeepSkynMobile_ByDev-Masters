import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Modal } from 'react-native';
import { Colors, Spacing } from '../../theme';
import { useAccessibilityStyleSheet } from '../../stores/useAccessibilityStyles';
import { useTranslation } from '../../lib/i18n/useTranslation';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export function LoadingOverlay({ visible, message }: LoadingOverlayProps) {
  const { t } = useTranslation();
  const styles = useAccessibilityStyleSheet(({ colors, fontSizes }) => ({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    container: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: Spacing['2xl'],
      alignItems: 'center',
      minWidth: 150,
      shadowColor: Colors.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
    message: {
      marginTop: Spacing.md,
      fontSize: fontSizes.base,
      fontWeight: '500',
      color: colors.text,
      textAlign: 'center',
    },
  }));

  const displayMessage = message || t.loadingOverlay.default;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.message}>{displayMessage}</Text>
        </View>
      </View>
    </Modal>
  );
}

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  message?: string;
}

export function LoadingSpinner({ size = 'large', color = Colors.primary, message }: LoadingSpinnerProps) {
  const { t } = useTranslation();
  const styles = useAccessibilityStyleSheet(({ colors, fontSizes }) => ({
    spinnerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.xl,
    },
    spinnerMessage: {
      marginTop: Spacing.md,
      fontSize: fontSizes.sm,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  }));

  const displayMessage = message || t.loadingOverlay.default;

  return (
    <View style={styles.spinnerContainer}>
      <ActivityIndicator size={size} color={color} />
      {displayMessage && <Text style={styles.spinnerMessage}>{displayMessage}</Text>}
    </View>
  );
}
