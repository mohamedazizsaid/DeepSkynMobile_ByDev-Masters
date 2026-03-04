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
  Modal,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input, Logo, Card } from '../../components';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights } from '../../theme';
import { useAuthStore } from '../../stores/auth.store';
import { FaceIDScanner } from '../../components/auth/FaceIDScanner';
import { authService } from '../../services/auth.service';

export function LoginScreen({ navigation }: any) {
  const { login, faceLogin, isLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showFaceID, setShowFaceID] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
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
      } else if (result.success) {
        navigation.navigate('Main');
      }
    } catch (error: any) {
      Alert.alert('Login Failed', error.response?.data?.message || 'Invalid credentials');
    }
  };

  const handleFaceIDSuccess = async () => {
    try {
      const success = await faceLogin(email);
      if (success) {
        setShowFaceID(false);
        navigation.navigate('Main');
      } else {
        Alert.alert('Error', 'Face ID authentication failed');
        setShowFaceID(false);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Face ID failed');
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
    <SafeAreaView style={styles.safeArea}>
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
            <Ionicons name="arrow-back" size={20} color={Colors.gray500} />
            <Text style={styles.backText}>Back to home</Text>
          </TouchableOpacity>

          {/* Logo & Header */}
          <View style={styles.header}>
            <Logo size="lg" />
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue your skin journey</Text>
          </View>

          {/* Form Card */}
          <Card variant="elevated" style={styles.formCard}>
            {!showTwoFactor ? (
              <>
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

                <View style={styles.optionsRow}>
                  <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                    <Text style={styles.forgotText}>Forgot password?</Text>
                  </TouchableOpacity>

                  {/* FaceID Option */}
                  <TouchableOpacity
                    style={styles.faceIdLink}
                    onPress={() => email ? setShowFaceID(true) : Alert.alert('Info', 'Enter email first for FaceID')}
                  >
                    <Ionicons name="scan-outline" size={18} color={Colors.primary} />
                    <Text style={styles.faceIdText}>Face ID</Text>
                  </TouchableOpacity>
                </View>

                <Button onPress={handleLogin} loading={isLoading} fullWidth>
                  Sign In
                </Button>
              </>
            ) : (
              <View style={styles.twoFactorContainer}>
                <View style={styles.twoFactorHeader}>
                  <View style={styles.twoFactorIcon}>
                    <Ionicons name="shield-checkmark" size={32} color={Colors.primary} />
                  </View>
                  <Text style={styles.twoFactorTitle}>2FA Verification</Text>
                  <Text style={styles.twoFactorSubtitle}>Enter the 6-digit code from your authenticator app</Text>
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
                  Verify Code
                </Button>

                <TouchableOpacity
                  onPress={() => { setShowTwoFactor(false); setTwoFactorCode(''); }}
                  style={styles.cancel2fa}
                >
                  <Text style={styles.cancel2faText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}

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

            {/* Sign up link */}
            <View style={styles.signupRow}>
              <Text style={styles.signupText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                <Text style={styles.signupLink}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* FaceID Scanner Modal */}
      <Modal visible={showFaceID} animationType="slide">
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
