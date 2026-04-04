import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Animated, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Card, Badge, Button, ProgressBar, WeatherWidget, LoadingSpinner } from '../../components';
import { GuidedTour } from '../../components/tour/GuidedTour';
import { Colors, Gradients, Spacing, BorderRadius, FontSizes, FontWeights, Shadows } from '../../theme';
import { useAuthStore } from '../../stores/auth.store';
import { useNotificationStore } from '../../stores/notification.store';
import { useAccessibilityStore } from '../../stores/accessibility.store';
import { useAccessibilityStyles } from '../../stores/useAccessibilityStyles';
import { useTranslation } from '../../lib/i18n';
import { analysisService } from '../../services/analysis.service';
import type { Analysis, AnalysisStats } from '../../lib/types';

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
  const { colors, fontSizes, getAnimDuration, settings } = useAccessibilityStyles();
  const { t } = useTranslation();
  const [data, setData] = useState<DashboardData>({ latestAnalysis: null, stats: null });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const dropdownAnim = useRef(new Animated.Value(0)).current;
  const swipeHintAnim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const swipeOpacityAnim = useRef(new Animated.Value(1)).current;
  const isNavigatingFromSwipe = useRef(false);

  // Dynamic styles based on accessibility settings
  const dynamicStyles = useMemo(() => ({
    safeArea: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1, backgroundColor: colors.background },
    loadingContainer: { flex: 1, backgroundColor: colors.background, justifyContent: 'center' as const, alignItems: 'center' as const },
    headerCard: {
      marginHorizontal: Spacing.xl,
      marginTop: Spacing.md,
      marginBottom: Spacing.md,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderRadius: 28,
      overflow: 'hidden' as const,
      ...Shadows.lg,
    },
    profileRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: Spacing.md,
      flex: 1,
    },
    avatarFallback: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    avatarInitials: {
      fontSize: fontSizes.base,
      fontWeight: FontWeights.bold,
      color: Colors.white,
    },
    greeting: { fontSize: fontSizes.base, color: 'rgba(255,255,255,0.9)' },
    name: { fontSize: fontSizes.xl, fontWeight: FontWeights.bold, color: Colors.white },
    userMeta: { fontSize: fontSizes.xs, color: 'rgba(255,255,255,0.86)', marginTop: 2 },
    sectionTitle: { fontSize: fontSizes.lg, fontWeight: FontWeights.bold, color: colors.text, marginBottom: Spacing.base },
    scoreLabel: { fontSize: fontSizes.base, fontWeight: FontWeights.semibold, color: colors.text },
    scoreNumber: { fontSize: fontSizes['3xl'], fontWeight: FontWeights.bold, color: colors.primary },
    headerButton: {
      width: 40, height: 40, borderRadius: BorderRadius.base,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.4)',
      ...Shadows.sm,
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
    communityCard: {
      padding: Spacing.lg,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      ...Shadows.md,
    },
    communityBadge: {
      alignSelf: 'flex-start' as const,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 4,
      borderRadius: BorderRadius.full,
      backgroundColor: colors.primary + '15',
      marginBottom: Spacing.sm,
    },
    communityBadgeText: {
      fontSize: fontSizes.xs,
      fontWeight: FontWeights.semibold,
      color: colors.primary,
    },
    communityHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      marginBottom: Spacing.sm,
    },
    communityTitle: {
      fontSize: fontSizes.lg,
      fontWeight: FontWeights.bold,
      color: colors.text,
      flex: 1,
      marginRight: Spacing.sm,
    },
    communityDescription: {
      fontSize: fontSizes.sm,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: Spacing.base,
    },
    communityMetaRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: Spacing.sm,
      marginBottom: Spacing.base,
    },
    communityMetaText: {
      fontSize: fontSizes.xs,
      color: colors.textTertiary,
      flex: 1,
    },
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

  // Swipe hint animation - premium loop
  useEffect(() => {
    if (!showSwipeHint) return;

    const sequence = Animated.sequence([
      // Pause before starting
      Animated.delay(300),
      // Swipe animation: right to left with elastic feel
      Animated.parallel([
        Animated.timing(swipeHintAnim.x, {
          toValue: -70,
          duration: getAnimDuration(1000),
          useNativeDriver: true,
        }),
        Animated.timing(swipeOpacityAnim, {
          toValue: 0.4,
          duration: getAnimDuration(1000),
          useNativeDriver: true,
        }),
      ]),
      // Hold
      Animated.delay(200),
      // Reset
      Animated.parallel([
        Animated.timing(swipeHintAnim.x, {
          toValue: 0,
          duration: getAnimDuration(300),
          useNativeDriver: true,
        }),
        Animated.timing(swipeOpacityAnim, {
          toValue: 1,
          duration: getAnimDuration(300),
          useNativeDriver: true,
        }),
      ]),
      // Repeat delay
      Animated.delay(600),
    ]);

    Animated.loop(sequence).start();

    // Auto-hide after 2 seconds
    const hideTimer = setTimeout(() => {
    }, 15000);

    return () => clearTimeout(hideTimer);
  }, [showSwipeHint, swipeHintAnim, swipeOpacityAnim, getAnimDuration]);

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

  const handleDashboardSwipe = useCallback((event: any) => {
    const { state, translationX, velocityX } = event.nativeEvent;

    if (state !== State.END || isNavigatingFromSwipe.current) {
      return;
    }

    const isStrongLeftSwipe = translationX < -90 && velocityX < -500;
    const isLongLeftSwipe = translationX < -150;

    if (isStrongLeftSwipe || isLongLeftSwipe) {
      isNavigatingFromSwipe.current = true;
      setShowSwipeHint(false); // Hide hint on swipe
      navigation.navigate('Community');

      setTimeout(() => {
        isNavigatingFromSwipe.current = false;
      }, 350);
    }
  }, [navigation]);

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
    }
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
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();
  const userName = fullName || user?.name || user?.username || t.common.user;
  const userEmail = user?.email || '';
  const userInitials = userName
    .split(' ')
    .filter(Boolean)
    .map((name: string) => name[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (loading) {
    return (
      <SafeAreaView style={dynamicStyles.loadingContainer} edges={['left', 'right', 'bottom']}>
        <LoadingSpinner message={t.common.loading} />
      </SafeAreaView>
    );
  }

  return (
    <PanGestureHandler
      onHandlerStateChange={handleDashboardSwipe}
      activeOffsetX={[-20, 20]}
      failOffsetY={[-12, 12]}
    >
      <SafeAreaView style={dynamicStyles.safeArea} edges={['left', 'right', 'bottom']}>
        <ScrollView 
          style={dynamicStyles.container} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
        >
        {/* Header */}
        <LinearGradient colors={Gradients.primary} style={[styles.header, dynamicStyles.headerCard]}>
          <View style={styles.headerGlow} />
          <View style={dynamicStyles.profileRow}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
            ) : (
              <LinearGradient colors={Gradients.purple} style={dynamicStyles.avatarFallback}>
                <Text style={dynamicStyles.avatarInitials}>{userInitials}</Text>
              </LinearGradient>
            )}
            <View style={{ flex: 1 }}>
            <Text style={dynamicStyles.greeting}>{greeting} 👋</Text>
            <Text style={dynamicStyles.name}>{userName}</Text>
            {!!userEmail && <Text style={dynamicStyles.userMeta}>{userEmail}</Text>}
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={dynamicStyles.headerButton}
              onPress={() => navigation.navigate('Notifications')}
              accessibilityLabel={t.notificationsScreen.title}
            >
              <Ionicons name="notifications" size={21} color={Colors.white} />
              {unreadCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={dynamicStyles.headerButton}
              onPress={() => navigation.navigate('Settings')}
              accessibilityLabel={t.settings.title}
            >
              <Ionicons name="settings" size={21} color={Colors.white} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[dynamicStyles.headerButton, showDropdown && { backgroundColor: 'rgba(255,255,255,0.3)', borderColor: Colors.white }]}
              onPress={() => setShowDropdown(!showDropdown)}
              accessibilityLabel="Paramètres"
            >
              <Ionicons name="grid" size={21} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Swipe Hint Indicator - Premium */}
        {showSwipeHint && (
          <Animated.View
            style={[
              styles.swipeHintContainer,
              { opacity: swipeOpacityAnim },
            ]}
            pointerEvents="none"
          >
            <View style={[styles.swipeHintBadge, { borderColor: colors.primary + '30' }]}>
              <View style={styles.swipeHintContent}>
                <Text style={[styles.swipeHintLabel, { color: colors.primary }]}>
                  {t.nav.community || 'Communauté'}
                </Text>
                <Animated.View
                  style={[
                    styles.swipeArrow,
                    { 
                      transform: [
                        { translateX: swipeHintAnim.x },
                        { scaleX: swipeOpacityAnim.interpolate({
                          inputRange: [0.4, 1],
                          outputRange: [0.7, 1],
                        }) }
                      ] 
                    },
                  ]}
                >
                  <Ionicons name="arrow-back" size={16} color={colors.primary} />
                </Animated.View>
              </View>
            </View>
          </Animated.View>
        )}

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
        <Text style={dynamicStyles.sectionTitle}>{t.nav.community || 'Communaute'}</Text>
        <Card variant="elevated" style={dynamicStyles.communityCard as any}>
          <View style={dynamicStyles.communityBadge}>
            <Text style={dynamicStyles.communityBadgeText}>{t.dashboard.communityAction || 'Nouveau'}</Text>
          </View>

          <View style={dynamicStyles.communityHeader}>
            <Text style={dynamicStyles.communityTitle}>
              {t.community?.suggestionsForYou || 'Rejoignez la communaute DeepSkyn'}
            </Text>
            <LinearGradient colors={Gradients.primary} style={styles.communityIconWrap}>
              <Ionicons name="people-outline" size={20} color={Colors.white} />
            </LinearGradient>
          </View>

          <Text style={dynamicStyles.communityDescription}>
            {t.community?.skinEnthusiasts || 'Partagez vos routines, obtenez des retours et decouvrez des conseils adaptes a votre profil.'}
          </Text>

          <View style={dynamicStyles.communityMetaRow}>
            <Ionicons name="sparkles-outline" size={14} color={colors.primary} />
            <Text style={dynamicStyles.communityMetaText}>
              {t.dashboard.personalizedAdvice || 'Conseils personnalises et interactions utiles'}
            </Text>
          </View>

          <Button onPress={() => navigation.navigate('Community')} fullWidth>
            {t.nav.community || 'Acceder a la communaute'}
          </Button>
        </Card>
      </View>

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
      </SafeAreaView>
    </PanGestureHandler>
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
  headerGlow: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    right: -25,
    top: -25,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
  communityIconWrap: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  swipeHintContainer: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
  },
  swipeHintBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.md,
  },
  swipeHintContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    width: '100%',
    justifyContent: 'space-between',
  },
  swipeHintLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    letterSpacing: 0.3,
  },
  swipeArrow: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
