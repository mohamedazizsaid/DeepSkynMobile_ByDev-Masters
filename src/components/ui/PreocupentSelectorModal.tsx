import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { Svg, Path, Ellipse, Defs, Filter, FeGaussianBlur } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Colors, Spacing, BorderRadius, FontWeights, Shadows } from '../../theme';
import { useAccessibilityStyles } from '../../stores/useAccessibilityStyles';
import { Button } from './Button';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const DEFAULT_SELECTED: PreocupentZoneKey[] = [];

export type PreocupentZoneKey =
  | 'front'
  | 'tempes'
  | 'nez'
  | 'joues'
  | 'autour_bouche'
  | 'machoire'
  | 'menton';

export interface PreocupentZoneOption {
  key: PreocupentZoneKey;
  label: string;
}

export const PREOCUPENT_ZONE_OPTIONS: PreocupentZoneOption[] = [
  { key: 'front', label: 'Front' },
  { key: 'tempes', label: 'Tempes' },
  { key: 'nez', label: 'Nez' },
  { key: 'joues', label: 'Joues' },
  { key: 'autour_bouche', label: 'Autour de la bouche' },
  { key: 'machoire', label: 'Machoire' },
  { key: 'menton', label: 'Menton' },
];

interface PreocupentSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (zones: PreocupentZoneKey[]) => void;
  loading?: boolean;
  initialSelected?: PreocupentZoneKey[];
}

