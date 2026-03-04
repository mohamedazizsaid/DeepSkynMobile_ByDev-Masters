import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input, Logo, Card } from '../../components';
import { Colors, Spacing, FontSizes, FontWeights } from '../../theme';

export function ResetPasswordScreen({ navigation }: any) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleReset = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); setSuccess(true); }, 1500);
  };

  if (success) {
    return (
      <View style={styles.centeredContainer}>
        <Card variant="elevated" style={styles.successCard}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={48} color={Colors.success} />
          </View>
          <Text style={styles.successTitle}>Password Reset</Text>
          <Text style={styles.successText}>You can now sign in with your new password.</Text>
          <Button onPress={() => navigation.navigate('Login')} fullWidth>
            Sign In
          </Button>
        </Card>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Logo size="lg" />
        <Text style={styles.title}>New Password</Text>
        <Text style={styles.subtitle}>Choose a strong password for your account</Text>
      </View>

      <Card variant="elevated" style={styles.formCard}>
        <Input
          label="New Password"
          placeholder="Min 8 characters"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          icon={<Ionicons name="lock-closed-outline" size={20} color={Colors.gray400} />}
        />
        <Input
          label="Confirm Password"
          placeholder="••••••••"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          icon={<Ionicons name="lock-closed-outline" size={20} color={Colors.gray400} />}
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray50 },
  content: { paddingHorizontal: Spacing.xl, paddingTop: 60, paddingBottom: 40, flexGrow: 1 },
  centeredContainer: {
    flex: 1, backgroundColor: Colors.gray50,
    justifyContent: 'center', paddingHorizontal: Spacing.xl,
  },
  header: { alignItems: 'center', marginBottom: Spacing['2xl'] },
  title: { fontSize: FontSizes['2xl'], fontWeight: FontWeights.bold, color: Colors.gray900, marginTop: Spacing.base },
  subtitle: { fontSize: FontSizes.base, color: Colors.gray500, marginTop: Spacing.xs },
  formCard: { padding: Spacing['2xl'] },
  successCard: { padding: Spacing['2xl'], alignItems: 'center' },
  successIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.successAlpha10, alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  successTitle: { fontSize: FontSizes.xl, fontWeight: FontWeights.bold, color: Colors.gray900, marginBottom: Spacing.base },
  successText: { fontSize: FontSizes.base, color: Colors.gray500, textAlign: 'center', marginBottom: Spacing['2xl'] },
});
