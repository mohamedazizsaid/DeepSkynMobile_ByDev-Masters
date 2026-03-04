import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, Badge } from '../../components';
import { Colors, Gradients, Spacing, BorderRadius, FontSizes, FontWeights, Shadows } from '../../theme';

export function RoutineScreen() {
  const [activeTab, setActiveTab] = useState<'morning' | 'evening'>('morning');

  const morningRoutine = [
    { order: 1, name: 'Gentle Cleanser', type: 'Cleanser', duration: '60 sec', icon: 'water-outline' },
    { order: 2, name: 'Vitamin C Serum', type: 'Serum', duration: '30 sec', icon: 'flask-outline' },
    { order: 3, name: 'Hyaluronic Acid', type: 'Moisturizer', duration: '30 sec', icon: 'water-outline' },
    { order: 4, name: 'SPF 50+ Sunscreen', type: 'Sunscreen', duration: '45 sec', icon: 'sunny-outline' },
  ];

  const eveningRoutine = [
    { order: 1, name: 'Oil Cleanser', type: 'Cleanser', duration: '90 sec', icon: 'water-outline' },
    { order: 2, name: 'Gentle Cleanser', type: 'Cleanser', duration: '60 sec', icon: 'water-outline' },
    { order: 3, name: 'Retinol Serum', type: 'Treatment', duration: '30 sec', icon: 'flask-outline' },
    { order: 4, name: 'Night Cream', type: 'Moisturizer', duration: '45 sec', icon: 'moon-outline' },
  ];

  const routine = activeTab === 'morning' ? morningRoutine : eveningRoutine;

  const streakDays = [
    true, true, true, false, true, true, true,
    true, true, false, true, true, true, true,
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>My Routine</Text>
        <Text style={styles.subtitle}>Personalized skincare steps</Text>
      </View>

      {/* AM/PM Toggle */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'morning' ? styles.tabActive : undefined]}
          onPress={() => setActiveTab('morning')}
        >
          <LinearGradient
            colors={activeTab === 'morning' ? Gradients.morning : [Colors.white, Colors.white]}
            style={styles.tabGradient}
          >
            <Ionicons name="sunny" size={20} color={activeTab === 'morning' ? Colors.white : Colors.gray400} />
            <Text style={[styles.tabText, activeTab === 'morning' ? styles.tabTextActive : undefined]}>Morning</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'evening' ? styles.tabActive : undefined]}
          onPress={() => setActiveTab('evening')}
        >
          <LinearGradient
            colors={activeTab === 'evening' ? Gradients.evening : [Colors.white, Colors.white]}
            style={styles.tabGradient}
          >
            <Ionicons name="moon" size={20} color={activeTab === 'evening' ? Colors.white : Colors.gray400} />
            <Text style={[styles.tabText, activeTab === 'evening' ? styles.tabTextActive : undefined]}>Evening</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Routine Steps */}
      <View style={styles.section}>
        {routine.map((step, index) => (
          <Card key={index} style={styles.stepCard}>
            <View style={styles.stepRow}>
              <View style={styles.stepOrder}>
                <Text style={styles.stepOrderText}>{step.order}</Text>
              </View>
              <View style={styles.stepInfo}>
                <Text style={styles.stepName}>{step.name}</Text>
                <View style={styles.stepMeta}>
                  <Badge text={step.type} variant="primary" />
                  <Text style={styles.stepDuration}>
                    <Ionicons name="time-outline" size={12} color={Colors.gray400} /> {step.duration}
                  </Text>
                </View>
              </View>
              <Ionicons name={step.icon as any} size={24} color={Colors.gray400} />
            </View>
          </Card>
        ))}
      </View>

      {/* Pro Tips */}
      <View style={styles.section}>
        <Card style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb-outline" size={20} color={Colors.amber} />
            <Text style={styles.tipsTitle}>Pro Tips</Text>
          </View>
          <Text style={styles.tipsText}>
            Always wait 30 seconds between applying serums for better absorption. Apply products from thinnest to thickest consistency.
          </Text>
        </Card>
      </View>

      {/* 14-Day Streak */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>14-Day Streak</Text>
        <Card style={styles.streakCard}>
          <View style={styles.streakGrid}>
            {streakDays.map((done, index) => (
              <View
                key={index}
                style={[
                  styles.streakDay,
                  done ? styles.streakDayDone : styles.streakDayMissed,
                ]}
              >
                {done ? (
                  <Ionicons name="checkmark" size={14} color={Colors.white} />
                ) : (
                  <Ionicons name="close" size={14} color={Colors.error} />
                )}
              </View>
            ))}
          </View>
          <Text style={styles.streakText}>10/14 days completed</Text>
        </Card>
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
  tabContainer: { flexDirection: 'row', gap: Spacing.md, paddingHorizontal: Spacing.xl, marginTop: Spacing.xl },
  tab: { flex: 1, borderRadius: BorderRadius.base, overflow: 'hidden' },
  tabActive: {},
  tabGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: Spacing.md, borderRadius: BorderRadius.base,
  },
  tabText: { fontSize: FontSizes.base, fontWeight: FontWeights.semibold, color: Colors.gray400 },
  tabTextActive: { color: Colors.white },
  section: { paddingHorizontal: Spacing.xl, marginTop: Spacing.xl },
  sectionTitle: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.gray900, marginBottom: Spacing.base },
  stepCard: { marginBottom: Spacing.md, padding: Spacing.base },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  stepOrder: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.primaryAlpha10, alignItems: 'center', justifyContent: 'center',
  },
  stepOrderText: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold, color: Colors.primary },
  stepInfo: { flex: 1 },
  stepName: { fontSize: FontSizes.base, fontWeight: FontWeights.medium, color: Colors.gray900, marginBottom: Spacing.xs },
  stepMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  stepDuration: { fontSize: FontSizes.xs, color: Colors.gray400 },
  tipsCard: { backgroundColor: Colors.warningAlpha10, borderColor: Colors.amber },
  tipsHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  tipsTitle: { fontSize: FontSizes.base, fontWeight: FontWeights.bold, color: Colors.amber },
  tipsText: { fontSize: FontSizes.sm, color: Colors.gray700, lineHeight: 20 },
  streakCard: { padding: Spacing.xl, alignItems: 'center' },
  streakGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, justifyContent: 'center', marginBottom: Spacing.md },
  streakDay: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  streakDayDone: { backgroundColor: Colors.success },
  streakDayMissed: { backgroundColor: Colors.errorAlpha10 },
  streakText: { fontSize: FontSizes.sm, color: Colors.gray500, fontWeight: FontWeights.medium },
});
