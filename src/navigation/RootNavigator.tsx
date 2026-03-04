import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Auth screens
import { LandingScreen } from '../screens/auth/LandingScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignupScreen } from '../screens/auth/SignupScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { ResetPasswordScreen } from '../screens/auth/ResetPasswordScreen';

// Onboarding
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';

// Dashboard (tab navigator)
import { DashboardTabNavigator } from './DashboardTabNavigator';

// Standalone screens
// import { NotificationScreen } from '../screens/dashboard/NotificationScreen';

export type RootStackParamList = {
  Landing: undefined;
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
  Onboarding: undefined;
  Main: undefined;
  Notifications: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Landing"
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      {/* Auth Flow */}
      <Stack.Screen name="Landing" component={LandingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />

      {/* Onboarding */}
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />

      {/* Main App (Tab Navigator) */}
      <Stack.Screen name="Main" component={DashboardTabNavigator} />

      {/* Modal / Overlay screens */}
      {/* <Stack.Screen
        name="Notifications"
        component={NotificationScreen}
        options={{ animation: 'slide_from_bottom' }}
      /> */}
    </Stack.Navigator>
  );
}
