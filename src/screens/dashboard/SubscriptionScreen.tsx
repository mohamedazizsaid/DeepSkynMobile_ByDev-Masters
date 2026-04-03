import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, Button } from '../../components';
import { Colors, Gradients, Spacing, BorderRadius, FontWeights } from '../../theme';
import { useAccessibilityStyleSheet } from '../../stores/useAccessibilityStyles';
import { useTranslation } from '../../lib/i18n/useTranslation';

export function SubscriptionScreen() {
  const { t } = useTranslation();
  
  const styles = useAccessibilityStyleSheet(({ colors, fontSizes }) => ({
    safeArea: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1 },
    header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.base },
    title: { fontSize: fontSizes['3xl'], fontWeight: FontWeights.bold, color: colors.text },
    subtitle: { fontSize: fontSizes.base, color: colors.textSecondary, marginTop: 4 },
    planCard: { marginHorizontal: Spacing.xl, marginTop: Spacing.xl, padding: Spacing.xl, backgroundColor: colors.surface },
    planName: { fontSize: fontSizes.xl, fontWeight: FontWeights.bold, color: colors.text, marginBottom: Spacing.sm },
    priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: Spacing.xl },
    priceAmount: { fontSize: fontSizes['3xl'], fontWeight: FontWeights.bold, color: colors.text },
    pricePeriod: { fontSize: fontSizes.base, color: colors.textSecondary },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
    featureText: { fontSize: fontSizes.base, color: colors.text },
    featureTextDisabled: { color: colors.textTertiary },
    premiumWrapper: { marginTop: Spacing['2xl'] },
    popularBadge: { alignItems: 'center', marginBottom: -14, zIndex: 1 },
    popularBadgeInner: { paddingHorizontal: Spacing.base, paddingVertical: 4, borderRadius: BorderRadius.full },
    popularBadgeText: { color: Colors.white, fontSize: fontSizes.sm, fontWeight: FontWeights.medium },
    premiumPlan: { borderWidth: 2, borderColor: colors.primary },
    section: { paddingHorizontal: Spacing.xl, marginTop: Spacing['2xl'] },
    sectionTitle: { fontSize: fontSizes.lg, fontWeight: FontWeights.bold, color: colors.text, marginBottom: Spacing.lg },
    benefitsGrid: { flexDirection: 'row', gap: Spacing.md },
    benefitCard: { flex: 1, alignItems: 'center', padding: Spacing.base, backgroundColor: colors.surface },
    benefitIcon: {
      width: 48, height: 48, borderRadius: BorderRadius.base,
      alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm,
    },
    benefitTitle: { fontSize: fontSizes.sm, fontWeight: FontWeights.bold, color: colors.text },
    benefitDesc: { fontSize: fontSizes.xs, color: colors.textSecondary, textAlign: 'center' },
    faqCard: { marginBottom: Spacing.md, padding: Spacing.base, backgroundColor: colors.surface },
    faqQuestion: { fontSize: fontSizes.base, fontWeight: FontWeights.bold, color: colors.text, marginBottom: 4 },
    faqAnswer: { fontSize: fontSizes.sm, color: colors.textSecondary },
  }));

  const freeFeatures = [
    { text: t.subscriptionScreen.freeFeatures[0], included: true },
    { text: t.subscriptionScreen.freeFeatures[1], included: true },
    { text: t.subscriptionScreen.freeFeatures[2], included: true },
    { text: t.subscriptionScreen.freeFeatures[3], included: false },
    { text: t.subscriptionScreen.freeFeatures[4], included: false },
  ];

  const premiumFeatures = [
    { text: t.subscriptionScreen.premiumFeatures[0], included: true },
    { text: t.subscriptionScreen.premiumFeatures[1], included: true },
    { text: t.subscriptionScreen.premiumFeatures[2], included: true },
    { text: t.subscriptionScreen.premiumFeatures[3], included: true },
    { text: t.subscriptionScreen.premiumFeatures[4], included: true },
  ];

  const premiumBenefits = [
    { icon: 'sparkles' as const, title: t.subscriptionScreen.benefits.aiCoach.title, description: t.subscriptionScreen.benefits.aiCoach.desc },
    { icon: 'analytics' as const, title: t.subscriptionScreen.benefits.analytics.title, description: t.subscriptionScreen.benefits.analytics.desc },
    { icon: 'shield-checkmark' as const, title: t.subscriptionScreen.benefits.priority.title, description: t.subscriptionScreen.benefits.priority.desc },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>{t.subscriptionScreen.title}</Text>
          <Text style={styles.subtitle}>{t.subscriptionScreen.subtitle}</Text>
        </View>

        {/* Free Plan */}
        <Card style={styles.planCard}>
          <Text style={styles.planName}>{t.subscriptionScreen.freePlan}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceAmount}>{t.subscriptionScreen.freeAmount}</Text>
            <Text style={styles.pricePeriod}>{t.subscriptionScreen.freePeriod}</Text>
          </View>
          {freeFeatures.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Ionicons
                name={feature.included ? 'checkmark-circle' : 'close-circle'}
                size={20}
                color={feature.included ? Colors.primary : Colors.gray300}
              />
              <Text style={[styles.featureText, !feature.included ? styles.featureTextDisabled : undefined]}>
                {feature.text}
              </Text>
            </View>
          ))}
          <Button variant="outline" onPress={() => {}} fullWidth style={{ marginTop: Spacing.base }}>
            {t.subscriptionScreen.currentPlan}
          </Button>
        </Card>

        {/* Premium Plan */}
        <View style={styles.premiumWrapper}>
          <View style={styles.popularBadge}>
            <LinearGradient colors={Gradients.primary} style={styles.popularBadgeInner}>
              <Text style={styles.popularBadgeText}>{t.subscriptionScreen.mostPopular}</Text>
            </LinearGradient>
          </View>
          <Card style={{...styles.planCard, ...styles.premiumPlan}}>
            <Text style={styles.planName}>{t.subscriptionScreen.premiumPlan}</Text>
            <View style={styles.priceRow}>
              <Text style={[styles.priceAmount, { color: Colors.primary }]}>{t.subscriptionScreen.premiumAmount}</Text>
              <Text style={styles.pricePeriod}>{t.subscriptionScreen.premiumPeriod}</Text>
            </View>
            {premiumFeatures.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                <Text style={styles.featureText}>{feature.text}</Text>
              </View>
            ))}
            <Button onPress={() => {}} fullWidth style={{ marginTop: Spacing.base }}>
              {t.subscriptionScreen.startPremium}
            </Button>
          </Card>
        </View>

        {/* Premium Benefits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.subscriptionScreen.premiumBenefitsTitle}</Text>
          <View style={styles.benefitsGrid}>
            {premiumBenefits.map((benefit, index) => (
              <Card key={index} style={styles.benefitCard}>
                <LinearGradient colors={Gradients.primary} style={styles.benefitIcon}>
                  <Ionicons name={benefit.icon as any} size={24} color={Colors.white} />
                </LinearGradient>
                <Text style={styles.benefitTitle}>{benefit.title}</Text>
                <Text style={styles.benefitDesc}>{benefit.description}</Text>
              </Card>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.subscriptionScreen.faqTitle}</Text>
          {[
            t.subscriptionScreen.faqs.cancel,
            t.subscriptionScreen.faqs.trial,
            t.subscriptionScreen.faqs.payment,
          ].map((faq, index) => (
            <Card key={index} style={styles.faqCard}>
              <Text style={styles.faqQuestion}>{faq.q}</Text>
              <Text style={styles.faqAnswer}>{faq.a}</Text>
            </Card>
          ))}
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
