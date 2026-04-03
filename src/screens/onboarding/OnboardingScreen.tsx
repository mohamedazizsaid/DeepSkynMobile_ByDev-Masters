import React, { useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Logo } from '../../components';
import { OnboardingProgressBar } from './OnboardingProgressBar';
import { WelcomeStep } from './WelcomeStep';
import { ProfileSetupStep } from './ProfileSetupStep';
import { SkinTypeStep } from './SkinTypeStep';
import { FitzpatrickStep } from './FitzpatrickStep';
import { SkinConcernsStep } from './SkinConcernsStep';
import { SensitivitiesStep } from './SensitivitiesStep';
import { SummaryStep } from './SummaryStep';
import { Colors, Spacing } from '../../theme';
import { skinProfileService } from '../../services/skin-profile.service';
import { useAuthStore } from '../../stores/auth.store';
import { useAccessibilityStyles } from '../../stores/useAccessibilityStyles';
import { useTranslation } from '../../lib/i18n/useTranslation';

export function OnboardingScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { markOnboardingComplete, loadUser } = useAuthStore();
  const { colors } = useAccessibilityStyles();
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = t.onboarding.steps;

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
      const payload: any = {};
      if (onboardingData.skinType) payload.skinType = onboardingData.skinType;
      if (onboardingData.fitzpatrickType) payload.fitzpatrickType = onboardingData.fitzpatrickType;
      if (onboardingData.concerns) payload.concerns = onboardingData.concerns;
      if (onboardingData.sensitivities) payload.sensitivities = onboardingData.sensitivities;

      await skinProfileService.upsert(payload);
      markOnboardingComplete();
      await loadUser();
    } catch (error: any) {
      console.error('Error completing onboarding:', error);
      Alert.alert(t.common.error, t.onboarding.error || 'Error saving profile');
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
      default: return <WelcomeStep onNext={() => handleNext()} />;
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
  container: { flex: 1 },
  header: { alignItems: 'center', paddingTop: Spacing.lg, paddingBottom: Spacing.xl },
  progressWrapper: { paddingHorizontal: Spacing.base, marginBottom: Spacing.xl },
  content: { flex: 1 },
  contentContainer: { paddingBottom: Spacing['3xl'] },
});
