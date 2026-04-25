import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Button, PreocupentSelectorModal } from '../../components';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius, Shadows } from '../../theme';
import { useAccessibilityStyles } from '../../stores/useAccessibilityStyles';
import { useTranslation } from '../../lib/i18n';
import { analysisService } from '../../services/analysis.service';
import { subscriptionService } from '../../services/subscription.service';
import { faceVerificationService } from '../../services/face-verification.service';
import { useFaceReferenceGate } from '../../lib/hooks/useFaceReferenceGate';
import * as ImageManipulator from 'expo-image-manipulator';
import type { GeminiAnalysisResult } from '../../lib/types';

interface CapturedPhoto {
  uri: string;
  base64: string;
  timestamp: number;
}

interface MultiPhotoCameraScreenProps {
  onClose?: () => void;
}

const { width: screenWidth } = Dimensions.get('window');
const SCAN_SIZE = screenWidth * 0.8;
const REQUIRED_PHOTOS = 3;
const CIRCULAR_LAYOUT_SIZE = Math.min(screenWidth - Spacing.lg * 2, 300);
const ORBIT_PHOTO_SIZE = 76;

export function MultiPhotoCameraScreen({ onClose }: MultiPhotoCameraScreenProps) {
  const { colors, fontSizes } = useAccessibilityStyles();
  const { t } = useTranslation();
  const navigation = useNavigation<StackNavigationProp<any>>();
  const { ensureFaceReference } = useFaceReferenceGate();

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [photos, setPhotos] = useState<Array<CapturedPhoto | null>>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isScanningPhase, setIsScanningPhase] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState<'scanning' | 'processing' | 'complete' | 'error'>('scanning');
  const [scanMessage, setScanMessage] = useState('Capture en cours...');
  const [scanResult, setScanResult] = useState<GeminiAnalysisResult | null>(null);
  const [usage, setUsage] = useState<any>(null);
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [showPreocupentModal, setShowPreocupentModal] = useState(false);
  const [photosForScan, setPhotosForScan] = useState<CapturedPhoto[]>([]);

  const [verifyingFace, setVerifyingFace] = useState(false);
  const cameraRef = useRef<any>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const captureTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pulseScale = useSharedValue(1);
  const orbitRotation = useSharedValue(0);

  const redirectToSettings = useCallback(() => {
    navigation.navigate('Home' as never, { screen: 'Settings' } as never);
  }, [navigation]);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

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

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (captureTimeoutRef.current) clearTimeout(captureTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isCapturing && !isScanningPhase) {
      pulseScale.value = withRepeat(withTiming(1.2, { duration: 1000, easing: Easing.inOut(Easing.ease) }), -1, true);
    }
  }, [isCapturing, isScanningPhase, pulseScale]);

  useEffect(() => {
    if (isScanningPhase) {
      orbitRotation.value = 0;
      orbitRotation.value = withRepeat(
        withTiming(360, { duration: 5200, easing: Easing.linear }),
        -1,
        false,
      );
      return;
    }

    cancelAnimation(orbitRotation);
    orbitRotation.value = 0;
  }, [isScanningPhase, orbitRotation]);

  const pulseAnimatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulseScale.value }] }));
  const orbitAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${orbitRotation.value}deg` }],
  }));
  const counterOrbitAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${-orbitRotation.value}deg` }],
  }));

  const renderOrbitPhoto = (index: number) => (
    <Animated.View style={[styles.orbitPhotoSlot, counterOrbitAnimatedStyle]}>
      {photos[index] ? (
        <>
          <Image source={{ uri: photos[index]!.uri }} style={styles.orbitPhotoImage} />
          <View style={styles.orbitPhotoCheckmark}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          </View>
        </>
      ) : (
        <View style={[styles.orbitPhotoImage, { backgroundColor: colors.surface }]}> 
          <Ionicons name="image-outline" size={16} color={colors.textTertiary} />
        </View>
      )}
    </Animated.View>
  );

  const capturePhoto = async (nextIndex: number) => {
    if (!cameraRef.current) {
      Alert.alert('Erreur', 'Caméra non disponible');
      return;
    }

    try {
      setIsCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: false,
        skipProcessing: false,
        shutterSound: false,
      });

      if (!photo?.uri) {
        Alert.alert('Erreur', 'Impossible de capturer la photo. Veuillez réessayer.');
        setIsCapturing(false);
        return;
      }

      const manipulated = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 800 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      const newPhoto: CapturedPhoto = {
        uri: manipulated.uri,
        base64: manipulated.base64,
        timestamp: Date.now(),
      };

      setPhotos((previousPhotos) => {
        const updatedPhotos = [...previousPhotos];
        updatedPhotos[nextIndex] = newPhoto;
        setPhotosForScan(updatedPhotos.filter((photo): photo is CapturedPhoto => Boolean(photo?.base64)));
        return updatedPhotos;
      });
      setCurrentPhotoIndex(nextIndex);

      if (nextIndex < REQUIRED_PHOTOS - 1) {
        setIsCapturing(false);
        captureTimeoutRef.current = setTimeout(() => {
          capturePhoto(nextIndex + 1);
        }, 900);
      } else {
        setIsCapturing(false);
        // Do not automatically show modal, let user click the analyze button so we can show loading state properly
      }
    } catch (error) {
      console.error('[MultiPhotoCamera] Capture error:', error);
      setIsCapturing(false);
      Alert.alert('Erreur', 'Impossible de capturer la photo');
    }
  };

  const handleStartCapture = async () => {
    const allowed = await ensureFaceReference(redirectToSettings);
    if (!allowed) {
      return;
    }

    setPhotos([null, null, null]);
    setPhotosForScan([]);
    setCurrentPhotoIndex(0);
    capturePhoto(0);
  };

  const handleContinue = async () => {
    const validPhotos = photosForScan.filter((photo) => Boolean(photo?.base64));
    if (validPhotos.length < REQUIRED_PHOTOS) {
      Alert.alert(t.common.error, `Veuillez capturer ${REQUIRED_PHOTOS} photos`);
      return;
    }

    setVerifyingFace(true);
    try {
      let isVerified = false;
      let lastVerification: any = null;

      // Tester toutes les photos car les profils gauche/droite peuvent échouer à la reconnaissance faciale
      for (const photo of validPhotos) {
        if (!photo?.base64) continue;
        try {
          const verification = await faceVerificationService.verifyFace(photo.base64);
          lastVerification = verification;
          if (verification.verified) {
            isVerified = true;
            break;
          }
        } catch (e) {
          console.log('Verification failed for a photo (likely side profile):', e);
        }
      }

      if (!isVerified) {
        Alert.alert('Échec de la vérification', lastVerification?.message || 'Le visage ne correspond pas à votre avatar de profil.', [
          { text: 'OK', style: 'default' }
        ]);
        if (lastVerification?.needsProfilePhoto) {
          setTimeout(() => redirectToSettings(), 500);
        }
        return;
      }
    } catch (error: any) {
      console.error('Face verification error:', error);
      Alert.alert(t.common.error, 'Erreur lors de la vérification faciale. Veuillez réessayer.');
      return;
    } finally {
      setVerifyingFace(false);
    }

    setShowPreocupentModal(true);
  };

  const performScan = useCallback(async (zones: string[] = []) => {
    const allowed = await ensureFaceReference(redirectToSettings);
    if (!allowed) {
      return;
    }

    const analysisLimitReached =
      !!usage &&
      !usage.isPremium &&
      usage.quotas.analyses.remaining !== null &&
      usage.quotas.analyses.remaining <= 0;

    if (analysisLimitReached) {
      Alert.alert(t.common.error, `Limite mensuelle atteinte. Réinitialisation: ${usage?.quotas.analyses.resetsAt || 'bientôt'}`);
      return;
    }

    if (photosForScan.filter((photo) => Boolean(photo?.base64)).length < REQUIRED_PHOTOS) {
      Alert.alert(t.common.error, `Veuillez capturer ${REQUIRED_PHOTOS} photos`);
      return;
    }

    if (!photosForScan[0] || !photosForScan[0].base64) {
      Alert.alert(t.common.error, 'Erreur: Photo non valide. Veuillez réessayer.');
      return;
    }

    setIsScanningPhase(true);
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
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      }
      setScanProgress(Math.min(Math.round(currentProgress), 90));
    }, 400);

    try {
      const [front, left, right] = photosForScan;
      const result = await analysisService.scan({
        image: front?.base64,
        frontImage: front?.base64,
        leftImage: left?.base64,
        rightImage: right?.base64,
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
          setIsScanningPhase(false);
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
      setTimeout(() => {
        setIsScanningPhase(false);
        Alert.alert(t.common.error, error?.response?.data?.message || 'Une erreur s\'est produite lors du scan');
      }, 1000);
    }
  }, [ensureFaceReference, photosForScan, redirectToSettings, usage, t]);

  const handlePreocupentConfirm = (zones: any[]) => {
    setShowPreocupentModal(false);
    performScan(zones as string[]);
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['left', 'right']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
          <Text style={{ color: colors.text }}>Demande de permission caméra...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['left', 'right']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.lg, backgroundColor: colors.background }}>
          <Ionicons name="camera-outline" size={48} color={colors.warning} style={{ marginBottom: Spacing.md }} />
          <Text style={{ fontSize: fontSizes.lg, fontWeight: FontWeights.bold, color: colors.text, marginBottom: Spacing.sm, textAlign: 'center' }}>Accès caméra refusé</Text>
          <Text style={{ fontSize: fontSizes.sm, color: colors.textSecondary, textAlign: 'center', marginBottom: Spacing.lg }}>Veuillez autoriser l'accès à la caméra dans les paramètres</Text>
          <Button onPress={() => onClose ? onClose() : navigation.goBack()}>Retour</Button>
        </View>
      </SafeAreaView>
    );
  }

  if (isScanningPhase && scanResult === null) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['left', 'right']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.lg, backgroundColor: colors.background }}>
          <View style={styles.scanningCircularContainer}>
            <Animated.View style={[styles.circularOrbit, { width: CIRCULAR_LAYOUT_SIZE, height: CIRCULAR_LAYOUT_SIZE }, orbitAnimatedStyle]}>
              <View style={[styles.orbitTop, styles.orbitAnchor]}>{renderOrbitPhoto(0)}</View>
              <View style={[styles.orbitLeft, styles.orbitAnchor]}>{renderOrbitPhoto(1)}</View>
              <View style={[styles.orbitRight, styles.orbitAnchor]}>{renderOrbitPhoto(2)}</View>

              <View style={[styles.orbitCenterBadge, { backgroundColor: colors.surface }]}> 
                <Ionicons
                  name={scanStatus === 'complete' ? 'checkmark-circle' : scanStatus === 'error' ? 'alert-circle' : 'sync-outline'}
                  size={30}
                  color={scanStatus === 'error' ? colors.warning : scanStatus === 'complete' ? colors.success : colors.primary}
                />
              </View>
            </Animated.View>
          </View>

          <View style={{ width: '100%', marginTop: Spacing.xl, marginBottom: Spacing.xl }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md, gap: Spacing.sm }}>
              <Ionicons name={scanStatus === 'complete' ? 'checkmark-circle' : 'radio-button-on'} size={24} color={scanStatus === 'error' ? colors.warning : colors.success} />
              <Text style={{ fontSize: fontSizes.base, fontWeight: FontWeights.medium, color: colors.text, flex: 1 }}>{scanMessage}</Text>
            </View>
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <View style={[styles.progressFill, { width: `${scanProgress}%`, backgroundColor: scanProgress === 100 ? colors.success : colors.primary }]} />
            </View>
            <Text style={{ fontSize: fontSizes.xs, textAlign: 'center', color: colors.textSecondary }}>{scanProgress}%</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (scanResult) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['left', 'right']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.lg, backgroundColor: colors.background }}>
          <Ionicons name="checkmark-circle" size={64} color={colors.success} style={{ marginBottom: Spacing.lg }} />
          <Text style={{ fontSize: fontSizes.lg, fontWeight: FontWeights.bold, color: colors.text, marginBottom: Spacing.sm }}>Analyse terminée !</Text>
          <Text style={{ fontSize: fontSizes.sm, color: colors.textSecondary, marginBottom: Spacing.lg, textAlign: 'center' }}>{REQUIRED_PHOTOS} photos analysées avec succès</Text>
          <Button onPress={() => navigation.navigate('AnalysisResult', { result: scanResult })}>Voir les résultats</Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['left', 'right']}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="front" />
        
        {/* Pro Masking Overlay: Darkens outside, clear inside */}
        <View style={styles.maskContainer} pointerEvents="none">
          <View style={styles.maskInner} />
        </View>

        <View style={styles.scanCutout} pointerEvents="none">
          <Animated.View style={[styles.scanCircle, pulseAnimatedStyle]} />
          <View style={styles.scanBorder} />
        </View>

        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={() => onClose ? onClose() : navigation.goBack()}>
            <Ionicons name="close" size={28} color={Colors.white} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Multi-Scan Photo</Text>
            <Text style={styles.headerSubtitle}>Photo {currentPhotoIndex + 1}/{REQUIRED_PHOTOS}</Text>
          </View>
        </View>

        <View style={styles.photosIndicator}>
          {Array(REQUIRED_PHOTOS).fill(null).map((_, index) => (
            <View key={index} style={[
              styles.photoIndicator, 
              { 
                backgroundColor: photos[index] ? colors.success : 'rgba(255, 255, 255, 0.2)', 
                borderColor: currentPhotoIndex === index ? colors.primary : 'rgba(255, 255, 255, 0.4)',
                borderStyle: currentPhotoIndex === index ? 'solid' : 'dashed'
              }
            ]}>
              {photos[index] && <Ionicons name="checkmark" size={18} color={Colors.white} />}
            </View>
          ))}
        </View>

        <View style={styles.bottomSection}>
          {photosForScan.filter((photo) => Boolean(photo?.base64)).length === REQUIRED_PHOTOS ? (
            <View style={{ gap: Spacing.md, width: '100%' }}>
              <Button onPress={handleContinue} disabled={verifyingFace}>
                {verifyingFace ? 'Vérification...' : `Analyser les ${REQUIRED_PHOTOS} photos`}
              </Button>
              <Button variant="outline" onPress={() => { setPhotos([null, null, null]); setPhotosForScan([]); setCurrentPhotoIndex(0); }}>Recommencer</Button>
            </View>
          ) : (
            <Button onPress={handleStartCapture} disabled={isCapturing}>{isCapturing ? 'Capture en cours...' : 'Commencer la capture'}</Button>
          )}
        </View>
      </View>

      {showPreocupentModal && (
        <PreocupentSelectorModal visible={showPreocupentModal} onClose={() => setShowPreocupentModal(false)} onConfirm={handlePreocupentConfirm} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  maskContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  maskInner: {
    width: SCAN_SIZE + 3000,
    height: SCAN_SIZE + 3000,
    borderRadius: (SCAN_SIZE + 3000) / 2,
    borderWidth: 1500,
    borderColor: 'rgba(0,0,0,0.75)',
    backgroundColor: 'transparent',
  },
  scanCutout: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: SCAN_SIZE,
    height: SCAN_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [
      { translateX: -SCAN_SIZE / 2 },
      { translateY: -SCAN_SIZE / 2 },
    ],
    zIndex: 2,
  },
  scanCircle: {
    width: SCAN_SIZE * 0.82,
    height: SCAN_SIZE * 0.82,
    borderRadius: (SCAN_SIZE * 0.82) / 2,
    borderWidth: 2,
    borderColor: 'rgba(125, 211, 252, 0.5)',
    backgroundColor: 'transparent',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 4,
  },
  scanBorder: {
    position: 'absolute',
    width: SCAN_SIZE,
    height: SCAN_SIZE,
    borderRadius: SCAN_SIZE / 2,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 8,
    elevation: 6,
  },
  header: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, zIndex: 3, backgroundColor: 'rgba(0,0,0,0.3)' },
  closeButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  headerTitle: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.white, marginBottom: Spacing.xs },
  headerSubtitle: { fontSize: FontSizes.sm, color: 'rgba(255, 255, 255, 0.7)' },
  photosIndicator: { 
    position: 'absolute', 
    bottom: 130, 
    left: 0, 
    right: 0, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    gap: Spacing.md, 
    zIndex: 3 
  },
  photoIndicator: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    borderWidth: 2, 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  bottomSection: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    paddingHorizontal: Spacing.lg, 
    paddingVertical: Spacing.lg, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    zIndex: 3,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  scanningCircularContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  circularOrbit: {
    position: 'relative',
  },
  orbitAnchor: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbitTop: {
    top: 0,
    left: '50%',
    marginLeft: -(ORBIT_PHOTO_SIZE / 2),
  },
  orbitLeft: {
    left: 28,
    bottom: 24,
  },
  orbitRight: {
    right: 28,
    bottom: 24,
  },
  orbitPhotoSlot: {
    width: ORBIT_PHOTO_SIZE,
    height: ORBIT_PHOTO_SIZE,
    borderRadius: ORBIT_PHOTO_SIZE / 2,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.primaryAlpha10,
    position: 'relative',
    ...Shadows.md,
  },
  orbitPhotoImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbitPhotoCheckmark: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 2,
  },
  orbitCenterBadge: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 72,
    height: 72,
    marginLeft: -36,
    marginTop: -36,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.lg,
  },
  progressBar: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: Spacing.sm },
  progressFill: { height: '100%', borderRadius: 4 },
});
