import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useAccessibilityStyles } from '../../stores/useAccessibilityStyles';
import { useTranslation } from '../../lib/i18n';
import { Colors, Spacing, BorderRadius, Shadows, FontWeights } from '../../theme';
import { productScanService } from '../../services/product-scan.service';
import { Button } from '../../components';

const { width, height } = Dimensions.get('window');

interface ScanMode {
  mode: 'camera' | 'gallery' | 'qr';
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const SCAN_MODES: ScanMode[] = [
  { mode: 'camera', label: 'Caméra', icon: 'camera' },
  { mode: 'gallery', label: 'Galerie', icon: 'image' },
  { mode: 'qr', label: 'QR Code', icon: 'qr-code' },
];

export function ProductScanScreen() {
  const { colors, fontSizes } = useAccessibilityStyles();
  const { t } = useTranslation();
  const navigation = useNavigation<StackNavigationProp<any>>();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const cameraRef = useRef<any>(null);

  const [currentMode, setCurrentMode] = useState<'camera' | 'gallery' | 'qr'>('camera');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [barcodeLock, setBarcodeLock] = useState(false);
  const [qrDetectedAnimating, setQrDetectedAnimating] = useState(false);

  // Animations
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadingText = useRef(new Animated.Value(1)).current;
  const framePulseAnim = useRef(new Animated.Value(1)).current;
  const qrFlashAnim = useRef(new Animated.Value(0)).current;
  const qrBadgeScale = useRef(new Animated.Value(0.8)).current;
  const qrBadgeOpacity = useRef(new Animated.Value(0)).current;

  // Initialize permission requests
  useEffect(() => {
    if (!cameraPermission?.granted) {
      requestCameraPermission();
    }
    if (!mediaPermission?.granted) {
      requestMediaPermission();
    }
  }, []);

  // Scan line animation
  useEffect(() => {
    if (isScanning && currentMode === 'camera') {
      const scanAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: false,
          }),
        ])
      );
      scanAnimation.start();
      return () => scanAnimation.stop();
    }
  }, [isScanning, currentMode]);

  // Subtle breathing effect for scan frame in camera/qr mode.
  useEffect(() => {
    if (currentMode === 'camera' || currentMode === 'qr') {
      const frameAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(framePulseAnim, {
            toValue: 1.02,
            duration: 1300,
            useNativeDriver: true,
          }),
          Animated.timing(framePulseAnim, {
            toValue: 0.98,
            duration: 1300,
            useNativeDriver: true,
          }),
        ])
      );
      frameAnimation.start();
      return () => frameAnimation.stop();
    }
  }, [currentMode, framePulseAnim]);

  // Pulse animation for scan button
  useEffect(() => {
    if (!isScanning) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    }
  }, [isScanning]);

  // Text fading animation
  useEffect(() => {
    const textAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(fadingText, {
          toValue: 0.5,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(fadingText, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    textAnimation.start();
    return () => textAnimation.stop();
  }, []);

  const scanLineY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 180],
  });

  const runProgressWhile = useCallback(async <T,>(action: () => Promise<T>): Promise<T> => {
    setIsScanning(true);
    setScanProgress(0);

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 16;
      setScanProgress(Math.min(progress, 92));
    }, 180);

    try {
      const result = await action();
      setScanProgress(100);
      return result;
    } finally {
      clearInterval(interval);
    }
  }, []);

  const runQrDetectedAnimation = useCallback(async () => {
    setQrDetectedAnimating(true);
    qrFlashAnim.setValue(0);
    qrBadgeScale.setValue(0.8);
    qrBadgeOpacity.setValue(0);

    await new Promise<void>((resolve) => {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(qrFlashAnim, {
            toValue: 0.95,
            duration: 120,
            useNativeDriver: true,
          }),
          Animated.spring(qrBadgeScale, {
            toValue: 1,
            friction: 6,
            useNativeDriver: true,
          }),
          Animated.timing(qrBadgeOpacity, {
            toValue: 1,
            duration: 140,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(qrFlashAnim, {
            toValue: 0,
            duration: 240,
            useNativeDriver: true,
          }),
          Animated.timing(qrBadgeOpacity, {
            toValue: 0,
            duration: 260,
            useNativeDriver: true,
          }),
          Animated.timing(qrBadgeScale, {
            toValue: 1.06,
            duration: 260,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        setQrDetectedAnimating(false);
        resolve();
      });
    });
  }, [qrBadgeOpacity, qrBadgeScale, qrFlashAnim]);

  const analyzeImage = useCallback(
    async (imageUri: string) => {
      try {
        setSelectedImage(imageUri);

        const result = await runProgressWhile(() =>
          productScanService.analyzeProductImage(imageUri)
        );

        setTimeout(() => {
          setIsScanning(false);
          navigation.navigate('ProductAnalysis', { product: result });
        }, 250);
      } catch (error) {
        setIsScanning(false);
        Alert.alert(t.common.error, 'Erreur lors de l\'analyse du produit');
      }
    },
    [navigation, runProgressWhile, t.common.error]
  );

  const handleTakePicture = useCallback(async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
      });

      await analyzeImage(photo.uri);
    } catch (error) {
      Alert.alert(t.common.error, 'Erreur lors du scan du produit');
      setIsScanning(false);
    }
  }, [analyzeImage, t.common.error]);

  const handleAnalyzeSelectedImage = useCallback(async () => {
    if (!selectedImage) {
      Alert.alert(t.common.error, 'Aucune image sélectionnée');
      return;
    }

    await analyzeImage(selectedImage);
  }, [analyzeImage, selectedImage, t.common.error]);

  const handleGallerySelect = useCallback(async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(t.common.error, 'Permission galerie refusée');
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 1,
        selectionLimit: 1,
      });

      if (pickerResult.canceled || !pickerResult.assets?.length) {
        return;
      }

      const asset = pickerResult.assets[0];
      await analyzeImage(asset.uri);
    } catch (error) {
      Alert.alert(t.common.error, 'Erreur lors de la sélection de la galerie');
    }
  }, [analyzeImage, t.common.error]);

  const processScannedCode = useCallback(
    async (data: string, type: string, preLocked: boolean = false) => {
      if (!data) {
        return;
      }

      if (!preLocked) {
        if (barcodeLock || data === lastScannedCode) {
          return;
        }

        setBarcodeLock(true);
        setLastScannedCode(data);
      }

      try {
        const isQr = type?.toLowerCase().includes('qr');
        const result = await runProgressWhile(() =>
          isQr ? productScanService.scanQRCode(data) : productScanService.searchProductByCode(data)
        );

        setTimeout(() => {
          setIsScanning(false);
          navigation.navigate('ProductAnalysis', { product: result });
        }, 250);
      } catch (error) {
        setIsScanning(false);
        Alert.alert(t.common.error, 'Code non reconnu ou produit introuvable');
      } finally {
        // Avoid immediate duplicate scans from the same frame stream.
        setTimeout(() => {
          setBarcodeLock(false);
        }, 1200);
      }
    },
    [barcodeLock, lastScannedCode, navigation, runProgressWhile, t.common.error]
  );

  const handleBarcodeScanned = useCallback(
    async ({ data, type }: BarcodeScanningResult) => {
      if (!data || barcodeLock || isScanning) {
        return;
      }

      if (currentMode === 'qr') {
        if (data === lastScannedCode) {
          return;
        }

        setBarcodeLock(true);
        setLastScannedCode(data);

        try {
          await runQrDetectedAnimation();
          await processScannedCode(data, type, true);
        } catch {
          setBarcodeLock(false);
        }
        return;
      }

      await processScannedCode(data, type);
    },
    [
      barcodeLock,
      currentMode,
      isScanning,
      lastScannedCode,
      processScannedCode,
      runQrDetectedAnimation,
    ]
  );

  const handleQRCodeScan = useCallback(async () => {
    setSelectedImage(null);
    setCurrentMode('qr');
    setLastScannedCode(null);
    setBarcodeLock(false);
  }, []);

  if (!cameraPermission?.granted) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color={colors.primary} />
          <Text style={[styles.permissionTitle, { color: colors.text }]}>Permission Caméra</Text>
          <Text style={[styles.permissionText, { color: colors.textSecondary }]}>
            L'accès à la caméra est nécessaire pour scanner les produits
          </Text>
          <Button
            onPress={requestCameraPermission}
            variant="primary"
          >
            Autoriser l'accès
          </Button>
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
          Scan Produit
        </Text>
        <TouchableOpacity onPress={() => setFlashEnabled(!flashEnabled)} style={styles.headerIconButton}>
          <Ionicons
            name={flashEnabled ? 'flash' : 'flash-outline'}
            size={24}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Compact mode tabs under title */}
      <View style={[styles.modeSelectorTop, { backgroundColor: colors.surface }]}> 
        <View style={[styles.modeSelector, { backgroundColor: colors.surface }]}> 
          {SCAN_MODES.map((mode) => (
            <TouchableOpacity
              key={mode.mode}
              style={[
                styles.modeButton,
                {
                  backgroundColor: currentMode === mode.mode ? colors.primary : colors.backgroundSecondary,
                },
              ]}
              onPress={() => {
                if (selectedImage) setSelectedImage(null);
                setCurrentMode(mode.mode);
                if (mode.mode === 'gallery') handleGallerySelect();
                if (mode.mode === 'qr') handleQRCodeScan();
              }}
            >
              <Ionicons
                name={mode.icon}
                size={16}
                color={currentMode === mode.mode ? Colors.white : colors.text}
              />
              <Text
                style={[
                  styles.modeButtonText,
                  {
                    color: currentMode === mode.mode ? Colors.white : colors.text,
                    fontSize: fontSizes.xs,
                  },
                ]}
              >
                {mode.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Camera View */}
      {(currentMode === 'camera' || currentMode === 'qr') && !selectedImage && (
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
          enableTorch={flashEnabled}
          onBarcodeScanned={currentMode === 'qr' ? handleBarcodeScanned : undefined}
          barcodeScannerSettings={
            currentMode === 'qr'
              ? {
                  barcodeTypes: [
                    'qr',
                    'ean13',
                    'ean8',
                    'upc_a',
                    'upc_e',
                    'code128',
                    'code39',
                    'itf14',
                  ],
                }
              : undefined
          }
        >
          {/* Scan Frame Overlay */}
          <LinearGradient
            colors={['rgba(0,0,0,0.1)', 'transparent', 'rgba(0,0,0,0.1)']}
            style={styles.cameraOverlay}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            {currentMode === 'qr' && (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.qrFlashOverlay,
                  {
                    opacity: qrFlashAnim,
                  },
                ]}
              />
            )}

            <Animated.View
              style={[
                styles.scanFrameContainer,
                {
                  transform: [{ scale: framePulseAnim }],
                },
              ]}
            >
              <View style={[styles.scanFrame, { borderColor: colors.primary }]}> 
                {/* Corner indicators */}
                <View style={[styles.corner, styles.topLeft, { borderColor: colors.primary }]} />
                <View style={[styles.corner, styles.topRight, { borderColor: colors.primary }]} />
                <View style={[styles.corner, styles.bottomLeft, { borderColor: colors.primary }]} />
                <View style={[styles.corner, styles.bottomRight, { borderColor: colors.primary }]} />

                {/* Animated scan line */}
                <Animated.View
                  style={[
                    styles.scanLine,
                    {
                      backgroundColor: colors.primary,
                      transform: [{ translateY: scanLineY }],
                    },
                  ]}
                />
              </View>
            </Animated.View>

            {/* Instruction Text */}
            <Animated.View style={[styles.instructionContainer, { opacity: fadingText }]}>
              <Text style={[styles.instructionText, { color: Colors.white }]}>
                {currentMode === 'qr'
                  ? 'Alignez le QR/code-barres dans le cadre'
                  : 'Positionnez le produit dans le cadre'}
              </Text>
            </Animated.View>

            {currentMode === 'qr' && qrDetectedAnimating && (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.qrDetectedBadge,
                  {
                    opacity: qrBadgeOpacity,
                    transform: [{ scale: qrBadgeScale }],
                  },
                ]}
              >
                <Ionicons name="checkmark-circle" size={26} color={Colors.white} />
                <Text style={styles.qrDetectedText}>QR detecte</Text>
              </Animated.View>
            )}
          </LinearGradient>
        </CameraView>
      )}

      {/* Image Preview */}
      {selectedImage && (
        <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
      )}

      {/* Absolute controls overlay */}
      <View
        pointerEvents="box-none"
        style={[
          styles.controlsOverlay,
          { backgroundColor: selectedImage ? colors.background : 'transparent' },
        ]}
      >
        {/* Action Button */}
        <View style={[styles.actionContainer, { backgroundColor: 'transparent' }]}>
          {!selectedImage ? (
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                style={[styles.scanButton, { backgroundColor: colors.primary }]}
                onPress={currentMode === 'camera' ? handleTakePicture : undefined}
                disabled={isScanning}
              >
                <Ionicons
                  name={currentMode === 'qr' ? 'scan' : 'camera'}
                  size={32}
                  color={Colors.white}
                />
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <View style={styles.previewActions}>
              <Button
                onPress={() => setSelectedImage(null)}
                variant="outline"
                size="sm"
              >
                Annuler
              </Button>
              <Button
                onPress={handleAnalyzeSelectedImage}
                variant="primary"
                size="sm"
              >
                {isScanning ? 'Analyse...' : 'Analyser'}
              </Button>
            </View>
          )}
        </View>
      </View>

      {/* Loading Overlay */}
      {isScanning && (
        <View style={styles.loadingOverlay}>
          <View style={[styles.loadingContent, { backgroundColor: colors.surface }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text, fontSize: fontSizes.base }]}>
              Analyse du produit en cours...
            </Text>
            <View style={[styles.progressBar, { backgroundColor: colors.backgroundSecondary }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: colors.primary,
                    width: `${scanProgress}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: colors.textSecondary, fontSize: fontSizes.xs }]}>
              {Math.round(scanProgress)}%
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
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
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 148,
  },
  qrFlashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(14,165,233,0.22)',
  },
  scanFrameContainer: {
    width: width * 0.86,
    maxWidth: 360,
    height: 330,
    marginTop: -100,
  },
  scanFrame: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderWidth: 3,
  },
  topLeft: {
    top: -6,
    left: -6,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  topRight: {
    top: -6,
    right: -6,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  bottomLeft: {
    bottom: -6,
    left: -6,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  bottomRight: {
    bottom: -6,
    right: -6,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  scanLine: {
    position: 'absolute',
    width: '100%',
    height: 2,
    left: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  instructionContainer: {
    position: 'absolute',
    bottom: 170,
    paddingHorizontal: Spacing.lg,
  },
  instructionText: {
    fontSize: 16,
    fontWeight: FontWeights.semibold,
    textAlign: 'center',
  },
  qrDetectedBadge: {
    position: 'absolute',
    top: '48%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(6,182,212,0.92)',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Shadows.md,
  },
  qrDetectedText: {
    color: Colors.white,
    fontWeight: FontWeights.bold,
    fontSize: 13,
  },
  imagePreview: {
    flex: 1,
    width: '100%',
  },
  modeSelectorTop: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    zIndex: 19,
    paddingTop: Spacing.xs,
  },
  modeSelector: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  modeButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.base,
    gap: 4,
    ...Shadows.sm,
  },
  modeButtonText: {
    fontWeight: FontWeights.semibold,
  },
  controlsOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingBottom: Spacing.md,
  },
  actionContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  scanButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.lg,
  },
  previewActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingContent: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    width: '85%',
    ...Shadows.lg,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontWeight: FontWeights.semibold,
    marginBottom: Spacing.md,
  },
  progressBar: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: Spacing.md,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    marginTop: Spacing.sm,
    fontWeight: FontWeights.medium,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: FontWeights.bold,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  permissionText: {
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },
});

export default ProductScanScreen;
