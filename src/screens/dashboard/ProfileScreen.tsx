import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, Button, Input, Badge } from '../../components';
import { Colors, Gradients, Spacing, BorderRadius, FontSizes, FontWeights } from '../../theme';

export function ProfileScreen() {
  const user = {
    name: 'John Doe',
    email: 'john@example.com',
    age: '28',
    gender: 'Male',
    location: 'Paris, France',
    initials: 'JD',
  };

  const stats = [
    { label: 'Analyses', value: '12' },
    { label: 'Streak', value: '10 days' },
    { label: 'Score', value: '82' },
  ];

  const skinProfile = [
    { label: 'Skin Type', value: 'Combination' },
    { label: 'Fitzpatrick', value: 'Type III' },
    { label: 'Concerns', value: 'Acne, Dryness' },
  ];

  const recentActivity = [
    { text: 'Morning routine completed', time: '2h ago', color: Colors.success, icon: 'checkmark-circle' },
    { text: 'Skin analysis performed', time: '1d ago', color: Colors.primary, icon: 'scan' },
    { text: 'Profile updated', time: '3d ago', color: Colors.amber, icon: 'person' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Avatar Section */}
      <View style={styles.avatarSection}>
        <LinearGradient colors={Gradients.primary} style={styles.avatar}>
          <Text style={styles.avatarText}>{user.initials}</Text>
        </LinearGradient>
        <TouchableOpacity style={styles.cameraButton}>
          <Ionicons name="camera" size={16} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statItem}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Skin Profile Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Skin Profile</Text>
        <Card style={styles.profileCard}>
          {skinProfile.map((item, index) => (
            <View key={index} style={[styles.profileRow, index < skinProfile.length - 1 ? styles.profileRowBorder : undefined]}>
              <Text style={styles.profileLabel}>{item.label}</Text>
              <Text style={styles.profileValue}>{item.value}</Text>
            </View>
          ))}
        </Card>
      </View>

      {/* Personal Info Form */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <Card variant="elevated" style={styles.formCard}>
          <Input label="Full Name" value={user.name} editable={false} icon={<Ionicons name="person-outline" size={20} color={Colors.gray400} />} />
          <Input label="Email" value={user.email} editable={false} icon={<Ionicons name="mail-outline" size={20} color={Colors.gray400} />} />
          <View style={styles.formRow}>
            <View style={{ flex: 1 }}>
              <Input label="Age" value={user.age} editable={false} icon={<Ionicons name="calendar-outline" size={20} color={Colors.gray400} />} />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Gender" value={user.gender} editable={false} icon={<Ionicons name="people-outline" size={20} color={Colors.gray400} />} />
            </View>
          </View>
          <Input label="Location" value={user.location} editable={false} icon={<Ionicons name="location-outline" size={20} color={Colors.gray400} />} />
          <Button onPress={() => {}} fullWidth>
            Edit Profile
          </Button>
        </Card>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Activity History</Text>
        <Card>
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
  avatarSection: { alignItems: 'center', paddingTop: Spacing['2xl'] },
  avatar: {
    width: 96, height: 96, borderRadius: 48,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: FontSizes['2xl'], fontWeight: FontWeights.bold, color: Colors.white },
  cameraButton: {
    position: 'absolute', top: Spacing['2xl'] + 68, right: '38%',
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: Colors.white,
  },
  userName: { fontSize: FontSizes.xl, fontWeight: FontWeights.bold, color: Colors.gray900, marginTop: Spacing.md },
  userEmail: { fontSize: FontSizes.sm, color: Colors.gray500 },
  statsRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingVertical: Spacing.xl, marginHorizontal: Spacing.xl,
    borderBottomWidth: 1, borderBottomColor: Colors.gray200,
  },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: FontSizes.xl, fontWeight: FontWeights.bold, color: Colors.primary },
  statLabel: { fontSize: FontSizes.xs, color: Colors.gray500, marginTop: 2 },
  section: { paddingHorizontal: Spacing.xl, marginTop: Spacing.xl },
  sectionTitle: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.gray900, marginBottom: Spacing.base },
  profileCard: { padding: 0 },
  profileRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  profileRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  profileLabel: { fontSize: FontSizes.sm, color: Colors.gray500 },
  profileValue: { fontSize: FontSizes.sm, fontWeight: FontWeights.medium, color: Colors.gray900 },
  formCard: { padding: Spacing.xl },
  formRow: { flexDirection: 'row', gap: Spacing.md },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.base },
  activityRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  activityIcon: {
    width: 36, height: 36, borderRadius: BorderRadius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  activityText: { fontSize: FontSizes.sm, color: Colors.gray700 },
  activityTime: { fontSize: FontSizes.xs, color: Colors.gray400, marginTop: 2 },
});
