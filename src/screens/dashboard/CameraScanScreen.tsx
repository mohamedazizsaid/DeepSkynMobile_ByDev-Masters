import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, ScrollView, Alert, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, ImagePicker, AnalysisScanAnimation, PreocupentSelectorModal } from '../../components';
import { FaceIDScanner } from '../../components/auth/FaceIDScanner';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '../../theme';
import { useAccessibilityStyles } from '../../stores/useAccessibilityStyles';
import { useTranslation } from '../../lib/i18n';
import { analysisService } from '../../services/analysis.service';
import { authService } from '../../services/auth.service';
import { subscriptionService } from '../../services/subscription.service';
import { useAuthStore } from '../../stores/auth.store';
import type { GeminiAnalysisResult } from '../../lib/types';
import { useFaceReferenceGate } from '../../lib/hooks/useFaceReferenceGate';

export function CameraScanScreen() {
  const { colors, fontSizes } = useAccessibilityStyles();
  const { t } = useTranslation();
  const navigation = useNavigation<StackNavigationProp<any>>();
  const { user } = useAuthStore();
  const { ensureFaceReference } = useFaceReferenceGate();

  const [selectedImage, setSelectedImage] = useState<{ uri: string; base64?: string } | null>(null);
  const [frontCapture, setFrontCapture] = useState<{ uri: string; base64?: string } | null>(null);
  const [leftCapture, setLeftCapture] = useState<{ uri: string; base64?: string } | null>(null);
  const [rightCapture, setRightCapture] = useState<{ uri: string; base64?: string } | null>(null);
  const [currentCaptureStep, setCurrentCaptureStep] = useState<'front' | 'left' | 'right'>('front');
  const [capturedImagesForLoading, setCapturedImagesForLoading] = useState<
    Partial<Record<'front' | 'left' | 'right', string>>
  >({});
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState<'scanning' | 'processing' | 'complete' | 'error'>('scanning');
  const [scanMessage, setScanMessage] = useState('Analyse en cours...');
  const [scanResult, setScanResult] = useState<GeminiAnalysisResult | null>(null);
  const [faceVerified, setFaceVerified] = useState(false);
  const [showFaceVerification, setShowFaceVerification] = useState(false);
  const [usage, setUsage] = useState<any>(null);
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [showPreocupentModal, setShowPreocupentModal] = useState(false);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const redirectToSettings = useCallback(() => {
    navigation.navigate('Home' as never, { screen: 'Settings' } as never);
  }, [navigation]);

  // Load usage data on mount
  React.useEffect(() => {
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

  const handleImageSelected = (uri: string, base64?: string) => {
    const image = { uri, base64 };
    setSelectedImage(image);

    if (currentCaptureStep === 'front') {
      setFrontCapture(image);
      setCurrentCaptureStep('left');
    } else if (currentCaptureStep === 'left') {
      setLeftCapture(image);
      setCurrentCaptureStep('right');
    } else {
      setRightCapture(image);
    }

    setScanResult(null);
    setScanProgress(0);
    setScanStatus('scanning');
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const performScan = useCallback(async (zones: string[] = []) => {
    const allowed = await ensureFaceReference(redirectToSettings);
    if (!allowed) {
      return;
    }

    if (!faceVerified) {
      setShowFaceVerification(true);
      return;
    }

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

    if (!frontCapture?.base64 || !leftCapture?.base64 || !rightCapture?.base64) {
      Alert.alert(t.common.error, 'Veuillez capturer les 3 angles: front, gauche, droite');
      return;
    }

    setIsScanning(true);
    setScanProgress(0);
    setScanStatus('scanning');
    setScanMessage('Analyse des 3 angles...');
    setCapturedImagesForLoading({
      front: frontCapture.uri,
      left: leftCapture.uri,
      right: rightCapture.uri,
    });

    // Simulate progress animation while waiting for API
    let currentProgress = 0;
    progressIntervalRef.current = setInterval(() => {
      currentProgress += Math.random() * 8 + 2; // Random progress between 2-10%
      
      // Update status messages based on progress
      if (currentProgress >= 20 && currentProgress < 45) {
        setScanMessage('Analyse de la texture...');
      } else if (currentProgress >= 45 && currentProgress < 70) {
        setScanMessage('Détection des conditions...');
        setScanStatus('processing');
      } else if (currentProgress >= 70) {
        setScanMessage('Génération des résultats...');
      }

      // Cap at 90% until we get actual results
      if (currentProgress >= 90) {
        currentProgress = 90;
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      }
      
      setScanProgress(Math.min(Math.round(currentProgress), 90));
    }, 400);

    try {
      const result = await analysisService.scan({
        frontImage: frontCapture.base64,
        leftImage: leftCapture.base64,
        rightImage: rightCapture.base64,
        mimeType: 'image/jpeg',
        // Keep analysis persistent, but avoid hard-failing when storage upload is unavailable.
        saveImage: false,
        saveAnalysis: true,
        preocupent: zones,
      });

      // Clear interval and complete progress
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      if (result) {
        setScanProgress(100);
        setScanStatus('complete');
        setScanMessage('Analyse terminée !');
        
        // Small delay to show complete animation
        setTimeout(() => {
          setScanResult(result.analysis);

          const returnedImages = result.capturedImages || {};
          setCapturedImagesForLoading({
            front: returnedImages.front?.imageUrl || frontCapture.uri,
            left: returnedImages.left?.imageUrl || leftCapture.uri,
            right: returnedImages.right?.imageUrl || rightCapture.uri,
          });
          setIsScanning(false);
        }, 800);

        const newUsage = await subscriptionService.getUsageSummary();
        setUsage(newUsage);
      }
    } catch (error: any) {
      // Clear interval on error
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
  }, [ensureFaceReference, faceVerified, frontCapture, leftCapture, rightCapture, redirectToSettings, usage, t]);

  const handleFaceVerificationSuccess = useCallback(async (imageBase64: string) => {
    if (!user?.email) {
      Alert.alert(t.common.error, 'Email utilisateur introuvable pour la verification.');
      return;
    }

    try {
      await authService.faceLogin(user.email, imageBase64);
      setFaceVerified(true);
      setShowFaceVerification(false);
      Alert.alert('Verification reussie', 'Identite confirmee. Vous pouvez lancer le scan.');
    } catch (error: any) {
      Alert.alert(
        t.common.error,
        error?.response?.data?.message || 'Verification faciale echouee.'
      );
      setShowFaceVerification(false);
    }
  }, [t.common.error, user?.email]);

  const clearSelection = () => {
    setSelectedImage(null);
    setFrontCapture(null);
    setLeftCapture(null);
    setRightCapture(null);
    setCurrentCaptureStep('front');
    setCapturedImagesForLoading({});
    setScanResult(null);
    setFaceVerified(false);
    setScanProgress(0);
    setScanStatus('scanning');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing.xl }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Text
            style={{
              fontSize: fontSizes['2xl'],
              fontWeight: FontWeights.bold,
              color: colors.text,
              marginBottom: Spacing.sm,
            }}
          >
            Scan Caméra
          </Text>
          <Text
            style={{
              fontSize: fontSizes.sm,
              color: colors.textSecondary,
              lineHeight: 20,
              marginBottom: Spacing.lg,
            }}
          >
            Capturez en temps réel 3 angles du visage (front, gauche, droite) pour une analyse plus précise
          </Text>

          {/* Quota Info Card */}
          {!loadingUsage && usage && (
            <Card
              style={{
                marginBottom: Spacing.lg,
              }}
            >
              <View
                style={{
                  flexDirection: 'row' as const,
                  alignItems: 'center' as const,
                  marginBottom: Spacing.md,
                }}
              >
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
          <View style={{ marginBottom: Spacing.lg }}>
            <ImagePicker
              onImageSelected={handleImageSelected}
              label={
                currentCaptureStep === 'front'
                  ? 'Capture 1/3 : Face frontale'
                  : currentCaptureStep === 'left'
                  ? 'Capture 2/3 : Profil gauche'
                  : 'Capture 3/3 : Profil droit'
              }
              showPreview={true}
              aspectRatio={[4, 5]}
            />
          </View>

          {(frontCapture || leftCapture || rightCapture) && (
            <Card style={{ marginBottom: Spacing.lg }}>
              <Text
                style={{
                  fontSize: fontSizes.sm,
                  fontWeight: FontWeights.semibold,
                  color: colors.text,
                  marginBottom: Spacing.md,
                }}
              >
                Captures prêtes
              </Text>
              <View style={{ flexDirection: 'row' as const, gap: Spacing.md }}>
                <CaptureStatusChip label="Front" ready={!!frontCapture} />
                <CaptureStatusChip label="Gauche" ready={!!leftCapture} />
                <CaptureStatusChip label="Droite" ready={!!rightCapture} />
              </View>
              <View style={{ marginTop: Spacing.md }}>
                <CaptureStatusChip label="Verification faciale" ready={faceVerified} />
              </View>
            </Card>
          )}

          {/* Action Buttons */}
          {(frontCapture || leftCapture || rightCapture) && !isScanning && !scanResult && (
            <View style={{ gap: Spacing.md, marginBottom: Spacing.lg }}>
              <Button
                onPress={() => setShowPreocupentModal(true)}
                loading={isScanning}
                disabled={!frontCapture || !leftCapture || !rightCapture}
              >
                {faceVerified ? 'Lancer le Scan' : 'Verifier puis scanner'}
              </Button>
              <Button onPress={clearSelection} variant="outline">
                Annuler
              </Button>
            </View>
          )}

          {/* Scan Result */}
          {scanResult && (
            <View>
              <Text
                style={{
                  fontSize: fontSizes.lg,
                  fontWeight: FontWeights.bold,
                  color: colors.text,
                  marginBottom: Spacing.md,
                }}
              >
                Résultats du Scan
              </Text>

              {/* Health Score */}
              <Card
                style={{
                  marginBottom: Spacing.md,
                  borderLeftWidth: 4,
                  borderLeftColor: colors.primary,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row' as const,
                    justifyContent: 'space-between' as const,
                    alignItems: 'center' as const,
                    marginBottom: Spacing.md,
                    paddingBottom: Spacing.md,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  }}
                >
                  <Text style={{ fontSize: fontSizes.sm, color: colors.textSecondary }}>
                    Score de Santé
                  </Text>
                  <Text
                    style={{
                      fontSize: fontSizes.xl,
                      fontWeight: FontWeights.bold,
                      color: colors.primary,
                    }}
                  >
                    {scanResult.healthScore}/100
                  </Text>
                </View>
                <View style={{ marginBottom: Spacing.md }}>
                  <Text style={{ fontSize: fontSizes.sm, color: colors.textSecondary }}>
                    Type de Peau
                  </Text>
                  <Text style={{ fontSize: fontSizes.sm, color: colors.text, marginTop: Spacing.xs }}>
                    {scanResult.skinType}
                  </Text>
                </View>
                <View>
                  <Text style={{ fontSize: fontSizes.sm, color: colors.textSecondary }}>
                    Âge Cutané
                  </Text>
                  <Text style={{ fontSize: fontSizes.sm, color: colors.text, marginTop: Spacing.xs }}>
                    {scanResult.skinAge} ans
                  </Text>
                </View>
              </Card>

              {/* Conditions */}
              {scanResult.conditions.length > 0 && (
                <Card style={{ marginBottom: Spacing.md, borderLeftWidth: 4, borderLeftColor: colors.warning }}>
                  <Text
                    style={{
                      fontSize: fontSizes.base,
                      fontWeight: FontWeights.bold,
                      color: colors.text,
                      marginBottom: Spacing.md,
                    }}
                  >
                    Conditions Détectées
                  </Text>
                  <View style={{ flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: Spacing.xs }}>
                    {scanResult.conditions.map((condition, index) => (
                      <View
                        key={index}
                        style={{
                          paddingHorizontal: Spacing.sm,
                          paddingVertical: 4,
                          borderRadius: BorderRadius.md,
                          backgroundColor: colors.surface,
                        }}
                      >
                        <Text style={{ fontSize: fontSizes.xs, color: colors.text }}>
                          {condition}
                        </Text>
                      </View>
                    ))}
                  </View>
                </Card>
              )}

              {/* Summary */}
              {scanResult.summary && (
                <Card style={{ marginBottom: Spacing.md }}>
                  <Text style={{ fontSize: fontSizes.sm, color: colors.text, lineHeight: 18 }}>
                    {scanResult.summary}
                  </Text>
                </Card>
              )}

              {/* Action Buttons */}
              <View style={{ gap: Spacing.md }}>
                <Button onPress={() => navigation.goBack()}>
                  Retour
                </Button>
                <Button onPress={clearSelection} variant="outline">
                  Nouveau Scan
                </Button>
              </View>
            </View>
          )}

          {/* Loading State with Animation */}
          {isScanning && (
            <View
              style={{
                justifyContent: 'center' as const,
                alignItems: 'center' as const,
                marginVertical: Spacing.xl,
                backgroundColor: Colors.gray900,
                borderRadius: BorderRadius.xl,
                paddingVertical: Spacing.xl,
              }}
            >
              <AnalysisScanAnimation
                progress={scanProgress}
                status={scanStatus}
                message={scanMessage}
                capturedPreviewImages={capturedImagesForLoading}
              />
            </View>
          )}
        </ScrollView>
        <PreocupentSelectorModal
          visible={showPreocupentModal}
          onClose={() => setShowPreocupentModal(false)}
          onConfirm={(zones) => {
            setShowPreocupentModal(false);
            performScan(zones);
          }}
          loading={isScanning}
        />
      </View>

      <Modal visible={showFaceVerification} animationType="slide">
        <FaceIDScanner
          email={user?.email || ''}
          onSuccess={handleFaceVerificationSuccess}
          onCancel={() => setShowFaceVerification(false)}
        />
      </Modal>
    </SafeAreaView>
  );
}

function CaptureStatusChip({ label, ready }: { label: string; ready: boolean }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 6,
        borderRadius: BorderRadius.full,
        backgroundColor: ready ? `${Colors.success}20` : Colors.gray800,
      }}
    >
      <Ionicons
        name={ready ? 'checkmark-circle' : 'ellipse-outline'}
        size={14}
        color={ready ? Colors.success : Colors.gray400}
      />
      <Text style={{ fontSize: FontSizes.xs, color: Colors.gray200 }}>{label}</Text>
    </View>
  );
}
