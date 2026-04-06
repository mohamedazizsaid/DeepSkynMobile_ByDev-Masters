import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights, Shadows } from '../../theme';
import { useAccessibilityStyles } from '../../stores/useAccessibilityStyles';
import type { PredictiveRoutine, PredictiveRoutineStatus } from '../../lib/types';

interface PredictiveRoutineCardProps {
  routine: PredictiveRoutine;
  onPress: () => void;
  onDismiss?: () => void;
  compact?: boolean;
}

export function PredictiveRoutineCard({
  routine,
  onPress,
  onDismiss,
  compact = false,
}: PredictiveRoutineCardProps) {
  const { colors, fontSizes } = useAccessibilityStyles();

  const getDaysCount = () => {
    return routine.routine?.days?.length || 7;
  };

  const getExpiryText = () => {
    const expiresAt = new Date(routine.expiresAt);
    const now = new Date();
    const diffDays = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return 'Expirée';
    if (diffDays === 1) return 'Expire demain';
    return `Expire dans ${diffDays} jours`;
  };

  const getStatusBadge = () => {
    switch (routine.status) {
      case 'PENDING':
        return { text: 'Nouvelle', color: Colors.primary, icon: 'sparkles' as const };
      case 'VIEWED':
        return { text: 'Vue', color: Colors.info, icon: 'eye' as const };
      case 'ACCEPTED':
        return { text: 'Acceptée', color: Colors.success, icon: 'checkmark-circle' as const };
      default:
        return { text: routine.status, color: colors.textSecondary, icon: 'ellipse' as const };
    }
  };

  const statusBadge = getStatusBadge();

  if (compact) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark || '#0066cc']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.compactCard}
        >
          <View style={styles.compactContent}>
            <View style={styles.compactLeft}>
              <View style={styles.iconBadge}>
                <Ionicons name="sparkles" size={20} color={Colors.white} />
              </View>
              <View style={styles.compactTextContainer}>
                <Text style={styles.compactTitle}>Routine IA disponible</Text>
                <Text style={styles.compactSubtitle}>
                  {getDaysCount()} jours • {getExpiryText()}
                </Text>
              </View>
            </View>
            <View style={styles.compactActions}>
              {onDismiss && (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    onDismiss();
                  }}
                  style={styles.compactDismissButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={18} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
              )}
              <Ionicons name="chevron-forward" size={20} color={Colors.white} />
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <LinearGradient
          colors={[Colors.primary + '15', Colors.primary + '05']}
          style={styles.cardGradient}
        >
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconBadgeLarge, { backgroundColor: colors.primary }]}>
                <Ionicons name="sparkles" size={24} color={Colors.white} />
              </View>
              <View>
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  Routine Prédictive IA
                </Text>
                <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                  Programme personnalisé {getDaysCount()} jours
                </Text>
              </View>
            </View>
            {onDismiss && (
              <TouchableOpacity
                onPress={onDismiss}
                style={styles.dismissButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Status & Expiry */}
          <View style={styles.metaRow}>
            <View style={[styles.statusBadge, { backgroundColor: statusBadge.color + '20' }]}>
              <Ionicons name={statusBadge.icon} size={14} color={statusBadge.color} />
              <Text style={[styles.statusText, { color: statusBadge.color }]}>
                {statusBadge.text}
              </Text>
            </View>
            <View style={styles.expiryContainer}>
              <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.expiryText, { color: colors.textSecondary }]}>
                {getExpiryText()}
              </Text>
            </View>
          </View>

          {/* Preview - First day */}
          {routine.routine?.days?.[0] && (
            <View style={[styles.previewSection, { borderTopColor: colors.border }]}>
              <Text style={[styles.previewTitle, { color: colors.text }]}>
                Aperçu: {routine.routine.days[0].day}
              </Text>
              <View style={styles.previewContent}>
                <View style={styles.previewColumn}>
                  <View style={styles.previewHeader}>
                    <Ionicons name="sunny" size={14} color={Colors.amber} />
                    <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>
                      Matin
                    </Text>
                  </View>
                  <Text
                    style={[styles.previewSteps, { color: colors.text }]}
                    numberOfLines={2}
                  >
                    {routine.routine.days[0].morning.slice(0, 2).join(' → ')}
                    {routine.routine.days[0].morning.length > 2 && '...'}
                  </Text>
                </View>
                <View style={[styles.previewDivider, { backgroundColor: colors.border }]} />
                <View style={styles.previewColumn}>
                  <View style={styles.previewHeader}>
                    <Ionicons name="moon" size={14} color={Colors.indigo} />
                    <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>
                      Soir
                    </Text>
                  </View>
                  <Text
                    style={[styles.previewSteps, { color: colors.text }]}
                    numberOfLines={2}
                  >
                    {routine.routine.days[0].evening.slice(0, 2).join(' → ')}
                    {routine.routine.days[0].evening.length > 2 && '...'}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* CTA Button */}
          <TouchableOpacity
            onPress={onPress}
            style={[styles.ctaButton, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.ctaButtonText}>Voir ma routine</Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.white} />
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Compact Card Styles
  compactCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactTextContainer: {
    flex: 1,
  },
  compactTitle: {
    color: Colors.white,
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
  },
  compactSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FontSizes.xs,
    marginTop: 2,
  },
  compactActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  compactDismissButton: {
    padding: 4,
  },

  // Full Card Styles
  card: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  cardGradient: {
    padding: Spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  iconBadgeLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
  cardSubtitle: {
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
  dismissButton: {
    padding: Spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
  },
  expiryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expiryText: {
    fontSize: FontSizes.xs,
  },
  previewSection: {
    paddingTop: Spacing.md,
    marginTop: Spacing.sm,
    borderTopWidth: 1,
  },
  previewTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    marginBottom: Spacing.sm,
  },
  previewContent: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  previewColumn: {
    flex: 1,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  previewLabel: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
  },
  previewSteps: {
    fontSize: FontSizes.xs,
    lineHeight: 16,
  },
  previewDivider: {
    width: 1,
    alignSelf: 'stretch',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
  },
  ctaButtonText: {
    color: Colors.white,
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
  },
});
