import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights, Shadows } from '../../theme';
import { useAccessibilityStyles } from '../../stores/useAccessibilityStyles';
import type { PredictiveRoutine, PredictiveRoutineDay } from '../../lib/types';

interface PredictiveRoutineModalProps {
  visible: boolean;
  routine: PredictiveRoutine | null;
  loading?: boolean;
  onAccept: () => void;
  onDismiss: () => void;
  onClose: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function PredictiveRoutineModal({
  visible,
  routine,
  loading = false,
  onAccept,
  onDismiss,
  onClose,
}: PredictiveRoutineModalProps) {
  const { colors, fontSizes } = useAccessibilityStyles();
  const [selectedDay, setSelectedDay] = useState(0);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (visible) {
      setSelectedDay(0);
      setAccepting(false);
    }
  }, [visible]);

  if (!routine || !routine.routine) return null;

  // Defensive: ensure days is always an array
  const days = Array.isArray(routine.routine.days) ? routine.routine.days : [];
  const currentDay = days[selectedDay] || null;
  const globalAdvice = routine.routine.globalAdvice || '';

  const handleAccept = async () => {
    setAccepting(true);
    try {
      await onAccept();
    } finally {
      setAccepting(false);
    }
  };

  const getWeatherIcon = (dayIndex: number): keyof typeof Ionicons.glyphMap => {
    if (!routine.weatherData?.daily) return 'cloud-outline';
    const uvIndex = routine.weatherData.daily.uv_index_max?.[dayIndex] || 0;
    const rain = routine.weatherData.daily.precipitation_sum?.[dayIndex] || 0;
    
    if (rain > 5) return 'rainy-outline';
    if (uvIndex > 7) return 'sunny';
    if (uvIndex > 4) return 'partly-sunny-outline';
    return 'cloud-outline';
  };

  const getUVLevel = (dayIndex: number): { text: string; color: string } => {
    if (!routine.weatherData?.daily) return { text: 'N/A', color: colors.textSecondary };
    const uvIndex = routine.weatherData.daily.uv_index_max?.[dayIndex] || 0;
    
    if (uvIndex <= 2) return { text: 'Faible', color: Colors.success };
    if (uvIndex <= 5) return { text: 'Modéré', color: Colors.amber };
    if (uvIndex <= 7) return { text: 'Élevé', color: Colors.warning };
    return { text: 'Très élevé', color: Colors.error };
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark || '#0066cc']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={Colors.white} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Ionicons name="sparkles" size={24} color={Colors.white} />
              <Text style={styles.headerTitle}>Routine Prédictive IA</Text>
            </View>
            <Text style={styles.headerSubtitle}>
              Programme personnalisé 7 jours basé sur votre analyse
            </Text>
          </View>
        </LinearGradient>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Génération de votre routine...
            </Text>
          </View>
        ) : days.length === 0 ? (
          <View style={[styles.content, { justifyContent: 'center', alignItems: 'center', padding: Spacing.xl }]}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.sectionTitle, { color: colors.text, textAlign: 'center', marginTop: Spacing.md }]}>
              Impossible de charger la routine
            </Text>
            <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm }}>
              La structure de la routine est invalide. Veuillez réessayer.
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Day Selector */}
            <View style={styles.daySelectorContainer}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Sélectionnez un jour
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.daySelector}
                contentContainerStyle={styles.daySelectorContent}
              >
                {days.map((day, index) => {
                  const isSelected = selectedDay === index;
                  // Defensive check: handle cases where day.day might be undefined or not a string
                  const dayString = day?.day || `Jour ${index + 1}`;
                  const dayName = typeof dayString === 'string' ? dayString.split(' ')[0] : `J${index + 1}`;
                  const uvLevel = getUVLevel(index);

                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setSelectedDay(index)}
                      style={[
                        styles.dayButton,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.surface,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name={getWeatherIcon(index)}
                        size={20}
                        color={isSelected ? Colors.white : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.dayButtonText,
                          { color: isSelected ? Colors.white : colors.text },
                        ]}
                      >
                        {dayName}
                      </Text>
                      <View
                        style={[
                          styles.uvBadge,
                          { backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : uvLevel.color + '20' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.uvBadgeText,
                            { color: isSelected ? Colors.white : uvLevel.color },
                          ]}
                        >
                          UV {uvLevel.text}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Current Day Routine */}
            {currentDay && (
              <View style={styles.dayRoutineContainer}>
                <Text style={[styles.dayTitle, { color: colors.text }]}>
                  {currentDay?.day || `Jour ${selectedDay + 1}`}
                </Text>

                {/* Morning Routine */}
                <View style={[styles.routineSection, { backgroundColor: colors.surface }]}>
                  <View style={styles.routineSectionHeader}>
                    <View style={[styles.routineIconBadge, { backgroundColor: Colors.amber + '20' }]}>
                      <Ionicons name="sunny" size={20} color={Colors.amber} />
                    </View>
                    <Text style={[styles.routineSectionTitle, { color: colors.text }]}>
                      Routine Matin
                    </Text>
                  </View>
                  {(currentDay?.morning || []).map((step, index) => (
                    <View key={index} style={styles.stepItem}>
                      <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                        <Text style={styles.stepNumberText}>{index + 1}</Text>
                      </View>
                      <Text style={[styles.stepText, { color: colors.text }]}>{step}</Text>
                    </View>
                  ))}
                </View>

                {/* Evening Routine */}
                <View style={[styles.routineSection, { backgroundColor: colors.surface }]}>
                  <View style={styles.routineSectionHeader}>
                    <View style={[styles.routineIconBadge, { backgroundColor: Colors.indigo + '20' }]}>
                      <Ionicons name="moon" size={20} color={Colors.indigo} />
                    </View>
                    <Text style={[styles.routineSectionTitle, { color: colors.text }]}>
                      Routine Soir
                    </Text>
                  </View>
                  {(currentDay?.evening || []).map((step, index) => (
                    <View key={index} style={styles.stepItem}>
                      <View style={[styles.stepNumber, { backgroundColor: Colors.indigo }]}>
                        <Text style={styles.stepNumberText}>{index + 1}</Text>
                      </View>
                      <Text style={[styles.stepText, { color: colors.text }]}>{step}</Text>
                    </View>
                  ))}
                </View>

                {/* Daily Tip */}
                {currentDay?.tip && (
                  <View style={[styles.tipCard, { backgroundColor: Colors.success + '10' }]}>
                    <Ionicons name="bulb" size={20} color={Colors.success} />
                    <Text style={[styles.tipText, { color: colors.text }]}>
                      {currentDay.tip}
                    </Text>
                  </View>
                )}

                {/* Warning */}
                {currentDay?.warning && (
                  <View style={[styles.warningCard, { backgroundColor: Colors.warning + '10' }]}>
                    <Ionicons name="warning" size={20} color={Colors.warning} />
                    <Text style={[styles.warningText, { color: colors.text }]}>
                      {currentDay.warning}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Global Advice */}
            {globalAdvice && (
              <View style={[styles.globalAdviceCard, { backgroundColor: colors.primary + '10' }]}>
                <View style={styles.globalAdviceHeader}>
                  <Ionicons name="ribbon" size={24} color={colors.primary} />
                  <Text style={[styles.globalAdviceTitle, { color: colors.primary }]}>
                    Conseils Personnalisés
                  </Text>
                </View>
                <Text style={[styles.globalAdviceText, { color: colors.text }]}>
                  {globalAdvice}
                </Text>
              </View>
            )}

            {/* Weather Info Summary */}
            {routine.weatherData?.daily && (
              <View style={[styles.weatherSummary, { backgroundColor: colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: Spacing.sm }]}>
                  Prévisions Météo
                </Text>
                <View style={styles.weatherRow}>
                  <View style={styles.weatherItem}>
                    <Ionicons name="sunny" size={16} color={Colors.amber} />
                    <Text style={[styles.weatherLabel, { color: colors.textSecondary }]}>
                      UV Max
                    </Text>
                    <Text style={[styles.weatherValue, { color: colors.text }]}>
                      {Math.max(...(routine.weatherData.daily.uv_index_max || [0]))}
                    </Text>
                  </View>
                  <View style={styles.weatherItem}>
                    <Ionicons name="thermometer" size={16} color={Colors.error} />
                    <Text style={[styles.weatherLabel, { color: colors.textSecondary }]}>
                      Temp Max
                    </Text>
                    <Text style={[styles.weatherValue, { color: colors.text }]}>
                      {Math.max(...(routine.weatherData.daily.temperature_2m_max || [0]))}°C
                    </Text>
                  </View>
                  <View style={styles.weatherItem}>
                    <Ionicons name="rainy" size={16} color={Colors.info} />
                    <Text style={[styles.weatherLabel, { color: colors.textSecondary }]}>
                      Précipitations
                    </Text>
                    <Text style={[styles.weatherValue, { color: colors.text }]}>
                      {(routine.weatherData.daily.precipitation_sum || []).reduce((a, b) => a + b, 0).toFixed(1)}mm
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Spacer for buttons */}
            <View style={{ height: 120 }} />
          </ScrollView>
        )}

        {/* Action Buttons */}
        {!loading && (
          <View style={[styles.actionBar, { backgroundColor: colors.background }]}>
            <TouchableOpacity
              onPress={onDismiss}
              style={[styles.dismissButton, { borderColor: colors.border }]}
            >
              <Ionicons name="close-circle-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.dismissButtonText, { color: colors.textSecondary }]}>
                Ignorer
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleAccept}
              disabled={accepting}
              style={[
                styles.acceptButton,
                { backgroundColor: accepting ? colors.primary + '80' : colors.primary },
              ]}
            >
              {accepting ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
                  <Text style={styles.acceptButtonText}>Valider ma routine</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  headerContent: {
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: -10,
    right: 0,
    padding: Spacing.sm,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  headerTitle: {
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.bold,
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: FontSizes.sm,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: FontSizes.base,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    marginBottom: Spacing.md,
  },
  daySelectorContainer: {
    marginBottom: Spacing.lg,
  },
  daySelector: {
    marginHorizontal: -Spacing.lg,
  },
  daySelectorContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  dayButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 80,
    marginRight: Spacing.sm,
  },
  dayButtonText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    marginTop: Spacing.xs,
  },
  uvBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.xs,
  },
  uvBadgeText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
  },
  dayRoutineContainer: {
    gap: Spacing.md,
  },
  dayTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.sm,
  },
  routineSection: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  routineSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  routineIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  routineSectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: Colors.white,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
  },
  stepText: {
    flex: 1,
    fontSize: FontSizes.sm,
    lineHeight: 20,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  tipText: {
    flex: 1,
    fontSize: FontSizes.sm,
    lineHeight: 20,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  warningText: {
    flex: 1,
    fontSize: FontSizes.sm,
    lineHeight: 20,
  },
  globalAdviceCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
  },
  globalAdviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  globalAdviceTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
  },
  globalAdviceText: {
    fontSize: FontSizes.sm,
    lineHeight: 22,
  },
  weatherSummary: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
    ...Shadows.sm,
  },
  weatherRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  weatherItem: {
    alignItems: 'center',
    gap: 4,
  },
  weatherLabel: {
    fontSize: FontSizes.xs,
  },
  weatherValue: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: Spacing.lg,
    paddingBottom: Spacing.xl + 10,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  dismissButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  dismissButtonText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.medium,
  },
  acceptButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  acceptButtonText: {
    color: Colors.white,
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
  },
});
