import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, Badge, ProgressBar } from '../../components';
import { Colors, Gradients, Spacing, BorderRadius, FontSizes, FontWeights, Shadows } from '../../theme';

export function DashboardScreen({ navigation }: any) {
  // Mock data for template
  const skinScore = 78;
  const metrics = [
    { label: 'Hydration', value: 72, color: '#06B6D4' },
    { label: 'Texture', value: 85, color: '#8B5CF6' },
    { label: 'Elasticity', value: 68, color: '#F59E0B' },
    { label: 'Clarity', value: 90, color: '#10B981' },
  ];

  const quickActions = [
    { icon: 'scan-outline' as const, label: 'New Analysis', screen: 'Analysis', gradient: Gradients.primary },
    { icon: 'calendar-outline' as const, label: 'My Routine', screen: 'Routine', gradient: Gradients.accent },
    { icon: 'chatbubble-outline' as const, label: 'AI Coach', screen: 'Chat', gradient: Gradients.purple },
    { icon: 'trending-up-outline' as const, label: 'Evolution', screen: 'Evolution', gradient: Gradients.success },
  ];

  const recentActivity = [
    { icon: 'checkmark-circle' as const, text: 'Morning routine completed', time: '2h ago', color: Colors.success },
    { icon: 'scan' as const, text: 'Skin analysis performed', time: '1d ago', color: Colors.primary },
    { icon: 'chatbubble' as const, text: 'AI coach session', time: '2d ago', color: Colors.purple },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good Morning! 👋</Text>
          <Text style={styles.name}>Welcome back</Text>
        </View>
        <TouchableOpacity style={styles.notifButton}>
          <Ionicons name="notifications-outline" size={24} color={Colors.gray700} />
          <View style={styles.notifBadge} />
        </TouchableOpacity>
      </View>

      {/* Skin Health Score */}
      <Card variant="elevated" style={styles.scoreCard}>
        <View style={styles.scoreHeader}>
          <Text style={styles.scoreLabel}>Skin Health Score</Text>
          <Badge text="+5 this week" variant="success" />
        </View>
        <View style={styles.scoreCircleContainer}>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreNumber}>{skinScore}</Text>
            <Text style={styles.scoreOutOf}>/100</Text>
          </View>
        </View>
        <View style={styles.ageComparison}>
          <View style={styles.ageRow}>
            <Text style={styles.ageLabel}>Real Age</Text>
            <View style={styles.ageBar}>
              <View style={[styles.ageBarFill, { width: '65%', backgroundColor: Colors.primary }]} />
            </View>
            <Text style={styles.ageValue}>28</Text>
          </View>
          <View style={styles.ageRow}>
            <Text style={styles.ageLabel}>Skin Age</Text>
            <View style={styles.ageBar}>
              <View style={[styles.ageBarFill, { width: '55%', backgroundColor: Colors.success }]} />
            </View>
            <Text style={[styles.ageValue, { color: Colors.success }]}>24</Text>
          </View>
        </View>
      </Card>

      {/* Skin Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Skin Metrics</Text>
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

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
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

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <Card style={styles.activityCard}>
          {recentActivity.map((activity, index) => (
            <View key={index} style={[styles.activityRow, index < recentActivity.length - 1 ? styles.activityRowBorder : undefined]}>
              <View style={[styles.activityIcon, { backgroundColor: activity.color + '20' }]}>
                <Ionicons name={activity.icon as any} size={18} color={activity.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.activityText}>{activity.text}</Text>
                <Text style={styles.activityTime}>{activity.time}</Text>
              </View>
            </View>
          ))}
        </Card>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray50 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingTop: 60, paddingBottom: Spacing.xl,
  },
  greeting: { fontSize: FontSizes.base, color: Colors.gray500 },
  name: { fontSize: FontSizes.xl, fontWeight: FontWeights.bold, color: Colors.gray900 },
  notifButton: { position: 'relative', padding: Spacing.sm },
  notifBadge: {
    position: 'absolute', top: 6, right: 6,
    width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.error,
  },
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
  activityCard: { padding: 0 },
  activityRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.base,
  },
  activityRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  activityIcon: {
    width: 36, height: 36, borderRadius: BorderRadius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  activityText: { fontSize: FontSizes.sm, color: Colors.gray700 },
  activityTime: { fontSize: FontSizes.xs, color: Colors.gray400, marginTop: 2 },
});
