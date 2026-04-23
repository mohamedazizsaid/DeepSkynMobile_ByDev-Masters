import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, RefreshControl, TouchableOpacity, ActivityIndicator, Dimensions, Image, Modal, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Badge, ProgressBar, Button, ImagePicker, LoadingOverlay, LoadingSpinner, EmptyState, WeatherWidget, PredictiveRoutineModal, FaceTagsOverlay, createFaceTagsFromAnalysis, ProductRecommendationsModal, PreocupentSelectorModal } from '../../components';
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
import type { AnalysisStackParamList } from '../../navigation/DashboardTabNavigator';
import { useFaceReferenceGate } from '../../lib/hooks/useFaceReferenceGate';

type ScreenMode = 'results' | 'upload';
type AnalysisTimelineItem = {
  id: string;
  date: string;
  score: number;
  status: Analysis['status'];
  skinType?: string | null;
  imageUri?: string;
  concerns: string[];
  summary?: string;
};

export function AnalysisScreen() {
  const { colors, fontSizes } = useAccessibilityStyles();
  const { t } = useTranslation();
  const navigation = useNavigation<StackNavigationProp<AnalysisStackParamList>>();
  const { ensureFaceReference } = useFaceReferenceGate();
  const [mode, setMode] = useState<ScreenMode>('results');
  const [latestAnalysis, setLatestAnalysis] = useState<Analysis | null>(null);
  const [stats, setStats] = useState<AnalysisStats | null>(null);
  const [advice, setAdvice] = useState<string | null>(null);
  const [usage, setUsage] = useState<SubscriptionUsageSummary | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisTimelineItem[]>([]);
  const [selectedTimelineAnalysisId, setSelectedTimelineAnalysisId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ uri: string; base64?: string } | null>(null);

  // Predictive Routine State
  const [generatingRoutine, setGeneratingRoutine] = useState(false);
  const [predictiveRoutine, setPredictiveRoutine] = useState<PredictiveRoutine | null>(null);
  const [showRoutineModal, setShowRoutineModal] = useState(false);

  // Product Recommendations State
  const [showProductsModal, setShowProductsModal] = useState(false);

  // Preocupent Selector State
  const [showPreocupentModal, setShowPreocupentModal] = useState(false);
  const [preocupentLoading, setPreocupentLoading] = useState(false);
  const [compareBeforeId, setCompareBeforeId] = useState<string | null>(null);
  const [compareAfterId, setCompareAfterId] = useState<string | null>(null);
  const [comparePickerTarget, setComparePickerTarget] = useState<'before' | 'after' | null>(null);
  const [compareContainerWidth, setCompareContainerWidth] = useState(0);
  const [compareSliderPercent, setCompareSliderPercent] = useState(0.5);

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
            imageUri: item.images?.[0],
            concerns: [
              ...(item.results?.concerns || []),
              ...(item.conditions || []),
            ].slice(0, 3),
            summary: item.results?.summary,
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

  const redirectToSettings = useCallback(() => {
    const parentNavigation = navigation.getParent() as any;
    parentNavigation?.navigate('Home', { screen: 'Settings' });
  }, [navigation]);

  const startNewAnalysis = async () => {
    const allowed = await ensureFaceReference(redirectToSettings);
    if (!allowed) {
      return;
    }

    setMode('upload');
    setSelectedImage(null);
  };

  const cancelUpload = () => {
    setMode('results');
    setSelectedImage(null);
  };

  const handleStartAnalysisClick = async () => {
    const allowed = await ensureFaceReference(redirectToSettings);
    if (!allowed) {
      return;
    }

    if (!selectedImage?.base64) {
      Alert.alert(t.common.error, t.analysis.uploadPhotos);
      return;
    }
    setShowPreocupentModal(true);
  };

  // Predictive Routine State
  const handleGeneratePredictiveRoutine = async () => {
    if (!latestAnalysis?.results) {
      Alert.alert('Erreur', 'Aucune analyse disponible pour générer une routine.');
      return;
    }

    setGeneratingRoutine(true);
    try {
      const location = await getLocation();
      const analysisResult = {
        condition: latestAnalysis.results.summary || 'Normal',
        detectedIssues: [
          ...(latestAnalysis.results.conditions || []),
          ...(latestAnalysis.results.concerns || []),
          ...(latestAnalysis.conditions || []),
        ],
        skinType: latestAnalysis.results.skinType || 'Normal',
      };

      const routine = await predictiveRoutineService.generate({
        analysisId: latestAnalysis.id,
        analysisResult,
        latitude: location.latitude,
        longitude: location.longitude,
      });

      setPredictiveRoutine(routine);
      setShowRoutineModal(true);
      await predictiveRoutineService.markAsViewed(routine.id);
    } catch (error: any) {
      console.error('Error generating predictive routine:', error);
      const isTimeout =
        error?.code === 'ECONNABORTED' ||
        String(error?.message || '').toLowerCase().includes('timeout');
      Alert.alert(
        'Erreur',
        isTimeout
          ? 'La generation prend plus de temps que prevu. Reessayez dans quelques secondes.'
          : (error?.response?.data?.message || error?.message || 'Impossible de générer la routine prédictive. Veuillez réessayer.'),
        [{ text: 'OK' }]
      );
    } finally {
      setGeneratingRoutine(false);
    }
  };

  const handleAcceptRoutine = async () => {
    if (!predictiveRoutine) return;
    try {
      await predictiveRoutineService.validateAndActivate(predictiveRoutine.id);
      setShowRoutineModal(false);
      setPredictiveRoutine(null);
      Alert.alert('✅ Routine activée !', 'Votre routine personnalisée a été créée. Rendez-vous dans l\'onglet Routine pour la consulter.');
    } catch (error: any) {
      console.error('Error validating routine:', error);
      Alert.alert('Erreur', 'Impossible de valider la routine. Veuillez réessayer.');
    }
  };

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

  const performAnalysis = async (zones: string[]) => {
    const allowed = await ensureFaceReference(redirectToSettings);
    if (!allowed) {
      return;
    }

    const analysisLimitReached = !!usage && !usage.isPremium && usage.quotas.analyses.remaining !== null && usage.quotas.analyses.remaining <= 0;
    if (analysisLimitReached) {
      Alert.alert(t.common.error, `Limite mensuelle atteinte. Réinitialisation: ${formatResetDate(usage?.quotas.analyses.resetsAt)}`);
      return;
    }

    if (!selectedImage?.base64) {
      Alert.alert(t.common.error, t.analysis.uploadPhotos);
      return;
    }

    setPreocupentLoading(true);
    setUploading(true);
    try {
      const result = await analysisService.scan({
        image: selectedImage.base64,
        mimeType: 'image/jpeg',
        saveAnalysis: true,
        saveImage: true,
        preocupent: zones,
      });

      if (result) {
        await loadData();
        setMode('results');
        Alert.alert(t.common.success, t.dashboard.analysisCompleted);
      }
    } catch (error: any) {
      console.error('Analysis error:', error);
      Alert.alert(t.common.error, error?.response?.data?.message || t.common.error);
    } finally {
      setUploading(false);
      setPreocupentLoading(false);
      setShowPreocupentModal(false);
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

  const faceTags: FaceTag[] = useMemo(() => {
    if (!latestAnalysis || !results?.detailedAnalysis) return [];
    
    const tags: FaceTag[] = [];
    const detailedAnalysis = results.detailedAnalysis;
    
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
      if (metric && metric.score < 70) {
        const severity = metric.score < 40 ? 'severe' : metric.score < 55 ? 'moderate' : 'mild';
        const zone = item.zones[index % item.zones.length];
        tags.push({
          id: `tag-${item.key}`,
          condition: item.condition,
          label: item.label,
          severity,
          confidence: Math.max(60, 100 - Math.floor(metric.score / 2)),
          zone,
          description: metric.description,
        });
      }
    });

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

    return tags.slice(0, 6);
  }, [latestAnalysis, results?.detailedAnalysis]);

  const recommendationSource = latestAnalysis?.recommendations || results?.recommendations;
  const lifestyleInsights = recommendationSource?.lifestyle?.slice(0, 3) || [];
  const timelineData = analysisHistory
    .filter((item) => item.status === 'completed')
    .slice(0, 7)
    .reverse();
  const comparisonCandidates = useMemo(
    () => analysisHistory.filter((item) => item.status === 'completed' && !!item.imageUri),
    [analysisHistory]
  );
  const compareBeforeAnalysis = useMemo(
    () => comparisonCandidates.find((item) => item.id === compareBeforeId) || null,
    [comparisonCandidates, compareBeforeId]
  );
  const compareAfterAnalysis = useMemo(
    () => comparisonCandidates.find((item) => item.id === compareAfterId) || null,
    [comparisonCandidates, compareAfterId]
  );
  const selectedTimelineAnalysis = useMemo(() => {
    if (!timelineData.length) return null;
    if (!selectedTimelineAnalysisId) return timelineData[timelineData.length - 1];
    return timelineData.find((item) => item.id === selectedTimelineAnalysisId) || timelineData[timelineData.length - 1];
  }, [timelineData, selectedTimelineAnalysisId]);
  const minorTicks = useMemo(() => Array.from({ length: 42 }, (_, idx) => idx), []);

  useEffect(() => {
    if (!timelineData.length) {
      setSelectedTimelineAnalysisId(null);
      return;
    }
    setSelectedTimelineAnalysisId((prev) => {
      if (prev && timelineData.some((item) => item.id === prev)) return prev;
      return timelineData[timelineData.length - 1].id;
    });
  }, [timelineData]);

  useEffect(() => {
    if (comparisonCandidates.length < 2) {
      setCompareBeforeId(null);
      setCompareAfterId(null);
      return;
    }

    const ordered = [...comparisonCandidates].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const oldest = ordered[0]?.id ?? null;
    const newest = ordered[ordered.length - 1]?.id ?? null;

    setCompareBeforeId((prev) => {
      if (prev && ordered.some((item) => item.id === prev)) return prev;
      return oldest;
    });

    setCompareAfterId((prev) => {
      if (prev && ordered.some((item) => item.id === prev)) return prev;
      return newest;
    });
  }, [comparisonCandidates]);

  const updateCompareSlider = useCallback(
    (locationX: number) => {
      if (!compareContainerWidth) return;
      const minX = compareContainerWidth * 0.06;
      const maxX = compareContainerWidth * 0.94;
      const clamped = Math.min(maxX, Math.max(minX, locationX));
      setCompareSliderPercent(clamped / compareContainerWidth);
    },
    [compareContainerWidth]
  );

  const handleSelectCompareAnalysis = useCallback(
    (analysisId: string) => {
      if (comparePickerTarget === 'before') {
        if (analysisId === compareAfterId && compareBeforeId) {
          setCompareAfterId(compareBeforeId);
        }
        setCompareBeforeId(analysisId);
      }

      if (comparePickerTarget === 'after') {
        if (analysisId === compareBeforeId && compareAfterId) {
          setCompareBeforeId(compareAfterId);
        }
        setCompareAfterId(analysisId);
      }

      setComparePickerTarget(null);
    },
    [comparePickerTarget, compareBeforeId, compareAfterId]
  );

  const comparePickerData = useMemo(
    () => [...comparisonCandidates].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [comparisonCandidates]
  );
  const compareSliderRatio = Math.max(0.06, Math.min(0.94, compareSliderPercent));

  if (loading) {
    return (
      <SafeAreaView style={dynamicStyles.safeArea} edges={['left', 'right']}>
        <View style={dynamicStyles.loadingContainer}>
          <LoadingSpinner message={t.common.loading} />
        </View>
      </SafeAreaView>
    );
  }

  // Choose the content based on mode and analysis state
  let content;
  if (mode === 'upload') {
    content = (
      <ScrollView style={dynamicStyles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.headerIconWrap}>
                <Ionicons name="camera-outline" size={20} color={colors.primary} />
              </View>
              <Text style={dynamicStyles.title}>{t.dashboard.newAnalysis}</Text>
            </View>
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
              onPress={handleStartAnalysisClick}
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
    );
  } else if (!latestAnalysis || (!results && latestAnalysis.status !== 'processing' && latestAnalysis.status !== 'failed')) {
    content = (
      <View style={dynamicStyles.container}>
        <EmptyState
          icon="scan-outline"
          title={t.dashboard.noActivity}
          description={t.dashboard.startAnalysis}
          actionLabel={t.analysis.startAnalysis}
          onAction={startNewAnalysis}
        />
      </View>
    );
  } else {
    // Results mode
    content = (
      <ScrollView 
        style={dynamicStyles.container} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.headerIconWrap}>
              <Ionicons name="scan-outline" size={20} color={colors.primary} />
            </View>
            <Text style={dynamicStyles.title}>{t.nav.analysis}</Text>
          </View>
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
              {analysisLimit !== null && analysisUsed > 0 && (
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

        {results && (
          <>
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

            {/* History Timeline */}
            {timelineData.length > 1 && (
              <View style={styles.section}>
                <View style={styles.timelineHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={dynamicStyles.sectionTitle}>Historique des analyses</Text>
                    <Text style={dynamicStyles.sectionSubtitle}>Timeline photo des 7 dernières analyses complétées</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('AnalysisHistory')}
                    style={[styles.historyButton, { borderColor: colors.border }]}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="time-outline" size={16} color={colors.primary} />
                    <Text style={[styles.historyButtonText, { color: colors.primary }]}>Voir tout</Text>
                  </TouchableOpacity>
                </View>
                <Card style={styles.historyCard}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.timelineScrollContent}
                  >
                    <View style={styles.timelineRailWrap}>
                      <View style={styles.timelineImagesRow}>
                        {timelineData.map((point) => {
                          const isSelected = selectedTimelineAnalysis?.id === point.id;
                          return (
                            <View key={point.id} style={styles.timelineNodeCol}>
                              <TouchableOpacity
                                activeOpacity={0.9}
                                onPress={() => setSelectedTimelineAnalysisId(point.id)}
                              >
                                <View style={[
                                  styles.timelineImageWrap,
                                  {
                                    borderColor: isSelected ? colors.primary : colors.border,
                                    backgroundColor: colors.surface,
                                  },
                                  isSelected && styles.timelineImageWrapActive,
                                ]}>
                                  {point.imageUri ? (
                                    <Image source={{ uri: point.imageUri }} style={styles.timelineImage} />
                                  ) : (
                                    <View style={styles.timelineImageFallback}>
                                      <Ionicons name="person-outline" size={18} color={colors.textSecondary} />
                                    </View>
                                  )}
                                </View>
                              </TouchableOpacity>
                              <View style={[styles.timelineConnector, { backgroundColor: isSelected ? colors.primary : colors.border }]} />
                              <View style={[styles.timelineDot, { backgroundColor: isSelected ? colors.primary : Colors.gray300 }]} />
                            </View>
                          );
                        })}
                      </View>

                      <View style={[styles.timelineAxis, { backgroundColor: colors.border }]}>
                        <View style={styles.timelineTicksRow}>
                          {minorTicks.map((tick) => (
                            <View key={`tick-${tick}`} style={[styles.timelineTick, { backgroundColor: colors.border }]} />
                          ))}
                        </View>
                      </View>

                      <View style={styles.timelineMonthsRow}>
                        {timelineData.map((point) => (
                          <View key={`month-${point.id}`} style={styles.timelineMonthCol}>
                            <Text style={[styles.timelineMonthLabel, { color: colors.textTertiary }]}>
                              {formatMonth(point.date)}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </ScrollView>

                  {selectedTimelineAnalysis && (
                    <View style={[styles.timelineDetailsCard, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}> 
                      <View style={styles.timelineDetailsHeader}>
                        <Text style={dynamicStyles.timelineDate}>{formatDate(selectedTimelineAnalysis.date)}</Text>
                        <Badge
                          text={`Score ${selectedTimelineAnalysis.score}/100`}
                          variant={selectedTimelineAnalysis.score >= 70 ? 'success' : selectedTimelineAnalysis.score >= 50 ? 'warning' : 'error'}
                          size="sm"
                        />
                      </View>
                      <Text style={dynamicStyles.timelineMeta}>
                        Type de peau: {selectedTimelineAnalysis.skinType || 'Non renseigné'}
                      </Text>
                      {!!selectedTimelineAnalysis.concerns.length && (
                        <Text style={dynamicStyles.timelineMeta}>
                          Points observés: {selectedTimelineAnalysis.concerns.join(', ')}
                        </Text>
                      )}
                      {!!selectedTimelineAnalysis.summary && (
                        <Text style={[dynamicStyles.mutedText, { marginTop: Spacing.sm }]} numberOfLines={2}>
                          {selectedTimelineAnalysis.summary}
                        </Text>
                      )}
                      <View style={{ marginTop: Spacing.md }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onPress={() => navigation.navigate('AnalysisResult', { analysisId: selectedTimelineAnalysis.id })}
                        >
                          Voir les détails
                        </Button>
                      </View>
                    </View>
                  )}

                  <View style={{ marginTop: Spacing.md }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onPress={() => navigation.navigate('AnalysisHistory')}
                    >
                      Ouvrir l'historique complet
                    </Button>
                  </View>
                </Card>
              </View>
            )}

            {/* AI Insights */}
            {comparisonCandidates.length >= 2 && (
              <View style={styles.section}>
                <View style={styles.timelineHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={dynamicStyles.sectionTitle}>Comparer deux analyses</Text>
                    <Text style={dynamicStyles.sectionSubtitle}>Choisissez un avant et un après, puis glissez pour voir l’évolution.</Text>
                  </View>
                </View>

                <Card style={styles.compareCard}>
                  <View style={styles.compareSelectorRow}>
                    <TouchableOpacity
                      style={[styles.compareSelector, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}
                      activeOpacity={0.85}
                      onPress={() => setComparePickerTarget('before')}
                    >
                      <Text style={[styles.compareSelectorLabel, { color: colors.textSecondary }]}>Avant</Text>
                      <Text style={[styles.compareSelectorValue, { color: colors.text }]} numberOfLines={1}>
                        {compareBeforeAnalysis ? `${formatDate(compareBeforeAnalysis.date)} • ${compareBeforeAnalysis.score}/100` : 'Choisir une analyse'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.compareSelector, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}
                      activeOpacity={0.85}
                      onPress={() => setComparePickerTarget('after')}
                    >
                      <Text style={[styles.compareSelectorLabel, { color: colors.textSecondary }]}>Après</Text>
                      <Text style={[styles.compareSelectorValue, { color: colors.text }]} numberOfLines={1}>
                        {compareAfterAnalysis ? `${formatDate(compareAfterAnalysis.date)} • ${compareAfterAnalysis.score}/100` : 'Choisir une analyse'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {compareBeforeAnalysis?.imageUri && compareAfterAnalysis?.imageUri ? (
                    <>
                      <View
                        style={styles.compareStage}
                        onLayout={(event) => setCompareContainerWidth(event.nativeEvent.layout.width)}
                        onStartShouldSetResponder={() => true}
                        onMoveShouldSetResponder={() => true}
                        onResponderGrant={(event) => updateCompareSlider(event.nativeEvent.locationX)}
                        onResponderMove={(event) => updateCompareSlider(event.nativeEvent.locationX)}
                      >
                        <Image source={{ uri: compareBeforeAnalysis.imageUri }} style={styles.compareImage} />
                        <View style={[styles.compareAfterLayer, { width: `${compareSliderRatio * 100}%` }]}>
                          <Image
                            source={{ uri: compareAfterAnalysis.imageUri }}
                            style={[
                              styles.compareAfterImage,
                              { width: compareContainerWidth || undefined },
                            ]}
                          />
                        </View>

                        <View style={[styles.compareDivider, { left: `${compareSliderRatio * 100}%` }]}>
                          <View style={styles.compareKnob}>
                            <Ionicons name="swap-horizontal" size={14} color={colors.primary} />
                          </View>
                        </View>

                        <View style={[styles.compareTag, styles.compareTagLeft]}>
                          <Text style={styles.compareTagText}>AVANT</Text>
                        </View>
                        <View style={[styles.compareTag, styles.compareTagRight]}>
                          <Text style={styles.compareTagText}>APRÈS</Text>
                        </View>
                      </View>

                      <View style={styles.compareMetaRow}>
                        <Text style={[styles.compareMetaText, { color: colors.textSecondary }]} numberOfLines={1}>
                          Avant: {formatDate(compareBeforeAnalysis.date)} ({compareBeforeAnalysis.score}/100)
                        </Text>
                        <Text style={[styles.compareMetaText, { color: colors.textSecondary }]} numberOfLines={1}>
                          Après: {formatDate(compareAfterAnalysis.date)} ({compareAfterAnalysis.score}/100)
                        </Text>
                      </View>
                    </>
                  ) : (
                    <Text style={[dynamicStyles.helperText, { marginTop: Spacing.md }]}>Les deux analyses doivent contenir une photo pour activer la comparaison.</Text>
                  )}
                </Card>
              </View>
            )}

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
                </View>
                {recommendationSource.lifestyle && recommendationSource.lifestyle.length > 0 && (
                  <Card style={styles.recommendationCard}>
                    <Text style={dynamicStyles.recommendationTitle}>Habitudes de vie</Text>
                    {recommendationSource.lifestyle.slice(0, 4).map((item, index) => (
                      <Text key={index} style={dynamicStyles.recommendationItem}>• {item}</Text>
                    ))}
                  </Card>
                )}
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

            {/* CTA Buttons */}
            <View style={styles.section}>
              <TouchableOpacity
                onPress={handleGeneratePredictiveRoutine}
                disabled={generatingRoutine}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={[Colors.primary, Colors.primaryDark]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={{ borderRadius: BorderRadius.xl, padding: Spacing.lg, ...Shadows.md }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md }}>
                      {generatingRoutine ? <ActivityIndicator size="small" color={Colors.white} /> : <Ionicons name="sparkles" size={28} color={Colors.white} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: Colors.white, fontSize: fontSizes.lg, fontWeight: FontWeights.bold }}>{generatingRoutine ? 'Génération en cours...' : 'Générer ma routine IA'}</Text>
                      <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: fontSizes.sm, marginTop: 4 }}>Programme personnalisé 7 jours basé sur votre analyse</Text>
                    </View>
                    {!generatingRoutine && <Ionicons name="chevron-forward" size={24} color={Colors.white} />}
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <TouchableOpacity onPress={() => setShowProductsModal(true)} activeOpacity={0.9}>
                <LinearGradient
                  colors={['#EC4899', '#8B5CF6']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={{ borderRadius: BorderRadius.xl, padding: Spacing.lg, ...Shadows.md }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md }}>
                      <Ionicons name="bag-outline" size={28} color={Colors.white} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: Colors.white, fontSize: fontSizes.lg, fontWeight: FontWeights.bold }}>Produits Recommandés IA</Text>
                      <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: fontSizes.sm, marginTop: 4 }}>Découvrez les produits adaptés à votre peau</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color={Colors.white} />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <TouchableOpacity
                onPress={async () => {
                  const allowed = await ensureFaceReference(redirectToSettings);
                  if (!allowed) {
                    return;
                  }
                  navigation.navigate('MultiPhotoCamera');
                }}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#06B6D4', '#0284C7']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={{ borderRadius: BorderRadius.xl, padding: Spacing.lg, ...Shadows.md }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md }}>
                      <Ionicons name="camera-outline" size={28} color={Colors.white} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: Colors.white, fontSize: fontSizes.lg, fontWeight: FontWeights.bold }}>Scan MultiPhoto</Text>
                      <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: fontSizes.sm, marginTop: 4 }}>Capturez 3 photos pour une analyse plus précise</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color={Colors.white} />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Button onPress={startNewAnalysis} fullWidth size="lg">
                {t.dashboard.newAnalysis}
              </Button>
            </View>

            <View style={{ height: 30 }} />
          </>
        )}
      </ScrollView>
    );
  }

  return (
    <SafeAreaView style={dynamicStyles.safeArea} edges={['left', 'right']}>
      <LoadingOverlay visible={uploading && mode === 'results'} message={t.dashboard.analysisInProgress} />
      
      {content}

      <PredictiveRoutineModal
        visible={showRoutineModal}
        routine={predictiveRoutine}
        loading={generatingRoutine}
        onAccept={handleAcceptRoutine}
        onDismiss={handleDismissRoutine}
        onClose={() => setShowRoutineModal(false)}
      />

      <ProductRecommendationsModal
        visible={showProductsModal}
        onClose={() => setShowProductsModal(false)}
        skinType={results?.skinType || 'normale'}
        concerns={results?.concerns || []}
        conditions={latestAnalysis?.conditions || []}
        analysisId={latestAnalysis?.id}
      />

      <PreocupentSelectorModal
        visible={showPreocupentModal}
        onClose={() => setShowPreocupentModal(false)}
        onConfirm={performAnalysis}
        loading={preocupentLoading}
      />

      <Modal
        visible={comparePickerTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setComparePickerTarget(null)}
      >
        <Pressable style={styles.compareModalBackdrop} onPress={() => setComparePickerTarget(null)}>
          <Pressable style={[styles.compareModalSheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
            <View style={styles.compareModalHeader}>
              <Text style={[styles.compareModalTitle, { color: colors.text }]}>Choisir une analyse {comparePickerTarget === 'before' ? 'avant' : 'après'}</Text>
              <TouchableOpacity onPress={() => setComparePickerTarget(null)} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.compareModalList} showsVerticalScrollIndicator={false}>
              {comparePickerData.map((item) => {
                const selected = (comparePickerTarget === 'before' ? compareBeforeId : compareAfterId) === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.85}
                    onPress={() => handleSelectCompareAnalysis(item.id)}
                    style={[
                      styles.compareOption,
                      {
                        borderColor: selected ? colors.primary : colors.border,
                        backgroundColor: selected ? `${colors.primary}12` : colors.backgroundSecondary,
                      },
                    ]}
                  >
                    {item.imageUri ? (
                      <Image source={{ uri: item.imageUri }} style={styles.compareOptionImage} />
                    ) : (
                      <View style={[styles.compareOptionImage, styles.compareOptionFallback]}>
                        <Ionicons name="image-outline" size={16} color={colors.textSecondary} />
                      </View>
                    )}
                    <View style={styles.compareOptionInfo}>
                      <Text style={[styles.compareOptionDate, { color: colors.text }]}>{formatDate(item.date)}</Text>
                      <Text style={[styles.compareOptionMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                        Score: {item.score}/100 {item.skinType ? `• ${item.skinType}` : ''}
                      </Text>
                    </View>
                    {selected && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
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
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerIconWrap: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.base,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryAlpha10,
  },
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
  compareCard: { padding: Spacing.lg },
  compareSelectorRow: { flexDirection: 'row', gap: Spacing.sm },
  compareSelector: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  compareSelectorLabel: { fontSize: 12, fontWeight: FontWeights.medium, marginBottom: 2 },
  compareSelectorValue: { fontSize: 13, fontWeight: FontWeights.semibold },
  compareStage: {
    marginTop: Spacing.md,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    aspectRatio: 0.78,
    backgroundColor: Colors.gray100,
    position: 'relative',
  },
  compareImage: { width: '100%', height: '100%' },
  compareAfterLayer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  compareAfterImage: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    height: '100%',
  },
  compareDivider: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: Colors.white,
    marginLeft: -1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compareKnob: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primaryAlpha10,
  },
  compareTag: {
    position: 'absolute',
    top: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.52)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  compareTagLeft: { left: Spacing.sm },
  compareTagRight: { right: Spacing.sm },
  compareTagText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: FontWeights.bold,
    letterSpacing: 0.4,
  },
  compareMetaRow: {
    marginTop: Spacing.sm,
    gap: 4,
  },
  compareMetaText: { fontSize: 12 },
  timelineHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    marginLeft: Spacing.md,
  },
  historyButtonText: { fontSize: 12, fontWeight: FontWeights.semibold },
  timelineScrollContent: { paddingBottom: Spacing.sm },
  timelineRailWrap: { minWidth: 560 },
  timelineImagesRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  timelineNodeCol: { width: 78, alignItems: 'center' },
  timelineImageWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  timelineImageWrapActive: {
    transform: [{ scale: 1.06 }],
  },
  timelineImage: { width: '100%', height: '100%' },
  timelineImageFallback: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  timelineConnector: { width: 2, height: 28, marginTop: Spacing.xs },
  timelineDot: { width: 9, height: 9, borderRadius: 4.5, marginTop: 2 },
  timelineAxis: { height: 2, marginTop: Spacing.sm, marginBottom: Spacing.xs },
  timelineTicksRow: {
    position: 'absolute',
    top: -6,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timelineTick: { width: 1, height: 8, opacity: 0.7 },
  timelineMonthsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timelineMonthCol: { width: 78, alignItems: 'center' },
  timelineMonthLabel: { fontSize: 12, textTransform: 'capitalize' as const },
  timelineDetailsCard: {
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  timelineDetailsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  timelineCard: { marginTop: Spacing.sm, padding: Spacing.base },
  timelineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timelineLeft: { flex: 1, paddingRight: Spacing.md },
  timelineRight: { alignItems: 'flex-end', gap: Spacing.xs },
  timelineScore: { fontSize: 16, fontWeight: FontWeights.bold, color: Colors.primary },
  recommendationGrid: { gap: Spacing.md },
  recommendationCard: { padding: Spacing.base },
  warningCard: { marginTop: Spacing.md, padding: Spacing.base, borderWidth: 1, borderColor: Colors.errorAlpha10 },
  uploadSection: { paddingHorizontal: Spacing.xl, marginTop: Spacing.xl },
  tipsCard: { paddingHorizontal: Spacing.xl, marginTop: Spacing.xl },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  buttonRow: { flexDirection: 'row', gap: Spacing.md, paddingHorizontal: Spacing.xl, marginTop: Spacing.xl },
  limitInfo: { paddingHorizontal: Spacing.xl, marginTop: Spacing.sm },
  compareModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.55)',
    justifyContent: 'flex-end',
  },
  compareModalSheet: {
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    maxHeight: '72%',
  },
  compareModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  compareModalTitle: { fontSize: 16, fontWeight: FontWeights.bold },
  compareModalList: { marginTop: Spacing.xs },
  compareOption: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  compareOptionImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: Colors.gray100,
  },
  compareOptionFallback: { alignItems: 'center', justifyContent: 'center' },
  compareOptionInfo: { flex: 1 },
  compareOptionDate: { fontSize: 14, fontWeight: FontWeights.semibold },
  compareOptionMeta: { fontSize: 12, marginTop: 2 },
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

function formatMonth(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '...';
  const label = date.toLocaleDateString('fr-FR', { month: 'short' });
  return label.replace('.', '');
}
