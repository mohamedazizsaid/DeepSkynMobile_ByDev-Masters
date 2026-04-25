import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Image, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
  Easing,
  FadeIn,
  FadeInUp,
  ZoomIn,
} from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights } from '../../theme';

const { width: screenWidth } = Dimensions.get('window');

// Face zones mapping (percentages of face image dimensions)
const FACE_ZONES: Record<string, { x: number; y: number }> = {
  forehead: { x: 50, y: 15 },
  left_cheek: { x: 25, y: 50 },
  right_cheek: { x: 75, y: 50 },
  nose: { x: 50, y: 45 },
  chin: { x: 50, y: 80 },
  left_eye: { x: 35, y: 30 },
  right_eye: { x: 65, y: 30 },
  mouth: { x: 50, y: 70 },
  jawline_left: { x: 20, y: 65 },
  jawline_right: { x: 80, y: 65 },
};

// Condition to zone mapping
const CONDITION_ZONES: Record<string, string[]> = {
  acne: ['forehead', 'left_cheek', 'right_cheek', 'chin'],
  wrinkles: ['forehead', 'left_eye', 'right_eye'],
  dark_spots: ['left_cheek', 'right_cheek', 'forehead'],
  hyperpigmentation: ['left_cheek', 'right_cheek'],
  redness: ['nose', 'left_cheek', 'right_cheek'],
  dryness: ['left_cheek', 'right_cheek', 'forehead'],
  oiliness: ['forehead', 'nose', 'chin'],
  pores: ['nose', 'left_cheek', 'right_cheek'],
  dark_circles: ['left_eye', 'right_eye'],
  fine_lines: ['left_eye', 'right_eye', 'forehead'],
  blackheads: ['nose', 'chin'],
  texture: ['left_cheek', 'right_cheek'],
  dehydration: ['left_cheek', 'right_cheek'],
  sensitivity: ['left_cheek', 'right_cheek', 'forehead'],
  sun_damage: ['forehead', 'nose', 'left_cheek', 'right_cheek'],
};

// Condition severity colors
const SEVERITY_COLORS: Record<string, string> = {
  severe: Colors.error,
  moderate: Colors.warning,
  mild: '#F59E0B', // amber
  low: Colors.success,
};

// Condition icons
const CONDITION_ICONS: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  acne: 'circle-multiple-outline',
  wrinkles: 'waves',
  dark_spots: 'circle-half-full',
  hyperpigmentation: 'palette',
  redness: 'fire',
  dryness: 'water-off',
  oiliness: 'water',
  pores: 'dots-grid',
  dark_circles: 'eye-circle-outline',
  fine_lines: 'chart-line-variant',
  blackheads: 'dots-circle',
  texture: 'texture-box',
  dehydration: 'cup-water',
  sensitivity: 'alert-circle-outline',
  sun_damage: 'white-balance-sunny',
};

export interface FaceTag {
  id: string;
  condition: string;
  label: string;
  severity: 'severe' | 'moderate' | 'mild' | 'low';
  confidence: number; // 0-100
  zone: string;
  description?: string;
}

interface FaceTagsOverlayProps {
  imageUri: string;
  tags: FaceTag[];
  imageWidth?: number;
  imageHeight?: number;
  showConnectors?: boolean;
  onTagPress?: (tag: FaceTag) => void;
  animateOnMount?: boolean;
}

