import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Button, Card } from '../../components';
import { Colors, Gradients, Spacing, BorderRadius, FontSizes, FontWeights } from '../../theme';
import { useAccessibilityStyles } from '../../stores/useAccessibilityStyles';

interface PhotoUploadStepProps {
  onNext: (data: any) => void;
  onBack: () => void;
}

export function PhotoUploadStep({ onNext, onBack }: PhotoUploadStepProps) {
  const { colors, fontSizes } = useAccessibilityStyles();
  const [photo, setPhoto] = useState<string | null>(null);

  const dynamicStyles = useMemo(() => ({
    title: {
      fontSize: fontSizes['2xl'],
      color: colors.text,
    },
    subtitle: {
      fontSize: fontSizes.base,
      color: colors.textSecondary,
    },
    uploadTitle: {
      fontSize: fontSizes.lg,
      color: colors.text,
    },
    uploadSubtitle: {
      fontSize: fontSizes.sm,
      color: colors.textSecondary,
    },
    changeText: {
      fontSize: fontSizes.sm,
      color: colors.textSecondary,
    },
    actionButtonText: {
      fontSize: fontSizes.sm,
      color: colors.primary,
    },
  }), [colors, fontSizes]);

  const handlePickPhoto = async () => {
    const permResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.base64) {
        const mimeType = asset.mimeType || 'image/jpeg';
        setPhoto(`data:${mimeType};base64,${asset.base64}`);
      } else if (asset.uri) {
        setPhoto(asset.uri);
      }
    }
  };

  const handleTakePhoto = async () => {
    const permResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your camera.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.base64) {
        const mimeType = asset.mimeType || 'image/jpeg';
        setPhoto(`data:${mimeType};base64,${asset.base64}`);
      } else if (asset.uri) {
        setPhoto(asset.uri);
      }
    }
  };

  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        <LinearGradient colors={Gradients.secondary} style={styles.iconBox}>
          <Ionicons name="camera" size={32} color={Colors.white} />
        </LinearGradient>

        <Text style={[styles.title, dynamicStyles.title]}>Add Your Profile Photo</Text>
        <Text style={[styles.subtitle, dynamicStyles.subtitle]}>
          Upload a photo so others can recognize you. You can always change it later.
        </Text>

        {/* Photo Preview / Upload Area */}
        <Card variant="elevated" style={styles.card}>
          {photo ? (
            <View style={styles.photoPreviewContainer}>
              <Image source={{ uri: photo }} style={styles.photoPreview} />
              <TouchableOpacity style={styles.removeButton} onPress={() => setPhoto(null)}>
                <Ionicons name="close" size={18} color={Colors.white} />
              </TouchableOpacity>
              <Text style={[styles.changeText, dynamicStyles.changeText]}>Tap below to change</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.uploadArea} onPress={handlePickPhoto} activeOpacity={0.7}>
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person-outline" size={48} color={Colors.gray300} />
              </View>
              <Text style={[styles.uploadTitle, dynamicStyles.uploadTitle]}>Tap to choose a photo</Text>
              <Text style={[styles.uploadSubtitle, dynamicStyles.uploadSubtitle]}>JPG or PNG, max 5 MB</Text>
            </TouchableOpacity>
          )}

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionButton} onPress={handlePickPhoto}>
              <Ionicons name="images-outline" size={22} color={Colors.primary} />
              <Text style={[styles.actionButtonText, dynamicStyles.actionButtonText]}>Gallery</Text>
            </TouchableOpacity>
            <View style={styles.actionDivider} />
            <TouchableOpacity style={styles.actionButton} onPress={handleTakePhoto}>
              <Ionicons name="camera-outline" size={22} color={Colors.primary} />
              <Text style={[styles.actionButtonText, dynamicStyles.actionButtonText]}>Camera</Text>
            </TouchableOpacity>
          </View>
        </Card>

        <View style={styles.buttons}>
          <Button variant="outline" onPress={onBack} style={{ flex: 1 }}>Back</Button>
          <Button onPress={() => onNext({ avatar: photo })} style={{ flex: 1 }}>
            {photo ? 'Continue' : 'Skip for now'}
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: Spacing.xl, alignItems: 'center', paddingBottom: Spacing['2xl'] },
  iconBox: {
    width: 64, height: 64, borderRadius: BorderRadius.lg,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl,
  },
  title: { fontSize: FontSizes['2xl'], fontWeight: FontWeights.bold, color: Colors.gray900, textAlign: 'center', marginBottom: Spacing.md },
  subtitle: { fontSize: FontSizes.base, color: Colors.gray500, textAlign: 'center', marginBottom: Spacing['2xl'], paddingHorizontal: Spacing.md },
  card: { width: '100%', padding: Spacing.xl, marginBottom: Spacing.xl },
  uploadArea: {
    borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.gray200,
    borderRadius: BorderRadius.lg, padding: Spacing['2xl'],
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: Colors.gray100,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  uploadTitle: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.gray900, marginTop: Spacing.sm },
  uploadSubtitle: { fontSize: FontSizes.sm, color: Colors.gray400, marginTop: Spacing.xs },
  photoPreviewContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  photoPreview: {
    width: 140, height: 140, borderRadius: 70,
    borderWidth: 3, borderColor: Colors.primary,
  },
  removeButton: {
    position: 'absolute', top: Spacing.md, right: Spacing.md,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.error, alignItems: 'center', justifyContent: 'center',
  },
  changeText: {
    fontSize: FontSizes.sm, color: Colors.gray400, marginTop: Spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  actionButtonText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.primary,
  },
  actionDivider: {
    width: 1,
    backgroundColor: Colors.gray200,
  },
  buttons: { flexDirection: 'row', gap: Spacing.md, width: '100%' },
});
