import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Button, Input, Badge, LoadingSpinner, LoadingOverlay } from '../../components';
import { Colors, Gradients, Spacing, BorderRadius, FontSizes, FontWeights } from '../../theme';
import { useAuthStore } from '../../stores/auth.store';
import { usersService, User } from '../../services/users.service';
import { skinProfileService } from '../../services/skin-profile.service';
import { analysisService } from '../../services/analysis.service';
import type { SkinProfile, AnalysisStats } from '../../lib/types';
import { formatDate, getRelativeTime } from '../../lib/utils';

export function ProfileScreen({ navigation }: any) {
  const { user: authUser, loadUser, logout } = useAuthStore();
  const [profile, setProfile] = useState<User | null>(null);
  const [skinProfile, setSkinProfile] = useState<SkinProfile | null>(null);
  const [stats, setStats] = useState<AnalysisStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

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
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Déconnexion', style: 'destructive', onPress: logout },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <LoadingSpinner message="Chargement du profil..." />
      </SafeAreaView>
    );
  }

  const user = profile || authUser;
  const userName = user?.name || authUser?.firstName || 'Utilisateur';
  const userEmail = user?.email || authUser?.email || '';
  const userInitials = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  const statsData = [
    { label: 'Analyses', value: stats?.totalAnalyses?.toString() || '0' },
    { label: 'Score Moy.', value: stats?.averageHealthScore ? Math.round(stats.averageHealthScore).toString() : '-' },
    { label: 'Conditions', value: stats?.commonConditions?.length?.toString() || '0' },
  ];

  const skinProfileData = skinProfile ? [
    { label: 'Type de peau', value: skinProfile.skinType || 'Non défini' },
    { label: 'Fitzpatrick', value: skinProfile.fitzpatrickType ? `Type ${skinProfile.fitzpatrickType}` : 'Non défini' },
    { label: 'Préoccupations', value: skinProfile.concerns?.join(', ') || 'Aucune' },
  ] : [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container} 
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
        <Text style={styles.userName}>{userName}</Text>
        <Text style={styles.userEmail}>{userEmail}</Text>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        {statsData.map((stat, index) => (
          <View key={index} style={styles.statItem}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Skin Profile Summary */}
      {skinProfileData.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profil Peau</Text>
          <Card style={styles.profileCard}>
            {skinProfileData.map((item, index) => (
              <View key={index} style={[styles.profileRow, index < skinProfileData.length - 1 ? styles.profileRowBorder : undefined]}>
                <Text style={styles.profileLabel}>{item.label}</Text>
                <Text style={styles.profileValue}>{item.value}</Text>
              </View>
            ))}
          </Card>
        </View>
      )}

      {/* Personal Info Form */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations Personnelles</Text>
        <Card variant="elevated" style={styles.formCard}>
          <Input 
            label="Nom complet" 
            value={userName} 
            editable={false} 
            icon={<Ionicons name="person-outline" size={20} color={Colors.gray400} />} 
          />
          <Input 
            label="Email" 
            value={userEmail} 
            editable={false} 
            icon={<Ionicons name="mail-outline" size={20} color={Colors.gray400} />} 
          />
          {user?.dateOfBirth && (
            <Input 
              label="Date de naissance" 
              value={formatDate(user.dateOfBirth)} 
              editable={false} 
              icon={<Ionicons name="calendar-outline" size={20} color={Colors.gray400} />} 
            />
          )}
          {user?.gender && (
            <Input 
              label="Genre" 
              value={user.gender} 
              editable={false} 
              icon={<Ionicons name="people-outline" size={20} color={Colors.gray400} />} 
            />
          )}
          <Button onPress={() => navigation.navigate('Settings')} fullWidth variant="secondary">
            Modifier le profil
          </Button>
        </Card>
      </View>

      {/* Common Conditions */}
      {stats?.commonConditions && stats.commonConditions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conditions Fréquentes</Text>
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
          variant="secondary"
          style={styles.logoutButton}
        >
          <Ionicons name="log-out-outline" size={18} color={Colors.error} />
          <Text style={styles.logoutText}>  Déconnexion</Text>
        </Button>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.gray50 },
  container: { flex: 1, backgroundColor: Colors.gray50 },
  loadingContainer: { flex: 1, backgroundColor: Colors.gray50, justifyContent: 'center', alignItems: 'center' },
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
  userName: { fontSize: FontSizes.xl, fontWeight: FontWeights.bold, color: Colors.gray900, marginTop: Spacing.md },
  userEmail: { fontSize: FontSizes.sm, color: Colors.gray500 },
  statsRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingVertical: Spacing.xl, marginHorizontal: Spacing.xl,
    borderBottomWidth: 1, borderBottomColor: Colors.gray200,
  },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: FontSizes.xl, fontWeight: FontWeights.bold, color: Colors.primary },
  statLabel: { fontSize: FontSizes.xs, color: Colors.gray500, marginTop: 2 },
  section: { paddingHorizontal: Spacing.xl, marginTop: Spacing.xl },
  sectionTitle: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.gray900, marginBottom: Spacing.base },
  profileCard: { padding: 0 },
  profileRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  profileRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  profileLabel: { fontSize: FontSizes.sm, color: Colors.gray500 },
  profileValue: { fontSize: FontSizes.sm, fontWeight: FontWeights.medium, color: Colors.gray900, maxWidth: '60%', textAlign: 'right' },
  formCard: { padding: Spacing.xl },
  conditionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, padding: Spacing.md },
  logoutButton: { borderColor: Colors.error },
  logoutText: { color: Colors.error, fontWeight: FontWeights.medium },
});
