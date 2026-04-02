import React, { useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Logo } from '../../components';
import { OnboardingProgressBar } from './OnboardingProgressBar';
import { WelcomeStep } from './WelcomeStep';
import { PersonalInfoStep } from './PersonalInfoStep';
import { ProfileSetupStep } from './ProfileSetupStep';
import { SkinTypeStep } from './SkinTypeStep';
import { FitzpatrickStep } from './FitzpatrickStep';
import { SkinConcernsStep } from './SkinConcernsStep';
import { SensitivitiesStep } from './SensitivitiesStep';
import { SummaryStep } from './SummaryStep';
import { PhotoUploadStep } from './PhotoUploadStep';
import { Colors, Spacing } from '../../theme';
import { authService } from '../../services/auth.service';
import { skinProfileService } from '../../services/skin-profile.service';
import { useAuthStore } from '../../stores/auth.store';
import { useAccessibilityStyles } from '../../stores/useAccessibilityStyles';

export function OnboardingScreen({ navigation }: any) {
  const { markOnboardingComplete, loadUser } = useAuthStore();
  const { colors } = useAccessibilityStyles();
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = ['Welcome', 'Profile', 'Skin Type', 'Fitzpatrick', 'Concerns', 'Sensitivities', 'Summary'];

  const dynamicStyles = useMemo(() => ({
    container: { flex: 1, backgroundColor: colors.background },
  }), [colors]);

  const handleNext = (data?: any) => {
    if (data) setOnboardingData((prev: any) => ({ ...prev, ...data }));
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      // Build payload, filtering out undefined values
      const payload: any = {};
      if (onboardingData.skinType) payload.skinType = onboardingData.skinType;
      if (onboardingData.fitzpatrickType) payload.fitzpatrickType = onboardingData.fitzpatrickType;
      if (onboardingData.concerns) payload.concerns = onboardingData.concerns;
      if (onboardingData.sensitivities) payload.sensitivities = onboardingData.sensitivities;

      console.log('Onboarding payload:', JSON.stringify(payload, null, 2));

      // Save skin profile to backend (this also marks onboarding as complete on the server)
      await skinProfileService.upsert(payload);

      // Mark onboarding complete in store for immediate navigation
      markOnboardingComplete();

      // Reload user to sync all data from server
      await loadUser();

      // Navigation will automatically switch to Main due to RootNavigator logic
    } catch (error: any) {
      console.error('Error completing onboarding:', error);
      console.error('Error response:', error.response?.data);
      Alert.alert('Erreur', 'Erreur lors de la sauvegarde du profil. Réessayez.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProfileComplete = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: return <WelcomeStep onNext={() => handleNext()} />;
      case 1: return <ProfileSetupStep onComplete={handleProfileComplete} />;
      case 2: return <SkinTypeStep onNext={handleNext} onBack={handleBack} initialValue={onboardingData.skinType} />;
      case 3: return <FitzpatrickStep onNext={handleNext} onBack={handleBack} initialValue={onboardingData.fitzpatrickType} />;
      case 4: return <SkinConcernsStep onNext={handleNext} onBack={handleBack} initialValue={onboardingData.concerns} />;
      case 5: return <SensitivitiesStep onNext={handleNext} onBack={handleBack} initialValue={onboardingData.sensitivities} />;
      case 6: return <SummaryStep data={onboardingData} onSubmit={handleComplete} onBack={handleBack} isSubmitting={isSubmitting} />;
      default: return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]}>
      <View style={styles.header}>
        <Logo />
      </View>

      {currentStep > 0 && (
        <View style={styles.progressWrapper}>
          <OnboardingProgressBar currentStep={currentStep} totalSteps={steps.length} steps={steps} />
        </View>
      )}

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {renderStep()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray50 },
  header: { alignItems: 'center', paddingTop: Spacing.lg, paddingBottom: Spacing.xl },
  progressWrapper: { paddingHorizontal: Spacing.base, marginBottom: Spacing.xl },
  content: { flex: 1 },
  contentContainer: { paddingBottom: Spacing['3xl'] },
});
