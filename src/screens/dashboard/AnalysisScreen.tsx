import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Badge, ProgressBar, Button, ImagePicker, LoadingOverlay, LoadingSpinner, EmptyState, WeatherWidget } from '../../components';
import { Colors, Gradients, Spacing, BorderRadius, FontWeights } from '../../theme';
import { useAccessibilityStyles } from '../../stores/useAccessibilityStyles';
import { useTranslation } from '../../lib/i18n';
import { analysisService } from '../../services/analysis.service';
import { subscriptionService } from '../../services/subscription.service';
import type { Analysis, AnalysisStats, SubscriptionUsageSummary } from '../../lib/types';
import { formatDate } from '../../lib/utils';

type ScreenMode = 'results' | 'upload';

export function AnalysisScreen() {
  const { colors, fontSizes } = useAccessibilityStyles();
  const { t } = useTranslation();
  const [mode, setMode] = useState<ScreenMode>('results');
  const [latestAnalysis, setLatestAnalysis] = useState<Analysis | null>(null);
  const [stats, setStats] = useState<AnalysisStats | null>(null);
  const [advice, setAdvice] = useState<string | null>(null);
  const [usage, setUsage] = useState<SubscriptionUsageSummary | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<Array<{ id: string; date: string; score: number; status: Analysis['status']; skinType?: string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ uri: string; base64?: string } | null>(null);

  const dynamicStyles = useMemo(() => ({
    safeArea: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1, backgroundColor: colors.backgroundSecondary },
    loadingContainer: { flex: 1, justifyContent: 'center' as const, alignItems: 'center' as const },
    title: { fontSize: fontSizes['2xl'], fontWeight: FontWeights.bold, color: colors.text },
    subtitle: { fontSize: fontSizes.sm, color: colors.textSecondary, marginTop: Spacing.xs },
    scoreLabel: { fontSize: fontSizes.base, color: colors.textSecondary, marginBottom: Spacing.md },
    scoreNumber: { fontSize: fontSizes['4xl'], fontWeight: FontWeights.bold, color: colors.primary },
    scoreMax: { fontSize: fontSizes.sm, color: colors.textTertiary },
    skinType: { fontSize: fontSizes.sm, color: colors.textSecondary, marginTop: Spacing.md },
    sectionTitle: { fontSize: fontSizes.lg, fontWeight: FontWeights.bold, color: colors.text, marginBottom: Spacing.base },
    categoryLabel: { fontSize: fontSizes.base, fontWeight: FontWeights.medium, color: colors.text },
    categoryScore: { fontSize: fontSizes.base, fontWeight: FontWeights.bold },
    insightText: { fontSize: fontSizes.sm, color: colors.text, flex: 1, lineHeight: 20 },
    tipsTitle: { fontSize: fontSizes.base, fontWeight: FontWeights.semibold, color: colors.text, marginBottom: Spacing.md },
    tipText: { fontSize: fontSizes.sm, color: colors.textSecondary },
    helperText: { fontSize: fontSizes.xs, color: colors.textTertiary, marginTop: Spacing.sm },
    sectionSubtitle: { fontSize: fontSizes.sm, color: colors.textSecondary, marginBottom: Spacing.md },
    mutedText: { fontSize: fontSizes.sm, color: colors.textSecondary },
    insightHeadline: { fontSize: fontSizes.base, color: colors.text, fontWeight: FontWeights.semibold, marginBottom: Spacing.sm },
    timelineDate: { fontSize: fontSizes.base, color: colors.text, fontWeight: FontWeights.medium },
    timelineMeta: { fontSize: fontSizes.xs, color: colors.textTertiary, marginTop: 2 },
    quotaTitle: { fontSize: fontSizes.base, color: colors.text, fontWeight: FontWeights.bold },
    quotaText: { fontSize: fontSizes.sm, color: colors.textSecondary, marginTop: Spacing.xs },
    recommendationTitle: { fontSize: fontSizes.sm, fontWeight: FontWeights.bold, color: colors.text, marginBottom: Spacing.sm },
    recommendationItem: { fontSize: fontSizes.sm, color: colors.textSecondary, marginBottom: 4, lineHeight: 18 },
    warningTitle: { fontSize: fontSizes.sm, fontWeight: FontWeights.bold, color: Colors.error, marginBottom: Spacing.sm },
    warningItem: { fontSize: fontSizes.sm, color: colors.textSecondary, marginBottom: 4, lineHeight: 18 },
  }), [colors, fontSizes]);

  const loadData = useCallback(async () => {
    try {
      const [latestRes, statsRes, historyRes, usageRes] = await Promise.allSettled([
        analysisService.getLatest(),
        analysisService.getStats(),
        analysisService.getAll(1, 10),
        subscriptionService.getUsageSummary(),
      ]);

      if (latestRes.status === 'fulfilled') {
        setLatestAnalysis(latestRes.value);
      } else {
        setLatestAnalysis(null);
      }

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value);
      }

      if (historyRes.status === 'fulfilled' && Array.isArray(historyRes.value.analyses)) {
        const normalized = historyRes.value.analyses
          .slice(0, 10)
          .map((item) => ({
            id: item.id,
            date: item.createdAt,
            score: item.healthScore ?? item.results?.healthScore ?? 0,
            status: item.status,
            skinType: item.results?.skinType,
          }));
        setAnalysisHistory(normalized);
      } else {
        setAnalysisHistory([]);
      }

      if (usageRes.status === 'fulfilled') {
        setUsage(usageRes.value);
      }

      if (latestRes.status === 'fulfilled') {
        setAdviceLoading(true);
        try {
          const adviceText = await analysisService.getAdvice();
          setAdvice(typeof adviceText === 'string' ? adviceText : null);
        } catch {
          setAdvice(null);
        } finally {
          setAdviceLoading(false);
        }
      } else {
        setAdvice(null);
      }
    } catch (error) {
      console.log('No analysis found or error:', error);
      setLatestAnalysis(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleImageSelected = (uri: string, base64?: string) => {
    setSelectedImage({ uri, base64 });
  };

  const startNewAnalysis = () => {
    setMode('upload');
    setSelectedImage(null);
  };

  const cancelUpload = () => {
    setMode('results');
    setSelectedImage(null);
  };

  const performAnalysis = async () => {
    const analysisLimitReached = !!usage && !usage.isPremium && usage.quotas.analyses.remaining !== null && usage.quotas.analyses.remaining <= 0;
    if (analysisLimitReached) {
      Alert.alert(
        t.common.error,
        `Limite mensuelle atteinte. Réinitialisation: ${formatResetDate(usage?.quotas.analyses.resetsAt)}`
      );
      return;
    }

    if (!selectedImage?.base64) {
      Alert.alert(t.common.error, t.analysis.uploadPhotos);
      return;
    }

    setUploading(true);
    try {
      const result = await analysisService.scan({
        image: selectedImage.base64,
        mimeType: 'image/jpeg',
        saveAnalysis: true,
        saveImage: true,
      });

      if (result) {
        await loadData();
        setMode('results');
        Alert.alert(t.common.success, t.dashboard.analysisCompleted);
      }
    } catch (error: any) {
      console.error('Analysis error:', error);
      Alert.alert(
        t.common.error,
        error?.response?.data?.message || t.common.error
      );
    } finally {
      setUploading(false);
      setSelectedImage(null);
    }
  };

  const results = latestAnalysis?.results;
  const overallScore = latestAnalysis?.healthScore ?? 0;
  const previousScore = analysisHistory.length > 1 ? analysisHistory[1].score : null;
  const scoreChange = previousScore === null ? 0 : overallScore - previousScore;
  const analysisLimit = usage?.quotas.analyses.limit ?? null;
  const analysisUsed = usage?.quotas.analyses.used ?? 0;
  const analysisRemaining = usage?.quotas.analyses.remaining ?? null;
  const nearAnalysisLimit = !!usage && !usage.isPremium && analysisRemaining !== null && analysisRemaining > 0 && analysisRemaining <= 1;
  const analysisLimitReached = !!usage && !usage.isPremium && analysisRemaining !== null && analysisRemaining <= 0;

  const categories = results?.detailedAnalysis ? [
    { label: t.dashboard.hydration, score: results.detailedAnalysis.hydration?.score ?? 0, status: getStatus(results.detailedAnalysis.hydration?.score, t), color: '#06B6D4' },
    { label: t.dashboard.texture, score: results.detailedAnalysis.texture?.score ?? 0, status: getStatus(results.detailedAnalysis.texture?.score, t), color: '#8B5CF6' },
    { label: t.dashboard.wrinkles, score: results.detailedAnalysis.wrinkles?.score ?? 0, status: getStatus(results.detailedAnalysis.wrinkles?.score, t), color: '#F59E0B' },
    { label: t.dashboard.skinMetrics, score: results.detailedAnalysis.elasticity?.score ?? 0, status: getStatus(results.detailedAnalysis.elasticity?.score, t), color: '#10B981' },
    { label: t.dashboard.pigmentation, score: results.detailedAnalysis.pigmentation?.score ?? 0, status: getStatus(results.detailedAnalysis.pigmentation?.score, t), color: '#EC4899' },
    { label: 'Pores', score: results.detailedAnalysis.pores?.score ?? 0, status: getStatus(results.detailedAnalysis.pores?.score, t), color: '#6366F1' },
    { label: 'Acné', score: results.detailedAnalysis.acne?.score ?? 0, status: getStatus(results.detailedAnalysis.acne?.score, t), color: '#EF4444' },
    { label: 'Rougeurs', score: results.detailedAnalysis.redness?.score ?? 0, status: getStatus(results.detailedAnalysis.redness?.score, t), color: '#F97316' },
  ] : [];

  const recommendationSource = latestAnalysis?.recommendations || results?.recommendations;
  const lifestyleInsights = recommendationSource?.lifestyle?.slice(0, 3) || [];
  const historyChartData = analysisHistory
    .filter((item) => item.status === 'completed')
    .slice(0, 7)
    .reverse();
  const maxHistoryScore = Math.max(...historyChartData.map((point) => point.score), 100);

  if (loading) {
    return (
      <SafeAreaView style={dynamicStyles.safeArea} edges={['left', 'right', 'bottom']}>
        <View style={dynamicStyles.loadingContainer}>
          <LoadingSpinner message={t.common.loading} />
        </View>
      </SafeAreaView>
    );
  }

  // Upload mode
  if (mode === 'upload') {
    return (
      <SafeAreaView style={dynamicStyles.safeArea} edges={['left', 'right', 'bottom']}>
        <LoadingOverlay visible={uploading} message={t.dashboard.analysisInProgress} />
        <ScrollView style={dynamicStyles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={dynamicStyles.title}>{t.dashboard.newAnalysis}</Text>
            <Text style={dynamicStyles.subtitle}>{t.dashboard.scanFace}</Text>
          </View>

          <View style={styles.uploadSection}>
            <ImagePicker
              onImageSelected={handleImageSelected}
              label={t.dashboard.scanFace}
              showPreview={true}
            />
          </View>

          <View style={styles.tipsCard}>
            <Card>
              <Text style={dynamicStyles.tipsTitle}>💡 {t.dashboard.personalizedAdvice}</Text>
              <View style={styles.tipRow}>
                <Ionicons name="sunny-outline" size={18} color={Colors.amber} />
                <Text style={dynamicStyles.tipText}>Bonne lumière naturelle</Text>
              </View>
              <View style={styles.tipRow}>
                <Ionicons name="water-outline" size={18} color={Colors.teal} />
                <Text style={dynamicStyles.tipText}>Visage propre sans maquillage</Text>
              </View>
              <View style={styles.tipRow}>
                <Ionicons name="phone-portrait-outline" size={18} color={Colors.purple} />
                <Text style={dynamicStyles.tipText}>Tenez l'appareil droit face à vous</Text>
              </View>
            </Card>
          </View>

          <View style={styles.buttonRow}>
            <Button variant="outline" onPress={cancelUpload} style={{ flex: 1 }}>
              {t.common.cancel}
            </Button>
            <Button
              onPress={performAnalysis}
              disabled={!selectedImage || analysisLimitReached}
              style={{ flex: 1 }}
            >
              {t.analysis.startAnalysis}
            </Button>
          </View>

          {analysisLimitReached && (
            <View style={styles.limitInfo}>
              <Text style={dynamicStyles.helperText}>
                Limite mensuelle atteinte. Réinitialisation: {formatResetDate(usage?.quotas.analyses.resetsAt)}
              </Text>
            </View>
          )}

          <View style={{ height: 30 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Results mode (or empty state)
  if (!latestAnalysis || !results) {
    return (
      <SafeAreaView style={dynamicStyles.safeArea} edges={['left', 'right', 'bottom']}>
        <View style={dynamicStyles.container}>
          <EmptyState
            icon="scan-outline"
            title={t.dashboard.noActivity}
            description={t.dashboard.startAnalysis}
            actionLabel={t.analysis.startAnalysis}
            onAction={startNewAnalysis}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={dynamicStyles.safeArea} edges={['left', 'right', 'bottom']}>
      <ScrollView 
        style={dynamicStyles.container} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        <View style={styles.header}>
          <Text style={dynamicStyles.title}>{t.nav.analysis}</Text>
          <Text style={dynamicStyles.subtitle}>
            Dernière analyse : {latestAnalysis.createdAt ? formatDate(latestAnalysis.createdAt) : 'Aujourd\'hui'}
          </Text>
        </View>

        {!usage?.isPremium && analysisLimit !== null && (
          <View style={styles.section}>
            <Card style={styles.quotaCard}>
              <View style={styles.quotaHeader}>
                <Ionicons name="flash-outline" size={18} color={analysisLimitReached ? Colors.error : nearAnalysisLimit ? Colors.warning : colors.primary} />
                <Text style={dynamicStyles.quotaTitle}>
                  {analysisLimitReached ? 'Limite atteinte' : nearAnalysisLimit ? 'Presque à la limite' : 'Quota mensuel'}
                </Text>
              </View>
              <Text style={dynamicStyles.quotaText}>
                {analysisLimitReached
                  ? `Prochaine réinitialisation: ${formatResetDate(usage?.quotas.analyses.resetsAt)}`
                  : `Analyses utilisées: ${analysisUsed}/${analysisLimit}`}
              </Text>
              {analysisLimit !== null && analysisLimit > 0 && (
                <View style={styles.quotaProgressWrap}>
                  <ProgressBar progress={Math.round((analysisUsed / analysisLimit) * 100)} color={analysisLimitReached ? Colors.error : Colors.primary} height={8} />
                </View>
              )}
            </Card>
          </View>
        )}

        <View style={styles.section}>
          <Text style={dynamicStyles.sectionTitle}>Météo et environnement</Text>
          <WeatherWidget showAdvice />
        </View>

        {(latestAnalysis.status === 'processing' || latestAnalysis.status === 'failed') && (
          <View style={styles.section}>
            <Card>
              <View style={styles.statusRow}>
                <Ionicons
                  name={latestAnalysis.status === 'processing' ? 'sync-outline' : 'alert-circle-outline'}
                  size={20}
                  color={latestAnalysis.status === 'processing' ? colors.primary : Colors.error}
                />
                <View style={styles.statusContent}>
                  <Text style={dynamicStyles.insightHeadline}>
                    {latestAnalysis.status === 'processing' ? 'Analyse en cours' : 'Analyse échouée'}
                  </Text>
                  <Text style={dynamicStyles.mutedText}>
                    {latestAnalysis.status === 'processing'
                      ? 'Votre analyse est en cours de traitement. Tirez vers le bas pour actualiser.'
                      : 'L\'analyse a échoué. Vous pouvez relancer une nouvelle analyse.'}
                  </Text>
                </View>
                {latestAnalysis.status === 'failed' && (
                  <Button onPress={startNewAnalysis} size="sm">
                    Réessayer
                  </Button>
                )}
              </View>
            </Card>
          </View>
        )}

        {/* Overall Score */}
        <Card variant="elevated" style={styles.scoreCard}>
          <Text style={dynamicStyles.scoreLabel}>{t.dashboard.globalScore}</Text>
          <View style={[styles.scoreCircle, { borderColor: colors.primary }]}>
            <Text style={dynamicStyles.scoreNumber}>{overallScore}</Text>
            <Text style={dynamicStyles.scoreMax}>/100</Text>
          </View>
          <Badge 
            text={getOverallStatus(overallScore, t)} 
            variant={overallScore >= 70 ? 'success' : overallScore >= 50 ? 'warning' : 'error'} 
            size="md" 
          />
          <View style={styles.scoreMetaRow}>
            <Badge text={`Analyses: ${stats?.totalAnalyses ?? analysisHistory.length}`} variant="neutral" size="sm" />
            {previousScore !== null && (
              <Badge
                text={`${scoreChange >= 0 ? '+' : ''}${scoreChange} pts`}
                variant={scoreChange >= 0 ? 'success' : 'error'}
                size="sm"
              />
            )}
          </View>
          {results.skinType && (
            <Text style={dynamicStyles.skinType}>Type de peau : {results.skinType}</Text>
          )}
          {latestAnalysis.skinAge && (
            <Text style={dynamicStyles.skinType}>Âge estimé de la peau : {latestAnalysis.skinAge} ans</Text>
          )}
        </Card>

        {/* Detailed Breakdown */}
        {categories.length > 0 && (
          <View style={styles.section}>
            <Text style={dynamicStyles.sectionTitle}>{t.dashboard.seeDetails}</Text>
            {categories.map((cat, index) => (
              <Card key={index} style={styles.categoryCard}>
                <View style={styles.categoryHeader}>
                  <View style={styles.categoryLeft}>
                    <View style={[styles.categoryDot, { backgroundColor: cat.color }]} />
                    <Text style={dynamicStyles.categoryLabel}>{cat.label}</Text>
                  </View>
                  <View style={styles.categoryRight}>
                    <Text style={[dynamicStyles.categoryScore, { color: cat.color }]}>{cat.score}%</Text>
                    <Badge text={cat.status} variant={cat.score >= 80 ? 'success' : cat.score >= 60 ? 'warning' : 'error'} />
                  </View>
                </View>
                <ProgressBar progress={cat.score} color={cat.color} height={6} />
              </Card>
            ))}
          </View>
        )}

        {/* Analysis History */}
        {historyChartData.length > 1 && (
          <View style={styles.section}>
            <Text style={dynamicStyles.sectionTitle}>Historique des analyses</Text>
            <Text style={dynamicStyles.sectionSubtitle}>Évolution des 7 dernières analyses complétées</Text>
            <Card style={styles.historyCard}>
              <View style={styles.barChart}>
                {historyChartData.map((point) => (
                  <View key={point.id} style={styles.barColumn}>
                    <View style={styles.barWrapper}>
                      <LinearGradient
                        colors={Gradients.primary}
                        style={[styles.bar, { height: `${Math.max(8, (point.score / maxHistoryScore) * 100)}%` }]}
                      />
                    </View>
                    <Text style={styles.barValue}>{Math.round(point.score)}</Text>
                  </View>
                ))}
              </View>
            </Card>

            {analysisHistory.slice(0, 5).map((item, index) => {
              const prev = analysisHistory[index + 1];
              const change = prev ? item.score - prev.score : 0;
              return (
                <Card key={item.id} style={styles.timelineCard}>
                  <View style={styles.timelineRow}>
                    <View style={styles.timelineLeft}>
                      <Text style={dynamicStyles.timelineDate}>{formatDate(item.date)}</Text>
                      <Text style={dynamicStyles.timelineMeta}>{item.skinType || 'Type non disponible'}</Text>
                    </View>
                    <View style={styles.timelineRight}>
                      <Text style={styles.timelineScore}>{item.score}%</Text>
                      {prev && (
                        <Badge text={`${change >= 0 ? '+' : ''}${change}`} variant={change >= 0 ? 'success' : 'error'} size="sm" />
                      )}
                    </View>
                  </View>
                </Card>
              );
            })}
          </View>
        )}

        {/* AI Insights */}
        {(lifestyleInsights.length > 0 || adviceLoading || advice || results?.summary) && (
          <View style={styles.section}>
            <Text style={dynamicStyles.sectionTitle}>{t.dashboard.personalizedAdvice}</Text>
            <Card style={styles.insightsCard}>
              <LinearGradient colors={Gradients.primary} style={styles.insightsIcon}>
                <Ionicons name="sparkles" size={24} color={Colors.white} />
              </LinearGradient>
              {adviceLoading ? (
                <Text style={dynamicStyles.insightText}>Génération des conseils IA...</Text>
              ) : advice ? (
                <Text style={dynamicStyles.insightText}>{advice}</Text>
              ) : results?.summary ? (
                <Text style={dynamicStyles.insightText}>{results.summary}</Text>
              ) : null}

              {lifestyleInsights.map((insight, index) => (
                <View key={index} style={styles.insightRow}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                  <Text style={dynamicStyles.insightText}>{insight}</Text>
                </View>
              ))}
            </Card>
          </View>
        )}

        {/* Recommendations */}
        {recommendationSource && (
          <View style={styles.section}>
            <Text style={dynamicStyles.sectionTitle}>Recommandations personnalisées</Text>
            <View style={styles.recommendationGrid}>
              <Card style={styles.recommendationCard}>
                <Text style={dynamicStyles.recommendationTitle}>Produits</Text>
                {recommendationSource.products?.slice(0, 4).map((item, index) => (
                  <Text key={index} style={dynamicStyles.recommendationItem}>• {item}</Text>
                ))}
              </Card>

              <Card style={styles.recommendationCard}>
                <Text style={dynamicStyles.recommendationTitle}>Ingrédients</Text>
                {recommendationSource.ingredients?.slice(0, 4).map((item, index) => (
                  <Text key={index} style={dynamicStyles.recommendationItem}>• {item}</Text>
                ))}
              </Card>

              <Card style={styles.recommendationCard}>
                <Text style={dynamicStyles.recommendationTitle}>Habitudes de vie</Text>
                {recommendationSource.lifestyle?.slice(0, 4).map((item, index) => (
                  <Text key={index} style={dynamicStyles.recommendationItem}>• {item}</Text>
                ))}
              </Card>
            </View>

            {!!recommendationSource.warnings?.length && (
              <Card style={styles.warningCard}>
                <Text style={dynamicStyles.warningTitle}>Points de vigilance</Text>
                {recommendationSource.warnings.slice(0, 4).map((warning, index) => (
                  <Text key={index} style={dynamicStyles.warningItem}>• {warning}</Text>
                ))}
              </Card>
            )}
          </View>
        )}

        {/* Conditions detected */}
        {latestAnalysis.conditions && latestAnalysis.conditions.length > 0 && (
          <View style={styles.section}>
            <Text style={dynamicStyles.sectionTitle}>{t.dashboard.detectedConditions}</Text>
            <Card>
              <View style={styles.conditionsRow}>
                {latestAnalysis.conditions.map((condition, index) => (
                  <Badge key={index} text={condition} variant="warning" />
                ))}
              </View>
            </Card>
          </View>
        )}

        {/* New Analysis Button */}
        <View style={styles.section}>
          <Button onPress={startNewAnalysis} fullWidth size="lg">
            {t.dashboard.newAnalysis}
          </Button>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function getStatus(score?: number, t?: any): string {
  if (!score) return 'N/A';
  const s = t?.dashboard?.scoreLevel;
  if (score >= 80) return s?.excellent ?? 'Excellent';
  if (score >= 60) return s?.good ?? 'Bon';
  if (score >= 40) return s?.average ?? 'Moyen';
  return s?.needsImprovement ?? 'À améliorer';
}

function getOverallStatus(score: number, t?: any): string {
  const s = t?.dashboard?.scoreLevel;
  if (score >= 80) return s?.excellent ?? 'Excellent';
  if (score >= 70) return s?.good ?? 'Bon';
  if (score >= 50) return s?.average ?? 'Moyen';
  return s?.needsImprovement ?? 'Attention';
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },
  quotaCard: { padding: Spacing.lg },
  quotaHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  quotaProgressWrap: { marginTop: Spacing.md },
  statusRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  statusContent: { flex: 1 },
  scoreCard: {
    marginHorizontal: Spacing.xl, marginTop: Spacing.xl,
    padding: Spacing['2xl'], alignItems: 'center',
  },
  scoreMetaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.md },
  scoreCircle: {
    width: 130, height: 130, borderRadius: 65,
    borderWidth: 6,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
  },
  section: { paddingHorizontal: Spacing.xl, marginTop: Spacing['2xl'] },
  categoryCard: { marginBottom: Spacing.md, padding: Spacing.base },
  categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  categoryLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  categoryDot: { width: 10, height: 10, borderRadius: 5 },
  categoryRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  insightsCard: { padding: Spacing.xl },
  insightsIcon: {
    width: 48, height: 48, borderRadius: BorderRadius.base,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl,
  },
  insightRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.md },
  conditionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, padding: Spacing.md },
  historyCard: { padding: Spacing.xl },
  barChart: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 140 },
  barColumn: { alignItems: 'center', flex: 1 },
  barWrapper: { width: 20, height: 110, justifyContent: 'flex-end' },
  bar: { width: 20, borderRadius: BorderRadius.sm, minHeight: 8 },
  barValue: { marginTop: Spacing.xs, fontSize: 11, color: Colors.gray500 },
  timelineCard: { marginTop: Spacing.sm, padding: Spacing.base },
  timelineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timelineLeft: { flex: 1, paddingRight: Spacing.md },
  timelineRight: { alignItems: 'flex-end', gap: Spacing.xs },
  timelineScore: { fontSize: 16, fontWeight: FontWeights.bold, color: Colors.primary },
  recommendationGrid: { gap: Spacing.md },
  recommendationCard: { padding: Spacing.base },
  warningCard: { marginTop: Spacing.md, padding: Spacing.base, borderWidth: 1, borderColor: Colors.errorAlpha10 },
  // Upload mode styles
  uploadSection: { paddingHorizontal: Spacing.xl, marginTop: Spacing.xl },
  tipsCard: { paddingHorizontal: Spacing.xl, marginTop: Spacing.xl },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  buttonRow: { flexDirection: 'row', gap: Spacing.md, paddingHorizontal: Spacing.xl, marginTop: Spacing.xl },
  limitInfo: { paddingHorizontal: Spacing.xl, marginTop: Spacing.sm },
});

function formatResetDate(value?: string | null): string {
  if (!value) return 'bientôt';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
