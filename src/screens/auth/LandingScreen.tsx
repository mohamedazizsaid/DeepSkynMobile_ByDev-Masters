import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Logo, Card } from '../../components';
import { Colors, Gradients, Spacing, BorderRadius, FontSizes, FontWeights } from '../../theme';
import { useAccessibilityStyles } from '../../stores/useAccessibilityStyles';
import { useTranslation } from '../../lib/i18n';

export function LandingScreen({ navigation }: any) {
  const { colors, fontSizes } = useAccessibilityStyles();
  const { t } = useTranslation();

  const dynamicStyles = useMemo(() => ({
    container: { flex: 1, backgroundColor: colors.background },
    heroBadgeText: { fontSize: fontSizes.sm, color: colors.primary, fontWeight: FontWeights.medium },
    heroTitle: { fontSize: fontSizes['4xl'], fontWeight: FontWeights.bold, color: colors.text, lineHeight: 44, marginBottom: Spacing.base },
    heroSubtitle: { fontSize: fontSizes.lg, color: colors.textSecondary, lineHeight: 28, marginBottom: Spacing['2xl'] },
    statNumber: { fontSize: fontSizes['2xl'], fontWeight: FontWeights.bold, color: colors.primary },
    statLabel: { fontSize: fontSizes.sm, color: colors.textSecondary },
    scoreCard: { marginHorizontal: Spacing.xl, marginBottom: Spacing['2xl'], backgroundColor: colors.surface },
    scoreLabel: { fontSize: fontSizes.sm, color: colors.textSecondary, marginBottom: 4 },
    scoreValue: { fontSize: fontSizes['2xl'], fontWeight: FontWeights.bold, color: colors.primary },
    sectionTitle: { fontSize: fontSizes['2xl'], fontWeight: FontWeights.bold, color: colors.text, marginBottom: Spacing.sm, textAlign: 'center' as const },
    sectionSubtitle: { fontSize: fontSizes.base, color: colors.textSecondary, textAlign: 'center' as const, marginBottom: Spacing.xl },
    featureCard: { marginBottom: Spacing.md, backgroundColor: colors.surface },
    featureTitle: { fontSize: fontSizes.lg, fontWeight: FontWeights.bold, color: colors.text, marginBottom: Spacing.xs },
    featureDesc: { fontSize: fontSizes.sm, color: colors.textSecondary, lineHeight: 22 },
    benefitText: { fontSize: fontSizes.base, color: colors.text, flex: 1 },
    testimonialCard: { marginBottom: Spacing.md, backgroundColor: colors.surface },
    testimonialText: { fontSize: fontSizes.base, color: colors.text, fontStyle: 'italic' as const, marginBottom: Spacing.md, lineHeight: 24 },
    testimonialName: { fontSize: fontSizes.base, fontWeight: FontWeights.bold, color: colors.text },
    testimonialRole: { fontSize: fontSizes.sm, color: colors.textSecondary },
    pricingCard: { marginBottom: Spacing.base, backgroundColor: colors.surface },
    planName: { fontSize: fontSizes.xl, fontWeight: FontWeights.bold, color: colors.text, marginBottom: Spacing.sm },
    planPrice: { fontSize: fontSizes.base, color: colors.textSecondary, marginBottom: Spacing.base },
    planFeatureText: { fontSize: fontSizes.base, color: colors.text },
    footerText: { fontSize: fontSizes.sm, color: colors.textTertiary, textAlign: 'center' as const, marginTop: Spacing.sm },
    footerCopy: { fontSize: fontSizes.xs, color: colors.textTertiary, marginTop: Spacing.base },
  }), [colors, fontSizes]);

  const features = [
    { icon: 'sparkles' as const, title: t.landing.feature1Title, description: t.landing.feature1Desc },
    { icon: 'calendar-outline' as const, title: t.landing.feature2Title, description: t.landing.feature2Desc },
    { icon: 'trending-up-outline' as const, title: t.landing.feature3Title, description: t.landing.feature3Desc },
    { icon: 'sparkles-outline' as const, title: t.landing.feature4Title, description: t.landing.feature4Desc },
  ];

  const benefits = t.landing.benefits;

  const testimonials = [
    { name: 'Sarah Johnson', role: 'Premium User', text: 'DeepSkyn transformed my skincare routine! The AI analysis was incredibly accurate.', rating: 5 },
    { name: 'Michael Chen', role: 'Free User', text: "Finally, I understand my skin type and what products actually work for me.", rating: 5 },
    { name: 'Emma Williams', role: 'Premium User', text: 'The progress tracking keeps me motivated. I can see real improvements over time!', rating: 5 },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView style={dynamicStyles.container} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={[styles.heroBadge, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="sparkles" size={14} color={colors.primary} />
            <Text style={dynamicStyles.heroBadgeText}>{t.landing.heroTag}</Text>
          </View>

          <Text style={dynamicStyles.heroTitle}>
            {t.landing.heroTitle1}{'\n'}
            <Text style={{ color: colors.primary }}>{t.landing.heroTitleGradient}</Text>
            {'\n'}{t.landing.heroTitle2}
          </Text>

          <Text style={dynamicStyles.heroSubtitle}>
            {t.landing.heroDesc}
          </Text>

          <View style={styles.heroButtons}>
            <Button onPress={() => navigation.navigate('Signup')} size="lg">
              {t.landing.heroStart}
            </Button>
            <Button variant="outline" onPress={() => { }} size="lg">
              {t.landing.heroWatchDemo}
            </Button>
          </View>

          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={dynamicStyles.statNumber}>50K+</Text>
              <Text style={dynamicStyles.statLabel}>{t.landing.activeUsers}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={dynamicStyles.statNumber}>4.9★</Text>
              <Text style={dynamicStyles.statLabel}>{t.landing.userRating}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={dynamicStyles.statNumber}>95%</Text>
              <Text style={dynamicStyles.statLabel}>{t.landing.satisfaction}</Text>
            </View>
          </View>
        </View>

        {/* Skin Health Score Preview Card */}
        <Card style={dynamicStyles.scoreCard} variant="elevated">
          <View style={styles.scoreRow}>
            <View>
              <Text style={dynamicStyles.scoreLabel}>{t.landing.skinHealthScore}</Text>
              <Text style={dynamicStyles.scoreValue}>87/100</Text>
            </View>
            <LinearGradient
              colors={Gradients.primary}
              style={styles.scoreIcon}
            >
              <Ionicons name="trending-up" size={28} color={Colors.white} />
            </LinearGradient>
          </View>
        </Card>

        {/* Features Section */}
        <View style={styles.section}>
          <Text style={dynamicStyles.sectionTitle}>{t.landing.featuresTitle}</Text>
          <Text style={dynamicStyles.sectionSubtitle}>{t.landing.featuresDesc}</Text>

          {features.map((feature, index) => (
            <Card key={index} style={dynamicStyles.featureCard}>
              <View style={[styles.featureIconBox, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name={feature.icon as any} size={28} color={colors.primary} />
              </View>
              <Text style={dynamicStyles.featureTitle}>{feature.title}</Text>
              <Text style={dynamicStyles.featureDesc}>{feature.description}</Text>
            </Card>
          ))}
        </View>

        {/* Benefits Section */}
        <View style={styles.section}>
          <Text style={dynamicStyles.sectionTitle}>
            {t.landing.whyChoose}{'\n'}
            <Text style={{ color: colors.primary }}>DeepSkyn?</Text>
          </Text>
          <Text style={dynamicStyles.sectionSubtitle}>
            {t.landing.whyDesc}
          </Text>

          {benefits.map((benefit, index) => (
            <View key={index} style={styles.benefitRow}>
              <View style={styles.benefitCheck}>
                <Ionicons name="checkmark" size={14} color={Colors.white} />
              </View>
              <Text style={dynamicStyles.benefitText}>{benefit}</Text>
            </View>
          ))}
        </View>

        {/* Testimonials Section */}
        <View style={styles.section}>
          <Text style={dynamicStyles.sectionTitle}>{t.landing.lovedBy}</Text>
          <Text style={dynamicStyles.sectionSubtitle}>{t.landing.lovedDesc}</Text>

          {testimonials.map((testimonial, index) => (
            <Card key={index} style={dynamicStyles.testimonialCard}>
              <View style={styles.starsRow}>
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Ionicons key={i} name="star" size={18} color={Colors.gold} />
                ))}
              </View>
              <Text style={dynamicStyles.testimonialText}>"{testimonial.text}"</Text>
              <Text style={dynamicStyles.testimonialName}>{testimonial.name}</Text>
              <Text style={dynamicStyles.testimonialRole}>{testimonial.role}</Text>
            </Card>
          ))}
        </View>

        {/* Pricing Section */}
        <View style={styles.section}>
          <Text style={dynamicStyles.sectionTitle}>{t.landing.pricingTitle}</Text>
          <Text style={dynamicStyles.sectionSubtitle}>{t.landing.pricingDesc}</Text>

          <Card style={dynamicStyles.pricingCard}>
            <Text style={dynamicStyles.planName}>{t.landing.free}</Text>
            <Text style={dynamicStyles.planPrice}>
              <Text style={[styles.planPriceAmount, { color: colors.primary }]}>$0</Text>/month
            </Text>
            {t.landing.freeFeatures.map((item: string, i: number) => (
              <View key={i} style={styles.planFeatureRow}>
                <Ionicons name="checkmark" size={18} color={colors.primary} />
                <Text style={dynamicStyles.planFeatureText}>{item}</Text>
              </View>
            ))}
            <Button variant="outline" onPress={() => navigation.navigate('Signup')} fullWidth style={{ marginTop: Spacing.base }}>
              {t.landing.navGetStarted}
            </Button>
          </Card>

          <Card style={[dynamicStyles.pricingCard, { borderWidth: 2, borderColor: colors.primary }]}>
            <View style={styles.popularBadge}>
              <LinearGradient colors={Gradients.primary} style={styles.popularBadgeGradient}>
                <Text style={styles.popularBadgeText}>{t.landing.mostPopular}</Text>
              </LinearGradient>
            </View>
            <Text style={dynamicStyles.planName}>{t.landing.premium}</Text>
            <Text style={[dynamicStyles.planPrice, { color: colors.primary }]}>
              <Text style={[styles.planPriceAmount, { color: colors.primary }]}>$19</Text>/month
            </Text>
            {t.landing.premiumFeatures.map((item: string, i: number) => (
              <View key={i} style={styles.planFeatureRow}>
                <Ionicons name="checkmark" size={18} color={colors.primary} />
                <Text style={dynamicStyles.planFeatureText}>{item}</Text>
              </View>
            ))}
            <Button onPress={() => navigation.navigate('Signup')} fullWidth style={{ marginTop: Spacing.base }}>
              {t.landing.startTrial}
            </Button>
          </Card>
        </View>

        {/* CTA Section */}
        <LinearGradient colors={Gradients.primary} style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>{t.landing.readyToTransform}</Text>
          <Text style={styles.ctaSubtitle}>{t.landing.joinThousands}</Text>
          <Button
            variant="outline"
            onPress={() => navigation.navigate('Signup')}
            style={{ backgroundColor: Colors.white, borderColor: Colors.white }}
            textStyle={{ color: Colors.primary }}
            size="lg"
          >
            {t.landing.freeAnalysis}
          </Button>
        </LinearGradient>

        {/* Footer */}
        <View style={styles.footer}>
          <Logo size="sm" />
          <Text style={dynamicStyles.footerText}>{t.landing.footerDesc}</Text>
          <Text style={dynamicStyles.footerCopy}>© 2026 DeepSkyn. {t.landing.allRightsReserved}</Text>
        </View>

        {/* Bottom Auth Buttons */}
        <View style={styles.bottomAuth}>
          <Button onPress={() => navigation.navigate('Signup')} fullWidth size="lg">
            {t.landing.navGetStarted}
          </Button>
          <Button variant="ghost" onPress={() => navigation.navigate('Login')} fullWidth>
            {t.auth.haveAccount} {t.auth.signIn}
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray50 },
  hero: { paddingHorizontal: Spacing.xl, paddingTop: 60, paddingBottom: Spacing['2xl'] },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primaryAlpha10, paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full, alignSelf: 'flex-start', marginBottom: Spacing.xl,
  },
  heroBadgeText: { fontSize: FontSizes.sm, color: Colors.primary, fontWeight: FontWeights.medium },
  heroTitle: { fontSize: FontSizes['4xl'], fontWeight: FontWeights.bold, color: Colors.gray900, lineHeight: 44, marginBottom: Spacing.base },
  heroTitleGradient: { color: Colors.primary },
  heroSubtitle: { fontSize: FontSizes.lg, color: Colors.gray500, lineHeight: 28, marginBottom: Spacing['2xl'] },
  heroButtons: { gap: Spacing.md },
  stats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing['2xl'] },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: FontSizes['2xl'], fontWeight: FontWeights.bold, color: Colors.primary },
  statLabel: { fontSize: FontSizes.sm, color: Colors.gray500 },
  scoreCard: { marginHorizontal: Spacing.xl, marginBottom: Spacing['2xl'] },
  scoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  scoreLabel: { fontSize: FontSizes.sm, color: Colors.gray500, marginBottom: 4 },
  scoreValue: { fontSize: FontSizes['2xl'], fontWeight: FontWeights.bold, color: Colors.primary },
  scoreIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  section: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing['2xl'] },
  sectionTitle: { fontSize: FontSizes['2xl'], fontWeight: FontWeights.bold, color: Colors.gray900, marginBottom: Spacing.sm, textAlign: 'center' },
  sectionSubtitle: { fontSize: FontSizes.base, color: Colors.gray500, textAlign: 'center', marginBottom: Spacing.xl },
  featureCard: { marginBottom: Spacing.md },
  featureIconBox: {
    width: 56, height: 56, borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primaryAlpha10, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
  },
  featureTitle: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.gray900, marginBottom: Spacing.xs },
  featureDesc: { fontSize: FontSizes.sm, color: Colors.gray500, lineHeight: 22 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  benefitCheck: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  benefitText: { fontSize: FontSizes.base, color: Colors.gray700, flex: 1 },
  testimonialCard: { marginBottom: Spacing.md },
  starsRow: { flexDirection: 'row', gap: 2, marginBottom: Spacing.md },
  testimonialText: { fontSize: FontSizes.base, color: Colors.gray700, fontStyle: 'italic', marginBottom: Spacing.md, lineHeight: 24 },
  testimonialName: { fontSize: FontSizes.base, fontWeight: FontWeights.bold, color: Colors.gray900 },
  testimonialRole: { fontSize: FontSizes.sm, color: Colors.gray500 },
  pricingCard: { marginBottom: Spacing.base },
  premiumCard: { borderWidth: 2, borderColor: Colors.primary },
  popularBadge: { position: 'absolute', top: -14, alignSelf: 'center' },
  popularBadgeGradient: { paddingHorizontal: Spacing.base, paddingVertical: 4, borderRadius: BorderRadius.full },
  popularBadgeText: { color: Colors.white, fontSize: FontSizes.sm, fontWeight: FontWeights.medium },
  planName: { fontSize: FontSizes.xl, fontWeight: FontWeights.bold, color: Colors.gray900, marginBottom: Spacing.sm },
  planPrice: { fontSize: FontSizes.base, color: Colors.gray500, marginBottom: Spacing.base },
  planPriceAmount: { fontSize: FontSizes['3xl'], fontWeight: FontWeights.bold, color: Colors.primary },
  planFeatureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  planFeatureText: { fontSize: FontSizes.base, color: Colors.gray700 },
  ctaSection: {
    padding: Spacing['2xl'], marginHorizontal: Spacing.xl,
    borderRadius: BorderRadius.xl, alignItems: 'center', marginBottom: Spacing['2xl'],
  },
  ctaTitle: { fontSize: FontSizes['2xl'], fontWeight: FontWeights.bold, color: Colors.white, textAlign: 'center', marginBottom: Spacing.sm },
  ctaSubtitle: { fontSize: FontSizes.base, color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginBottom: Spacing.xl },
  footer: { alignItems: 'center', paddingVertical: Spacing['2xl'], paddingHorizontal: Spacing.xl },
  footerText: { fontSize: FontSizes.sm, color: Colors.gray400, textAlign: 'center', marginTop: Spacing.sm },
  footerCopy: { fontSize: FontSizes.xs, color: Colors.gray400, marginTop: Spacing.base },
  bottomAuth: { paddingHorizontal: Spacing.xl, paddingBottom: 40, gap: Spacing.sm },
});
