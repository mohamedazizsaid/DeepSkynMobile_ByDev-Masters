import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input, Logo, Card } from '../../components';
import { Colors, Spacing, FontSizes, FontWeights } from '../../theme';
import { useAccessibilityStyles } from '../../stores/useAccessibilityStyles';

export function ResetPasswordScreen({ navigation }: any) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { colors, fontSizes } = useAccessibilityStyles();

  const dynamicStyles = useMemo(() => ({
    safeArea: { flex: 1, backgroundColor: colors.background },
    centeredContainer: { flex: 1, backgroundColor: colors.background, justifyContent: 'center' as const, paddingHorizontal: Spacing.xl },
    title: { fontSize: fontSizes['2xl'], fontWeight: FontWeights.bold, color: colors.text, marginTop: Spacing.base },
    subtitle: { fontSize: fontSizes.base, color: colors.textSecondary, marginTop: Spacing.xs },
    formCard: { padding: Spacing['2xl'], backgroundColor: colors.surface },
    successCard: { padding: Spacing['2xl'], alignItems: 'center' as const, backgroundColor: colors.surface },
    successTitle: { fontSize: fontSizes.xl, fontWeight: FontWeights.bold, color: colors.text, marginBottom: Spacing.base },
    successText: { fontSize: fontSizes.base, color: colors.textSecondary, textAlign: 'center' as const, marginBottom: Spacing['2xl'] },
  }), [colors, fontSizes]);

  const handleReset = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); setSuccess(true); }, 1500);
  };

  if (success) {
    return (
      <SafeAreaView style={dynamicStyles.centeredContainer}>
        <Card variant="elevated" style={dynamicStyles.successCard}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={48} color={colors.success} />
          </View>
          <Text style={dynamicStyles.successTitle}>Password Reset</Text>
          <Text style={dynamicStyles.successText}>You can now sign in with your new password.</Text>
          <Button onPress={() => navigation.navigate('Login')} fullWidth>
            Sign In
          </Button>
        </Card>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={dynamicStyles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Logo size="lg" />
          <Text style={dynamicStyles.title}>New Password</Text>
          <Text style={dynamicStyles.subtitle}>Choose a strong password for your account</Text>
        </View>

        <Card variant="elevated" style={dynamicStyles.formCard}>
          <Input
            label="New Password"
            placeholder="Min 8 characters"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            icon={<Ionicons name="lock-closed-outline" size={20} color={colors.textTertiary} />}
          />
          <Input
            label="Confirm Password"
            placeholder="••••••••"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            icon={<Ionicons name="lock-closed-outline" size={20} color={colors.textTertiary} />}
            error={confirmPassword.length > 0 && newPassword !== confirmPassword ? "Passwords don't match" : undefined}
          />
          <Button
            onPress={handleReset}
            loading={loading}
            disabled={newPassword.length < 8 || newPassword !== confirmPassword}
            fullWidth
          >
            Reset Password
          </Button>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: 40, flexGrow: 1 },
  header: { alignItems: 'center', marginBottom: Spacing['2xl'] },
  successIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.successAlpha10, alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
});