export function PreocupentSelectorModal({
  visible,
  onClose,
  onConfirm,
  loading = false,
  initialSelected = DEFAULT_SELECTED,
}: PreocupentSelectorModalProps) {
  const { colors, fontSizes } = useAccessibilityStyles();
  const [selectedZones, setSelectedZones] = useState<PreocupentZoneKey[]>(initialSelected);

  useEffect(() => {
    if (visible) {
      setSelectedZones(initialSelected);
    }
  }, [visible, initialSelected]);

  const toggleZone = (zone: PreocupentZoneKey) => {
    setSelectedZones((prev) =>
      prev.includes(zone) ? prev.filter((z) => z !== zone) : [...prev, zone]
    );
  };

  const selectedSet = useMemo(() => new Set(selectedZones), [selectedZones]);

  const handleConfirm = () => {
    onConfirm(selectedZones);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="light" />
        
        <View style={[styles.centeredView, { backgroundColor: colors.background + 'EE' }]}>
          <LinearGradient
            colors={['#0EA5E9', '#38BDF8', '#60A5FA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.topBar}
          />

          <View style={styles.content}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>

            <View style={styles.header}>
              <View style={[styles.badge, { backgroundColor: '#CCF1FF' }]}>
                <Ionicons name="sparkles" size={12} color="#0369A1" />
                <Text style={styles.badgeText}>ZONES CIBLÉES</Text>
              </View>
              <Text style={[styles.title, { color: colors.text, fontSize: fontSizes.xl }]}>
                Quelles zones vous préoccupent le plus ?
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: fontSizes.sm }]}>
                Sélectionnez les zones puis validez pour lancer votre analyse.
              </Text>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false} 
              contentContainerStyle={styles.scrollContent}
              style={styles.scrollView}
            >
              <View style={styles.visualContainer}>
                <View style={[styles.faceCard, { backgroundColor: colors.backgroundSecondary }]}>
                  <Svg viewBox="0 0 260 360" width={220} height={300}>
                    <Defs>
                      <Filter id="zoneGlow" x="-40%" y="-40%" width="180%" height="180%">
                        <FeGaussianBlur stdDeviation="7" />
                      </Filter>
                    </Defs>

                    {/* Zone Highlights */}
                    {selectedSet.has('front') && (
                      <>
                        <Ellipse cx="130" cy="92" rx="44" ry="22" fill="#38BDF8" opacity="0.4" />
                        <Ellipse cx="130" cy="92" rx="40" ry="18" fill="#38BDF8" opacity="0.6" />
                      </>
                    )}
                    {selectedSet.has('tempes') && (
                      <>
                        <Ellipse cx="76" cy="125" rx="16" ry="28" fill="#38BDF8" opacity="0.45" />
                        <Ellipse cx="184" cy="125" rx="16" ry="28" fill="#38BDF8" opacity="0.45" />
                      </>
                    )}
                    {selectedSet.has('nez') && (
                      <>
                        <Path d="M130 112 C125 128 125 149 118 172 C123 178 137 178 142 171 C136 148 137 128 130 112 Z" fill="#38BDF8" opacity="0.55" />
                      </>
                    )}
                    {selectedSet.has('joues') && (
                      <>
                        <Ellipse cx="88" cy="170" rx="24" ry="30" fill="#38BDF8" opacity="0.45" />
                        <Ellipse cx="172" cy="170" rx="24" ry="30" fill="#38BDF8" opacity="0.45" />
                      </>
                    )}
                    {selectedSet.has('autour_bouche') && (
                      <>
                        <Ellipse cx="130" cy="223" rx="32" ry="16" fill="#38BDF8" opacity="0.5" />
                      </>
                    )}
                    {selectedSet.has('machoire') && (
                      <>
                        <Ellipse cx="96" cy="248" rx="22" ry="18" fill="#38BDF8" opacity="0.4" />
                        <Ellipse cx="164" cy="248" rx="22" ry="18" fill="#38BDF8" opacity="0.4" />
                      </>
                    )}
                    {selectedSet.has('menton') && (
                      <>
                        <Ellipse cx="130" cy="272" rx="22" ry="15" fill="#38BDF8" opacity="0.5" />
                      </>
                    )}

                    {/* Face Outline */}
                    <Path
                      d="M130 35 C95 35 72 59 70 94 L68 158 C67 229 95 278 130 286 C165 278 193 229 192 158 L190 94 C188 59 165 35 130 35 Z"
                      fill="none"
                      stroke={colors.textTertiary}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path d="M79 263 C78 302 72 332 56 350" fill="none" stroke={colors.textTertiary} strokeWidth="2" strokeLinecap="round" />
                    <Path d="M181 263 C182 302 188 332 204 350" fill="none" stroke={colors.textTertiary} strokeWidth="2" strokeLinecap="round" />
                    <Path d="M95 123 C104 118 115 118 123 122" fill="none" stroke={colors.textTertiary} strokeWidth="2" strokeLinecap="round" />
                    <Path d="M137 122 C145 118 156 118 165 123" fill="none" stroke={colors.textTertiary} strokeWidth="2" strokeLinecap="round" />
                    <Path d="M130 112 C126 132 126 152 120 171" fill="none" stroke={colors.textTertiary} strokeWidth="2" strokeLinecap="round" />
                    <Path d="M111 212 C121 208 139 208 149 212" fill="none" stroke={colors.textTertiary} strokeWidth="2" strokeLinecap="round" />
                    <Path d="M107 222 C118 228 142 228 153 222" fill="none" stroke={colors.textTertiary} strokeWidth="2" strokeLinecap="round" />
                  </Svg>
                </View>
              </View>

              <View style={styles.optionsContainer}>
                <Text style={[styles.optionsLabel, { color: colors.textTertiary }]}>SÉLECTION RAPIDE</Text>
                {PREOCUPENT_ZONE_OPTIONS.map((zone) => {
                  const active = selectedSet.has(zone.key);
                  return (
                    <TouchableOpacity
                      key={zone.key}
                      onPress={() => toggleZone(zone.key)}
                      style={[
                        styles.optionButton,
                        { borderColor: active ? '#0EA5E9' : colors.border, backgroundColor: active ? '#E0F2FE' : colors.background },
                      ]}
                    >
                      <Text style={[styles.optionText, { color: active ? '#0369A1' : colors.text }]}>
                        {zone.label}
                      </Text>
                      <View style={[
                        styles.checkbox,
                        { backgroundColor: active ? '#0EA5E9' : 'transparent', borderColor: active ? '#0EA5E9' : colors.border }
                      ]}>
                        {active && <Ionicons name="checkmark" size={14} color="white" />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <View style={styles.buttonRow}>
                <TouchableOpacity onPress={onClose} style={[styles.cancelButton, { borderColor: colors.border }]}>
                  <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Annuler</Text>
                </TouchableOpacity>
                <Button
                  onPress={handleConfirm}
                  loading={loading}
                  disabled={selectedZones.length === 0}
                  style={styles.confirmButton}
                >
                  Continuer
                </Button>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  centeredView: {
    width: '100%',
    maxWidth: 500,
    height: SCREEN_HEIGHT * 0.85,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  topBar: {
    height: 6,
    width: '100%',
  },
  content: {
    padding: Spacing.lg,
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    right: Spacing.base,
    top: Spacing.base,
    zIndex: 10,
    padding: Spacing.xs,
  },
  header: {
    marginBottom: Spacing.lg,
    marginTop: Spacing.base,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
    gap: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: FontWeights.bold,
    color: '#0369A1',
    letterSpacing: 0.5,
  },
  title: {
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    lineHeight: 20,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
    flexGrow: 1,
  },
  visualContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  faceCard: {
    padding: Spacing.base,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    width: 240,
    alignItems: 'center',
  },
  optionsContainer: {
    gap: Spacing.sm,
  },
  optionsLabel: {
    fontSize: 11,
    fontWeight: FontWeights.bold,
    letterSpacing: 1,
    marginBottom: Spacing.xs,
    marginLeft: 4,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.base,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  optionText: {
    fontSize: 15,
    fontWeight: FontWeights.medium,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: FontWeights.semibold,
  },
  confirmButton: {
    flex: 1,
    height: 48,
  },
  scrollView: {
    flex: 1,
  },
});
