import React, { useState } from 'react';
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

export function SignupScreen({ navigation }: any) {
  const { register, isLoading } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const passwordStrength = (pwd: string) => {
    if (pwd.length === 0) return { strength: 0, label: '', color: Colors.gray200 };
    if (pwd.length < 8) return { strength: 1, label: 'Weak (min 8 chars)', color: '#EF4444' };
    if (!/[A-Z]/.test(pwd)) return { strength: 2, label: 'Add a capital letter', color: '#F59E0B' };
    return { strength: 3, label: 'Strong', color: '#10B981' };
  };

  const strength = passwordStrength(password);

  const handleSignup = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
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
      Alert.alert('Success', 'Account created successfully!');
      navigation.navigate('Onboarding');
    } catch (error: any) {
      Alert.alert('Signup Failed', error.response?.data?.message || 'Something went wrong');
    }
  };

  const openGoogleAuth = () => {
    Alert.alert('Social Auth', 'Google Signup would open here');
  };

  const openFacebookAuth = () => {
    Alert.alert('Social Auth', 'Facebook Signup would open here');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={Colors.gray500} />
            <Text style={styles.backText}>Back to home</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Logo size="lg" />
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Start your journey to better skin</Text>
          </View>

          {/* Form Card */}
          <Card variant="elevated" style={styles.formCard}>
            <Input
              label="Full Name"
              placeholder="John Doe"
              value={name}
              onChangeText={setName}
              icon={<Ionicons name="person-outline" size={20} color={Colors.gray400} />}
            />
            <Input
              label="Email"
              placeholder="your@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              icon={<Ionicons name="mail-outline" size={20} color={Colors.gray400} />}
            />
            <Input
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              icon={<Ionicons name="lock-closed-outline" size={20} color={Colors.gray400} />}
            />

            {/* Password Strength Indicator */}
            {password.length > 0 && (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthTrack}>
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
              label="Confirm Password"
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              icon={<Ionicons name="lock-closed-outline" size={20} color={Colors.gray400} />}
              error={confirmPassword.length > 0 && password !== confirmPassword ? "Passwords don't match" : undefined}
            />

            {/* Terms Checkbox */}
            <TouchableOpacity style={styles.termsRow} onPress={() => setAgreedToTerms(!agreedToTerms)}>
              <Ionicons
                name={agreedToTerms ? 'checkbox' : 'square-outline'}
                size={22}
                color={agreedToTerms ? Colors.primary : Colors.gray300}
              />
              <Text style={styles.termsText}>
                I agree to the{' '}
                <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </TouchableOpacity>

            <Button
              onPress={handleSignup}
              loading={isLoading}
              disabled={!agreedToTerms || (confirmPassword.length > 0 && password !== confirmPassword)}
              fullWidth
            >
              Create Account
            </Button>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Buttons */}
            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.socialButton} onPress={openGoogleAuth}>
                <Ionicons name="logo-google" size={20} color="#DB4437" />
                <Text style={styles.socialText}>Google</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.socialButton} onPress={openFacebookAuth}>
                <Ionicons name="logo-facebook" size={20} color="#4267B2" />
                <Text style={styles.socialText}>Facebook</Text>
              </TouchableOpacity>
            </View>

            {/* Login link */}
            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Sign in</Text>
              </TouchableOpacity>
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
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
  strengthContainer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.base },
  strengthTrack: { flex: 1, height: 4, backgroundColor: Colors.gray200, borderRadius: 2 },
  strengthFill: { height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: FontSizes.xs, fontWeight: FontWeights.medium },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, marginBottom: Spacing.xl },
  termsText: { flex: 1, fontSize: FontSizes.sm, color: Colors.gray500, lineHeight: 20 },
  termsLink: { color: Colors.primary },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.xl },
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
  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: Spacing.xl },
  loginText: { fontSize: FontSizes.sm, color: Colors.gray500 },
  loginLink: { fontSize: FontSizes.sm, color: Colors.primary, fontWeight: FontWeights.bold },
});
