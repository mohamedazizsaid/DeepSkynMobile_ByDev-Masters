import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
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

export function OnboardingScreen({ navigation }: any) {
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = ['Welcome', 'Profile', 'Skin Type', 'Fitzpatrick', 'Concerns', 'Sensitivities', 'Summary'];

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
      // Save skin profile to backend
      await skinProfileService.upsert({
        skinType: onboardingData.skinType,
        fitzpatrickType: onboardingData.fitzpatrickType,
        concerns: onboardingData.concerns,
        sensitivities: onboardingData.sensitivities,
      });

      // Navigate to dashboard
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (error) {
      console.error('Error completing onboarding:', error);
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
    <View style={styles.container}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray50 },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: Spacing.xl },
  progressWrapper: { paddingHorizontal: Spacing.base, marginBottom: Spacing.xl },
  content: { flex: 1 },
  contentContainer: { paddingBottom: Spacing['3xl'] },
});
