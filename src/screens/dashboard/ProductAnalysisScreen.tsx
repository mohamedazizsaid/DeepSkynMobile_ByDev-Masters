import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAccessibilityStyles } from '../../stores/useAccessibilityStyles';
import { useTranslation } from '../../lib/i18n';
import { Colors, Spacing, BorderRadius, Shadows, FontWeights } from '../../theme';
import { Button, Card, PredictiveRoutineModal } from '../../components';

interface ProductScanResult {
  id: string;
  name: string;
  brand: string;
  image: string;
  category: string;
  ingredients: string[];
  benefits: {
    title: string;
    description: string;
    matchPercentage: number;
  }[];
  concerns: {
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
  }[];
  skinTypeCompatibility: {
    skinType: string;
    compatibility: number;
  }[];
  recommendation: string;
  price?: number;
  productUrl?: string;
}

export function ProductAnalysisScreen() {
  const { colors, fontSizes } = useAccessibilityStyles();
  const { t } = useTranslation();
  const navigation = useNavigation<StackNavigationProp<any>>();
  const route = useRoute<any>();
  const product: ProductScanResult | undefined = route.params?.product;

  const [loading, setLoading] = useState(true);
  const [expandedBenefit, setExpandedBenefit] = useState<number | null>(null);
  const [expandedConcern, setExpandedConcern] = useState<number | null>(null);
  const [showRoutineModal, setShowRoutineModal] = useState(false);

  // Animations
  const slideUp = useRef(new Animated.Value(100)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const scaleHeader = useRef(new Animated.Value(0.9)).current;
  const progressAnims = useRef(
    (product?.benefits || []).map(() => new Animated.Value(0))
  ).current;

  if (!product) {
    return (
      <SafeAreaView edges={['bottom', 'left', 'right']} style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text, marginTop: Spacing.md }]}>
            Aucun produit a analyser.
          </Text>
          <Text style={{ color: colors.textSecondary, marginTop: Spacing.sm }}>
            Retournez a l'ecran de scan et relancez l'analyse.
          </Text>
          <View style={{ marginTop: Spacing.lg }}>
            <Button onPress={() => navigation.goBack()} variant="primary">
              Retour
            </Button>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 800);

    // Animate content
    Animated.parallel([
      Animated.spring(slideUp, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 8,
      }),
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleHeader, {
        toValue: 1,
        useNativeDriver: true,
        bounciness: 8,
      }),
    ]).start();

    // Animate progress bars
    progressAnims.forEach((anim:any, index:any) => {
      setTimeout(() => {
        Animated.timing(anim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }).start();
      }, index * 100);
    });
  }, []);

  const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high':
        return Colors.error;
      case 'medium':
        return Colors.warning;
      case 'low':
        return Colors.success;
      default:
        return colors.primary;
    }
  };

  const ProgressBar = ({ value, index }: { value: number; index: number }) => {
    const width = progressAnims[index]?.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', `${value}%`],
    });

    return (
      <View style={[styles.progressBarContainer, { backgroundColor: colors.backgroundSecondary }]}>
        <Animated.View
          style={[
            styles.progressBarFill,
            {
              backgroundColor: colors.primary,
              width: width || `${value}%`,
            },
          ]}
        />
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text, marginTop: Spacing.md }]}>
            Analyse du produit...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header overlay */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconButton}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text, fontSize: fontSizes.lg }]}>
          Analyse Produit
        </Text>
        <TouchableOpacity onPress={() => console.log('Share')} style={styles.headerIconButton}>
          <Ionicons name="share-social-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        style={[styles.scrollView, { opacity: fadeIn }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 60 }}
      >

        <Animated.View
          style={[
            styles.productHeader,
            { transform: [{ scale: scaleHeader }, { translateY: slideUp }] },
          ]}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryLight || colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.productHeaderGradient}
          >
            <View style={styles.productImageContainer}>
              {product.image ? (
                <Image source={{ uri: product.image }} style={styles.productImage} />
              ) : (
                <View style={[styles.imagePlaceholder, { backgroundColor: colors.backgroundSecondary }]}>
                  <Ionicons name="cube-outline" size={48} color={colors.primary} />
                </View>
              )}
            </View>

            <View style={styles.productInfo}>
              <Text style={[styles.productName, { color: Colors.white, fontSize: fontSizes.lg }]}>
                {product.name || 'Produit Cosmétique'}
              </Text>
              <Text style={[styles.productBrand, { color: 'rgba(255,255,255,0.9)' }]}>
                {product.brand || 'Marque'}
              </Text>
              <View style={styles.categoryBadge}>
                <Text style={[styles.categoryBadgeText, { fontSize: fontSizes.xs }]}>
                  {product.category || 'Cosmétique'}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Overall Recommendation */}
        <Card style={StyleSheet.flatten([styles.section, { backgroundColor: colors.surface }])}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontSizes.base }]}> 
            Recommandation Globale
          </Text>
          <LinearGradient
            colors={[colors.primary + '15', colors.primary + '05']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.recommendationBox}
          >
            <View style={styles.recommendationContent}>
              <Ionicons name="checkmark-circle" size={32} color={colors.primary} />
              <Text
                style={[
                  styles.recommendationText,
                  { color: colors.text, fontSize: fontSizes.sm, marginLeft: Spacing.md },
                ]}
              >
                {product.recommendation || 'Produit compatible avec votre profil'}
              </Text>
            </View>
          </LinearGradient>
        </Card>

        {/* Benefits Section */}
        {product.benefits && product.benefits.length > 0 && (
          <Card style={StyleSheet.flatten([styles.section, { backgroundColor: colors.surface }])}>
            <View style={styles.sectionHeaderInline}>
              <Ionicons name="checkmark-done-circle" size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontSizes.base }]}> 
                Avantages pour Votre Peau
              </Text>
            </View>
            <View style={styles.benefitsContainer}>
              {product.benefits.map((benefit: any, index: number) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setExpandedBenefit(expandedBenefit === index ? null : index)}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={[colors.primaryLight || colors.primary, colors.primary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.benefitCard, { marginBottom: Spacing.md }]}
                  >
                    <View style={styles.benefitHeader}>
                      <View style={styles.benefitTitleContainer}>
                        <Ionicons name="sparkles" size={20} color={Colors.white} />
                        <Text
                          style={[
                            styles.benefitTitle,
                            { color: Colors.white, marginLeft: Spacing.md, fontSize: fontSizes.base },
                          ]}
                        >
                          {benefit.title}
                        </Text>
                      </View>
                      <View style={[styles.matchBadge, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                        <Text
                          style={[
                            styles.matchText,
                            { color: Colors.white, fontSize: fontSizes.xs, fontWeight: FontWeights.bold },
                          ]}
                        >
                          {benefit.matchPercentage}%
                        </Text>
                      </View>
                    </View>

                    {expandedBenefit === index && (
                      <View style={{ marginTop: Spacing.md }}>
                        <Text
                          style={[
                            styles.benefitDescription,
                            { color: 'rgba(255,255,255,0.95)', fontSize: fontSizes.sm },
                          ]}
                        >
                          {benefit.description}
                        </Text>
                        <ProgressBar value={benefit.matchPercentage} index={index} />
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        )}

        {/* Concerns Section */}
        {product.concerns && product.concerns.length > 0 && (
          <Card style={StyleSheet.flatten([styles.section, { backgroundColor: colors.surface }])}>
            <View style={styles.sectionHeaderInline}>
              <Ionicons name="alert-circle" size={18} color={Colors.warning} />
              <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontSizes.base }]}> 
                Preoccupations Potentielles
              </Text>
            </View>
            <View style={styles.concernsContainer}>
              {product.concerns.map((concern: any, index: number) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setExpandedConcern(expandedConcern === index ? null : index)}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={[getSeverityColor(concern.severity) + '20', getSeverityColor(concern.severity) + '08']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.concernCard, { marginBottom: Spacing.md }]}
                  >
                    <View
                      style={[
                        styles.concernHeader,
                        { borderLeftColor: getSeverityColor(concern.severity) },
                      ]}
                    >
                      <Ionicons
                        name={concern.severity === 'high' ? 'alert' : 'alert-outline'}
                        size={20}
                        color={getSeverityColor(concern.severity)}
                      />
                      <Text
                        style={[
                          styles.concernTitle,
                          {
                            color: colors.text,
                            marginLeft: Spacing.md,
                            fontSize: fontSizes.base,
                            fontWeight: FontWeights.semibold,
                          },
                        ]}
                      >
                        {concern.title}
                      </Text>
                      <View
                        style={[
                          styles.severityBadge,
                          { backgroundColor: getSeverityColor(concern.severity) },
                        ]}
                      >
                        <Text
                          style={[
                            styles.severityText,
                            { fontSize: fontSizes.xs, fontWeight: FontWeights.bold },
                          ]}
                        >
                          {concern.severity.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    {expandedConcern === index && (
                      <Text
                        style={[
                          styles.concernDescription,
                          { color: colors.textSecondary, marginTop: Spacing.md, fontSize: fontSizes.sm },
                        ]}
                      >
                        {concern.description}
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        )}

        {/* Skin Type Compatibility */}
        {product.skinTypeCompatibility && product.skinTypeCompatibility.length > 0 && (
          <Card style={StyleSheet.flatten([styles.section, { backgroundColor: colors.surface }])}>
            <View style={styles.sectionHeaderInline}>
              <Ionicons name="body" size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontSizes.base }]}> 
                Compatibilite Types de Peau
              </Text>
            </View>
            <View>
              {product.skinTypeCompatibility.map((compat: any, index: number) => (
                <View key={index} style={styles.compatibilityItem}>
                  <Text
                    style={[
                      styles.compatibilityLabel,
                      { color: colors.text, fontSize: fontSizes.sm, fontWeight: FontWeights.medium },
                    ]}
                  >
                    {compat.skinType}
                  </Text>
                  <ProgressBar value={compat.compatibility} index={index} />
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Ingredients */}
        {product.ingredients && product.ingredients.length > 0 && (
          <Card style={StyleSheet.flatten([styles.section, { backgroundColor: colors.surface }])}>
            <View style={styles.sectionHeaderInline}>
              <Ionicons name="flask" size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontSizes.base }]}> 
                Ingredients Cles
              </Text>
            </View>
            <View style={styles.ingredientsList}>
              {product.ingredients.slice(0, 5).map((ingredient: string, index: number) => (
                <View
                  key={index}
                  style={[
                    styles.ingredientTag,
                    { backgroundColor: colors.primaryLight || colors.primary },
                  ]}
                >
                  <Text style={[styles.ingredientText, { color: Colors.white, fontSize: fontSizes.xs }]}>
                    {ingredient}
                  </Text>
                </View>
              ))}
              {product.ingredients.length > 5 && (
                <View
                  style={[
                    styles.ingredientTag,
                    { backgroundColor: colors.backgroundSecondary },
                  ]}
                >
                  <Text style={[styles.ingredientText, { color: colors.textSecondary, fontSize: fontSizes.xs }]}>
                    +{product.ingredients.length - 5} plus
                  </Text>
                </View>
              )}
            </View>
          </Card>
        )}

        {/* Action Buttons */}
        <View style={[styles.actionSection, { backgroundColor: colors.background }]}>
          <Button
            onPress={() => setShowRoutineModal(true)}
            variant="primary"
            fullWidth
          >
            Ajouter a la Routine
          </Button>
          {product.productUrl && (
            <Button
              onPress={() => console.log('Open product')}
              variant="outline"
              fullWidth
              style={{ marginTop: Spacing.md }}
            >
              Voir le Produit
            </Button>
          )}
        </View>
      </Animated.ScrollView>

      {/* Routine Modal */}
      <PredictiveRoutineModal
        visible={showRoutineModal}
        routine={null}
        onAccept={() => setShowRoutineModal(false)}
        onDismiss={() => setShowRoutineModal(false)}
        onClose={() => setShowRoutineModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  headerIconButton: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontWeight: FontWeights.bold,
  },
  productHeader: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  productHeaderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  productImageContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.lg,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.xs,
  },
  productBrand: {
    marginBottom: Spacing.sm,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
  },
  categoryBadgeText: {
    color: Colors.white,
    fontWeight: FontWeights.semibold,
  },
  section: {
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  sectionHeaderInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontWeight: FontWeights.semibold,
  },
  recommendationBox: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recommendationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recommendationText: {
    flex: 1,
    lineHeight: 20,
  },
  benefitsContainer: {
    marginTop: Spacing.md,
  },
  benefitCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  benefitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  benefitTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  benefitTitle: {
    fontWeight: FontWeights.semibold,
  },
  matchBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  matchText: {
    color: Colors.white,
  },
  benefitDescription: {
    lineHeight: 20,
  },
  progressBarContainer: {
    height: 6,
    borderRadius: 3,
    marginTop: Spacing.md,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  concernsContainer: {
    marginTop: Spacing.md,
  },
  concernCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderLeftWidth: 4,
    ...Shadows.sm,
  },
  concernHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    paddingLeft: Spacing.md,
    marginLeft: -Spacing.lg,
  },
  concernTitle: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  severityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  severityText: {
    color: Colors.white,
  },
  concernDescription: {
    lineHeight: 20,
  },
  compatibilityItem: {
    marginBottom: Spacing.lg,
  },
  compatibilityLabel: {
    marginBottom: Spacing.sm,
  },
  ingredientsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  ingredientTag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  ingredientText: {
    fontWeight: FontWeights.semibold,
  },
  actionSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontWeight: FontWeights.semibold,
  },
});

export default ProductAnalysisScreen;
