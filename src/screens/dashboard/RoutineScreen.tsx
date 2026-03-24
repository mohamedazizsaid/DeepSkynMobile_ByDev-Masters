import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, Image, Linking, ActivityIndicator, Switch, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, Badge } from '../../components';
import { Colors, Gradients, Spacing, BorderRadius, FontSizes, FontWeights, Shadows } from '../../theme';
import { routineService } from '../../services/routine.service';
import { usersService } from '../../services/users.service';
import type { ProductRecommendation } from '../../lib/types';

function RoutineReminderCard() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reminders, setReminders] = useState({
    morningEnabled: false,
    morningTime: '08:00',
    eveningEnabled: false,
    eveningTime: '21:00'
  });

  useEffect(() => {
    usersService.getMe()
      .then(user => {
        if (user.settings?.reminders) {
          setReminders(user.settings.reminders);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleUpdate = async (newReminders: typeof reminders) => {
    setReminders(newReminders);
    setSaving(true);
    try {
      const user = await usersService.getMe();
      await usersService.updateMe({
        settings: {
          ...user.settings,
          reminders: newReminders
        }
      });
      // Future: integrate expo-notifications scheduling here
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card style={[styles.tipsCard, { alignItems: 'center', paddingVertical: Spacing.xl }]}>
        <ActivityIndicator color={Colors.primary} size="small" />
      </Card>
    );
  }

  return (
    <Card style={styles.tipsCard}>
      <View style={[styles.tipsHeader, { marginBottom: Spacing.base }]}>
        <Ionicons name="notifications-outline" size={20} color={Colors.primary} />
        <Text style={[styles.tipsTitle, { color: Colors.primary }]}>Rappels de Routine</Text>
      </View>

      <View style={{ gap: Spacing.md }}>
        {/* Morning */}
        <View style={styles.reminderRow}>
          <View style={styles.reminderInfo}>
            <View style={[styles.reminderIcon, reminders.morningEnabled ? { backgroundColor: 'rgba(14,165,233,0.1)' } : {}]}>
              <Ionicons name="sunny" size={16} color={reminders.morningEnabled ? '#0EA5E9' : Colors.gray400} />
            </View>
            <View>
              <Text style={styles.reminderLabel}>Matin</Text>
              <TextInput 
                value={reminders.morningTime}
                onChangeText={(text) => setReminders({ ...reminders, morningTime: text })}
                onEndEditing={() => handleUpdate(reminders)}
                style={[styles.reminderTime, !reminders.morningEnabled && { opacity: 0.5 }]}
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>
          <Switch
            value={reminders.morningEnabled}
            onValueChange={(val) => handleUpdate({ ...reminders, morningEnabled: val })}
            trackColor={{ false: Colors.gray300, true: '#0EA5E9' }}
            thumbColor={Colors.white}
          />
        </View>

        {/* Evening */}
        <View style={styles.reminderRow}>
          <View style={styles.reminderInfo}>
            <View style={[styles.reminderIcon, reminders.eveningEnabled ? { backgroundColor: 'rgba(139,92,246,0.1)' } : {}]}>
              <Ionicons name="moon" size={16} color={reminders.eveningEnabled ? '#8B5CF6' : Colors.gray400} />
            </View>
            <View>
              <Text style={styles.reminderLabel}>Soir</Text>
              <TextInput 
                value={reminders.eveningTime}
                onChangeText={(text) => setReminders({ ...reminders, eveningTime: text })}
                onEndEditing={() => handleUpdate(reminders)}
                style={[styles.reminderTime, !reminders.eveningEnabled && { opacity: 0.5 }]}
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>
          <Switch
            value={reminders.eveningEnabled}
            onValueChange={(val) => handleUpdate({ ...reminders, eveningEnabled: val })}
            trackColor={{ false: Colors.gray300, true: '#8B5CF6' }}
            thumbColor={Colors.white}
          />
        </View>
        
        {saving && <Text style={{ fontSize: 10, color: Colors.gray400, textAlign: 'center' }}>Enregistrement...</Text>}
      </View>
    </Card>
  );
}

export function RoutineScreen() {
  const [activeTab, setActiveTab] = useState<'morning' | 'evening'>('morning');
  const [showRecommendModal, setShowRecommendModal] = useState(false);
  const [recommendLoading, setRecommendLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<ProductRecommendation | null>(null);
  const [recommendStepName, setRecommendStepName] = useState('');

  const morningRoutine = [
    { order: 1, name: 'Gentle Cleanser', type: 'cleanser', duration: '60 sec', icon: 'water-outline' },
    { order: 2, name: 'Vitamin C Serum', type: 'serum', duration: '30 sec', icon: 'flask-outline' },
    { order: 3, name: 'Hyaluronic Acid', type: 'moisturizer', duration: '30 sec', icon: 'water-outline' },
    { order: 4, name: 'SPF 50+ Sunscreen', type: 'sunscreen', duration: '45 sec', icon: 'sunny-outline' },
  ];

  const eveningRoutine = [
    { order: 1, name: 'Oil Cleanser', type: 'makeup_remover', duration: '90 sec', icon: 'water-outline' },
    { order: 2, name: 'Gentle Cleanser', type: 'cleanser', duration: '60 sec', icon: 'water-outline' },
    { order: 3, name: 'Retinol Serum', type: 'serum', duration: '30 sec', icon: 'flask-outline' },
    { order: 4, name: 'Night Cream', type: 'night_cream', duration: '45 sec', icon: 'moon-outline' },
  ];

  const routine = activeTab === 'morning' ? morningRoutine : eveningRoutine;

  const handleRecommend = async (step: typeof routine[0]) => {
    setRecommendStepName(step.name);
    setRecommendLoading(true);
    setShowRecommendModal(true);
    setRecommendation(null);

    try {
      const result = await routineService.recommendProduct({
        stepName: step.name,
        stepCategory: step.type,
      });
      setRecommendation(result);
    } catch {
      setRecommendation(null);
    } finally {
      setRecommendLoading(false);
    }
  };

  const streakDays = [
    true, true, true, false, true, true, true,
    true, true, false, true, true, true, true,
  ];

  const ratingColors: Record<string, string> = {
    excellent: Colors.success,
    good: Colors.primary,
    alternative: Colors.amber,
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>My Routine</Text>
        <Text style={styles.subtitle}>Personalized skincare steps</Text>
      </View>

      {/* AM/PM Toggle */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'morning' ? styles.tabActive : undefined]}
          onPress={() => setActiveTab('morning')}
        >
          <LinearGradient
            colors={activeTab === 'morning' ? Gradients.morning : [Colors.white, Colors.white]}
            style={styles.tabGradient}
          >
            <Ionicons name="sunny" size={20} color={activeTab === 'morning' ? Colors.white : Colors.gray400} />
            <Text style={[styles.tabText, activeTab === 'morning' ? styles.tabTextActive : undefined]}>Morning</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'evening' ? styles.tabActive : undefined]}
          onPress={() => setActiveTab('evening')}
        >
          <LinearGradient
            colors={activeTab === 'evening' ? Gradients.evening : [Colors.white, Colors.white]}
            style={styles.tabGradient}
          >
            <Ionicons name="moon" size={20} color={activeTab === 'evening' ? Colors.white : Colors.gray400} />
            <Text style={[styles.tabText, activeTab === 'evening' ? styles.tabTextActive : undefined]}>Evening</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Info Tip */}
      <View style={styles.infoTip}>
        <Ionicons name="sparkles" size={14} color={Colors.primary} />
        <Text style={styles.infoTipText}>
          Tap ✨ to get an AI product recommendation for each step
        </Text>
      </View>

      {/* Routine Steps */}
      <View style={styles.section}>
        {routine.map((step, index) => (
          <Card key={index} style={styles.stepCard}>
            <View style={styles.stepRow}>
              {/* AI Recommend Button */}
              <TouchableOpacity
                style={styles.aiButton}
                onPress={() => handleRecommend(step)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['rgba(14,165,233,0.12)', 'rgba(139,92,246,0.12)']}
                  style={styles.aiButtonGradient}
                >
                  <Ionicons name="sparkles" size={16} color="#8B5CF6" />
                </LinearGradient>
                <View style={styles.aiDot} />
              </TouchableOpacity>

              <View style={styles.stepOrder}>
                <Text style={styles.stepOrderText}>{step.order}</Text>
              </View>
              <View style={styles.stepInfo}>
                <Text style={styles.stepName}>{step.name}</Text>
                <View style={styles.stepMeta}>
                  <Badge text={step.type} variant="primary" />
                  <Text style={styles.stepDuration}>
                    <Ionicons name="time-outline" size={12} color={Colors.gray400} /> {step.duration}
                  </Text>
                </View>
              </View>
              <Ionicons name={step.icon as any} size={24} color={Colors.gray400} />
            </View>
          </Card>
        ))}
      </View>

      {/* Pro Tips */}
      <View style={styles.section}>
        <Card style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb-outline" size={20} color={Colors.amber} />
            <Text style={styles.tipsTitle}>Pro Tips</Text>
          </View>
          <Text style={styles.tipsText}>
            Always wait 30 seconds between applying serums for better absorption. Apply products from thinnest to thickest consistency.
          </Text>
        </Card>
      </View>

      {/* Routine Reminders */}
      <View style={styles.section}>
        <RoutineReminderCard />
      </View>

      {/* 14-Day Streak */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>14-Day Streak</Text>
        <Card style={styles.streakCard}>
          <View style={styles.streakGrid}>
            {streakDays.map((done, index) => (
              <View
                key={index}
                style={[
                  styles.streakDay,
                  done ? styles.streakDayDone : styles.streakDayMissed,
                ]}
              >
                {done ? (
                  <Ionicons name="checkmark" size={14} color={Colors.white} />
                ) : (
                  <Ionicons name="close" size={14} color={Colors.error} />
                )}
              </View>
            ))}
          </View>
          <Text style={styles.streakText}>10/14 days completed</Text>
        </Card>
      </View>

      <View style={{ height: 30 }} />

      {/* ═══ AI Product Recommendation Modal ═══ */}
      <Modal
        visible={showRecommendModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRecommendModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Top accent bar */}
            <LinearGradient
              colors={['#0EA5E9', '#8B5CF6', '#EC4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.modalAccentBar}
            />

            {/* Close */}
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowRecommendModal(false)}
            >
              <Ionicons name="close" size={22} color={Colors.gray400} />
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false} style={{ padding: Spacing.xl }}>
              {recommendLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={styles.loadingTitle}>Recherche IA en cours...</Text>
                  <Text style={styles.loadingSubtitle}>
                    Analyse pour {recommendStepName}
                  </Text>
                </View>
              ) : recommendation ? (
                <>
                  {/* Header */}
                  <View style={styles.modalHeader}>
                    <View style={styles.modalHeaderIcon}>
                      <Ionicons name="sparkles" size={22} color="#0EA5E9" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalTitle}>Produit Recommandé</Text>
                      <Text style={styles.modalSubtitle}>
                        Basé sur votre profil et les articles dermatologiques
                      </Text>
                    </View>
                  </View>

                  {/* Product Info */}
                  <View style={styles.productCard}>
                    <Text style={styles.productBrand}>{recommendation.brand}</Text>
                    <Text style={styles.productName}>{recommendation.productName}</Text>
                    <Text style={styles.productDesc}>{recommendation.description}</Text>

                    {/* Rating Badge */}
                    <View style={[styles.ratingBadge, { borderColor: ratingColors[recommendation.rating] || Colors.primary }]}>
                      <Ionicons
                        name={recommendation.rating === 'excellent' ? 'shield-checkmark' : 'star'}
                        size={14}
                        color={ratingColors[recommendation.rating] || Colors.primary}
                      />
                      <Text style={[styles.ratingText, { color: ratingColors[recommendation.rating] || Colors.primary }]}>
                        {recommendation.rating === 'excellent' ? 'Excellent' : recommendation.rating === 'good' ? 'Bon choix' : 'Alternative'}
                      </Text>
                    </View>

                    {/* Price */}
                    <Text style={styles.priceText}>{recommendation.estimatedPrice}</Text>

                    {/* Key Ingredients */}
                    {recommendation.keyIngredients?.length > 0 && (
                      <View style={styles.ingredientsContainer}>
                        <Text style={styles.ingredientsLabel}>Ingrédients clés</Text>
                        <View style={styles.ingredientsList}>
                          {recommendation.keyIngredients.map((ing, i) => (
                            <View key={i} style={styles.ingredientTag}>
                              <Text style={styles.ingredientText}>{ing}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Why Recommended */}
                  <View style={styles.whyCard}>
                    <View style={styles.whyHeader}>
                      <Ionicons name="shield-checkmark" size={16} color={Colors.success} />
                      <Text style={styles.whyTitle}>Pourquoi ce produit ?</Text>
                    </View>
                    <Text style={styles.whyText}>{recommendation.whyRecommended}</Text>
                  </View>

                  {/* QR Code */}
                  {recommendation.qrCodeDataUrl ? (
                    <View style={styles.qrContainer}>
                      <View style={styles.qrHeader}>
                        <Ionicons name="qr-code-outline" size={16} color="#0EA5E9" />
                        <Text style={styles.qrLabel}>Scannez pour acheter</Text>
                      </View>
                      <View style={styles.qrImageWrapper}>
                        <Image
                          source={{ uri: recommendation.qrCodeDataUrl }}
                          style={styles.qrImage}
                          resizeMode="contain"
                        />
                      </View>
                      <Text style={styles.qrHint}>
                        📱 Scannez ce code avec votre téléphone
                      </Text>
                    </View>
                  ) : null}

                  {/* CTA Button */}
                  <TouchableOpacity
                    style={styles.ctaButton}
                    onPress={() => Linking.openURL(recommendation.purchaseUrl)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#0EA5E9', '#8B5CF6']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.ctaGradient}
                    >
                      <Ionicons name="bag-handle-outline" size={18} color={Colors.white} />
                      <Text style={styles.ctaText}>Acheter maintenant</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Disclaimer */}
                  <Text style={styles.disclaimer}>
                    🤖 Recommandation IA — consultez un professionnel pour des cas spécifiques
                  </Text>
                </>
              ) : (
                <View style={styles.loadingContainer}>
                  <Ionicons name="alert-circle-outline" size={40} color={Colors.gray400} />
                  <Text style={styles.loadingTitle}>Impossible de charger</Text>
                  <Text style={styles.loadingSubtitle}>Veuillez réessayer plus tard</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray50 },
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },
  title: { fontSize: FontSizes['2xl'], fontWeight: FontWeights.bold, color: Colors.gray900 },
  subtitle: { fontSize: FontSizes.sm, color: Colors.gray500, marginTop: Spacing.xs },
  tabContainer: { flexDirection: 'row', gap: Spacing.md, paddingHorizontal: Spacing.xl, marginTop: Spacing.xl },
  tab: { flex: 1, borderRadius: BorderRadius.base, overflow: 'hidden' },
  tabActive: {},
  tabGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: Spacing.md, borderRadius: BorderRadius.base,
  },
  tabText: { fontSize: FontSizes.base, fontWeight: FontWeights.semibold, color: Colors.gray400 },
  tabTextActive: { color: Colors.white },
  infoTip: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginHorizontal: Spacing.xl, marginTop: Spacing.md,
    padding: Spacing.sm, paddingHorizontal: Spacing.md,
    backgroundColor: 'rgba(14,165,233,0.05)',
    borderRadius: BorderRadius.base,
    borderWidth: 1,
    borderColor: 'rgba(14,165,233,0.1)',
  },
  infoTipText: { fontSize: FontSizes.xs, color: Colors.primary },
  section: { paddingHorizontal: Spacing.xl, marginTop: Spacing.xl },
  sectionTitle: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.gray900, marginBottom: Spacing.base },
  stepCard: { marginBottom: Spacing.md, padding: Spacing.base },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  aiButton: { position: 'relative' },
  aiButtonGradient: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)',
  },
  aiDot: {
    position: 'absolute', top: -2, right: -2,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#8B5CF6',
  },
  stepOrder: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.primaryAlpha10, alignItems: 'center', justifyContent: 'center',
  },
  stepOrderText: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold, color: Colors.primary },
  stepInfo: { flex: 1 },
  stepName: { fontSize: FontSizes.base, fontWeight: FontWeights.medium, color: Colors.gray900, marginBottom: Spacing.xs },
  stepMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  stepDuration: { fontSize: FontSizes.xs, color: Colors.gray400 },
  tipsCard: { backgroundColor: Colors.warningAlpha10, borderColor: Colors.amber },
  tipsHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  tipsTitle: { fontSize: FontSizes.base, fontWeight: FontWeights.bold, color: Colors.amber },
  tipsText: { fontSize: FontSizes.sm, color: Colors.gray700, lineHeight: 20 },
  streakCard: { padding: Spacing.xl, alignItems: 'center' },
  streakGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, justifyContent: 'center', marginBottom: Spacing.md },
  streakDay: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  streakDayDone: { backgroundColor: Colors.success },
  streakDayMissed: { backgroundColor: Colors.errorAlpha10 },
  streakText: { fontSize: FontSizes.sm, color: Colors.gray500, fontWeight: FontWeights.medium },

  // Modal styles
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    maxHeight: '90%', overflow: 'hidden',
  },
  modalAccentBar: { height: 4, width: '100%' },
  modalCloseBtn: {
    position: 'absolute', top: Spacing.md, right: Spacing.md, zIndex: 10,
    padding: Spacing.sm, borderRadius: 12, backgroundColor: Colors.gray50,
  },
  loadingContainer: { alignItems: 'center', paddingVertical: 60 },
  loadingTitle: { fontSize: FontSizes.base, fontWeight: FontWeights.semibold, color: Colors.gray900, marginTop: Spacing.md },
  loadingSubtitle: { fontSize: FontSizes.sm, color: Colors.gray500, marginTop: Spacing.xs },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, marginBottom: Spacing.xl },
  modalHeaderIcon: {
    width: 44, height: 44, borderRadius: 16,
    backgroundColor: 'rgba(14,165,233,0.1)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(14,165,233,0.2)',
  },
  modalTitle: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.gray900 },
  modalSubtitle: { fontSize: FontSizes.xs, color: Colors.gray500, marginTop: 2 },
  productCard: {
    backgroundColor: Colors.gray50, borderRadius: 16, padding: Spacing.xl,
    borderWidth: 1, borderColor: Colors.gray200, marginBottom: Spacing.md,
  },
  productBrand: { fontSize: FontSizes.xs, fontWeight: FontWeights.bold, color: '#8B5CF6', textTransform: 'uppercase', letterSpacing: 1 },
  productName: { fontSize: FontSizes.base, fontWeight: FontWeights.bold, color: Colors.gray900, marginTop: 4, marginBottom: 8 },
  productDesc: { fontSize: FontSizes.sm, color: Colors.gray600, lineHeight: 20, marginBottom: Spacing.md },
  ratingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1, marginBottom: Spacing.sm,
  },
  ratingText: { fontSize: FontSizes.xs, fontWeight: FontWeights.semibold, textTransform: 'uppercase' },
  priceText: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.gray900, marginBottom: Spacing.md },
  ingredientsContainer: { marginTop: Spacing.sm },
  ingredientsLabel: { fontSize: FontSizes.xs, fontWeight: FontWeights.semibold, color: Colors.gray600, marginBottom: Spacing.sm, textTransform: 'uppercase' },
  ingredientsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  ingredientTag: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    backgroundColor: 'rgba(139,92,246,0.08)',
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.15)',
  },
  ingredientText: { fontSize: FontSizes.xs, fontWeight: FontWeights.medium, color: '#7c3aed' },
  whyCard: {
    backgroundColor: 'rgba(16,185,129,0.08)', borderRadius: 16,
    padding: Spacing.xl, borderWidth: 1, borderColor: 'rgba(16,185,129,0.25)',
    marginBottom: Spacing.md,
  },
  whyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.sm },
  whyTitle: { fontSize: FontSizes.sm, fontWeight: FontWeights.semibold, color: Colors.success },
  whyText: { fontSize: FontSizes.sm, color: Colors.gray700, lineHeight: 20 },
  qrContainer: {
    alignItems: 'center', borderRadius: 16, padding: Spacing.xl,
    backgroundColor: 'rgba(14,165,233,0.04)',
    borderWidth: 1, borderColor: 'rgba(14,165,233,0.12)',
    marginBottom: Spacing.md,
  },
  qrHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.md },
  qrLabel: { fontSize: FontSizes.xs, fontWeight: FontWeights.semibold, color: Colors.gray700, textTransform: 'uppercase' },
  qrImageWrapper: {
    padding: 12, backgroundColor: Colors.white, borderRadius: 16,
    ...Shadows.md,
  },
  qrImage: { width: 180, height: 180 },
  qrHint: { fontSize: FontSizes.xs, color: Colors.gray400, marginTop: Spacing.md, textAlign: 'center' },
  ctaButton: { borderRadius: 14, overflow: 'hidden', marginBottom: Spacing.md },
  ctaGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14,
  },
  ctaText: { fontSize: FontSizes.base, fontWeight: FontWeights.semibold, color: Colors.white },
  disclaimer: { fontSize: 10, color: Colors.gray400, textAlign: 'center', marginBottom: Spacing.xl },

  reminderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.sm, backgroundColor: Colors.white, borderRadius: BorderRadius.base, borderWidth: 1, borderColor: Colors.gray200 },
  reminderInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  reminderIcon: { padding: Spacing.sm, borderRadius: BorderRadius.base, backgroundColor: Colors.gray100 },
  reminderLabel: { fontSize: FontSizes.sm, fontWeight: FontWeights.semibold, color: Colors.gray900 },
  reminderTime: { fontSize: FontSizes.xs, color: Colors.gray500, padding: 0, margin: 0 },
});
