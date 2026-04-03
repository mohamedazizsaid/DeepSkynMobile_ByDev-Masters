import 'react-native-gesture-handler'; // Required for JS Stack
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation';
import { AccessibilityPanel } from './src/components';
import { AccessibilityProvider } from './src/components/accessibility';
import { LaunchSplashScreen } from './src/components/splash/LaunchSplashScreen';
import { useAccessibilityStore } from './src/stores/accessibility.store';

function AppContent() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <RootNavigator />
          <AccessibilityPanel />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default function App() {
  const [showLaunchSplash, setShowLaunchSplash] = useState(true);

  // Load accessibility preferences on app start
  const loadPreferences = useAccessibilityStore(state => state.loadPreferences);
  
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  useEffect(() => {
    const splashTimer = setTimeout(() => {
      setShowLaunchSplash(false);
    }, 1900);

    return () => clearTimeout(splashTimer);
  }, []);

  return (
    <AccessibilityProvider>
      {showLaunchSplash ? <LaunchSplashScreen /> : <AppContent />}
    </AccessibilityProvider>
  );
}


