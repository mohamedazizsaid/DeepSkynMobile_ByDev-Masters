import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Button } from '../../components';
import { Colors, Gradients, Spacing, BorderRadius, FontSizes, FontWeights } from '../../theme';
import { useAuthStore } from '../../stores/auth.store';
import { useAccessibilityStore } from '../../stores/accessibility.store';
import { useAccessibilityStyles } from '../../stores/useAccessibilityStyles';
import { useTranslation } from '../../lib/i18n';
import { authService } from '../../services/auth.service';
import { usersService } from '../../services/users.service';
import { useFaceReferenceGate } from '../../lib/hooks/useFaceReferenceGate';

type SettingsView =
  | 'main'
  | 'personal'
  | '2fa'
  | 'password'
  | 'notifications'
  | 'appearance'
  | 'language'
  | 'payment'
  | 'help'
  | 'terms';

export function SettingsScreen({ navigation }: any) {
  const { user, logout } = useAuthStore();
  const { colors, fontSizes, settings } = useAccessibilityStyles();
  const { t, language, setLanguage, isRTL } = useTranslation();
  const { faceReferenceStatus, loadingFaceReferenceStatus, refreshFaceReferenceStatus } = useFaceReferenceGate();
  const { 
    theme,
    reduceMotion, 
    contrastMode, 
    zoomLevel,
    setTheme,
    toggleReduceMotion,
    setContrastMode,
    zoomIn,
    zoomOut,
    resetZoom,
  } = useAccessibilityStore();

  const [currentView, setCurrentView] = useState<SettingsView>('main');
  const [notifications, setNotifications] = useState({
    email_routines: true,
    email_reports: true,
    email_tips: false,
    app_routines: true,
    app_ai: true,
    app_community: true,
  });
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [isPublicProfile, setIsPublicProfile] = useState(Boolean(user?.settings?.isPublic ?? user?.settings?.publicProfile));
  const [savingPublicProfile, setSavingPublicProfile] = useState(false);

  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(false);
  const [loadingTwoFactor, setLoadingTwoFactor] = useState(false);
  const [setupLoadingTwoFactor, setSetupLoadingTwoFactor] = useState(false);
  const [twoFactorQrCode, setTwoFactorQrCode] = useState('');
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [disableTwoFactorMode, setDisableTwoFactorMode] = useState(false);

  const dynamicStyles = useMemo(() => ({
    safeArea: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1, backgroundColor: colors.background },
    title: { fontSize: fontSizes['2xl'], fontWeight: FontWeights.bold, color: colors.text, textAlign: isRTL ? 'right' as const : 'left' as const },
    subtitle: { fontSize: fontSizes.sm, color: colors.textSecondary, marginTop: Spacing.xs, textAlign: isRTL ? 'right' as const : 'left' as const },
    menuCard: { padding: 0, backgroundColor: colors.surface },
    userCard: { marginHorizontal: Spacing.xl, marginTop: Spacing.xl, padding: Spacing.base, backgroundColor: colors.surface },
    userName: { fontSize: fontSizes.base, fontWeight: FontWeights.bold, color: colors.text },
    userEmail: { fontSize: fontSizes.sm, color: colors.textSecondary },
    sectionTitle: { fontSize: fontSizes.sm, fontWeight: FontWeights.bold, color: colors.textSecondary, textTransform: 'uppercase' as const, marginBottom: Spacing.sm },
    settingsCard: { padding: 0, backgroundColor: colors.surface },
    settingLabel: { fontSize: fontSizes.base, color: colors.text },
    settingValue: { fontSize: fontSizes.sm, color: colors.textTertiary, textAlign: isRTL ? 'left' as const : 'right' as const },
    description: { fontSize: fontSizes.xs, color: colors.textSecondary, marginTop: 2 },
    statusText: { fontSize: fontSizes.sm, color: colors.textSecondary, marginTop: Spacing.xs },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: BorderRadius.lg,
      backgroundColor: colors.surface,
      color: colors.text,
      fontSize: fontSizes.xl,
      letterSpacing: 6,
      textAlign: 'center' as const,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.base,
      marginTop: Spacing.md,
    },
    settingRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
    deleteText: { fontSize: fontSizes.sm, color: colors.error },
    languageBadge: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.lg,
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.sm,
      marginTop: Spacing.sm,
    },
    activeLanguageBadge: {
      borderColor: colors.primary,
      backgroundColor: Colors.primaryAlpha10,
    },
    footerText: { fontSize: fontSizes.xs, color: colors.textTertiary },
    faceStatusBadge: {
      alignSelf: 'flex-start' as const,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 6,
      borderRadius: BorderRadius.full,
      marginTop: Spacing.sm,
    },
  }), [colors, fontSizes, isRTL]);

  useEffect(() => {
    const initial = user?.settings?.notifications;
    if (initial && typeof initial === 'object') {
      setNotifications((prev) => ({ ...prev, ...initial }));
    }
  }, [user]);

  useEffect(() => {
    setIsPublicProfile(Boolean(user?.settings?.isPublic ?? user?.settings?.publicProfile));
  }, [user?.settings?.isPublic, user?.settings?.publicProfile]);

  useEffect(() => {
    if (currentView === '2fa') {
      loadTwoFactorStatus();
    }
  }, [currentView]);

  const userName = user?.name || t.common.user;
  const userEmail = user?.email || 'email@example.com';
  const userInitials = userName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const userAvatar = user?.avatar || user?.avatar3D || null;

  const highContrast = contrastMode === 'high';
  const setHighContrast = (value: boolean) => setContrastMode(value ? 'high' : 'off');
  const largeText = zoomLevel > 100;
  const setLargeText = (value: boolean) => (value ? zoomIn() : resetZoom());

  const loadTwoFactorStatus = useCallback(async () => {
    setLoadingTwoFactor(true);
    try {
      const status = await authService.get2faStatus();
      setIsTwoFactorEnabled(Boolean(status?.enabled));
    } catch {
      Alert.alert(t.common.error, t.settings.logoutError);
    } finally {
      setLoadingTwoFactor(false);
    }
  }, [t]);

  const handleGenerate2FA = useCallback(async () => {
    setSetupLoadingTwoFactor(true);
    try {
      const result = await authService.generate2fa();
      setTwoFactorQrCode(result?.qrCode || '');
      setTwoFactorSecret(result?.secret || '');
      setDisableTwoFactorMode(false);
      setTwoFactorCode('');
    } catch (error: any) {
      Alert.alert(t.common.error, error?.response?.data?.message || t.settings.logoutError);
    } finally {
      setSetupLoadingTwoFactor(false);
    }
  }, [t]);

  const handleEnable2FA = useCallback(async () => {
    if (twoFactorCode.length !== 6) {
      Alert.alert(t.common.error, t.settings.security.mismatch);
      return;
    }
    setSetupLoadingTwoFactor(true);
    try {
      await authService.enable2fa(twoFactorCode);
      setIsTwoFactorEnabled(true);
      setTwoFactorCode('');
      setTwoFactorQrCode('');
      setTwoFactorSecret('');
      Alert.alert(t.common.success, t.settings.security.twoFactorActive);
    } catch (error: any) {
      Alert.alert(t.common.error, error?.response?.data?.message || t.settings.security.mismatch);
    } finally {
      setSetupLoadingTwoFactor(false);
    }
  }, [twoFactorCode, t]);

  const handleDisable2FA = useCallback(async () => {
    if (twoFactorCode.length !== 6) {
      Alert.alert(t.common.error, t.settings.security.mismatch);
      return;
    }
    setSetupLoadingTwoFactor(true);
    try {
      await authService.disable2fa(twoFactorCode);
      setIsTwoFactorEnabled(false);
      setDisableTwoFactorMode(false);
      setTwoFactorCode('');
      Alert.alert(t.common.success, t.settings.security.twoFactorInactive);
    } catch (error: any) {
      Alert.alert(t.common.error, error?.response?.data?.message || t.settings.security.mismatch);
    } finally {
      setSetupLoadingTwoFactor(false);
    }
  }, [twoFactorCode, t]);

  const handleToggleNotification = useCallback(async (key: keyof typeof notifications) => {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    setSavingNotifications(true);

    try {
      await usersService.updateMe({
        settings: {
          ...(user?.settings || {}),
          notifications: updated,
        },
      });
    } catch {
      setNotifications(notifications);
      Alert.alert(t.common.error, t.settings.notifications.syncing);
    } finally {
      setSavingNotifications(false);
    }
  }, [notifications, user, t]);

  const handleTogglePublicProfile = useCallback(async (nextValue: boolean) => {
    setIsPublicProfile(nextValue);
    setSavingPublicProfile(true);

    try {
      await usersService.updateMe({
        settings: {
          ...(user?.settings || {}),
          isPublic: nextValue,
          publicProfile: nextValue,
        },
      });
    } catch {
      setIsPublicProfile(!nextValue);
      Alert.alert(t.common.error, t.settings.personal.updateError);
    } finally {
      setSavingPublicProfile(false);
    }
  }, [user, t]);

  const openUrl = useCallback(async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(t.common.error, t.common.error);
    }
  }, [t]);

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
            logout();
          }
        },
      ]
    );
  }, [logout, t]);

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
  }, [t]);

  const sectionMenu = [
    {
      title: t.settings.sections.account,
      items: [
        { id: 'personal', icon: 'person-outline', label: t.settings.tabs.personal, description: t.settings.personal.subtitle },
        { id: '2fa', icon: 'shield-checkmark-outline', label: t.settings.tabs['2fa'], description: t.settings.security.twoFactorSubtitle },
        { id: 'password', icon: 'lock-closed-outline', label: t.settings.tabs.password, description: t.settings.security.passwordSubtitle },
      ],
    },
    {
      title: t.settings.sections.preferences,
      items: [
        { id: 'notifications', icon: 'notifications-outline', label: t.settings.tabs.notifications, description: t.settings.notifications.subtitle },
        { id: 'appearance', icon: 'color-palette-outline', label: t.settings.tabs.appearance, description: t.settings.appearance.subtitle },
        { id: 'language', icon: 'language-outline', label: t.settings.tabs.language, description: t.settings.language.subtitle },
      ],
    },
    {
      title: t.settings.sections.support,
      items: [
        { id: 'payment', icon: 'card-outline', label: t.subscriptionScreen.title, description: t.subscriptionScreen.currentPlan },
        { id: 'help', icon: 'help-circle-outline', label: t.settings.tabs.help, description: t.settings.help.subtitle },
        { id: 'terms', icon: 'document-text-outline', label: t.settings.tabs.terms, description: t.settings.terms.subtitle },
      ],
    },
  ] as const;

  const languageOptions = [
    { code: 'fr', label: 'Français', flag: 'FR' },
    { code: 'en', label: 'English', flag: 'EN' },
    { code: 'ar', label: 'العربية', flag: 'AR' },
  ] as const;

  const allRightsReservedLabel = language === 'ar'
    ? 'جميع الحقوق محفوظة.'
    : language === 'en'
      ? 'All rights reserved.'
      : 'Tous droits reserves.';

  const renderMenuItem = (item: { id: string; icon: string; label: string; description: string }, index: number, isLast: boolean) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.settingRow, !isLast ? dynamicStyles.settingRowBorder : undefined, isRTL && styles.settingRowRtl]}
      activeOpacity={0.8}
      onPress={() => setCurrentView(item.id as SettingsView)}
      accessibilityRole="button"
      accessibilityLabel={item.label}
    >
      <View style={[styles.settingLeft, isRTL && styles.settingLeftRtl]}>
        <Ionicons name={item.icon as any} size={22} color={colors.textSecondary} />
        <View style={{ flex: 1 }}>
          <Text style={[dynamicStyles.settingLabel, isRTL && { textAlign: 'right' }]}>{item.label}</Text>
          <Text style={[dynamicStyles.description, isRTL && { textAlign: 'right' }]}>{item.description}</Text>
        </View>
      </View>
      <Ionicons
        name={isRTL ? 'chevron-back' : 'chevron-forward'}
        size={20}
        color={colors.textTertiary}
      />
    </TouchableOpacity>
  );

  const renderMainView = () => (
    <>
      <TouchableOpacity
        onPress={() => navigation?.navigate?.('Profile')}
        accessibilityRole="button"
        accessibilityLabel={t.settings.personal.title}
      >
        <Card variant="elevated" style={dynamicStyles.userCard}>
          <View style={[styles.userRow, isRTL && styles.userRowRtl]}>
            {userAvatar ? (
              <Image source={{ uri: userAvatar }} style={styles.userAvatarImage} />
            ) : (
              <LinearGradient colors={Gradients.primary} style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>{userInitials}</Text>
              </LinearGradient>
            )}
            <View style={{ flex: 1 }}>
              <Text style={[dynamicStyles.userName, isRTL && { textAlign: 'right' }]}>{userName}</Text>
              <Text style={[dynamicStyles.userEmail, isRTL && { textAlign: 'right' }]}>{userEmail}</Text>
            </View>
            <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={20} color={colors.textTertiary} />
          </View>
        </Card>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={[dynamicStyles.sectionTitle, isRTL && { textAlign: 'right' }]}>{t.settings.personal.privacy}</Text>
        <Card variant="elevated" style={dynamicStyles.menuCard}>
          <View style={[styles.settingRow, styles.settingRowNoBorder, isRTL && styles.settingRowRtl]}>
            <View style={[styles.settingLeft, isRTL && styles.settingLeftRtl]}>
              <View style={[styles.publicBadge, isPublicProfile ? styles.publicBadgeOn : styles.publicBadgeOff]}>
                <Ionicons name={isPublicProfile ? 'people' : 'lock-closed'} size={16} color={isPublicProfile ? colors.primary : colors.textSecondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[dynamicStyles.settingLabel, isRTL && { textAlign: 'right' }]}>{t.settings.personal.isPublic}</Text>
                <Text style={[dynamicStyles.description, isRTL && { textAlign: 'right' }]}>{t.settings.personal.isPublicDesc}</Text>
              </View>
            </View>
            <View style={styles.publicSwitchContainer}>
              <Switch
                value={isPublicProfile}
                onValueChange={(value) => void handleTogglePublicProfile(value)}
                disabled={savingPublicProfile}
              />
              {savingPublicProfile ? <Text style={dynamicStyles.footerText}>{t.common.loading}</Text> : null}
            </View>
          </View>
        </Card>
      </View>

      {sectionMenu.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={[dynamicStyles.sectionTitle, isRTL && { textAlign: 'right' }]}>{section.title}</Text>
          <Card style={dynamicStyles.menuCard}>
            {section.items.map((item, idx) => renderMenuItem(item, idx, idx === section.items.length - 1))}
          </Card>
        </View>
      ))}

      <View style={styles.section}>
        <Button
          variant="outline"
          onPress={handleLogout}
          fullWidth
          style={{ borderColor: Colors.error }}
        >
          <Text style={{ color: Colors.error }}>{t.nav.logout}</Text>
        </Button>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeleteAccount}
          accessibilityRole="button"
          accessibilityLabel={t.common.delete}
        >
          <Text style={dynamicStyles.deleteText}>{t.common.delete}</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderBackHeader = (title: string, subtitle?: string) => (
    <View style={styles.section}>
      <TouchableOpacity
        onPress={() => setCurrentView('main')}
        style={[styles.backRow, isRTL && styles.backRowRtl]}
        accessibilityRole="button"
        accessibilityLabel={t.common.back || 'Back'}
      >
        <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={20} color={colors.textSecondary} />
        <Text style={dynamicStyles.settingLabel}>{t.common.back || 'Back'}</Text>
      </TouchableOpacity>
      <Text style={[dynamicStyles.title, { marginTop: Spacing.sm }]}>{title}</Text>
      {subtitle ? <Text style={dynamicStyles.subtitle}>{subtitle}</Text> : null}
    </View>
  );

  const renderPersonalView = () => (
    <>
      {renderBackHeader(t.settings.personal.title, t.settings.personal.subtitle)}
      <View style={styles.section}>
        <Card style={dynamicStyles.settingsCard}>
          <View style={[styles.settingRow, isRTL && styles.settingRowRtl]}>
            <View style={[styles.settingLeft, isRTL && styles.settingLeftRtl]}>
              <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
              <Text style={dynamicStyles.settingLabel}>{t.settings.personal.email}</Text>
            </View>
            <Text style={dynamicStyles.settingValue}>{userEmail}</Text>
          </View>
          <View style={[styles.settingRow, dynamicStyles.settingRowBorder, isRTL && styles.settingRowRtl]}>
            <View style={[styles.settingLeft, isRTL && styles.settingLeftRtl]}>
              <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
              <Text style={dynamicStyles.settingLabel}>{t.settings.personal.fullName}</Text>
            </View>
            <Text style={dynamicStyles.settingValue}>{userName}</Text>
          </View>
          <TouchableOpacity
            style={[styles.settingRow, isRTL && styles.settingRowRtl]}
            onPress={() => navigation?.navigate?.('Profile')}
            accessibilityRole="button"
            accessibilityLabel={t.settings.personal.details}
          >
            <View style={[styles.settingLeft, isRTL && styles.settingLeftRtl]}>
              <Ionicons name="open-outline" size={20} color={colors.textSecondary} />
              <Text style={dynamicStyles.settingLabel}>{t.settings.personal.details}</Text>
            </View>
            <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        </Card>
      </View>

      <View style={styles.section}>
        <Card style={dynamicStyles.settingsCard}>
          <View style={{ padding: Spacing.base }}>
            <View style={[styles.settingLeft, isRTL && styles.settingLeftRtl, { marginBottom: Spacing.xs }]}> 
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.textSecondary} />
              <Text style={dynamicStyles.settingLabel}>Référence faciale</Text>
            </View>
            <Text style={dynamicStyles.description}>
              L’analyse reste bloquée tant que la référence faciale du propriétaire n’est pas activée.
            </Text>

            {loadingFaceReferenceStatus ? (
              <View style={{ marginTop: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                <ActivityIndicator color={colors.primary} />
                <Text style={dynamicStyles.description}>Vérification du statut...</Text>
              </View>
            ) : (
              <View
                style={[
                  dynamicStyles.faceStatusBadge,
                  {
                    backgroundColor: faceReferenceStatus?.hasFaceReference ? `${colors.success}18` : `${colors.warning}18`,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: fontSizes.xs,
                    fontWeight: FontWeights.bold,
                    color: faceReferenceStatus?.hasFaceReference ? colors.success : colors.warning,
                    textTransform: 'uppercase',
                  }}
                >
                  {faceReferenceStatus?.hasFaceReference ? 'Activée' : 'Inactive'}
                </Text>
              </View>
            )}

            <Text style={[dynamicStyles.description, { marginTop: Spacing.sm }]}>
              {faceReferenceStatus?.hasFaceReference
                ? 'Votre compte est prêt pour les analyses sécurisées.'
                : 'Activez-la depuis votre profil, puis revenez ici pour rafraîchir le statut.'}
            </Text>

            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: Spacing.sm, marginTop: Spacing.md }}>
              <View style={{ flex: 1 }}>
                <Button
                  variant="outline"
                  onPress={async () => {
                    try {
                      await authService.syncFaceReference();
                    } catch {
                      // If sync fails (no profile photo or no detectable face), keep status refresh to show latest state.
                    } finally {
                      await refreshFaceReferenceStatus();
                    }
                  }}
                >
                  Actualiser
                </Button>
              </View>
              {!faceReferenceStatus?.hasFaceReference ? (
                <View style={{ flex: 1 }}>
                  <Button onPress={() => navigation?.navigate?.('Profile')}>
                    Ouvrir le profil
                  </Button>
                </View>
              ) : null}
            </View>
          </View>
        </Card>
      </View>
    </>
  );

  const renderTwoFactorView = () => (
    <>
      {renderBackHeader(t.settings.security.twoFactorTitle, t.settings.security.twoFactorSubtitle)}
      <View style={styles.section}>
        <Card style={dynamicStyles.settingsCard}>
          {loadingTwoFactor ? (
            <View style={{ padding: Spacing.lg, alignItems: 'center' }}>
              <ActivityIndicator color={colors.primary} />
              <Text style={[dynamicStyles.description, { marginTop: Spacing.sm }]}>{t.common.loading}</Text>
            </View>
          ) : (
            <View style={{ padding: Spacing.base }}>
              <Text style={dynamicStyles.settingLabel}>
                {isTwoFactorEnabled ? t.settings.security.twoFactorActive : t.settings.security.twoFactorInactive}
              </Text>

              {!isTwoFactorEnabled && !twoFactorSecret ? (
                <Button
                  onPress={handleGenerate2FA}
                  style={{ marginTop: Spacing.md }}
                  loading={setupLoadingTwoFactor}
                >
                  {t.settings.security.setup}
                </Button>
              ) : null}

              {!isTwoFactorEnabled && Boolean(twoFactorSecret) ? (
                <View style={{ marginTop: Spacing.md }}>
                  {twoFactorQrCode ? (
                    <Image
                      source={{ uri: twoFactorQrCode }}
                      style={styles.qrCode}
                      accessibilityLabel={t.settings.security.step1}
                    />
                  ) : null}
                  <Text style={[dynamicStyles.description, { marginTop: Spacing.sm }]}>
                    {t.settings.security.secretKey}: {twoFactorSecret}
                  </Text>
                  <TextInput
                    value={twoFactorCode}
                    onChangeText={(value) => setTwoFactorCode(value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="number-pad"
                    maxLength={6}
                    style={dynamicStyles.input}
                    accessibilityLabel={t.settings.security.verify}
                  />
                  <Button
                    onPress={handleEnable2FA}
                    style={{ marginTop: Spacing.md }}
                    loading={setupLoadingTwoFactor}
                  >
                    {t.settings.security.enable}
                  </Button>
                </View>
              ) : null}

              {isTwoFactorEnabled ? (
                <View style={{ marginTop: Spacing.md }}>
                  {!disableTwoFactorMode ? (
                    <Button
                      variant="outline"
                      onPress={() => {
                        setDisableTwoFactorMode(true);
                        setTwoFactorCode('');
                      }}
                    >
                      {t.settings.security.disable}
                    </Button>
                  ) : (
                    <>
                      <TextInput
                        value={twoFactorCode}
                        onChangeText={(value) => setTwoFactorCode(value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        placeholderTextColor={colors.textTertiary}
                        keyboardType="number-pad"
                        maxLength={6}
                        style={dynamicStyles.input}
                        accessibilityLabel={t.settings.security.verify}
                      />
                      <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: Spacing.sm, marginTop: Spacing.md }}>
                        <View style={{ flex: 1 }}>
                          <Button
                            variant="outline"
                            onPress={() => {
                              setDisableTwoFactorMode(false);
                              setTwoFactorCode('');
                            }}
                          >
                            {t.common.cancel}
                          </Button>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Button
                            onPress={handleDisable2FA}
                            style={{ backgroundColor: Colors.error }}
                            loading={setupLoadingTwoFactor}
                          >
                            {t.common.disable}
                          </Button>
                        </View>
                      </View>
                    </>
                  )}
                </View>
              ) : null}
            </View>
          )}
        </Card>
      </View>
    </>
  );

  const renderPasswordView = () => (
    <>
      {renderBackHeader(t.settings.security.passwordTitle, t.settings.security.passwordSubtitle)}
      <View style={styles.section}>
        <Card style={dynamicStyles.settingsCard}>
          <View style={{ padding: Spacing.base }}>
            <Text style={dynamicStyles.settingLabel}>{t.auth.forgotPassword}</Text>
            <Text style={dynamicStyles.statusText}>{t.settings.help.emailDesc}</Text>
            <Button
              variant="outline"
              style={{ marginTop: Spacing.md }}
              onPress={() => openUrl('mailto:support@deepskyn.com?subject=Reset%20Password%20Request')}
            >
              {t.settings.help.emailTitle}
            </Button>
          </View>
        </Card>
      </View>
    </>
  );

  const renderNotificationsView = () => {
    const rows = [
      { key: 'email_routines' as const, label: t.settings.notifications.routines, desc: t.settings.notifications.routinesDesc },
      { key: 'email_reports' as const, label: t.settings.notifications.reports, desc: t.settings.notifications.reportsDesc },
      { key: 'email_tips' as const, label: t.settings.notifications.tips, desc: t.settings.notifications.tipsDesc },
      { key: 'app_ai' as const, label: t.settings.notifications.aiSpecialist, desc: t.settings.notifications.aiSpecialistDesc },
      { key: 'app_community' as const, label: t.settings.notifications.community, desc: t.settings.notifications.communityDesc },
    ];

    return (
      <>
        {renderBackHeader(t.settings.notifications.title, t.settings.notifications.subtitle)}
        <View style={styles.section}>
          <Card style={dynamicStyles.settingsCard}>
            {rows.map((row, index) => (
              <View key={row.key} style={[styles.settingRow, index < rows.length - 1 ? dynamicStyles.settingRowBorder : undefined, isRTL && styles.settingRowRtl]}>
                <View style={[styles.settingLeft, isRTL && styles.settingLeftRtl, { flex: 1 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[dynamicStyles.settingLabel, isRTL && { textAlign: 'right' }]}>{row.label}</Text>
                    <Text style={[dynamicStyles.description, isRTL && { textAlign: 'right' }]}>{row.desc}</Text>
                  </View>
                </View>
                <Switch
                  value={Boolean(notifications[row.key])}
                  onValueChange={() => handleToggleNotification(row.key)}
                  disabled={savingNotifications}
                  trackColor={{ false: colors.border, true: Colors.primaryAlpha30 }}
                  thumbColor={notifications[row.key] ? Colors.primary : colors.border}
                  accessibilityLabel={row.label}
                />
              </View>
            ))}
          </Card>
        </View>
      </>
    );
  };

  const renderAppearanceView = () => (
    <>
      {renderBackHeader(t.settings.appearance.title, t.settings.appearance.subtitle)}
      <View style={styles.section}>
        <Card style={dynamicStyles.settingsCard}>
          <View style={[styles.settingRow, dynamicStyles.settingRowBorder, isRTL && styles.settingRowRtl]}>
            <View style={[styles.settingLeft, isRTL && styles.settingLeftRtl]}>
              <Ionicons name="sunny-outline" size={20} color={colors.textSecondary} />
              <Text style={dynamicStyles.settingLabel}>{t.settings.appearance.theme}</Text>
            </View>
            <Switch
              value={theme === 'dark'}
              onValueChange={(value) => setTheme(value ? 'dark' : 'light')}
              trackColor={{ false: colors.border, true: Colors.primaryAlpha30 }}
              thumbColor={theme === 'dark' ? Colors.primary : colors.border}
              accessibilityLabel={t.settings.appearance.theme}
            />
          </View>

          <View style={[styles.settingRow, dynamicStyles.settingRowBorder, isRTL && styles.settingRowRtl]}>
            <View style={[styles.settingLeft, isRTL && styles.settingLeftRtl]}>
              <Ionicons name="contrast-outline" size={20} color={colors.textSecondary} />
              <Text style={dynamicStyles.settingLabel}>{t.settings.appearance.contrast}</Text>
            </View>
            <Switch
              value={highContrast}
              onValueChange={setHighContrast}
              trackColor={{ false: colors.border, true: Colors.primaryAlpha30 }}
              thumbColor={highContrast ? Colors.primary : colors.border}
              accessibilityLabel={t.settings.appearance.contrast}
            />
          </View>

          <View style={[styles.settingRow, dynamicStyles.settingRowBorder, isRTL && styles.settingRowRtl]}>
            <View style={[styles.settingLeft, isRTL && styles.settingLeftRtl]}>
              <Ionicons name="text-outline" size={20} color={colors.textSecondary} />
              <Text style={dynamicStyles.settingLabel}>{t.accessibility.textSize}</Text>
            </View>
            <Switch
              value={largeText}
              onValueChange={setLargeText}
              trackColor={{ false: colors.border, true: Colors.primaryAlpha30 }}
              thumbColor={largeText ? Colors.primary : colors.border}
              accessibilityLabel={t.accessibility.textSize}
            />
          </View>

          <View style={[styles.settingRow, isRTL && styles.settingRowRtl]}>
            <View style={[styles.settingLeft, isRTL && styles.settingLeftRtl]}>
              <Ionicons name="flash-off-outline" size={20} color={colors.textSecondary} />
              <Text style={dynamicStyles.settingLabel}>{t.accessibility.reduceAnimations}</Text>
            </View>
            <Switch
              value={reduceMotion}
              onValueChange={toggleReduceMotion}
              trackColor={{ false: colors.border, true: Colors.primaryAlpha30 }}
              thumbColor={reduceMotion ? Colors.primary : colors.border}
              accessibilityLabel={t.accessibility.reduceAnimations}
            />
          </View>
        </Card>

        <Card style={{ ...dynamicStyles.settingsCard, marginTop: Spacing.md }}>
          <View style={{ padding: Spacing.base }}>
            <Text style={dynamicStyles.settingLabel}>{t.settings.appearance.zoom}: {zoomLevel}%</Text>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: Spacing.sm, marginTop: Spacing.md }}>
              <View style={{ flex: 1 }}>
                <Button variant="outline" onPress={zoomOut}>-</Button>
              </View>
              <View style={{ flex: 1 }}>
                <Button variant="outline" onPress={resetZoom}>{t.common.reset}</Button>
              </View>
              <View style={{ flex: 1 }}>
                <Button variant="outline" onPress={zoomIn}>+</Button>
              </View>
            </View>
          </View>
        </Card>
      </View>
    </>
  );

  const renderLanguageView = () => (
    <>
      {renderBackHeader(t.settings.language.title, t.settings.language.subtitle)}
      <View style={styles.section}>
        <Card style={dynamicStyles.settingsCard}>
          <View style={{ padding: Spacing.base }}>
            {languageOptions.map((option) => {
              const selected = language === option.code;
              return (
                <TouchableOpacity
                  key={option.code}
                  style={[dynamicStyles.languageBadge, selected ? dynamicStyles.activeLanguageBadge : undefined]}
                  onPress={() => setLanguage(option.code as any)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={option.label}
                >
                  <View style={[styles.languageRow, isRTL && styles.languageRowRtl]}>
                    <Text style={dynamicStyles.settingLabel}>{option.label}</Text>
                    <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: Spacing.sm }}>
                      <Text style={dynamicStyles.settingValue}>{option.flag}</Text>
                      {selected ? <Ionicons name="checkmark-circle" size={18} color={colors.primary} /> : null}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>
      </View>
    </>
  );

  const renderPaymentView = () => (
    <>
      {renderBackHeader(t.subscriptionScreen.title, t.subscriptionScreen.subtitle)}
      <View style={styles.section}>
        <Card style={dynamicStyles.settingsCard}>
          <View style={{ padding: Spacing.base }}>
            <Text style={dynamicStyles.settingLabel}>{t.subscriptionScreen.currentPlan}</Text>
            <Text style={dynamicStyles.statusText}>{t.subscriptionScreen.premiumPlan}</Text>
            <Button
              style={{ marginTop: Spacing.md }}
              onPress={() => navigation?.navigate?.('Subscription')}
            >
              {t.subscriptionScreen.title}
            </Button>
          </View>
        </Card>
      </View>
    </>
  );

  const renderHelpView = () => (
    <>
      {renderBackHeader(t.settings.help.title, t.settings.help.subtitle)}
      <View style={styles.section}>
        <Card style={dynamicStyles.settingsCard}>
          <TouchableOpacity
            style={[styles.settingRow, dynamicStyles.settingRowBorder, isRTL && styles.settingRowRtl]}
            onPress={() => openUrl('https://deepskyn.com/help')}
            accessibilityRole="button"
            accessibilityLabel={t.settings.tabs.help}
          >
            <View style={[styles.settingLeft, isRTL && styles.settingLeftRtl]}>
              <Ionicons name="help-circle-outline" size={20} color={colors.textSecondary} />
              <Text style={dynamicStyles.settingLabel}>{t.settings.tabs.help}</Text>
            </View>
            <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color={colors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.settingRow, isRTL && styles.settingRowRtl]}
            onPress={() => openUrl('mailto:support@deepskyn.com?subject=Support%20Mobile%20App')}
            accessibilityRole="button"
            accessibilityLabel={t.settings.help.emailTitle}
          >
            <View style={[styles.settingLeft, isRTL && styles.settingLeftRtl]}>
              <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
              <Text style={dynamicStyles.settingLabel}>{t.settings.help.emailTitle}</Text>
            </View>
            <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        </Card>
      </View>
    </>
  );

  const renderTermsView = () => (
    <>
      {renderBackHeader(t.settings.terms.title, t.settings.terms.subtitle)}
      <View style={styles.section}>
        <Card style={dynamicStyles.settingsCard}>
          <TouchableOpacity
            style={[styles.settingRow, dynamicStyles.settingRowBorder, isRTL && styles.settingRowRtl]}
            onPress={() => openUrl('https://deepskyn.com/terms')}
            accessibilityRole="button"
            accessibilityLabel={t.settings.tabs.terms}
          >
            <View style={[styles.settingLeft, isRTL && styles.settingLeftRtl]}>
              <Ionicons name="document-text-outline" size={20} color={colors.textSecondary} />
              <Text style={dynamicStyles.settingLabel}>{t.settings.tabs.terms}</Text>
            </View>
            <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color={colors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.settingRow, isRTL && styles.settingRowRtl]}
            onPress={() => openUrl('https://deepskyn.com/privacy')}
            accessibilityRole="button"
            accessibilityLabel={t.landing.footerPrivacy}
          >
            <View style={[styles.settingLeft, isRTL && styles.settingLeftRtl]}>
              <Ionicons name="shield-outline" size={20} color={colors.textSecondary} />
              <Text style={dynamicStyles.settingLabel}>{t.landing.footerPrivacy}</Text>
            </View>
            <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        </Card>
      </View>
    </>
  );

  const renderContent = () => {
    if (currentView === 'personal') return renderPersonalView();
    if (currentView === '2fa') return renderTwoFactorView();
    if (currentView === 'password') return renderPasswordView();
    if (currentView === 'notifications') return renderNotificationsView();
    if (currentView === 'appearance') return renderAppearanceView();
    if (currentView === 'language') return renderLanguageView();
    if (currentView === 'payment') return renderPaymentView();
    if (currentView === 'help') return renderHelpView();
    if (currentView === 'terms') return renderTermsView();
    return renderMainView();
  };

  return (
    <SafeAreaView style={dynamicStyles.safeArea} edges={['left', 'right']}>
      <ScrollView style={dynamicStyles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.headerIconWrap}>
              <Ionicons name="settings-outline" size={20} color={colors.primary} />
            </View>
            <Text style={dynamicStyles.title}>{currentView === 'main' ? t.settings.title : t.settings.managePreferences}</Text>
          </View>
          {currentView === 'main' ? (
            <Text style={dynamicStyles.subtitle}>{t.settings.managePreferences}</Text>
          ) : null}
        </View>

        {renderContent()}

      <View style={styles.footer}>
        <Text style={dynamicStyles.footerText}>DeepSkyn v1.0.0</Text>
        <Text style={dynamicStyles.footerText}>© 2026 DeepSkyn. {allRightsReservedLabel}</Text>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerIconWrap: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.base,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryAlpha10,
  },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  userRowRtl: { flexDirection: 'row-reverse' },
  userAvatar: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
  },
    userAvatarImage: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: Colors.gray100,
    },
  userAvatarText: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.white },
  section: { paddingHorizontal: Spacing.xl, marginTop: Spacing.xl },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  backRowRtl: { flexDirection: 'row-reverse' },
  settingRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
  },
  settingRowNoBorder: { borderBottomWidth: 0 },
  settingRowRtl: { flexDirection: 'row-reverse' },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1, minWidth: 0 },
  settingLeftRtl: { flexDirection: 'row-reverse' },
  publicBadge: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  publicBadgeOn: { backgroundColor: Colors.primaryAlpha10 },
  publicBadgeOff: { backgroundColor: Colors.gray100 },
  publicSwitchContainer: { alignItems: 'flex-end', marginLeft: Spacing.sm, minWidth: 56 },
  languageRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  languageRowRtl: { flexDirection: 'row-reverse' },
  qrCode: {
    width: 180,
    height: 180,
    alignSelf: 'center',
    borderRadius: BorderRadius.md,
  },
  deleteButton: { alignItems: 'center', marginTop: Spacing.md, padding: Spacing.sm },
  footer: { alignItems: 'center', marginTop: Spacing['2xl'] },
});
