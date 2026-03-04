import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, ProgressBar } from '../../components';
import { Colors, Gradients, Spacing, BorderRadius, FontSizes, FontWeights, Shadows } from '../../theme';

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
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [progress, setProgress] = useState(0);

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
      setTimeout(onComplete, 1000);
    }
  }, [currentStep]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={Gradients.primary} style={styles.iconBox}>
        <Ionicons name="sparkles" size={40} color={Colors.white} />
      </LinearGradient>

      <Text style={styles.title}>Analyzing Your Skin</Text>
      <Text style={styles.subtitle}>Our AI is working its magic...</Text>

      <Card variant="elevated" style={styles.card}>
        {/* Progress */}
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Progress</Text>
          <Text style={styles.progressValue}>{Math.round(progress)}%</Text>
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
                style={[
                  styles.stepRow,
                  isCurrent ? styles.stepRowActive : undefined,
                ]}
              >
                <View style={[
                  styles.stepDot,
                  isCompleted ? { backgroundColor: Colors.success } : undefined,
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
                <Text style={[
                  styles.stepText,
                  isCompleted ? { color: Colors.success } : undefined,
                  isCurrent ? { color: Colors.primary } : undefined,
                ]}>
                  {step.text}
                </Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.estimateText}>
          Estimated time remaining:{' '}
          <Text style={{ fontWeight: FontWeights.medium, color: Colors.primary }}>
            {Math.max(0, Math.ceil((processingSteps.length - currentStep) * 1.5))}s
          </Text>
        </Text>
      </Card>

      <View style={styles.tipCard}>
        <Text style={styles.tipText}>
          💡 <Text style={{ fontWeight: FontWeights.bold }}>Did you know?</Text> Your skin completely renews itself every 28 days!
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: Colors.gray50,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl,
  },
  iconBox: {
    width: 72, height: 72, borderRadius: BorderRadius.lg,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing['2xl'],
  },
  title: { fontSize: FontSizes['2xl'], fontWeight: FontWeights.bold, color: Colors.gray900, marginBottom: Spacing.sm },
  subtitle: { fontSize: FontSizes.lg, color: Colors.gray500, marginBottom: Spacing['2xl'] },
  card: { width: '100%', padding: Spacing['2xl'] },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  progressLabel: { fontSize: FontSizes.sm, fontWeight: FontWeights.medium, color: Colors.gray500 },
  progressValue: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold, color: Colors.primary },
  stepsList: { marginTop: Spacing.xl, gap: Spacing.md },
  stepRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.base,
    padding: Spacing.base, borderRadius: BorderRadius.base,
  },
  stepRowActive: { backgroundColor: Colors.primaryAlpha10 },
  stepDot: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.gray200, alignItems: 'center', justifyContent: 'center',
  },
  stepDotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.gray400 },
  stepText: { fontSize: FontSizes.base, fontWeight: FontWeights.medium, color: Colors.gray400, flex: 1 },
  estimateText: { fontSize: FontSizes.sm, color: Colors.gray500, textAlign: 'center', marginTop: Spacing.xl },
  tipCard: {
    marginTop: Spacing['2xl'],
    backgroundColor: Colors.white, borderRadius: BorderRadius.base,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.gray200,
    ...Shadows.md,
  },
  tipText: { fontSize: FontSizes.sm, color: Colors.gray500, textAlign: 'center' },
});
