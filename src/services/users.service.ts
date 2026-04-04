import apiClient from './api-client';

export interface UpdateUserDto {
  avatar?: string;
  dateOfBirth?: string;
  gender?: string;
  preferredLanguage?: string;
  settings?: any;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  avatar3D?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  preferredLanguage?: string;
  settings?: any;
  onboardingComplete: boolean;
}

export interface CommunityStats {
  posts: number;
  followers: number;
  following: number;
  totalLikes: number;
  totalComments: number;
  weeklyActivity: number[];
  storyViews: number;
  impressions: number;
  shares: number;
  recentFollowersAvatars: string[];
  followersDetail: User[];
}

export const usersService = {
  async getMe(): Promise<User> {
    const res = await apiClient.get<User>('/users/me');
    return res.data;
  },

  async updateMe(data: UpdateUserDto): Promise<User> {
    const res = await apiClient.patch<User>('/users/me', data);
    return res.data;
  },

  async uploadAvatar3D(formData: FormData): Promise<User> {
    const res = await apiClient.post<User>('/users/avatar3d', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async getSuggestions(): Promise<User[]> {
    const res = await apiClient.get<User[]>('/users/suggestions');
    return res.data;
  },

  async toggleFollow(userId: string): Promise<{ followed: boolean }> {
    const res = await apiClient.post<{ followed: boolean }>(`/users/follow/${userId}`);
    return res.data;
  },

  async getUserStats(userId: string): Promise<CommunityStats> {
    const res = await apiClient.get<CommunityStats>(`/users/${userId}/stats`);
    return res.data;
  },
};
