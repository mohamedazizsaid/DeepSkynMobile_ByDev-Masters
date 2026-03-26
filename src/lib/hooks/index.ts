import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Custom hook for AsyncStorage (React Native equivalent of localStorage)
 */
export const useAsyncStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);

  // Read from storage on mount
  useEffect(() => {
    const readFromStorage = async () => {
      try {
        const item = await AsyncStorage.getItem(key);
        if (item) {
          setStoredValue(JSON.parse(item));
        }
      } catch (error) {
        console.error(`Error reading AsyncStorage key "${key}":`, error);
      } finally {
        setIsLoading(false);
      }
    };

    readFromStorage();
  }, [key]);

  const setValue = async (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      await AsyncStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting AsyncStorage key "${key}":`, error);
    }
  };

  const removeValue = async () => {
    try {
      await AsyncStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing AsyncStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue, removeValue, isLoading] as const;
};

/**
 * Backward compatible hook naming for web patterns
 */
export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [value, setValue, removeValue, isLoading] = useAsyncStorage(key, initialValue);

  return [value, setValue] as const;
};

export { useShareRoutine } from './useShareRoutine';
