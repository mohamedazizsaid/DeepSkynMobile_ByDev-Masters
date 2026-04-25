import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Card, EmptyState, FaceTagsOverlay } from '../../components';
import type { FaceTag } from '../../components';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '../../theme';
import { useAccessibilityStyles } from '../../stores/useAccessibilityStyles';
import { analysisService } from '../../services/analysis.service';
import type { Analysis } from '../../lib/types';
import { formatDate } from '../../lib/utils';

interface Props {
  navigation: StackNavigationProp<any>;
}

const getFaceTagsFromAnalysis = (analysisItem: Analysis): FaceTag[] => {
  if (!analysisItem || !analysisItem.results?.detailedAnalysis) return [];
  
  const tags: FaceTag[] = [];
  const detailedAnalysis = analysisItem.results.detailedAnalysis;
  
  const analysisToTagMap: Array<{
    key: keyof typeof detailedAnalysis;
    label: string;
    condition: string;
    zones: string[];
  }> = [
    { key: 'acne', label: 'Acné', condition: 'acne', zones: ['forehead', 'left_cheek', 'right_cheek', 'chin'] },
    { key: 'wrinkles', label: 'Rides', condition: 'wrinkles', zones: ['forehead', 'left_eye', 'right_eye'] },
    { key: 'pigmentation', label: 'Pigmentation', condition: 'hyperpigmentation', zones: ['left_cheek', 'right_cheek'] },
    { key: 'redness', label: 'Rougeurs', condition: 'redness', zones: ['nose', 'left_cheek', 'right_cheek'] },
    { key: 'pores', label: 'Pores', condition: 'pores', zones: ['nose', 'left_cheek', 'right_cheek'] },
    { key: 'hydration', label: 'Déshydratation', condition: 'dehydration', zones: ['left_cheek', 'right_cheek'] },
    { key: 'texture', label: 'Texture', condition: 'texture', zones: ['left_cheek', 'right_cheek'] },
  ];

  analysisToTagMap.forEach((item, index) => {
    const metric = detailedAnalysis[item.key as keyof typeof detailedAnalysis];
    if (metric && (metric as any).score < 70) {
      const score = (metric as any).score;
      const severity = score < 40 ? 'severe' : score < 55 ? 'moderate' : 'mild';
      const zone = item.zones[index % item.zones.length];
      tags.push({
        id: `tag-${item.key}`,
        condition: item.condition,
        label: item.label,
        severity,
        confidence: Math.max(60, 100 - Math.floor(score / 2)),
        zone,
        description: (metric as any).description,
      });
    }
  });

  analysisItem.conditions?.forEach((condition, idx) => {
    const conditionKey = condition.toLowerCase().replace(/\s+/g, '_');
    const existingTag = tags.find(t => t.condition === conditionKey);
    if (!existingTag) {
      tags.push({
        id: `condition-${idx}`,
        condition: conditionKey,
        label: condition,
        severity: 'moderate',
        confidence: 75,
        zone: ['forehead', 'left_cheek', 'right_cheek', 'nose', 'chin'][idx % 5],
      });
    }
  });

  return tags.slice(0, 6);
};

