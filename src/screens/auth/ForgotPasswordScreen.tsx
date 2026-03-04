import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input, Logo, Card } from '../../components';
import { Colors, Spacing, FontSizes, FontWeights } from '../../theme';

export function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); setSent(true); }, 1500);
  };

  if (sent) {
    return (
      <View style={styles.centeredContainer}>
        <Card variant="elevated" style={styles.successCard}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={48} color={Colors.success} />
          </View>
          <Text style={styles.successTitle}>Check Your Email</Text>
          <Text style={styles.successText}>
            We've sent password reset instructions to{' '}
            <Text style={{ fontWeight: FontWeights.medium, color: Colors.gray900 }}>{email}</Text>
          </Text>
          <Button onPress={() => navigation.navigate('Login')} fullWidth>
            Back to Sign In
          </Button>
          <TouchableOpacity onPress={() => setSent(false)} style={styles.retryButton}>
            <Text style={styles.retryText}>Didn't receive the email? Try again</Text>
          </TouchableOpacity>
        </Card>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={20} color={Colors.gray500} />
        <Text style={styles.backText}>Back to sign in</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Logo size="lg" />
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>Enter your email to receive reset instructions</Text>
      </View>

      <Card variant="elevated" style={styles.formCard}>
        <Input
          label="Email Address"
          placeholder="your@email.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          icon={<Ionicons name="mail-outline" size={20} color={Colors.gray400} />}
        />
        <Button onPress={handleSubmit} loading={loading} fullWidth>
          Send Reset Link
        </Button>

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Remember your password? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray50 },
  content: { paddingHorizontal: Spacing.xl, paddingTop: 60, paddingBottom: 40, flexGrow: 1 },
  centeredContainer: {
    flex: 1, backgroundColor: Colors.gray50,
    justifyContent: 'center', paddingHorizontal: Spacing.xl,
  },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing['2xl'] },
  backText: { fontSize: FontSizes.base, color: Colors.gray500 },
  header: { alignItems: 'center', marginBottom: Spacing['2xl'] },
  title: { fontSize: FontSizes['2xl'], fontWeight: FontWeights.bold, color: Colors.gray900, marginTop: Spacing.base },
  subtitle: { fontSize: FontSizes.base, color: Colors.gray500, marginTop: Spacing.xs, textAlign: 'center' },
  formCard: { padding: Spacing['2xl'] },
  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: Spacing.xl },
  loginText: { fontSize: FontSizes.sm, color: Colors.gray500 },
  loginLink: { fontSize: FontSizes.sm, color: Colors.primary, fontWeight: FontWeights.medium },
  successCard: { padding: Spacing['2xl'], alignItems: 'center' },
  successIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.successAlpha10, alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  successTitle: { fontSize: FontSizes.xl, fontWeight: FontWeights.bold, color: Colors.gray900, marginBottom: Spacing.base },
  successText: { fontSize: FontSizes.base, color: Colors.gray500, textAlign: 'center', marginBottom: Spacing['2xl'], lineHeight: 24 },
  retryButton: { marginTop: Spacing.base },
  retryText: { fontSize: FontSizes.sm, color: Colors.gray500 },
});
