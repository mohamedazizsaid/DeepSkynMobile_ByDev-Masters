import apiClient from './api-client';
import type {
  PredictiveRoutine,
  GeneratePredictiveRoutineDto,
  UpdatePredictiveRoutineStatusDto,
  GetUserRoutinesQuery,
  ValidateRoutineResponse,
  PredictiveRoutineStatus,
} from '../lib/types';

export const predictiveRoutineService = {
  /**
   * Generate a predictive routine based on analysis results and location
   * This creates a 7-day personalized routine using AI + weather data
   */
  async generate(dto: GeneratePredictiveRoutineDto): Promise<PredictiveRoutine> {
    try {
      const res = await apiClient.post<PredictiveRoutine>('/predictive-routine/generate', dto, {
        timeout: 300_000, // AI generation can take longer on mobile networks
      });
      return res.data;
    } catch (error: any) {
      const isTimeout =
        error?.code === 'ECONNABORTED' ||
        String(error?.message || '').toLowerCase().includes('timeout');

      if (isTimeout) {
        // Fallback: the backend may have finished generation after client timeout.
        const pending = await this.getPending().catch(() => []);
        const matched = pending.find((routine) => routine.analysisId === dto.analysisId);
        if (matched) {
          return matched;
        }
      }

      throw error;
    }
  },

  /**
   * Get all pending predictive routines (main dashboard view)
   */
  async getPending(): Promise<PredictiveRoutine[]> {
    const res = await apiClient.get<PredictiveRoutine[]>('/predictive-routine/pending');
    return res.data;
  },

  /**
   * Get user's predictive routine history with optional filters
   */
  async getAll(query?: GetUserRoutinesQuery): Promise<PredictiveRoutine[]> {
    const res = await apiClient.get<PredictiveRoutine[]>('/predictive-routine', {
      params: query,
    });
    return res.data;
  },

  /**
   * Get a single predictive routine by ID
   */
  async getById(id: string): Promise<PredictiveRoutine> {
    const res = await apiClient.get<PredictiveRoutine>(`/predictive-routine/${id}`);
    return res.data;
  },

  /**
   * Update routine status (core UX interaction)
   */
  async updateStatus(
    id: string,
    dto: UpdatePredictiveRoutineStatusDto
  ): Promise<PredictiveRoutine> {
    const res = await apiClient.patch<PredictiveRoutine>(
      `/predictive-routine/${id}/status`,
      dto
    );
    return res.data;
  },

  /**
   * Mark routine as viewed (quick action)
   */
  async markAsViewed(id: string): Promise<PredictiveRoutine> {
    const res = await apiClient.post<PredictiveRoutine>(`/predictive-routine/${id}/view`);
    return res.data;
  },

  /**
   * Accept routine (optionally implement it)
   */
  async accept(id: string, implement: boolean = false): Promise<PredictiveRoutine> {
    const res = await apiClient.post<PredictiveRoutine>(`/predictive-routine/${id}/accept`, {
      implement,
    });
    return res.data;
  },

  /**
   * Dismiss routine
   */
  async dismiss(id: string): Promise<PredictiveRoutine> {
    const res = await apiClient.post<PredictiveRoutine>(`/predictive-routine/${id}/dismiss`);
    return res.data;
  },

  /**
   * Validate and activate routine - converts predictive routine to active AM/PM routines
   * This is the key action that moves from preview to real routine
   */
  async validateAndActivate(id: string): Promise<ValidateRoutineResponse> {
    const res = await apiClient.post<ValidateRoutineResponse>(
      `/predictive-routine/${id}/validate`
    );
    return res.data;
  },
};