export function AnalysisHistoryScreen({ navigation }: Props) {
  const { colors, fontSizes } = useAccessibilityStyles();

  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAnalyses = useCallback(async (pageNum = 1) => {
    try {
      const data = await analysisService.getAll(pageNum, 10);
      if (pageNum === 1) {
        setAnalyses(data.analyses);
      } else {
        setAnalyses((prev) => [...prev, ...data.analyses]);
      }
      setTotal(data.total);
      setPage(pageNum);
    } catch (error) {
      console.error('Error loading analyses:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAnalyses(1);
  }, [loadAnalyses]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAnalyses(1);
  };

  const loadMore = () => {
    if (analyses.length < total) {
      loadAnalyses(page + 1);
    }
  };

  const getStatusColor = (status: Analysis['status']) => {
    switch (status) {
      case 'completed':
        return colors.primary;
      case 'processing':
        return colors.warning;
      case 'failed':
        return colors.error;
      default:
        return colors.textTertiary;
    }
  };

  const getStatusLabel = (status: Analysis['status']) => {
    switch (status) {
      case 'completed':
        return 'Complété';
      case 'processing':
        return 'En cours';
      case 'failed':
        return 'Échoué';
      default:
        return 'Inconnu';
    }
  };

  const renderAnalysisItem = ({ item }: { item: Analysis }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('AnalysisResult', { analysisId: item.id })}
      activeOpacity={0.7}
    >
      <Card
        style={{
          marginBottom: Spacing.md,
          flexDirection: 'row' as const,
          justifyContent: 'space-between' as const,
          alignItems: 'center' as const,
        }}
      >
        <View style={{ flex: 1 }}>
          {Array.isArray(item.images) && item.images.length > 0 && (
            <View style={{ marginBottom: Spacing.sm }}>
              {(() => {
                const tags = getFaceTagsFromAnalysis(item);
                if (tags.length > 0) {
                  return (
                    <View style={{ alignItems: 'center', marginBottom: Spacing.sm, marginTop: Spacing.sm }}>
                      <FaceTagsOverlay
                        imageUri={item.images[0]}
                        tags={tags}
                        imageWidth={Dimensions.get('window').width - Spacing.lg * 4}
                        imageHeight={(Dimensions.get('window').width - Spacing.lg * 4) * 1.2}
                        showConnectors={true}
                        animateOnMount={false}
                      />
                    </View>
                  );
                } else {
                  return (
                    <View style={{ flexDirection: 'row' as const, alignItems: 'center' as const, gap: Spacing.sm }}>
                      {item.images.slice(0, 3).map((uri, index) => (
                        <Image
                          key={`${item.id}-image-${index}`}
                          source={{ uri }}
                          style={{
                            width: 56,
                            height: 56,
                            borderRadius: BorderRadius.base,
                            backgroundColor: colors.surface,
                            borderWidth: 1,
                            borderColor: colors.border,
                          }}
                        />
                      ))}
                      {item.images.length > 3 && (
                        <View
                          style={{
                            minWidth: 36,
                            height: 36,
                            borderRadius: 18,
                            paddingHorizontal: Spacing.xs,
                            justifyContent: 'center' as const,
                            alignItems: 'center' as const,
                            backgroundColor: colors.primary + '20',
                          }}
                        >
                          <Text style={{ color: colors.primary, fontSize: fontSizes.xs, fontWeight: FontWeights.semibold }}>
                            +{item.images.length - 3}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                }
              })()}
            </View>
          )}

          <Text
            style={{
              fontSize: fontSizes.sm,
              color: colors.textSecondary,
              marginBottom: Spacing.xs,
            }}
          >
            {formatDate(item.createdAt)}
          </Text>

          <View
            style={{
              flexDirection: 'row' as const,
              alignItems: 'center' as const,
              justifyContent: 'space-between' as const,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: fontSizes.base,
                  fontWeight: FontWeights.semibold,
                  color: colors.text,
                  marginBottom: Spacing.xs,
                }}
              >
                Score: {item.healthScore ?? '-'}/100
              </Text>

              {item.results?.skinType && (
                <Text
                  style={{
                    fontSize: fontSizes.xs,
                    color: colors.textSecondary,
                  }}
                >
                  {item.results.skinType}
                </Text>
              )}
            </View>

            <View
              style={{
                flexDirection: 'row' as const,
                alignItems: 'center' as const,
                gap: Spacing.sm,
                marginLeft: Spacing.md,
              }}
            >
              <View
                style={{
                  flexDirection: 'row' as const,
                  alignItems: 'center' as const,
                  paddingHorizontal: Spacing.sm,
                  paddingVertical: 4,
                  borderRadius: BorderRadius.sm,
                  backgroundColor: getStatusColor(item.status) + '30',
                }}
              >
                <Text
                  style={{
                    fontSize: fontSizes.xs,
                    color: getStatusColor(item.status),
                    fontWeight: FontWeights.medium,
                  }}
                >
                  {getStatusLabel(item.status)}
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textTertiary}
              />
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  if (loading && analyses.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['left', 'right', 'bottom']}>
        <View style={{ flex: 1, justifyContent: 'center' as const, alignItems: 'center' as const }}>
          <Text style={{ color: colors.text }}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['left', 'right', 'bottom']}>
      <View style={{ flex: 1, backgroundColor: colors.backgroundSecondary }}>
        <View style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: BorderRadius.base,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: Colors.primaryAlpha10,
              }}
            >
              <Ionicons name="time-outline" size={20} color={colors.primary} />
            </View>
            <Text
              style={{
                fontSize: fontSizes['2xl'],
                fontWeight: FontWeights.bold,
                color: colors.text,
              }}
            >
              Historique d'Analyses
            </Text>
          </View>
        </View>

        {analyses.length === 0 ? (
          <EmptyState
            icon="document-text-outline"
            title="Aucune analyse"
            description="Vous n'avez pas encore d'analyses."
          />
        ) : (
          <FlatList
            data={analyses}
            renderItem={renderAnalysisItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingHorizontal: Spacing.lg,
              paddingBottom: Spacing.xl,
            }}
            scrollEnabled={true}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}
