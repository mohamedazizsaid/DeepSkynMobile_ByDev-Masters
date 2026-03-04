import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights } from '../../theme';

interface OnboardingProgressBarProps {
  currentStep: number;
  totalSteps: number;
  steps: string[];
}

export function OnboardingProgressBar({ currentStep, totalSteps, steps }: OnboardingProgressBarProps) {
  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;

        return (
          <View key={index} style={styles.stepWrapper}>
            <View style={styles.stepColumn}>
              <View style={[
                styles.circle,
                isCompleted ? styles.circleCompleted : undefined,
                isCurrent ? styles.circleCurrent : undefined,
              ]}>
                {isCompleted ? (
                  <Ionicons name="checkmark" size={18} color={Colors.white} />
                ) : (
                  <Text style={[styles.circleText, isCurrent ? { color: Colors.primary } : undefined]}>
                    {stepNumber}
                  </Text>
                )}
              </View>
              <Text style={[styles.stepLabel, isCurrent ? { color: Colors.primary } : undefined]} numberOfLines={1}>
                {step}
              </Text>
            </View>
            {index < totalSteps - 1 && (
              <View style={styles.lineWrapper}>
                <View style={[styles.line, isCompleted ? styles.lineCompleted : undefined]} />
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: Spacing.base },
  stepWrapper: { flex: 1, flexDirection: 'row', alignItems: 'flex-start' },
  stepColumn: { alignItems: 'center' },
  circle: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 2, borderColor: Colors.gray200,
    backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center',
  },
  circleCompleted: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  circleCurrent: { borderColor: Colors.primary },
  circleText: { fontWeight: FontWeights.semibold, color: Colors.gray400, fontSize: FontSizes.sm },
  stepLabel: { fontSize: FontSizes.xs, fontWeight: FontWeights.medium, color: Colors.gray500, marginTop: Spacing.xs, textAlign: 'center' },
  lineWrapper: { flex: 1, justifyContent: 'center', paddingTop: 18, paddingHorizontal: Spacing.xs },
  line: { height: 2, backgroundColor: Colors.gray200 },
  lineCompleted: { backgroundColor: Colors.primary },
});
