import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Linking,
  Share,
  ActivityIndicator,
} from 'react-native';
import Animated, { 
  FadeInDown, 
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights, Shadows } from '../../theme';
import type { ProductRecommendation, ProductCategory } from '../../lib/types';
import { PRODUCT_CATEGORIES, RATING_CONFIG } from '../../lib/types/product-recommendation';
import { Card } from './Card';
import { Badge } from './Badge';

interface ProductRecommendationCardProps {
  product: ProductRecommendation;
  category?: ProductCategory;
  index?: number;
  onPress?: () => void;
  showQRCode?: boolean;
  compact?: boolean;
}

export function ProductRecommendationCard({
  product,
  category,
  index = 0,
  onPress,
  showQRCode = false,
  compact = false,
}: ProductRecommendationCardProps) {
  const [qrExpanded, setQrExpanded] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const scale = useSharedValue(1);

  const categoryMeta = category ? PRODUCT_CATEGORIES[category] : null;
  const ratingMeta = RATING_CONFIG[product.rating];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const handleBuyPress = async () => {
    if (product.purchaseUrl) {
      try {
        await Linking.openURL(product.purchaseUrl);
      } catch (error) {
        console.error('Failed to open URL:', error);
      }
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Je te recommande ce produit : ${product.productName} de ${product.brand}\n\n${product.whyRecommended}\n\n${product.purchaseUrl || ''}`,
        title: `Recommandation: ${product.productName}`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  if (compact) {
    return (
      <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
        <TouchableOpacity 
          onPress={onPress} 
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
        >
          <Animated.View style={animatedStyle}>
            <Card style={styles.compactCard}>
              <View style={styles.compactHeader}>
                {categoryMeta && (
                  <View style={[styles.categoryIcon, { backgroundColor: `${categoryMeta.color}20` }]}>
                    <Ionicons name={categoryMeta.icon as any} size={20} color={categoryMeta.color} />
                  </View>
                )}
                <View style={styles.compactInfo}>
                  <Text style={styles.compactBrand}>{product.brand}</Text>
                  <Text style={styles.compactName} numberOfLines={1}>{product.productName}</Text>
                </View>
                <View style={styles.compactRight}>
                  <Badge 
                    text={product.estimatedPrice} 
                    variant="neutral" 
                    size="sm" 
                  />
                  <View style={[styles.ratingDot, { backgroundColor: ratingMeta.color }]} />
                </View>
              </View>
            </Card>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeInUp.delay(index * 150).springify()}>
      <TouchableOpacity 
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.95}
      >
        <Animated.View style={[styles.cardContainer, animatedStyle]}>
          <LinearGradient
            colors={[Colors.gray800, Colors.gray900]}
            style={styles.card}
          >
            {/* Header */}
            <View style={styles.header}>
              {categoryMeta && (
                <LinearGradient
                  colors={[`${categoryMeta.color}40`, `${categoryMeta.color}20`]}
                  style={styles.categoryBadge}
                >
                  <Ionicons name={categoryMeta.icon as any} size={16} color={categoryMeta.color} />
                  <Text style={[styles.categoryText, { color: categoryMeta.color }]}>
                    {categoryMeta.label}
                  </Text>
                </LinearGradient>
              )}
              <View style={[styles.ratingBadge, { backgroundColor: `${ratingMeta.color}20` }]}>
                <Ionicons name={ratingMeta.icon as any} size={14} color={ratingMeta.color} />
                <Text style={[styles.ratingText, { color: ratingMeta.color }]}>
                  {ratingMeta.label}
                </Text>
              </View>
            </View>

            {/* Product Info */}
            <View style={styles.productInfo}>
              <Text style={styles.brand}>{product.brand}</Text>
              <Text style={styles.productName}>{product.productName}</Text>
              <Text style={styles.description} numberOfLines={2}>
                {product.description}
              </Text>
            </View>

            {/* Key Ingredients */}
            {product.keyIngredients && product.keyIngredients.length > 0 && (
              <View style={styles.ingredientsSection}>
                <Text style={styles.sectionTitle}>
                  <Ionicons name="flask-outline" size={14} color={Colors.gray400} /> Ingrédients clés
                </Text>
                <View style={styles.ingredientsList}>
                  {product.keyIngredients.slice(0, 4).map((ingredient, idx) => (
                    <View key={idx} style={styles.ingredientChip}>
                      <Text style={styles.ingredientText}>{ingredient}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Why Recommended */}
            <View style={styles.whySection}>
              <LinearGradient
                colors={[`${Colors.primary}15`, 'transparent']}
                style={styles.whyGradient}
              >
                <Ionicons name="bulb-outline" size={18} color={Colors.primary} />
                <Text style={styles.whyText}>{product.whyRecommended}</Text>
              </LinearGradient>
            </View>

            {/* Price & Actions */}
            <View style={styles.footer}>
              <View style={styles.priceContainer}>
                <Text style={styles.priceLabel}>Prix estimé</Text>
                <Text style={styles.price}>{product.estimatedPrice}</Text>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
                  <Ionicons name="share-outline" size={20} color={Colors.gray400} />
                </TouchableOpacity>
                
                {showQRCode && product.qrCodeDataUrl && (
                  <TouchableOpacity 
                    onPress={() => setQrExpanded(!qrExpanded)} 
                    style={styles.actionButton}
                  >
                    <Ionicons name="qr-code-outline" size={20} color={Colors.gray400} />
                  </TouchableOpacity>
                )}

                <TouchableOpacity onPress={handleBuyPress} style={styles.buyButton}>
                  <LinearGradient
                    colors={[Colors.primary, Colors.primaryDark]}
                    style={styles.buyButtonGradient}
                  >
                    <Text style={styles.buyButtonText}>Acheter</Text>
                    <Ionicons name="open-outline" size={16} color={Colors.white} />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

            {/* QR Code Expanded */}
            {qrExpanded && product.qrCodeDataUrl && (
              <Animated.View entering={FadeInDown.duration(300)} style={styles.qrSection}>
                <View style={styles.qrContainer}>
                  {imageLoading && (
                    <ActivityIndicator size="small" color={Colors.primary} style={styles.qrLoader} />
                  )}
                  <Image
                    source={{ uri: product.qrCodeDataUrl }}
                    style={styles.qrCode}
                    onLoadStart={() => setImageLoading(true)}
                    onLoadEnd={() => setImageLoading(false)}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.qrHint}>Scannez pour acheter</Text>
              </Animated.View>
            )}

            {/* Source Articles */}
            {product.sourceArticles && product.sourceArticles.length > 0 && (
              <View style={styles.sourcesSection}>
                <Text style={styles.sourcesTitle}>Sources</Text>
                {product.sourceArticles.slice(0, 2).map((article, idx) => (
                  <TouchableOpacity 
                    key={idx} 
                    onPress={() => Linking.openURL(article.url)}
                    style={styles.sourceLink}
                  >
                    <Ionicons name="document-text-outline" size={12} color={Colors.gray500} />
                    <Text style={styles.sourceLinkText} numberOfLines={1}>
                      {article.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.xl,
    ...Shadows.lg,
  },
  card: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.gray700,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  categoryText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  ratingText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
  },
  productInfo: {
    marginBottom: Spacing.md,
  },
  brand: {
    fontSize: FontSizes.xs,
    color: Colors.gray400,
    fontWeight: FontWeights.medium,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  productName: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  description: {
    fontSize: FontSizes.sm,
    color: Colors.gray400,
    lineHeight: 20,
  },
  ingredientsSection: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.xs,
    color: Colors.gray400,
    fontWeight: FontWeights.medium,
    marginBottom: Spacing.sm,
  },
  ingredientsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  ingredientChip: {
    backgroundColor: Colors.gray700,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  ingredientText: {
    fontSize: FontSizes.xs,
    color: Colors.gray300,
  },
  whySection: {
    marginBottom: Spacing.md,
  },
  whyGradient: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  whyText: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.gray200,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.gray700,
  },
  priceContainer: {},
  priceLabel: {
    fontSize: FontSizes.xs,
    color: Colors.gray500,
  },
  price: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.white,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray700,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyButton: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  buyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 6,
  },
  buyButtonText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.white,
  },
  qrSection: {
    alignItems: 'center',
    paddingTop: Spacing.md,
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.gray700,
  },
  qrContainer: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    position: 'relative',
  },
  qrLoader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -10,
    marginLeft: -10,
  },
  qrCode: {
    width: 180,
    height: 180,
  },
  qrHint: {
    marginTop: Spacing.sm,
    fontSize: FontSizes.xs,
    color: Colors.gray500,
  },
  sourcesSection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.gray700,
  },
  sourcesTitle: {
    fontSize: FontSizes.xs,
    color: Colors.gray500,
    marginBottom: Spacing.sm,
  },
  sourceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  sourceLinkText: {
    fontSize: FontSizes.xs,
    color: Colors.gray400,
    flex: 1,
  },
  // Compact styles
  compactCard: {
    padding: Spacing.md,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactInfo: {
    flex: 1,
  },
  compactBrand: {
    fontSize: FontSizes.xs,
    color: Colors.gray400,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  compactName: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.white,
  },
  compactRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  ratingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
