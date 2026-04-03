import React, { useState } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Gradients, Spacing, BorderRadius, FontWeights } from '../../theme';
import { Routine } from '../../lib/types';
import { Button } from './Button';
import { Input } from './Input';
import { useTranslation } from '../../lib/i18n/useTranslation';
import { useAccessibilityStyleSheet } from '../../stores/useAccessibilityStyles';

interface ShareRoutineModalProps {
  visible: boolean;
  routine: Routine | null;
  onClose: () => void;
  onShare: (message?: string, image?: string) => Promise<void>;
}

export function ShareRoutineModal({
  visible,
  routine,
  onClose,
  onShare,
}: ShareRoutineModalProps) {
  const { t } = useTranslation();
  const [customMessage, setCustomMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const styles = useAccessibilityStyleSheet(({ colors, fontSizes }) => ({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight, paddingTop: Spacing.xl },
    headerTitle: { fontSize: fontSizes.xl, fontWeight: FontWeights.bold, color: colors.text, textAlign: 'center' },
    closeButton: { fontSize: fontSizes['4xl'], color: colors.textSecondary, width: 30, textAlign: 'left' },
    scrollContent: { flex: 1, paddingHorizontal: Spacing.md, paddingVertical: Spacing.lg },
    premiumBadgeContainer: { marginBottom: Spacing.lg, borderRadius: 12, overflow: 'hidden' },
    premiumBadge: { paddingVertical: 8, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
    premiumText: { color: Colors.white, fontSize: fontSizes.sm, fontWeight: FontWeights.bold, letterSpacing: 1 },
    routineCard: { borderRadius: 16, overflow: 'hidden', marginBottom: Spacing.lg, elevation: 4, shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
    routineCardGradient: { padding: Spacing.lg },
    routineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
    typeBadge: { backgroundColor: 'rgba(255, 255, 255, 0.3)', color: Colors.white, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, fontSize: fontSizes.sm, fontWeight: FontWeights.semibold },
    stepCount: { color: Colors.white, fontSize: fontSizes.sm, fontWeight: FontWeights.semibold, backgroundColor: 'rgba(0, 0, 0, 0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    routineName: { fontSize: fontSizes.xl, fontWeight: FontWeights.bold, color: Colors.white, marginBottom: Spacing.xs },
    routineNotes: { fontSize: fontSizes.sm, color: 'rgba(255, 255, 255, 0.8)', fontStyle: 'italic' },
    section: { marginBottom: Spacing.lg },
    sectionTitle: { fontSize: fontSizes.lg, fontWeight: FontWeights.bold, color: colors.text, marginBottom: Spacing.md },
    stepsList: { borderRadius: 12, overflow: 'hidden', backgroundColor: colors.surface, elevation: 2, shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
    stepItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
    stepNumber: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
    stepNumberText: { color: Colors.white, fontWeight: FontWeights.bold, fontSize: fontSizes.base },
    stepContent: { flex: 1 },
    stepName: { fontSize: fontSizes.base, fontWeight: FontWeights.semibold, color: colors.text, marginBottom: 2 },
    stepProduct: { fontSize: fontSizes.sm, color: colors.textSecondary },
    stepDuration: { fontSize: fontSizes.sm, color: colors.textTertiary, marginLeft: Spacing.sm },
    moreSteps: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.backgroundSecondary },
    moreStepsText: { color: colors.primary, fontSize: fontSizes.sm, fontWeight: FontWeights.semibold },
    input: { height: 100, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, backgroundColor: colors.surface, fontSize: fontSizes.base, textAlignVertical: 'top', color: colors.text },
    characterCount: { fontSize: fontSizes.xs, color: colors.textTertiary, marginTop: Spacing.xs, textAlign: 'right' },
    previewBox: { backgroundColor: colors.surface, borderRadius: 12, padding: Spacing.md, borderWidth: 1, borderColor: colors.border, elevation: 2, shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
    previewText: { fontSize: fontSizes.sm, color: colors.text, lineHeight: 20 },
    buttonGroup: { flexDirection: 'column', gap: Spacing.md, marginVertical: Spacing.lg, marginBottom: Spacing.xl },
    cancelButton: { borderWidth: 2, borderColor: colors.border },
    cancelButtonText: { color: colors.textSecondary, fontWeight: FontWeights.semibold, fontSize: fontSizes.base },
    shareButtonText: { color: Colors.white, fontWeight: FontWeights.bold, fontSize: fontSizes.base },
    tipsBox: { backgroundColor: Colors.amber, borderRadius: 12, padding: Spacing.md, marginBottom: Spacing.lg, borderLeftWidth: 4, borderLeftColor: Colors.warning },
    tipsTitle: { color: Colors.black, fontWeight: FontWeights.bold, fontSize: fontSizes.base, marginBottom: Spacing.xs },
    tipsText: { color: Colors.gray800, fontSize: fontSizes.sm, lineHeight: 18 },
  }));

  if (!routine) return null;

  const handleShare = async () => {
    try {
      setIsLoading(true);
      await onShare(customMessage);
      Alert.alert(t.common.success, t.shareRoutine.success);
      resetModal();
      onClose();
    } catch (error) {
      Alert.alert(
        t.common.error,
        error instanceof Error ? error.message : t.shareRoutine.error
      );
    } finally {
      setIsLoading(false);
    }
  };

  const resetModal = () => {
    setCustomMessage('');
  };

  const getTypeEmoji = (type: string) => {
    switch (type.toUpperCase()) {
      case 'AM': return '🌅';
      case 'PM': return '🌙';
      case 'WEEKLY': return '⭐';
      default: return '✨';
    }
  };

  const previewMessage = () => {
    const emoji = getTypeEmoji(routine.type);
    let message = `${emoji} ${routine.name}\n`;
    message += `${routine.type} • ${routine.steps.length} ${t.evolution.points}`; // Using points for steps as a fallback or better add 'steps' to common

    if (customMessage) {
      message += `\n\n💬 "${customMessage}"`;
    }

    message += '\n\n📋 Routine:';
    routine.steps.slice(0, 3).forEach((step, idx) => {
      message += `\n${idx + 1}. ${step.name}`;
      if (step.productName) {
        message += ` - ${step.productName}`;
      }
    });

    if (routine.steps.length > 3) {
      message += `\n... et ${routine.steps.length - 3} étape(s) de plus`;
    }

    message += '\n\n#SkincareRoutine #DeepSkyn';

    return message;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} disabled={isLoading}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t.shareRoutine.title}</Text>
          <View style={{ width: 30 }} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Premium Badge */}
            <View style={styles.premiumBadgeContainer}>
              <LinearGradient
                colors={Gradients.purple}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.premiumBadge}
              >
                <Text style={styles.premiumText}>✨ PREMIUM SHARE</Text>
              </LinearGradient>
            </View>

            {/* Routine Info Card */}
            <View style={styles.routineCard}>
              <LinearGradient
                colors={
                  routine.type === 'AM'
                    ? Gradients.morning
                    : routine.type === 'PM'
                      ? Gradients.evening
                      : Gradients.primary
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.routineCardGradient}
              >
                <View style={styles.routineHeader}>
                  <Text style={styles.typeBadge}>
                    {getTypeEmoji(routine.type)} {routine.type}
                  </Text>
                  <Text style={styles.stepCount}>{routine.steps.length} {t.dashboard.analyses}</Text>
                </View>
                <Text style={styles.routineName}>{routine.name}</Text>
                {routine.notes && (
                  <Text style={styles.routineNotes} numberOfLines={2}>
                    {routine.notes}
                  </Text>
                )}
              </LinearGradient>
            </View>

            {/* Steps Preview */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Aperçu des étapes</Text>
              <View style={styles.stepsList}>
                {routine.steps.slice(0, 4).map((step, idx) => (
                  <View key={idx} style={styles.stepItem}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>{idx + 1}</Text>
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={styles.stepName}>{step.name}</Text>
                      {step.productName && (
                        <Text style={styles.stepProduct}>
                          {step.productName}
                          {step.productBrand && ` • ${step.productBrand}`}
                        </Text>
                      )}
                    </View>
                    {step.duration && (
                      <Text style={styles.stepDuration}>
                        ⏱️ {Math.round(Number(step.duration) / 60)}min
                      </Text>
                    )}
                  </View>
                ))}
                {routine.steps.length > 4 && (
                  <View style={styles.moreSteps}>
                    <Text style={styles.moreStepsText}>
                      +{routine.steps.length - 4} étape(s) supplémentaire(s)
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Custom Message Input */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Message personnalisé (optionnel)</Text>
              <Input
                placeholder="Partagez vos pensées sur cette routine..."
                value={customMessage}
                onChangeText={setCustomMessage}
                multiline
                maxLength={200}
                style={styles.input}
              />
              <Text style={styles.characterCount}>
                {customMessage.length}/200
              </Text>
            </View>

            {/* Post Preview */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Aperçu du post</Text>
              <View style={styles.previewBox}>
                <Text style={styles.previewText}>{previewMessage()}</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonGroup}>
              <Button
                variant="outline"
                size="lg"
                onPress={onClose}
                disabled={isLoading}
                fullWidth
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>{t.common.cancel}</Text>
              </Button>
              <Button
                variant="primary"
                size="lg"
                onPress={handleShare}
                disabled={isLoading}
                loading={isLoading}
                fullWidth
              >
                <Text style={styles.shareButtonText}>
                  {isLoading ? t.common.loading : `📤 ${t.shareRoutine.shareToFeed}`}
                </Text>
              </Button>
            </View>

            {/* Tips */}
            <View style={styles.tipsBox}>
              <Text style={styles.tipsTitle}>💡 Conseil</Text>
              <Text style={styles.tipsText}>
                Plus votre routine est détaillée, plus elle inspirera vos amis!
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
