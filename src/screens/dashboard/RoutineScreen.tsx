import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  Linking,
  ActivityIndicator,
  Switch,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import { Card, Badge, Button, LoadingSpinner, EmptyState, ShareRoutineModal, PredictiveRoutineModal, PredictiveRoutineCard } from '../../components';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights, Shadows } from '../../theme';
import { useAccessibilityStyles } from '../../stores/useAccessibilityStyles';
import { routineService } from '../../services/routine.service';
import { predictiveRoutineService } from '../../services/predictive-routine.service';
import { usersService } from '../../services/users.service';
import type {
  ProductRecommendation,
  Routine,
  RoutineStep,
  AIAdviceResponse,
  PredictiveRoutine,
} from '../../lib/types';
import { useTranslation } from '../../lib/i18n';

interface StepItem {
  id: string;
  name: string;
  category: string;
  description: string;
  duration: number;
  completed: boolean;
  order: number;
}

interface FaceZone {
  id: string;
  label: string;
  description: string;
  categories: string[];
  top: string;
  left: string;
}

interface ZoneContext {
  id: string;
  label: string;
  description: string;
  matchedStepName: string | null;
}

const FACE_ZONES: FaceZone[] = [
  {
    id: 'forehead',
    label: 'Front',
    description: 'Zone souvent concernee par sebum et deshydratation.',
    categories: ['cleanser', 'toner', 'serum', 'sunscreen'],
    top: '16%',
    left: '46%',
  },
  {
    id: 'left_cheek',
    label: 'Joue gauche',
    description: 'Prioriser hydratation et uniformite du teint.',
    categories: ['serum', 'moisturizer', 'night_cream', 'mask'],
    top: '40%',
    left: '28%',
  },
  {
    id: 'right_cheek',
    label: 'Joue droite',
    description: 'Appliquer en couches fines pour eviter la surcharge.',
    categories: ['serum', 'moisturizer', 'night_cream', 'mask'],
    top: '40%',
    left: '64%',
  },
  {
    id: 'nose',
    label: 'Nez',
    description: 'Zone frequemment mixte, nettoyant doux recommande.',
    categories: ['cleanser', 'exfoliator', 'toner'],
    top: '44%',
    left: '47%',
  },
  {
    id: 'chin',
    label: 'Menton',
    description: 'Zone sensible aux imperfections hormonales.',
    categories: ['cleanser', 'serum', 'spot_treatment'],
    top: '64%',
    left: '47%',
  },
];

function mapRoutineSteps(steps: RoutineStep[], fallbackName: string): StepItem[] {
  return (steps || []).map((step, index) => ({
    id: step.id || `step-${index}-${Date.now()}`,
    name: step.productName || step.name || `${fallbackName} ${index + 1}`,
    category: step.category || 'treatment',
    description: step.description || step.notes || '',
    duration: typeof step.duration === 'string' ? parseInt(step.duration, 10) || 30 : step.duration || 30,
    completed: step.completed || step.isCompleted || false,
    order: step.order ?? index + 1,
  }));
}

function getStepIcon(category?: string): keyof typeof Ionicons.glyphMap {
  const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
    cleanser: 'water-outline',
    serum: 'flask-outline',
    moisturizer: 'water-outline',
    sunscreen: 'sunny-outline',
    makeup_remover: 'water-outline',
    night_cream: 'moon-outline',
    toner: 'color-fill-outline',
    mask: 'happy-outline',
    eye_cream: 'eye-outline',
    exfoliator: 'sparkles-outline',
    treatment: 'medkit-outline',
  };
  return icons[category || ''] || 'ellipse-outline';
}

function getStepAccentColor(category?: string): string {
  const colors: Record<string, string> = {
    cleanser: Colors.primary,
    serum: Colors.purple,
    moisturizer: Colors.teal,
    sunscreen: Colors.amber,
    makeup_remover: Colors.info,
    night_cream: Colors.indigo,
    toner: Colors.pink,
    mask: Colors.success,
    eye_cream: Colors.gold,
    exfoliator: Colors.error,
    treatment: Colors.primary,
  };
  return colors[category || ''] || Colors.gray500;
}

function formatDuration(seconds: number): string {
  if (seconds >= 60) {
    return `${Math.round(seconds / 60)} min`;
  }
  return `${seconds} sec`;
}

