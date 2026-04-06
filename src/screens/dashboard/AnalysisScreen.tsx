import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, RefreshControl, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Badge, ProgressBar, Button, ImagePicker, LoadingOverlay, LoadingSpinner, EmptyState, WeatherWidget, PredictiveRoutineModal, FaceTagsOverlay, createFaceTagsFromAnalysis } from '../../components';
import type { FaceTag } from '../../components';
import { Colors, Gradients, Spacing, BorderRadius, FontWeights, Shadows } from '../../theme';
import { useAccessibilityStyles } from '../../stores/useAccessibilityStyles';
import { useTranslation } from '../../lib/i18n';
import { analysisService } from '../../services/analysis.service';
import { subscriptionService } from '../../services/subscription.service';
import { predictiveRoutineService } from '../../services/predictive-routine.service';
import { getLocation } from '../../services/weather.service';
import type { Analysis, AnalysisStats, SubscriptionUsageSummary, PredictiveRoutine } from '../../lib/types';
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

  // Predictive Routine State
  const [generatingRoutine, setGeneratingRoutine] = useState(false);
  const [predictiveRoutine, setPredictiveRoutine] = useState<PredictiveRoutine | null>(null);
  const [showRoutineModal, setShowRoutineModal] = useState(false);

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

  // Generate Predictive Routine
  const handleGeneratePredictiveRoutine = async () => {
    if (!latestAnalysis?.results) {
      Alert.alert('Erreur', 'Aucune analyse disponible pour générer une routine.');
      return;
    }

    setGeneratingRoutine(true);
    try {
      // Get user location
      const location = await getLocation();
      
      // Build analysis result for API
      const analysisResult = {
        condition: latestAnalysis.results.summary || 'Normal',
        detectedIssues: [
          ...(latestAnalysis.results.conditions || []),
          ...(latestAnalysis.results.concerns || []),
          ...(latestAnalysis.conditions || []),
        ],
        skinType: latestAnalysis.results.skinType || 'Normal',
      };

      // Generate predictive routine
      const routine = await predictiveRoutineService.generate({
        analysisId: latestAnalysis.id,
        analysisResult,
        latitude: location.latitude,
        longitude: location.longitude,
      });

      setPredictiveRoutine(routine);
      setShowRoutineModal(true);

      // Mark as viewed
      await predictiveRoutineService.markAsViewed(routine.id);
    } catch (error: any) {
      console.error('Error generating predictive routine:', error);
      Alert.alert(
        'Erreur',
        error.message || 'Impossible de générer la routine prédictive. Veuillez réessayer.',
        [{ text: 'OK' }]
      );
    } finally {
      setGeneratingRoutine(false);
    }
  };

  // Accept and validate routine
  const handleAcceptRoutine = async () => {
    if (!predictiveRoutine) return;

    try {
      await predictiveRoutineService.validateAndActivate(predictiveRoutine.id);
      
      setShowRoutineModal(false);
      setPredictiveRoutine(null);
      
      Alert.alert(
        '✅ Routine activée !',
        'Votre routine personnalisée a été créée. Rendez-vous dans l\'onglet Routine pour la consulter.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Error validating routine:', error);
      Alert.alert('Erreur', 'Impossible de valider la routine. Veuillez réessayer.');
    }
  };

  // Dismiss routine
  const handleDismissRoutine = async () => {
    if (!predictiveRoutine) return;

    try {
      await predictiveRoutineService.dismiss(predictiveRoutine.id);
      setShowRoutineModal(false);
      setPredictiveRoutine(null);
    } catch (error) {
      console.error('Error dismissing routine:', error);
    }
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

  // Generate face tags from analysis results for overlay display
  const faceTags: FaceTag[] = useMemo(() => {
    if (!latestAnalysis || !results?.detailedAnalysis) return [];
    
    const tags: FaceTag[] = [];
    const detailedAnalysis = results.detailedAnalysis;
    
    // Map detailed analysis scores to face tags with zones
    const analysisToTagMap: Array<{
      key: keyof typeof detailedAnalysis;
      label: string;
      condition: string;
      zones: string[];
    }> = [
      { key: 'acne', label: 'Acné', condition: 'acne', zones: ['forehead', 'left_cheek', 'right_cheek', 'chin'] },
      { key: 'wrinkles', label: 'Rides', condition: 'wrinkles', zones: ['forehead', 'left_eye', 'right_eye'] },
      { key: 'pigmentation', label: 'Pigmentation', condition: 'hyperpigmentation', zones: ['left_cheek', 'right_cheek'] },
      { key: 'redness', label: 'Rougeurs', condition: 'redness', zones: ['nose', 'left_cheek', 'right_cheek'] },
      { key: 'pores', label: 'Pores', condition: 'pores', zones: ['nose', 'left_cheek', 'right_cheek'] },
      { key: 'hydration', label: 'Déshydratation', condition: 'dehydration', zones: ['left_cheek', 'right_cheek'] },
      { key: 'texture', label: 'Texture', condition: 'texture', zones: ['left_cheek', 'right_cheek'] },
    ];

    analysisToTagMap.forEach((item, index) => {
      const metric = detailedAnalysis[item.key];
      if (metric && metric.score < 70) { // Only show conditions needing attention
        const severity = metric.score < 40 ? 'severe' : metric.score < 55 ? 'moderate' : 'mild';
        // Pick zone based on index to spread markers
        const zone = item.zones[index % item.zones.length];
        
        tags.push({
          id: `tag-${item.key}`,
          condition: item.condition,
          label: item.label,
          severity,
          confidence: Math.max(60, 100 - Math.floor(metric.score / 2)), // Higher confidence for lower scores
          zone,
          description: metric.description,
        });
      }
    });

    // Also add conditions from the conditions array if available
    latestAnalysis.conditions?.forEach((condition, idx) => {
      const conditionKey = condition.toLowerCase().replace(/\s+/g, '_');
      const existingTag = tags.find(t => t.condition === conditionKey);
      if (!existingTag) {
        tags.push({
          id: `condition-${idx}`,
          condition: conditionKey,
          label: condition,
          severity: 'moderate',
          confidence: 75,
          zone: ['forehead', 'left_cheek', 'right_cheek', 'nose', 'chin'][idx % 5],
        });
      }
    });

    return tags.slice(0, 6); // Limit to 6 tags maximum for cleaner display
  }, [latestAnalysis, results?.detailedAnalysis]);

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

        {/* Face Analysis Image with Tags */}
        {latestAnalysis.images && latestAnalysis.images.length > 0 && faceTags.length > 0 && (
          <View style={styles.section}>
            <Text style={dynamicStyles.sectionTitle}>Zones analysées</Text>
            <FaceTagsOverlay
              imageUri={latestAnalysis.images[0]}
              tags={faceTags}
              imageWidth={Dimensions.get('window').width - Spacing.lg * 2}
              imageHeight={(Dimensions.get('window').width - Spacing.lg * 2) * 1.2}
              showConnectors={true}
              animateOnMount={true}
            />
          </View>
        )}

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

        {/* 🆕 Predictive Routine CTA */}
        <View style={styles.section}>
          <TouchableOpacity
            onPress={handleGeneratePredictiveRoutine}
            disabled={generatingRoutine}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: BorderRadius.xl,
                padding: Spacing.lg,
                ...Shadows.md,
              }}
            >
              <View style={{ flexDirection: 'row' as const, alignItems: 'center' as const }}>
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    justifyContent: 'center' as const,
                    alignItems: 'center' as const,
                    marginRight: Spacing.md,
                  }}
                >
                  {generatingRoutine ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <Ionicons name="sparkles" size={28} color={Colors.white} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: Colors.white,
                      fontSize: fontSizes.lg,
                      fontWeight: FontWeights.bold,
                    }}
                  >
                    {generatingRoutine ? 'Génération en cours...' : 'Générer ma routine IA'}
                  </Text>
                  <Text
                    style={{
                      color: 'rgba(255,255,255,0.85)',
                      fontSize: fontSizes.sm,
                      marginTop: 4,
                    }}
                  >
                    Programme personnalisé 7 jours basé sur votre analyse
                  </Text>
                </View>
                {!generatingRoutine && (
                  <Ionicons name="chevron-forward" size={24} color={Colors.white} />
                )}
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* New Analysis Button */}
        <View style={styles.section}>
          <Button onPress={startNewAnalysis} fullWidth size="lg">
            {t.dashboard.newAnalysis}
          </Button>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* 🆕 Predictive Routine Modal */}
      <PredictiveRoutineModal
        visible={showRoutineModal}
        routine={predictiveRoutine}
        loading={generatingRoutine}
        onAccept={handleAcceptRoutine}
        onDismiss={handleDismissRoutine}
        onClose={() => setShowRoutineModal(false)}
      />
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
