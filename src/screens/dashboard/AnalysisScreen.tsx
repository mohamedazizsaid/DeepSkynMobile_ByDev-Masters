import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Badge, ProgressBar, Button } from '../../components';
import { Colors, Gradients, Spacing, BorderRadius, FontSizes, FontWeights } from '../../theme';

export function AnalysisScreen() {
  const overallScore = 82;

  const categories = [
    { label: 'Hydration', score: 75, status: 'Good', color: '#06B6D4' },
    { label: 'Texture', score: 88, status: 'Excellent', color: '#8B5CF6' },
    { label: 'Wrinkles', score: 65, status: 'Fair', color: '#F59E0B' },
    { label: 'Elasticity', score: 70, status: 'Good', color: '#10B981' },
    { label: 'Dark Spots', score: 90, status: 'Excellent', color: '#EC4899' },
    { label: 'Pores', score: 72, status: 'Good', color: '#6366F1' },
  ];

  const insights = [
    'Your hydration levels have improved by 12% this month.',
    'Consider using SPF 50+ sunscreen for better protection.',
    'Your evening routine is showing positive results on texture.',
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Skin Analysis</Text>
          <Text style={styles.subtitle}>Last analyzed: Today</Text>
        </View>

        {/* Overall Score */}
        <Card variant="elevated" style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Overall Score</Text>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreNumber}>{overallScore}</Text>
            <Text style={styles.scoreMax}>/100</Text>
          </View>
          <Badge text="Great condition" variant="success" size="md" />
        </Card>

        {/* Detailed Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detailed Breakdown</Text>
          {categories.map((cat, index) => (
            <Card key={index} style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryLeft}>
                  <View style={[styles.categoryDot, { backgroundColor: cat.color }]} />
                  <Text style={styles.categoryLabel}>{cat.label}</Text>
                </View>
                <View style={styles.categoryRight}>
                  <Text style={[styles.categoryScore, { color: cat.color }]}>{cat.score}%</Text>
                  <Badge text={cat.status} variant={cat.score >= 80 ? 'success' : cat.score >= 60 ? 'warning' : 'error'} />
                </View>
              </View>
              <ProgressBar progress={cat.score} color={cat.color} height={6} />
            </Card>
          ))}
        </View>

        {/* AI Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Insights</Text>
          <Card style={styles.insightsCard}>
            <LinearGradient colors={Gradients.primary} style={styles.insightsIcon}>
              <Ionicons name="sparkles" size={24} color={Colors.white} />
            </LinearGradient>
            {insights.map((insight, index) => (
              <View key={index} style={styles.insightRow}>
                <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
                <Text style={styles.insightText}>{insight}</Text>
              </View>
            ))}
          </Card>
        </View>

        {/* Upload New Photo */}
        <View style={styles.section}>
          <Button onPress={() => { }} fullWidth size="lg">
            New Analysis
          </Button>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.white },
  container: { flex: 1, backgroundColor: Colors.gray50 },
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },
  title: { fontSize: FontSizes['2xl'], fontWeight: FontWeights.bold, color: Colors.gray900 },
  subtitle: { fontSize: FontSizes.sm, color: Colors.gray500, marginTop: Spacing.xs },
  scoreCard: {
    marginHorizontal: Spacing.xl, marginTop: Spacing.xl,
    padding: Spacing['2xl'], alignItems: 'center',
  },
  scoreLabel: { fontSize: FontSizes.base, color: Colors.gray500, marginBottom: Spacing.md },
  scoreCircle: {
    width: 130, height: 130, borderRadius: 65,
    borderWidth: 6, borderColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
  },
  scoreNumber: { fontSize: FontSizes['4xl'], fontWeight: FontWeights.bold, color: Colors.primary },
  scoreMax: { fontSize: FontSizes.sm, color: Colors.gray400 },
  section: { paddingHorizontal: Spacing.xl, marginTop: Spacing['2xl'] },
  sectionTitle: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.gray900, marginBottom: Spacing.base },
  categoryCard: { marginBottom: Spacing.md, padding: Spacing.base },
  categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  categoryLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  categoryDot: { width: 10, height: 10, borderRadius: 5 },
  categoryLabel: { fontSize: FontSizes.base, fontWeight: FontWeights.medium, color: Colors.gray700 },
  categoryRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  categoryScore: { fontSize: FontSizes.base, fontWeight: FontWeights.bold },
  insightsCard: { padding: Spacing.xl },
  insightsIcon: {
    width: 48, height: 48, borderRadius: BorderRadius.base,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl,
  },
  insightRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.md },
  insightText: { fontSize: FontSizes.sm, color: Colors.gray700, flex: 1, lineHeight: 20 },
});
