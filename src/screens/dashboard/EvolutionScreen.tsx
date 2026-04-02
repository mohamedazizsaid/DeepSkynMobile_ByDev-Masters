import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Badge, EmptyState } from '../../components';
import { Colors, Gradients, Spacing, BorderRadius, FontSizes, FontWeights } from '../../theme';
import { analysisService } from '../../services/analysis.service';
import type { Analysis, AnalysisStats } from '../../lib/types';
import { formatDate } from '../../lib/utils/formatters';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function EvolutionScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState('1M');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<AnalysisStats | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<Analysis[]>([]);
  
  const periods = ['1W', '1M', '3M', '6M', '1Y'];

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
      label: 'Score Global', 
      value: stats?.averageHealthScore ? `${Math.round(stats.averageHealthScore)}%` : '--', 
      trend: getScoreChange(analysisHistory) >= 0 ? 'up' : 'down',
      color: Colors.primary 
    },
    { 
      label: 'Analyses', 
      value: stats?.totalAnalyses?.toString() || '0', 
      trend: 'up',
      color: '#06B6D4' 
    },
    { 
      label: 'Score Max', 
      value: analysisHistory[0] 
        ? `${getHealthScore(analysisHistory[0])}%` 
        : '--', 
      trend: 'up',
      color: '#8B5CF6' 
    },
    { 
      label: 'Progression', 
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
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ marginTop: Spacing.md, color: Colors.gray500 }}>Chargement...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Évolution</Text>
          <Text style={styles.subtitle}>Suivez les progrès de votre peau</Text>
        </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {periods.map((period) => (
          <TouchableOpacity
            key={period}
            style={[styles.periodPill, selectedPeriod === period ? styles.periodPillActive : undefined]}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text style={[styles.periodText, selectedPeriod === period ? styles.periodTextActive : undefined]}>
              {period}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary Cards */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.summaryScroll}>
        {summaryCards.map((card, index) => (
          <Card key={index} style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>{card.label}</Text>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryValue, { color: card.color }]}>{card.value}</Text>
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
          <Text style={styles.chartTitle}>Score de santé</Text>
          {analysisHistory.length > 0 && (
            <Badge 
              text={`${analysisHistory.length} analyses`} 
              variant="info" 
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
                  <Text style={styles.barLabel}>{item.score}</Text>
                </View>
              ))}
            </View>
            <View style={styles.chartLegend}>
              <Text style={styles.legendText}>Dernières analyses</Text>
            </View>
          </View>
        ) : (
          <View style={styles.chartPlaceholder}>
            <Ionicons name="analytics-outline" size={48} color={Colors.gray300} />
            <Text style={styles.chartPlaceholderText}>Pas encore de données</Text>
          </View>
        )}
      </Card>

      {/* Timeline */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Historique des analyses</Text>
        {analysisHistory.length === 0 ? (
          <EmptyState
            icon="camera-outline"
            title="Aucune analyse"
            message="Faites votre première analyse pour commencer le suivi"
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
                    <Text style={styles.timelineDate}>{formatDate(analysis.createdAt)}</Text>
                    <Text style={styles.timelineScore}>Score: {currentScore}%</Text>
                    {skinType && (
                      <Text style={styles.timelineMeta}>Type: {skinType}</Text>
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
  safeArea: { flex: 1, backgroundColor: Colors.gray50 },
  container: { flex: 1, backgroundColor: Colors.gray50 },
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md },
  title: { fontSize: FontSizes['2xl'], fontWeight: FontWeights.bold, color: Colors.gray900 },
  subtitle: { fontSize: FontSizes.sm, color: Colors.gray500, marginTop: Spacing.xs },
  periodSelector: {
    flexDirection: 'row', gap: Spacing.sm,
    paddingHorizontal: Spacing.xl, marginTop: Spacing.xl,
  },
  periodPill: {
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full, backgroundColor: Colors.white,
    borderWidth: 1, borderColor: Colors.gray200,
  },
  periodPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  periodText: { fontSize: FontSizes.sm, fontWeight: FontWeights.medium, color: Colors.gray500 },
  periodTextActive: { color: Colors.white },
  summaryScroll: { marginTop: Spacing.xl, paddingLeft: Spacing.xl },
  summaryCard: { width: 120, marginRight: Spacing.md, padding: Spacing.base },
  summaryLabel: { fontSize: FontSizes.xs, color: Colors.gray500 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: Spacing.xs },
  summaryValue: { fontSize: FontSizes.xl, fontWeight: FontWeights.bold },
  chartCard: { marginHorizontal: Spacing.xl, marginTop: Spacing.xl, padding: Spacing.xl },
  chartTitle: { fontSize: FontSizes.base, fontWeight: FontWeights.bold, color: Colors.gray900, marginBottom: Spacing.xl },
  chartPlaceholder: { height: 200, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.gray50, borderRadius: BorderRadius.base },
  chartPlaceholderText: { fontSize: FontSizes.sm, color: Colors.gray400, marginTop: Spacing.sm },
  section: { paddingHorizontal: Spacing.xl, marginTop: Spacing['2xl'] },
  sectionTitle: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.gray900, marginBottom: Spacing.base },
  timelineCard: { marginBottom: Spacing.sm, padding: Spacing.base },
  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  timelineDot: { width: 32, height: 32 },
  dotGradient: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  timelineContent: { flex: 1 },
  timelineDate: { fontSize: FontSizes.base, fontWeight: FontWeights.medium, color: Colors.gray900 },
  timelineScore: { fontSize: FontSizes.sm, color: Colors.gray500, marginTop: 2 },
  timelineMeta: { fontSize: FontSizes.xs, color: Colors.gray400, marginTop: 2 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  chartContainer: { paddingTop: Spacing.md },
  barChart: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 150, paddingBottom: Spacing.sm },
  barColumn: { alignItems: 'center', flex: 1 },
  barWrapper: { width: 24, height: 120, justifyContent: 'flex-end' },
  bar: { width: 24, borderRadius: BorderRadius.sm, minHeight: 8 },
  barLabel: { fontSize: FontSizes.xs, color: Colors.gray500, marginTop: Spacing.xs, fontWeight: FontWeights.semibold },
  chartLegend: { alignItems: 'center', marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.gray100 },
  legendText: { fontSize: FontSizes.xs, color: Colors.gray400 },
});
