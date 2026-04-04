import React, { useEffect, useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Button } from '../../../components';
import { postsService } from '../../../services/posts.service';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights } from '../../../theme';

interface CommunityStoryUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (media: string, musicUrl?: string, musicTitle?: string) => Promise<void> | void;
  t: any;
}

export function CommunityStoryUploadModal({ isOpen, onClose, onUpload, t }: CommunityStoryUploadModalProps) {
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [selectedMediaBase64, setSelectedMediaBase64] = useState<string | null>(null);
  const [selectedMusic, setSelectedMusic] = useState<{ url: string; title: string; source?: 'catalog' | 'local' } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [musicOptions, setMusicOptions] = useState<Array<{ id: string; title: string; url: string }>>([]);

  useEffect(() => {
    if (!isOpen) return;
    postsService
      .getFreeMusicForStories()
      .then((items) => {
        setMusicOptions((items || []).slice(0, 5).map((m) => ({ id: m.id, title: m.title, url: m.url })));
      })
      .catch(() => setMusicOptions([]));
  }, [isOpen]);

  const handlePickStoryMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t.common.error || 'Erreur', t.community.mediaPermission || 'Permission media refusée');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.8,
      base64: true,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      const base64Media = asset.base64
        ? `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`
        : asset.uri;
      setSelectedMedia(asset.uri);
      setSelectedMediaBase64(base64Media);
    }
  };

  const handlePickLocalMusic = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        multiple: false,
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      const base64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: 'base64' as any,
      });
      const mime = asset.mimeType || 'audio/mpeg';

      setSelectedMusic({
        url: `data:${mime};base64,${base64}`,
        title: asset.name || (t.community.addMusic || 'Audio local'),
        source: 'local',
      });
    } catch {
      Alert.alert(t.common.error || 'Erreur', t.community.uploadError || 'Impossible de charger la musique');
    }
  };

  const handleUpload = async () => {
    if (!selectedMediaBase64) return;
    setUploading(true);
    try {
      await onUpload(selectedMediaBase64, selectedMusic?.url, selectedMusic?.title);
      setSelectedMedia(null);
      setSelectedMediaBase64(null);
      setSelectedMusic(null);
      onClose();
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal visible={isOpen} animationType="fade" transparent>
      <SafeAreaView style={s.storyUploadContainer}>
        <TouchableOpacity style={s.storyUploadClose} onPress={onClose}>
          <Ionicons name="close" size={28} color={Colors.white} />
        </TouchableOpacity>

        <ScrollView
          style={s.storyUploadContent}
          contentContainerStyle={s.storyUploadContentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={s.storyUploadTitle}>{t.community.shareStory || 'Partager une story'}</Text>

          <TouchableOpacity style={s.uploadMediaBtn} onPress={handlePickStoryMedia}>
            <Ionicons name="image" size={32} color={Colors.primary} />
            <Text style={s.uploadMediaText}>{t.community.selectPhoto || 'Sélectionner une photo/vidéo'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.uploadMusicBtn} onPress={handlePickLocalMusic}>
            <Ionicons name="musical-note" size={32} color={Colors.primary} />
            <Text style={s.uploadMediaText}>{t.community.addMusic || 'Ajouter de la musique'} (local)</Text>
          </TouchableOpacity>

          {musicOptions.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
              {musicOptions.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => setSelectedMusic({ url: m.url, title: m.title, source: 'catalog' })}
                  style={[
                    s.musicChip,
                    selectedMusic?.url === m.url && { backgroundColor: Colors.primary },
                  ]}
                >
                  <Text
                    style={[
                      s.musicChipText,
                      selectedMusic?.url === m.url && { color: Colors.white },
                    ]}
                  >
                    {m.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {selectedMedia && (
            <View style={s.storyPreviewContainer}>
              <Image source={{ uri: selectedMedia }} style={s.storyPreview} />
              {selectedMusic && (
                <View style={s.musicTag}>
                  <Ionicons name="musical-note" size={12} color={Colors.white} />
                  <Text style={s.musicTagText}>{selectedMusic.title || t.community.musicAdded || 'Musique ajoutee'}</Text>
                </View>
              )}
            </View>
          )}

          <Button onPress={handleUpload} disabled={!selectedMediaBase64 || uploading} style={{ marginTop: Spacing.lg }}>
            {uploading ? t.common.uploading || 'Upload...' : t.community.publications || 'Publier'}
          </Button>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  storyUploadContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  storyUploadClose: { position: 'absolute', top: Spacing.xl, right: Spacing.lg, zIndex: 10 },
  storyUploadContent: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, width: '88%', maxHeight: '86%' },
  storyUploadContentContainer: { padding: Spacing.xl, paddingBottom: Spacing.xl + Spacing.md },
  storyUploadTitle: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.gray900, marginBottom: Spacing.lg, textAlign: 'center' },
  uploadMediaBtn: { borderWidth: 2, borderColor: Colors.primary, borderStyle: 'dashed', borderRadius: BorderRadius.lg, paddingVertical: Spacing.xl, alignItems: 'center', marginBottom: Spacing.md },
  uploadMusicBtn: { borderWidth: 2, borderColor: Colors.primary, borderStyle: 'dashed', borderRadius: BorderRadius.lg, paddingVertical: Spacing.xl, alignItems: 'center', marginBottom: Spacing.lg },
  uploadMediaText: { fontSize: FontSizes.sm, color: Colors.primary, marginTop: Spacing.md, fontWeight: FontWeights.semibold },
  storyPreviewContainer: { position: 'relative', width: '100%', height: 200, borderRadius: BorderRadius.lg, overflow: 'hidden', marginBottom: Spacing.lg },
  storyPreview: { width: '100%', height: '100%' },
  musicTag: { position: 'absolute', bottom: Spacing.md, left: Spacing.md, backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.lg },
  musicTagText: { fontSize: 10, color: Colors.white, fontWeight: FontWeights.semibold },
  musicChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.gray100,
    marginRight: Spacing.xs,
  },
  musicChipText: { color: Colors.gray700, fontSize: 11, fontWeight: '700' as any },
});
