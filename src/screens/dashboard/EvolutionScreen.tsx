import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Badge, EmptyState } from '../../components';
import { Colors, Gradients, Spacing, BorderRadius, FontSizes, FontWeights } from '../../theme';
import { useAccessibilityStyles } from '../../stores/useAccessibilityStyles';
import { analysisService } from '../../services/analysis.service';
import type { Analysis, AnalysisStats } from '../../lib/types';
import { formatDate } from '../../lib/utils/formatters';
import { useTranslation } from '../../lib/i18n/useTranslation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function EvolutionScreen() {
  const { colors, fontSizes } = useAccessibilityStyles();
  const { t } = useTranslation();
  const [selectedPeriod, setSelectedPeriod] = useState('1M');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<AnalysisStats | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<Analysis[]>([]);
  
  const periods = ['1W', '1M', '3M', '6M', '1Y'];

  const dynamicStyles = useMemo(() => ({
    safeArea: { flex: 1, backgroundColor: colors.backgroundSecondary },
    container: { flex: 1, backgroundColor: colors.backgroundSecondary },
    loadingText: { marginTop: Spacing.md, color: colors.textSecondary },
    title: { fontSize: fontSizes['2xl'], fontWeight: FontWeights.bold, color: colors.text },
    subtitle: { fontSize: fontSizes.sm, color: colors.textSecondary, marginTop: Spacing.xs },
    periodText: { fontSize: fontSizes.sm, fontWeight: FontWeights.medium, color: colors.textSecondary },
    periodTextActive: { color: Colors.white },
    summaryLabel: { fontSize: fontSizes.xs, color: colors.textSecondary },
    summaryValue: { fontSize: fontSizes.xl, fontWeight: FontWeights.bold },
    chartTitle: { fontSize: fontSizes.base, fontWeight: FontWeights.bold, color: colors.text, marginBottom: Spacing.xl },
    chartPlaceholderText: { fontSize: fontSizes.sm, color: colors.textTertiary, marginTop: Spacing.sm },
    sectionTitle: { fontSize: fontSizes.lg, fontWeight: FontWeights.bold, color: colors.text, marginBottom: Spacing.base },
    timelineDate: { fontSize: fontSizes.base, fontWeight: FontWeights.medium, color: colors.text },
    timelineScore: { fontSize: fontSizes.sm, color: colors.textSecondary, marginTop: 2 },
    timelineMeta: { fontSize: fontSizes.xs, color: colors.textTertiary, marginTop: 2 },
    periodPill: {
      paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.full, backgroundColor: colors.surface,
      borderWidth: 1, borderColor: colors.border,
    },
    periodPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    barLabel: { fontSize: fontSizes.xs, color: colors.textSecondary, marginTop: Spacing.xs, fontWeight: FontWeights.semibold },
    legendText: { fontSize: fontSizes.xs, color: colors.textTertiary },
  }), [colors, fontSizes]);

  const loadData = useCallback(async () => {
    try {
      const [statsData, historyData] = await Promise.all([
        analysisService.getStats(),
        analysisService.getAll(1, 20),
      ]);
      setStats(statsData);
      setAnalysisHistory(historyData.analyses || []);
    } catch (error) {
      console.error('Error loading evolution data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const getScoreChange = (analyses: Analysis[]): number => {
    if (analyses.length < 2) return 0;
    const latest = analyses[0]?.healthScore || analyses[0]?.results?.healthScore || 0;
    const previous = analyses[analyses.length - 1]?.healthScore || analyses[analyses.length - 1]?.results?.healthScore || 0;
    return latest - previous;
  };

  const getHealthScore = (analysis: Analysis): number => {
    return analysis.healthScore || analysis.results?.healthScore || 0;
  };

  const summaryCards = [
    { 
      label: t.dashboard.globalScore, 
      value: stats?.averageHealthScore ? `${Math.round(stats.averageHealthScore)}%` : '--', 
      trend: getScoreChange(analysisHistory) >= 0 ? 'up' : 'down',
      color: Colors.primary 
    },
    { 
      label: t.dashboard.analyses, 
      value: stats?.totalAnalyses?.toString() || '0', 
      trend: 'up',
      color: '#06B6D4' 
    },
    { 
      label: t.evolution.overallScore, 
      value: analysisHistory[0] 
        ? `${getHealthScore(analysisHistory[0])}%` 
        : '--', 
      trend: 'up',
      color: '#8B5CF6' 
    },
    { 
      label: t.evolution.progress, 
      value: getScoreChange(analysisHistory) >= 0 
        ? `+${getScoreChange(analysisHistory)}%` 
        : `${getScoreChange(analysisHistory)}%`, 
      trend: getScoreChange(analysisHistory) >= 0 ? 'up' : 'down',
      color: '#F59E0B' 
    },
  ];

  // Create chart data from analysis history
  const chartData = analysisHistory
    .slice(0, 7)
    .reverse()
    .map((analysis) => ({
      score: getHealthScore(analysis),
      date: formatDate(analysis.createdAt),
    }));

  const maxScore = Math.max(...chartData.map(d => d.score), 100);

  if (loading) {
    return (
      <SafeAreaView style={[dynamicStyles.container, { justifyContent: 'center', alignItems: 'center' }]} edges={['left', 'right', 'bottom']}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={dynamicStyles.loadingText}>{t.common.loading}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={dynamicStyles.safeArea} edges={['left', 'right', 'bottom']}>
      <ScrollView 
        style={dynamicStyles.container} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.header}>
          <Text style={dynamicStyles.title}>{t.evolution.title}</Text>
          <Text style={dynamicStyles.subtitle}>{t.evolution.subtitle}</Text>
        </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {periods.map((period) => (
          <TouchableOpacity
            key={period}
            style={[dynamicStyles.periodPill, selectedPeriod === period ? dynamicStyles.periodPillActive : undefined]}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text style={[dynamicStyles.periodText, selectedPeriod === period ? dynamicStyles.periodTextActive : undefined]}>
              {period}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary Cards */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.summaryScroll}>
        {summaryCards.map((card, index) => (
          <Card key={index} style={styles.summaryCard}>
            <Text style={dynamicStyles.summaryLabel}>{card.label}</Text>
            <View style={styles.summaryRow}>
              <Text style={[dynamicStyles.summaryValue, { color: card.color }]}>{card.value}</Text>
              <Ionicons
                name={card.trend === 'up' ? 'trending-up' : 'trending-down'}
                size={18}
                color={card.trend === 'up' ? Colors.success : Colors.error}
              />
            </View>
          </Card>
        ))}
      </ScrollView>

      {/* Chart */}
      <Card variant="elevated" style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={dynamicStyles.chartTitle}>{t.dashboard.skinHealth}</Text>
          {analysisHistory.length > 0 && (
            <Badge 
              text={`${analysisHistory.length} ${t.dashboard.analyses.toLowerCase()}`} 
              variant="primary" 
              size="sm" 
            />
          )}
        </View>
        
        {chartData.length > 0 ? (
          <View style={styles.chartContainer}>
            {/* Simple bar chart */}
            <View style={styles.barChart}>
              {chartData.map((item, index) => (
                <View key={index} style={styles.barColumn}>
                  <View style={styles.barWrapper}>
                    <LinearGradient
                      colors={Gradients.primary}
                      style={[
                        styles.bar,
                        { height: `${(item.score / maxScore) * 100}%` }
                      ]}
                    />
                  </View>
                  <Text style={dynamicStyles.barLabel}>{item.score}</Text>
                </View>
              ))}
            </View>
            <View style={[styles.chartLegend, { borderTopColor: colors.border }]}>
              <Text style={dynamicStyles.legendText}>{t.evolution.photoTimeline}</Text>
            </View>
          </View>
        ) : (
          <View style={[styles.chartPlaceholder, { backgroundColor: colors.backgroundSecondary }]}>
            <Ionicons name="analytics-outline" size={48} color={colors.border} />
            <Text style={dynamicStyles.chartPlaceholderText}>{t.evolution.noData}</Text>
          </View>
        )}
      </Card>

      {/* Timeline */}
      <View style={styles.section}>
        <Text style={dynamicStyles.sectionTitle}>{t.evolution.photoTimeline}</Text>
        {analysisHistory.length === 0 ? (
          <EmptyState
            icon="camera-outline"
            title={t.evolution.noData}
            description={t.evolution.noDataDesc}
          />
        ) : (
          analysisHistory.map((analysis, index) => {
            const prevScore = analysisHistory[index + 1] ? getHealthScore(analysisHistory[index + 1]) : null;
            const currentScore = getHealthScore(analysis);
            const change = prevScore ? currentScore - prevScore : 0;
            const skinType = analysis.results?.skinType;
            
            return (
              <Card key={analysis.id} style={styles.timelineCard}>
                <View style={styles.timelineRow}>
                  <View style={styles.timelineDot}>
                    <LinearGradient colors={Gradients.primary} style={styles.dotGradient}>
                      <Ionicons name="pulse-outline" size={14} color={Colors.white} />
                    </LinearGradient>
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={dynamicStyles.timelineDate}>{formatDate(analysis.createdAt)}</Text>
                    <Text style={dynamicStyles.timelineScore}>{t.evolution.score}: {currentScore}%</Text>
                    {skinType && (
                      <Text style={dynamicStyles.timelineMeta}>{skinType}</Text>
                    )}
                  </View>
                  {prevScore && (
                    <Badge
                      text={change >= 0 ? `+${change}` : `${change}`}
                      variant={change >= 0 ? 'success' : 'error'}
                      size="md"
                    />
                  )}
                </View>
              </Card>
            );
          })
        )}
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md },
  periodSelector: {
    flexDirection: 'row', gap: Spacing.sm,
    paddingHorizontal: Spacing.xl, marginTop: Spacing.xl,
  },
  summaryScroll: { marginTop: Spacing.xl, paddingLeft: Spacing.xl },
  summaryCard: { width: 120, marginRight: Spacing.md, padding: Spacing.base },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: Spacing.xs },
  chartCard: { marginHorizontal: Spacing.xl, marginTop: Spacing.xl, padding: Spacing.xl },
  chartPlaceholder: { height: 200, alignItems: 'center', justifyContent: 'center', borderRadius: BorderRadius.base },
  section: { paddingHorizontal: Spacing.xl, marginTop: Spacing['2xl'] },
  timelineCard: { marginBottom: Spacing.sm, padding: Spacing.base },
  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  timelineDot: { width: 32, height: 32 },
  dotGradient: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  timelineContent: { flex: 1 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  chartContainer: { paddingTop: Spacing.md },
  barChart: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 150, paddingBottom: Spacing.sm },
  barColumn: { alignItems: 'center', flex: 1 },
  barWrapper: { width: 24, height: 120, justifyContent: 'flex-end' },
  bar: { width: 24, borderRadius: BorderRadius.sm, minHeight: 8 },
  chartLegend: { alignItems: 'center', marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1 },
});
