import apiClient from './api-client';
import type { Notification, PaginatedResponse } from '../lib/types';

export const notificationService = {
  async getAll(page = 1, limit = 20, unreadOnly = false): Promise<PaginatedResponse<Notification>> {
    const res = await apiClient.get<PaginatedResponse<Notification>>('/notifications', {
      params: { page, limit, unreadOnly },
    });
    return res.data;
  },

  async getUnreadCount(): Promise<number> {
    const res = await apiClient.get<{ count: number }>('/notifications/unread-count');
    return res.data.count;
  },

  async markAsRead(id: string): Promise<Notification> {
    const res = await apiClient.patch<Notification>(`/notifications/${id}/read`);
    return res.data;
  },

  async markAllAsRead(): Promise<{ count: number }> {
    const res = await apiClient.patch<{ count: number }>('/notifications/read-all');
    return res.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/notifications/${id}`);
  },

  async deleteAll(): Promise<{ count: number }> {
    const res = await apiClient.delete<{ count: number }>('/notifications');
    return res.data;
  },
};
