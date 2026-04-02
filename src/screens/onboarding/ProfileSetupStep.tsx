import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Animated, {
  FadeInDown,
  FadeInUp,
  ZoomIn,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { Button } from '../../components/ui/Button';
import { usersService } from '../../services/users.service';
import { useAuthStore } from '../../stores/auth.store';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights, Shadows } from '../../theme';

interface ProfileSetupStepProps {
  onComplete: () => void;
}

type Gender = 'male' | 'female' | 'other' | '';

const genderOptions: { value: Gender; label: string; emoji: string }[] = [
  { value: 'male', label: 'Homme', emoji: '👨' },
  { value: 'female', label: 'Femme', emoji: '👩' },
  { value: 'other', label: 'Autre', emoji: '🧑' },
];

export function ProfileSetupStep({ onComplete }: ProfileSetupStepProps) {
  const { loadUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formData, setFormData] = useState({
    dateOfBirth: null as Date | null,
    gender: '' as Gender,
    avatar: '',
  });

  useEffect(() => {
    // Pre-fill data if available
    usersService.getMe().then(user => {
      setFormData(prev => ({
        ...prev,
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth) : null,
        gender: (user.gender as Gender) || '',
        avatar: user.avatar || '',
      }));
    }).catch(() => {
      // Ignore error, just start fresh
    });
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission requise',
        'Nous avons besoin de votre permission pour accéder à vos photos.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.base64) {
        const mimeType = asset.uri.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
        setFormData(prev => ({
          ...prev,
          avatar: `data:${mimeType};base64,${asset.base64}`,
        }));
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData.dateOfBirth) {
      Alert.alert('Erreur', 'Date de naissance requise');
      return;
    }

    if (!formData.gender) {
      Alert.alert('Erreur', 'Genre requis');
      return;
    }

    setLoading(true);
    try {
      await usersService.updateMe({
        dateOfBirth: formData.dateOfBirth!.toISOString(),
        gender: formData.gender,
        avatar: formData.avatar || undefined,
      });

      // Reload global user state
      await loadUser();
      onComplete();
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.header}>
        <Animated.View entering={ZoomIn.delay(300).duration(400)}>
          <LinearGradient
            colors={['#8B5CF6', '#6366F1']}
            style={styles.iconBadge}
          >
            <Feather name="user" size={32} color={Colors.white} />
          </LinearGradient>
        </Animated.View>

        <Text style={styles.title}>Configurez votre profil</Text>
        <Text style={styles.subtitle}>
          Ces informations nous aideront à personnaliser vos recommandations
        </Text>
      </Animated.View>

      {/* Avatar Picker */}
      <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.avatarSection}>
        <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
          {formData.avatar ? (
            <Image source={{ uri: formData.avatar }} style={styles.avatarImage} />
          ) : (
            <LinearGradient
              colors={['#E5E7EB', '#D1D5DB']}
              style={styles.avatarPlaceholder}
            >
              <Feather name="camera" size={28} color={Colors.gray500} />
            </LinearGradient>
          )}
          <View style={styles.avatarBadge}>
            <Feather name="edit-2" size={12} color={Colors.white} />
          </View>
        </TouchableOpacity>
        <Text style={styles.avatarHint}>Appuyez pour ajouter une photo</Text>
      </Animated.View>

      {/* Form */}
      <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.form}>
        {/* Date of Birth */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Date de naissance</Text>
          <TouchableOpacity
            style={styles.dateInputContainer}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <Feather name="calendar" size={20} color={Colors.gray400} style={styles.inputIcon} />
            <Text style={[
              styles.dateText,
              !formData.dateOfBirth && styles.dateTextPlaceholder
            ]}>
              {formData.dateOfBirth
                ? formData.dateOfBirth.toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })
                : 'Sélectionner une date'}
            </Text>
            <Feather name="chevron-down" size={20} color={Colors.gray400} />
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={formData.dateOfBirth || new Date(2000, 0, 1)}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={new Date()}
            minimumDate={new Date(1900, 0, 1)}
            onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (event.type === 'set' && selectedDate) {
                setFormData(prev => ({ ...prev, dateOfBirth: selectedDate }));
              }
              if (Platform.OS === 'android') {
                setShowDatePicker(false);
              }
            }}
          />
        )}

        {/* Gender Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Genre</Text>
          <View style={styles.genderOptions}>
            {genderOptions.map((option) => {
              const isSelected = formData.gender === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => setFormData(prev => ({ ...prev, gender: option.value }))}
                  style={[
                    styles.genderOption,
                    isSelected && styles.genderOptionSelected,
                  ]}
                >
                  <Text style={styles.genderEmoji}>{option.emoji}</Text>
                  <Text
                    style={[
                      styles.genderLabel,
                      isSelected && styles.genderLabelSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {isSelected && (
                    <View style={styles.genderCheck}>
                      <Feather name="check" size={12} color={Colors.white} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Animated.View>

      {/* Submit Button */}
      <Animated.View entering={FadeInUp.delay(700).duration(400)} style={styles.buttonContainer}>
        <Button
          onPress={handleSubmit}
          loading={loading}
          disabled={!formData.dateOfBirth || !formData.gender}
          fullWidth
        >
          Continuer →
        </Button>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.lg,
  },
  title: {
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.bold,
    color: Colors.gray900,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSizes.base,
    color: Colors.gray500,
    textAlign: 'center',
    maxWidth: 300,
  },

  // Avatar
  avatarSection: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Spacing.sm,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.gray300,
    borderStyle: 'dashed',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
    ...Shadows.md,
  },
  avatarHint: {
    fontSize: FontSizes.xs,
    color: Colors.gray400,
  },

  // Form
  form: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.gray700,
    marginBottom: Spacing.sm,
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.base,
    borderWidth: 1,
    borderColor: Colors.gray200,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.base,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  dateText: {
    flex: 1,
    fontSize: FontSizes.base,
    color: Colors.gray900,
  },
  dateTextPlaceholder: {
    color: Colors.gray400,
  },

  // Gender
  genderOptions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  genderOption: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    padding: Spacing.base,
    borderRadius: BorderRadius.base,
    backgroundColor: Colors.gray50,
    borderWidth: 2,
    borderColor: Colors.gray200,
    position: 'relative',
  },
  genderOptionSelected: {
    backgroundColor: Colors.primaryAlpha10,
    borderColor: Colors.primary,
  },
  genderEmoji: {
    fontSize: 28,
    marginBottom: Spacing.xs,
  },
  genderLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.gray600,
  },
  genderLabelSelected: {
    color: Colors.primary,
    fontWeight: FontWeights.semibold,
  },
  genderCheck: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },

  // Button
  buttonContainer: {
    marginTop: Spacing.sm,
  },
});