function RoutineReminderCard({
  reminders,
  setReminders,
}: {
  reminders: {
    morningEnabled: boolean;
    morningTime: string;
    eveningEnabled: boolean;
    eveningTime: string;
  };
  setReminders: (reminders: {
    morningEnabled: boolean;
    morningTime: string;
    eveningEnabled: boolean;
    eveningTime: string;
  }) => void;
}) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);

  const saveReminders = async (next: typeof reminders) => {
    setReminders(next);
    setSaving(true);
    try {
      const user = await usersService.getMe();
      await usersService.updateMe({
        settings: {
          ...user.settings,
          reminders: next,
        },
      });
    } catch {
      Alert.alert('Erreur', 'Impossible de mettre a jour les rappels.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card style={styles.infoCard}>
      <View style={styles.infoHeader}>
        <Ionicons name="notifications-outline" size={18} color={Colors.primary} />
        <Text style={styles.infoTitle}>{t.routine.reminders || 'Rappels routine'}</Text>
      </View>

      <View style={styles.reminderRow}>
        <View style={styles.reminderLeft}>
          <Ionicons name="sunny" size={16} color={Colors.primary} />
          <Text style={styles.reminderLabel}>{t.routine.morning || 'Matin'}</Text>
        </View>
        <TextInput
          value={reminders.morningTime}
          onChangeText={(value) => setReminders({ ...reminders, morningTime: value })}
          onEndEditing={() => saveReminders(reminders)}
          style={styles.reminderInput}
          editable={reminders.morningEnabled}
        />
        <Switch
          value={reminders.morningEnabled}
          onValueChange={(value) => saveReminders({ ...reminders, morningEnabled: value })}
          trackColor={{ false: Colors.gray300, true: Colors.primary }}
        />
      </View>

      <View style={styles.reminderRow}>
        <View style={styles.reminderLeft}>
          <Ionicons name="moon" size={16} color={Colors.indigo} />
          <Text style={styles.reminderLabel}>{t.routine.evening || 'Soir'}</Text>
        </View>
        <TextInput
          value={reminders.eveningTime}
          onChangeText={(value) => setReminders({ ...reminders, eveningTime: value })}
          onEndEditing={() => saveReminders(reminders)}
          style={styles.reminderInput}
          editable={reminders.eveningEnabled}
        />
        <Switch
          value={reminders.eveningEnabled}
          onValueChange={(value) => saveReminders({ ...reminders, eveningEnabled: value })}
          trackColor={{ false: Colors.gray300, true: Colors.indigo }}
        />
      </View>

      {saving ? <Text style={styles.savingText}>{t.routine.saving || 'Enregistrement...'}</Text> : null}
    </Card>
  );
}

export function RoutineScreen() {
  const { colors, fontSizes } = useAccessibilityStyles();
  const { t, interpolate } = useTranslation();

  const [activeTab, setActiveTab] = useState<'am' | 'pm'>('am');
  const [show3D, setShow3D] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [amRoutine, setAmRoutine] = useState<Routine | null>(null);
  const [pmRoutine, setPmRoutine] = useState<Routine | null>(null);
  const [amSteps, setAmSteps] = useState<StepItem[]>([]);
  const [pmSteps, setPmSteps] = useState<StepItem[]>([]);

  const [showAdvice, setShowAdvice] = useState(false);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [advice, setAdvice] = useState<AIAdviceResponse | null>(null);

  const [showRecommendModal, setShowRecommendModal] = useState(false);
  const [recommendLoading, setRecommendLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<ProductRecommendation | null>(null);
  const [recommendStepName, setRecommendStepName] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [addName, setAddName] = useState('');
  const [addCategory, setAddCategory] = useState('serum');
  const [addDuration, setAddDuration] = useState('30');
  const [addDescription, setAddDescription] = useState('');

  const [showShareModal, setShowShareModal] = useState(false);
  const [shareRoutine, setShareRoutine] = useState<Routine | null>(null);

  const [highlightedStep, setHighlightedStep] = useState<string | null>(null);
  const [highlightedZone, setHighlightedZone] = useState<string | null>(null);
  const [zoneContext, setZoneContext] = useState<ZoneContext | null>(null);

  const [reminders, setReminders] = useState({
    morningEnabled: false,
    morningTime: '08:00',
    eveningEnabled: false,
    eveningTime: '21:00',
  });

  // Predictive Routine State
  const [pendingPredictiveRoutines, setPendingPredictiveRoutines] = useState<PredictiveRoutine[]>([]);
  const [selectedPredictiveRoutine, setSelectedPredictiveRoutine] = useState<PredictiveRoutine | null>(null);
  const [showPredictiveModal, setShowPredictiveModal] = useState(false);

  const currentRoutine = activeTab === 'am' ? amRoutine : pmRoutine;
  const currentSteps = activeTab === 'am' ? amSteps : pmSteps;
  const setCurrentSteps = activeTab === 'am' ? setAmSteps : setPmSteps;

  const completedCount = currentSteps.filter((step) => step.completed).length;
  const completionRate = currentSteps.length > 0 ? Math.round((completedCount / currentSteps.length) * 100) : 0;
  const totalDuration = currentSteps.reduce((sum, step) => sum + (Number(step.duration) || 0), 0);

  const dynamicStyles = useMemo(
    () => ({
      safeArea: { flex: 1, backgroundColor: colors.background },
      container: { flex: 1, backgroundColor: colors.backgroundSecondary },
      title: { fontSize: fontSizes['2xl'], fontWeight: FontWeights.bold, color: colors.text },
      subtitle: { fontSize: fontSizes.sm, color: colors.textSecondary, marginTop: Spacing.xs },
      tabText: { fontSize: fontSizes.sm, fontWeight: FontWeights.semibold, color: colors.textTertiary },
      tabTextActive: { color: Colors.white },
      stepName: { fontSize: fontSizes.base, color: colors.text, fontWeight: FontWeights.semibold },
      stepDescription: { fontSize: fontSizes.xs, color: colors.textSecondary, marginTop: 2 },
      statValue: { fontSize: fontSizes.lg, color: colors.text, fontWeight: FontWeights.bold },
      statLabel: { fontSize: fontSizes.xs, color: colors.textSecondary },
    }),
    [colors, fontSizes]
  );

  const loadRoutines = useCallback(async () => {
    try {
      const routines = await routineService.getAll({ isActive: true });
      const am = routines.find((routine) => String(routine.type).toUpperCase() === 'AM') || null;
      const pm = routines.find((routine) => String(routine.type).toUpperCase() === 'PM') || null;

      setAmRoutine(am);
      setPmRoutine(pm);
      setAmSteps(am ? mapRoutineSteps(am.steps || [], t.routine.step || 'Etape') : []);
      setPmSteps(pm ? mapRoutineSteps(pm.steps || [], t.routine.step || 'Etape') : []);
    } catch {
      Alert.alert('Erreur', 'Impossible de charger les routines.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t.routine.step]);

  const loadReminders = useCallback(async () => {
    try {
      const user = await usersService.getMe();
      if (user.settings?.reminders) {
        setReminders(user.settings.reminders);
      }
    } catch {
      // ignore
    }
  }, []);

  // Load pending predictive routines
  const loadPendingPredictiveRoutines = useCallback(async () => {
    try {
      const pending = await predictiveRoutineService.getPending();
      setPendingPredictiveRoutines(pending);
    } catch (error) {
      console.error('Error loading pending predictive routines:', error);
    }
  }, []);

  useEffect(() => {
    loadRoutines();
    loadReminders();
    loadPendingPredictiveRoutines();
  }, [loadRoutines, loadReminders, loadPendingPredictiveRoutines]);

  const onRefresh = () => {
    setRefreshing(true);
    loadRoutines();
    loadPendingPredictiveRoutines();
  };

  // Predictive Routine Handlers
  const handleViewPredictiveRoutine = async (routine: PredictiveRoutine) => {
    setSelectedPredictiveRoutine(routine);
    setShowPredictiveModal(true);
    
    // Mark as viewed if pending
    if (routine.status === 'PENDING') {
      try {
        await predictiveRoutineService.markAsViewed(routine.id);
        // Update local state
        setPendingPredictiveRoutines(prev => 
          prev.map(r => r.id === routine.id ? { ...r, status: 'VIEWED' as any } : r)
        );
      } catch (error) {
        console.error('Error marking routine as viewed:', error);
      }
    }
  };

  const handleAcceptPredictiveRoutine = async () => {
    if (!selectedPredictiveRoutine) return;

    try {
      await predictiveRoutineService.validateAndActivate(selectedPredictiveRoutine.id);
      
      setShowPredictiveModal(false);
      setSelectedPredictiveRoutine(null);
      
      // Remove from pending list
      setPendingPredictiveRoutines(prev => 
        prev.filter(r => r.id !== selectedPredictiveRoutine.id)
      );
      
      // Reload routines
      await loadRoutines();
      
      Alert.alert(
        '✅ Routine activée !',
        'Votre routine personnalisée IA a été créée et est maintenant active.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Error accepting predictive routine:', error);
      Alert.alert('Erreur', 'Impossible de valider la routine. Veuillez réessayer.');
    }
  };

  const handleDismissPredictiveRoutine = async (routine?: PredictiveRoutine) => {
    const targetRoutine = routine || selectedPredictiveRoutine;
    if (!targetRoutine) return;

    try {
      await predictiveRoutineService.dismiss(targetRoutine.id);
      
      // Remove from pending list
      setPendingPredictiveRoutines(prev => 
        prev.filter(r => r.id !== targetRoutine.id)
      );
      
      if (showPredictiveModal) {
        setShowPredictiveModal(false);
        setSelectedPredictiveRoutine(null);
      }
    } catch (error) {
      console.error('Error dismissing predictive routine:', error);
    }
  };

  const persistSteps = async (next: StepItem[]) => {
    if (!currentRoutine?.id) {
      return;
    }

    try {
      const payload = next.map((step, index) => ({
        order: index + 1,
        name: step.name,
        category: step.category,
        description: step.description,
        duration: step.duration,
        completed: step.completed,
        id: step.id,
      }));
      await routineService.update(currentRoutine.id, { steps: payload as any });
      await loadRoutines();
    } catch {
      // UI keeps local ordering if update fails.
    }
  };

  const requestAdvice = useCallback(
    async (changeType: 'reorder' | 'add_step' | 'remove_step', changeDescription?: string, addedStepName?: string) => {
      if (!currentRoutine?.id) {
        return;
      }
      setShowAdvice(true);
      setAdviceLoading(true);
      setAdvice(null);

      try {
        const result = await routineService.adviseOnChange(currentRoutine.id, {
          changeType,
          currentSteps: currentSteps.map((step) => step.name),
          changeDescription,
          addedStepName,
        });
        setAdvice(result);
      } catch {
        setAdvice({
          advice: t.routine.adviceFallback || 'Routine ajustee. Continue avec des couches fines et un ordre stable.',
          rating: 'neutral',
          emoji: '✨',
        });
      } finally {
        setAdviceLoading(false);
      }
    },
    [currentRoutine?.id, currentSteps, t.routine.adviceFallback]
  );

  const handleReorder = async (newSteps: StepItem[]) => {
    const withOrder = newSteps.map((step, index) => ({ ...step, order: index + 1 }));
    setCurrentSteps(withOrder);
    await persistSteps(withOrder);
    await requestAdvice('reorder', t.routine.dragDropTip || 'Reorganisation des etapes de routine');
  };

  const handleAddStep = async () => {
    if (!addName.trim()) {
      Alert.alert('Champ requis', 'Ajoute un nom d etape.');
      return;
    }

    const nextStep: StepItem = {
      id: `custom-${Date.now()}`,
      name: addName.trim(),
      category: addCategory,
      description: addDescription.trim(),
      duration: Math.max(10, parseInt(addDuration, 10) || 30),
      completed: false,
      order: currentSteps.length + 1,
    };

    const next = [...currentSteps, nextStep];
    setCurrentSteps(next);
    setShowAddModal(false);
    setAddName('');
    setAddDescription('');
    setAddDuration('30');

    await persistSteps(next);
    await requestAdvice('add_step', `Ajout de ${nextStep.name}`, nextStep.name);
  };

  const handleRemoveStep = async (stepId: string) => {
    const removed = currentSteps.find((step) => step.id === stepId);
    const next = currentSteps
      .filter((step) => step.id !== stepId)
      .map((step, index) => ({ ...step, order: index + 1 }));

    setCurrentSteps(next);
    await persistSteps(next);
    await requestAdvice('remove_step', removed ? `Suppression de ${removed.name}` : 'Suppression etape');
  };

  const handleCompleteStep = async (stepId: string) => {
    const selected = currentSteps.find((step) => step.id === stepId);
    if (!selected) {
      return;
    }

    const nextExpected = [...currentSteps]
      .filter((step) => !step.completed)
      .sort((a, b) => a.order - b.order)[0];

    const isOutOfOrder = !!nextExpected && nextExpected.id !== selected.id;
    const next = currentSteps.map((step) => (step.id === stepId ? { ...step, completed: true } : step));
    setCurrentSteps(next);

    try {
      if (currentRoutine?.id) {
        await routineService.completeStep(currentRoutine.id, selected.order);
        await loadRoutines();
      }
    } catch {
      // keep local completion state
    }

    if (isOutOfOrder && nextExpected) {
      await requestAdvice(
        'reorder',
        `L etape ${selected.name} a ete completee avant ${nextExpected.name}`
      );
    }
  };

  const handleGenerateRoutine = async () => {
    setGenerating(true);
    try {
      const routineType = activeTab === 'am' ? 'AM' : 'PM';
      await routineService.generateAI({ type: routineType });
      await loadRoutines();
      Alert.alert('Succes', 'Routine IA generee.');
    } catch {
      Alert.alert('Erreur', 'Impossible de generer la routine IA.');
    } finally {
      setGenerating(false);
    }
  };

  const handleRecommend = async (step: StepItem) => {
    setRecommendStepName(step.name);
    setRecommendLoading(true);
    setRecommendation(null);
    setShowRecommendModal(true);

    try {
      const result = await routineService.recommendProduct({
        stepName: step.name,
        stepCategory: step.category,
        stepDescription: step.description || undefined,
      });
      setRecommendation(result);
    } catch {
      setRecommendation(null);
    } finally {
      setRecommendLoading(false);
    }
  };

  const handleZonePress = (zone: FaceZone) => {
    setHighlightedZone(zone.id);
    const linked = currentSteps.find((step) => zone.categories.includes(step.category));

    if (linked) {
      setHighlightedStep(linked.id);
    }

    setZoneContext({
      id: zone.id,
      label: zone.label,
      description: zone.description,
      matchedStepName: linked?.name || null,
    });
  };

  const handleShareRoutine = async (message?: string, image?: string) => {
    if (!shareRoutine?.id) {
      return;
    }
    await routineService.shareRoutine(shareRoutine.id, {
      customMessage: message,
      coverImage: image,
    });
  };

  const renderStepItem = ({ item, drag, isActive }: RenderItemParams<StepItem>) => (
    <ScaleDecorator>
      <Card style={[styles.stepCard, isActive && styles.stepCardActive, highlightedStep === item.id && styles.stepCardHighlighted] as any}>
        <TouchableOpacity
          onLongPress={drag}
          delayLongPress={130}
          activeOpacity={0.9}
          style={styles.stepCardInner}
          accessibilityRole="button"
          accessibilityLabel={`Drag ${item.name}`}
        >
          <View style={styles.stepOrder}>
            <Text style={styles.stepOrderText}>{item.order}</Text>
          </View>

          <View style={[styles.stepIconBadge, { backgroundColor: `${getStepAccentColor(item.category)}15` }]}>
            <Ionicons name={getStepIcon(item.category)} size={16} color={getStepAccentColor(item.category)} />
          </View>

          <View style={styles.stepInfo}>
            <Text style={dynamicStyles.stepName}>{item.name}</Text>
            <Text style={dynamicStyles.stepDescription} numberOfLines={2}>
              {item.description || 'Aucune description'}
            </Text>
            <View style={styles.stepMetaRow}>
              <Badge text={item.category} variant="primary" />
              <Text style={styles.stepMetaText}>{formatDuration(item.duration)}</Text>
            </View>
          </View>

          <View style={styles.stepActions}>
            <TouchableOpacity style={styles.iconButton} onPress={() => handleRecommend(item)}>
              <Ionicons name="sparkles" size={16} color={Colors.indigo} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconButton, item.completed && styles.iconButtonDone]}
              onPress={() => handleCompleteStep(item.id)}
            >
              <Ionicons name={item.completed ? 'checkmark-circle' : 'checkmark-circle-outline'} size={18} color={item.completed ? Colors.success : Colors.gray500} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => handleRemoveStep(item.id)}>
              <Ionicons name="trash-outline" size={16} color={Colors.error} />
            </TouchableOpacity>
            <Ionicons name="reorder-four-outline" size={18} color={Colors.gray400} style={{ marginLeft: 4 }} />
          </View>
        </TouchableOpacity>
      </Card>
    </ScaleDecorator>
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.backgroundSecondary }} edges={['left', 'right', 'bottom']}>
        <LoadingSpinner message={t.routine.loading || 'Chargement...'} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={dynamicStyles.safeArea} edges={['left', 'right', 'bottom']}>
      <ScrollView
        style={dynamicStyles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={dynamicStyles.title}>{t.routine.title || 'Routine'}</Text>
          <Text style={dynamicStyles.subtitle}>{t.routine.subtitle || 'Votre routine complete avec assistance IA'}</Text>
        </View>

        {/* 🆕 Predictive Routine Banner */}
        {pendingPredictiveRoutines.length > 0 && (
          <View style={{ paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm }}>
            <PredictiveRoutineCard
              routine={pendingPredictiveRoutines[0]}
              onPress={() => handleViewPredictiveRoutine(pendingPredictiveRoutines[0])}
              onDismiss={() => handleDismissPredictiveRoutine(pendingPredictiveRoutines[0])}
              compact={true}
            />
          </View>
        )}

        <View style={styles.topActions}>
          <TouchableOpacity
            style={[styles.topButton, show3D && styles.topButtonActive]}
            onPress={() => setShow3D((value) => !value)}
          >
            <Ionicons name={show3D ? 'cube' : 'list'} size={16} color={show3D ? Colors.primary : Colors.gray500} />
            <Text style={[styles.topButtonText, show3D && styles.topButtonTextActive]}>{show3D ? '3D actif' : 'Liste'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.topButton}
            onPress={() => {
              if (currentRoutine) {
                setShareRoutine(currentRoutine);
                setShowShareModal(true);
              } else {
                Alert.alert('Info', 'Generez une routine avant partage.');
              }
            }}
          >
            <Ionicons name="share-social-outline" size={16} color={Colors.gray600} />
            <Text style={styles.topButtonText}>Partager</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.topButton} onPress={() => setShowAddModal(true)}>
            <Ionicons name="add" size={16} color={Colors.gray600} />
            <Text style={styles.topButtonText}>{'Ajouter'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'am' && styles.tabActive]}
            onPress={() => setActiveTab('am')}
          >
            <LinearGradient
              colors={activeTab === 'am' ? ['#0EA5E9', '#06B6D4'] : [Colors.white, Colors.white]}
              style={styles.tabGradient}
            >
              <Ionicons name="sunny" size={18} color={activeTab === 'am' ? Colors.white : Colors.gray500} />
              <Text style={[dynamicStyles.tabText, activeTab === 'am' && dynamicStyles.tabTextActive]}>{t.routine.morningRoutine || 'Routine matin'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'pm' && styles.tabActive]}
            onPress={() => setActiveTab('pm')}
          >
            <LinearGradient
              colors={activeTab === 'pm' ? ['#0284C7', '#06B6D4'] : [Colors.white, Colors.white]}
              style={styles.tabGradient}
            >
              <Ionicons name="moon" size={18} color={activeTab === 'pm' ? Colors.white : Colors.gray500} />
              <Text style={[dynamicStyles.tabText, activeTab === 'pm' && dynamicStyles.tabTextActive]}>{t.routine.eveningRoutine || 'Routine soir'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {!currentRoutine ? (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon="sparkles-outline"
              title={activeTab === 'am' ? (t.routine.noRoutineMorning || 'Aucune routine matin') : (t.routine.noRoutineEvening || 'Aucune routine soir')}
              description={t.routine.generateRoutineAI || 'Generez une routine IA personnalisee'}
            />
            <Button onPress={handleGenerateRoutine} disabled={generating}>
              {generating ? (t.routine.generating || 'Generation...') : (t.routine.generateAI || 'Generer IA')}
            </Button>
          </View>
        ) : (
          <>
            <View style={styles.statsGrid}>
              <Card style={styles.statCard}>
                <Text style={dynamicStyles.statValue}>{currentSteps.length}</Text>
                <Text style={dynamicStyles.statLabel}>{t.routine.steps || 'Etapes'}</Text>
              </Card>
              <Card style={styles.statCard}>
                <Text style={dynamicStyles.statValue}>{formatDuration(totalDuration)}</Text>
                <Text style={dynamicStyles.statLabel}>{'Duree'}</Text>
              </Card>
              <Card style={styles.statCard}>
                <Text style={dynamicStyles.statValue}>{completionRate}%</Text>
                <Text style={dynamicStyles.statLabel}>{'Progression'}</Text>
              </Card>
            </View>

            <View style={styles.infoTip}>
              <Ionicons name="information-circle-outline" size={14} color={Colors.primary} />
              <Text style={styles.infoTipText}>{t.routine.dragDropTip || 'Appui long et glisser pour reorganiser vos etapes.'}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{activeTab === 'am' ? (t.routine.morningSteps || 'Etapes du matin') : (t.routine.eveningSteps || 'Etapes du soir')}</Text>

              <DraggableFlatList
                data={currentSteps}
                keyExtractor={(item) => item.id}
                renderItem={renderStepItem}
                onDragEnd={({ data }) => handleReorder(data)}
                scrollEnabled={false}
                animationConfig={{ damping: 20, stiffness: 180 }}
                containerStyle={styles.dragListContainer}
              />
            </View>

            {show3D ? (
              <View style={styles.section}>
                <Card style={styles.faceCard}>
                  <View style={styles.faceHeader}>
                    <Text style={styles.sectionTitle}>Avatar 3D contextuel</Text>
                    <Badge text={activeTab === 'am' ? 'AM' : 'PM'} variant="primary" />
                  </View>

                  <View style={styles.faceArea}>
                    <View style={styles.faceSilhouette}>
                      {FACE_ZONES.map((zone) => (
                        <TouchableOpacity
                          key={zone.id}
                          onPress={() => handleZonePress(zone)}
                          style={[
                            styles.zoneDot,
                            { top: zone.top as any, left: zone.left as any },
                            highlightedZone === zone.id && styles.zoneDotActive,
                          ]}
                        />
                      ))}
                    </View>
                  </View>

                  <View style={styles.zoneContextCard}>
                    {zoneContext ? (
                      <>
                        <Text style={styles.zoneTitle}>{zoneContext.label}</Text>
                        <Text style={styles.zoneDescription}>{zoneContext.description}</Text>
                        <Text style={styles.zoneLinkText}>
                          {zoneContext.matchedStepName
                            ? `Etape associee: ${zoneContext.matchedStepName}`
                            : 'Aucune etape correspondante dans la routine actuelle.'}
                        </Text>
                      </>
                    ) : (
                      <Text style={styles.zoneHint}>Touchez une zone pour afficher le contexte IA.</Text>
                    )}
                  </View>
                </Card>
              </View>
            ) : null}

            <View style={styles.section}>
              <RoutineReminderCard reminders={reminders} setReminders={setReminders} />
            </View>
          </>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      <Modal visible={showAdvice} transparent animationType="slide" onRequestClose={() => setShowAdvice(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#0EA5E9', '#8B5CF6', '#EC4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.modalAccentBar}
            />

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowAdvice(false)}
            >
              <Ionicons name="close" size={22} color={Colors.gray400} />
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false} style={{ padding: Spacing.xl }}>
              {adviceLoading ? (
                <View style={styles.centerContent}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={styles.loadingTitle}>{'Intervention IA...'}</Text>
                  <Text style={styles.loadingSubtitle}>{'Analyse des changements en cours'}</Text>
                </View>
              ) : advice ? (
                <>
                  <View style={styles.modalHeader}>
                    <View style={styles.modalHeaderIcon}>
                      <Ionicons name="sparkles" size={22} color="#0EA5E9" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalTitle}>{'Intervention IA'}</Text>
                      <Text style={styles.modalSubtitle}>{'Conseil automatique sur votre routine'}</Text>
                    </View>
                  </View>

                  <View style={styles.adviceCard}>
                    <Text style={styles.adviceEmoji}>{advice.emoji || '✨'}</Text>
                    <Text style={styles.adviceText}>{advice.advice}</Text>
                    <View style={styles.ratingPill}>
                      <Text style={styles.ratingPillText}>{advice.rating}</Text>
                    </View>
                  </View>

                  <View style={styles.whyCard}>
                    <Text style={styles.whyTitle}>{'Action conseillee'}</Text>
                    <Text style={styles.whyText}>{'Applique le conseil puis continue la routine dans l ordre recommande.'}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.ctaButton}
                    onPress={() => setShowAdvice(false)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#0EA5E9', '#8B5CF6']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.ctaGradient}
                    >
                      <Ionicons name="checkmark-circle-outline" size={18} color={Colors.white} />
                      <Text style={styles.ctaText}>{t.common.close || 'Fermer'}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.centerContent}>
                  <Ionicons name="alert-circle-outline" size={40} color={Colors.gray400} />
                  <Text style={styles.loadingTitle}>{'Aucun conseil disponible'}</Text>
                  <Text style={styles.loadingSubtitle}>{'Reessayez apres une action sur la routine.'}</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showRecommendModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRecommendModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#0EA5E9', '#8B5CF6', '#EC4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.modalAccentBar}
            />

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowRecommendModal(false)}
            >
              <Ionicons name="close" size={22} color={Colors.gray400} />
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false} style={{ padding: Spacing.xl }}>
              {recommendLoading ? (
                <View style={styles.centerContent}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={styles.loadingTitle}>{t.routine.aiSearchTitle || 'Recherche IA...'}</Text>
                  <Text style={styles.loadingSubtitle}>
                    {interpolate(t.routine.aiSearchSubtitle || 'Analyse de {step}', { step: recommendStepName })}
                  </Text>
                </View>
              ) : recommendation ? (
                <>
                  <View style={styles.modalHeader}>
                    <View style={styles.modalHeaderIcon}>
                      <Ionicons name="sparkles" size={22} color="#0EA5E9" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalTitle}>{t.routine.recommendedProduct || 'Produit recommande'}</Text>
                      <Text style={styles.modalSubtitle}>{recommendStepName}</Text>
                    </View>
                  </View>

                  <View style={styles.productCard}>
                    <Text style={styles.productBrand}>{recommendation.brand}</Text>
                    <Text style={styles.productName}>{recommendation.productName}</Text>
                    <Text style={styles.productDesc}>{recommendation.description}</Text>

                    <Text style={styles.priceText}>{recommendation.estimatedPrice}</Text>

                    {recommendation.keyIngredients?.length > 0 ? (
                      <View style={styles.ingredientsList}>
                        {recommendation.keyIngredients.map((ingredient, index) => (
                          <View key={`${ingredient}-${index}`} style={styles.ingredientTag}>
                            <Text style={styles.ingredientText}>{ingredient}</Text>
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.whyCard}>
                    <Text style={styles.whyTitle}>{t.routine.whyProduct || 'Pourquoi ce produit ?'}</Text>
                    <Text style={styles.whyText}>{recommendation.whyRecommended}</Text>
                  </View>

                  {recommendation.qrCodeDataUrl ? (
                    <View style={styles.qrContainer}>
                      <Image
                        source={{ uri: recommendation.qrCodeDataUrl }}
                        style={styles.qrImage}
                        resizeMode="contain"
                      />
                    </View>
                  ) : null}

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
                      <Text style={styles.ctaText}>{t.routine.buyNow || 'Acheter'}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.centerContent}>
                  <Ionicons name="alert-circle-outline" size={40} color={Colors.gray400} />
                  <Text style={styles.loadingTitle}>{t.routine.loadError || 'Erreur de chargement'}</Text>
                  <Text style={styles.loadingSubtitle}>{t.routine.tryAgain || 'Reessayez plus tard'}</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.overlay}>
          <BlurView intensity={24} tint="light" style={StyleSheet.absoluteFillObject} />
          <View style={styles.addModal}>
            <Text style={styles.adviceTitle}>{'Ajouter une etape'}</Text>

            <TextInput
              value={addName}
              onChangeText={setAddName}
              placeholder="Nom de l etape"
              style={styles.input}
            />
            <TextInput
              value={addCategory}
              onChangeText={setAddCategory}
              placeholder="Categorie (serum, cleanser...)"
              style={styles.input}
            />
            <TextInput
              value={addDuration}
              onChangeText={setAddDuration}
              placeholder="Duree en secondes"
              keyboardType="numeric"
              style={styles.input}
            />
            <TextInput
              value={addDescription}
              onChangeText={setAddDescription}
              placeholder="Description"
              multiline
              style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
            />

            <View style={styles.modalActions}>
              <Button variant="outline" onPress={() => setShowAddModal(false)}>
                {t.common.cancel || 'Annuler'}
              </Button>
              <Button onPress={handleAddStep}>{'Ajouter'}</Button>
            </View>
          </View>
        </View>
      </Modal>

      <ShareRoutineModal
        visible={showShareModal}
        routine={shareRoutine}
        onClose={() => {
          setShowShareModal(false);
          setShareRoutine(null);
        }}
        onShare={handleShareRoutine}
      />

      {/* 🆕 Predictive Routine Modal */}
      <PredictiveRoutineModal
        visible={showPredictiveModal}
        routine={selectedPredictiveRoutine}
        onAccept={handleAcceptPredictiveRoutine}
        onDismiss={() => handleDismissPredictiveRoutine()}
        onClose={() => {
          setShowPredictiveModal(false);
          setSelectedPredictiveRoutine(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  topActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.base,
  },
  topButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: BorderRadius.base,
    borderWidth: 1,
    borderColor: Colors.gray200,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  topButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryAlpha10,
  },
  topButtonText: {
    fontSize: FontSizes.xs,
    color: Colors.gray600,
    fontWeight: FontWeights.semibold,
  },
  topButtonTextActive: {
    color: Colors.primary,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
  },
  tab: {
    flex: 1,
    borderRadius: BorderRadius.base,
    overflow: 'hidden',
  },
  tabActive: {},
  tabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.base,
  },
  emptyContainer: {
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  infoTip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.md,
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: 'rgba(14,165,233,0.05)',
    borderRadius: BorderRadius.base,
    borderWidth: 1,
    borderColor: 'rgba(14,165,233,0.15)',
  },
  infoTipText: {
    flex: 1,
    fontSize: FontSizes.xs,
    color: Colors.gray600,
  },
  section: {
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.gray900,
    marginBottom: Spacing.sm,
  },
  dragListContainer: {
    gap: Spacing.sm,
  },
  stepCard: {
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  stepCardActive: {
    borderColor: Colors.primary,
    ...Shadows.md,
  },
  stepCardHighlighted: {
    borderColor: Colors.success,
    backgroundColor: 'rgba(16,185,129,0.06)',
  },
  stepCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  stepOrder: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primaryAlpha10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepOrderText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.primary,
  },
  stepInfo: {
    flex: 1,
  },
  stepIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  stepMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 6,
  },
  stepMetaText: {
    fontSize: FontSizes.xs,
    color: Colors.gray500,
  },
  stepActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  iconButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: Colors.gray100,
  },
  iconButtonDone: {
    backgroundColor: 'rgba(16,185,129,0.12)',
  },
  faceCard: {
    padding: Spacing.md,
  },
  faceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  faceArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
  },
  faceSilhouette: {
    width: 220,
    height: 260,
    borderRadius: 110,
    borderWidth: 1,
    borderColor: Colors.gray200,
    backgroundColor: 'rgba(14,165,233,0.05)',
    position: 'relative',
  },
  zoneDot: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  zoneDotActive: {
    backgroundColor: Colors.success,
    transform: [{ scale: 1.2 }],
  },
  zoneContextCard: {
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.base,
    borderWidth: 1,
    borderColor: Colors.gray200,
    backgroundColor: Colors.gray50,
    padding: Spacing.md,
  },
  zoneTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.gray900,
  },
  zoneDescription: {
    fontSize: FontSizes.xs,
    color: Colors.gray600,
    marginTop: 4,
  },
  zoneLinkText: {
    fontSize: FontSizes.xs,
    color: Colors.primary,
    marginTop: 8,
    fontWeight: FontWeights.medium,
  },
  zoneHint: {
    fontSize: FontSizes.xs,
    color: Colors.gray500,
  },
  infoCard: {
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  infoTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.gray900,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.gray200,
    borderRadius: BorderRadius.base,
    padding: Spacing.sm,
  },
  reminderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  reminderLabel: {
    fontSize: FontSizes.xs,
    color: Colors.gray700,
    fontWeight: FontWeights.semibold,
  },
  reminderInput: {
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: FontSizes.xs,
    color: Colors.gray800,
    minWidth: 64,
    textAlign: 'center',
    marginRight: 8,
  },
  savingText: {
    marginTop: Spacing.sm,
    fontSize: 10,
    color: Colors.gray400,
    textAlign: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  adviceModal: {
    width: '100%',
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.white,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  adviceTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.gray900,
  },
  adviceEmoji: {
    fontSize: 30,
    textAlign: 'center',
  },
  adviceText: {
    fontSize: FontSizes.sm,
    color: Colors.gray700,
    lineHeight: 22,
    textAlign: 'center',
  },
  adviceCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.gray200,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  ratingPill: {
    alignSelf: 'center',
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryAlpha10,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  ratingPillText: {
    fontSize: FontSizes.xs,
    color: Colors.primary,
    fontWeight: FontWeights.semibold,
    textTransform: 'uppercase',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 10,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: BorderRadius.base,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSizes.sm,
    color: Colors.gray800,
  },
  addModal: {
    width: '100%',
    borderRadius: BorderRadius.xl,
    backgroundColor: '#FCFCFD',
    padding: Spacing.xl,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.gray200,
    ...Shadows.sm,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  modalAccentBar: { height: 4, width: '100%' },
  modalCloseBtn: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    zIndex: 10,
    padding: Spacing.sm,
    borderRadius: 12,
    backgroundColor: Colors.gray50,
  },
  loadingTitle: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    color: Colors.gray900,
  },
  loadingSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.gray500,
    textAlign: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  modalHeaderIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(14,165,233,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(14,165,233,0.2)',
  },
  modalTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.gray900,
  },
  modalSubtitle: {
    fontSize: FontSizes.xs,
    color: Colors.gray500,
    marginTop: 2,
  },
  productCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.gray200,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  productBrand: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: '#8B5CF6',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  productName: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.gray900,
    marginTop: 4,
    marginBottom: 8,
  },
  productDesc: {
    fontSize: FontSizes.sm,
    color: Colors.gray600,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  priceText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.gray900,
    marginBottom: Spacing.md,
  },
  ingredientsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  ingredientTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(139,92,246,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.15)',
  },
  ingredientText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
    color: '#7c3aed',
  },
  whyCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.gray200,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  whyTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.success,
    marginBottom: Spacing.xs,
  },
  whyText: {
    fontSize: FontSizes.sm,
    color: Colors.gray700,
    lineHeight: 20,
  },
  qrContainer: {
    alignItems: 'center',
    borderRadius: 16,
    padding: Spacing.xl,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray200,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  qrImage: {
    width: 180,
    height: 180,
  },
  ctaButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  ctaText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    color: Colors.white,
  },
});
