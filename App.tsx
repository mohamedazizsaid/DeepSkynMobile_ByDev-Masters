import 'react-native-gesture-handler'; // Required for JS Stack
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation';
import { AccessibilityProvider } from './src/components/accessibility';
import { useAccessibilityStore } from './src/stores/accessibility.store';

function AppContent() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default function App() {
  // Load accessibility preferences on app start
  const loadPreferences = useAccessibilityStore(state => state.loadPreferences);
  
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  return (
    <AccessibilityProvider>
      <AppContent />
    </AccessibilityProvider>
  );
}


