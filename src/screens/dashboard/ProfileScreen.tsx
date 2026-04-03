import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Button, Input, Badge, LoadingSpinner, LoadingOverlay } from '../../components';
import { Colors, Gradients, Spacing, BorderRadius, FontSizes, FontWeights } from '../../theme';
import { useAuthStore } from '../../stores/auth.store';
import { useAccessibilityStyles } from '../../stores/useAccessibilityStyles';
import { useTranslation } from '../../lib/i18n';
import { usersService, User } from '../../services/users.service';
import { skinProfileService } from '../../services/skin-profile.service';
import { analysisService } from '../../services/analysis.service';
import type { SkinProfile, AnalysisStats } from '../../lib/types';
import { formatDate, getRelativeTime } from '../../lib/utils';

export function ProfileScreen({ navigation }: any) {
  const { user: authUser, loadUser, logout } = useAuthStore();
  const { colors, fontSizes } = useAccessibilityStyles();
  const { t } = useTranslation();
  const [profile, setProfile] = useState<User | null>(null);
  const [skinProfile, setSkinProfile] = useState<SkinProfile | null>(null);
  const [stats, setStats] = useState<AnalysisStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const dynamicStyles = useMemo(() => ({
    safeArea: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1, backgroundColor: colors.background },
    loadingContainer: { flex: 1, backgroundColor: colors.background, justifyContent: 'center' as const, alignItems: 'center' as const },
    userName: { fontSize: fontSizes.xl, fontWeight: FontWeights.bold, color: colors.text, marginTop: Spacing.md },
    userEmail: { fontSize: fontSizes.sm, color: colors.textSecondary },
    statValue: { fontSize: fontSizes.xl, fontWeight: FontWeights.bold, color: Colors.primary },
    statLabel: { fontSize: fontSizes.xs, color: colors.textSecondary, marginTop: 2 },
    sectionTitle: { fontSize: fontSizes.lg, fontWeight: FontWeights.bold, color: colors.text, marginBottom: Spacing.base },
    profileLabel: { fontSize: fontSizes.sm, color: colors.textSecondary },
    profileValue: { fontSize: fontSizes.sm, fontWeight: FontWeights.medium, color: colors.text, maxWidth: '60%', textAlign: 'right' as const },
    profileRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
    logoutText: { color: colors.error, fontWeight: FontWeights.medium },
    formCard: { padding: Spacing.xl, backgroundColor: colors.surface },
    statsRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  }), [colors, fontSizes]);

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
    } catch (error) {
      console.error('Profile load error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProfileData();
  };

  const handleLogout = () => {
    Alert.alert(
      t.nav.logout,
      t.settings.closeSession,
      [
        { text: t.common.cancel, style: 'cancel' },
        { text: t.nav.logout, style: 'destructive', onPress: logout },
      ]
    );
  };

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
  const userInitials = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  const statsData = [
    { label: t.dashboard.analyses, value: stats?.totalAnalyses?.toString() || '0' },
    { label: t.dashboard.averageScore, value: stats?.averageHealthScore ? Math.round(stats.averageHealthScore).toString() : '-' },
    { label: t.dashboard.detectedConditions, value: stats?.commonConditions?.length?.toString() || '0' },
  ];

  const skinProfileData = skinProfile ? [
    { label: t.settings.personal.gender, value: skinProfile.skinType || t.common.noResults },
    { label: 'Fitzpatrick', value: skinProfile.fitzpatrickType ? `Type ${skinProfile.fitzpatrickType}` : 'Non défini' },
    { label: 'Préoccupations', value: skinProfile.concerns?.join(', ') || 'Aucune' },
  ] : [];

  return (
    <SafeAreaView style={dynamicStyles.safeArea} edges={['left', 'right', 'bottom']}>
      <ScrollView 
        style={dynamicStyles.container} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
      >
      {/* Avatar Section */}
      <View style={styles.avatarSection}>
        {user?.avatar ? (
          <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
        ) : (
          <LinearGradient colors={Gradients.primary} style={styles.avatar}>
            <Text style={styles.avatarText}>{userInitials}</Text>
          </LinearGradient>
        )}
        <TouchableOpacity style={styles.cameraButton}>
          <Ionicons name="camera" size={16} color={Colors.white} />
        </TouchableOpacity>
        <Text style={dynamicStyles.userName}>{userName}</Text>
        <Text style={dynamicStyles.userEmail}>{userEmail}</Text>
      </View>

      {/* Stats Row */}
      <View style={[styles.statsRow, dynamicStyles.statsRowBorder]}>
        {statsData.map((stat, index) => (
          <View key={index} style={styles.statItem}>
            <Text style={dynamicStyles.statValue}>{stat.value}</Text>
            <Text style={dynamicStyles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Skin Profile Summary */}
      {skinProfileData.length > 0 && (
        <View style={styles.section}>
          <Text style={dynamicStyles.sectionTitle}>{t.nav.profile}</Text>
          <Card style={styles.profileCard}>
            {skinProfileData.map((item, index) => (
              <View key={index} style={[styles.profileRow, index < skinProfileData.length - 1 ? dynamicStyles.profileRowBorder : undefined]}>
                <Text style={dynamicStyles.profileLabel}>{item.label}</Text>
                <Text style={dynamicStyles.profileValue as any}>{item.value}</Text>
              </View>
            ))}
          </Card>
        </View>
      )}

      {/* Personal Info Form */}
      <View style={styles.section}>
        <Text style={dynamicStyles.sectionTitle}>{t.settings.personal.title}</Text>
        <Card variant="elevated" style={dynamicStyles.formCard}>
          <Input 
            label={t.settings.personal.fullName}
            value={userName} 
            editable={false} 
            icon={<Ionicons name="person-outline" size={20} color={colors.textTertiary} />} 
          />
          <Input 
            label="Email" 
            value={userEmail} 
            editable={false} 
            icon={<Ionicons name="mail-outline" size={20} color={colors.textTertiary} />} 
          />
          {user?.dateOfBirth && (
            <Input 
              label="Date de naissance" 
              value={formatDate(user.dateOfBirth)} 
              editable={false} 
              icon={<Ionicons name="calendar-outline" size={20} color={colors.textTertiary} />} 
            />
          )}
          {user?.gender && (
            <Input 
              label="Genre" 
              value={user.gender} 
              editable={false} 
              icon={<Ionicons name="people-outline" size={20} color={colors.textTertiary} />} 
            />
          )}
          <Button onPress={() => navigation.navigate('Settings')} variant="outline">
            {t.common.edit}
          </Button>
        </Card>
      </View>

      {/* Common Conditions */}
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

      {/* Actions */}
      <View style={styles.section}>
        <Button 
          onPress={handleLogout} 
          fullWidth 
          variant="outline"
          style={styles.logoutButton}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.error} />
          <Text style={dynamicStyles.logoutText}>  {t.nav.logout}</Text>
        </Button>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  avatarSection: { alignItems: 'center', paddingTop: Spacing.xl },
  avatar: {
    width: 96, height: 96, borderRadius: 48,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarImage: {
    width: 96, height: 96, borderRadius: 48,
  },
  avatarText: { fontSize: FontSizes['2xl'], fontWeight: FontWeights.bold, color: Colors.white },
  cameraButton: {
    position: 'absolute', top: Spacing['2xl'] + 68, right: '38%',
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: Colors.white,
  },
  statsRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingVertical: Spacing.xl, marginHorizontal: Spacing.xl,
  },
  statItem: { alignItems: 'center' },
  section: { paddingHorizontal: Spacing.xl, marginTop: Spacing.xl },
  profileCard: { padding: 0 },
  profileRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  conditionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, padding: Spacing.md },
  logoutButton: { borderColor: Colors.error },
});
