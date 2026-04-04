import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Image,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Region } from 'react-native-maps';
import { Card, Button, Input, Badge, LoadingSpinner } from '../../components';
import { Colors, Gradients, Spacing, FontSizes, FontWeights } from '../../theme';
import { useAuthStore } from '../../stores/auth.store';
import { useAccessibilityStyles } from '../../stores/useAccessibilityStyles';
import { useTranslation } from '../../lib/i18n';
import { usersService, User } from '../../services/users.service';
import { authService } from '../../services/auth.service';
import { skinProfileService } from '../../services/skin-profile.service';
import { analysisService } from '../../services/analysis.service';
import { chatService } from '../../services/chat.service';
import * as Location from 'expo-location';
import type { SkinProfile, AnalysisStats } from '../../lib/types';
import { formatDate } from '../../lib/utils';

export function ProfileScreen({ navigation }: any) {
  const { user: authUser, logout } = useAuthStore();
  const { colors, fontSizes, settings } = useAccessibilityStyles();
  const { t } = useTranslation();

  const [profile, setProfile] = useState<User | null>(null);
  const [skinProfile, setSkinProfile] = useState<SkinProfile | null>(null);
  const [stats, setStats] = useState<AnalysisStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [aiCoachMsg, setAiCoachMsg] = useState('');
  const [dailyTipMsg, setDailyTipMsg] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isSavingPersonal, setIsSavingPersonal] = useState(false);
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: 36.8065,
    longitude: 10.1815,
    latitudeDelta: 0.03,
    longitudeDelta: 0.03,
  });
  const [personalForm, setPersonalForm] = useState({
    name: '',
    email: '',
    age: '',
    gender: '',
    address: '',
    city: '',
    zipCode: '',
    country: '',
    latitude: null as number | null,
    longitude: null as number | null,
  });

  const resolveAddressFromCoordinates = useCallback(async (latitude: number, longitude: number) => {
    try {
      const [geo] = await Location.reverseGeocodeAsync({ latitude, longitude });
      setPersonalForm((prev) => ({
        ...prev,
        latitude,
        longitude,
        address: geo?.street ? `${geo.street}${geo.streetNumber ? ` ${geo.streetNumber}` : ''}` : prev.address,
        city: geo?.city || geo?.subregion || prev.city,
        zipCode: geo?.postalCode || prev.zipCode,
        country: geo?.country || prev.country,
      }));
    } catch (error) {
      console.error('Reverse geocode error:', error);
      setPersonalForm((prev) => ({ ...prev, latitude, longitude }));
    }
  }, []);

  const dynamicStyles = useMemo(
    () => ({
      safeArea: { flex: 1, backgroundColor: colors.background },
      container: { flex: 1, backgroundColor: colors.background },
      loadingContainer: {
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
      },
      sectionTitle: {
        fontSize: fontSizes.lg,
        fontWeight: FontWeights.bold,
        color: colors.text,
        marginBottom: Spacing.base,
      },
      statValue: {
        fontSize: fontSizes.xl,
        fontWeight: FontWeights.bold,
        color: colors.primary,
      },
      statLabel: { fontSize: fontSizes.xs, color: colors.textSecondary, marginTop: 2, textAlign: 'center' as const },
      profileLabel: { fontSize: fontSizes.sm, color: colors.textSecondary },
      profileValue: {
        fontSize: fontSizes.sm,
        fontWeight: FontWeights.medium,
        color: colors.text,
        maxWidth: '60%' as const,
        textAlign: 'right' as const,
      },
      profileRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
      logoutText: { color: colors.error, fontWeight: FontWeights.medium },
      formCard: { padding: Spacing.xl, backgroundColor: colors.surface },
      emptyHint: { color: colors.textSecondary, fontSize: fontSizes.xs, fontWeight: FontWeights.medium },
      cardBorder: { borderColor: colors.border },
    }),
    [colors, fontSizes]
  );

  const loadProfileData = useCallback(async () => {
    try {
      const [userProfile, skinProf, analysisStats] = await Promise.all([
        usersService.getMe().catch(() => null),
        skinProfileService.getMyProfile().catch(() => null),
        analysisService.getStats().catch(() => null),
      ]);
      setProfile(userProfile);
      setSkinProfile(skinProf);
      setStats(analysisStats);

      const mergedUser = userProfile || authUser;
      const ageFromDob = mergedUser?.dateOfBirth
        ? String(new Date().getFullYear() - new Date(mergedUser.dateOfBirth).getFullYear())
        : '';

      setPersonalForm({
        name: mergedUser?.name || authUser?.firstName || '',
        email: mergedUser?.email || authUser?.email || '',
        age: ageFromDob,
        gender: mergedUser?.gender || '',
        address: mergedUser?.address || '',
        city: mergedUser?.city || '',
        zipCode: mergedUser?.zipCode || '',
        country: mergedUser?.country || '',
        latitude: typeof mergedUser?.latitude === 'number' ? mergedUser.latitude : null,
        longitude: typeof mergedUser?.longitude === 'number' ? mergedUser.longitude : null,
      });

      if (typeof mergedUser?.latitude === 'number' && typeof mergedUser?.longitude === 'number') {
        setMapRegion((prev) => ({
          ...prev,
          latitude: mergedUser.latitude as number,
          longitude: mergedUser.longitude as number,
        }));
      }
    } catch (error) {
      console.error('Profile load error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authUser]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  useEffect(() => {
    const fetchAiCards = async () => {
      if (!skinProfile) return;
      setIsGeneratingAi(true);
      try {
        const [tipRes, coachRes] = await Promise.all([
          chatService.sendMessage({
            message: `Generate one short skincare tip for ${skinProfile.skinType || 'combination'} skin.`,
          }),
          chatService.sendMessage({
            message: 'Generate one short caring motivational sentence from an AI skin coach.',
          }),
        ]);

        if (tipRes.assistantResponse) setDailyTipMsg(tipRes.assistantResponse);
        if (coachRes.assistantResponse) setAiCoachMsg(coachRes.assistantResponse);
      } catch (error) {
        console.error('AI profile cards error:', error);
      } finally {
        setIsGeneratingAi(false);
      }
    };

    if (skinProfile && (!aiCoachMsg || !dailyTipMsg)) {
      fetchAiCards();
    }
  }, [skinProfile, aiCoachMsg, dailyTipMsg]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProfileData();
  };

  const handleLogout = () => {
    Alert.alert(t.nav.logout, t.settings.closeSession, [
      { text: t.common.cancel, style: 'cancel' },
      { text: t.nav.logout, style: 'destructive', onPress: logout },
    ]);
  };

  const resetPersonalForm = useCallback(() => {
    const mergedUser = profile || authUser;
    const ageFromDob = mergedUser?.dateOfBirth
      ? String(new Date().getFullYear() - new Date(mergedUser.dateOfBirth).getFullYear())
      : '';

    setPersonalForm({
      name: mergedUser?.name || authUser?.firstName || '',
      email: mergedUser?.email || authUser?.email || '',
      age: ageFromDob,
      gender: mergedUser?.gender || '',
      address: mergedUser?.address || '',
      city: mergedUser?.city || '',
      zipCode: mergedUser?.zipCode || '',
      country: mergedUser?.country || '',
      latitude: typeof mergedUser?.latitude === 'number' ? mergedUser.latitude : null,
      longitude: typeof mergedUser?.longitude === 'number' ? mergedUser.longitude : null,
    });
  }, [profile, authUser]);

  useEffect(() => {
    if (personalForm.latitude != null && personalForm.longitude != null) {
      setMapRegion((prev) => ({
        ...prev,
        latitude: personalForm.latitude as number,
        longitude: personalForm.longitude as number,
      }));
    }
  }, [personalForm.latitude, personalForm.longitude]);

  const handleUseCurrentLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t.common.error, t.settings.personal.addressSyncError);
        return;
      }

      const current = await Location.getCurrentPositionAsync({});
      await resolveAddressFromCoordinates(current.coords.latitude, current.coords.longitude);

      setMapRegion((prev) => ({
        ...prev,
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      }));

      Alert.alert(t.common.success, t.settings.personal.addressSyncSuccess);
    } catch (error) {
      console.error('Location sync error:', error);
      Alert.alert(t.common.error, t.settings.personal.addressSyncError);
    }
  }, [t, resolveAddressFromCoordinates]);

  const handleSavePersonalInfo = useCallback(async () => {
    setIsSavingPersonal(true);
    try {
      const ageNum = Number(personalForm.age);
      const birthYear = Number.isFinite(ageNum) && ageNum > 0
        ? new Date().getFullYear() - ageNum
        : null;
      const dateOfBirth = birthYear ? `${birthYear}-01-01T00:00:00.000Z` : undefined;

      await authService.updateProfile({
        name: personalForm.name,
        gender: personalForm.gender || undefined,
        dateOfBirth,
        address: personalForm.address || undefined,
        city: personalForm.city || undefined,
        zipCode: personalForm.zipCode || undefined,
        country: personalForm.country || undefined,
        latitude: personalForm.latitude ?? undefined,
        longitude: personalForm.longitude ?? undefined,
      });

      await loadProfileData();
      setIsEditingPersonal(false);
      Alert.alert(t.common.success, t.settings.personal.updateSuccess);
    } catch (error: any) {
      Alert.alert(t.common.error, error?.response?.data?.message || t.settings.personal.updateError);
    } finally {
      setIsSavingPersonal(false);
    }
  }, [personalForm, loadProfileData, t]);

  const openInMaps = useCallback(() => {
    if (personalForm.latitude == null || personalForm.longitude == null) {
      return;
    }
    const label = encodeURIComponent(personalForm.address || personalForm.city || 'DeepSkyn User Location');
    const url = `https://www.google.com/maps/search/?api=1&query=${personalForm.latitude},${personalForm.longitude}&query_place_id=${label}`;
    Linking.openURL(url).catch(() => {
      Alert.alert(t.common.error, t.settings.personal.addressSyncError);
    });
  }, [personalForm, t]);

  const handleMapPress = useCallback(async (event: any) => {
    if (!isEditingPersonal) return;
    const { latitude, longitude } = event.nativeEvent.coordinate;
    await resolveAddressFromCoordinates(latitude, longitude);
  }, [isEditingPersonal, resolveAddressFromCoordinates]);

  const handleMarkerDragEnd = useCallback(async (event: any) => {
    if (!isEditingPersonal) return;
    const { latitude, longitude } = event.nativeEvent.coordinate;
    await resolveAddressFromCoordinates(latitude, longitude);
  }, [isEditingPersonal, resolveAddressFromCoordinates]);

  if (loading) {
    return (
      <SafeAreaView style={dynamicStyles.loadingContainer} edges={['left', 'right', 'bottom']}>
        <LoadingSpinner message={t.common.loading} />
      </SafeAreaView>
    );
  }

  const user = profile || authUser;
  const userName = user?.name || authUser?.firstName || t.common.user;
  const userEmail = user?.email || authUser?.email || '';
  const userInitials = userName
    .split(' ')
    .filter(Boolean)
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const locale = settings.language === 'ar' ? 'ar-SA' : settings.language === 'en' ? 'en-US' : 'fr-FR';
  const memberSince = (user as any)?.createdAt
    ? new Date((user as any).createdAt).toLocaleDateString(locale, { month: 'long', year: 'numeric' })
    : t.onboarding.notProvided;

  const onboarding = t.onboarding as any;
  const skinLabels = (onboarding.skinTypesLabels || {}) as Record<string, string>;
  const concernLabels = (onboarding.concernsLabels || onboarding.concerns?.labels || {}) as Record<string, string>;
  const sensitivityLabels = (onboarding.sensitivitiesLabels || onboarding.sensitivities?.labels || {}) as Record<string, string>;

  const statsData = [
    {
      label: t.dashboard.analyses,
      value: stats?.totalAnalyses?.toString() || '0',
      icon: 'scan-outline' as const,
      tint: Colors.primary,
    },
    {
      label: t.dashboard.averageScore,
      value: stats?.averageHealthScore ? `${Math.round(stats.averageHealthScore)}/100` : '-',
      icon: 'analytics-outline' as const,
      tint: Colors.purple,
    },
    {
      label: t.dashboard.skinHealth,
      value: skinProfile?.healthScore ? `${skinProfile.healthScore}/100` : '-',
      icon: 'heart-outline' as const,
      tint: Colors.error,
    },
    {
      label: t.dashboard.skinAge,
      value: skinProfile?.skinAge ? `${skinProfile.skinAge} ${t.common.years}` : '-',
      icon: 'time-outline' as const,
      tint: Colors.success,
    },
  ];

  const activityData = [
    {
      icon: 'scan-outline' as const,
      action: t.profile.activityActions.analysis,
      time: t.profile.times.hoursAgo?.replace('{count}', '2') || '2h',
      bg: Colors.primaryAlpha10,
      iconColor: Colors.primary,
    },
    {
      icon: 'calendar-outline' as const,
      action: t.profile.activityActions.routine,
      time: t.profile.times.yesterday,
      bg: Colors.warningAlpha10,
      iconColor: Colors.warning,
    },
    {
      icon: 'chatbubble-outline' as const,
      action: t.profile.activityActions.chat,
      time: t.profile.times.daysAgo?.replace('{count}', '2') || '2d',
      bg: Colors.successAlpha10,
      iconColor: Colors.success,
    },
  ];

  const skinProfileData = skinProfile
    ? [
        {
          label: onboarding.skinTitle || t.nav.profile,
          value: skinLabels[skinProfile.skinType || ''] || skinProfile.skinType || t.onboarding.notProvided,
        },
        {
          label: onboarding.fitzTitle || 'Fitzpatrick',
          value: skinProfile.fitzpatrickType ? `Type ${skinProfile.fitzpatrickType}` : t.onboarding.notProvided,
        },
        {
          label: t.dashboard.skinHealth,
          value: skinProfile.healthScore ? `${skinProfile.healthScore}/100` : '-',
        },
        {
          label: t.dashboard.skinAge,
          value: skinProfile.skinAge ? `${skinProfile.skinAge} ${t.common.years}` : '-',
        },
      ]
    : [];

  const concerns = skinProfile?.concerns || [];
  const sensitivities = skinProfile?.sensitivities || [];

  return (
    <SafeAreaView style={dynamicStyles.safeArea} edges={['left', 'right', 'bottom']}>
      <ScrollView
        style={dynamicStyles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      >
        <View style={styles.contentWrap}>
          <LinearGradient colors={Gradients.primary} style={styles.heroCard}>
            <View style={styles.heroGlow} />
            <View style={styles.heroTopRow}>
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
              ) : (
                <LinearGradient colors={Gradients.purple} style={styles.avatar}>
                  <Text style={styles.avatarText}>{userInitials}</Text>
                </LinearGradient>
              )}
              <TouchableOpacity style={styles.cameraButton} accessibilityLabel="camera">
                <Ionicons name="camera" size={16} color={Colors.white} />
              </TouchableOpacity>
            </View>

            <Text style={styles.heroName}>{userName}</Text>
            {!!userEmail && <Text style={styles.heroEmail}>{userEmail}</Text>}

            <View style={styles.heroBadge}>
              <Ionicons name="time-outline" size={13} color={Colors.white} />
              <Text style={styles.heroBadgeText}>{t.profile.memberSince.replace('{date}', memberSince)}</Text>
            </View>
          </LinearGradient>

          <View style={styles.statsGrid}>
            {statsData.map((stat, index) => (
              <Card key={index} style={{ ...styles.statCard, ...dynamicStyles.cardBorder }}>
                <View style={[styles.statIconWrap, { backgroundColor: `${stat.tint}1A` }]}>
                  <Ionicons name={stat.icon} size={18} color={stat.tint} />
                </View>
                <Text style={[dynamicStyles.statValue, { color: stat.tint }]}>{stat.value}</Text>
                <Text style={dynamicStyles.statLabel}>{stat.label}</Text>
              </Card>
            ))}
          </View>

          <View style={styles.aiGrid}>
            <LinearGradient colors={Gradients.primary} style={styles.aiCard}>
              <View style={styles.aiHeaderRow}>
                <Ionicons name="chatbubble-ellipses-outline" size={22} color={Colors.white} />
                <Text style={styles.aiTitle}>{t.dashboard.aiCoach}</Text>
              </View>
              <Text style={styles.aiMessage}>
                {isGeneratingAi ? t.common.loading : `"${aiCoachMsg || t.dashboard.personalizedAdvice}"`}
              </Text>
              <Button onPress={() => navigation.navigate('Chat')} style={styles.aiButton}>
                {t.dashboard.aiCoach}
              </Button>
            </LinearGradient>

            <LinearGradient colors={Gradients.purple} style={styles.aiCard}>
              <View style={styles.aiHeaderRow}>
                <Ionicons name="sparkles-outline" size={22} color={Colors.white} />
                <Text style={styles.aiTitle}>{t.dashboard.personalizedAdvice}</Text>
              </View>
              <Text style={styles.aiMessage}>
                {isGeneratingAi ? t.common.loading : `"${dailyTipMsg || t.dashboard.personalizedAdvice}"`}
              </Text>
              <Button onPress={() => navigation.navigate('Routine')} style={styles.aiButton}>
                {t.nav.routine}
              </Button>
            </LinearGradient>
          </View>

          <View style={styles.section}>
            <Text style={dynamicStyles.sectionTitle}>{t.profile.activityTitle}</Text>
            <Card style={{ ...styles.profileCard, ...dynamicStyles.cardBorder }}>
              {activityData.map((item, index) => (
                <View
                  key={index}
                  style={[styles.activityRow, index < activityData.length - 1 ? dynamicStyles.profileRowBorder : undefined]}
                >
                  <View style={[styles.activityIcon, { backgroundColor: item.bg }]}>
                    <Ionicons name={item.icon} size={17} color={item.iconColor} />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={[styles.activityTitle, { color: colors.text }]}>{item.action}</Text>
                    <Text style={[styles.activityTime, { color: colors.textSecondary }]}>{item.time}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                </View>
              ))}
            </Card>
          </View>

          {skinProfileData.length > 0 && (
            <View style={styles.section}>
              <Text style={dynamicStyles.sectionTitle}>{onboarding.sumTitle || onboarding.summary?.title || t.nav.profile}</Text>
              <Card style={{ ...styles.profileCard, ...dynamicStyles.cardBorder }}>
                {skinProfileData.map((item, index) => (
                  <View
                    key={index}
                    style={[styles.profileRow, index < skinProfileData.length - 1 ? dynamicStyles.profileRowBorder : undefined]}
                  >
                    <Text style={dynamicStyles.profileLabel}>{item.label}</Text>
                    <Text style={dynamicStyles.profileValue as any}>{item.value}</Text>
                  </View>
                ))}

                <View style={[styles.tagSection, { borderTopColor: colors.border }]}>
                  <Text style={[styles.tagTitle, { color: colors.textSecondary }]}>{onboarding.concernTitle || onboarding.concerns?.title || t.dashboard.detectedConditions}</Text>
                  <View style={styles.tagsWrap}>
                    {concerns.length > 0 ? (
                      concerns.map((item) => <Badge key={item} text={concernLabels[item] || item} variant="primary" />)
                    ) : (
                      <Text style={dynamicStyles.emptyHint}>{t.onboarding.none}</Text>
                    )}
                  </View>

                  <Text style={[styles.tagTitle, { color: colors.textSecondary, marginTop: Spacing.md }]}>{onboarding.sensTitle || onboarding.sensitivities?.title || t.settings.personal.title}</Text>
                  <View style={styles.tagsWrap}>
                    {sensitivities.length > 0 ? (
                      sensitivities.map((item) => (
                        <Badge key={item} text={sensitivityLabels[item] || item} variant="warning" />
                      ))
                    ) : (
                      <Text style={dynamicStyles.emptyHint}>{t.onboarding.none}</Text>
                    )}
                  </View>
                </View>
              </Card>
            </View>
          )}

          <View style={styles.section}>
            <Text style={dynamicStyles.sectionTitle}>{t.settings.personal.title}</Text>
            <Card variant="elevated" style={dynamicStyles.formCard}>
              <Input
                label={t.settings.personal.fullName}
                value={isEditingPersonal ? personalForm.name : userName}
                editable={isEditingPersonal}
                onChangeText={(value) => setPersonalForm((prev) => ({ ...prev, name: value }))}
                icon={<Ionicons name="person-outline" size={20} color={colors.textTertiary} />}
              />

              <Input
                label="Email"
                value={personalForm.email || userEmail}
                editable={false}
                icon={<Ionicons name="mail-outline" size={20} color={colors.textTertiary} />}
              />

              <Input
                label={t.profile.age}
                value={isEditingPersonal ? personalForm.age : (personalForm.age ? `${personalForm.age}` : '')}
                editable={isEditingPersonal}
                onChangeText={(value) => setPersonalForm((prev) => ({ ...prev, age: value.replace(/\D/g, '').slice(0, 3) }))}
                keyboardType="number-pad"
                icon={<Ionicons name="calendar-outline" size={20} color={colors.textTertiary} />}
              />

              <View style={styles.genderBlock}>
                <Text style={[styles.genderLabel, { color: colors.text }]}>{t.onboarding.gender}</Text>
                <View style={styles.genderOptionsRow}>
                  {[
                    { key: 'male', label: t.settings.personal.genderOptions.male },
                    { key: 'female', label: t.settings.personal.genderOptions.female },
                    { key: 'nonBinary', label: t.settings.personal.genderOptions.nonBinary },
                  ].map((option) => {
                    const selected = personalForm.gender === option.key;
                    return (
                      <TouchableOpacity
                        key={option.key}
                        style={[
                          styles.genderOption,
                          { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? `${colors.primary}14` : colors.surface },
                          !isEditingPersonal && styles.genderOptionDisabled,
                        ]}
                        onPress={() => {
                          if (!isEditingPersonal) return;
                          setPersonalForm((prev) => ({ ...prev, gender: option.key }));
                        }}
                        disabled={!isEditingPersonal}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        accessibilityLabel={option.label}
                      >
                        <Text style={{ color: selected ? colors.primary : colors.textSecondary, fontSize: fontSizes.xs, fontWeight: FontWeights.medium }}>{option.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.addressWrap}>
                <Text style={[styles.addressTitle, { color: colors.text }]}>{t.settings.personal.location}</Text>
                <Text style={[styles.addressHint, { color: colors.textSecondary }]}>{t.settings.personal.locationDesc}</Text>

                <Input
                  label={t.settings.personal.address}
                  value={personalForm.address}
                  editable={isEditingPersonal}
                  onChangeText={(value) => setPersonalForm((prev) => ({ ...prev, address: value }))}
                  icon={<Ionicons name="location-outline" size={20} color={colors.textTertiary} />}
                />

                <View style={styles.rowInputs}>
                  <View style={{ flex: 1 }}>
                    <Input
                      label={t.settings.personal.city}
                      value={personalForm.city}
                      editable={isEditingPersonal}
                      onChangeText={(value) => setPersonalForm((prev) => ({ ...prev, city: value }))}
                    />
                  </View>
                  <View style={{ width: Spacing.sm }} />
                  <View style={{ flex: 1 }}>
                    <Input
                      label={t.settings.personal.zipCode}
                      value={personalForm.zipCode}
                      editable={isEditingPersonal}
                      onChangeText={(value) => setPersonalForm((prev) => ({ ...prev, zipCode: value }))}
                    />
                  </View>
                </View>

                <Input
                  label={t.settings.personal.country}
                  value={personalForm.country}
                  editable={isEditingPersonal}
                  onChangeText={(value) => setPersonalForm((prev) => ({ ...prev, country: value }))}
                />

                <View style={styles.mapPreviewWrap}>
                  <MapView
                    style={styles.mapPreviewImage}
                    region={mapRegion}
                    onPress={handleMapPress}
                    pointerEvents={isEditingPersonal ? 'auto' : 'none'}
                    accessibilityLabel={t.settings.personal.location}
                  >
                    <Marker
                      coordinate={{
                        latitude: personalForm.latitude ?? mapRegion.latitude,
                        longitude: personalForm.longitude ?? mapRegion.longitude,
                      }}
                      draggable={isEditingPersonal}
                      onDragEnd={handleMarkerDragEnd}
                    />
                  </MapView>
                  <Text style={[styles.mapCoordinates, { color: colors.textSecondary }]}>
                    {(personalForm.latitude ?? mapRegion.latitude).toFixed(5)}, {(personalForm.longitude ?? mapRegion.longitude).toFixed(5)}
                  </Text>
                </View>

                <View style={styles.mapActionsRow}>
                  <View style={{ flex: 1 }}>
                    <Button
                      variant="outline"
                      onPress={handleUseCurrentLocation}
                      disabled={!isEditingPersonal}
                    >
                      {t.settings.personal.location}
                    </Button>
                  </View>
                  <View style={{ width: Spacing.sm }} />
                  <View style={{ flex: 1 }}>
                    <Button
                      variant="outline"
                      onPress={openInMaps}
                      disabled={personalForm.latitude == null || personalForm.longitude == null}
                    >
                      Maps
                    </Button>
                  </View>
                </View>
              </View>

              {!isEditingPersonal ? (
                <Button onPress={() => setIsEditingPersonal(true)} variant="outline">
                  {t.common.edit}
                </Button>
              ) : (
                <View style={styles.editActionsRow}>
                  <View style={{ flex: 1 }}>
                    <Button
                      onPress={() => {
                        resetPersonalForm();
                        setIsEditingPersonal(false);
                      }}
                      variant="outline"
                      disabled={isSavingPersonal}
                    >
                      {t.common.cancel}
                    </Button>
                  </View>
                  <View style={{ width: Spacing.sm }} />
                  <View style={{ flex: 1 }}>
                    <Button onPress={handleSavePersonalInfo} disabled={isSavingPersonal}>
                      {isSavingPersonal ? t.common.loading : t.common.save}
                    </Button>
                  </View>
                </View>
              )}
            </Card>
          </View>

          {stats?.commonConditions && stats.commonConditions.length > 0 && (
            <View style={styles.section}>
              <Text style={dynamicStyles.sectionTitle}>{t.dashboard.detectedConditions}</Text>
              <Card>
                <View style={styles.conditionsRow}>
                  {stats.commonConditions.map((condition, index) => (
                    <Badge key={index} text={condition} variant="warning" />
                  ))}
                </View>
              </Card>
            </View>
          )}

          <View style={styles.section}>
            <Button onPress={handleLogout} fullWidth variant="outline" style={styles.logoutButton}>
              <Ionicons name="log-out-outline" size={18} color={colors.error} />
              <Text style={dynamicStyles.logoutText}>  {t.nav.logout}</Text>
            </Button>
          </View>

          <View style={{ height: 30 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contentWrap: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  heroCard: {
    borderRadius: 28,
    padding: Spacing.xl,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
  },
  heroGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    right: -30,
    top: -30,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarText: { fontSize: FontSizes['2xl'], fontWeight: FontWeights.bold, color: Colors.white },
  cameraButton: {
    position: 'absolute',
    top: 66,
    left: 74,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
  },
  heroName: {
    marginTop: Spacing.md,
    color: Colors.white,
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.bold,
  },
  heroEmail: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.92)',
    fontSize: FontSizes.sm,
  },
  heroBadge: {
    marginTop: Spacing.md,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  heroBadgeText: {
    color: Colors.white,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: Spacing.md,
  },
  statCard: {
    width: '48.5%',
    borderRadius: 22,
    borderWidth: 1,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  aiGrid: {
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  aiCard: {
    borderRadius: 24,
    padding: Spacing.lg,
    overflow: 'hidden',
  },
  aiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  aiTitle: {
    color: Colors.white,
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
  aiMessage: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: FontSizes.base,
    lineHeight: 22,
    minHeight: 70,
    marginBottom: Spacing.md,
  },
  aiButton: {
    backgroundColor: Colors.white,
    borderColor: Colors.white,
  },
  section: { marginTop: Spacing.xl },
  profileCard: { padding: 0, borderWidth: 1 },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  activityIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: { flex: 1 },
  activityTitle: { fontSize: FontSizes.sm, fontWeight: FontWeights.medium },
  activityTime: { fontSize: FontSizes.xs, marginTop: 2 },
  tagSection: {
    borderTopWidth: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  tagTitle: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
    marginBottom: Spacing.xs,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  conditionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  genderBlock: {
    marginBottom: Spacing.base,
  },
  genderLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    marginBottom: Spacing.sm,
  },
  genderOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  genderOption: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  genderOptionDisabled: {
    opacity: 0.6,
  },
  addressWrap: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.base,
  },
  addressTitle: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
  },
  addressHint: {
    fontSize: FontSizes.xs,
    marginTop: 4,
    marginBottom: Spacing.md,
  },
  rowInputs: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mapPreviewWrap: {
    marginTop: Spacing.sm,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mapPreviewImage: {
    width: '100%',
    height: 150,
    borderRadius: 12,
  },
  mapCoordinates: {
    fontSize: FontSizes.xs,
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  mapActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  editActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  logoutButton: { borderColor: Colors.error },
});
