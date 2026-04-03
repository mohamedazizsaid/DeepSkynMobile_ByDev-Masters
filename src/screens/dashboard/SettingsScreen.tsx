import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Button } from '../../components';
import { Colors, Gradients, Spacing, BorderRadius, FontSizes, FontWeights } from '../../theme';
import { useAuthStore } from '../../stores/auth.store';
import { useAccessibilityStore } from '../../stores/accessibility.store';
import { useAccessibilityStyles } from '../../stores/useAccessibilityStyles';
import { useTranslation } from '../../lib/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function SettingsScreen({ navigation }: any) {
  const { user, logout } = useAuthStore();
  const { colors, fontSizes } = useAccessibilityStyles();
  const { t } = useTranslation();
  const { 
    reduceMotion, 
    contrastMode, 
    zoomLevel,
    toggleReduceMotion,
    setContrastMode,
    zoomIn,
    zoomOut,
    resetZoom,
  } = useAccessibilityStore();
  
  const [notifications, setNotifications] = useState(true);
  const [routineReminder, setRoutineReminder] = useState(true);
  const [language, setLanguage] = useState(t.settings.language.title);

  const dynamicStyles = useMemo(() => ({
    safeArea: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1, backgroundColor: colors.background },
    title: { fontSize: fontSizes['2xl'], fontWeight: FontWeights.bold, color: colors.text },
    userCard: { marginHorizontal: Spacing.xl, marginTop: Spacing.xl, padding: Spacing.base, backgroundColor: colors.surface },
    userName: { fontSize: fontSizes.base, fontWeight: FontWeights.bold, color: colors.text },
    userEmail: { fontSize: fontSizes.sm, color: colors.textSecondary },
    sectionTitle: { fontSize: fontSizes.sm, fontWeight: FontWeights.bold, color: colors.textSecondary, textTransform: 'uppercase' as const, marginBottom: Spacing.sm },
    settingsCard: { padding: 0, backgroundColor: colors.surface },
    settingLabel: { fontSize: fontSizes.base, color: colors.text },
    settingValue: { fontSize: fontSizes.sm, color: colors.textTertiary },
    settingRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
    deleteText: { fontSize: fontSizes.sm, color: colors.error },
    footerText: { fontSize: fontSizes.xs, color: colors.textTertiary },
  }), [colors, fontSizes]);

  const userName = user?.name || t.common.user;
  const userEmail = user?.email || 'email@example.com';
  const userInitials = userName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  const highContrast = contrastMode === 'high';
  const setHighContrast = (value: boolean) => setContrastMode(value ? 'high' : 'off');
  const largeText = zoomLevel > 100;
  const setLargeText = (value: boolean) => value ? zoomIn() : resetZoom();

  const handleLogout = useCallback(() => {
    Alert.alert(
      t.nav.logout,
      t.settings.closeSession,
      [
        { text: t.common.cancel, style: 'cancel' },
        { 
          text: t.nav.logout, 
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('auth_token');
            logout();
          }
        },
      ]
    );
  }, [logout]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      t.common.delete,
      t.settings.personal.updateError,
      [
        { text: t.common.cancel, style: 'cancel' },
        { 
          text: t.common.delete, 
          style: 'destructive',
          onPress: () => {
            Alert.alert('Info', t.settings.help.emailDesc);
          }
        },
      ]
    );
  }, []);

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@deepskyn.com?subject=Support%20Mobile%20App');
  };

  const handlePrivacyPolicy = () => {
    Linking.openURL('https://deepskyn.com/privacy');
  };

  const handleTermsOfService = () => {
    Linking.openURL('https://deepskyn.com/terms');
  };

  const accountSettings = [
    { icon: 'person-outline', label: t.settings.personal.title, type: 'link', onPress: () => navigation?.navigate?.('Profile') },
    { icon: 'lock-closed-outline', label: t.settings.security.passwordTitle, type: 'link', onPress: () => Alert.alert('Info', t.auth.forgotPassword) },
    { icon: 'language-outline', label: t.settings.tabs.language, type: 'value', value: language },
  ];

  const preferenceSettings = [
    { icon: 'notifications-outline', label: t.settings.notifications.title, type: 'toggle', value: notifications, onToggle: setNotifications },
    { icon: 'alarm-outline', label: t.settings.notifications.routines, type: 'toggle', value: routineReminder, onToggle: setRoutineReminder },
  ];

  const accessibilitySettings = [
    { icon: 'contrast-outline', label: t.accessibility.highContrast, type: 'toggle', value: highContrast, onToggle: setHighContrast },
    { icon: 'text-outline', label: t.accessibility.textSize, type: 'toggle', value: largeText, onToggle: setLargeText },
    { icon: 'flash-off-outline', label: t.accessibility.reduceAnimations, type: 'toggle', value: reduceMotion, onToggle: toggleReduceMotion },
  ];

  const supportSettings = [
    { icon: 'help-circle-outline', label: t.settings.tabs.help, type: 'link', onPress: () => Linking.openURL('https://deepskyn.com/help') },
    { icon: 'chatbubble-outline', label: t.settings.help.emailTitle, type: 'link', onPress: handleContactSupport },
    { icon: 'document-text-outline', label: t.landing.footerPrivacy, type: 'link', onPress: handlePrivacyPolicy },
    { icon: 'newspaper-outline', label: t.settings.tabs.terms, type: 'link', onPress: handleTermsOfService },
  ];

  const renderSettingRow = (item: any, index: number, isLast: boolean) => (
    <TouchableOpacity 
      key={index} 
      style={[styles.settingRow, !isLast ? dynamicStyles.settingRowBorder : undefined]} 
      activeOpacity={0.6}
      onPress={item.onPress}
      disabled={item.type === 'toggle'}
    >
      <View style={styles.settingLeft}>
        <Ionicons name={item.icon} size={22} color={colors.textSecondary} />
        <Text style={dynamicStyles.settingLabel}>{item.label}</Text>
      </View>
      {item.type === 'link' && <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />}
      {item.type === 'value' && <Text style={dynamicStyles.settingValue}>{item.value}</Text>}
      {item.type === 'toggle' && (
        <Switch
          value={item.value}
          onValueChange={item.onToggle}
          trackColor={{ false: colors.border, true: Colors.primaryAlpha30 }}
          thumbColor={item.value ? Colors.primary : colors.border}
        />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={dynamicStyles.safeArea}>
      <ScrollView style={dynamicStyles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={dynamicStyles.title}>{t.settings.title}</Text>
        </View>

      {/* User Info Card */}
      <TouchableOpacity onPress={() => navigation?.navigate?.('Profile')}>
        <Card variant="elevated" style={dynamicStyles.userCard}>
          <View style={styles.userRow}>
            <LinearGradient colors={Gradients.primary} style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>{userInitials}</Text>
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={dynamicStyles.userName}>{userName}</Text>
              <Text style={dynamicStyles.userEmail}>{userEmail}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </View>
        </Card>
      </TouchableOpacity>

      {/* Account */}
      <View style={styles.section}>
        <Text style={dynamicStyles.sectionTitle}>{t.settings.sections.account}</Text>
        <Card style={dynamicStyles.settingsCard}>
          {accountSettings.map((item, i) => renderSettingRow(item, i, i === accountSettings.length - 1))}
        </Card>
      </View>

      {/* Preferences */}
      <View style={styles.section}>
        <Text style={dynamicStyles.sectionTitle}>{t.settings.sections.preferences}</Text>
        <Card style={dynamicStyles.settingsCard}>
          {preferenceSettings.map((item, i) => renderSettingRow(item, i, i === preferenceSettings.length - 1))}
        </Card>
      </View>

      {/* Accessibility */}
      <View style={styles.section}>
        <Text style={dynamicStyles.sectionTitle}>{t.accessibility.title}</Text>
        <Card style={dynamicStyles.settingsCard}>
          {accessibilitySettings.map((item, i) => renderSettingRow(item, i, i === accessibilitySettings.length - 1))}
        </Card>
      </View>

      {/* Support */}
      <View style={styles.section}>
        <Text style={dynamicStyles.sectionTitle}>{t.settings.sections.support}</Text>
        <Card style={dynamicStyles.settingsCard}>
          {supportSettings.map((item, i) => renderSettingRow(item, i, i === supportSettings.length - 1))}
        </Card>
      </View>

      {/* Danger Zone */}
      <View style={styles.section}>
        <Button
          variant="outline"
          onPress={handleLogout}
          fullWidth
          style={{ borderColor: Colors.error }}
        >
          <Text style={{ color: Colors.error }}>{t.nav.logout}</Text>
        </Button>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
          <Text style={dynamicStyles.deleteText}>{t.common.delete}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={dynamicStyles.footerText}>DeepSkyn v1.0.0</Text>
        <Text style={dynamicStyles.footerText}>© 2026 DeepSkyn. {t.landing.allRightsReserved}</Text>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  userAvatar: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
  },
  userAvatarText: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.white },
  section: { paddingHorizontal: Spacing.xl, marginTop: Spacing.xl },
  settingRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  deleteButton: { alignItems: 'center', marginTop: Spacing.md, padding: Spacing.sm },
  footer: { alignItems: 'center', marginTop: Spacing['2xl'] },
});
