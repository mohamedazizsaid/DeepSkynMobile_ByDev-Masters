import { useCallback, useRef } from 'react';
import { Alert, ToastAndroid, Platform } from 'react-native';

type ToastType = 'success' | 'error' | 'loading' | 'info';

/**
 * Custom hook for showing notifications/toasts (React Native)
 * Uses Alert on iOS and ToastAndroid on Android
 */
export const useNotification = () => {
  const toastIdRef = useRef<string | null>(null);

  const show = useCallback((message: string, type: ToastType = 'success') => {
    if (Platform.OS === 'android') {
      // Use ToastAndroid for better UX on Android
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      // Use Alert.alert for iOS (or custom modal in real app)
      // In production, consider using a toast library like react-native-toast-notifications
      Alert.alert(
        type === 'error' ? 'Erreur' : type === 'success' ? 'Succès' : 'Info',
        message
      );
    }
    toastIdRef.current = message;
    return message;
  }, []);

  const success = useCallback((message: string) => show(message, 'success'), [show]);
  const error = useCallback((message: string) => show(message, 'error'), [show]);
  const loading = useCallback((message: string) => show(message, 'loading'), [show]);
  const info = useCallback((message: string) => show(message, 'info'), [show]);

  return {
    show,
    success,
    error,
    loading,
    info,
  };
};
