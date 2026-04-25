import apiClient from './api-client';

export interface FaceReferenceStatus {
  hasFaceReference: boolean;
  hasProfilePhoto: boolean;
  profilePhotoUrl: string | null;
  faceReference: {
    id: string;
    imageUrl: string;
    createdAt: string;
    updatedAt: string;
  } | null;
}

export const faceVerificationService = {
  async getStatus(): Promise<FaceReferenceStatus> {
    const response = await apiClient.get<FaceReferenceStatus>('/face-verification/status');
    return response.data;
  },
  async verifyFace(imageBase64: string): Promise<{ verified: boolean; message: string; needsProfilePhoto?: boolean }> {
    const response = await apiClient.post('/face-verification/verify', { imageBase64 });
    return response.data;
  },
};