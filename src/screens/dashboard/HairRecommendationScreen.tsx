import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Card, ImagePicker, AnalysisScanAnimation } from '../../components';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius, Gradients, Shadows } from '../../theme';
import { useAccessibilityStyles } from '../../stores/useAccessibilityStyles';
import { useTranslation } from '../../lib/i18n';


import { analysisService } from '../../services/analysis.service';

export function HairRecommendationScreen() {
  const { colors, fontSizes, textStyle } = useAccessibilityStyles();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();

  const [selectedImage, setSelectedImage] = useState<{ uri: string; base64?: string } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStatus, setAnalysisStatus] = useState<'scanning' | 'processing' | 'complete' | 'error'>('scanning');
  const [showResult, setShowResult] = useState(false);
  const [activeRec, setActiveRec] = useState<{ title: string; description: string; imageUrl: string } | null>(null);

  const handleImageSelected = (uri: string, base64?: string) => {
    setSelectedImage({ uri, base64 });
    setShowResult(false);
  };

  const startAnalysis = async () => {
    if (!selectedImage?.base64) {
      Alert.alert('Erreur', 'Veuillez capturer une photo claire de votre visage.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(10);
    setAnalysisStatus('scanning');

    try {
      // Small progress animation simulation
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 5;
        });
      }, 500);

      const result = await analysisService.getHairRecommendation(selectedImage.base64);
      
      clearInterval(progressInterval);
      setAnalysisProgress(100);
      setAnalysisStatus('complete');
      setActiveRec(result);

      setTimeout(() => {
        setIsAnalyzing(false);
        setShowResult(true);
      }, 800);
    } catch (error) {
      console.error('Hair analysis failed:', error);
      setIsAnalyzing(false);
      Alert.alert('Erreur', "L'analyse IA a échoué. Veuillez réessayer avec une photo plus claire.");
    }
  };

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <LinearGradient colors={Gradients.primary} style={styles.headerIcon}>
            <Ionicons name="star" size={24} color={Colors.white} />
          </LinearGradient>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Hair Stylist AI</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>NOUVEAUTÉ</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Laissez notre IA analyser la forme de votre visage pour vous recommander la coupe de cheveux idéale.
        </Text>

        {/* Image Capture / Selection */}
        {!showResult && (
          <View style={styles.captureSection}>
            <ImagePicker
              onImageSelected={handleImageSelected}
              label="Prendre une photo de face"
              showPreview={true}
              aspectRatio={[1, 1]}
            />
            
            {selectedImage && !isAnalyzing && (
              <Button 
                onPress={startAnalysis} 
                style={styles.analyzeButton}
              >
                Générer ma coupe idéale
              </Button>
            )}
          </View>
        )}

        {/* Results Section */}
        {showResult && selectedImage && activeRec && (
          <View style={styles.resultSection}>
            <Card style={styles.resultCard}>
              <Text style={[styles.resultTitle, { color: colors.text }]}>Votre Recommandation</Text>
              
              <View style={styles.comparisonContainer}>
                <View style={styles.imageWrap}>
                  <Image source={{ uri: selectedImage.uri }} style={styles.resultImage} />
                  <View style={styles.imageLabel}>
                    <Text style={styles.imageLabelText}>AVANT</Text>
                  </View>
                </View>
                
                <Ionicons name="arrow-forward" size={24} color={colors.primary} />
                
                <View style={styles.imageWrap}>
                  {/* Image générée simulée dynamique */}
                  <Image 
                    source={{ uri: activeRec.imageUrl }} 
                    style={styles.resultImage} 
                  />
                  <View style={[styles.imageLabel, { backgroundColor: colors.primary }]}>
                    <Text style={styles.imageLabelText}>APRÈS (IA)</Text>
                  </View>
                </View>
              </View>

              <View style={[styles.recommendationBox, { backgroundColor: colors.backgroundSecondary }]}>
                <Text style={[styles.recTitle, { color: colors.primary }]}>Coupe conseillée : {activeRec.title}</Text>
                <Text style={[styles.recDesc, { color: colors.textSecondary }]}>
                  {activeRec.description}
                </Text>
              </View>

              <Button onPress={() => setShowResult(false)} variant="outline" style={styles.resetButton}>
                Essayer une autre photo
              </Button>
            </Card>
          </View>
        )}

        {/* Processing Modal */}
        <Modal visible={isAnalyzing} transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: Colors.gray900 }]}>
              <AnalysisScanAnimation 
                progress={analysisProgress}
                status={analysisStatus}
                message={analysisStatus === 'scanning' ? 'Analyse du visage...' : 'Génération de la coupe...'}
                capturedPreviewImages={{ front: selectedImage?.uri }}
              />
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.base,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  title: {
    fontSize: 22,
    fontWeight: FontWeights.bold as any,
  },
  badge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#000',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  captureSection: {
    marginTop: Spacing.md,
  },
  analyzeButton: {
    marginTop: Spacing.lg,
  },
  resultSection: {
    marginTop: Spacing.md,
  },
  resultCard: {
    padding: Spacing.lg,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: FontWeights.bold as any,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  comparisonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  imageWrap: {
    width: '42%',
    aspectRatio: 1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  resultImage: {
    width: '100%',
    height: '100%',
  },
  imageLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 4,
    alignItems: 'center',
  },
  imageLabelText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  recommendationBox: {
    padding: Spacing.md,
    borderRadius: BorderRadius.base,
    marginBottom: Spacing.xl,
  },
  recTitle: {
    fontSize: 15,
    fontWeight: FontWeights.bold as any,
    marginBottom: 4,
  },
  recDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  resetButton: {
    marginTop: Spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalContent: {
    width: '100%',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
  },
});
