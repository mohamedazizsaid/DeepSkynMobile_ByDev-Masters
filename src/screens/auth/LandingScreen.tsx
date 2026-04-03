import React, { useMemo, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
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
  const scrollY = useRef(new Animated.Value(0)).current;

  const topHeroTranslateY = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [0, -92],
    extrapolate: 'clamp',
  });

  const topHeroOpacity = scrollY.interpolate({
    inputRange: [0, 70, 140],
    outputRange: [1, 0.72, 0],
    extrapolate: 'clamp',
  });

  const topHeroScale = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [1, 0.95],
    extrapolate: 'clamp',
  });

  const landing = {
    heroTag: 'Analyse IA',
    heroTitle1: 'Votre compagnon personnel de',
    heroTitleGradient: 'santé de la peau',
    heroTitle2: '',
    heroDesc: 'Analyse IA, routines personnalisées et conseils experts pour votre peau.',
    heroStart: 'Commencer',
    heroWatchDemo: 'Voir la démo',
    activeUsers: 'Utilisateurs actifs',
    userRating: 'Note utilisateur',
    satisfaction: 'Satisfaction',
    skinHealthScore: 'Score de santé de la peau',
    featuresTitle: 'Fonctionnalités puissantes',
    featuresDesc: 'Tout ce qu\'il faut pour une peau en meilleure santé',
    feature1Title: 'Analyse IA',
    feature1Desc: 'Analyse précise de votre peau',
    feature2Title: 'Routines personnalisées',
    feature2Desc: 'Des soins adaptés à votre profil',
    feature3Title: 'Suivi des progrès',
    feature3Desc: 'Mesurez l\'évolution de votre peau',
    feature4Title: 'Recommandations intelligentes',
    feature4Desc: 'Recevez des conseils adaptés à vos besoins',
    whyChoose: 'Pourquoi choisir',
    whyDesc: 'Une plateforme complète qui combine IA et expertise dermatologique.',
    benefits: Array.isArray((t.landing as any).benefits) ? (t.landing as any).benefits : [],
    lovedBy: 'Apprécié par des milliers de personnes',
    lovedDesc: 'Découvrez les retours de nos utilisateurs',
    pricingTitle: 'Tarifs simples et transparents',
    pricingDesc: 'Choisissez le plan qui vous convient',
    free: 'Gratuit',
    freeFeatures: ['Analyse de base', 'Routine personnalisée', 'Rapports mensuels'],
    premium: 'Premium',
    mostPopular: 'Le plus populaire',
    premiumFeatures: ['Analyse IA avancée', 'Coach dermatologique IA', 'Suivi illimité', 'Support prioritaire'],
    enterprise: 'Entreprise',
    enterprisePrice: 'Sur mesure',
    enterpriseFeatures: ['Espace équipe multi-utilisateurs', 'Tableau de bord avancé', 'Intégrations API dédiées', 'Support prioritaire'],
    contactSales: 'Contacter les ventes',
    startTrial: 'Essai Premium',
    readyToTransform: 'Prêt à transformer votre peau ?',
    joinThousands: 'Rejoignez des milliers d\'utilisateurs qui progressent chaque jour',
    freeAnalysis: 'Commencer l\'analyse gratuite',
    navGetStarted: 'Commencer',
    footerDesc: 'Votre compagnon peau propulsé par l\'IA.',
    product: 'Produit',
    company: 'Entreprise',
    legal: 'Légal',
    footerFeatures: 'Fonctionnalités',
    footerPricing: 'Tarifs',
    footerFaq: 'FAQ',
    footerAbout: 'À propos',
    footerBlog: 'Blog',
    footerCareers: 'Carrières',
    footerPrivacy: 'Confidentialité',
    footerTerms: 'Conditions',
    footerSecurity: 'Sécurité',
    allRightsReserved: 'Tous droits réservés.',
  };

  const auth = {
    haveAccount: (t.auth as any).haveAccount ?? (t.auth as any).hasAccount ?? 'Vous avez déjà un compte ?',
    signIn: (t.auth as any).signIn ?? (t.auth as any).loginLink ?? 'Se connecter',
  };

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
    { icon: 'sparkles' as const, title: landing.feature1Title, description: landing.feature1Desc },
    { icon: 'calendar-outline' as const, title: landing.feature2Title, description: landing.feature2Desc },
    { icon: 'trending-up-outline' as const, title: landing.feature3Title, description: landing.feature3Desc },
    { icon: 'sparkles-outline' as const, title: landing.feature4Title, description: landing.feature4Desc },
  ];

  const benefits: string[] = landing.benefits;

  const testimonials = [
    { name: 'Sarah Johnson', role: 'Premium User', text: 'DeepSkyn transformed my skincare routine! The AI analysis was incredibly accurate.', rating: 5 },
    { name: 'Michael Chen', role: 'Free User', text: "Finally, I understand my skin type and what products actually work for me.", rating: 5 },
    { name: 'Emma Williams', role: 'Premium User', text: 'The progress tracking keeps me motivated. I can see real improvements over time!', rating: 5 },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#1B8FE8' }} />
      <Animated.ScrollView
        style={dynamicStyles.container}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        <Animated.View
          style={[
            styles.splashHeroWrap,
            {
              opacity: topHeroOpacity,
              transform: [{ translateY: topHeroTranslateY }, { scale: topHeroScale }],
            },
          ]}
        >
          <LinearGradient colors={[Colors.primaryDark, Colors.primary]} style={styles.splashHeroGradient}>
            <View style={styles.splashHeroRing}>
              <View style={styles.splashHeroCircle}>
                <LinearGradient colors={[Colors.primary, Colors.primaryLight]} style={styles.splashBrandMark}>
                  <Ionicons name="sparkles" size={24} color={Colors.white} />
                </LinearGradient>
                <Text style={styles.splashBrandText}>DeepSkyn</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={[styles.heroBadge, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="sparkles" size={14} color={colors.primary} />
            <Text style={dynamicStyles.heroBadgeText}>{landing.heroTag}</Text>
          </View>

          <Text style={dynamicStyles.heroTitle}>
            {landing.heroTitle1}{'\n'}
            <Text style={{ color: colors.primary }}>{landing.heroTitleGradient}</Text>
            {'\n'}{landing.heroTitle2}
          </Text>

          <Text style={dynamicStyles.heroSubtitle}>
            {landing.heroDesc}
          </Text>

          <View style={styles.heroButtons}>
            <Button onPress={() => navigation.navigate('Signup')} size="lg">
              {landing.heroStart}
            </Button>
            <Button variant="outline" onPress={() => { }} size="lg">
              {landing.heroWatchDemo}
            </Button>
          </View>

          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={dynamicStyles.statNumber}>50K+</Text>
              <Text style={dynamicStyles.statLabel}>{landing.activeUsers}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={dynamicStyles.statNumber}>4.9★</Text>
              <Text style={dynamicStyles.statLabel}>{landing.userRating}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={dynamicStyles.statNumber}>95%</Text>
              <Text style={dynamicStyles.statLabel}>{landing.satisfaction}</Text>
            </View>
          </View>
        </View>

        {/* Skin Health Score Preview Card */}
        <Card style={dynamicStyles.scoreCard} variant="elevated">
          <View style={styles.scoreRow}>
            <View>
              <Text style={dynamicStyles.scoreLabel}>{landing.skinHealthScore}</Text>
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
          <Text style={dynamicStyles.sectionTitle}>{landing.featuresTitle}</Text>
          <Text style={dynamicStyles.sectionSubtitle}>{landing.featuresDesc}</Text>

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
            {landing.whyChoose}{'\n'}
            <Text style={{ color: colors.primary }}>DeepSkyn?</Text>
          </Text>
          <Text style={dynamicStyles.sectionSubtitle}>
            {landing.whyDesc}
          </Text>

          {benefits.map((benefit: string, index: number) => (
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
          <Text style={dynamicStyles.sectionTitle}>{landing.lovedBy}</Text>
          <Text style={dynamicStyles.sectionSubtitle}>{landing.lovedDesc}</Text>

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
          <Text style={dynamicStyles.sectionTitle}>{landing.pricingTitle}</Text>
          <Text style={dynamicStyles.sectionSubtitle}>{landing.pricingDesc}</Text>

          <Card style={dynamicStyles.pricingCard}>
            <Text style={dynamicStyles.planName}>{landing.free}</Text>
            <Text style={dynamicStyles.planPrice}>
              <Text style={[styles.planPriceAmount, { color: colors.primary }]}>$0</Text>/month
            </Text>
            {landing.freeFeatures.map((item: string, i: number) => (
              <View key={i} style={styles.planFeatureRow}>
                <Ionicons name="checkmark" size={18} color={colors.primary} />
                <Text style={dynamicStyles.planFeatureText}>{item}</Text>
              </View>
            ))}
            <Button variant="outline" onPress={() => navigation.navigate('Signup')} fullWidth style={{ marginTop: Spacing.base }}>
              {landing.navGetStarted}
            </Button>
          </Card>

          <Card style={[dynamicStyles.pricingCard, { borderWidth: 2, borderColor: colors.primary }] as any}>
            <View style={styles.popularBadge}>
              <LinearGradient colors={Gradients.primary} style={styles.popularBadgeGradient}>
                <Text style={styles.popularBadgeText}>{landing.mostPopular}</Text>
              </LinearGradient>
            </View>
            <Text style={dynamicStyles.planName}>{landing.premium}</Text>
            <Text style={[dynamicStyles.planPrice, { color: colors.primary }]}>
              <Text style={[styles.planPriceAmount, { color: colors.primary }]}>$19</Text>/month
            </Text>
            {landing.premiumFeatures.map((item: string, i: number) => (
              <View key={i} style={styles.planFeatureRow}>
                <Ionicons name="checkmark" size={18} color={colors.primary} />
                <Text style={dynamicStyles.planFeatureText}>{item}</Text>
              </View>
            ))}
            <Button onPress={() => navigation.navigate('Signup')} fullWidth style={{ marginTop: Spacing.base }}>
              {landing.startTrial}
            </Button>
          </Card>
        </View>

        {/* CTA Section */}
        <LinearGradient colors={Gradients.primary} style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>{landing.readyToTransform}</Text>
          <Text style={styles.ctaSubtitle}>{landing.joinThousands}</Text>
          <Button
            variant="outline"
            onPress={() => navigation.navigate('Signup')}
            style={{ backgroundColor: Colors.white, borderColor: Colors.white }}
            textStyle={{ color: Colors.primary }}
            size="lg"
          >
            {landing.freeAnalysis}
          </Button>
        </LinearGradient>

        {/* Footer */}
        <View style={styles.footer}>
          <Logo size="sm" />
          <Text style={dynamicStyles.footerText}>{landing.footerDesc}</Text>
          <Text style={dynamicStyles.footerCopy}>© 2026 DeepSkyn. {landing.allRightsReserved}</Text>
        </View>

        {/* Bottom Auth Buttons */}
        <View style={styles.bottomAuth}>
          <Button onPress={() => navigation.navigate('Signup')} fullWidth size="lg">
            {landing.navGetStarted}
          </Button>
          <Button variant="ghost" onPress={() => navigation.navigate('Login')} fullWidth>
            {auth.haveAccount} {auth.signIn}
          </Button>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray50 },
  splashHeroWrap: {
    width: '100%',
    overflow: 'hidden',
  },
  splashHeroGradient: {
    width: '100%',
    paddingTop: 20,
    paddingBottom: 52,
    borderBottomLeftRadius: 220,
    borderBottomRightRadius: 220,
    alignItems: 'center',
  },
  splashHeroRing: {
    width: 154,
    height: 154,
    borderRadius: 77,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashHeroCircle: {
    width: 136,
    height: 136,
    borderRadius: 68,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  splashBrandMark: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashBrandText: {
    fontSize: 30,
    fontWeight: FontWeights.bold,
    color: Colors.primary,
    letterSpacing: 0.2,
  },
  hero: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing['2xl'] },
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
