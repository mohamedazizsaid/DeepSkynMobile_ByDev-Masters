import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, ProgressBar } from '../../components';
import { Colors, Gradients, Spacing, BorderRadius, FontSizes, FontWeights, Shadows } from '../../theme';
import { useAccessibilityStyles } from '../../stores/useAccessibilityStyles';

interface AnalysisProcessingProps {
  onComplete: () => void;
}

const processingSteps = [
  { id: 1, text: 'Analyzing uploaded images...', duration: 2000 },
  { id: 2, text: 'Detecting skin type...', duration: 1500 },
  { id: 3, text: 'Identifying concerns...', duration: 1800 },
  { id: 4, text: 'Calculating skin health score...', duration: 1700 },
  { id: 5, text: 'Generating personalized routine...', duration: 2000 },
];

export function AnalysisProcessing({ onComplete }: AnalysisProcessingProps) {
  const { colors, fontSizes, getAnimDuration } = useAccessibilityStyles();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [progress, setProgress] = useState(0);

  const dynamicStyles = useMemo(() => ({
    container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center' as const, padding: Spacing.xl },
    title: { fontSize: fontSizes['2xl'], fontWeight: FontWeights.bold, color: colors.text, textAlign: 'center' as const, marginBottom: Spacing.md },
    subtitle: { fontSize: fontSizes.base, color: colors.textSecondary, textAlign: 'center' as const, marginBottom: Spacing['2xl'] },
    card: { padding: Spacing.xl, marginBottom: Spacing.xl, backgroundColor: colors.surface },
    stepRow: { flexDirection: 'row' as const, alignItems: 'center' as const, marginBottom: Spacing.md },
    stepText: { fontSize: fontSizes.sm, color: colors.textSecondary, marginLeft: Spacing.md, flex: 1 },
    stepTextActive: { fontSize: fontSizes.sm, color: colors.text, marginLeft: Spacing.md, flex: 1, fontWeight: FontWeights.medium },
    stepTextCompleted: { fontSize: fontSizes.sm, color: colors.success, marginLeft: Spacing.md, flex: 1 },
  }), [colors, fontSizes]);

  useEffect(() => {
    if (currentStep < processingSteps.length) {
      const step = processingSteps[currentStep];
      const progressIncrement = 100 / processingSteps.length;
      let currentProgress = currentStep * progressIncrement;

      const progressInterval = setInterval(() => {
        currentProgress += 1;
        const target = (currentStep + 1) * progressIncrement;
        if (currentProgress >= target) { clearInterval(progressInterval); }
        setProgress(Math.min(currentProgress, 100));
      }, step.duration / progressIncrement);

      const timer = setTimeout(() => {
        setCompletedSteps((prev) => [...prev, step.id]);
        setCurrentStep((prev) => prev + 1);
      }, step.duration);

      return () => { clearTimeout(timer); clearInterval(progressInterval); };
    } else {
      setTimeout(onComplete, getAnimDuration(1000));
    }
  }, [currentStep, onComplete, getAnimDuration]);

  return (
    <View style={dynamicStyles.container}>
      <LinearGradient colors={Gradients.primary} style={styles.iconBox}>
        <Ionicons name="sparkles" size={40} color={Colors.white} />
      </LinearGradient>

      <Text style={dynamicStyles.title}>Analyzing Your Skin</Text>
      <Text style={dynamicStyles.subtitle}>Our AI is working its magic...</Text>

      <Card variant="elevated" style={dynamicStyles.card}>
        {/* Progress */}
        <View style={styles.progressHeader}>
          <Text style={dynamicStyles.stepTextActive}>Progress</Text>
          <Text style={dynamicStyles.stepTextActive}>{Math.round(progress)}%</Text>
        </View>
        <ProgressBar progress={progress} height={12} />

        {/* Steps */}
        <View style={styles.stepsList}>
          {processingSteps.map((step, index) => {
            const isCompleted = completedSteps.includes(step.id);
            const isCurrent = index === currentStep;
            return (
              <View
                key={step.id}
                style={dynamicStyles.stepRow}
              >
                <View style={[
                  styles.stepDot,
                  isCompleted ? { backgroundColor: colors.success } : undefined,
                  isCurrent ? { backgroundColor: Colors.primary } : undefined,
                ]}>
                  {isCompleted ? (
                    <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
                  ) : isCurrent ? (
                    <Ionicons name="reload" size={16} color={Colors.white} />
                  ) : (
                    <View style={styles.stepDotInner} />
                  )}
                </View>
                <Text style={
                  isCompleted ? dynamicStyles.stepTextCompleted :
                  isCurrent ? dynamicStyles.stepTextActive :
                  dynamicStyles.stepText
                }>
                  {step.text}
                </Text>
              </View>
            );
          })}
        </View>

        <Text style={dynamicStyles.subtitle}>
          Estimated time remaining:{' '}
          <Text style={{ fontWeight: FontWeights.medium, color: Colors.primary }}>
            {Math.max(0, Math.ceil((processingSteps.length - currentStep) * 1.5))}s
          </Text>
        </Text>
      </Card>

      <View style={styles.tipCard}>
        <Text style={dynamicStyles.stepText}>
          💡 <Text style={{ fontWeight: FontWeights.bold }}>Did you know?</Text> Your skin completely renews itself every 28 days!
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  iconBox: {
    width: 72, height: 72, borderRadius: BorderRadius.lg,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing['2xl'],
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  stepsList: { marginTop: Spacing.xl, gap: Spacing.md },
  stepDot: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.gray200, alignItems: 'center', justifyContent: 'center',
  },
  stepDotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.gray400 },
  tipCard: {
    marginTop: Spacing['2xl'],
    backgroundColor: Colors.white, borderRadius: BorderRadius.base,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.gray200,
    ...Shadows.md,
  },
});
