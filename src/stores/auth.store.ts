import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/auth.service';

interface User {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    onboardingComplete?: boolean;
    guidedTourCompleted?: boolean;
    [key: string]: any;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    requiresTwoFactor: boolean;
    tempCredentials: any | null;

    // Computed helpers
    needsOnboarding: () => boolean;
    needsGuidedTour: () => boolean;

    login: (data: any) => Promise<{ requiresTwoFactor: boolean; success: boolean }>;
    register: (data: any) => Promise<void>;
    faceLogin: (email: string) => Promise<boolean>;
    loginWithGoogle: (idToken: string) => Promise<void>;
    loadUser: () => Promise<void>;
    logout: () => Promise<void>;
    markOnboardingComplete: () => Promise<void>;
    markGuidedTourComplete: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    requiresTwoFactor: false,
    tempCredentials: null,

    needsOnboarding: () => {
        const user = get().user;
        return user !== null && !user.onboardingComplete;
    },

    needsGuidedTour: () => {
        const user = get().user;
        return user !== null && user.onboardingComplete && !user.guidedTourComplete;
    },

    login: async (data) => {
        set({ isLoading: true });
        try {
            const result = await authService.login(data);

            if (result.requiresTwoFactor && !data.twoFactorCode) {
                set({
                    requiresTwoFactor: true,
                    tempCredentials: data,
                    isLoading: false,
                });
                return { requiresTwoFactor: true, success: false };
            }

            if (result.tokens) {
                await AsyncStorage.setItem('access_token', result.tokens.access_token);
                await AsyncStorage.setItem('refresh_token', result.tokens.refresh_token);
            }

            set({ isAuthenticated: true, requiresTwoFactor: false, isLoading: false });
            await get().loadUser();
            return { requiresTwoFactor: false, success: true };
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    register: async (data) => {
        set({ isLoading: true });
        try {
            const result = await authService.register(data);
            if (result.tokens) {
                await AsyncStorage.setItem('access_token', result.tokens.access_token);
                await AsyncStorage.setItem('refresh_token', result.tokens.refresh_token);
            }
            set({ isAuthenticated: true, isLoading: false });
            await get().loadUser();
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    faceLogin: async (email) => {
        set({ isLoading: true });
        try {
            const result = await authService.faceLogin(email);
            if (result.tokens) {
                await AsyncStorage.setItem('access_token', result.tokens.access_token);
                await AsyncStorage.setItem('refresh_token', result.tokens.refresh_token);
                set({ isAuthenticated: true, isLoading: false });
                await get().loadUser();
                return true;
            }
            set({ isLoading: false });
            return false;
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    loginWithGoogle: async (idToken) => {
        set({ isLoading: true });
        try {
            const result = await authService.googleTokenAuth(idToken);
            if (result.tokens) {
                await AsyncStorage.setItem('access_token', result.tokens.access_token);
                await AsyncStorage.setItem('refresh_token', result.tokens.refresh_token);
            }
            set({ isAuthenticated: true, isLoading: false });
            await get().loadUser();
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    loadUser: async () => {
        try {
            const token = await AsyncStorage.getItem('access_token');
            if (!token) {
                set({ user: null, isAuthenticated: false });
                return;
            }
            const user = await authService.getProfile();
            // Load guided tour status from local storage
            const guidedTourCompleted = await AsyncStorage.getItem('guidedTourCompleted');
            set({ 
                user: { ...user, guidedTourCompleted: guidedTourCompleted === 'true' }, 
                isAuthenticated: true 
            });
        } catch {
            await AsyncStorage.removeItem('access_token');
            await AsyncStorage.removeItem('refresh_token');
            set({ user: null, isAuthenticated: false });
        }
    },

    logout: async () => {
        try {
            const refreshToken = await AsyncStorage.getItem('refresh_token');
            if (refreshToken) {
                await authService.logout(refreshToken);
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            await AsyncStorage.removeItem('access_token');
            await AsyncStorage.removeItem('refresh_token');
            set({ user: null, isAuthenticated: false, requiresTwoFactor: false });
        }
    },

    markOnboardingComplete: async () => {
        // Update store locally - backend already sets onboardingComplete when skin profile is saved
        set((state) => ({
            user: state.user ? { ...state.user, onboardingComplete: true } : null,
        }));
    },

    markGuidedTourComplete: async () => {
        // Store locally - guided tour is a local UI preference
        await AsyncStorage.setItem('guidedTourCompleted', 'true');
        set((state) => ({
            user: state.user ? { ...state.user, guidedTourCompleted: true } : null,
        }));
    },
}));
