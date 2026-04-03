import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input, Logo, Card } from '../../components';
import { Colors, Spacing, FontSizes, FontWeights } from '../../theme';
import { useAccessibilityStyles } from '../../stores/useAccessibilityStyles';
import { useTranslation } from '../../lib/i18n';

export function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { colors, fontSizes } = useAccessibilityStyles();
  const { t } = useTranslation();

  const dynamicStyles = useMemo(() => ({
    safeArea: { flex: 1, backgroundColor: colors.background },
    centeredContainer: { flex: 1, backgroundColor: colors.background, justifyContent: 'center' as const, paddingHorizontal: Spacing.xl },
    backText: { fontSize: fontSizes.base, color: colors.textSecondary },
    title: { fontSize: fontSizes['2xl'], fontWeight: FontWeights.bold, color: colors.text, marginTop: Spacing.base },
    subtitle: { fontSize: fontSizes.base, color: colors.textSecondary, marginTop: Spacing.xs, textAlign: 'center' as const },
    formCard: { padding: Spacing['2xl'], backgroundColor: colors.surface },
    loginText: { fontSize: fontSizes.sm, color: colors.textSecondary },
    loginLink: { fontSize: fontSizes.sm, color: colors.primary, fontWeight: FontWeights.medium },
    successCard: { padding: Spacing['2xl'], alignItems: 'center' as const, backgroundColor: colors.surface },
    successTitle: { fontSize: fontSizes.xl, fontWeight: FontWeights.bold, color: colors.text, marginBottom: Spacing.base },
    successText: { fontSize: fontSizes.base, color: colors.textSecondary, textAlign: 'center' as const, marginBottom: Spacing['2xl'], lineHeight: 24 },
    retryText: { fontSize: fontSizes.sm, color: colors.textSecondary },
  }), [colors, fontSizes]);

  const handleSubmit = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); setSent(true); }, 1500);
  };

  if (sent) {
    return (
      <SafeAreaView style={dynamicStyles.centeredContainer}>
        <Card variant="elevated" style={dynamicStyles.successCard}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={48} color={colors.success} />
          </View>
          <Text style={dynamicStyles.successTitle}>{t.auth.checkEmail}</Text>
          <Text style={dynamicStyles.successText}>
            {t.auth.resetInstructionsSent}{' '}
            <Text style={{ fontWeight: FontWeights.medium, color: colors.text }}>{email}</Text>
          </Text>
          <Button onPress={() => navigation.navigate('Login')} fullWidth>
            {t.auth.backToSignIn}
          </Button>
          <TouchableOpacity onPress={() => setSent(false)} style={styles.retryButton}>
            <Text style={dynamicStyles.retryText}>{t.auth.notReceivedEmail}</Text>
          </TouchableOpacity>
        </Card>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={dynamicStyles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
          <Text style={dynamicStyles.backText}>{t.auth.backToSignIn}</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Logo size="lg" />
          <Text style={dynamicStyles.title}>{t.auth.resetPassword}</Text>
          <Text style={dynamicStyles.subtitle}>{t.auth.enterEmailReset}</Text>
        </View>

        <Card variant="elevated" style={dynamicStyles.formCard}>
          <Input
            label={t.auth.email}
            placeholder="your@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            icon={<Ionicons name="mail-outline" size={20} color={colors.textTertiary} />}
          />
          <Button onPress={handleSubmit} loading={loading} fullWidth>
            {t.auth.sendResetLink}
          </Button>

          <View style={styles.loginRow}>
            <Text style={dynamicStyles.loginText}>{t.auth.rememberPassword} </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={dynamicStyles.loginLink}>{t.auth.signIn}</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: 40, flexGrow: 1 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing['2xl'] },
  header: { alignItems: 'center', marginBottom: Spacing['2xl'] },
  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: Spacing.xl },
  successIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.successAlpha10, alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  retryButton: { marginTop: Spacing.base },
});
