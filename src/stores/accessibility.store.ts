import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Theme = 'light' | 'dark';
type ContrastMode = 'off' | 'medium' | 'high';

interface AccessibilityState {
  // State
  theme: Theme;
  contrastMode: ContrastMode;
  zoomLevel: number;
  reduceMotion: boolean;
  dyslexiaFont: boolean;
  bigCursor: boolean;
  textSpacing: boolean;
  isPanelOpen: boolean;

  // Actions
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setContrastMode: (mode: ContrastMode) => void;
  resetContrastMode: () => void;
  toggleReduceMotion: () => void;
  toggleDyslexiaFont: () => void;
  toggleBigCursor: () => void;
  toggleTextSpacing: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  togglePanel: () => void;
  closePanel: () => void;
  loadPreferences: () => Promise<void>;
  savePreferences: () => Promise<void>;
}

export const useAccessibilityStore = create<AccessibilityState>((set, get) => ({
  theme: 'light',
  contrastMode: 'off',
  zoomLevel: 100,
  reduceMotion: false,
  dyslexiaFont: false,
  bigCursor: false,
  textSpacing: false,
  isPanelOpen: false,

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
    const next = !get().reduceMotion;
    set({ reduceMotion: next });
    get().savePreferences();
  },

  toggleDyslexiaFont: () => {
    const next = !get().dyslexiaFont;
    set({ dyslexiaFont: next });
    get().savePreferences();
  },

  toggleBigCursor: () => {
    const next = !get().bigCursor;
    set({ bigCursor: next });
    get().savePreferences();
  },

  toggleTextSpacing: () => {
    const next = !get().textSpacing;
    set({ textSpacing: next });
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

  loadPreferences: async () => {
    try {
      const stored = await AsyncStorage.getItem('deepskyn-accessibility');
      if (stored) {
        const preferences = JSON.parse(stored);
        set(preferences);
      }
    } catch (error) {
      console.error('Failed to load accessibility preferences:', error);
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
      };
      await AsyncStorage.setItem('deepskyn-accessibility', JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save accessibility preferences:', error);
    }
  },
}));
