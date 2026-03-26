import apiClient from './api-client';
import type {
  Routine,
  CreateRoutineDto,
  GenerateRoutineDto,
  AdviseRoutineDto,
  AIAdviceResponse,
  RecommendProductDto,
  ProductRecommendation,
  ShareRoutineDto,
} from '../lib/types';

export const routineService = {
  async create(data: CreateRoutineDto): Promise<Routine> {
    const res = await apiClient.post<Routine>('/routines', data);
    return res.data;
  },

  async generateAI(data?: GenerateRoutineDto): Promise<Routine> {
    const res = await apiClient.post<Routine>('/routines/generate', data || { type: 'AM' });
    return res.data;
  },

  async getAll(params?: { type?: string; isActive?: boolean; isAIGenerated?: boolean }): Promise<Routine[]> {
    const res = await apiClient.get<Routine[]>('/routines', { params });
    return res.data;
  },

  async getById(id: string): Promise<Routine> {
    const res = await apiClient.get<Routine>(`/routines/${id}`);
    return res.data;
  },

  async getActive(type: string): Promise<Routine[]> {
    const res = await apiClient.get<Routine[]>(`/routines/active/${type}`);
    return res.data;
  },

  async update(id: string, data: Partial<CreateRoutineDto>): Promise<Routine> {
    const res = await apiClient.patch<Routine>(`/routines/${id}`, data);
    return res.data;
  },

  async toggleActive(id: string): Promise<Routine> {
    const res = await apiClient.patch<Routine>(`/routines/${id}/toggle`);
    return res.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/routines/${id}`);
  },

  async adviseOnChange(routineId: string, data: AdviseRoutineDto): Promise<AIAdviceResponse> {
    const res = await apiClient.post<AIAdviceResponse>(`/routines/${routineId}/advise`, data);
    return res.data;
  },

  async recommendProduct(data: RecommendProductDto): Promise<ProductRecommendation> {
    const res = await apiClient.post<ProductRecommendation>('/routines/recommend-product', data);
    return res.data;
  },

  async shareRoutine(routineId: string, data: Partial<ShareRoutineDto>): Promise<any> {
    const res = await apiClient.post<any>(`/routines/${routineId}/share`, data);
    return res.data;
  },
};
