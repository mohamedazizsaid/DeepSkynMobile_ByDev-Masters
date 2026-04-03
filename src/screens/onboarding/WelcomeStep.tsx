import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card } from '../../components';
import { Colors, Gradients, Spacing, BorderRadius, FontWeights } from '../../theme';
import { useAccessibilityStyleSheet } from '../../stores/useAccessibilityStyles';
import { useTranslation } from '../../lib/i18n/useTranslation';

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  const { t } = useTranslation();
  const styles = useAccessibilityStyleSheet(({ colors, fontSizes }) => ({
    container: { alignItems: 'center', paddingHorizontal: Spacing.xl },
    iconBox: {
      width: 72, height: 72, borderRadius: BorderRadius.lg,
      alignItems: 'center', justifyContent: 'center', marginBottom: Spacing['2xl'],
    },
    title: { fontSize: fontSizes['3xl'], fontWeight: FontWeights.bold, color: colors.text, textAlign: 'center', marginBottom: Spacing.base },
    subtitle: { fontSize: fontSizes.base, color: colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: Spacing['2xl'] },
    featureCard: { width: '100%', marginBottom: Spacing.md, alignItems: 'center', backgroundColor: colors.surface },
    featureIconBox: {
      width: 48, height: 48, borderRadius: BorderRadius.base,
      backgroundColor: Colors.primaryAlpha10, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
    },
    featureTitle: { fontSize: fontSizes.base, fontWeight: FontWeights.bold, color: colors.text, marginBottom: Spacing.xs },
    featureDesc: { fontSize: fontSizes.sm, color: colors.textSecondary, textAlign: 'center' },
    infoBox: {
      width: '100%', backgroundColor: colors.backgroundSecondary,
      borderRadius: BorderRadius.lg, padding: Spacing.lg,
      marginBottom: Spacing['2xl'], alignItems: 'center',
    },
    infoText: { fontSize: fontSizes.sm, color: colors.textSecondary, marginBottom: Spacing.md },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
    infoDot: { fontSize: fontSizes.sm, color: colors.primary },
  }));

  const features = useMemo(() => {
    const icons = ['scan-outline', 'calendar-outline', 'trending-up-outline'];
    return t.onboarding.welcomeFeatures.map((f: any, i: number) => ({
      ...f,
      icon: icons[i] || 'sparkles'
    }));
  }, [t.onboarding.welcomeFeatures]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={Gradients.primary}
        style={styles.iconBox}
      >
        <Ionicons name="sparkles" size={40} color={Colors.white} />
      </LinearGradient>

      <Text style={styles.title}>{t.onboarding.welcomeTitle} DeepSkyn!</Text>
      <Text style={styles.subtitle}>
        {t.onboarding.welcomeSub}
      </Text>

      {features.map((feature: any, index: number) => (
        <Card key={index} style={styles.featureCard}>
          <View style={styles.featureIconBox}>
            <Ionicons name={feature.icon as any} size={24} color={Colors.primary} />
          </View>
          <Text style={styles.featureTitle}>{feature.title}</Text>
          <Text style={styles.featureDesc}>{feature.description || feature.desc}</Text>
        </Card>
      ))}

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>{t.onboarding.timeMin}</Text>
        <View style={styles.infoRow}>
          <View style={styles.dot} />
          <Text style={styles.infoDot}>{t.onboarding.steps.length} {t.onboarding.next}</Text> 
          {/* Wait, the text should be something like "X steps to complete" but I'll use placeholders if not available or just count the steps */}
        </View>
      </View>

      <Button onPress={onNext} size="lg" fullWidth>
        {t.onboarding.startInfo}
      </Button>
    </View>
  );
}
