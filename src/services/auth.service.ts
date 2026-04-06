import apiClient from './api-client';
import { Platform } from 'react-native';

export const authService = {
    async login(data: any) {
        const res = await apiClient.post('/auth/login', data);
        return res.data;
    },

    async register(data: any) {
        const res = await apiClient.post('/auth/register', data);
        return res.data;
    },

    async logout(refreshToken: string) {
        return apiClient.post('/auth/logout', { refresh_token: refreshToken });
    },

    async getProfile() {
        const res = await apiClient.get('/auth/profile');
        return res.data;
    },

    async getUserAvatar(email: string) {
        const res = await apiClient.get(`/auth/avatar/${email}`);
        return res.data;
    },

    async faceLogin(email: string, imageBase64: string) {
        const res = await apiClient.post('/auth/face-login', { email, imageBase64 });
        return res.data;
    },

    async verify2FA(code: string) {
        const res = await apiClient.post('/auth/2fa/verify', { code });
        return res.data;
    },

    async get2faStatus() {
        const res = await apiClient.get('/auth/2fa/status');
        return res.data;
    },

    async generate2fa() {
        const res = await apiClient.post('/auth/2fa/generate');
        return res.data;
    },

    async enable2fa(code: string) {
        const res = await apiClient.post('/auth/2fa/enable', { code });
        return res.data;
    },

    async disable2fa(code: string) {
        const res = await apiClient.post('/auth/2fa/disable', { code });
        return res.data;
    },

    async updateProfile(data: any) {
        const res = await apiClient.patch('/auth/profile', data);
        return res.data;
    },

    async updateAvatar(avatarBase64: string) {
        const res = await apiClient.patch('/auth/profile/avatar', { avatarUrl: avatarBase64 });
        return res.data;
    },

    async updateCoverPhoto(coverBase64: string) {
        const res = await apiClient.patch('/auth/profile/cover', { coverPhotoUrl: coverBase64 });
        return res.data;
    },

    async getMySkinProfile() {
        const res = await apiClient.get('/skin-profiles/me');
        return res.data;
    },

    async googleTokenAuth(idToken: string): Promise<any> {
        const res = await apiClient.post('/auth/google/token', { idToken });
        return res.data;
    },

    getGoogleAuthUrl(): string {
        // In mobile, we might use AuthSession or similar
        return 'http://192.168.1.45:3000/auth/google';
    },

    getFacebookAuthUrl(): string {
        return 'http://192.168.1.45:3000/auth/facebook';
    }
};
