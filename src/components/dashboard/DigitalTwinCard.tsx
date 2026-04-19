import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '../ui/Card';
import { Colors, Gradients, Spacing, BorderRadius, FontSizes, FontWeights } from '../../theme';
import { useAccessibilityStyles } from '../../stores/useAccessibilityStyles';
import { productRecommendationService } from '../../services/product-recommendation.service';
import { analysisService } from '../../services/analysis.service';
import type { SkinPrediction } from '../../lib/types';

interface DigitalTwinCardProps {
  daysAhead?: number;
  onPress?: (prediction: SkinPrediction) => void;
}

export function DigitalTwinCard({ daysAhead = 21, onPress }: DigitalTwinCardProps) {
  const { colors, fontSizes } = useAccessibilityStyles();
  const [loading, setLoading] = useState(true);
  const [prediction, setPrediction] = useState<SkinPrediction | null>(null);
  const [fallbackScore, setFallbackScore] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadPrediction = async () => {
      try {
        const data = await productRecommendationService.getSkinPrediction(daysAhead);
        if (mounted) {
          setPrediction(data);
          setFallbackScore(null);
        }
      } catch {
        try {
          const latest = await analysisService.getLatest();
          const score = latest?.healthScore ?? latest?.results?.healthScore ?? null;
          if (mounted) {
            setFallbackScore(typeof score === 'number' ? score : null);
            setPrediction(null);
          }
        } catch {
          if (mounted) {
            setFallbackScore(null);
            setPrediction(null);
          }
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadPrediction();
    return () => {
      mounted = false;
    };
  }, [daysAhead]);

  const projectedScore = prediction?.predictedState?.healthScore ?? fallbackScore;
  const confidence = prediction?.confidence ?? null;
  const headline = useMemo(() => {
    if (prediction) {
      return `Projection a ${daysAhead} jours`;
    }
    if (fallbackScore !== null) {
      return 'Projection en attente - donnees en cours de consolidation';
    }
    return 'Projection indisponible pour le moment';
  }, [prediction, fallbackScore, daysAhead]);

  return (
    <Card variant="elevated" style={[styles.card, { backgroundColor: colors.surface }] as any}>
      <LinearGradient colors={Gradients.purple} style={styles.iconWrap}>
        <Ionicons name="sparkles-outline" size={18} color={Colors.white} />
      </LinearGradient>

      <Text style={[styles.title, { color: colors.text, fontSize: fontSizes.base }]}>
        Digital Twin
      </Text>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Calcul de la projection...</Text>
        </View>
      ) : (
        <>
          <Text style={[styles.headline, { color: colors.textSecondary }]}>{headline}</Text>
          <View style={styles.scoreRow}>
            <Text style={[styles.scoreLabel, { color: colors.textTertiary }]}>
              {prediction ? 'Score projete' : 'Score actuel'}
            </Text>
            <Text style={[styles.scoreValue, { color: colors.primary }]}>
              {projectedScore === null ? '--' : `${Math.round(projectedScore)}/100`}
            </Text>
          </View>
          <View style={styles.scoreRow}>
            <Text style={[styles.scoreLabel, { color: colors.textTertiary }]}>Confiance IA</Text>
            <Text style={[styles.scoreValue, { color: colors.success }]}>
              {prediction ? (confidence === null ? '--' : `${Math.round(confidence * 100)}%`) : '--'}
            </Text>
          </View>

          {!!prediction && (
            <TouchableOpacity style={[styles.cta, { backgroundColor: colors.primary + '15' }]} onPress={() => onPress?.(prediction)}>
              <Text style={[styles.ctaText, { color: colors.primary }]}>Voir les details</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
          )}
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.lg,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.base,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.xs,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  loadingText: {
    fontSize: FontSizes.sm,
  },
  headline: {
    fontSize: FontSizes.sm,
    marginBottom: Spacing.md,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  scoreLabel: {
    fontSize: FontSizes.xs,
  },
  scoreValue: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
  },
  cta: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  ctaText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
  },
});
