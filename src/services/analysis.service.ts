import apiClient from './api-client';
import type {
  Analysis,
  AnalysisStats,
  AnalysisComparison,
  AnalysisListResponse,
  GeminiAnalysisResult,
  RealTimeScanDto,
} from '../lib/types';

export const analysisService = {
  /** Upload images and create a new AI skin analysis */
  async uploadAndAnalyze(
    formData: FormData,
    questionnaire?: Record<string, unknown>,
  ): Promise<Analysis> {
    if (questionnaire) {
      formData.append('questionnaire', JSON.stringify(questionnaire));
    }
    const res = await apiClient.post<Analysis>('/analyses/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 300_000,
    });
    return res.data;
  },

  /** Create analysis from existing image URLs */
  async createFromUrls(imageUrls: string[]): Promise<Analysis> {
    const res = await apiClient.post<Analysis>('/analyses', { images: imageUrls });
    return res.data;
  },

  /** Process a real-time face scan (base64 image → Gemini) */
  async scan(dto: RealTimeScanDto): Promise<GeminiAnalysisResult> {
    const res = await apiClient.post<GeminiAnalysisResult>('/analyses/scan', dto, {
      timeout: 300_000,
    });
    return res.data;
  },

  /** Get paginated list of user's analyses */
  async getAll(page = 1, limit = 10): Promise<AnalysisListResponse> {
    const res = await apiClient.get<AnalysisListResponse>('/analyses', {
      params: { page, limit },
    });
    return res.data;
  },

  /** Get a single analysis by ID */
  async getById(id: string): Promise<Analysis> {
    const res = await apiClient.get<Analysis>(`/analyses/${id}`);
    return res.data;
  },

  /** Get the most recent completed analysis */
  async getLatest(): Promise<Analysis> {
    const res = await apiClient.get<Analysis>('/analyses/latest');
    return res.data;
  },

  /** Get user's analysis statistics */
  async getStats(): Promise<AnalysisStats> {
    const res = await apiClient.get<AnalysisStats>('/analyses/stats');
    return res.data;
  },

  /** Get AI-generated personalized skincare advice */
  async getAdvice(): Promise<string> {
    const res = await apiClient.get<string>('/analyses/advice');
    return res.data;
  },

  /** Compare two analyses */
  async compare(id1: string, id2: string): Promise<AnalysisComparison> {
    const res = await apiClient.get<AnalysisComparison>('/analyses/compare', {
      params: { id1, id2 },
    });
    return res.data;
  },

  /** Delete an analysis */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/analyses/${id}`);
  },
};
