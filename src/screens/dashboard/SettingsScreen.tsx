import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Button } from '../../components';
import { Colors, Gradients, Spacing, BorderRadius, FontSizes, FontWeights } from '../../theme';
import { useAuthStore } from '../../stores/auth.store';
import { useAccessibilityStore } from '../../stores/accessibility.store';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function SettingsScreen({ navigation }: any) {
  const { user, logout } = useAuthStore();
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
  const [language, setLanguage] = useState('Français');

  const userName = user?.name || 'Utilisateur';
  const userEmail = user?.email || 'email@example.com';
  const userInitials = userName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  const highContrast = contrastMode === 'high';
  const setHighContrast = (value: boolean) => setContrastMode(value ? 'high' : 'off');
  const largeText = zoomLevel > 100;
  const setLargeText = (value: boolean) => value ? zoomIn() : resetZoom();

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Déconnexion', 
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
      'Supprimer le compte',
      'Cette action est irréversible. Toutes vos données seront supprimées définitivement.',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: () => {
            Alert.alert('Info', 'Contactez le support pour supprimer votre compte.');
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
    { icon: 'person-outline', label: 'Modifier le profil', type: 'link', onPress: () => navigation?.navigate?.('Profile') },
    { icon: 'lock-closed-outline', label: 'Changer le mot de passe', type: 'link', onPress: () => Alert.alert('Info', 'Utilisez l\'option "Mot de passe oublié" sur la page de connexion') },
    { icon: 'language-outline', label: 'Langue', type: 'value', value: language },
  ];

  const preferenceSettings = [
    { icon: 'notifications-outline', label: 'Notifications push', type: 'toggle', value: notifications, onToggle: setNotifications },
    { icon: 'alarm-outline', label: 'Rappels routine', type: 'toggle', value: routineReminder, onToggle: setRoutineReminder },
  ];

  const accessibilitySettings = [
    { icon: 'contrast-outline', label: 'Contraste élevé', type: 'toggle', value: highContrast, onToggle: setHighContrast },
    { icon: 'text-outline', label: 'Texte agrandi', type: 'toggle', value: largeText, onToggle: setLargeText },
    { icon: 'flash-off-outline', label: 'Réduire les animations', type: 'toggle', value: reduceMotion, onToggle: toggleReduceMotion },
  ];

  const supportSettings = [
    { icon: 'help-circle-outline', label: 'Centre d\'aide', type: 'link', onPress: () => Linking.openURL('https://deepskyn.com/help') },
    { icon: 'chatbubble-outline', label: 'Contacter le support', type: 'link', onPress: handleContactSupport },
    { icon: 'document-text-outline', label: 'Politique de confidentialité', type: 'link', onPress: handlePrivacyPolicy },
    { icon: 'newspaper-outline', label: 'Conditions d\'utilisation', type: 'link', onPress: handleTermsOfService },
  ];

  const renderSettingRow = (item: any, index: number, isLast: boolean) => (
    <TouchableOpacity 
      key={index} 
      style={[styles.settingRow, !isLast ? styles.settingRowBorder : undefined]} 
      activeOpacity={0.6}
      onPress={item.onPress}
      disabled={item.type === 'toggle'}
    >
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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Paramètres</Text>
        </View>

      {/* User Info Card */}
      <TouchableOpacity onPress={() => navigation?.navigate?.('Profile')}>
        <Card variant="elevated" style={styles.userCard}>
          <View style={styles.userRow}>
            <LinearGradient colors={Gradients.primary} style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>{userInitials}</Text>
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{userName}</Text>
              <Text style={styles.userEmail}>{userEmail}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
          </View>
        </Card>
      </TouchableOpacity>

      {/* Account */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Compte</Text>
        <Card style={styles.settingsCard}>
          {accountSettings.map((item, i) => renderSettingRow(item, i, i === accountSettings.length - 1))}
        </Card>
      </View>

      {/* Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Préférences</Text>
        <Card style={styles.settingsCard}>
          {preferenceSettings.map((item, i) => renderSettingRow(item, i, i === preferenceSettings.length - 1))}
        </Card>
      </View>

      {/* Accessibility */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Accessibilité</Text>
        <Card style={styles.settingsCard}>
          {accessibilitySettings.map((item, i) => renderSettingRow(item, i, i === accessibilitySettings.length - 1))}
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
          onPress={handleLogout}
          fullWidth
          style={{ borderColor: Colors.error }}
        >
          <Text style={{ color: Colors.error }}>Déconnexion</Text>
        </Button>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
          <Text style={styles.deleteText}>Supprimer mon compte</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>DeepSkyn v1.0.0</Text>
        <Text style={styles.footerText}>© 2024 DeepSkyn. Tous droits réservés.</Text>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.gray50 },
  container: { flex: 1, backgroundColor: Colors.gray50 },
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md },
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
