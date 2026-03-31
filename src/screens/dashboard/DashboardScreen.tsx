import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, Badge, ProgressBar, WeatherWidget, LoadingSpinner } from '../../components';
import { Colors, Gradients, Spacing, BorderRadius, FontSizes, FontWeights, Shadows } from '../../theme';
import { useAuthStore } from '../../stores/auth.store';
import { useNotificationStore } from '../../stores/notification.store';
import { analysisService } from '../../services/analysis.service';
import type { Analysis, AnalysisStats } from '../../lib/types';
import { getRelativeTime } from '../../lib/utils';

interface DashboardData {
  latestAnalysis: Analysis | null;
  stats: AnalysisStats | null;
}

export function DashboardScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const { unreadCount, fetchUnreadCount } = useNotificationStore();
  const [data, setData] = useState<DashboardData>({ latestAnalysis: null, stats: null });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = useCallback(async () => {
    try {
      const [latestAnalysis, stats] = await Promise.all([
        analysisService.getLatest().catch(() => null),
        analysisService.getStats().catch(() => null),
      ]);
      setData({ latestAnalysis, stats });
      fetchUnreadCount();
    } catch (error) {
      console.error('Dashboard load error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchUnreadCount]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const skinScore = data.latestAnalysis?.healthScore ?? 0;
  const skinAge = data.latestAnalysis?.skinAge ?? null;
  const userAge = user?.age ?? 28;
  
  const detailedAnalysis = data.latestAnalysis?.results?.detailedAnalysis;
  const metrics = detailedAnalysis ? [
    { label: 'Hydratation', value: detailedAnalysis.hydration?.score ?? 0, color: '#06B6D4' },
    { label: 'Texture', value: detailedAnalysis.texture?.score ?? 0, color: '#8B5CF6' },
    { label: 'Élasticité', value: detailedAnalysis.elasticity?.score ?? 0, color: '#F59E0B' },
    { label: 'Pores', value: detailedAnalysis.pores?.score ?? 0, color: '#10B981' },
  ] : [
    { label: 'Hydratation', value: 0, color: '#06B6D4' },
    { label: 'Texture', value: 0, color: '#8B5CF6' },
    { label: 'Élasticité', value: 0, color: '#F59E0B' },
    { label: 'Pores', value: 0, color: '#10B981' },
  ];

  const quickActions = [
    { icon: 'scan-outline' as const, label: 'Nouvelle Analyse', screen: 'Analysis', gradient: Gradients.primary },
    { icon: 'calendar-outline' as const, label: 'Ma Routine', screen: 'Routine', gradient: Gradients.accent },
    { icon: 'chatbubble-outline' as const, label: 'Coach IA', screen: 'Chat', gradient: Gradients.purple },
    { icon: 'trending-up-outline' as const, label: 'Évolution', screen: 'Evolution', gradient: Gradients.success },
  ];

  const greeting = getGreeting();
  const userName = user?.firstName || user?.username || 'Utilisateur';

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner message="Chargement du tableau de bord..." />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting} 👋</Text>
          <Text style={styles.name}>{userName}</Text>
        </View>
        <TouchableOpacity 
          style={styles.notifButton}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Ionicons name="notifications-outline" size={24} color={Colors.gray700} />
          {unreadCount > 0 && <View style={styles.notifBadge} />}
        </TouchableOpacity>
      </View>

      {/* Weather Widget */}
      <View style={styles.weatherSection}>
        <WeatherWidget compact showAdvice={false} />
      </View>

      {/* Skin Health Score */}
      <Card variant="elevated" style={styles.scoreCard}>
        <View style={styles.scoreHeader}>
          <Text style={styles.scoreLabel}>Score Santé Peau</Text>
          {data.stats && data.stats.totalAnalyses > 1 && (
            <Badge 
              text={`${data.stats.totalAnalyses} analyses`} 
              variant="primary" 
            />
          )}
        </View>
        {skinScore > 0 ? (
          <>
            <View style={styles.scoreCircleContainer}>
              <View style={styles.scoreCircle}>
                <Text style={styles.scoreNumber}>{skinScore}</Text>
                <Text style={styles.scoreOutOf}>/100</Text>
              </View>
            </View>
            {skinAge && (
              <View style={styles.ageComparison}>
                <View style={styles.ageRow}>
                  <Text style={styles.ageLabel}>Âge réel</Text>
                  <View style={styles.ageBar}>
                    <View style={[styles.ageBarFill, { width: `${Math.min((userAge / 60) * 100, 100)}%`, backgroundColor: Colors.primary }]} />
                  </View>
                  <Text style={styles.ageValue}>{userAge}</Text>
                </View>
                <View style={styles.ageRow}>
                  <Text style={styles.ageLabel}>Âge peau</Text>
                  <View style={styles.ageBar}>
                    <View style={[styles.ageBarFill, { width: `${Math.min((skinAge / 60) * 100, 100)}%`, backgroundColor: skinAge <= userAge ? Colors.success : Colors.warning }]} />
                  </View>
                  <Text style={[styles.ageValue, { color: skinAge <= userAge ? Colors.success : Colors.warning }]}>{skinAge}</Text>
                </View>
              </View>
            )}
          </>
        ) : (
          <View style={styles.noAnalysis}>
            <Ionicons name="scan-outline" size={48} color={Colors.gray300} />
            <Text style={styles.noAnalysisText}>Aucune analyse</Text>
            <Text style={styles.noAnalysisHint}>Faites votre première analyse pour voir vos scores</Text>
          </View>
        )}
      </Card>

      {/* Skin Metrics */}
      {skinScore > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Métriques Détaillées</Text>
          {metrics.map((metric, index) => (
            <View key={index} style={styles.metricRow}>
              <View style={styles.metricHeader}>
                <Text style={styles.metricLabel}>{metric.label}</Text>
                <Text style={[styles.metricValue, { color: metric.color }]}>{metric.value}%</Text>
              </View>
              <ProgressBar progress={metric.value} color={metric.color} height={6} />
            </View>
          ))}
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions Rapides</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.actionCard}
              onPress={() => navigation.navigate(action.screen)}
              activeOpacity={0.7}
            >
              <LinearGradient colors={action.gradient} style={styles.actionIcon}>
                <Ionicons name={action.icon as any} size={24} color={Colors.white} />
              </LinearGradient>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Insights */}
      {data.latestAnalysis?.results?.recommendations && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conseils IA</Text>
          <Card style={styles.insightsCard}>
            <LinearGradient colors={Gradients.primary} style={styles.insightsIcon}>
              <Ionicons name="sparkles" size={20} color={Colors.white} />
            </LinearGradient>
            {data.latestAnalysis.results.recommendations.lifestyle.slice(0, 3).map((tip, index) => (
              <View key={index} style={styles.insightRow}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                <Text style={styles.insightText}>{tip}</Text>
              </View>
            ))}
          </Card>
        </View>
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bonjour';
  if (hour < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray50 },
  loadingContainer: { flex: 1, backgroundColor: Colors.gray50, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingTop: 60, paddingBottom: Spacing.md,
  },
  greeting: { fontSize: FontSizes.base, color: Colors.gray500 },
  name: { fontSize: FontSizes.xl, fontWeight: FontWeights.bold, color: Colors.gray900 },
  notifButton: { position: 'relative', padding: Spacing.sm },
  notifBadge: {
    position: 'absolute', top: 6, right: 6,
    width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.error,
  },
  weatherSection: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.md },
  scoreCard: { marginHorizontal: Spacing.xl, padding: Spacing.xl },
  scoreHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  scoreLabel: { fontSize: FontSizes.base, fontWeight: FontWeights.semibold, color: Colors.gray900 },
  scoreCircleContainer: { alignItems: 'center', marginBottom: Spacing.xl },
  scoreCircle: {
    width: 120, height: 120, borderRadius: 60,
    borderWidth: 6, borderColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  scoreNumber: { fontSize: FontSizes['3xl'], fontWeight: FontWeights.bold, color: Colors.primary },
  scoreOutOf: { fontSize: FontSizes.sm, color: Colors.gray400 },
  ageComparison: { gap: Spacing.md },
  ageRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  ageLabel: { fontSize: FontSizes.sm, color: Colors.gray500, width: 70 },
  ageBar: { flex: 1, height: 8, backgroundColor: Colors.gray200, borderRadius: 4 },
  ageBarFill: { height: 8, borderRadius: 4 },
  ageValue: { fontSize: FontSizes.base, fontWeight: FontWeights.bold, color: Colors.primary, width: 30 },
  noAnalysis: { alignItems: 'center', paddingVertical: Spacing.xl },
  noAnalysisText: { fontSize: FontSizes.lg, fontWeight: FontWeights.semibold, color: Colors.gray500, marginTop: Spacing.md },
  noAnalysisHint: { fontSize: FontSizes.sm, color: Colors.gray400, marginTop: Spacing.xs, textAlign: 'center' },
  section: { paddingHorizontal: Spacing.xl, marginTop: Spacing['2xl'] },
  sectionTitle: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.gray900, marginBottom: Spacing.base },
  metricRow: { marginBottom: Spacing.md },
  metricHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs },
  metricLabel: { fontSize: FontSizes.sm, color: Colors.gray700 },
  metricValue: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  actionCard: {
    width: '47%', backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.gray200,
    alignItems: 'center', ...Shadows.sm,
  },
  actionIcon: {
    width: 48, height: 48, borderRadius: BorderRadius.base,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
  },
  actionLabel: { fontSize: FontSizes.sm, fontWeight: FontWeights.medium, color: Colors.gray700 },
  insightsCard: { padding: Spacing.lg },
  insightsIcon: {
    width: 36, height: 36, borderRadius: BorderRadius.base,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
  },
  insightRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.sm },
  insightText: { flex: 1, fontSize: FontSizes.sm, color: Colors.gray700, lineHeight: 20 },
});
