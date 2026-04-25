import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  Image,
  Animated,
  Easing,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Badge, EmptyState, Button } from '../../components';
import { Colors, Gradients, Spacing, BorderRadius, FontSizes, FontWeights, Shadows } from '../../theme';
import { useAccessibilityStyles } from '../../stores/useAccessibilityStyles';
import { analysisService } from '../../services/analysis.service';
import type { Analysis, AnalysisStats, GeminiAnalysisResult } from '../../lib/types';
import { formatDate } from '../../lib/utils/formatters';
import { useTranslation } from '../../lib/i18n/useTranslation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const WEEK_DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

const METRIC_LABELS: Record<string, string> = {
  hydration: 'Hydratation',
  texture: 'Texture',
  pores: 'Pores',
  pigmentation: 'Pigmentation',
  wrinkles: 'Rides',
  acne: 'Acné',
  redness: 'Rougeurs',
  elasticity: 'Élasticité',
};

export function EvolutionScreen() {
  const { colors, fontSizes } = useAccessibilityStyles();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<AnalysisStats | null>(null);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const loadData = useCallback(async () => {
    try {
      const [statsData, historyData] = await Promise.all([
        analysisService.getStats(),
        analysisService.getAll(1, 50),
      ]);
      setStats(statsData);
      setAnalyses(historyData.analyses || []);
    } catch (error) {
      console.error('Error loading evolution data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }),
      ]).start();
    }
  }, [loading]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  // Calendar Logic
  const monthBuckets = useMemo(() => {
    if (analyses.length === 0) return [];
    const unique = new Map<string, Date>();

    analyses.forEach((analysis) => {
      const date = new Date(analysis.createdAt);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (!unique.has(key)) {
        unique.set(key, new Date(date.getFullYear(), date.getMonth(), 1));
      }
    });

    return Array.from(unique.values()).sort((a, b) => b.getTime() - a.getTime());
  }, [analyses]);

  const selectedMonthDate = monthBuckets[selectedMonthIndex] || new Date();

  const analysesByDay = useMemo(() => {
    const map = new Map<number, Analysis[]>();
    const filtered = analyses.filter((a) => {
      const d = new Date(a.createdAt);
      return d.getFullYear() === selectedMonthDate.getFullYear() && d.getMonth() === selectedMonthDate.getMonth();
    });

    filtered.forEach((analysis) => {
      const day = new Date(analysis.createdAt).getDate();
      const list = map.get(day) ?? [];
      list.push(analysis);
      map.set(day, list);
    });
    return map;
  }, [analyses, selectedMonthDate]);

  const calendarDays = useMemo(() => {
    const year = selectedMonthDate.getFullYear();
    const month = selectedMonthDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Padding for first week
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    // Days of the month
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d);
    }
    return days;
  }, [selectedMonthDate]);

  const latestAnalysis = analyses[0] || null;

  const metricSummary = useMemo(() => {
    if (!latestAnalysis?.results?.detailedAnalysis) return [];
    const detailed = latestAnalysis.results.detailedAnalysis;
    return Object.entries(detailed).slice(0, 4).map(([key, data]) => ({
      name: METRIC_LABELS[key] || key,
      score: data.score,
      color: key === 'hydration' ? Colors.primary : key === 'texture' ? '#F9A8D4' : key === 'pores' ? '#06B6D4' : '#8B5CF6',
    }));
  }, [latestAnalysis]);

  const handleSelectAnalysis = (analysis: Analysis) => {
    setSelectedAnalysis(analysis);
    setShowDetailModal(true);
  };

  const getHealthScore = (analysis: Analysis): number => {
    return analysis.healthScore || analysis.results?.healthScore || 0;
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]} edges={['left', 'right']}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>{t.common.loading}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Header Section */}
          <View style={styles.header}>
            <LinearGradient colors={['#F0F9FF', '#FFFFFF']} style={styles.headerGradient}>
              <View style={styles.headerTop}>
                <View style={styles.titleContainer}>
                  <View style={styles.iconBox}>
                    <Ionicons name="trending-up" size={24} color={Colors.primary} />
                  </View>
                  <View>
                    <Text style={styles.title}>{t.evolution.title}</Text>
                    <Text style={styles.subtitle}>
                      {stats ? `${stats.totalAnalyses} ${t.dashboard.analyses.toLowerCase()}` : t.evolution.subtitle}
                    </Text>
                  </View>
                </View>
              </View>

              {latestAnalysis && (
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Score Actuel</Text>
                    <Text style={[styles.statValue, { color: Colors.primary }]}>{getHealthScore(latestAnalysis)}%</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Tendance</Text>
                    <View style={styles.trendContainer}>
                      <Ionicons name="trending-up" size={16} color={Colors.success} />
                      <Text style={[styles.statValue, { color: Colors.success, marginLeft: 4 }]}>+4 pts</Text>
                    </View>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Âge Peau</Text>
                    <Text style={styles.statValue}>{latestAnalysis.results?.skinAge || '--'}</Text>
                  </View>
                </View>
              )}
            </LinearGradient>
          </View>

          {/* Quick Metrics */}
          {metricSummary.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.metricsScroll}>
              {metricSummary.map((metric, index) => (
                <Card key={index} style={styles.metricCard}>
                  <View style={[styles.metricIndicator, { backgroundColor: metric.color }]} />
                  <Text style={styles.metricName}>{metric.name}</Text>
                  <Text style={[styles.metricValue, { color: metric.color }]}>{metric.score}%</Text>
                </Card>
              ))}
            </ScrollView>
          )}

          {/* Calendar Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="calendar" size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>{t.evolution.photoTimeline}</Text>
              </View>
              {monthBuckets.length > 1 && (
                <View style={styles.monthControls}>
                  <TouchableOpacity 
                    onPress={() => setSelectedMonthIndex(i => Math.min(i + 1, monthBuckets.length - 1))}
                    disabled={selectedMonthIndex >= monthBuckets.length - 1}
                  >
                    <Ionicons name="chevron-back" size={24} color={selectedMonthIndex >= monthBuckets.length - 1 ? Colors.gray300 : Colors.primary} />
                  </TouchableOpacity>
                  <Text style={styles.monthLabel}>
                    {selectedMonthDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                  </Text>
                  <TouchableOpacity 
                    onPress={() => setSelectedMonthIndex(i => Math.max(i - 1, 0))}
                    disabled={selectedMonthIndex <= 0}
                  >
                    <Ionicons name="chevron-forward" size={24} color={selectedMonthIndex <= 0 ? Colors.gray300 : Colors.primary} />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <Card style={styles.calendarCard}>
              <View style={styles.calendarHeader}>
                {WEEK_DAYS.map(day => (
                  <Text key={day} style={styles.calendarDayHeader}>{day}</Text>
                ))}
              </View>
              <View style={styles.calendarGrid}>
                {calendarDays.map((day, index) => {
                  const analyses = day ? analysesByDay.get(day) : null;
                  const hasAnalysis = analyses && analyses.length > 0;
                  
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.calendarCell,
                        !day && styles.emptyCell,
                        hasAnalysis && styles.analysisCell
                      ]}
                      disabled={!hasAnalysis}
                      onPress={() => hasAnalysis && handleSelectAnalysis(analyses[0])}
                    >
                      {day && (
                        <>
                          <Text style={[styles.dayText, hasAnalysis && styles.analysisDayText]}>{day}</Text>
                          {hasAnalysis && (
                            <View style={styles.scoreIndicator}>
                              <Text style={styles.indicatorText}>{getHealthScore(analyses[0])}</Text>
                            </View>
                          )}
                        </>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Card>
          </View>

          {/* History List */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Historique Récent</Text>
            {analyses.length === 0 ? (
              <EmptyState
                icon="camera"
                title={t.evolution.noData}
                description={t.evolution.noDataDesc}
              />
            ) : (
              analyses.slice(0, 10).map((analysis) => (
                <TouchableOpacity key={analysis.id} onPress={() => handleSelectAnalysis(analysis)}>
                  <Card style={styles.historyCard}>
                    <View style={styles.historyRow}>
                      <View style={styles.historyThumbContainer}>
                        {analysis.images?.[0] ? (
                          <Image source={{ uri: analysis.images[0] }} style={styles.historyThumb} />
                        ) : (
                          <View style={styles.historyThumbPlaceholder}>
                            <Ionicons name="image" size={20} color={Colors.gray400} />
                          </View>
                        )}
                      </View>
                      <View style={styles.historyInfo}>
                        <Text style={styles.historyDate}>{formatDate(analysis.createdAt)}</Text>
                        <View style={styles.historyMeta}>
                          <Badge text={`${getHealthScore(analysis)}%`} variant="primary" size="sm" />
                          <Text style={styles.historyType}>{analysis.results?.skinType || 'Analyse IA'}</Text>
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={Colors.gray300} />
                    </View>
                  </Card>
                </TouchableOpacity>
              ))
            )}
          </View>

          <View style={{ height: 100 }} />
        </Animated.View>
      </ScrollView>

      {/* Analysis Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowDetailModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowDetailModal(false)} style={styles.modalClose}>
              <Ionicons name="close" size={28} color={Colors.gray800} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Rapport d'Analyse</Text>
            <View style={{ width: 40 }} />
          </View>

          {selectedAnalysis && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
              {/* Report Header */}
              <View style={styles.reportHeader}>
                <View style={styles.reportImageContainer}>
                   {selectedAnalysis.images?.[0] ? (
                     <Image source={{ uri: selectedAnalysis.images[0] }} style={styles.reportImage} />
                   ) : (
                     <View style={styles.reportImagePlaceholder}>
                       <Ionicons name="image" size={48} color={Colors.gray300} />
                     </View>
                   )}
                   <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.reportImageOverlay}>
                     <Text style={styles.reportImageDate}>{formatDate(selectedAnalysis.createdAt)}</Text>
                   </LinearGradient>
                </View>

                <View style={styles.reportSummaryStats}>
                  <View style={styles.summaryStatBox}>
                    <Text style={styles.summaryStatValue}>{getHealthScore(selectedAnalysis)}%</Text>
                    <Text style={styles.summaryStatLabel}>Score Santé</Text>
                  </View>
                  <View style={styles.summaryStatBox}>
                    <Text style={styles.summaryStatValue}>{selectedAnalysis.results?.skinAge || '--'}</Text>
                    <Text style={styles.summaryStatLabel}>Âge Cutané</Text>
                  </View>
                  <View style={styles.summaryStatBox}>
                    <Text style={styles.summaryStatValue}>{selectedAnalysis.results?.fitzpatrickType || '?'}</Text>
                    <Text style={styles.summaryStatLabel}>Fitzpatrick</Text>
                  </View>
                </View>
              </View>

              {/* Analysis Summary */}
              {selectedAnalysis.results?.summary && (
                <Card style={styles.reportSectionCard}>
                  <Text style={styles.reportSectionTitle}>Résumé Global</Text>
                  <Text style={styles.reportSummaryText}>{selectedAnalysis.results.summary}</Text>
                </Card>
              )}

              {/* Detailed Metrics */}
              {selectedAnalysis.results?.detailedAnalysis && (
                <Card style={styles.reportSectionCard}>
                  <Text style={styles.reportSectionTitle}>Analyse Détaillée</Text>
                  <View style={styles.metricsGrid}>
                    {Object.entries(selectedAnalysis.results.detailedAnalysis).map(([key, data]) => (
                      <View key={key} style={styles.gridMetricItem}>
                        <View style={styles.gridMetricHeader}>
                          <Text style={styles.gridMetricLabel}>{METRIC_LABELS[key] || key}</Text>
                          <Text style={styles.gridMetricValue}>{data.score}%</Text>
                        </View>
                        <View style={styles.metricBarBg}>
                          <View style={[styles.metricBarFill, { width: `${data.score}%`, backgroundColor: data.score > 70 ? Colors.success : data.score > 40 ? Colors.warning : Colors.error }]} />
                        </View>
                      </View>
                    ))}
                  </View>
                </Card>
              )}

              {/* Recommendations */}
              {(selectedAnalysis.results?.recommendations || selectedAnalysis.recommendations) && (
                <View style={styles.recommendationsContainer}>
                  <Text style={styles.reportSectionTitle}>Recommandations IA</Text>
                  
                  {/* Ingredients */}
                  <Card style={styles.recCard}>
                    <View style={styles.recHeader}>
                      <Ionicons name="flask-outline" size={20} color={Colors.primary} />
                      <Text style={styles.recTitle}>Ingrédients Clés</Text>
                    </View>
                    <View style={styles.recList}>
                      {(selectedAnalysis.results?.recommendations?.ingredients || selectedAnalysis.recommendations?.ingredients || []).map((item, idx) => (
                        <View key={idx} style={styles.recItem}>
                          <Text style={styles.recBullet}>•</Text>
                          <Text style={styles.recText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  </Card>

                  {/* Products */}
                  <Card style={styles.recCard}>
                    <View style={styles.recHeader}>
                      <Ionicons name="cube-outline" size={20} color={Colors.primary} />
                      <Text style={styles.recTitle}>Produits Recommandés</Text>
                    </View>
                    <View style={styles.recList}>
                      {(selectedAnalysis.results?.recommendations?.products || selectedAnalysis.recommendations?.products || []).map((item, idx) => (
                        <View key={idx} style={styles.recItem}>
                          <Text style={styles.recBullet}>•</Text>
                          <Text style={styles.recText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  </Card>

                  {/* Lifestyle */}
                  <Card style={styles.recCard}>
                    <View style={styles.recHeader}>
                      <Ionicons name="leaf-outline" size={20} color={Colors.primary} />
                      <Text style={styles.recTitle}>Mode de vie</Text>
                    </View>
                    <View style={styles.recList}>
                      {(selectedAnalysis.results?.recommendations?.lifestyle || selectedAnalysis.recommendations?.lifestyle || []).map((item, idx) => (
                        <View key={idx} style={styles.recItem}>
                          <Text style={styles.recBullet}>•</Text>
                          <Text style={styles.recText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  </Card>
                </View>
              )}

              <View style={{ height: 40 }} />
              <Button onPress={() => setShowDetailModal(false)} variant="outline">Fermer</Button>
              <View style={{ height: 40 }} />
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  loadingText: { marginTop: Spacing.md, color: Colors.gray500, fontSize: 14 },
  
  header: { paddingBottom: Spacing.lg },
  headerGradient: {
    padding: Spacing.xl,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    ...Shadows.sm,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titleContainer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  subtitle: { fontSize: 14, color: Colors.gray500, marginTop: 2 },
  
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xl,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 20,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 11, color: Colors.gray500, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  statDivider: { width: 1, height: '60%', backgroundColor: '#E0F2FE', alignSelf: 'center' },
  trendContainer: { flexDirection: 'row', alignItems: 'center' },

  metricsScroll: { paddingHorizontal: Spacing.xl, marginTop: Spacing.lg, paddingBottom: 4 },
  metricCard: {
    width: 130,
    marginRight: Spacing.md,
    padding: Spacing.md,
    borderRadius: 20,
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },
  metricIndicator: { width: 12, height: 4, borderRadius: 2, marginBottom: 8 },
  metricName: { fontSize: 12, color: Colors.gray500, fontWeight: '500' },
  metricValue: { fontSize: 18, fontWeight: '700', marginTop: 2 },

  section: { marginTop: Spacing.xl, paddingHorizontal: Spacing.xl },
  sectionHeader: { marginBottom: Spacing.md },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  
  monthControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  monthLabel: { fontSize: 14, fontWeight: '600', color: Colors.primary },

  calendarCard: { padding: Spacing.md, borderRadius: 24 },
  calendarHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 8 },
  calendarDayHeader: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', color: Colors.gray400, textTransform: 'uppercase' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  calendarCell: {
    width: (SCREEN_WIDTH - Spacing.xl * 2 - Spacing.md * 2) / 7,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  emptyCell: { opacity: 0 },
  dayText: { fontSize: 14, fontWeight: '500', color: Colors.gray600 },
  analysisCell: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  analysisDayText: { color: Colors.primary, fontWeight: '700' },
  scoreIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: Colors.primary,
    borderRadius: 6,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  indicatorText: { fontSize: 8, color: Colors.white, fontWeight: 'bold' },

  historyCard: { marginBottom: Spacing.sm, padding: Spacing.md, borderRadius: 18 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  historyThumbContainer: { width: 44, height: 44, borderRadius: 12, overflow: 'hidden', backgroundColor: '#F1F5F9' },
  historyThumb: { width: '100%', height: '100%' },
  historyThumbPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  historyInfo: { flex: 1 },
  historyDate: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  historyMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 2 },
  historyType: { fontSize: 12, color: Colors.gray500 },

  modalContainer: { flex: 1, backgroundColor: '#FFFFFF' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalClose: { padding: 4 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  modalScroll: { padding: Spacing.xl },

  reportHeader: { marginBottom: Spacing.xl },
  reportImageContainer: {
    width: '100%',
    height: 220,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    ...Shadows.md,
  },
  reportImage: { width: '100%', height: '100%' },
  reportImagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  reportImageOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, justifyContent: 'flex-end', padding: Spacing.lg },
  reportImageDate: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  
  reportSummaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryStatBox: { alignItems: 'center' },
  summaryStatValue: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  summaryStatLabel: { fontSize: 10, color: Colors.gray500, fontWeight: '600', textTransform: 'uppercase', marginTop: 2 },

  reportSectionCard: { padding: Spacing.xl, borderRadius: 24, marginBottom: Spacing.lg },
  reportSectionTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: Spacing.md },
  reportSummaryText: { fontSize: 14, color: '#475569', lineHeight: 22 },

  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  gridMetricItem: { width: '47%', marginBottom: Spacing.sm },
  gridMetricHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  gridMetricLabel: { fontSize: 12, color: Colors.gray600, fontWeight: '500' },
  gridMetricValue: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  metricBarBg: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  metricBarFill: { height: '100%', borderRadius: 3 },

  recommendationsContainer: { marginBottom: Spacing.xl },
  recCard: { padding: Spacing.lg, borderRadius: 20, marginBottom: Spacing.md },
  recHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  recTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  recList: { gap: Spacing.xs },
  recItem: { flexDirection: 'row', gap: Spacing.xs },
  recBullet: { color: Colors.primary, fontWeight: 'bold' },
  recText: { flex: 1, fontSize: 13, color: '#475569', lineHeight: 18 },
});
