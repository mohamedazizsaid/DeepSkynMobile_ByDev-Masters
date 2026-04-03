import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input, Logo, Card } from '../../components';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights } from '../../theme';
import { useAuthStore } from '../../stores/auth.store';
import { useAccessibilityStyles } from '../../stores/useAccessibilityStyles';
import { useTranslation } from '../../lib/i18n';

export function SignupScreen({ navigation }: any) {
  const { register, isLoading } = useAuthStore();
  const { colors, fontSizes } = useAccessibilityStyles();
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const dynamicStyles = useMemo(() => ({
    safeArea: { flex: 1, backgroundColor: colors.background },
    backText: { fontSize: fontSizes.base, color: colors.textSecondary },
    title: { fontSize: fontSizes['2xl'], fontWeight: FontWeights.bold, color: colors.text, marginTop: Spacing.base },
    subtitle: { fontSize: fontSizes.base, color: colors.textSecondary, marginTop: Spacing.xs, textAlign: 'center' as const },
    formCard: { padding: Spacing.xl, backgroundColor: colors.surface },
    strengthTrack: { flex: 1, height: 4, backgroundColor: colors.border, borderRadius: 2 },
    termsText: { flex: 1, fontSize: fontSizes.sm, color: colors.textSecondary, lineHeight: 20 },
    termsLink: { color: colors.primary },
    dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
    dividerText: { paddingHorizontal: Spacing.base, fontSize: fontSizes.sm, color: colors.textSecondary },
    socialButton: {
      flex: 1, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const,
      gap: Spacing.sm, paddingVertical: Spacing.md,
      borderWidth: 1.5, borderColor: colors.border,
      borderRadius: BorderRadius.base, backgroundColor: colors.surface,
    },
    socialText: { fontSize: fontSizes.base, fontWeight: FontWeights.medium, color: colors.text },
    loginText: { fontSize: fontSizes.sm, color: colors.textSecondary },
    loginLink: { fontSize: fontSizes.sm, color: colors.primary, fontWeight: FontWeights.bold },
  }), [colors, fontSizes]);

  const passwordStrength = (pwd: string) => {
    if (pwd.length === 0) return { strength: 0, label: '', color: colors.border };
    if (pwd.length < 8) return { strength: 1, label: t.auth.minChars, color: colors.error };
    if (!/[A-Z]/.test(pwd)) return { strength: 2, label: t.auth.uppercaseReq, color: colors.warning };
    return { strength: 3, label: t.common.success, color: colors.success };
  };

  const strength = passwordStrength(password);

  const handleSignup = async () => {
    if (!name || !email || !password) {
      Alert.alert(t.common.error, t.auth.fieldRequired);
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t.common.error, t.auth.passMismatch);
      return;
    }

    if (strength.strength < 3) {
      Alert.alert('Weak Password', 'Please choose a stronger password (8+ chars, 1 uppercase)');
      return;
    }

    try {
      await register({
        email,
        password,
        name,
      });
      Alert.alert(t.common.success, t.auth.signupSuccess);
      navigation.navigate('Onboarding');
    } catch (error: any) {
      Alert.alert(t.common.error, error.response?.data?.message || t.auth.registerError);
    }
  };

  const openGoogleAuth = () => {
    Alert.alert('Social Auth', 'Google Signup would open here');
  };

  const openFacebookAuth = () => {
    Alert.alert('Social Auth', 'Facebook Signup would open here');
  };

  return (
    <SafeAreaView style={dynamicStyles.safeArea}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
            <Text style={dynamicStyles.backText}>{t.common.back}</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Logo size="lg" />
            <Text style={dynamicStyles.title}>{t.auth.signupTitle}</Text>
            <Text style={dynamicStyles.subtitle}>{t.auth.signupSubtitle}</Text>
          </View>

          {/* Form Card */}
          <Card variant="elevated" style={dynamicStyles.formCard}>
            <Input
              label={t.auth.fullName}
              placeholder="John Doe"
              value={name}
              onChangeText={setName}
              icon={<Ionicons name="person-outline" size={20} color={colors.textTertiary} />}
            />
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
              secureTextEntry
              icon={<Ionicons name="lock-closed-outline" size={20} color={colors.textTertiary} />}
            />

            {/* Password Strength Indicator */}
            {password.length > 0 && (
              <View style={styles.strengthContainer}>
                <View style={dynamicStyles.strengthTrack}>
                  <View
                    style={[
                      styles.strengthFill,
                      { width: `${(strength.strength / 3) * 100}%`, backgroundColor: strength.color },
                    ]}
                  />
                </View>
                <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
              </View>
            )}

            <Input
              label={t.auth.confirmPassword}
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              icon={<Ionicons name="lock-closed-outline" size={20} color={colors.textTertiary} />}
              error={confirmPassword.length > 0 && password !== confirmPassword ? t.auth.passMismatch : undefined}
            />

            {/* Terms Checkbox */}
            <TouchableOpacity style={styles.termsRow} onPress={() => setAgreedToTerms(!agreedToTerms)}>
              <Ionicons
                name={agreedToTerms ? 'checkbox' : 'square-outline'}
                size={22}
                color={agreedToTerms ? colors.primary : colors.textTertiary}
              />
              <Text style={dynamicStyles.termsText}>
                {t.settings.tabs.terms} {t.landing.footerPrivacy}
              </Text>
            </TouchableOpacity>

            <Button
              onPress={handleSignup}
              loading={isLoading}
              disabled={!agreedToTerms || (confirmPassword.length > 0 && password !== confirmPassword)}
              fullWidth
            >
              {t.auth.createAccount}
            </Button>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={dynamicStyles.dividerLine} />
              <Text style={dynamicStyles.dividerText}>{t.auth.orContinue}</Text>
              <View style={dynamicStyles.dividerLine} />
            </View>

            {/* Social Buttons */}
            <View style={styles.socialRow}>
              <TouchableOpacity style={dynamicStyles.socialButton} onPress={openGoogleAuth}>
                <Ionicons name="logo-google" size={20} color="#DB4437" />
                <Text style={dynamicStyles.socialText}>Google</Text>
              </TouchableOpacity>

              <TouchableOpacity style={dynamicStyles.socialButton} onPress={openFacebookAuth}>
                <Ionicons name="logo-facebook" size={20} color="#4267B2" />
                <Text style={dynamicStyles.socialText}>Facebook</Text>
              </TouchableOpacity>
            </View>

            {/* Login link */}
            <View style={styles.loginRow}>
              <Text style={dynamicStyles.loginText}>{t.auth.haveAccount} </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={dynamicStyles.loginLink}>{t.auth.signIn}</Text>
              </TouchableOpacity>
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: Spacing.xl, paddingTop: 20, paddingBottom: 40 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xl },
  header: { alignItems: 'center', marginBottom: Spacing['2xl'] },
  strengthContainer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.base },
  strengthFill: { height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: FontSizes.xs, fontWeight: FontWeights.medium },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, marginBottom: Spacing.xl },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.xl },
  socialRow: { flexDirection: 'row', gap: Spacing.md },
  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: Spacing.xl },
});