export function FaceTagsOverlay({
  imageUri,
  tags,
  imageWidth = screenWidth - Spacing.lg * 2,
  imageHeight = (screenWidth - Spacing.lg * 2) * 1.3,
  showConnectors = true,
  onTagPress,
  animateOnMount = true,
}: FaceTagsOverlayProps) {
  const [selectedTag, setSelectedTag] = useState<FaceTag | null>(null);
  const [containerDimensions, setContainerDimensions] = useState({ width: imageWidth, height: imageHeight });

  // Group tags by zone to avoid overlaps
  const tagsWithPositions = React.useMemo(() => {
    const zoneUsage: Record<string, number> = {};
    
    return tags.map((tag, index) => {
      const zone = FACE_ZONES[tag.zone] || FACE_ZONES.forehead;
      const usageCount = zoneUsage[tag.zone] || 0;
      zoneUsage[tag.zone] = usageCount + 1;
      
      // Offset overlapping tags
      const offsetX = usageCount * 15;
      const offsetY = usageCount * 10;
      
      return {
        ...tag,
        position: {
          x: (zone.x / 100) * containerDimensions.width + offsetX,
          y: (zone.y / 100) * containerDimensions.height + offsetY,
        },
        delay: animateOnMount ? index * 150 : 0,
      };
    });
  }, [tags, containerDimensions, animateOnMount]);

  const handleTagPress = (tag: FaceTag) => {
    setSelectedTag(selectedTag?.id === tag.id ? null : tag);
    onTagPress?.(tag);
  };

  return (
    <View style={styles.container}>
      {/* Face Image */}
      <View 
        style={[styles.imageContainer, { width: containerDimensions.width, height: containerDimensions.height }]}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setContainerDimensions({ width, height });
        }}
      >
        <Image
          source={{ uri: imageUri }}
          style={styles.faceImage}
          resizeMode="cover"
        />

        {/* Dark overlay for better tag visibility */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.4)']}
          style={styles.imageOverlay}
        />

        {/* Tags */}
        {tagsWithPositions.map((tag, index) => (
          <FaceTagMarker
            key={tag.id}
            tag={tag}
            index={index}
            position={tag.position}
            delay={tag.delay}
            isSelected={selectedTag?.id === tag.id}
            showConnector={showConnectors}
            containerWidth={containerDimensions.width}
            onPress={() => handleTagPress(tag)}
          />
        ))}
      </View>

      {/* Selected tag details */}
      {selectedTag && (
        <Animated.View entering={FadeInUp.duration(300)} style={styles.tagDetailsContainer}>
          <LinearGradient
            colors={[`${SEVERITY_COLORS[selectedTag.severity]}20`, Colors.gray800]}
            style={styles.tagDetailsGradient}
          >
            <View style={styles.tagDetailsHeader}>
              <View style={[styles.tagDetailsSeverity, { backgroundColor: SEVERITY_COLORS[selectedTag.severity] }]}>
                <MaterialCommunityIcons
                  name={CONDITION_ICONS[selectedTag.condition] || 'help-circle-outline'}
                  size={20}
                  color={Colors.white}
                />
              </View>
              <View style={styles.tagDetailsTextContainer}>
                <Text style={styles.tagDetailsLabel}>{selectedTag.label}</Text>
                <Text style={styles.tagDetailsSeverityText}>
                  {selectedTag.severity.charAt(0).toUpperCase() + selectedTag.severity.slice(1)} • 
                  {selectedTag.confidence}% confiance
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedTag(null)} style={styles.closeButton}>
                <Ionicons name="close" size={20} color={Colors.gray400} />
              </TouchableOpacity>
            </View>
            {selectedTag.description && (
              <Text style={styles.tagDetailsDescription}>{selectedTag.description}</Text>
            )}
            <View style={styles.tagDetailsZone}>
              <Ionicons name="location-outline" size={14} color={Colors.gray500} />
              <Text style={styles.tagDetailsZoneText}>
                Zone: {selectedTag.zone.replace('_', ' ')}
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>
      )}

      {/* Legend */}
      <View style={styles.legendContainer}>
        <Text style={styles.legendTitle}>Légende</Text>
        <View style={styles.legendItems}>
          {Object.entries(SEVERITY_COLORS).map(([severity, color]) => (
            <View key={severity} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: color }]} />
              <Text style={styles.legendText}>{severity}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

interface FaceTagMarkerProps {
  tag: FaceTag & { position: { x: number; y: number } };
  index: number;
  position: { x: number; y: number };
  delay: number;
  isSelected: boolean;
  showConnector: boolean;
  containerWidth: number;
  onPress: () => void;
}

