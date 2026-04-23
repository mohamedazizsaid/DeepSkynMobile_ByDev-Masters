import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, ActivityIndicator, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, Button } from '../../components';
import { Colors, Gradients, Spacing, BorderRadius, FontWeights } from '../../theme';
import { useAccessibilityStyles } from '../../stores/useAccessibilityStyles';
import { useTranslation } from '../../lib/i18n/useTranslation';
import { subscriptionService } from '../../services/subscription.service';
import { usersService, type User } from '../../services/users.service';
import type {
  CouponValidationResult,
  SubscriptionPaymentHistoryItem,
  SubscriptionUsageSummary,
} from '../../lib/types';

export function SubscriptionScreen() {
  const { t, language } = useTranslation();
  const { colors, fontSizes, textStyle } = useAccessibilityStyles();

  const [profile, setProfile] = useState<User | null>(null);
  const [usageSummary, setUsageSummary] = useState<SubscriptionUsageSummary | null>(null);
  const [payments, setPayments] = useState<SubscriptionPaymentHistoryItem[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [couponValidation, setCouponValidation] = useState<CouponValidationResult | null>(null);
  const [loadingScreen, setLoadingScreen] = useState(true);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [startingCheckout, setStartingCheckout] = useState(false);

  const accessibleText = {
    fontFamily: textStyle.fontFamily,
    letterSpacing: textStyle.letterSpacing,
    lineHeight: textStyle.lineHeight,
  };

  const locale = useMemo(() => {
    if (language === 'ar') return 'ar-TN';
    if (language === 'en') return 'en-US';
    if (language === 'es') return 'es-ES';
    return 'fr-FR';
  }, [language]);

  const currentSubscription = usageSummary?.subscription ?? null;
  const currentPlanCode = currentSubscription?.plan ?? 'free';
  const currentPlanLabel = useMemo(() => {
    if (currentPlanCode === 'premium_yearly') return 'Premium annuel';
    if (currentPlanCode === 'premium') return t.subscriptionScreen.premiumPlan;
    return t.subscriptionScreen.freePlan;
  }, [currentPlanCode, t.subscriptionScreen.freePlan, t.subscriptionScreen.premiumPlan]);

  const profileSettings = (profile?.settings ?? {}) as { isPublic?: boolean; publicProfile?: boolean };
  const isPublicProfile = Boolean(profileSettings.isPublic ?? profileSettings.publicProfile);

  const formatDate = (value: string | null | undefined) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    const code = (currency || 'EUR').toUpperCase();
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: code,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${amount.toFixed(2)} ${code}`;
    }
  };

  const formatStatus = (status?: string | null) => {
    const normalized = String(status || '').toLowerCase();
    if (normalized === 'active') return 'Actif';
    if (normalized === 'pending') return 'En attente';
    if (normalized === 'cancelled') return 'Annulé';
    if (normalized === 'expired') return 'Expiré';
    if (normalized === 'paid') return 'Payée';
    if (normalized === 'open') return 'Ouverte';
    if (normalized === 'draft') return 'Brouillon';
    if (normalized === 'void') return 'Annulée';
    if (normalized === 'uncollectible') return 'Impayée';
    return status || '—';
  };

  const formatQuotaValue = (used: number, limit: number | null, remaining: number | null) => {
    if (limit === null) {
      return t.subscriptionScreen.quotaUnlimited;
    }

    const safeRemaining = remaining == null ? 0 : remaining;
    return `${used}/${limit} • ${safeRemaining} ${t.subscriptionScreen.quotaRemaining.toLowerCase()}`;
  };

  useEffect(() => {
    let isMounted = true;

    const loadScreenData = async () => {
      setLoadingScreen(true);

      const [profileResult, usageResult, paymentsResult] = await Promise.allSettled([
        usersService.getMe(),
        subscriptionService.getUsageSummary(),
        subscriptionService.getPaymentHistory(),
      ]);

      if (!isMounted) {
        return;
      }

      if (profileResult.status === 'fulfilled') {
        setProfile(profileResult.value);
      }

      if (usageResult.status === 'fulfilled') {
        setUsageSummary(usageResult.value);
      }

      if (paymentsResult.status === 'fulfilled') {
        setPayments(paymentsResult.value);
      }

      setLoadingScreen(false);
    };

    void loadScreenData();

    return () => {
      isMounted = false;
    };
  }, []);

  const sortedPayments = useMemo(
    () => [...payments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [payments],
  );

  const usageCards = usageSummary
    ? [
        {
          key: 'analyses',
          title: 'Analyses',
          value: formatQuotaValue(
            usageSummary.quotas.analyses.used,
            usageSummary.quotas.analyses.limit,
            usageSummary.quotas.analyses.remaining,
          ),
          accent: colors.primary,
        },
        {
          key: 'routines',
          title: 'Routines IA',
          value: formatQuotaValue(
            usageSummary.quotas.aiRoutines.used,
            usageSummary.quotas.aiRoutines.limit,
            usageSummary.quotas.aiRoutines.remaining,
          ),
          accent: colors.secondary,
        },
        {
          key: 'messages',
          title: 'Messages IA',
          value: formatQuotaValue(
            usageSummary.quotas.chatMessages.used,
            usageSummary.quotas.chatMessages.limit,
            usageSummary.quotas.chatMessages.remaining,
          ),
          accent: Colors.gold,
        },
      ]
    : [];

  const handleValidateCoupon = async () => {
    const code = couponCode.trim();

    if (!code) {
      Alert.alert(t.subscriptionScreen.couponTitle, t.subscriptionScreen.enterCouponFirst);
      return;
    }

    setValidatingCoupon(true);
    try {
      const result = await subscriptionService.validateCoupon(code, currentPlanCode);
      setCouponValidation(result);
      if (!result.valid) {
        Alert.alert(t.subscriptionScreen.couponTitle, t.subscriptionScreen.invalidCoupon);
      }
    } catch {
      setCouponValidation(null);
      Alert.alert(t.subscriptionScreen.couponTitle, t.subscriptionScreen.invalidCoupon);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleStartCheckout = async () => {
    const code = couponCode.trim();
    let approvedCoupon = couponValidation?.valid ? couponValidation.couponCode : undefined;

    if (code && (!couponValidation || couponValidation.couponCode.toLowerCase() !== code.toLowerCase())) {
      setValidatingCoupon(true);
      try {
        const result = await subscriptionService.validateCoupon(code, currentPlanCode);
        setCouponValidation(result);
        if (!result.valid) {
          Alert.alert(t.subscriptionScreen.couponTitle, t.subscriptionScreen.invalidCoupon);
          return;
        }
        approvedCoupon = result.couponCode;
      } catch {
        Alert.alert(t.subscriptionScreen.couponTitle, t.subscriptionScreen.invalidCoupon);
        return;
      } finally {
        setValidatingCoupon(false);
      }
    }

    setStartingCheckout(true);
    try {
      const checkout = await subscriptionService.createStripeCheckout(currentPlanCode, approvedCoupon);
      if (checkout.url) {
        await Linking.openURL(checkout.url);
        return;
      }
      Alert.alert(t.subscriptionScreen.checkout, t.subscriptionScreen.invoiceLoadError);
    } catch {
      Alert.alert(t.subscriptionScreen.checkout, t.subscriptionScreen.invoiceLoadError);
    } finally {
      setStartingCheckout(false);
    }
  };

  const handleOpenInvoice = async (payment: SubscriptionPaymentHistoryItem) => {
    const existingUrl = payment.invoicePdfUrl || payment.hostedInvoiceUrl;

    try {
      if (existingUrl) {
        await Linking.openURL(existingUrl);
        return;
      }

      const invoice = await subscriptionService.getInvoice(payment.invoiceId);
      const invoiceUrl = invoice.invoicePdfUrl || invoice.hostedInvoiceUrl;
      if (!invoiceUrl) {
        Alert.alert(t.subscriptionScreen.invoice, t.subscriptionScreen.noInvoice);
        return;
      }

      await Linking.openURL(invoiceUrl);
    } catch {
      Alert.alert(t.subscriptionScreen.invoice, t.subscriptionScreen.invoiceLoadError);
    }
  };
  
  const styles = useMemo(() => StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1 },
    content: { paddingBottom: Spacing['2xl'], paddingTop: Spacing.sm },
    header: { paddingHorizontal: Spacing.xl, paddingTop: 0 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    titleIconWrap: {
      width: 34,
      height: 34,
      borderRadius: BorderRadius.base,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Colors.primaryAlpha10,
    },
    title: {
      fontSize: fontSizes['3xl'], fontWeight: FontWeights.bold, color: colors.text, ...accessibleText,
    },
    subtitle: { fontSize: fontSizes.base, color: colors.textSecondary, marginTop: 4, ...accessibleText },
    summaryCard: {
      marginHorizontal: Spacing.xl,
      marginTop: Spacing.base,
      overflow: 'hidden',
      padding: 0,
    },
    summaryGradient: {
      padding: Spacing.xl,
      borderRadius: BorderRadius.lg,
      gap: Spacing.lg,
    },
    summaryTopRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    summaryIcon: {
      width: 52,
      height: 52,
      borderRadius: BorderRadius.base,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.16)',
    },
    summaryCopy: { flex: 1 },
    summaryTitle: { fontSize: fontSizes.lg, fontWeight: FontWeights.bold, color: Colors.white, ...accessibleText },
    summaryText: { fontSize: fontSizes.sm, color: 'rgba(255,255,255,0.88)', marginTop: 2, ...accessibleText },
    summaryPills: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    summaryPill: {
      paddingHorizontal: Spacing.base,
      paddingVertical: 8,
      borderRadius: BorderRadius.full,
      backgroundColor: 'rgba(255,255,255,0.16)',
    },
    summaryPillLabel: { fontSize: fontSizes.xs, color: 'rgba(255,255,255,0.8)', ...accessibleText },
    summaryPillValue: { fontSize: fontSizes.sm, fontWeight: FontWeights.semibold, color: Colors.white, marginTop: 2, ...accessibleText },
    quotaSection: { gap: Spacing.sm },
    quotaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    quotaCard: { flexGrow: 1, flexBasis: '31%', padding: Spacing.base, backgroundColor: colors.surface },
    quotaTitle: { fontSize: fontSizes.xs, color: colors.textSecondary, textTransform: 'uppercase', ...accessibleText },
    quotaValue: { fontSize: fontSizes.sm, fontWeight: FontWeights.semibold, color: colors.text, marginTop: 6, ...accessibleText },
    planCard: { marginHorizontal: Spacing.xl, marginTop: Spacing.base, padding: Spacing.xl, backgroundColor: colors.surface },
    planName: {
      fontSize: fontSizes.xl, fontWeight: FontWeights.bold, color: colors.text, marginBottom: Spacing.sm, ...accessibleText,
    },
    priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: Spacing.xl },
    priceAmount: { fontSize: fontSizes['3xl'], fontWeight: FontWeights.bold, color: colors.text, ...accessibleText },
    pricePeriod: { fontSize: fontSizes.base, color: colors.textSecondary, ...accessibleText },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
    featureText: { fontSize: fontSizes.base, color: colors.text, ...accessibleText },
    featureTextDisabled: { color: colors.textTertiary },
    premiumWrapper: { marginTop: Spacing.xl },
    popularBadge: { alignItems: 'center', marginBottom: -14, zIndex: 1 },
    popularBadgeInner: { paddingHorizontal: Spacing.base, paddingVertical: 4, borderRadius: BorderRadius.full },
    popularBadgeText: { color: Colors.white, fontSize: fontSizes.sm, fontWeight: FontWeights.medium, ...accessibleText },
    premiumPlan: { borderWidth: 2, borderColor: colors.primary },
    section: { paddingHorizontal: Spacing.xl, marginTop: Spacing.xl },
    sectionTitle: {
      fontSize: fontSizes.lg, fontWeight: FontWeights.bold, color: colors.text, marginBottom: Spacing.lg, ...accessibleText,
    },
    benefitsGrid: { flexDirection: 'row', gap: Spacing.md },
    benefitCard: { flex: 1, alignItems: 'center', padding: Spacing.base, backgroundColor: colors.surface },
    benefitIcon: {
      width: 48, height: 48, borderRadius: BorderRadius.base,
      alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm,
    },
    benefitTitle: { fontSize: fontSizes.sm, fontWeight: FontWeights.bold, color: colors.text, ...accessibleText },
    benefitDesc: { fontSize: fontSizes.xs, color: colors.textSecondary, textAlign: 'center', ...accessibleText },
    sectionCard: { marginHorizontal: Spacing.xl, marginTop: Spacing.base, padding: Spacing.xl, backgroundColor: colors.surface },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.base, marginBottom: Spacing.lg },
    sectionIcon: {
      width: 44,
      height: 44,
      borderRadius: BorderRadius.base,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
    },
    sectionTitleWrap: { flex: 1 },
    sectionTitle: {
      fontSize: fontSizes.lg, fontWeight: FontWeights.bold, color: colors.text, ...accessibleText,
    },
    sectionSubtitle: { fontSize: fontSizes.sm, color: colors.textSecondary, marginTop: 2, ...accessibleText },
    infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md },
    infoBlock: { flex: 1 },
    infoLabel: { fontSize: fontSizes.xs, color: colors.textSecondary, textTransform: 'uppercase', ...accessibleText },
    infoValue: { fontSize: fontSizes.base, fontWeight: FontWeights.semibold, color: colors.text, marginTop: 4, ...accessibleText },
    infoHint: { fontSize: fontSizes.xs, color: colors.textSecondary, marginTop: 8, ...accessibleText },
    badge: {
      paddingHorizontal: Spacing.base,
      paddingVertical: 8,
      borderRadius: BorderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 92,
    },
    badgeVisible: { backgroundColor: 'rgba(14, 165, 233, 0.14)' },
    badgePrivate: { backgroundColor: 'rgba(148, 163, 184, 0.18)' },
    badgeText: { fontSize: fontSizes.xs, fontWeight: FontWeights.semibold, ...accessibleText },
    couponInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: BorderRadius.base,
      paddingHorizontal: Spacing.base,
      paddingVertical: 12,
      color: colors.text,
      backgroundColor: colors.background,
      fontSize: fontSizes.base,
      ...accessibleText,
    },
    couponActionRow: { flexDirection: 'column', gap: Spacing.sm, marginTop: Spacing.base },
    couponFeedback: {
      marginTop: Spacing.base,
      padding: Spacing.base,
      borderRadius: BorderRadius.base,
      backgroundColor: colors.background,
    },
    couponFeedbackTitle: { fontSize: fontSizes.base, fontWeight: FontWeights.semibold, color: colors.text, ...accessibleText },
    couponFeedbackText: { fontSize: fontSizes.sm, color: colors.textSecondary, marginTop: 4, ...accessibleText },
    couponEstimateRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.base },
    couponEstimateChip: { flexGrow: 1, flexBasis: '31%', padding: Spacing.base, borderRadius: BorderRadius.base, backgroundColor: colors.background },
    couponEstimateLabel: { fontSize: fontSizes.xs, color: colors.textSecondary, ...accessibleText },
    couponEstimateValue: { fontSize: fontSizes.sm, fontWeight: FontWeights.semibold, color: colors.text, marginTop: 4, ...accessibleText },
    paymentCard: { marginBottom: Spacing.md, padding: Spacing.base, backgroundColor: colors.background },
    paymentHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: Spacing.sm },
    paymentTitle: { fontSize: fontSizes.base, fontWeight: FontWeights.bold, color: colors.text, ...accessibleText },
    paymentMeta: { fontSize: fontSizes.xs, color: colors.textSecondary, marginTop: 4, ...accessibleText },
    paymentStatus: {
      paddingHorizontal: Spacing.base,
      paddingVertical: 6,
      borderRadius: BorderRadius.full,
      backgroundColor: colors.surface,
    },
    paymentStatusText: { fontSize: fontSizes.xs, fontWeight: FontWeights.semibold, color: colors.text, ...accessibleText },
    paymentMetrics: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.base },
    paymentMetric: { flexGrow: 1, flexBasis: '31%', padding: Spacing.base, borderRadius: BorderRadius.base, backgroundColor: colors.surface },
    paymentMetricLabel: { fontSize: fontSizes.xs, color: colors.textSecondary, ...accessibleText },
    paymentMetricValue: { fontSize: fontSizes.sm, fontWeight: FontWeights.semibold, color: colors.text, marginTop: 4, ...accessibleText },
    emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing['2xl'] },
    emptyStateTitle: { fontSize: fontSizes.base, fontWeight: FontWeights.semibold, color: colors.text, marginTop: Spacing.base, ...accessibleText },
    emptyStateText: { fontSize: fontSizes.sm, color: colors.textSecondary, marginTop: 4, textAlign: 'center', ...accessibleText },
    faqCard: { marginBottom: Spacing.md, padding: Spacing.base, backgroundColor: colors.surface },
    faqQuestion: { fontSize: fontSizes.base, fontWeight: FontWeights.bold, color: colors.text, marginBottom: 4, ...accessibleText },
    faqAnswer: { fontSize: fontSizes.sm, color: colors.textSecondary, ...accessibleText },
  }), [accessibleText, colors, fontSizes]);

  const freeFeatures = (Array.isArray(t.subscriptionScreen.freeFeatures) ? t.subscriptionScreen.freeFeatures : []).map((text, index) => ({
    text,
    included: index < 3,
  }));

  const premiumFeatures = (Array.isArray(t.subscriptionScreen.premiumFeatures) ? t.subscriptionScreen.premiumFeatures : []).map((text) => ({
    text,
    included: true,
  }));

  const premiumBenefits = [
    { icon: 'sparkles' as const, title: t.subscriptionScreen.benefits.aiCoach.title, description: t.subscriptionScreen.benefits.aiCoach.desc },
    { icon: 'analytics' as const, title: t.subscriptionScreen.benefits.analytics.title, description: t.subscriptionScreen.benefits.analytics.desc },
    { icon: 'shield-checkmark' as const, title: t.subscriptionScreen.benefits.priority.title, description: t.subscriptionScreen.benefits.priority.desc },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={styles.titleIconWrap}>
              <Ionicons name="card-outline" size={20} color={colors.primary} />
            </View>
            <Text style={styles.title}>{t.subscriptionScreen.title}</Text>
          </View>
          <Text style={styles.subtitle}>{t.subscriptionScreen.subtitle}</Text>
        </View>

        <Card style={styles.summaryCard} variant="elevated">
          <LinearGradient colors={Gradients.primary} style={styles.summaryGradient}>
            <View style={styles.summaryTopRow}>
              <View style={styles.summaryIcon}>
                <Ionicons name="shield-checkmark" size={26} color={Colors.white} />
              </View>
              <View style={styles.summaryCopy}>
                <Text style={styles.summaryTitle}>{t.subscriptionScreen.usageTitle}</Text>
                <Text style={styles.summaryText}>{t.subscriptionScreen.usageSubtitle}</Text>
              </View>
            </View>

            <View style={styles.summaryPills}>
              <View style={styles.summaryPill}>
                <Text style={styles.summaryPillLabel}>{t.subscriptionScreen.currentPlanSummary}</Text>
                <Text style={styles.summaryPillValue}>{currentPlanLabel}</Text>
              </View>
              <View style={styles.summaryPill}>
                <Text style={styles.summaryPillLabel}>{t.subscriptionScreen.autoRenew}</Text>
                <Text style={styles.summaryPillValue}>{currentSubscription?.autoRenew ? 'Oui' : 'Non'}</Text>
              </View>
              <View style={styles.summaryPill}>
                <Text style={styles.summaryPillLabel}>{t.subscriptionScreen.renewalDate}</Text>
                <Text style={styles.summaryPillValue}>{formatDate(currentSubscription?.endDate)}</Text>
              </View>
            </View>

            {usageCards.length > 0 && (
              <View style={styles.quotaSection}>
                <View style={styles.quotaGrid}>
                  {usageCards.map((card) => (
                    <View key={card.key} style={styles.quotaCard}>
                      <Text style={styles.quotaTitle}>{card.title}</Text>
                      <Text style={[styles.quotaValue, { color: card.accent }]}>{card.value}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </LinearGradient>
        </Card>

        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="people-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.sectionTitleWrap}>
              <Text style={styles.sectionTitle}>{t.subscriptionScreen.publicAccountTitle}</Text>
              <Text style={styles.sectionSubtitle}>{t.subscriptionScreen.publicAccountDesc}</Text>
            </View>
            <View style={[styles.badge, isPublicProfile ? styles.badgeVisible : styles.badgePrivate]}>
              <Text style={[styles.badgeText, { color: isPublicProfile ? colors.primary : colors.textSecondary }]}>
                {isPublicProfile ? t.subscriptionScreen.publicAccountVisible : t.subscriptionScreen.publicAccountHidden}
              </Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>{profile?.name || profile?.email || 'Profil'}</Text>
              <Text style={styles.infoValue}>{profile?.email || '—'}</Text>
              <Text style={styles.infoHint}>{t.subscriptionScreen.publicAccountHint}</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="ticket-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.sectionTitleWrap}>
              <Text style={styles.sectionTitle}>{t.subscriptionScreen.couponTitle}</Text>
              <Text style={styles.sectionSubtitle}>{t.subscriptionScreen.subtitle}</Text>
            </View>
          </View>

          <TextInput
            value={couponCode}
            onChangeText={setCouponCode}
            placeholder={t.subscriptionScreen.couponPlaceholder}
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="characters"
            autoCorrect={false}
            style={styles.couponInput}
          />

          <View style={styles.couponActionRow}>
            <Button
              variant="outline"
              onPress={handleValidateCoupon}
              loading={validatingCoupon}
              fullWidth
              style={{ width: '100%' }}
            >
              {t.subscriptionScreen.validateCoupon}
            </Button>
            <Button
              onPress={handleStartCheckout}
              loading={startingCheckout}
              fullWidth
              style={{ width: '100%' }}
            >
              {t.subscriptionScreen.checkout}
            </Button>
          </View>

          {couponValidation && (
            <View style={styles.couponFeedback}>
              <Text style={styles.couponFeedbackTitle}>
                {couponValidation.valid ? t.subscriptionScreen.couponApplied : t.subscriptionScreen.invalidCoupon}
              </Text>
              <Text style={styles.couponFeedbackText}>
                {couponValidation.valid ? t.subscriptionScreen.couponValid : t.subscriptionScreen.invalidCoupon}
              </Text>
              {couponValidation.valid && couponValidation.estimated && (
                <View style={styles.couponEstimateRow}>
                  <View style={styles.couponEstimateChip}>
                    <Text style={styles.couponEstimateLabel}>Avant</Text>
                    <Text style={styles.couponEstimateValue}>{formatAmount(couponValidation.estimated.before, couponValidation.estimated.currency)}</Text>
                  </View>
                  <View style={styles.couponEstimateChip}>
                    <Text style={styles.couponEstimateLabel}>Réduction</Text>
                    <Text style={styles.couponEstimateValue}>{formatAmount(couponValidation.estimated.discount, couponValidation.estimated.currency)}</Text>
                  </View>
                  <View style={styles.couponEstimateChip}>
                    <Text style={styles.couponEstimateLabel}>Après</Text>
                    <Text style={styles.couponEstimateValue}>{formatAmount(couponValidation.estimated.after, couponValidation.estimated.currency)}</Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </Card>

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
                color={feature.included ? colors.primary : colors.textTertiary}
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
              <Text style={[styles.priceAmount, { color: colors.primary }]}>{t.subscriptionScreen.premiumAmount}</Text>
              <Text style={styles.pricePeriod}>{t.subscriptionScreen.premiumPeriod}</Text>
            </View>
            {premiumFeatures.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
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

        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="receipt-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.sectionTitleWrap}>
              <Text style={styles.sectionTitle}>{t.subscriptionScreen.paymentHistoryTitle}</Text>
              <Text style={styles.sectionSubtitle}>{t.subscriptionScreen.paymentHistorySubtitle}</Text>
            </View>
          </View>

          {loadingScreen && sortedPayments.length === 0 ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.emptyStateTitle}>{t.subscriptionScreen.paymentHistoryLoading}</Text>
            </View>
          ) : sortedPayments.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={28} color={colors.textTertiary} />
              <Text style={styles.emptyStateTitle}>{t.subscriptionScreen.paymentHistoryEmptyTitle}</Text>
              <Text style={styles.emptyStateText}>{t.subscriptionScreen.paymentHistoryEmptyDescription}</Text>
            </View>
          ) : (
            <View>
              {sortedPayments.map((payment) => (
                <Card key={payment.invoiceId} style={styles.paymentCard} variant="outlined">
                  <View style={styles.paymentHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.paymentTitle}>
                        {t.subscriptionScreen.invoice} #{payment.invoiceNumber || payment.invoiceId.slice(0, 8)}
                      </Text>
                      <Text style={styles.paymentMeta}>
                        {t.subscriptionScreen.date}: {formatDate(payment.createdAt)}
                      </Text>
                    </View>
                    <View style={styles.paymentStatus}>
                      <Text style={styles.paymentStatusText}>{formatStatus(payment.status)}</Text>
                    </View>
                  </View>

                  <View style={styles.paymentMetrics}>
                    <View style={styles.paymentMetric}>
                      <Text style={styles.paymentMetricLabel}>{t.subscriptionScreen.amountPaid}</Text>
                      <Text style={styles.paymentMetricValue}>{formatAmount(payment.amountPaid, payment.currency)}</Text>
                    </View>
                    <View style={styles.paymentMetric}>
                      <Text style={styles.paymentMetricLabel}>{t.subscriptionScreen.amountDue}</Text>
                      <Text style={styles.paymentMetricValue}>{formatAmount(payment.amountDue, payment.currency)}</Text>
                    </View>
                    <View style={styles.paymentMetric}>
                      <Text style={styles.paymentMetricLabel}>{t.subscriptionScreen.currency}</Text>
                      <Text style={styles.paymentMetricValue}>{payment.currency || 'EUR'}</Text>
                    </View>
                  </View>

                  <Button
                    variant="outline"
                    size="sm"
                    onPress={() => void handleOpenInvoice(payment)}
                    fullWidth
                    style={{ marginTop: Spacing.base }}
                  >
                    {payment.invoicePdfUrl || payment.hostedInvoiceUrl ? t.subscriptionScreen.downloadInvoice : t.subscriptionScreen.invoiceFallback}
                  </Button>
                </Card>
              ))}
            </View>
          )}
        </Card>

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
