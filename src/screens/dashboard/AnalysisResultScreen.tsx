import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, Button, PredictiveRoutineModal } from '../../components';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius, Shadows } from '../../theme';
import { useAccessibilityStyles } from '../../stores/useAccessibilityStyles';
import { analysisService } from '../../services/analysis.service';
import { predictiveRoutineService } from '../../services/predictive-routine.service';
import { getLocation } from '../../services/weather.service';
import type { Analysis, PredictiveRoutine } from '../../lib/types';

interface Props {
  navigation: StackNavigationProp<any>;
  route: RouteProp<any, any>;
}

export function AnalysisResultScreen({ navigation, route }: Props) {
  const { colors, fontSizes } = useAccessibilityStyles();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Predictive Routine State
  const [generatingRoutine, setGeneratingRoutine] = useState(false);
  const [predictiveRoutine, setPredictiveRoutine] = useState<PredictiveRoutine | null>(null);
  const [showRoutineModal, setShowRoutineModal] = useState(false);

  useEffect(() => {
    const loadAnalysis = async () => {
      try {
        const analysisId = route.params?.analysisId;
        if (analysisId) {
          const data = await analysisService.getById(analysisId);
          setAnalysis(data);
        } else {
          const data = await analysisService.getLatest();
          setAnalysis(data);
        }
      } catch (error) {
        console.error('Error loading analysis:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalysis();
  }, [route.params]);

  // Generate Predictive Routine
  const handleGeneratePredictiveRoutine = async () => {
    if (!analysis?.results) return;

    setGeneratingRoutine(true);
    try {
      // Get user location
      const location = await getLocation();
      
      // Build analysis result for API
      const analysisResult = {
        condition: analysis.results.summary || 'Normal',
        detectedIssues: [
          ...(analysis.results.conditions || []),
          ...(analysis.results.concerns || []),
        ],
        skinType: analysis.results.skinType || 'Normal',
      };

      // Generate predictive routine
      const routine = await predictiveRoutineService.generate({
        analysisId: analysis.id,
        analysisResult,
        latitude: location.latitude,
        longitude: location.longitude,
      });

      setPredictiveRoutine(routine);
      setShowRoutineModal(true);

      // Mark as viewed
      await predictiveRoutineService.markAsViewed(routine.id);
    } catch (error: any) {
      console.error('Error generating predictive routine:', error);
      const isTimeout =
        error?.code === 'ECONNABORTED' ||
        String(error?.message || '').toLowerCase().includes('timeout');
      Alert.alert(
        'Erreur',
        isTimeout
          ? 'La generation prend plus de temps que prevu. Reessayez dans quelques secondes.'
          : (error?.response?.data?.message || error?.message || 'Impossible de générer la routine prédictive. Veuillez réessayer.'),
        [{ text: 'OK' }]
      );
    } finally {
      setGeneratingRoutine(false);
    }
  };

  // Accept and validate routine
  const handleAcceptRoutine = async () => {
    if (!predictiveRoutine) return;

    try {
      const result = await predictiveRoutineService.validateAndActivate(predictiveRoutine.id);
      
      setShowRoutineModal(false);
      
      Alert.alert(
        '✅ Routine activée !',
        'Votre routine personnalisée a été créée. Rendez-vous dans l\'onglet Routine pour la consulter.',
        [
          {
            text: 'Voir ma routine',
            onPress: () => navigation.navigate('Routine'),
          },
          { text: 'Plus tard', style: 'cancel' },
        ]
      );
    } catch (error: any) {
      console.error('Error validating routine:', error);
      Alert.alert('Erreur', 'Impossible de valider la routine. Veuillez réessayer.');
    }
  };

  // Dismiss routine
  const handleDismissRoutine = async () => {
    if (!predictiveRoutine) return;

    try {
      await predictiveRoutineService.dismiss(predictiveRoutine.id);
      setShowRoutineModal(false);
      setPredictiveRoutine(null);
    } catch (error) {
      console.error('Error dismissing routine:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center' as const, alignItems: 'center' as const }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!analysis?.results) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center' as const, alignItems: 'center' as const }}>
          <Text style={{ color: colors.text }}>Aucune analyse trouvée</Text>
        </View>
      </SafeAreaView>
    );
  }

  const results = analysis.results;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{
            fontSize: fontSizes['2xl'],
            fontWeight: FontWeights.bold,
            color: colors.text,
            marginBottom: Spacing.lg,
          }}
        >
          Résultats Détaillés
        </Text>

        {/* Score Principal */}
        <Card style={{ marginBottom: Spacing.lg }}>
          <View
            style={{
              justifyContent: 'center' as const,
              alignItems: 'center' as const,
              paddingVertical: Spacing.lg,
            }}
          >
            <Text style={{ color: colors.textSecondary, fontSize: fontSizes.sm }}>
              Score de Santé
            </Text>
            <Text
              style={{
                fontSize: fontSizes['4xl'],
                fontWeight: FontWeights.bold,
                color: colors.primary,
                marginVertical: Spacing.md,
              }}
            >
              {results.healthScore}/100
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: fontSizes.sm }}>
              {results.skinType} · Âge cutané: {results.skinAge} ans
            </Text>
          </View>
        </Card>

        {/* 🆕 Predictive Routine CTA */}
        <TouchableOpacity
          onPress={handleGeneratePredictiveRoutine}
          disabled={generatingRoutine}
          activeOpacity={0.9}
          style={{ marginBottom: Spacing.lg }}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.primaryDark || '#0066cc']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: BorderRadius.xl,
              padding: Spacing.lg,
              ...Shadows.md,
            }}
          >
            <View style={{ flexDirection: 'row' as const, alignItems: 'center' as const }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  justifyContent: 'center' as const,
                  alignItems: 'center' as const,
                  marginRight: Spacing.md,
                }}
              >
                {generatingRoutine ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Ionicons name="sparkles" size={28} color={Colors.white} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: Colors.white,
                    fontSize: fontSizes.lg,
                    fontWeight: FontWeights.bold,
                  }}
                >
                  {generatingRoutine ? 'Génération en cours...' : 'Générer ma routine IA'}
                </Text>
                <Text
                  style={{
                    color: 'rgba(255,255,255,0.85)',
                    fontSize: fontSizes.sm,
                    marginTop: 4,
                  }}
                >
                  Programme personnalisé 7 jours basé sur votre analyse et la météo
                </Text>
              </View>
              {!generatingRoutine && (
                <Ionicons name="chevron-forward" size={24} color={Colors.white} />
              )}
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Detailed Metrics */}
        {results.detailedAnalysis && (
          <Card style={{ marginBottom: Spacing.lg }}>
            <Text
              style={{
                fontSize: fontSizes.lg,
                fontWeight: FontWeights.bold,
                color: colors.text,
                marginBottom: Spacing.md,
              }}
            >
              Métriques Détaillées
            </Text>
            {Object.entries(results.detailedAnalysis).map(([key, metric]: [string, any]) => (
              <View key={key} style={{ marginBottom: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <View
                  style={{
                    flexDirection: 'row' as const,
                    justifyContent: 'space-between' as const,
                    marginBottom: Spacing.sm,
                  }}
                >
                  <Text
                    style={{
                      color: colors.text,
                      fontWeight: FontWeights.medium,
                      fontSize: fontSizes.sm,
                    }}
                  >
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </Text>
                  <Text
                    style={{
                      color: colors.primary,
                      fontWeight: FontWeights.bold,
                      fontSize: fontSizes.sm,
                    }}
                  >
                    {metric.score}/100
                  </Text>
                </View>
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: fontSizes.xs,
                    lineHeight: 16,
                  }}
                >
                  {metric.description}
                </Text>
              </View>
            ))}
          </Card>
        )}

        {/* Recommendations */}
        {results.recommendations && (
          <Card style={{ marginBottom: Spacing.lg }}>
            <Text
              style={{
                fontSize: fontSizes.lg,
                fontWeight: FontWeights.bold,
                color: colors.text,
                marginBottom: Spacing.md,
              }}
            >
              Recommandations
            </Text>

            {results.recommendations.products.length > 0 && (
              <View style={{ marginBottom: Spacing.md }}>
                <Text
                  style={{
                    fontSize: fontSizes.sm,
                    fontWeight: FontWeights.semibold,
                    color: colors.text,
                    marginBottom: Spacing.sm,
                  }}
                >
                  Produits Recommandés
                </Text>
                {results.recommendations.products.map((product: string, idx: number) => (
                  <Text
                    key={idx}
                    style={{
                      fontSize: fontSizes.xs,
                      color: colors.textSecondary,
                      marginLeft: Spacing.md,
                      marginBottom: Spacing.xs,
                    }}
                  >
                    • {product}
                  </Text>
                ))}
              </View>
            )}

            {results.recommendations.lifestyle.length > 0 && (
              <View>
                <Text
                  style={{
                    fontSize: fontSizes.sm,
                    fontWeight: FontWeights.semibold,
                    color: colors.text,
                    marginBottom: Spacing.sm,
                  }}
                >
                  Conseils Lifestyle
                </Text>
                {results.recommendations.lifestyle.map((tip: string, idx: number) => (
                  <Text
                    key={idx}
                    style={{
                      fontSize: fontSizes.xs,
                      color: colors.textSecondary,
                      marginLeft: Spacing.md,
                      marginBottom: Spacing.xs,
                    }}
                  >
                    • {tip}
                  </Text>
                ))}
              </View>
            )}
          </Card>
        )}

        <Button onPress={() => navigation.goBack()} variant="outline">
          Retour
        </Button>
      </ScrollView>

      {/* Predictive Routine Modal */}
      <PredictiveRoutineModal
        visible={showRoutineModal}
        routine={predictiveRoutine}
        loading={generatingRoutine}
        onAccept={handleAcceptRoutine}
        onDismiss={handleDismissRoutine}
        onClose={() => setShowRoutineModal(false)}
      />
    </SafeAreaView>
  );
}
