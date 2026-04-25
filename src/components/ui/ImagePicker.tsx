import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ExpoImagePicker from 'expo-image-picker';
import { Colors, Gradients, FontSizes, FontWeights, Spacing, BorderRadius } from '../../theme';

interface ImagePickerProps {
  onImageSelected: (uri: string, base64?: string) => void;
  label?: string;
  showPreview?: boolean;
  maxSize?: number;
  aspectRatio?: [number, number];
}

export function ImagePicker({
  onImageSelected,
  label = 'Prendre ou sélectionner une photo',
  showPreview = true,
  maxSize = 1024,
  aspectRatio = [1, 1],
}: ImagePickerProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status: cameraStatus } = await ExpoImagePicker.requestCameraPermissionsAsync();
      const { status: libraryStatus } = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
        Alert.alert(
          'Permissions requises',
          'Veuillez autoriser l\'accès à la caméra et à la galerie pour continuer.',
          [{ text: 'OK' }]
        );
        return false;
      }
    }
    return true;
  };

  const pickImage = async (fromCamera: boolean) => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setIsLoading(true);
    try {
      const options: ExpoImagePicker.ImagePickerOptions = {
        mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: aspectRatio,
        quality: 0.8,
        base64: true,
        exif: false,
      };

      const result = fromCamera
        ? await ExpoImagePicker.launchCameraAsync(options)
        : await ExpoImagePicker.launchImageLibraryAsync(options);

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedImage(asset.uri);
        onImageSelected(asset.uri, asset.base64 || undefined);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const showOptions = () => {
    Alert.alert(
      'Sélectionner une photo',
      'Choisissez une option',
      [
        { text: 'Appareil photo', onPress: () => pickImage(true) },
        { text: 'Galerie', onPress: () => pickImage(false) },
        { text: 'Annuler', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const clearImage = () => {
    setSelectedImage(null);
  };

  if (selectedImage && showPreview) {
    return (
      <View style={styles.container}>
        <View style={styles.previewContainer}>
          <Image source={{ uri: selectedImage }} style={styles.preview} />
          <TouchableOpacity style={styles.removeButton} onPress={clearImage}>
            <Ionicons name="close-circle" size={28} color={Colors.error} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.changeButton} onPress={showOptions}>
          <Ionicons name="camera-outline" size={18} color={Colors.primary} />
          <Text style={styles.changeText}>Changer la photo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.pickerContainer}
        onPress={showOptions}
        disabled={isLoading}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={[Colors.primaryAlpha10, Colors.primaryAlpha5]}
          style={styles.pickerGradient}
        >
          <View style={styles.iconContainer}>
            <LinearGradient colors={Gradients.primary} style={styles.iconBg}>
              <Ionicons name="camera" size={32} color={Colors.white} />
            </LinearGradient>
          </View>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.hint}>Appuyez pour ouvrir la caméra ou la galerie</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

interface MultiImagePickerProps {
  onImagesSelected: (images: Array<{ uri: string; base64?: string }>) => void;
  maxImages?: number;
  label?: string;
}

export function MultiImagePicker({
  onImagesSelected,
  maxImages = 3,
  label = 'Ajouter des photos',
}: MultiImagePickerProps) {
  const [images, setImages] = useState<Array<{ uri: string; base64?: string }>>([]);

  const requestMultiPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status: cameraStatus } = await ExpoImagePicker.requestCameraPermissionsAsync();
      const { status: libraryStatus } = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();

      if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
        Alert.alert(
          'Permissions requises',
          'Veuillez autoriser l\'accès à la caméra et à la galerie pour continuer.',
          [{ text: 'OK' }]
        );
        return false;
      }
    }
    return true;
  };

  const addImage = async (fromCamera: boolean) => {
    if (images.length >= maxImages) {
      Alert.alert('Maximum atteint', `Vous pouvez ajouter jusqu'à ${maxImages} photos.`);
      return;
    }

    const hasPermission = await requestMultiPermissions();
    if (!hasPermission) {
      return;
    }

    const options: ExpoImagePicker.ImagePickerOptions = {
      mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
      exif: false,
    };

    const result = fromCamera
      ? await ExpoImagePicker.launchCameraAsync(options)
      : await ExpoImagePicker.launchImageLibraryAsync(options);

    if (!result.canceled && result.assets[0]) {
      const newImage = { uri: result.assets[0].uri, base64: result.assets[0].base64 || undefined };
      const updatedImages = [...images, newImage];
      setImages(updatedImages);
      onImagesSelected(updatedImages);
    }
  };

  const showAddImageOptions = () => {
    Alert.alert(
      'Ajouter une photo',
      'Choisissez une source',
      [
        { text: 'Appareil photo', onPress: () => addImage(true) },
        { text: 'Galerie', onPress: () => addImage(false) },
        { text: 'Annuler', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
    onImagesSelected(updatedImages);
  };

  return (
    <View style={styles.multiContainer}>
      <Text style={styles.multiLabel}>{label}</Text>
      <View style={styles.imagesRow}>
        {images.map((img, index) => (
          <View key={index} style={styles.multiImageWrapper}>
            <Image source={{ uri: img.uri }} style={styles.multiImage} />
            <TouchableOpacity style={styles.multiRemove} onPress={() => removeImage(index)}>
              <Ionicons name="close-circle" size={22} color={Colors.error} />
            </TouchableOpacity>
          </View>
        ))}
        {images.length < maxImages && (
          <TouchableOpacity style={styles.addButton} onPress={showAddImageOptions}>
            <Ionicons name="add" size={32} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.multiHint}>{images.length}/{maxImages} photos</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.md,
  },
  pickerContainer: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  pickerGradient: {
    padding: Spacing['2xl'],
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: Spacing.lg,
  },
  iconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.gray900,
    marginBottom: Spacing.xs,
  },
  hint: {
    fontSize: FontSizes.sm,
    color: Colors.gray500,
  },
  previewContainer: {
    position: 'relative',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  preview: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: BorderRadius.xl,
  },
  removeButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: 14,
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  changeText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: FontWeights.medium,
  },
  // Multi image styles
  multiContainer: {
    marginVertical: Spacing.md,
  },
  multiLabel: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.medium,
    color: Colors.gray700,
    marginBottom: Spacing.md,
  },
  imagesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  multiImageWrapper: {
    position: 'relative',
  },
  multiImage: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.base,
  },
  multiRemove: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colors.white,
    borderRadius: 11,
  },
  addButton: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.base,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryAlpha5,
  },
  multiHint: {
    fontSize: FontSizes.xs,
    color: Colors.gray400,
    marginTop: Spacing.sm,
  },
});
