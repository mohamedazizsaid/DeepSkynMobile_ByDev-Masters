import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Badge } from '../../components';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights } from '../../theme';

export function EvolutionScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState('1M');
  const periods = ['1W', '1M', '3M', '6M', '1Y'];

  const summaryCards = [
    { label: 'Overall', value: '+8%', trend: 'up', color: Colors.primary },
    { label: 'Hydration', value: '+12%', trend: 'up', color: '#06B6D4' },
    { label: 'Texture', value: '+5%', trend: 'up', color: '#8B5CF6' },
    { label: 'Wrinkles', value: '-3%', trend: 'down', color: '#F59E0B' },
  ];

  const timeline = [
    { date: 'Feb 10', score: 82, change: '+2' },
    { date: 'Feb 3', score: 80, change: '+1' },
    { date: 'Jan 27', score: 79, change: '+3' },
    { date: 'Jan 20', score: 76, change: '+1' },
    { date: 'Jan 13', score: 75, change: '-1' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Evolution</Text>
        <Text style={styles.subtitle}>Track your skin progress over time</Text>
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

      {/* Chart Placeholder */}
      <Card variant="elevated" style={styles.chartCard}>
        <Text style={styles.chartTitle}>Score Evolution</Text>
        <View style={styles.chartPlaceholder}>
          <Ionicons name="analytics-outline" size={48} color={Colors.gray300} />
          <Text style={styles.chartPlaceholderText}>Chart visualization</Text>
        </View>
      </Card>

      {/* Timeline */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Analysis Timeline</Text>
        {timeline.map((item, index) => (
          <Card key={index} style={styles.timelineCard}>
            <View style={styles.timelineRow}>
              <View>
                <Text style={styles.timelineDate}>{item.date}</Text>
                <Text style={styles.timelineScore}>Score: {item.score}</Text>
              </View>
              <Badge
                text={item.change}
                variant={item.change.startsWith('+') ? 'success' : 'error'}
                size="md"
              />
            </View>
          </Card>
        ))}
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray50 },
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },
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
  timelineRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timelineDate: { fontSize: FontSizes.base, fontWeight: FontWeights.medium, color: Colors.gray900 },
  timelineScore: { fontSize: FontSizes.sm, color: Colors.gray500, marginTop: 2 },
});
