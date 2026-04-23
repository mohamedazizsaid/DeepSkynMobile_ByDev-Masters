import apiClient from './api-client';
import type { Post, CreatePostDto, Comment, CreateCommentDto, PaginatedResponse } from '../lib/types';

export interface StoryDto {
  id: string;
  userId: string;
  name?: string;
  avatar?: string | null;
  mediaUrl: string;
  musicUrl?: string | null;
  musicTitle?: string | null;
  createdAt?: string;
  likesCount?: number;
  commentsCount?: number;
  isLiked?: boolean;
}

export interface FreeMusicDto {
  id: string;
  title: string;
  artist?: string;
  url: string;
  source?: string;
}

interface ITunesTrack {
  trackId: number;
  trackName: string;
  artistName: string;
  previewUrl?: string;
}

interface DeezerTrack {
  id: number;
  title: string;
  preview?: string;
  artist?: {
    name?: string;
  };
}

export const postsService = {
  async searchDeezerMusicCatalog(query?: string): Promise<FreeMusicDto[]> {
    try {
      const term = encodeURIComponent((query || 'popular').trim());
      const endpoint = `https://api.deezer.com/search?q=${term}&limit=30`;
      const res = await fetch(endpoint);
      if (!res.ok) return [];

      const payload = await res.json();
      const tracks: DeezerTrack[] = Array.isArray(payload?.data) ? payload.data : [];

      return tracks
        .filter((t) => !!t.preview)
        .map((t) => ({
          id: `deezer-${t.id}`,
          title: t.title,
          artist: t.artist?.name,
          url: t.preview as string,
          source: 'deezer-preview',
        }));
    } catch {
      return [];
    }
  },

  async searchPublicMusicCatalog(query?: string): Promise<FreeMusicDto[]> {
    try {
      const deezerTracks = await this.searchDeezerMusicCatalog(query);
      if (deezerTracks.length > 0) {
        return deezerTracks;
      }

      const term = encodeURIComponent((query || 'popular hits').trim());
      const endpoint = `https://itunes.apple.com/search?term=${term}&entity=song&limit=25`;
      const res = await fetch(endpoint);
      if (!res.ok) return [];

      const payload = await res.json();
      const tracks: ITunesTrack[] = Array.isArray(payload?.results) ? payload.results : [];

      return tracks
        .filter((t) => !!t.previewUrl)
        .map((t) => ({
          id: `itunes-${t.trackId}`,
          title: t.trackName,
          artist: t.artistName,
          url: t.previewUrl as string,
          source: 'itunes-preview',
        }));
    } catch {
      return [];
    }
  },

  async create(data: CreatePostDto): Promise<Post> {
    const res = await apiClient.post<Post>('/posts', data);
    return res.data;
  },

  async getFeed(page = 1, limit = 20): Promise<PaginatedResponse<Post>> {
    const res = await apiClient.get<PaginatedResponse<Post>>('/posts', {
      params: { page, limit },
    });
    return res.data;
  },

  async getMyPosts(page = 1, limit = 20): Promise<PaginatedResponse<Post>> {
    const res = await apiClient.get<PaginatedResponse<Post>>('/posts/me', {
      params: { page, limit },
    });
    return res.data;
  },

  async getArchivedPosts(page = 1, limit = 20): Promise<PaginatedResponse<Post>> {
    const res = await apiClient.get<PaginatedResponse<Post>>('/posts/archives', {
      params: { page, limit },
    });
    return res.data;
  },

  async getById(id: string): Promise<Post> {
    const res = await apiClient.get<Post>(`/posts/${id}`);
    return res.data;
  },

  async update(id: string, data: Partial<CreatePostDto>): Promise<Post> {
    const res = await apiClient.patch<Post>(`/posts/${id}`, data);
    return res.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/posts/${id}`);
  },

  async toggleArchive(id: string): Promise<Post> {
    const res = await apiClient.patch<Post>(`/posts/${id}/archive`);
    return res.data;
  },

  async toggleLike(postId: string, type: string = 'like'): Promise<any> {
    const res = await apiClient.post(`/likes/${postId}/toggle`, { type });
    return res.data;
  },

  async checkLike(postId: string): Promise<boolean> {
    const res = await apiClient.get<{ liked: boolean }>(`/likes/check/${postId}`);
    return res.data.liked;
  },

  async addComment(data: CreateCommentDto): Promise<Comment> {
    const res = await apiClient.post<Comment>('/comments', data);
    return res.data;
  },

  async getComments(postId: string, page = 1, limit = 20): Promise<PaginatedResponse<Comment>> {
    const res = await apiClient.get<PaginatedResponse<Comment>>(`/comments/post/${postId}`, {
      params: { page, limit },
    });
    return res.data;
  },

  async updateComment(id: string, comment: string): Promise<Comment> {
    const res = await apiClient.patch<Comment>(`/comments/${id}`, { comment });
    return res.data;
  },

  async deleteComment(id: string): Promise<void> {
    await apiClient.delete(`/comments/${id}`);
  },

  async toggleCommentLike(commentId: string): Promise<{ liked: boolean }> {
    const res = await apiClient.post<{ liked: boolean }>(`/comments/${commentId}/like`);
    return res.data;
  },

  async createStory(mediaUrl: string, userId: string, musicUrl?: string, musicTitle?: string): Promise<any> {
    const res = await apiClient.post('/stories', {
      mediaUrl,
      userId,
      musicUrl,
      musicTitle,
    });
    return res.data;
  },

  async getActiveStories(): Promise<StoryDto[]> {
    const res = await apiClient.get<StoryDto[]>('/stories');
    return res.data;
  },

  async getFreeMusicForStories(query?: string): Promise<FreeMusicDto[]> {
    try {
      const publicCatalog = await this.searchPublicMusicCatalog(query || 'trending songs');
      if (publicCatalog.length > 0) {
        return publicCatalog;
      }

      if (!query) {
        const res = await apiClient.get<FreeMusicDto[]>('/stories/music/free');
        const backend = Array.isArray(res.data) ? res.data : [];
        if (backend.length > 0) return backend;
        return this.searchPublicMusicCatalog('trending');
      }

      const res = await apiClient.get<FreeMusicDto[]>('/stories/music/search', {
        params: { query },
      });
      const backend = Array.isArray(res.data) ? res.data : [];
      if (backend.length > 0) return backend;
      return this.searchPublicMusicCatalog(query);
    } catch {
      return this.searchPublicMusicCatalog(query);
    }
  },

  async toggleStoryLike(storyId: string): Promise<{ liked: boolean; likesCount: number }> {
    const res = await apiClient.post<{ liked: boolean; likesCount: number }>(`/stories/${storyId}/like`);
    return res.data;
  },

  async getStoryComments(storyId: string): Promise<Comment[]> {
    const res = await apiClient.get<Comment[]>(`/stories/${storyId}/comments`);
    return res.data;
  },

  async addStoryComment(storyId: string, comment: string): Promise<Comment> {
    const res = await apiClient.post<Comment>(`/stories/${storyId}/comments`, { comment });
    return res.data;
  },

  async deleteStoryComment(commentId: string): Promise<void> {
    await apiClient.delete(`/stories/comments/${commentId}`);
  },
};
