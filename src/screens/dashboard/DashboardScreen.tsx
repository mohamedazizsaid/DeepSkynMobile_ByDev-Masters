import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Modal, Animated, Pressable} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Badge, ProgressBar, WeatherWidget, LoadingSpinner, AccessibilityPanel } from '../../components';
import { GuidedTour } from '../../components/tour/GuidedTour';
import { Colors, Gradients, Spacing, BorderRadius, FontSizes, FontWeights, Shadows } from '../../theme';
import { useAuthStore } from '../../stores/auth.store';
import { useNotificationStore } from '../../stores/notification.store';
import { useAccessibilityStore } from '../../stores/accessibility.store';
import { useAccessibilityStyles } from '../../stores/useAccessibilityStyles';
import { useTranslation } from '../../lib/i18n';
import { analysisService } from '../../services/analysis.service';
import type { Analysis, AnalysisStats } from '../../lib/types';
import { getRelativeTime } from '../../lib/utils';

interface DashboardData {
  latestAnalysis: Analysis | null;
  stats: AnalysisStats | null;
}

interface DropdownMenuItem {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
  action: () => void;
}

export function DashboardScreen({ navigation }: any) {
  const { user, logout, needsGuidedTour, markGuidedTourComplete } = useAuthStore();
  const { unreadCount, fetchUnreadCount } = useNotificationStore();
  const { togglePanel: openAccessibilityPanel } = useAccessibilityStore();
  const { colors, fontSizes, settings, getAnimDuration } = useAccessibilityStyles();
  const { t } = useTranslation();
  const [data, setData] = useState<DashboardData>({ latestAnalysis: null, stats: null });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const dropdownAnim = useRef(new Animated.Value(0)).current;

  // Dynamic styles based on accessibility settings
  const dynamicStyles = useMemo(() => ({
    safeArea: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1, backgroundColor: colors.background },
    loadingContainer: { flex: 1, backgroundColor: colors.background, justifyContent: 'center' as const, alignItems: 'center' as const },
    greeting: { fontSize: fontSizes.base, color: colors.textSecondary },
    name: { fontSize: fontSizes.xl, fontWeight: FontWeights.bold, color: colors.text },
    sectionTitle: { fontSize: fontSizes.lg, fontWeight: FontWeights.bold, color: colors.text, marginBottom: Spacing.base },
    scoreLabel: { fontSize: fontSizes.base, fontWeight: FontWeights.semibold, color: colors.text },
    scoreNumber: { fontSize: fontSizes['3xl'], fontWeight: FontWeights.bold, color: colors.primary },
    headerButton: {
      width: 40, height: 40, borderRadius: BorderRadius.base,
      backgroundColor: colors.surface, alignItems: 'center' as const, justifyContent: 'center' as const,
      borderWidth: 1, borderColor: colors.border, ...Shadows.sm,
    },
    dropdown: {
      position: 'absolute' as const, top: 70, right: Spacing.xl,
      backgroundColor: colors.surface, borderRadius: BorderRadius.lg,
      paddingVertical: Spacing.sm, minWidth: 180, ...Shadows.lg, zIndex: 1000,
      borderWidth: 1, borderColor: colors.border,
    },
    dropdownItemText: { fontSize: fontSizes.base, fontWeight: FontWeights.medium, color: colors.text },
    metricLabel: { fontSize: fontSizes.sm, color: colors.textSecondary },
    actionCard: {
      width: '47%' as any, backgroundColor: colors.surface,
      borderRadius: BorderRadius.lg, padding: Spacing.lg,
      borderWidth: 1, borderColor: colors.border, alignItems: 'center' as const, ...Shadows.sm,
    },
    actionLabel: { fontSize: fontSizes.sm, fontWeight: FontWeights.medium, color: colors.text },
    insightText: { flex: 1, fontSize: fontSizes.sm, color: colors.textSecondary, lineHeight: 20 },
    noAnalysisText: { fontSize: fontSizes.lg, fontWeight: FontWeights.semibold, color: colors.textSecondary, marginTop: Spacing.md },
    noAnalysisHint: { fontSize: fontSizes.sm, color: colors.textTertiary, marginTop: Spacing.xs, textAlign: 'center' as const },
  }), [colors, fontSizes]);

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

  // Show guided tour on first login
  useEffect(() => {
    if (needsGuidedTour()) {
      // Delay slightly to let the UI settle
      const timer = setTimeout(() => setShowTour(true), 500);
      return () => clearTimeout(timer);
    }
  }, [needsGuidedTour]);

  // Dropdown animation - respects reduceMotion
  useEffect(() => {
    Animated.timing(dropdownAnim, {
      toValue: showDropdown ? 1 : 0,
      duration: getAnimDuration(200),
      useNativeDriver: true,
    }).start();
  }, [showDropdown, dropdownAnim, getAnimDuration]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleTourComplete = useCallback(() => {
    setShowTour(false);
    markGuidedTourComplete();
  }, [markGuidedTourComplete]);

  const handleLogout = useCallback(async () => {
    setShowDropdown(false);
    await logout();
  }, [logout]);

  const dropdownItems: DropdownMenuItem[] = [
    {
      id: 'accessibility',
      label: t.accessibility.title,
      icon: 'accessibility-outline',
      action: () => {
        setShowDropdown(false);
        openAccessibilityPanel();
      },
    },
    {
      id: 'subscription',
      label: t.settings.premiumMember,
      icon: 'diamond-outline',
      action: () => {
        setShowDropdown(false);
        navigation.navigate('Subscription');
      },
    },
    {
      id: 'profile',
      label: t.nav.profile,
      icon: 'person-outline',
      action: () => {
        setShowDropdown(false);
        navigation.navigate('Profile');
      },
    },
    {
      id: 'logout',
      label: t.nav.logout,
      icon: 'log-out-outline',
      color: Colors.error,
      action: handleLogout,
    },
  ];

  const skinScore = data.latestAnalysis?.healthScore ?? 0;
  const skinAge = data.latestAnalysis?.skinAge ?? null;
  const userAge = user?.age ?? 28;
  
  const detailedAnalysis = data.latestAnalysis?.results?.detailedAnalysis;
  const metrics = detailedAnalysis ? [
    { label: t.dashboard.hydration, value: detailedAnalysis.hydration?.score ?? 0, color: '#06B6D4' },
    { label: t.dashboard.texture, value: detailedAnalysis.texture?.score ?? 0, color: '#8B5CF6' },
    { label: t.dashboard.skinMetrics, value: detailedAnalysis.elasticity?.score ?? 0, color: '#F59E0B' },
    { label: 'Pores', value: detailedAnalysis.pores?.score ?? 0, color: '#10B981' },
  ] : [
    { label: t.dashboard.hydration, value: 0, color: '#06B6D4' },
    { label: t.dashboard.texture, value: 0, color: '#8B5CF6' },
    { label: t.dashboard.skinMetrics, value: 0, color: '#F59E0B' },
    { label: 'Pores', value: 0, color: '#10B981' },
  ];

  const quickActions = [
    { icon: 'scan-outline' as const, label: t.dashboard.newAnalysis, screen: 'Analysis', gradient: Gradients.primary },
    { icon: 'calendar-outline' as const, label: t.dashboard.myRoutine, screen: 'Routine', gradient: Gradients.accent },
    { icon: 'chatbubble-outline' as const, label: t.dashboard.aiCoach, screen: 'Chat', gradient: Gradients.purple },
    { icon: 'trending-up-outline' as const, label: t.dashboard.healthEvolution, screen: 'Evolution', gradient: Gradients.success },
  ];

  const greeting = getGreeting(t);
  const userName = user?.firstName || user?.username || t.common.user;

  if (loading) {
    return (
      <SafeAreaView style={dynamicStyles.loadingContainer}>
        <LoadingSpinner message={t.common.loading} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={dynamicStyles.safeArea}>
      <ScrollView 
        style={dynamicStyles.container} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={dynamicStyles.greeting}>{greeting} 👋</Text>
            <Text style={dynamicStyles.name}>{userName}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={dynamicStyles.headerButton}
              onPress={() => navigation.navigate('Notifications')}
              accessibilityLabel="Notifications"
            >
              <Ionicons name="notifications-outline" size={22} color={colors.text} />
              {unreadCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={[dynamicStyles.headerButton, showDropdown && { backgroundColor: colors.primaryLight + '20', borderColor: colors.primary }]}
              onPress={() => setShowDropdown(!showDropdown)}
              accessibilityLabel="Paramètres"
            >
              <Ionicons name="settings-outline" size={22} color={showDropdown ? colors.primary : colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings Dropdown */}
        {showDropdown && (
          <Animated.View 
            style={[
              dynamicStyles.dropdown,
              {
                opacity: dropdownAnim,
                transform: [{
                  translateY: dropdownAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-10, 0],
                  }),
                }],
              },
            ]}
          >
            {dropdownItems.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.dropdownItem,
                  { borderBottomColor: colors.border },
                  index === dropdownItems.length - 1 && styles.dropdownItemLast,
                ]}
                onPress={item.action}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={item.icon} 
                  size={20} 
                  color={item.color || colors.text} 
                />
                <Text style={[dynamicStyles.dropdownItemText, item.color && { color: item.color }]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}

        {/* Dropdown Overlay */}
        {showDropdown && (
          <Pressable 
            style={styles.dropdownOverlay} 
            onPress={() => setShowDropdown(false)}
          />
        )}

      {/* Weather Widget */}
      <View style={styles.weatherSection}>
        <WeatherWidget compact showAdvice={false} />
      </View>

      {/* Skin Health Score */}
      <Card variant="elevated" style={[styles.scoreCard, { backgroundColor: colors.surface }] as any}>
        <View style={styles.scoreHeader}>
          <Text style={dynamicStyles.scoreLabel}>{t.dashboard.skinHealth}</Text>
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
              <View style={[styles.scoreCircle, { borderColor: colors.primary }]}>
                <Text style={dynamicStyles.scoreNumber}>{skinScore}</Text>
                <Text style={[styles.scoreOutOf, { color: colors.textTertiary }]}>/100</Text>
              </View>
            </View>
            {skinAge && (
              <View style={styles.ageComparison}>
                <View style={styles.ageRow}>
                  <Text style={[styles.ageLabel, { color: colors.textSecondary }]}>{t.dashboard.realAge}</Text>
                  <View style={[styles.ageBar, { backgroundColor: colors.border }]}>
                    <View style={[styles.ageBarFill, { width: `${Math.min((userAge / 60) * 100, 100)}%`, backgroundColor: colors.primary }]} />
                  </View>
                  <Text style={[styles.ageValue, { color: colors.primary }]}>{userAge}</Text>
                </View>
                <View style={styles.ageRow}>
                  <Text style={[styles.ageLabel, { color: colors.textSecondary }]}>{t.dashboard.skinAge}</Text>
                  <View style={[styles.ageBar, { backgroundColor: colors.border }]}>
                    <View style={[styles.ageBarFill, { width: `${Math.min((skinAge / 60) * 100, 100)}%`, backgroundColor: skinAge <= userAge ? colors.success : colors.warning }]} />
                  </View>
                  <Text style={[styles.ageValue, { color: skinAge <= userAge ? colors.success : colors.warning }]}>{skinAge}</Text>
                </View>
              </View>
            )}
          </>
        ) : (
          <View style={styles.noAnalysis}>
            <Ionicons name="scan-outline" size={48} color={colors.textTertiary} />
            <Text style={dynamicStyles.noAnalysisText}>{t.dashboard.noActivity}</Text>
            <Text style={dynamicStyles.noAnalysisHint}>{t.dashboard.startAnalysis}</Text>
          </View>
        )}
      </Card>

      {/* Skin Metrics */}
      {skinScore > 0 && (
        <View style={styles.section}>
          <Text style={dynamicStyles.sectionTitle}>{t.dashboard.skinMetrics}</Text>
          {metrics.map((metric, index) => (
            <View key={index} style={styles.metricRow}>
              <View style={styles.metricHeader}>
                <Text style={dynamicStyles.metricLabel}>{metric.label}</Text>
                <Text style={[styles.metricValue, { color: metric.color }]}>{metric.value}%</Text>
              </View>
              <ProgressBar progress={metric.value} color={metric.color} height={6} />
            </View>
          ))}
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={dynamicStyles.sectionTitle}>Actions Rapides</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={dynamicStyles.actionCard}
              onPress={() => navigation.navigate(action.screen)}
              activeOpacity={0.7}
            >
              <LinearGradient colors={action.gradient} style={styles.actionIcon}>
                <Ionicons name={action.icon as any} size={24} color={Colors.white} />
              </LinearGradient>
              <Text style={dynamicStyles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Insights */}
      {data.latestAnalysis?.results?.recommendations && (
        <View style={styles.section}>
          <Text style={dynamicStyles.sectionTitle}>{t.dashboard.personalizedAdvice}</Text>
          <Card style={[styles.insightsCard, { backgroundColor: colors.surface }] as any}>
            <LinearGradient colors={Gradients.primary} style={styles.insightsIcon}>
              <Ionicons name="sparkles" size={20} color={Colors.white} />
            </LinearGradient>
            {data.latestAnalysis.results.recommendations.lifestyle.slice(0, 3).map((tip, index) => (
              <View key={index} style={styles.insightRow}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={dynamicStyles.insightText}>{tip}</Text>
              </View>
            ))}
          </Card>
        </View>
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
    
    {/* Guided Tour */}
    {showTour && (
      <GuidedTour
        forceShow={true}
        onComplete={handleTourComplete}
      />
    )}
    
    {/* Accessibility Panel */}
    <AccessibilityPanel />
    </SafeAreaView>
  );
}

function getGreeting(t: any): string {
  const hour = new Date().getHours();
  if (hour < 12) return t.dashboard.greeting.morning;
  if (hour < 18) return t.dashboard.greeting.afternoon;
  return t.dashboard.greeting.evening;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.gray50 },
  container: { flex: 1, backgroundColor: Colors.gray50 },
  loadingContainer: { flex: 1, backgroundColor: Colors.gray50, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.md,
    zIndex: 100,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.base,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.gray200,
    ...Shadows.sm,
  },
  headerButtonActive: {
    backgroundColor: Colors.primaryAlpha10,
    borderColor: Colors.primary,
  },
  greeting: { fontSize: FontSizes.base, color: Colors.gray500 },
  name: { fontSize: FontSizes.xl, fontWeight: FontWeights.bold, color: Colors.gray900 },
  notifBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notifBadgeText: {
    fontSize: 10,
    fontWeight: FontWeights.bold,
    color: Colors.white,
  },
  // Dropdown styles
  dropdown: {
    position: 'absolute',
    top: 70,
    right: Spacing.xl,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm,
    minWidth: 180,
    ...Shadows.lg,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: Colors.gray100,
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: -1000,
    zIndex: 99,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  dropdownItemLast: {
    borderBottomWidth: 0,
  },
  dropdownItemText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.medium,
    color: Colors.gray700,
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
