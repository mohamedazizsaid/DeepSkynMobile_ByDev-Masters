import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights, Shadows } from '../../theme';
import { ProductRecommendationCard } from './ProductRecommendationCard';
import { productRecommendationService } from '../../services/product-recommendation.service';
import type { ProductRecommendation, ProductCategory } from '../../lib/types';
import { PRODUCT_CATEGORIES } from '../../lib/types/product-recommendation';

const { height: screenHeight } = Dimensions.get('window');

interface ProductRecommendationsModalProps {
  visible: boolean;
  onClose: () => void;
  skinType: string;
  concerns: string[];
  conditions?: string[];
  analysisId?: string;
}

export function ProductRecommendationsModal({
  visible,
  onClose,
  skinType,
  concerns,
  conditions = [],
  analysisId,
}: ProductRecommendationsModalProps) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<ProductRecommendation[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductRecommendation | null>(null);
  const [activeCategory, setActiveCategory] = useState<ProductCategory | 'all'>('all');

  useEffect(() => {
    if (visible) {
      loadRecommendations();
    }
  }, [visible, skinType, concerns]);

  const loadRecommendations = async () => {
    setLoading(true);
    setError(null);

    try {
      // Combine concerns and conditions for more targeted recommendations
      const allConcerns = [...concerns, ...conditions].filter(Boolean);
      
      const recs = await productRecommendationService.getQuickRecommendations(
        allConcerns.length > 0 ? allConcerns : ['general skincare'],
        skinType || 'normale'
      );

      setRecommendations(recs);
    } catch (err: any) {
      console.error('Failed to load recommendations:', err);
      setError(err?.response?.data?.message || 'Impossible de charger les recommandations');
    } finally {
      setLoading(false);
    }
  };

  const filteredRecommendations = activeCategory === 'all'
    ? recommendations
    : recommendations.filter((r: any) => r.category === activeCategory);

  const availableCategories = ['all', ...new Set(recommendations.map((r: any) => r.category).filter(Boolean))];

  const renderCategoryFilter = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.categoryFilter}
      contentContainerStyle={styles.categoryFilterContent}
    >
      {availableCategories.map((cat) => {
        const isActive = activeCategory === cat;
        const categoryMeta = cat !== 'all' ? PRODUCT_CATEGORIES[cat as ProductCategory] : null;
        
        return (
          <TouchableOpacity
            key={cat}
            onPress={() => setActiveCategory(cat as ProductCategory | 'all')}
            style={[
              styles.categoryChip,
              isActive && styles.categoryChipActive,
              isActive && categoryMeta && { backgroundColor: `${categoryMeta.color}30` },
            ]}
          >
            {categoryMeta ? (
              <Ionicons 
                name={categoryMeta.icon as any} 
                size={16} 
                color={isActive ? categoryMeta.color : Colors.gray400} 
              />
            ) : (
              <Ionicons 
                name="apps-outline" 
                size={16} 
                color={isActive ? Colors.primary : Colors.gray400} 
              />
            )}
            <Text style={[
              styles.categoryChipText,
              isActive && styles.categoryChipTextActive,
              isActive && categoryMeta && { color: categoryMeta.color },
            ]}>
              {cat === 'all' ? 'Tous' : categoryMeta?.label || cat}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View 
        entering={FadeIn.duration(200)} 
        exiting={FadeOut.duration(200)}
        style={styles.overlay}
      >
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        
        <Animated.View
          entering={SlideInDown.springify().damping(15)}
          exiting={SlideOutDown.duration(200)}
          style={[styles.container, { paddingBottom: insets.bottom + Spacing.md }]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.handle} />
            <View style={styles.headerContent}>
              <View>
                <Text style={styles.title}>Produits Recommandés</Text>
                <Text style={styles.subtitle}>
                  Basés sur votre analyse • {skinType}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={Colors.gray400} />
              </TouchableOpacity>
            </View>

            {/* Skin Info Pills */}
            {(concerns.length > 0 || conditions.length > 0) && (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.concernsScroll}
                contentContainerStyle={styles.concernsContent}
              >
                {[...concerns, ...conditions].slice(0, 5).map((item, idx) => (
                  <View key={idx} style={styles.concernPill}>
                    <Text style={styles.concernText}>{item}</Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Category Filter */}
          {recommendations.length > 0 && renderCategoryFilter()}

          {/* Content */}
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <View style={styles.loadingAnimation}>
                  <LinearGradient
                    colors={[Colors.primary, Colors.primaryDark]}
                    style={styles.loadingCircle}
                  >
                    <Ionicons name="sparkles" size={32} color={Colors.white} />
                  </LinearGradient>
                </View>
                <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: Spacing.lg }} />
                <Text style={styles.loadingText}>
                  Génération des recommandations IA...
                </Text>
                <Text style={styles.loadingSubtext}>
                  Analyse de votre profil cutané
                </Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <View style={styles.errorIcon}>
                  <Ionicons name="alert-circle" size={48} color={Colors.error} />
                </View>
                <Text style={styles.errorTitle}>Oops !</Text>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={loadRecommendations} style={styles.retryButton}>
                  <LinearGradient
                    colors={[Colors.primary, Colors.primaryDark]}
                    style={styles.retryButtonGradient}
                  >
                    <Ionicons name="refresh" size={18} color={Colors.white} />
                    <Text style={styles.retryButtonText}>Réessayer</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : filteredRecommendations.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="bag-outline" size={64} color={Colors.gray600} />
                <Text style={styles.emptyText}>
                  Aucun produit trouvé pour cette catégorie
                </Text>
              </View>
            ) : (
              <>
                {/* Summary Card */}
                <View style={styles.summaryCard}>
                  <LinearGradient
                    colors={[`${Colors.primary}20`, `${Colors.primary}05`]}
                    style={styles.summaryGradient}
                  >
                    <View style={styles.summaryIcon}>
                      <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                    </View>
                    <View style={styles.summaryContent}>
                      <Text style={styles.summaryTitle}>
                        {recommendations.length} produits sélectionnés pour vous
                      </Text>
                      <Text style={styles.summarySubtitle}>
                        Recommandations personnalisées basées sur l'IA
                      </Text>
                    </View>
                  </LinearGradient>
                </View>

                {/* Product Cards */}
                {filteredRecommendations.map((product, index) => (
                  <ProductRecommendationCard
                    key={`${product.productName}-${index}`}
                    product={product}
                    category={(product as any).category}
                    index={index}
                    showQRCode={true}
                    onPress={() => setSelectedProduct(
                      selectedProduct?.productName === product.productName ? null : product
                    )}
                  />
                ))}

                {/* Disclaimer */}
                <View style={styles.disclaimer}>
                  <Ionicons name="information-circle-outline" size={16} color={Colors.gray500} />
                  <Text style={styles.disclaimerText}>
                    Ces recommandations sont générées par IA. Consultez un dermatologue pour des conseils personnalisés.
                  </Text>
                </View>
              </>
            )}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    backgroundColor: Colors.gray900,
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    maxHeight: screenHeight * 0.9,
    ...Shadows.xl,
  },
  header: {
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray800,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.gray600,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.white,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: Colors.gray400,
    marginTop: 4,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray800,
    justifyContent: 'center',
    alignItems: 'center',
  },
  concernsScroll: {
    marginBottom: Spacing.md,
  },
  concernsContent: {
    gap: Spacing.xs,
  },
  concernPill: {
    backgroundColor: Colors.gray800,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  concernText: {
    fontSize: FontSizes.xs,
    color: Colors.gray300,
  },
  categoryFilter: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray800,
  },
  categoryFilterContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray800,
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: `${Colors.primary}20`,
  },
  categoryChipText: {
    fontSize: FontSizes.sm,
    color: Colors.gray400,
  },
  categoryChipTextActive: {
    color: Colors.primary,
    fontWeight: FontWeights.medium,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['3xl'],
  },
  loadingAnimation: {
    marginBottom: Spacing.lg,
  },
  loadingCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.white,
    marginTop: Spacing.lg,
  },
  loadingSubtext: {
    fontSize: FontSizes.sm,
    color: Colors.gray400,
    marginTop: Spacing.xs,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['3xl'],
  },
  errorIcon: {
    marginBottom: Spacing.md,
  },
  errorTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  errorText: {
    fontSize: FontSizes.sm,
    color: Colors.gray400,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  retryButton: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  retryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  retryButtonText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    color: Colors.white,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['3xl'],
  },
  emptyText: {
    fontSize: FontSizes.base,
    color: Colors.gray400,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  summaryCard: {
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  summaryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${Colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryContent: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    color: Colors.white,
  },
  summarySubtitle: {
    fontSize: FontSizes.xs,
    color: Colors.gray400,
    marginTop: 2,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.gray800,
    borderRadius: BorderRadius.lg,
  },
  disclaimerText: {
    flex: 1,
    fontSize: FontSizes.xs,
    color: Colors.gray500,
    lineHeight: 18,
  },
});
