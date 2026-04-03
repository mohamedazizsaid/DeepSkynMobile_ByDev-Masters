import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Badge, ProgressBar, Button, ImagePicker, LoadingOverlay, LoadingSpinner, EmptyState } from '../../components';
import { Colors, Gradients, Spacing, BorderRadius, FontSizes, FontWeights } from '../../theme';
import { useAccessibilityStyles } from '../../stores/useAccessibilityStyles';
import { useTranslation } from '../../lib/i18n';
import { analysisService } from '../../services/analysis.service';
import type { Analysis, GeminiAnalysisResult } from '../../lib/types';
import { formatDate } from '../../lib/utils';

type ScreenMode = 'results' | 'upload';

export function AnalysisScreen() {
  const { colors, fontSizes } = useAccessibilityStyles();
  const { t } = useTranslation();
  const [mode, setMode] = useState<ScreenMode>('results');
  const [latestAnalysis, setLatestAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
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
  }), [colors, fontSizes]);

  const loadLatestAnalysis = useCallback(async () => {
    try {
      const analysis = await analysisService.getLatest();
      setLatestAnalysis(analysis);
      setMode('results');
    } catch (error) {
      console.log('No analysis found or error:', error);
      setLatestAnalysis(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadLatestAnalysis();
  }, [loadLatestAnalysis]);

  const onRefresh = () => {
    setRefreshing(true);
    loadLatestAnalysis();
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
        await loadLatestAnalysis();
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

  if (loading) {
    return (
      <SafeAreaView style={dynamicStyles.safeArea} edges={['left', 'right', 'bottom']}>
        <View style={dynamicStyles.loadingContainer}>
          <LoadingSpinner message={t.common.loading} />
        </View>
      </SafeAreaView>
    );
  }

  const results = latestAnalysis?.results;
  const overallScore = latestAnalysis?.healthScore ?? 0;

  const categories = results?.detailedAnalysis ? [
    { label: t.dashboard.hydration, score: results.detailedAnalysis.hydration?.score ?? 0, status: getStatus(results.detailedAnalysis.hydration?.score, t), color: '#06B6D4' },
    { label: t.dashboard.texture, score: results.detailedAnalysis.texture?.score ?? 0, status: getStatus(results.detailedAnalysis.texture?.score, t), color: '#8B5CF6' },
    { label: t.dashboard.wrinkles, score: results.detailedAnalysis.wrinkles?.score ?? 0, status: getStatus(results.detailedAnalysis.wrinkles?.score, t), color: '#F59E0B' },
    { label: t.dashboard.skinMetrics, score: results.detailedAnalysis.elasticity?.score ?? 0, status: getStatus(results.detailedAnalysis.elasticity?.score, t), color: '#10B981' },
    { label: t.dashboard.pigmentation, score: results.detailedAnalysis.pigmentation?.score ?? 0, status: getStatus(results.detailedAnalysis.pigmentation?.score, t), color: '#EC4899' },
    { label: 'Pores', score: results.detailedAnalysis.pores?.score ?? 0, status: getStatus(results.detailedAnalysis.pores?.score, t), color: '#6366F1' },
  ] : [];

  const insights = results?.recommendations?.lifestyle?.slice(0, 3) || [];

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
              disabled={!selectedImage}
              style={{ flex: 1 }}
            >
              {t.analysis.startAnalysis}
            </Button>
          </View>

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
          {results.skinType && (
            <Text style={dynamicStyles.skinType}>Type de peau : {results.skinType}</Text>
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

        {/* AI Insights */}
        {insights.length > 0 && (
          <View style={styles.section}>
            <Text style={dynamicStyles.sectionTitle}>{t.dashboard.personalizedAdvice}</Text>
            <Card style={styles.insightsCard}>
              <LinearGradient colors={Gradients.primary} style={styles.insightsIcon}>
                <Ionicons name="sparkles" size={24} color={Colors.white} />
              </LinearGradient>
              {insights.map((insight, index) => (
                <View key={index} style={styles.insightRow}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                  <Text style={dynamicStyles.insightText}>{insight}</Text>
                </View>
              ))}
            </Card>
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
  scoreCard: {
    marginHorizontal: Spacing.xl, marginTop: Spacing.xl,
    padding: Spacing['2xl'], alignItems: 'center',
  },
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
  // Upload mode styles
  uploadSection: { paddingHorizontal: Spacing.xl, marginTop: Spacing.xl },
  tipsCard: { paddingHorizontal: Spacing.xl, marginTop: Spacing.xl },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  buttonRow: { flexDirection: 'row', gap: Spacing.md, paddingHorizontal: Spacing.xl, marginTop: Spacing.xl },
});
