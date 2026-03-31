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
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Gradients } from '../../theme';
import { FontSizes, FontWeights, Spacing } from '../../theme';
import { Routine } from '../../lib/types';
import { Button } from './Button';
import { Input } from './Input';

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
  const [customMessage, setCustomMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!routine) return null;

  const handleShare = async () => {
    try {
      setIsLoading(true);
      await onShare(customMessage);
      Alert.alert('Succès', 'Routine partagée avec succès!');
      resetModal();
      onClose();
    } catch (error) {
      Alert.alert(
        'Erreur',
        error instanceof Error ? error.message : 'Erreur lors du partage'
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
      case 'AM':
        return '🌅';
      case 'PM':
        return '🌙';
      case 'WEEKLY':
        return '⭐';
      default:
        return '✨';
    }
  };

  const previewMessage = () => {
    const emoji = getTypeEmoji(routine.type);
    let message = `${emoji} ${routine.name}\n`;
    message += `${routine.type} • ${routine.steps.length} étapes`;

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
      <LinearGradient colors={[Colors.gray50, Colors.gray100]} style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} disabled={isLoading}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Partager la routine</Text>
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
                  <Text style={styles.stepCount}>{routine.steps.length} étapes</Text>
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
                <Text style={styles.cancelButtonText}>Annuler</Text>
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
                  {isLoading ? 'Partage en cours...' : '📤 Partager sur votre fil'}
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
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
    paddingTop: Spacing.xl,
  },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold as any,
    color: Colors.gray900,
    textAlign: 'center',
  },
  closeButton: {
    fontSize: FontSizes['4xl'],
    color: Colors.gray500,
    width: 30,
    textAlign: 'left',
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  premiumBadgeContainer: {
    marginBottom: Spacing.lg,
    borderRadius: 12,
    overflow: 'hidden',
  },
  premiumBadge: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumText: {
    color: Colors.white,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold as any,
    letterSpacing: 1,
  },
  routineCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    elevation: 4,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  routineCardGradient: {
    padding: Spacing.lg,
  },
  routineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  typeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    color: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold as any,
  },
  stepCount: {
    color: Colors.white,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold as any,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  routineName: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold as any,
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  routineNotes: {
    fontSize: FontSizes.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    fontStyle: 'italic',
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold as any,
    color: Colors.gray900,
    marginBottom: Spacing.md,
  },
  stepsList: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.white,
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  stepNumberText: {
    color: Colors.white,
    fontWeight: FontWeights.bold as any,
    fontSize: FontSizes.base,
  },
  stepContent: {
    flex: 1,
  },
  stepName: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold as any,
    color: Colors.gray900,
    marginBottom: 2,
  },
  stepProduct: {
    fontSize: FontSizes.sm,
    color: Colors.gray600,
  },
  stepDuration: {
    fontSize: FontSizes.sm,
    color: Colors.gray500,
    marginLeft: Spacing.sm,
  },
  moreSteps: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryAlpha5,
  },
  moreStepsText: {
    color: Colors.primary,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold as any,
  },
  input: {
    height: 100,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gray300,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    fontSize: FontSizes.base,
    textAlignVertical: 'top',
    color: Colors.gray900,
  },
  characterCount: {
    fontSize: FontSizes.xs,
    color: Colors.gray500,
    marginTop: Spacing.xs,
    textAlign: 'right',
  },
  previewBox: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.gray200,
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  previewText: {
    fontSize: FontSizes.sm,
    color: Colors.gray900,
    lineHeight: 20,
    fontFamily: 'Courier New',
  },
  buttonGroup: {
    flexDirection: 'column',
    gap: Spacing.md,
    marginVertical: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  cancelButton: {
    borderWidth: 2,
    borderColor: Colors.gray300,
  },
  cancelButtonText: {
    color: Colors.gray700,
    fontWeight: FontWeights.semibold as any,
    fontSize: FontSizes.base,
  },
  shareButtonText: {
    color: Colors.white,
    fontWeight: FontWeights.bold as any,
    fontSize: FontSizes.base,
  },
  tipsBox: {
    backgroundColor: Colors.amber,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  tipsTitle: {
    color: Colors.gray900,
    fontWeight: FontWeights.bold as any,
    fontSize: FontSizes.base,
    marginBottom: Spacing.xs,
  },
  tipsText: {
    color: Colors.gray800,
    fontSize: FontSizes.sm,
    lineHeight: 18,
  },
});
