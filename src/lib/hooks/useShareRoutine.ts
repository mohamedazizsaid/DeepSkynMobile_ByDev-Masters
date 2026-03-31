import { useState } from 'react';
import { Routine, ShareRoutineDto } from '../../lib/types';
import { routineService } from '../../services/routine.service';

export function useShareRoutine() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const openShareModal = (routine: Routine) => {
    setSelectedRoutine(routine);
    setIsModalVisible(true);
  };

  const closeShareModal = () => {
    setIsModalVisible(false);
    setSelectedRoutine(null);
  };

  const shareRoutine = async (customMessage?: string, coverImage?: string) => {
    if (!selectedRoutine) {
      throw new Error('No routine selected');
    }

    setIsLoading(true);
    try {
      const response = await routineService.shareRoutine(selectedRoutine.id, {
        customMessage,
        coverImage,
      });
      return response;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isModalVisible,
    selectedRoutine,
    isLoading,
    openShareModal,
    closeShareModal,
    shareRoutine,
  };
}
