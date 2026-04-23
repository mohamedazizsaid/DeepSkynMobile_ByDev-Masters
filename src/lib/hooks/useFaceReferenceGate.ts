import { useCallback, useEffect, useState } from 'react';
import { useNotification } from './useLocalStorage';
import { faceVerificationService, type FaceReferenceStatus } from '../../services/face-verification.service';

type RedirectHandler = () => void;

export function useFaceReferenceGate() {
  const notification = useNotification();
  const [faceReferenceStatus, setFaceReferenceStatus] = useState<FaceReferenceStatus | null>(null);
  const [loadingFaceReferenceStatus, setLoadingFaceReferenceStatus] = useState(true);

  const refreshFaceReferenceStatus = useCallback(async () => {
    setLoadingFaceReferenceStatus(true);
    try {
      const status = await faceVerificationService.getStatus();
      setFaceReferenceStatus(status);
      return status;
    } catch (error) {
      console.error('Error loading face reference status:', error);
      setFaceReferenceStatus(null);
      return null;
    } finally {
      setLoadingFaceReferenceStatus(false);
    }
  }, []);

  useEffect(() => {
    void refreshFaceReferenceStatus();
  }, [refreshFaceReferenceStatus]);

  const ensureFaceReference = useCallback(
    async (redirectToSettings?: RedirectHandler) => {
      const status = faceReferenceStatus ?? (await refreshFaceReferenceStatus());

      if (!status?.hasFaceReference) {
        notification.error(
          'Activez votre référence faciale dans Paramètres > Informations personnelles avant de lancer une analyse.'
        );
        redirectToSettings?.();
        return false;
      }

      return true;
    },
    [faceReferenceStatus, notification, refreshFaceReferenceStatus]
  );

  return {
    faceReferenceStatus,
    loadingFaceReferenceStatus,
    refreshFaceReferenceStatus,
    ensureFaceReference,
  };
}