function FaceTagMarker({
  tag,
  index,
  position,
  delay,
  isSelected,
  showConnector,
  containerWidth,
  onPress,
}: FaceTagMarkerProps) {
  const scale = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    // Entrance animation
    scale.value = withDelay(
      delay,
      withSpring(1, { damping: 12, stiffness: 150 })
    );

    // Continuous pulse for attention
    pulseScale.value = withDelay(
      delay + 500,
      withSequence(
        withTiming(1.2, { duration: 800 }),
        withTiming(1, { duration: 800 })
      )
    );
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const severityColor = SEVERITY_COLORS[tag.severity] || Colors.primary;
  const isLeftSide = position.x < containerWidth / 2;

  // Calculate label position
  const labelOffset = isLeftSide ? -120 : 40;

  return (
    <Animated.View 
      style={[
        styles.tagMarkerContainer,
        { left: position.x, top: position.y },
        animatedStyle,
      ]}
    >
      {/* Pulse ring */}
      <Animated.View 
        style={[
          styles.pulseRing,
          { borderColor: severityColor },
          animatedPulseStyle,
        ]} 
      />

      {/* Main marker */}
      <TouchableOpacity
        style={[
          styles.tagMarker,
          { backgroundColor: severityColor },
          isSelected && styles.tagMarkerSelected,
        ]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons
          name={CONDITION_ICONS[tag.condition] || 'help-circle-outline'}
          size={14}
          color={Colors.white}
        />
      </TouchableOpacity>

      {/* Connector line */}
      {showConnector && (
        <View 
          style={[
            styles.connectorLine,
            { 
              backgroundColor: severityColor,
              width: isLeftSide ? 40 : 40,
              left: isLeftSide ? -40 : 28,
            },
          ]} 
        />
      )}

      {/* Label */}
      <View 
        style={[
          styles.tagLabel,
          { 
            left: labelOffset,
            backgroundColor: `${severityColor}CC`,
          },
          isSelected && styles.tagLabelSelected,
        ]}
      >
        <Text style={styles.tagLabelText} numberOfLines={1}>
          {tag.label}
        </Text>
        <View style={styles.confidenceBadge}>
          <Text style={styles.confidenceText}>{tag.confidence}%</Text>
        </View>
      </View>
    </Animated.View>
  );
}

// Helper function to create tags from analysis results
export function createFaceTagsFromAnalysis(analysisResult: any): FaceTag[] {
  const tags: FaceTag[] = [];
  
  if (!analysisResult?.detectedConditions) return tags;

  analysisResult.detectedConditions.forEach((condition: any, index: number) => {
    const conditionKey = condition.name?.toLowerCase().replace(/\s+/g, '_') || 'unknown';
    const zones = CONDITION_ZONES[conditionKey] || ['forehead'];
    
    // Pick a zone based on affected areas or use primary zone
    let zone = zones[0];
    if (condition.affectedAreas?.length > 0) {
      const areaKey = condition.affectedAreas[0].toLowerCase().replace(/\s+/g, '_');
      if (FACE_ZONES[areaKey]) {
        zone = areaKey;
      }
    }

    // Map severity
    let severity: 'severe' | 'moderate' | 'mild' | 'low' = 'mild';
    const severityValue = condition.severity?.toLowerCase() || '';
    if (severityValue.includes('severe') || severityValue.includes('high')) severity = 'severe';
    else if (severityValue.includes('moderate') || severityValue.includes('medium')) severity = 'moderate';
    else if (severityValue.includes('mild') || severityValue.includes('low')) severity = 'mild';
    else severity = 'low';

    tags.push({
      id: `tag-${index}`,
      condition: conditionKey,
      label: condition.name || 'Unknown Condition',
      severity,
      confidence: condition.confidence || Math.floor(Math.random() * 20) + 75,
      zone,
      description: condition.description || condition.recommendation,
    });
  });

  return tags;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    zIndex: 999,
    elevation: 999,
  },
  imageContainer: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    backgroundColor: Colors.gray800,
  },
  faceImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  tagMarkerContainer: {
    position: 'absolute',
    zIndex: 100,
    elevation: 100,
    alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    opacity: 0.3,
  },
  tagMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  tagMarkerSelected: {
    transform: [{ scale: 1.2 }],
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  connectorLine: {
    position: 'absolute',
    height: 2,
    top: 13,
    borderRadius: 1,
    opacity: 0.7,
  },
  tagLabel: {
    position: 'absolute',
    top: -5,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 105,
    minWidth: 80,
    zIndex: 105,
  },
  tagLabelSelected: {
    transform: [{ scale: 1.05 }],
  },
  tagLabelText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
    color: Colors.white,
    flex: 1,
  },
  confidenceBadge: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: FontWeights.bold,
    color: Colors.white,
  },
  tagDetailsContainer: {
    marginTop: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  tagDetailsGradient: {
    padding: Spacing.md,
  },
  tagDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  tagDetailsSeverity: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagDetailsTextContainer: {
    flex: 1,
  },
  tagDetailsLabel: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.white,
  },
  tagDetailsSeverityText: {
    fontSize: FontSizes.sm,
    color: Colors.gray400,
    marginTop: 2,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  tagDetailsDescription: {
    fontSize: FontSizes.sm,
    color: Colors.gray300,
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
  tagDetailsZone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.sm,
  },
  tagDetailsZoneText: {
    fontSize: FontSizes.xs,
    color: Colors.gray500,
    textTransform: 'capitalize',
  },
  legendContainer: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.gray800,
    borderRadius: BorderRadius.lg,
  },
  legendTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.gray400,
    marginBottom: Spacing.sm,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: FontSizes.xs,
    color: Colors.gray400,
    textTransform: 'capitalize',
  },
});
