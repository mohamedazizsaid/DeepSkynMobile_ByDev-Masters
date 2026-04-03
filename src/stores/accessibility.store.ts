import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';

type Theme = 'light' | 'dark';
type ContrastMode = 'off' | 'medium' | 'high';
export type Language = 'fr' | 'en' | 'ar' | 'es';

interface AccessibilityState {
  // State
  theme: Theme;
  contrastMode: ContrastMode;
  zoomLevel: number;
  reduceMotion: boolean;
  dyslexiaFont: boolean;
  bigCursor: boolean;
  textSpacing: boolean;
  focusHighlight: boolean;
  linkHighlight: boolean;
  isPanelOpen: boolean;
  
  // Text-to-Speech
  isSpeaking: boolean;
  speechRate: number;
  
  // Language
  language: Language;

  // Actions - Theme & Display
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setContrastMode: (mode: ContrastMode) => void;
  resetContrastMode: () => void;
  
  // Actions - Vision Features
  toggleReduceMotion: () => void;
  toggleDyslexiaFont: () => void;
  toggleBigCursor: () => void;
  toggleTextSpacing: () => void;
  toggleFocusHighlight: () => void;
  toggleLinkHighlight: () => void;
  
  // Actions - Zoom
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  
  // Actions - Panel
  togglePanel: () => void;
  closePanel: () => void;
  
  // Actions - Text-to-Speech
  speak: (text: string) => void;
  stopSpeaking: () => void;
  setSpeechRate: (rate: number) => void;
  
  // Actions - Language
  setLanguage: (language: Language) => void;
  
  // Actions - Persistence
  loadPreferences: () => Promise<void>;
  savePreferences: () => Promise<void>;
  resetAll: () => void;
}

