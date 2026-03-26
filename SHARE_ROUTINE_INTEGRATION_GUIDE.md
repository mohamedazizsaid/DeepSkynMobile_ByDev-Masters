/*
  GUIDE D'INTÉGRATION: ShareRoutine
  
  Ce guide montre comment intégrer la fonctionnalité de partage de routine dans votre écran.
  
  Exemple d'utilisation dans un RoutineDetailScreen:
*/

import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useShareRoutine } from '../lib/hooks/useShareRoutine';
import { ShareRoutineModal } from './ui/ShareRoutineModal';
import { ShareButton } from './ui/ShareButton';
import { Routine } from '../lib/types';

// Exemple de composant écran
export function RoutineDetailScreenExample({ routine }: { routine: Routine }) {
  const { isModalVisible, selectedRoutine, shareRoutine, openShareModal, closeShareModal } =
    useShareRoutine();

  return (
    <>
      {/* Votre contenu de routine ici */}
      <View>
        {/* Bouton de partage standard */}
        <ShareButton
          onPress={() => openShareModal(routine)}
          variant="filled"
          size="md"
        />

        {/* OU Bouton de partage outline */}
        <ShareButton
          onPress={() => openShareModal(routine)}
          variant="outline"
          size="md"
        />

        {/* OU Bouton d'icon seulement */}
        <ShareButton
          onPress={() => openShareModal(routine)}
          variant="icon"
        />
      </View>

      {/* Modal de partage */}
      <ShareRoutineModal
        visible={isModalVisible}
        routine={selectedRoutine}
        onClose={closeShareModal}
        onShare={shareRoutine}
      />
    </>
  );
}

/*
  ÉTAPES D'INTÉGRATION:
  
  1. Importez le hook et les composants:
     import { useShareRoutine } from '../lib/hooks/useShareRoutine';
     import { ShareRoutineModal, ShareButton } from './ui';
  
  2. Utilisez le hook dans votre composant:
     const { 
       isModalVisible, 
       selectedRoutine, 
       shareRoutine, 
       openShareModal, 
       closeShareModal 
     } = useShareRoutine();
  
  3. Ajoutez un bouton ShareButton qui appelle openShareModal:
     <ShareButton onPress={() => openShareModal(routine)} />
  
  4. Ajoutez le modal ShareRoutineModal à votre écran:
     <ShareRoutineModal
       visible={isModalVisible}
       routine={selectedRoutine}
       onClose={closeShareModal}
       onShare={shareRoutine}
     />
  
  5. C'est tout! Le système gère le reste automatiquement.
  
  OPTIONS DE SHAREBUTTON:
  - variant: 'filled' (défaut) | 'outline' | 'icon'
  - size: 'sm' | 'md' (défaut) | 'lg'
  - disabled: boolean
  - loading: boolean
  - style: ViewStyle (styles personnalisés)
  
  VARIABLES DE SHARERIDUTINEMODAL:
  - visible: boolean (contrôle la visibilité)
  - routine: Routine | null (la routine à partager)
  - onClose: () => void (callback de fermeture)
  - onShare: (message?: string, image?: string) => Promise<void> (callback de partage)
*/
