// Environment-based API configuration for React Native/Expo
// For Expo, use .env file or Constants.expoConfig.extra
let API_BASE_URL = 'http://192.168.1.26:3000';
let API_TIMEOUT = 30000;

try {
  const Constants = require('expo-constants').default;
  if (Constants?.expoConfig?.extra?.apiUrl) {
    API_BASE_URL = Constants.expoConfig.extra.apiUrl;
  }
} catch (e) {
  // expo-constants might not be available, use default
}

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  TIMEOUT: API_TIMEOUT,
  RETRY_ATTEMPTS: 1,
  RETRY_DELAY: 1000,
};

export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile',
    PROFILE_COVER: '/auth/profile/cover',
    PROFILE_AVATAR: '/auth/profile/avatar',
    TWO_FACTOR_GENERATE: '/auth/2fa/generate',
    TWO_FACTOR_VERIFY: '/auth/2fa/verify',
    GOOGLE_LOGIN: '/auth/google',
    FACEBOOK_LOGIN: '/auth/facebook',
  },
  USERS: {
    GET_ALL: '/users',
    GET_ONE: (id: string) => `/users/${id}`,
    UPDATE: (id: string) => `/users/${id}`,
  },
  POSTS: {
    GET_FEED: '/posts/feed',
    CREATE: '/posts',
    GET_ONE: (id: string) => `/posts/${id}`,
    DELETE: (id: string) => `/posts/${id}`,
    LIKE: (id: string) => `/posts/${id}/like`,
    COMMENT: (id: string) => `/posts/${id}/comments`,
  },
  ANALYSIS: {
    GET_ALL: '/analyses',
    CREATE: '/analyses',
    GET_ONE: (id: string) => `/analyses/${id}`,
    STATS: '/analyses/stats',
    COMPARE: '/analyses/compare',
  },
  ROUTINES: {
    GET_ALL: '/routines',
    CREATE: '/routines',
    UPDATE: (id: string) => `/routines/${id}`,
    DELETE: (id: string) => `/routines/${id}`,
  },
  SUBSCRIPTIONS: {
    GET_CURRENT: '/subscriptions/current',
    GET_PLANS: '/subscriptions/plans',
  },
};