export const useAccessibilityStore = create<AccessibilityState>((set, get) => ({
  theme: 'light',
  contrastMode: 'off',
  zoomLevel: 100,
  reduceMotion: false,
  dyslexiaFont: false,
  bigCursor: false,
  textSpacing: false,
  focusHighlight: false,
  linkHighlight: false,
  isPanelOpen: false,
  isSpeaking: false,
  speechRate: 1.0,
  language: 'fr',

  toggleTheme: () => {
    const newTheme = get().theme === 'light' ? 'dark' : 'light';
    set({ theme: newTheme });
    get().savePreferences();
  },

  setTheme: (theme) => {
    set({ theme });
    get().savePreferences();
  },

  setContrastMode: (mode) => {
    set({ contrastMode: mode });
    get().savePreferences();
  },

  resetContrastMode: () => {
    set({ contrastMode: 'off' });
    get().savePreferences();
  },

  toggleReduceMotion: () => {
    const current = get().reduceMotion ?? false;
    set({ reduceMotion: !current });
    get().savePreferences();
  },

  toggleDyslexiaFont: () => {
    const current = get().dyslexiaFont ?? false;
    set({ dyslexiaFont: !current });
    get().savePreferences();
  },

  toggleBigCursor: () => {
    const current = get().bigCursor ?? false;
    set({ bigCursor: !current });
    get().savePreferences();
  },

  toggleTextSpacing: () => {
    const current = get().textSpacing ?? false;
    set({ textSpacing: !current });
    get().savePreferences();
  },

  toggleFocusHighlight: () => {
    const current = get().focusHighlight ?? false;
    set({ focusHighlight: !current });
    get().savePreferences();
  },

  toggleLinkHighlight: () => {
    const current = get().linkHighlight ?? false;
    set({ linkHighlight: !current });
    get().savePreferences();
  },

  zoomIn: () => {
    const next = Math.min(get().zoomLevel + 10, 150);
    set({ zoomLevel: next });
    get().savePreferences();
  },

  zoomOut: () => {
    const next = Math.max(get().zoomLevel - 10, 75);
    set({ zoomLevel: next });
    get().savePreferences();
  },

  resetZoom: () => {
    set({ zoomLevel: 100 });
    get().savePreferences();
  },

  togglePanel: () => set({ isPanelOpen: !get().isPanelOpen }),
  closePanel: () => set({ isPanelOpen: false }),

  // Text-to-Speech Actions
  speak: (text: string) => {
    const { speechRate, language } = get();
    if (!text || !text.trim()) {
      return;
    }
    
    // Stop any current speech
    Speech.stop();
    
    set({ isSpeaking: true });
    
    const languageCode = language === 'fr' ? 'fr-FR' : language === 'ar' ? 'ar-SA' : 'en-US';
    
    Speech.speak(text.trim(), {
      language: languageCode,
      rate: speechRate,
      pitch: 1.0,
      volume: 1.0,
      onDone: () => set({ isSpeaking: false }),
      onStopped: () => set({ isSpeaking: false }),
      onError: (error) => {
        console.error('TTS error:', error);
        set({ isSpeaking: false });
      },
    });
  },

  stopSpeaking: () => {
    Speech.stop();
    set({ isSpeaking: false });
  },

  setSpeechRate: (rate: number) => {
    const clampedRate = Math.max(0.5, Math.min(2.0, rate));
    set({ speechRate: clampedRate });
    get().savePreferences();
  },

  setLanguage: (language: Language) => {
    set({ language });
    get().savePreferences();
  },

  loadPreferences: async () => {
    try {
      const stored = await AsyncStorage.getItem('deepskyn-accessibility');
      if (stored) {
        let preferences;
        try {
          preferences = JSON.parse(stored);
        } catch {
          // Corrupted data, clear it
          await AsyncStorage.removeItem('deepskyn-accessibility');
          return;
        }
        
        // Only set valid preferences, ignore corrupted data
        if (preferences && typeof preferences === 'object') {
          set({
            theme: preferences.theme === 'dark' ? 'dark' : 'light',
            contrastMode: ['off', 'medium', 'high'].includes(preferences.contrastMode) ? preferences.contrastMode : 'off',
            zoomLevel: typeof preferences.zoomLevel === 'number' ? preferences.zoomLevel : 100,
            reduceMotion: preferences.reduceMotion === true,
            dyslexiaFont: preferences.dyslexiaFont === true,
            bigCursor: preferences.bigCursor === true,
            textSpacing: preferences.textSpacing === true,
            focusHighlight: preferences.focusHighlight === true,
            linkHighlight: preferences.linkHighlight === true,
            speechRate: typeof preferences.speechRate === 'number' ? preferences.speechRate : 1.0,
            language: ['fr', 'en', 'ar'].includes(preferences.language) ? preferences.language : 'fr',
          });
        }
      }
    } catch (error) {
      console.error('Failed to load accessibility preferences:', error);
      // Clear corrupted data
      await AsyncStorage.removeItem('deepskyn-accessibility');
    }
  },

  savePreferences: async () => {
    try {
      const state = get();
      const preferences = {
        theme: state.theme,
        contrastMode: state.contrastMode,
        zoomLevel: state.zoomLevel,
        reduceMotion: state.reduceMotion,
        dyslexiaFont: state.dyslexiaFont,
        bigCursor: state.bigCursor,
        textSpacing: state.textSpacing,
        focusHighlight: state.focusHighlight,
        linkHighlight: state.linkHighlight,
        speechRate: state.speechRate,
        language: state.language,
      };
      await AsyncStorage.setItem('deepskyn-accessibility', JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save accessibility preferences:', error);
    }
  },

  resetAll: () => {
    set({
      theme: 'light',
      contrastMode: 'off',
      zoomLevel: 100,
      reduceMotion: false,
      dyslexiaFont: false,
      bigCursor: false,
      textSpacing: false,
      focusHighlight: false,
      linkHighlight: false,
      speechRate: 1.0,
      language: 'fr',
    });
    get().savePreferences();
  },
}));
