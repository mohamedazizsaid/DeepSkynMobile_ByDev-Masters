import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, ImagePicker, PreocupentSelectorModal } from '../../components';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius, Shadows } from '../../theme';
import { useAccessibilityStyles } from '../../stores/useAccessibilityStyles';
import { useTranslation } from '../../lib/i18n';
import { analysisService } from '../../services/analysis.service';
import { subscriptionService } from '../../services/subscription.service';
import type { GeminiAnalysisResult } from '../../lib/types';

interface CapturedPhoto {
  uri: string;
  base64?: string;
  timestamp: number;
}

const REQUIRED_PHOTOS = 3;
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CIRCULAR_LAYOUT_SIZE = Math.min(screenWidth - Spacing.lg * 2, 300);
const CENTER_PHOTO_SIZE = 120;
const SATELLITE_PHOTO_SIZE = 70;

export function MultiPhotoScanScreen() {
  const { colors, fontSizes } = useAccessibilityStyles();
  const { t } = useTranslation();
  const navigation = useNavigation<StackNavigationProp<any>>();

  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [selectedImage, setSelectedImage] = useState<{ uri: string; base64?: string } | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(-1);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState<'scanning' | 'processing' | 'complete' | 'error'>('scanning');
  const [scanMessage, setScanMessage] = useState('Analyse en cours...');
  const [scanResult, setScanResult] = useState<GeminiAnalysisResult | null>(null);
  const [usage, setUsage] = useState<any>(null);
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [showPreocupentModal, setShowPreocupentModal] = useState(false);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load usage data on mount
  useEffect(() => {
    const loadUsage = async () => {
      try {
        const usageData = await subscriptionService.getUsageSummary();
        setUsage(usageData);
      } catch (error) {
        console.log('Error loading usage:', error);
      } finally {
        setLoadingUsage(false);
      }
    };
    loadUsage();
  }, []);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const handleImageSelected = (uri: string, base64?: string) => {
    setSelectedImage({ uri, base64 });
    setCurrentPhotoIndex(-1);
  };

  const addPhoto = (index: number) => {
    if (!selectedImage?.base64) {
      Alert.alert(t.common.error, 'Veuillez sélectionner une photo');
      return;
    }

    const newPhoto: CapturedPhoto = {
      uri: selectedImage.uri,
      base64: selectedImage.base64,
      timestamp: Date.now(),
    };

    const updatedPhotos = [...photos];
    updatedPhotos[index] = newPhoto;
    setPhotos(updatedPhotos);
    setCurrentPhotoIndex(index);
    setSelectedImage(null);
  };

  const removePhoto = (index: number) => {
    const updatedPhotos = photos.filter((_, i) => i !== index);
    setPhotos(updatedPhotos);
    if (currentPhotoIndex === index) {
      setCurrentPhotoIndex(-1);
    }
  };

  const performScan = useCallback(async (zones: string[] = []) => {
    console.log('[MultiPhotoScan] performScan started with zones:', zones);
    const analysisLimitReached =
      !!usage &&
      !usage.isPremium &&
      usage.quotas.analyses.remaining !== null &&
      usage.quotas.analyses.remaining <= 0;

    if (analysisLimitReached) {
      Alert.alert(
        t.common.error,
        `Limite mensuelle atteinte. Réinitialisation: ${usage?.quotas.analyses.resetsAt || 'bientôt'}`
      );
      return;
    }

    if (photos.length < REQUIRED_PHOTOS) {
      Alert.alert(t.common.error, `Veuillez sélectionner ${REQUIRED_PHOTOS} photos`);
      return;
    }

    setIsScanning(true);
    console.log('[MultiPhotoScan] isScanning set to true');
    setScanProgress(0);
    setScanStatus('scanning');
    setScanMessage('Analyse des photos...');

    let currentProgress = 0;
    progressIntervalRef.current = setInterval(() => {
      currentProgress += Math.random() * 8 + 2;

      if (currentProgress >= 20 && currentProgress < 45) {
        setScanMessage('Analyse de la texture...');
      } else if (currentProgress >= 45 && currentProgress < 70) {
        setScanMessage('Détection des conditions...');
        setScanStatus('processing');
      } else if (currentProgress >= 70) {
        setScanMessage('Génération des résultats...');
      }

      if (currentProgress >= 90) {
        currentProgress = 90;
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      }

      setScanProgress(Math.min(Math.round(currentProgress), 90));
    }, 400);

    try {
      // Use the first photo for analysis (can be extended to use all 3)
      const result = await analysisService.scan({
        image: photos[0].base64!,
        mimeType: 'image/jpeg',
        saveImage: true,
        saveAnalysis: true,
        preocupent: zones,
      });

      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      if (result) {
        setScanProgress(100);
        setScanStatus('complete');
        setScanMessage('Analyse terminée !');

        setTimeout(() => {
          setScanResult(result);
          setIsScanning(false);
        }, 800);

        const newUsage = await subscriptionService.getUsageSummary();
        setUsage(newUsage);
      }
    } catch (error: any) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      setScanStatus('error');
      setScanMessage('Erreur lors de l\'analyse');

      console.error('Scan error:', error);

      setTimeout(() => {
        setIsScanning(false);
        Alert.alert(
          t.common.error,
          error?.response?.data?.message || 'Une erreur s\'est produite lors du scan'
        );
      }, 1000);
    }
  }, [photos, usage, t]);

  const handleContinue = () => {
    if (photos.length < REQUIRED_PHOTOS) {
      Alert.alert(t.common.error, `Veuillez sélectionner ${REQUIRED_PHOTOS} photos`);
      return;
    }
    setShowPreocupentModal(true);
  };

  const handlePreocupentSelected = (zones: string[]) => {
    setShowPreocupentModal(false);
    performScan(zones);
  };

  const handlePreocupentConfirm = (zones: any[]) => {
    console.log('[MultiPhotoScan] handlePreocupentConfirm called with zones:', zones);
    setShowPreocupentModal(false);
    performScan(zones as string[]);
  };

  const clearSelection = () => {
    setPhotos([]);
    setScanResult(null);
    setScanProgress(0);
    setScanStatus('scanning');
    setCurrentPhotoIndex(-1);
  };

  const isPhotoSelectionComplete = photos.length === REQUIRED_PHOTOS;

  // Helper to render satellite photo
  const renderSatellitePhoto = (photoIndex: number) => (
    <View
      style={[
        styles.satellitePhoto,
        { borderColor: photos[photoIndex] ? colors.success : colors.border },
      ]}
    >
      {photos[photoIndex] ? (
        <>
          <Image
            source={{ uri: photos[photoIndex].uri }}
            style={styles.satellitePhotoImage}
          />
          <View style={styles.satelliteCheckmark}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          </View>
        </>
      ) : (
        <View style={[styles.satellitePhotoImage, { backgroundColor: colors.surface }]}>
          <Ionicons name="image-outline" size={14} color={colors.textTertiary} />
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {isScanning && scanResult === null ? (
          // Scanning state with circular 3-photo display (Face ID style)
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: Spacing.xl }}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md }}>
              <Text
                style={{
                  fontSize: fontSizes['2xl'],
                  fontWeight: FontWeights.bold,
                  color: colors.text,
                  marginBottom: Spacing.sm,
                }}
              >
                Multi-Scan
              </Text>
              <Text
                style={{
                  fontSize: fontSizes.sm,
                  color: colors.textSecondary,
                  lineHeight: 20,
                }}
              >
                Analyse en cours...
              </Text>
            </View>

            <View style={styles.scanningContainer}>
              {/* Circular Layout: Center photo + 3 satellite photos */}
              <View style={[styles.circularPhotoLayout, { width: CIRCULAR_LAYOUT_SIZE, height: CIRCULAR_LAYOUT_SIZE }]}>
                {/* Top Photo */}
                <View style={styles.photoTop}>
                  {renderSatellitePhoto(0)}
                </View>

                {/* Middle Row: Left, Center, Right */}
                <View style={styles.photoRowContainer}>
                  {/* Left Photo */}
                  <View style={styles.photoLeft}>
                    {renderSatellitePhoto(1)}
                  </View>

                  {/* Center Large Photo */}
                  <View style={[styles.centerPhotoContainer, { width: CENTER_PHOTO_SIZE, height: CENTER_PHOTO_SIZE }]}>
                    {currentPhotoIndex >= 0 && photos[currentPhotoIndex] ? (
                      <Image
                        source={{ uri: photos[currentPhotoIndex].uri }}
                        style={styles.centerPhoto}
                      />
                    ) : photos[0] ? (
                      <Image
                        source={{ uri: photos[0].uri }}
                        style={styles.centerPhoto}
                      />
                    ) : (
                      <View style={[styles.centerPhoto, { backgroundColor: colors.surface }]}>
                        <Ionicons name="camera-outline" size={48} color={colors.textTertiary} />
                      </View>
                    )}
                  </View>

                  {/* Right Photo */}
                  <View style={styles.photoRight}>
                    {renderSatellitePhoto(2)}
                  </View>
                </View>
              </View>

              {/* Progress Status */}
              <View style={styles.progressSection}>
                <View style={styles.statusCheckmark}>
                  <Ionicons
                    name={scanStatus === 'complete' ? 'checkmark-circle' : 'radio-button-on'}
                    size={24}
                    color={scanStatus === 'error' ? colors.warning : colors.success}
                  />
                  <Text style={[styles.statusText, { color: colors.text }]}>
                    {scanMessage}
                  </Text>
                </View>

                <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${scanProgress}%`,
                        backgroundColor: scanProgress === 100 ? colors.success : colors.primary,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                  {scanProgress}%
                </Text>
              </View>
            </View>
          </ScrollView>
        ) : (
          // Photo selection state
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: Spacing.xl }}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md }}>
              <Text
                style={{
                  fontSize: fontSizes['2xl'],
                  fontWeight: FontWeights.bold,
                  color: colors.text,
                  marginBottom: Spacing.sm,
                }}
              >
                Multi-Scan
              </Text>
              <Text
                style={{
                  fontSize: fontSizes.sm,
                  color: colors.textSecondary,
                  lineHeight: 20,
                }}
              >
                Prenez 3 photos de votre peau sous différents angles pour une analyse précise
              </Text>
            </View>
              {!loadingUsage && usage && (
                <Card
                  style={{
                    marginHorizontal: Spacing.lg,
                    marginBottom: Spacing.lg,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md }}>
                    <Ionicons
                      name="flash"
                      size={18}
                      color={colors.primary}
                      style={{ marginRight: Spacing.sm }}
                    />
                    <Text
                      style={{
                        fontSize: fontSizes.sm,
                        fontWeight: FontWeights.medium,
                        color: colors.text,
                      }}
                    >
                      Quota d'analyses
                    </Text>
                  </View>
                  <Text style={{ fontSize: fontSizes.sm, color: colors.textSecondary }}>
                    {usage.quotas.analyses.remaining !== null
                      ? `${usage.quotas.analyses.remaining} / ${usage.quotas.analyses.limit} analyses restantes`
                      : 'Analyses illimitées (Premium)'}
                  </Text>
                </Card>
              )}

              {/* Image Picker */}
              <View style={{ paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg }}>
                <ImagePicker
                  onImageSelected={handleImageSelected}
                  label="Sélectionner une photo"
                  showPreview={true}
                  aspectRatio={[4, 5]}
                />
              </View>

              {/* 3 Photo Slots */}
              <View style={{ paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg }}>
                <Text
                  style={{
                    fontSize: fontSizes.sm,
                    fontWeight: FontWeights.semibold,
                    color: colors.text,
                    marginBottom: Spacing.md,
                  }}
                >
                  Photos capturées ({photos.length}/{REQUIRED_PHOTOS})
                </Text>

                <View style={styles.photoSlotsContainer}>
                  {Array(REQUIRED_PHOTOS)
                    .fill(null)
                    .map((_, index) => (
                      <View key={index} style={styles.photoSlot}>
                        {photos[index] ? (
                          <>
                            <Image
                              source={{ uri: photos[index].uri }}
                              style={styles.photoSlotImage}
                            />
                            <View style={styles.photoOverlay}>
                              <TouchableOpacity
                                style={[styles.removeButton, { backgroundColor: colors.warning }]}
                                onPress={() => removePhoto(index)}
                              >
                                <Ionicons name="close" size={20} color={Colors.white} />
                              </TouchableOpacity>
                            </View>
                            <View style={styles.photoCheckmark}>
                              <Ionicons name="checkmark-circle" size={32} color={colors.success} />
                            </View>
                          </>
                        ) : (
                          <TouchableOpacity
                            style={[styles.photoSlotEmpty, { borderColor: colors.border }]}
                            onPress={() => addPhoto(index)}
                          >
                            <Ionicons name="camera-outline" size={32} color={colors.primary} />
                            <Text style={[styles.photoSlotEmptyText, { color: colors.textSecondary }]}>
                              Photo {index + 1}
                            </Text>
                            {selectedImage && (
                              <Text style={[styles.tapText, { color: colors.primary }]}>
                                Appuyez pour ajouter
                              </Text>
                            )}
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                </View>
              </View>

              {/* Action Buttons */}
              {isPhotoSelectionComplete && !scanResult && (
                <View style={{ paddingHorizontal: Spacing.lg, gap: Spacing.md }}>
                  <Button onPress={handleContinue}>
                    Analyser les {REQUIRED_PHOTOS} photos
                  </Button>
                  <Button variant="outline" onPress={clearSelection}>
                    Recommencer
                  </Button>
                </View>
              )}

              {/* Scan Results */}
              {scanResult && (
                <View style={{ paddingHorizontal: Spacing.lg }}>
                  <Card
                    style={{
                      backgroundColor: colors.success + '15',
                      borderColor: colors.success,
                      borderWidth: 1,
                    }}
                  >
                    <View style={{ alignItems: 'center' }}>
                      <Ionicons name="checkmark-circle" size={48} color={colors.success} />
                      <Text
                        style={{
                          fontSize: fontSizes.lg,
                          fontWeight: FontWeights.bold,
                          color: colors.text,
                          marginTop: Spacing.md,
                        }}
                      >
                        Analyse terminée !
                      </Text>
                      <Text
                        style={{
                          fontSize: fontSizes.sm,
                          color: colors.textSecondary,
                          marginTop: Spacing.sm,
                          textAlign: 'center',
                        }}
                      >
                        {REQUIRED_PHOTOS} photos analysées avec succès
                      </Text>
                    </View>
                  </Card>

                  <Button
                    onPress={() =>
                      navigation.navigate('AnalysisResult', {
                        result: scanResult,
                      })
                    }
                    style={{ marginTop: Spacing.lg }}
                  >
                    Voir les résultats
                  </Button>
                </View>
              )}
            </ScrollView>
          )}
        </View>

      {/* Preocupent Modal */}
      {showPreocupentModal && (
        <PreocupentSelectorModal
          visible={showPreocupentModal}
          onClose={() => setShowPreocupentModal(false)}
          onConfirm={handlePreocupentConfirm}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scanningContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    alignItems: 'center',
  },
  circularPhotoLayout: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  photoTop: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  photoLeft: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoRight: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoBottom: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerPhotoContainer: {
    borderRadius: CENTER_PHOTO_SIZE / 2,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.lg,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  centerPhoto: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  satellitePhoto: {
    width: SATELLITE_PHOTO_SIZE,
    height: SATELLITE_PHOTO_SIZE,
    borderRadius: SATELLITE_PHOTO_SIZE / 2,
    overflow: 'hidden',
    borderWidth: 2,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  satellitePhotoImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  satelliteCheckmark: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 2,
  },
  progressSection: {
    width: '100%',
    marginBottom: Spacing.xl,
  },
  statusCheckmark: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  statusText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.medium,
    flex: 1,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: FontSizes.xs,
    textAlign: 'center',
  },
  photoSlotsContainer: {
    gap: Spacing.md,
  },
  photoSlot: {
    height: 140,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
    ...Shadows.md,
  },
  photoSlotImage: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: Spacing.md,
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoCheckmark: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
  },
  photoSlotEmpty: {
    flex: 1,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  photoSlotEmptyText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
  },
  tapText: {
    fontSize: FontSizes.xs,
    marginTop: Spacing.xs,
  },
});
