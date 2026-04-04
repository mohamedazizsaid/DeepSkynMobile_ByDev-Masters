import React, { useState, useEffect, useMemo } from 'react';
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
import { Colors, Spacing, BorderRadius, FontWeights, Shadows } from '../../theme';
import { useAccessibilityStyleSheet } from '../../stores/useAccessibilityStyles';
import { useTranslation } from '../../lib/i18n/useTranslation';

interface ProfileSetupStepProps {
  onComplete: () => void;
}

type Gender = 'male' | 'female' | 'other' | '';

export function ProfileSetupStep({ onComplete }: ProfileSetupStepProps) {
  const { t } = useTranslation();
  const { loadUser } = useAuthStore();
  
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formData, setFormData] = useState({
    dateOfBirth: null as Date | null,
    gender: '' as Gender,
    avatar: '',
  });

  const genderOptions: { value: Gender; label: string; emoji: string }[] = useMemo(() => [
    { value: 'male', label: t.onboarding.genderM, emoji: '👨' },
    { value: 'female', label: t.onboarding.genderF, emoji: '👩' },
    { value: 'other', label: t.onboarding.genderO, emoji: '🧑' },
  ], [t.onboarding]);

  const styles = useAccessibilityStyleSheet(({ colors, fontSizes, getAnimDuration }) => ({
    container: { flex: 1, backgroundColor: colors.background },
    contentContainer: { padding: Spacing.lg, paddingBottom: Spacing['3xl'] },
    header: { alignItems: 'center', marginBottom: Spacing['2xl'] },
    iconBadge: { width: 64, height: 64, borderRadius: BorderRadius.xl, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg, ...Shadows.lg },
    title: { fontSize: fontSizes['2xl'], fontWeight: FontWeights.bold, color: colors.text, marginBottom: Spacing.sm, textAlign: 'center' },
    subtitle: { fontSize: fontSizes.base, color: colors.textSecondary, textAlign: 'center', maxWidth: 300 },
    avatarSection: { alignItems: 'center', marginBottom: Spacing['2xl'] },
    avatarContainer: { position: 'relative', marginBottom: Spacing.sm },
    avatarImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: colors.primary },
    avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.border, borderStyle: 'dotted' },
    avatarBadge: { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.surface, ...Shadows.md },
    avatarHint: { fontSize: fontSizes.xs, color: colors.textSecondary },
    form: { backgroundColor: colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.lg, marginBottom: Spacing.lg, ...Shadows.md },
    inputGroup: { marginBottom: Spacing.lg },
    inputLabel: { fontSize: fontSizes.sm, fontWeight: FontWeights.semibold, color: colors.text, marginBottom: Spacing.sm },
    dateInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderRadius: BorderRadius.base, borderWidth: 1, borderColor: colors.border, paddingHorizontal: Spacing.md, paddingVertical: Spacing.base },
    inputIcon: { marginRight: Spacing.sm },
    dateText: { flex: 1, fontSize: fontSizes.base, color: colors.text },
    dateTextPlaceholder: { color: colors.textSecondary },
    genderOptions: { flexDirection: 'row', gap: Spacing.sm },
    genderOption: { flex: 1, flexDirection: 'column', alignItems: 'center', padding: Spacing.base, borderRadius: BorderRadius.base, backgroundColor: colors.backgroundSecondary, borderWidth: 2, borderColor: colors.border, position: 'relative' },
    genderOptionSelected: { backgroundColor: 'rgba(14, 165, 233, 0.1)', borderColor: colors.primary },
    genderEmoji: { fontSize: 28, marginBottom: Spacing.xs },
    genderLabel: { fontSize: fontSizes.sm, fontWeight: FontWeights.medium, color: colors.textSecondary },
    genderLabelSelected: { color: colors.primary, fontWeight: FontWeights.semibold },
    genderCheck: { position: 'absolute', top: -8, right: -8, width: 20, height: 20, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...Shadows.sm },
    buttonContainer: { marginTop: Spacing.sm },
  }));

  useEffect(() => {
    usersService.getMe().then(user => {
      setFormData(prev => ({
        ...prev,
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth) : null,
        gender: (user.gender as Gender) || '',
        avatar: user.avatar || '',
      }));
    }).catch(() => {});
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t.common.error, t.onboarding.avatarLim); // Reuse or add permission error
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
      Alert.alert(t.common.error, t.onboarding.dob);
      return;
    }

    if (!formData.gender) {
      Alert.alert(t.common.error, t.onboarding.gender);
      return;
    }

    setLoading(true);
    try {
      await usersService.updateMe({
        dateOfBirth: formData.dateOfBirth!.toISOString(),
        gender: formData.gender,
        avatar: formData.avatar || undefined,
      });

      await loadUser();
      onComplete();
    } catch (error) {
      Alert.alert(t.common.error, t.onboarding.error || t.common.error);
    } finally {
      setLoading(false);
    }
  };

  const getAnimDuration = (d: number) => d; // Fallback if hook doesn't provide it

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.header}>
        <Animated.View entering={ZoomIn.delay(300).duration(400)}>
          <LinearGradient
            colors={['#8B5CF6', '#6366F1']}
            style={styles.iconBadge}
          >
            <Feather name="user" size={32} color={Colors.white} />
          </LinearGradient>
        </Animated.View>

        <Text style={styles.title}>{t.onboarding.profTitle}</Text>
        <Text style={styles.subtitle}>
          {t.onboarding.profSub}
        </Text>
      </Animated.View>

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
        <Text style={styles.avatarHint}>{t.onboarding.avatarLim}</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>{t.onboarding.dob}</Text>
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
                ? formData.dateOfBirth.toLocaleDateString(undefined, {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })
                : t.onboarding.notProvided}
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

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>{t.onboarding.gender}</Text>
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

      <Animated.View entering={FadeInUp.delay(700).duration(400)} style={styles.buttonContainer}>
        <Button
          onPress={handleSubmit}
          loading={loading}
          disabled={!formData.dateOfBirth || !formData.gender}
          fullWidth
        >
          {t.onboarding.next} →
        </Button>
      </Animated.View>
    </ScrollView>
  );
}
