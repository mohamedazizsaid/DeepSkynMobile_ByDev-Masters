import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, Button } from '../../components';
import { Colors, Gradients, Spacing, BorderRadius, FontSizes, FontWeights } from '../../theme';

export function SettingsScreen({ navigation }: any) {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);
  const [routineReminder, setRoutineReminder] = useState(true);

  const user = { name: 'John Doe', email: 'john@example.com', initials: 'JD' };

  const accountSettings = [
    { icon: 'person-outline', label: 'Edit Profile', type: 'link' },
    { icon: 'lock-closed-outline', label: 'Change Password', type: 'link' },
    { icon: 'shield-outline', label: 'Two-Factor Auth', type: 'toggle', value: twoFactor, onToggle: setTwoFactor },
    { icon: 'language-outline', label: 'Language', type: 'value', value: 'English' },
  ];

  const preferenceSettings = [
    { icon: 'notifications-outline', label: 'Push Notifications', type: 'toggle', value: notifications, onToggle: setNotifications },
    { icon: 'moon-outline', label: 'Dark Mode', type: 'toggle', value: darkMode, onToggle: setDarkMode },
    { icon: 'alarm-outline', label: 'Routine Reminders', type: 'toggle', value: routineReminder, onToggle: setRoutineReminder },
    { icon: 'globe-outline', label: 'Units', type: 'value', value: 'Metric' },
  ];

  const supportSettings = [
    { icon: 'help-circle-outline', label: 'Help Center', type: 'link' },
    { icon: 'chatbubble-outline', label: 'Contact Support', type: 'link' },
    { icon: 'document-text-outline', label: 'Privacy Policy', type: 'link' },
    { icon: 'newspaper-outline', label: 'Terms of Service', type: 'link' },
  ];

  const renderSettingRow = (item: any, index: number, isLast: boolean) => (
    <TouchableOpacity key={index} style={[styles.settingRow, !isLast ? styles.settingRowBorder : undefined]} activeOpacity={0.6}>
      <View style={styles.settingLeft}>
        <Ionicons name={item.icon} size={22} color={Colors.gray500} />
        <Text style={styles.settingLabel}>{item.label}</Text>
      </View>
      {item.type === 'link' && <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />}
      {item.type === 'value' && <Text style={styles.settingValue}>{item.value}</Text>}
      {item.type === 'toggle' && (
        <Switch
          value={item.value}
          onValueChange={item.onToggle}
          trackColor={{ false: Colors.gray300, true: Colors.primaryAlpha30 }}
          thumbColor={item.value ? Colors.primary : Colors.gray100}
        />
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      {/* User Info Card */}
      <Card variant="elevated" style={styles.userCard}>
        <View style={styles.userRow}>
          <LinearGradient colors={Gradients.primary} style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>{user.initials}</Text>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
        </View>
      </Card>

      {/* Account */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <Card style={styles.settingsCard}>
          {accountSettings.map((item, i) => renderSettingRow(item, i, i === accountSettings.length - 1))}
        </Card>
      </View>

      {/* Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <Card style={styles.settingsCard}>
          {preferenceSettings.map((item, i) => renderSettingRow(item, i, i === preferenceSettings.length - 1))}
        </Card>
      </View>

      {/* Support */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <Card style={styles.settingsCard}>
          {supportSettings.map((item, i) => renderSettingRow(item, i, i === supportSettings.length - 1))}
        </Card>
      </View>

      {/* Danger Zone */}
      <View style={styles.section}>
        <Button
          variant="outline"
          onPress={() => {}}
          fullWidth
          style={{ borderColor: Colors.error }}
        >
          <Text style={{ color: Colors.error }}>Log Out</Text>
        </Button>
        <TouchableOpacity style={styles.deleteButton}>
          <Text style={styles.deleteText}>Delete Account</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>DeepSkyn v1.0.0</Text>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray50 },
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },
  title: { fontSize: FontSizes['2xl'], fontWeight: FontWeights.bold, color: Colors.gray900 },
  userCard: { marginHorizontal: Spacing.xl, marginTop: Spacing.xl, padding: Spacing.base },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  userAvatar: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
  },
  userAvatarText: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.white },
  userName: { fontSize: FontSizes.base, fontWeight: FontWeights.bold, color: Colors.gray900 },
  userEmail: { fontSize: FontSizes.sm, color: Colors.gray500 },
  section: { paddingHorizontal: Spacing.xl, marginTop: Spacing.xl },
  sectionTitle: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold, color: Colors.gray500, textTransform: 'uppercase', marginBottom: Spacing.sm },
  settingsCard: { padding: 0 },
  settingRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
  },
  settingRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  settingLabel: { fontSize: FontSizes.base, color: Colors.gray700 },
  settingValue: { fontSize: FontSizes.sm, color: Colors.gray400 },
  deleteButton: { alignItems: 'center', marginTop: Spacing.md, padding: Spacing.sm },
  deleteText: { fontSize: FontSizes.sm, color: Colors.error },
  footer: { alignItems: 'center', marginTop: Spacing['2xl'] },
  footerText: { fontSize: FontSizes.xs, color: Colors.gray400 },
});
