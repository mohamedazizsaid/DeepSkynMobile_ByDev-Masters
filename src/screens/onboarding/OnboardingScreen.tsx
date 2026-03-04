import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Logo } from '../../components';
import { OnboardingProgressBar } from './OnboardingProgressBar';
import { WelcomeStep } from './WelcomeStep';
import { PersonalInfoStep } from './PersonalInfoStep';
import { SkinTypeStep } from './SkinTypeStep';
import { SkinConcernsStep } from './SkinConcernsStep';
import { PhotoUploadStep } from './PhotoUploadStep';
import { Colors, Spacing } from '../../theme';
import { authService } from '../../services/auth.service';

export function OnboardingScreen({ navigation }: any) {
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<any>({});

  const steps = ['Welcome', 'Personal Info', 'Photo', 'Skin Type', 'Concerns'];

  const handleNext = (data?: any) => {
    if (data) setOnboardingData((prev: any) => ({ ...prev, ...data }));
    if (currentStep === steps.length - 1) {
      handleComplete(data);
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const handleComplete = async (lastStepData?: any) => {
    try {
      const finalData = { ...onboardingData, ...lastStepData };

      // Save avatar if the user uploaded one during onboarding
      if (finalData.avatar) {
        await authService.updateProfile({ avatar: finalData.avatar });
      }

      // Navigate to dashboard
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Navigate anyway even if profile save fails
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: return <WelcomeStep onNext={handleNext} />;
      case 1: return <PersonalInfoStep onNext={handleNext} onBack={handleBack} />;
      case 2: return <PhotoUploadStep onNext={handleNext} onBack={handleBack} />;
      case 3: return <SkinTypeStep onNext={handleNext} onBack={handleBack} />;
      case 4: return <SkinConcernsStep onNext={handleNext} onBack={handleBack} />;
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
