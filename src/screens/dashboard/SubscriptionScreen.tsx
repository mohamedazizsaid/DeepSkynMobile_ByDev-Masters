import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, Button, Badge } from '../../components';
import { Colors, Gradients, Spacing, BorderRadius, FontSizes, FontWeights } from '../../theme';
import { useAccessibilityStyles } from '../../stores/useAccessibilityStyles';

export function SubscriptionScreen() {
  const freeFeatures = [
    { text: 'Basic skin analysis', included: true },
    { text: 'Personalized routine', included: true },
    { text: 'Monthly reports', included: true },
    { text: 'AI coach (limited)', included: false },
    { text: 'Advanced analytics', included: false },
  ];

  const premiumFeatures = [
    { text: 'Advanced AI analysis', included: true },
    { text: 'AI dermatology coach', included: true },
    { text: 'Unlimited tracking', included: true },
    { text: 'Priority support', included: true },
    { text: 'Exclusive content', included: true },
  ];

  const premiumBenefits = [
    { icon: 'sparkles' as const, title: 'AI Coach', description: 'Unlimited AI consultations' },
    { icon: 'analytics' as const, title: 'Analytics', description: 'Deep skin insights' },
    { icon: 'shield-checkmark' as const, title: 'Priority', description: 'Priority support' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Subscription</Text>
        <Text style={styles.subtitle}>Choose the plan that's right for you</Text>
      </View>

      {/* Free Plan */}
      <Card style={styles.planCard}>
        <Text style={styles.planName}>Free</Text>
        <View style={styles.priceRow}>
          <Text style={styles.priceAmount}>$0</Text>
          <Text style={styles.pricePeriod}>/month</Text>
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
          Current Plan
        </Button>
      </Card>

      {/* Premium Plan */}
      <View style={styles.premiumWrapper}>
        <View style={styles.popularBadge}>
          <LinearGradient colors={Gradients.primary} style={styles.popularBadgeInner}>
            <Text style={styles.popularBadgeText}>Most Popular</Text>
          </LinearGradient>
        </View>
        <Card style={{...styles.planCard, ...styles.premiumPlan}}>
          <Text style={styles.planName}>Premium</Text>
          <View style={styles.priceRow}>
            <Text style={[styles.priceAmount, { color: Colors.primary }]}>$19</Text>
            <Text style={styles.pricePeriod}>/month</Text>
          </View>
          {premiumFeatures.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
              <Text style={styles.featureText}>{feature.text}</Text>
            </View>
          ))}
          <Button onPress={() => {}} fullWidth style={{ marginTop: Spacing.base }}>
            Start Premium Trial
          </Button>
        </Card>
      </View>

      {/* Premium Benefits */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Premium Benefits</Text>
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

      {/* FAQ */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>FAQ</Text>
        {[
          { q: 'Can I cancel anytime?', a: 'Yes, you can cancel your subscription at any time.' },
          { q: 'Is there a free trial?', a: 'Yes, premium comes with a 7-day free trial.' },
          { q: 'What payment methods?', a: 'We accept all major credit cards and Apple Pay.' },
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

const styles = StyleSheet.create({
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.base },
  planCard: { marginHorizontal: Spacing.xl, marginTop: Spacing.xl, padding: Spacing.xl },
  premiumWrapper: { marginTop: Spacing['2xl'] },
  premiumPlan: { borderWidth: 2 },
  popularBadge: { alignItems: 'center', marginBottom: -14, zIndex: 1 },
  popularBadgeInner: { paddingHorizontal: Spacing.base, paddingVertical: 4, borderRadius: BorderRadius.full },
  popularBadgeText: { color: Colors.white, fontSize: FontSizes.sm, fontWeight: FontWeights.medium },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: Spacing.xl },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  section: { paddingHorizontal: Spacing.xl, marginTop: Spacing['2xl'] },
  benefitsGrid: { flexDirection: 'row', gap: Spacing.md },
  benefitCard: { flex: 1, alignItems: 'center', padding: Spacing.base },
  benefitIcon: {
    width: 48, height: 48, borderRadius: BorderRadius.base,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm,
  },
  faqCard: { marginBottom: Spacing.md, padding: Spacing.base },
});
