import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input, Logo, Card } from '../../components';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights } from '../../theme';
import { useAuthStore } from '../../stores/auth.store';
import { useAccessibilityStyles } from '../../stores/useAccessibilityStyles';
import { useTranslation } from '../../lib/i18n';
import { FaceIDScanner } from '../../components/auth/FaceIDScanner';
import { authService } from '../../services/auth.service';

export function LoginScreen({ navigation }: any) {
  const { login, faceLogin, loginWithGoogle, isLoading } = useAuthStore();
  const { colors, fontSizes, settings } = useAccessibilityStyles();
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showFaceID, setShowFaceID] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const loadRememberedCredentials = async () => {
      try {
        const [remember, rememberedEmail] = await Promise.all([
          AsyncStorage.getItem('remember_me'),
          AsyncStorage.getItem('remembered_email'),
        ]);

        const shouldRemember = remember === 'true';
        setRememberMe(shouldRemember);
        if (shouldRemember && rememberedEmail) {
          setEmail(rememberedEmail);
        }
      } catch {
        // Silent fail: login should stay usable even if local storage is unavailable.
      }
    };

    loadRememberedCredentials();
  }, []);

  // Dynamic styles based on accessibility
  const dynamicStyles = useMemo(() => ({
    safeArea: { flex: 1, backgroundColor: colors.background },
    backText: { fontSize: fontSizes.base, color: colors.textSecondary },
    title: { fontSize: fontSizes['2xl'], fontWeight: FontWeights.bold, color: colors.text, marginTop: Spacing.base },
    subtitle: { fontSize: fontSizes.base, color: colors.textSecondary, marginTop: Spacing.xs, textAlign: 'center' as const },
    formCard: { padding: Spacing.xl, backgroundColor: colors.surface },
    forgotText: { fontSize: fontSizes.sm, color: colors.primary },
    faceIdText: { fontSize: fontSizes.sm, color: colors.primary },
    dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
    dividerText: { paddingHorizontal: Spacing.md, fontSize: fontSizes.sm, color: colors.textTertiary },
    socialButton: { 
      flex: 1, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const,
      gap: Spacing.sm, padding: Spacing.md, borderRadius: BorderRadius.base,
      borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
    },
    socialText: { fontSize: fontSizes.sm, fontWeight: FontWeights.medium, color: colors.text },
    signupText: { fontSize: fontSizes.sm, color: colors.textSecondary },
    signupLink: { fontSize: fontSizes.sm, fontWeight: FontWeights.semibold, color: colors.primary },
    twoFactorTitle: { fontSize: fontSizes.lg, fontWeight: FontWeights.bold, color: colors.text, marginTop: Spacing.base },
    twoFactorSubtitle: { fontSize: fontSizes.sm, color: colors.textSecondary, textAlign: 'center' as const, marginTop: Spacing.xs },
    cancel2faText: { color: colors.textSecondary, fontWeight: FontWeights.medium },
    rememberRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: Spacing.xs,
      marginTop: Spacing.sm,
      marginBottom: Spacing.base,
      alignSelf: 'flex-start' as const,
    },
    rememberText: {
      fontSize: fontSizes.xs,
      color: colors.textSecondary,
      fontWeight: FontWeights.medium,
    },
  }), [colors, fontSizes]);

  const saveRememberPreference = async (emailValue: string) => {
    try {
      if (rememberMe) {
        await Promise.all([
          AsyncStorage.setItem('remember_me', 'true'),
          AsyncStorage.setItem('remembered_email', emailValue),
        ]);
      } else {
        await Promise.all([
          AsyncStorage.setItem('remember_me', 'false'),
          AsyncStorage.removeItem('remembered_email'),
        ]);
      }
    } catch {
      // Silent fail: authentication flow should not break on preference persistence.
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t.common.error, t.auth.fieldRequired);
      return;
    }

    try {
      const result = await login({
        username: email,
        password,
        twoFactorCode: showTwoFactor ? twoFactorCode : undefined
      });

      if (result.requiresTwoFactor) {
        setShowTwoFactor(true);
      } else {
        await saveRememberPreference(email);
      }
    } catch (error: any) {
      Alert.alert(t.common.error, error.response?.data?.message || t.auth.invalidCredentials);
    }
  };

  const handleFaceIDSuccess = async (imageBase64: string) => {
    try {
      const success = await faceLogin(email, imageBase64);
      if (success) {
        setShowFaceID(false);
      } else {
        Alert.alert(t.common.error, t.auth.faceIdError);
        setShowFaceID(false);
      }
    } catch (error: any) {
      Alert.alert(t.common.error, error.response?.data?.message || t.auth.faceIdError);
      setShowFaceID(false);
    }
  };

  const openGoogleAuth = async () => {
    try {
      const url = authService.getGoogleAuthUrl();
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open Google login page');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open Google login');
    }
  };

  const openFacebookAuth = async () => {
    try {
      const url = authService.getFacebookAuthUrl();
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open Facebook login page');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open Facebook login');
    }
  };

  return (
    <SafeAreaView style={dynamicStyles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
            <Text style={dynamicStyles.backText}>{t.common.back}</Text>
          </TouchableOpacity>

          {/* Logo & Header */}
          <View style={styles.header}>
            <Logo size="lg" />
            <Text style={dynamicStyles.title}>{t.auth.loginTitle}</Text>
            <Text style={dynamicStyles.subtitle}>{t.auth.loginSubtitle}</Text>
          </View>

          {/* Form Card */}
          <Card variant="elevated" style={dynamicStyles.formCard}>
            {!showTwoFactor ? (
              <>
                <Input
                  label={t.auth.email}
                  placeholder="your@email.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  icon={<Ionicons name="mail-outline" size={20} color={colors.textTertiary} />}
                />

                <Input
                  label={t.auth.password}
                  placeholder="••••••••"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  icon={<Ionicons name="lock-closed-outline" size={20} color={colors.textTertiary} />}
                  rightIcon={
                    <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)} activeOpacity={0.7}>
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color={colors.textTertiary}
                      />
                    </TouchableOpacity>
                  }
                />

                <TouchableOpacity
                  style={dynamicStyles.rememberRow}
                  onPress={() => setRememberMe((prev) => !prev)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={rememberMe ? 'checkbox-outline' : 'square-outline'}
                    size={16}
                    color={rememberMe ? colors.primary : colors.textTertiary}
                  />
                  <Text style={dynamicStyles.rememberText}>{t.auth.rememberMe}</Text>
                </TouchableOpacity>

                <View style={styles.optionsRow}>
                  <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                    <Text style={dynamicStyles.forgotText}>{t.auth.forgotPassword}</Text>
                  </TouchableOpacity>

                  {/* FaceID Option */}
                  <TouchableOpacity
                    style={styles.faceIdLink}
                    onPress={() => email ? setShowFaceID(true) : Alert.alert('Info', t.auth.faceIdNoEmail)}
                  >
                    <Ionicons name="scan-outline" size={18} color={colors.primary} />
                    <Text style={dynamicStyles.faceIdText}>Face ID</Text>
                  </TouchableOpacity>
                </View>

                <Button onPress={handleLogin} loading={isLoading} fullWidth>
                  {t.auth.signIn}
                </Button>

                <View style={styles.divider}>
                  <View style={dynamicStyles.dividerLine} />
                  <Text style={dynamicStyles.dividerText}>ou</Text>
                  <View style={dynamicStyles.dividerLine} />
                </View>

                <View style={styles.socialRow}>
                  <TouchableOpacity style={dynamicStyles.socialButton} onPress={openGoogleAuth} activeOpacity={0.85}>
                    <Ionicons name="logo-google" size={16} color={colors.text} />
                    <Text style={dynamicStyles.socialText}>Google</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={dynamicStyles.socialButton} onPress={openFacebookAuth} activeOpacity={0.85}>
                    <Ionicons name="logo-facebook" size={16} color={colors.text} />
                    <Text style={dynamicStyles.socialText}>Facebook</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.twoFactorContainer}>
                <View style={styles.twoFactorHeader}>
                  <View style={styles.twoFactorIcon}>
                    <Ionicons name="shield-checkmark" size={32} color={colors.primary} />
                  </View>
                  <Text style={dynamicStyles.twoFactorTitle}>{t.auth.twoFactorTitle}</Text>
                  <Text style={dynamicStyles.twoFactorSubtitle}>{t.auth.twoFactorSubtitle}</Text>
                </View>

                <Input
                  label="Verification Code"
                  placeholder="000000"
                  value={twoFactorCode}
                  onChangeText={setTwoFactorCode}
                  keyboardType="number-pad"
                  maxLength={6}
                  textAlign="center"
                  style={styles.twoFactorInput}
                />

                <Button onPress={handleLogin} loading={isLoading} fullWidth>
                  {t.auth.verify}
                </Button>

                <TouchableOpacity
                  onPress={() => { setShowTwoFactor(false); setTwoFactorCode(''); }}
                  style={styles.cancel2fa}
                >
                  <Text style={dynamicStyles.cancel2faText}>{t.common.cancel}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Sign up link */}
            <View style={styles.signupRow}>
              <Text style={dynamicStyles.signupText}>{t.auth.noAccount} </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                <Text style={dynamicStyles.signupLink}>{t.auth.signUpFree}</Text>
              </TouchableOpacity>
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* FaceID Scanner Modal */}
      <Modal visible={showFaceID} animationType={settings.reduceMotion ? 'none' : 'slide'}>
        <FaceIDScanner
          email={email}
          onSuccess={handleFaceIDSuccess}
          onCancel={() => setShowFaceID(false)}
        />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.gray50 },
  container: { flex: 1 },
  content: { paddingHorizontal: Spacing.xl, paddingTop: 20, paddingBottom: 40 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xl },
  backText: { fontSize: FontSizes.base, color: Colors.gray500 },
  header: { alignItems: 'center', marginBottom: Spacing['2xl'] },
  title: { fontSize: FontSizes['2xl'], fontWeight: FontWeights.bold, color: Colors.gray900, marginTop: Spacing.base },
  subtitle: { fontSize: FontSizes.base, color: Colors.gray500, marginTop: Spacing.xs, textAlign: 'center' },
  formCard: { padding: Spacing.xl },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  forgotText: { fontSize: FontSizes.sm, color: Colors.primary, fontWeight: FontWeights.medium },
  faceIdLink: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  faceIdText: { fontSize: FontSizes.sm, color: Colors.primary, fontWeight: FontWeights.bold },
  divider: {
    flexDirection: 'row', alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.gray200 },
  dividerText: { paddingHorizontal: Spacing.base, fontSize: FontSizes.sm, color: Colors.gray500 },
  socialRow: { flexDirection: 'row', gap: Spacing.md },
  socialButton: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: Spacing.md,
    borderWidth: 1.5, borderColor: Colors.gray200,
    borderRadius: BorderRadius.base, backgroundColor: Colors.white,
  },
  socialText: { fontSize: FontSizes.base, fontWeight: FontWeights.medium, color: Colors.gray700 },
  signupRow: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    marginTop: Spacing.xl,
  },
  signupText: { fontSize: FontSizes.sm, color: Colors.gray500 },
  signupLink: { fontSize: FontSizes.sm, color: Colors.primary, fontWeight: FontWeights.bold },
  // 2FA Styles
  twoFactorContainer: { alignItems: 'center', paddingVertical: Spacing.base },
  twoFactorHeader: { alignItems: 'center', marginBottom: Spacing.xl },
  twoFactorIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primary + '15', justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
  twoFactorTitle: { fontSize: FontSizes.xl, fontWeight: 'bold', color: Colors.gray900 },
  twoFactorSubtitle: { fontSize: FontSizes.sm, color: Colors.gray500, textAlign: 'center', marginTop: 8 },
  twoFactorInput: { fontSize: 24, fontWeight: 'bold', letterSpacing: 8 },
  cancel2fa: { marginTop: Spacing.lg },
  cancel2faText: { color: Colors.gray500, fontWeight: FontWeights.medium },
});
