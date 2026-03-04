import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card } from '../../components';
import { Colors, Gradients, Spacing, BorderRadius, FontSizes, FontWeights } from '../../theme';

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  const features = [
    { icon: 'scan-outline' as const, title: 'Skin Analysis', description: 'AI-powered analysis of your unique skin type' },
    { icon: 'calendar-outline' as const, title: 'Custom Routine', description: 'Personalized skincare routine just for you' },
    { icon: 'trending-up-outline' as const, title: 'Track Progress', description: 'Monitor your skin evolution over time' },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={Gradients.primary}
        style={styles.iconBox}
      >
        <Ionicons name="sparkles" size={40} color={Colors.white} />
      </LinearGradient>

      <Text style={styles.title}>Welcome to DeepSkyn!</Text>
      <Text style={styles.subtitle}>
        We're excited to help you achieve your best skin ever. Let's get to know you in just a few simple steps.
      </Text>

      {features.map((feature, index) => (
        <Card key={index} style={styles.featureCard}>
          <View style={styles.featureIconBox}>
            <Ionicons name={feature.icon as any} size={24} color={Colors.primary} />
          </View>
          <Text style={styles.featureTitle}>{feature.title}</Text>
          <Text style={styles.featureDesc}>{feature.description}</Text>
        </Card>
      ))}

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>This process will take approximately 5 minutes</Text>
        <View style={styles.infoRow}>
          <View style={styles.dot} />
          <Text style={styles.infoDot}>5 quick steps to complete</Text>
        </View>
      </View>

      <Button onPress={onNext} size="lg" fullWidth>
        Get Started
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingHorizontal: Spacing.xl },
  iconBox: {
    width: 72, height: 72, borderRadius: BorderRadius.lg,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing['2xl'],
  },
  title: { fontSize: FontSizes['3xl'], fontWeight: FontWeights.bold, color: Colors.gray900, textAlign: 'center', marginBottom: Spacing.base },
  subtitle: { fontSize: FontSizes.base, color: Colors.gray500, textAlign: 'center', lineHeight: 24, marginBottom: Spacing['2xl'] },
  featureCard: { width: '100%', marginBottom: Spacing.md, alignItems: 'center' },
  featureIconBox: {
    width: 48, height: 48, borderRadius: BorderRadius.base,
    backgroundColor: Colors.primaryAlpha10, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
  },
  featureTitle: { fontSize: FontSizes.base, fontWeight: FontWeights.bold, color: Colors.gray900, marginBottom: Spacing.xs },
  featureDesc: { fontSize: FontSizes.sm, color: Colors.gray500, textAlign: 'center' },
  infoBox: {
    width: '100%', backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.lg, padding: Spacing.lg,
    marginBottom: Spacing['2xl'], alignItems: 'center',
  },
  infoText: { fontSize: FontSizes.sm, color: Colors.gray500, marginBottom: Spacing.md },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  infoDot: { fontSize: FontSizes.sm, color: Colors.primary },
});
