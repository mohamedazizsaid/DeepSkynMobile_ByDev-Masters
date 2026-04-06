import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Card, EmptyState } from '../../components';
import { Spacing, FontSizes, FontWeights, BorderRadius } from '../../theme';
import { useAccessibilityStyles } from '../../stores/useAccessibilityStyles';
import { analysisService } from '../../services/analysis.service';
import type { Analysis } from '../../lib/types';
import { formatDate } from '../../lib/utils';

interface Props {
  navigation: StackNavigationProp<any>;
}

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
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center' as const, alignItems: 'center' as const }}>
          <Text style={{ color: colors.text }}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md }}>
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
