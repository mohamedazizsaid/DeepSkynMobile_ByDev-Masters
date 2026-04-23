import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
  Platform,
  Animated,
  PanResponder,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  Feather,
  MaterialCommunityIcons,
  Ionicons,
} from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccessibilityStore } from '../../stores/accessibility.store';
import { useAuthStore } from '../../stores/auth.store';
import { useAccessibilityStyles } from '../../stores/useAccessibilityStyles';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights, Shadows } from '../../theme';
import { ToggleSwitch } from './ToggleSwitch';
import { useTranslation } from '../../lib/i18n';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────────────────────
// Section Header — collapsible
// ─────────────────────────────────────────────────────────────────────────────
interface SectionHeaderProps {
  icon: React.ReactNode;
  label: string;
  isOpen?: boolean;
  onToggle?: () => void;
  textStyle?: any;
  textColor?: string;
}

function SectionHeader({ icon, label, isOpen, onToggle, textStyle, textColor }: SectionHeaderProps) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      style={styles.sectionHeader}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityState={{ expanded: isOpen }}
      accessibilityLabel={label}
    >
      {icon}
      <Text style={[styles.sectionLabel, textStyle, textColor ? { color: textColor } : null]}>{label}</Text>
      {onToggle && (
        <Feather
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={14}
          color={Colors.gray400}
        />
      )}
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Feature Card
// ─────────────────────────────────────────────────────────────────────────────
interface FeatureCardProps {
  icon: React.ReactNode;
  iconBgColor: string;
  title: string;
  description: string;
  action: React.ReactNode;
  textStyle?: any;
  titleColor?: string;
  descriptionColor?: string;
  containerStyle?: any;
}

function FeatureCard({
  icon,
  iconBgColor,
  title,
  description,
  action,
  textStyle,
  titleColor,
  descriptionColor,
  containerStyle,
}: FeatureCardProps) {
  return (
    <View style={[styles.featureCard, containerStyle]}>
      <View style={[styles.featureIconContainer, { backgroundColor: iconBgColor }]}>
        {icon}
      </View>
      <View style={styles.featureContent}>
        <Text style={[styles.featureTitle, textStyle, titleColor ? { color: titleColor } : null]}>{title}</Text>
        <Text style={[styles.featureDescription, textStyle, descriptionColor ? { color: descriptionColor } : null]}>{description}</Text>
      </View>
      <View style={styles.featureAction}>{action}</View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Contrast Button
// ─────────────────────────────────────────────────────────────────────────────
interface ContrastButtonProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
  gradient?: readonly [string, string];
}

function ContrastButton({ label, isActive, onPress, gradient }: ContrastButtonProps) {
  if (isActive && gradient) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={styles.contrastButtonWrapper}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected: true }}
      >
        <LinearGradient
          colors={[...gradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.contrastButton, styles.contrastButtonActive]}
        >
          <View style={[styles.contrastDot, { backgroundColor: Colors.white }]} />
          <Text style={[styles.contrastButtonText, { color: Colors.white }]}>{label}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.contrastButton,
        isActive && !gradient && styles.contrastButtonActiveNoGradient,
      ]}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: isActive }}
    >
      <View
        style={[
          styles.contrastDot,
          { backgroundColor: isActive ? Colors.success : Colors.gray300 },
        ]}
      />
      <Text
        style={[
          styles.contrastButtonText,
          isActive && !gradient && { color: Colors.white },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main AccessibilityPanel Component
// ─────────────────────────────────────────────────────────────────────────────
export function AccessibilityPanel() {
  const store = useAccessibilityStore();
  const { textStyle, fontSizes } = useAccessibilityStyles();
  const insets = useSafeAreaInsets();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // ── Floating Bubble Logic ──────────────────────────────────────────
  const pan = useRef(new Animated.ValueXY({
    x: SCREEN_WIDTH - 70,
    y: SCREEN_HEIGHT - (isAuthenticated ? insets.bottom + 78 : insets.bottom + 20) - 70
  })).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan as any).x._value,
          y: (pan as any).y._value
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (e, gestureState) => {
        pan.flattenOffset();
        const isTap = Math.abs(gestureState.dx) < 5 && Math.abs(gestureState.dy) < 5;

        if (isTap) {
          togglePanel?.();
          return;
        }

        const finalX = (pan as any).x._value;
        const finalY = (pan as any).y._value;

        // Snap to nearest side (Messenger style)
        const targetX = finalX > (SCREEN_WIDTH / 2 - 28) ? SCREEN_WIDTH - 66 : 10;
        const targetY = Math.min(Math.max(finalY, insets.top + 10), SCREEN_HEIGHT - insets.bottom - 80);

        Animated.spring(pan, {
          toValue: { x: targetX, y: targetY },
          useNativeDriver: false,
          friction: 7,
          tension: 40
        }).start();
      },
    })
  ).current;

  // Safe access with fallback defaults
  const theme = store?.theme ?? 'light';
  const contrastMode = store?.contrastMode ?? 'off';
  const zoomLevel = store?.zoomLevel ?? 100;
  const reduceMotion = store?.reduceMotion ?? false;
  const dyslexiaFont = store?.dyslexiaFont ?? false;
  const textSpacing = store?.textSpacing ?? false;
  const focusHighlight = store?.focusHighlight ?? false;
  const linkHighlight = store?.linkHighlight ?? false;
  const isPanelOpen = store?.isPanelOpen ?? false;
  const isSpeaking = store?.isSpeaking ?? false;
  const speechRate = store?.speechRate ?? 1.0;
  const language = store?.language ?? 'fr';

  const { t } = useTranslation();

  const toggleTheme = store?.toggleTheme;
  const setContrastMode = store?.setContrastMode;
  const resetContrastMode = store?.resetContrastMode;
  const toggleReduceMotion = store?.toggleReduceMotion;
  const toggleDyslexiaFont = store?.toggleDyslexiaFont;
  const toggleTextSpacing = store?.toggleTextSpacing;
  const toggleFocusHighlight = store?.toggleFocusHighlight;
  const toggleLinkHighlight = store?.toggleLinkHighlight;
  const zoomIn = store?.zoomIn;
  const zoomOut = store?.zoomOut;
  const resetZoom = store?.resetZoom;
  const togglePanel = store?.togglePanel;
  const closePanel = store?.closePanel;
  const speak = store?.speak;
  const stopSpeaking = store?.stopSpeaking;
  const setSpeechRate = store?.setSpeechRate;
  const setLanguage = store?.setLanguage;
  const resetAll = store?.resetAll;

  const [openSections, setOpenSections] = useState({
    appearance: true,
    vision: true,
    speech: false,
    language: false,
  });

  const toggle = useCallback((key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleResetAll = useCallback(() => {
    resetAll();
  }, [resetAll]);

  const handleTestSpeech = useCallback(() => {
    const testTexts: Record<string, string> = {
      fr: 'Bonjour, ceci est un test de synthèse vocale DeepSkyn.',
      en: 'Hello, this is a DeepSkyn text-to-speech test.',
      ar: 'مرحبا، هذا اختبار تحويل النص إلى كلام.',
    };
    stopSpeaking();
    setTimeout(() => {
      speak(testTexts[language] || testTexts.fr);
    }, 120);
  }, [speak, stopSpeaking, language]);

  const languageOptions = [
    { code: 'fr' as const, label: 'Français', flag: '🇫🇷' },
    { code: 'en' as const, label: 'English', flag: '🇬🇧' },
    { code: 'ar' as const, label: 'العربية', flag: '🇸🇦' },
  ];

  const isDark = theme === 'dark';
  const fabBottom = isAuthenticated ? insets.bottom + 78 : insets.bottom + 20;

  // ── FAB (Floating Action Button) ──────────────────────────────────────
  if (!isPanelOpen) {
    return (
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.fab,
          {
            transform: pan.getTranslateTransform(),
            bottom: undefined, // Override static bottom
            right: undefined,  // Override static right
            top: 0,
            left: 0,
          }
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          accessibilityLabel={t.accessibility.openPanel}
          accessibilityRole="button"
          onPress={togglePanel}
        >
          <LinearGradient
            colors={['#0EA5E9', '#06B6D4']}
            style={styles.fabGradient}
          >
            <Ionicons name="accessibility" size={26} color={Colors.white} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // ── Panel ─────────────────────────────────────────────────────────────
  return (
    <Modal
      visible={isPanelOpen}
      transparent
      animationType={reduceMotion ? 'none' : 'slide'}
      onRequestClose={closePanel}
      accessibilityViewIsModal
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={closePanel}
          accessible={false}
          importantForAccessibility="no-hide-descendants"
        />

        <View style={styles.panelContainer}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={90} tint={theme} style={styles.panel}>
              <PanelContent
                theme={theme}
                contrastMode={contrastMode}
                zoomLevel={zoomLevel}
                reduceMotion={reduceMotion}
                dyslexiaFont={dyslexiaFont}
                textSpacing={textSpacing}
                focusHighlight={focusHighlight}
                linkHighlight={linkHighlight}
                isSpeaking={isSpeaking}
                speechRate={speechRate}
                language={language}
                openSections={openSections}
                toggleTheme={toggleTheme}
                setContrastMode={setContrastMode}
                toggleReduceMotion={toggleReduceMotion}
                toggleDyslexiaFont={toggleDyslexiaFont}
                toggleTextSpacing={toggleTextSpacing}
                toggleFocusHighlight={toggleFocusHighlight}
                toggleLinkHighlight={toggleLinkHighlight}
                zoomIn={zoomIn}
                zoomOut={zoomOut}
                resetZoom={resetZoom}
                stopSpeaking={stopSpeaking}
                setSpeechRate={setSpeechRate}
                setLanguage={setLanguage}
                handleTestSpeech={handleTestSpeech}
                languageOptions={languageOptions}
                closePanel={closePanel}
                handleResetAll={handleResetAll}
                toggle={toggle}
                textStyle={textStyle}
                dynamicFontSizes={fontSizes}
              />
            </BlurView>
          ) : (
            <View style={[styles.panel, styles.panelAndroid]}>
              <PanelContent
                theme={theme}
                contrastMode={contrastMode}
                zoomLevel={zoomLevel}
                reduceMotion={reduceMotion}
                dyslexiaFont={dyslexiaFont}
                textSpacing={textSpacing}
                focusHighlight={focusHighlight}
                linkHighlight={linkHighlight}
                isSpeaking={isSpeaking}
                speechRate={speechRate}
                language={language}
                openSections={openSections}
                toggleTheme={toggleTheme}
                setContrastMode={setContrastMode}
                toggleReduceMotion={toggleReduceMotion}
                toggleDyslexiaFont={toggleDyslexiaFont}
                toggleTextSpacing={toggleTextSpacing}
                toggleFocusHighlight={toggleFocusHighlight}
                toggleLinkHighlight={toggleLinkHighlight}
                zoomIn={zoomIn}
                zoomOut={zoomOut}
                resetZoom={resetZoom}
                stopSpeaking={stopSpeaking}
                setSpeechRate={setSpeechRate}
                setLanguage={setLanguage}
                handleTestSpeech={handleTestSpeech}
                languageOptions={languageOptions}
                closePanel={closePanel}
                handleResetAll={handleResetAll}
                toggle={toggle}
                textStyle={textStyle}
                dynamicFontSizes={fontSizes}
              />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Panel Content (extracted for reuse with BlurView)
// ─────────────────────────────────────────────────────────────────────────────
interface PanelContentProps {
  theme: 'light' | 'dark';
  contrastMode: 'off' | 'medium' | 'high';
  zoomLevel: number;
  reduceMotion: boolean;
  dyslexiaFont: boolean;
  textSpacing: boolean;
  focusHighlight: boolean;
  linkHighlight: boolean;
  isSpeaking: boolean;
  speechRate: number;
  language: 'fr' | 'en' | 'ar';
  openSections: { appearance: boolean; vision: boolean; speech: boolean; language: boolean };
  toggleTheme: () => void;
  setContrastMode: (mode: 'off' | 'medium' | 'high') => void;
  toggleReduceMotion: () => void;
  toggleDyslexiaFont: () => void;
  toggleTextSpacing: () => void;
  toggleFocusHighlight: () => void;
  toggleLinkHighlight: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  stopSpeaking: () => void;
  setSpeechRate: (rate: number) => void;
  setLanguage: (language: 'fr' | 'en' | 'ar') => void;
  handleTestSpeech: () => void;
  languageOptions: Array<{ code: 'fr' | 'en' | 'ar'; label: string; flag: string }>;
  closePanel: () => void;
  handleResetAll: () => void;
  toggle: (key: 'appearance' | 'vision' | 'speech' | 'language') => void;
  textStyle: any;
  dynamicFontSizes: any;
}

function PanelContent({
  theme,
  contrastMode,
  zoomLevel,
  reduceMotion,
  dyslexiaFont,
  textSpacing,
  focusHighlight,
  linkHighlight,
  isSpeaking,
  speechRate,
  language,
  openSections,
  toggleTheme,
  setContrastMode,
  toggleReduceMotion,
  toggleDyslexiaFont,
  toggleTextSpacing,
  toggleFocusHighlight,
  toggleLinkHighlight,
  zoomIn,
  zoomOut,
  resetZoom,
  stopSpeaking,
  setSpeechRate,
  setLanguage,
  handleTestSpeech,
  languageOptions,
  closePanel,
  handleResetAll,
  toggle,
  textStyle,
  dynamicFontSizes,
}: PanelContentProps) {
  const { t } = useTranslation();
  const isDark = theme === 'dark';
  const panelThemeStyles = isDark
    ? {
      panelBackground: { backgroundColor: Colors.gray900 },
      sectionText: { color: Colors.gray300 },
      cardBackground: { backgroundColor: Colors.gray800, borderColor: Colors.gray700 },
      badgeBackground: { backgroundColor: Colors.primaryAlpha20 },
      buttonBackground: { backgroundColor: Colors.gray700 },
      trackBackground: { backgroundColor: Colors.gray700 },
    }
    : {
      panelBackground: { backgroundColor: Colors.white },
      sectionText: { color: Colors.gray400 },
      cardBackground: { backgroundColor: Colors.white, borderColor: Colors.gray200 },
      badgeBackground: { backgroundColor: Colors.primaryAlpha10 },
      buttonBackground: { backgroundColor: Colors.gray100 },
      trackBackground: { backgroundColor: Colors.gray200 },
    };

  return (
    <>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={[styles.header, panelThemeStyles.panelBackground]}>
        <View style={styles.headerLeft}>
          <LinearGradient
            colors={['#0EA5E9', '#06B6D4']}
            style={styles.headerIcon}
          >
            <Ionicons name="alert-circle" size={16} color={Colors.warning} />
          </LinearGradient>
          <View>
            <Text style={[styles.headerTitle, textStyle, { fontSize: dynamicFontSizes.base }, isDark && styles.textLight]}>
              Accessibilité
            </Text>
            <Text style={[styles.headerSubtitle, textStyle, { fontSize: dynamicFontSizes.xs }]}>Personnalisez votre expérience</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={closePanel}
          style={[styles.closeButton, isDark && styles.closeButtonDark]}
          accessibilityLabel={t.accessibility.closePanel}
        >
          <Feather name="x" size={18} color={isDark ? Colors.gray300 : Colors.gray500} />
        </TouchableOpacity>
      </View>

      <View style={[styles.divider, isDark && { backgroundColor: Colors.gray700 }]} />

      {/* ── Content ────────────────────────────────────────────────────── */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* ══════════════════════════════════════════════════════════════
            APPEARANCE
           ══════════════════════════════════════════════════════════════ */}
        <View style={styles.section}>
          <SectionHeader
            icon={<Feather name="eye" size={15} color={Colors.gray400} />}
            label={t.accessibility.appearance}
            isOpen={openSections.appearance}
            onToggle={() => toggle('appearance')}
            textStyle={textStyle}
            textColor={isDark ? Colors.gray300 : Colors.gray400}
          />

          {openSections.appearance && (
            <>
              {/* Theme Toggle */}
              <FeatureCard
                icon={
                  <Feather
                    name={isDark ? 'moon' : 'sun'}
                    size={20}
                    color={Colors.white}
                  />
                }
                iconBgColor={isDark ? Colors.indigo : Colors.amber}
                title={t.accessibility.darkMode}
                description={isDark ? t.accessibility.darkEnabled : t.accessibility.lightEnabled}
                textStyle={textStyle}
                titleColor={isDark ? Colors.white : Colors.gray900}
                descriptionColor={Colors.gray400}
                containerStyle={panelThemeStyles.cardBackground}
                action={
                  <ToggleSwitch
                    checked={isDark}
                    onChange={toggleTheme}
                    accessibilityLabel={t.accessibility.darkMode}
                  />
                }
              />

              {/* Contrast Selector */}
              <View
                style={[
                  styles.featureCard,
                  panelThemeStyles.cardBackground,
                  { marginTop: Spacing.sm, flexDirection: 'column', alignItems: 'stretch' },
                ]}
              >
                <View style={styles.contrastHeader}>
                  <View style={[styles.featureIconContainer, { backgroundColor: Colors.warningAlpha10 }]}>
                    <MaterialCommunityIcons name="contrast-circle" size={20} color={Colors.warning} />
                  </View>
                  <View style={styles.featureContent}>
                    <Text style={[styles.featureTitle, isDark && styles.textLight]}>
                      {t.accessibility.highContrast}
                    </Text>
                    <Text style={styles.featureDescription}>
                      {t.accessibility.improveReadability}
                    </Text>
                  </View>
                </View>

                <View style={styles.contrastButtons}>
                  <ContrastButton
                    label={t.accessibility.contrastNormal}
                    isActive={contrastMode === 'off'}
                    onPress={() => setContrastMode('off')}
                  />
                  <ContrastButton
                    label={t.accessibility.contrastMedium}
                    isActive={contrastMode === 'medium'}
                    onPress={() => setContrastMode('medium')}
                    gradient={['#F59E0B', '#EA580C']}
                  />
                  <ContrastButton
                    label={t.accessibility.contrastHigh}
                    isActive={contrastMode === 'high'}
                    onPress={() => setContrastMode('high')}
                    gradient={['#FBBF24', '#F59E0B']}
                  />
                </View>

                {contrastMode !== 'off' && (
                  <View style={styles.contrastInfo}>
                    <MaterialCommunityIcons
                      name="contrast-circle"
                      size={12}
                      color={Colors.warning}
                    />
                    <Text style={styles.contrastInfoText}>
                      {contrastMode === 'medium'
                        ? t.accessibility.contrastMediumActive
                        : t.accessibility.contrastHighActive}
                    </Text>
                  </View>
                )}
              </View>

              {/* Zoom Controls */}
              <View
                style={[
                  styles.featureCard,
                  panelThemeStyles.cardBackground,
                  { marginTop: Spacing.sm, flexDirection: 'column', alignItems: 'stretch' },
                ]}
              >
                <View style={styles.zoomHeader}>
                  <View style={[styles.featureIconContainer, { backgroundColor: Colors.successAlpha10 }]}>
                    <Feather name="type" size={18} color={Colors.success} />
                  </View>
                  <Text style={[styles.featureTitle, isDark && styles.textLight, { flex: 1 }]}>
                    {t.accessibility.textSize}
                  </Text>
                  <View style={[styles.zoomBadge, panelThemeStyles.badgeBackground]}>
                    <Text style={styles.zoomBadgeText}>{zoomLevel}%</Text>
                  </View>
                </View>

                <View style={styles.zoomControls}>
                  <TouchableOpacity
                    onPress={zoomOut}
                    disabled={zoomLevel <= 75}
                    style={[styles.zoomButton, panelThemeStyles.buttonBackground, zoomLevel <= 75 && styles.zoomButtonDisabled]}
                    accessibilityLabel="Réduire le zoom"
                  >
                    <Feather name="zoom-out" size={16} color={Colors.gray700} />
                  </TouchableOpacity>

                  <View style={[styles.zoomTrack, panelThemeStyles.trackBackground]}>
                    <View
                      style={[
                        styles.zoomProgress,
                        { width: `${((zoomLevel - 75) / 75) * 100}%` },
                      ]}
                    />
                  </View>

                  <TouchableOpacity
                    onPress={zoomIn}
                    disabled={zoomLevel >= 150}
                    style={[styles.zoomButton, panelThemeStyles.buttonBackground, zoomLevel >= 150 && styles.zoomButtonDisabled]}
                    accessibilityLabel="Augmenter le zoom"
                  >
                    <Feather name="zoom-in" size={16} color={Colors.gray700} />
                  </TouchableOpacity>
                </View>

                {zoomLevel !== 100 && (
                  <TouchableOpacity onPress={resetZoom} style={styles.resetZoomButton}>
                    <Feather name="rotate-ccw" size={12} color={Colors.gray400} />
                    <Text style={styles.resetZoomText}>{t.accessibility.resetZoom}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </View>

        {/* ══════════════════════════════════════════════════════════════
            VISION
           ══════════════════════════════════════════════════════════════ */}
        <View style={styles.section}>
          <SectionHeader
            icon={<MaterialCommunityIcons name="eye-outline" size={15} color={Colors.gray400} />}
            label="VISION"
            isOpen={openSections.vision}
            onToggle={() => toggle('vision')}
            textStyle={textStyle}
            textColor={isDark ? Colors.gray300 : Colors.gray400}
          />

          {openSections.vision && (
            <>
              <FeatureCard
                icon={<Feather name="pause" size={18} color={Colors.white} />}
                iconBgColor={Colors.purple}
                title={t.accessibility.reduceAnimations}
                description={t.accessibility.reduceAnimationsDesc}
                textStyle={textStyle}
                titleColor={isDark ? Colors.white : Colors.gray900}
                descriptionColor={Colors.gray400}
                containerStyle={panelThemeStyles.cardBackground}
                action={
                  <ToggleSwitch
                    checked={reduceMotion}
                    onChange={toggleReduceMotion}
                    accessibilityLabel={t.accessibility.reduceAnimations}
                  />
                }
              />

              <View style={{ height: Spacing.sm }} />

              <FeatureCard
                icon={<MaterialCommunityIcons name="format-font" size={18} color={Colors.white} />}
                iconBgColor={Colors.info}
                title={t.accessibility.dyslexiaFont}
                description={t.accessibility.dyslexiaFontDesc}
                textStyle={textStyle}
                titleColor={isDark ? Colors.white : Colors.gray900}
                descriptionColor={Colors.gray400}
                containerStyle={panelThemeStyles.cardBackground}
                action={
                  <ToggleSwitch
                    checked={dyslexiaFont}
                    onChange={toggleDyslexiaFont}
                    accessibilityLabel={t.accessibility.dyslexiaFont}
                  />
                }
              />

              <View style={{ height: Spacing.sm }} />

              <FeatureCard
                icon={<MaterialCommunityIcons name="format-line-spacing" size={18} color={Colors.white} />}
                iconBgColor={Colors.teal}
                title={t.accessibility.textSpacing}
                description={t.accessibility.textSpacingDesc}
                textStyle={textStyle}
                titleColor={isDark ? Colors.white : Colors.gray900}
                descriptionColor={Colors.gray400}
                containerStyle={panelThemeStyles.cardBackground}
                action={
                  <ToggleSwitch
                    checked={textSpacing}
                    onChange={toggleTextSpacing}
                    accessibilityLabel={t.accessibility.textSpacing}
                  />
                }
              />

              <View style={{ height: Spacing.sm }} />

              <FeatureCard
                icon={<Feather name="target" size={18} color={Colors.white} />}
                iconBgColor={Colors.warning}
                title={t.accessibility.focusIndicator}
                description={t.accessibility.focusIndicatorDesc}
                textStyle={textStyle}
                titleColor={isDark ? Colors.white : Colors.gray900}
                descriptionColor={Colors.gray400}
                containerStyle={panelThemeStyles.cardBackground}
                action={
                  <ToggleSwitch
                    checked={focusHighlight}
                    onChange={toggleFocusHighlight}
                    accessibilityLabel={t.accessibility.focusIndicator}
                  />
                }
              />

              <View style={{ height: Spacing.sm }} />

              <FeatureCard
                icon={<Feather name="link" size={18} color={Colors.white} />}
                iconBgColor={Colors.pink}
                title={t.accessibility.highlightLinks}
                description={t.accessibility.highlightLinksDesc}
                textStyle={textStyle}
                titleColor={isDark ? Colors.white : Colors.gray900}
                descriptionColor={Colors.gray400}
                containerStyle={panelThemeStyles.cardBackground}
                action={
                  <ToggleSwitch
                    checked={linkHighlight}
                    onChange={toggleLinkHighlight}
                    accessibilityLabel={t.accessibility.highlightLinks}
                  />
                }
              />
            </>
          )}
        </View>

        {/* ══════════════════════════════════════════════════════════════
            TEXT-TO-SPEECH
           ══════════════════════════════════════════════════════════════ */}
        <View style={styles.section}>
          <SectionHeader
            icon={<Feather name="volume-2" size={15} color={Colors.gray400} />}
            label={t.accessibility.voiceReading}
            isOpen={openSections.speech}
            onToggle={() => toggle('speech')}
            textStyle={textStyle}
            textColor={isDark ? Colors.gray300 : Colors.gray400}
          />

          {openSections.speech && (
            <>
              <View style={[styles.featureCard, panelThemeStyles.cardBackground, { flexDirection: 'column', alignItems: 'stretch' }]}>
                <View style={styles.ttsHeader}>
                  <View style={[styles.featureIconContainer, { backgroundColor: Colors.primaryAlpha10 }]}>
                    <MaterialCommunityIcons name="volume-high" size={18} color={Colors.primary} />
                  </View>
                  <Text style={[styles.featureTitle, isDark && styles.textLight, { flex: 1 }]}>
                    {t.accessibility.voiceReading}
                  </Text>
                </View>

                <View style={styles.ttsControls}>
                  <TouchableOpacity
                    onPress={handleTestSpeech}
                    disabled={isSpeaking}
                    style={[styles.ttsButton, panelThemeStyles.buttonBackground, isSpeaking && styles.ttsButtonDisabled]}
                    accessibilityLabel="Tester la lecture vocale"
                  >
                    <Feather name="play" size={16} color={isSpeaking ? Colors.gray400 : Colors.primary} />
                    <Text style={[styles.ttsButtonText, isSpeaking && styles.ttsButtonTextDisabled]}>
                      {t.accessibility.readSelected}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={stopSpeaking}
                    disabled={!isSpeaking}
                    style={[styles.ttsButton, panelThemeStyles.buttonBackground, !isSpeaking && styles.ttsButtonDisabled]}
                    accessibilityLabel="Arrêter la lecture"
                  >
                    <Feather name="square" size={16} color={!isSpeaking ? Colors.gray400 : Colors.error} />
                    <Text style={[styles.ttsButtonText, !isSpeaking && styles.ttsButtonTextDisabled]}>
                      {t.accessibility.stop}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.speechRateContainer}>
                  <Text style={[styles.speechRateLabel, isDark && styles.textLight]}>
                    Vitesse: {speechRate.toFixed(1)}x
                  </Text>
                  <View style={styles.speechRateControls}>
                    <TouchableOpacity
                      onPress={() => setSpeechRate(Math.max(0.5, speechRate - 0.25))}
                      disabled={speechRate <= 0.5}
                      style={[styles.zoomButton, panelThemeStyles.buttonBackground, speechRate <= 0.5 && styles.zoomButtonDisabled]}
                      accessibilityLabel="Réduire la vitesse"
                    >
                      <Feather name="minus" size={14} color={Colors.gray700} />
                    </TouchableOpacity>

                    <View style={[styles.zoomTrack, panelThemeStyles.trackBackground]}>
                      <View
                        style={[
                          styles.zoomProgress,
                          { width: `${((speechRate - 0.5) / 1.5) * 100}%` },
                        ]}
                      />
                    </View>

                    <TouchableOpacity
                      onPress={() => setSpeechRate(Math.min(2, speechRate + 0.25))}
                      disabled={speechRate >= 2}
                      style={[styles.zoomButton, panelThemeStyles.buttonBackground, speechRate >= 2 && styles.zoomButtonDisabled]}
                      accessibilityLabel="Augmenter la vitesse"
                    >
                      <Feather name="plus" size={14} color={Colors.gray700} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </>
          )}
        </View>

        {/* ══════════════════════════════════════════════════════════════
            LANGUE
           ══════════════════════════════════════════════════════════════ */}
        <View style={styles.section}>
          <SectionHeader
            icon={<MaterialCommunityIcons name="translate" size={15} color={Colors.gray400} />}
            label={t.accessibility.language}
            isOpen={openSections.language}
            onToggle={() => toggle('language')}
            textStyle={textStyle}
            textColor={isDark ? Colors.gray300 : Colors.gray400}
          />

          {openSections.language && (
            <View style={styles.languageGrid}>
              {languageOptions.map((option) => (
                <TouchableOpacity
                  key={option.code}
                  onPress={() => setLanguage(option.code as 'fr' | 'en' | 'ar')}
                  style={[
                    styles.languageCard,
                    language === option.code && styles.languageCardActive,
                    isDark && styles.languageCardDark,
                  ]}
                  accessibilityLabel={`Sélectionner ${option.label}`}
                  accessibilityState={{ selected: language === option.code }}
                >
                  <Text style={styles.languageFlag}>{option.flag}</Text>
                  <Text style={[
                    styles.languageLabel,
                    language === option.code && styles.languageLabelActive,
                    isDark && styles.textLight,
                  ]}>
                    {option.label}
                  </Text>
                  {language === option.code && (
                    <Feather name="check-circle" size={14} color={Colors.primary} style={styles.languageCheck} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* ══════════════════════════════════════════════════════════════
            RESET
           ══════════════════════════════════════════════════════════════ */}
        <TouchableOpacity onPress={handleResetAll} style={[styles.resetButton, isDark && styles.resetButtonDark]}>
          <Feather name="rotate-ccw" size={14} color={isDark ? Colors.gray300 : Colors.gray500} />
          <Text style={[styles.resetButtonText, isDark && styles.resetButtonTextDark]}>{t.accessibility.resetSettings}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <View style={[styles.footer, isDark && styles.footerDark]}>
        <Text style={[styles.footerText, isDark && styles.footerTextDark]}>DeepSkyn Accessibility Engine</Text>
      </View>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    zIndex: 9999,
    ...Shadows.xl,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  panelContainer: {
    minHeight: SCREEN_HEIGHT * 0.7,
    maxHeight: SCREEN_HEIGHT * 0.85,
  },
  panel: {
    flex: 1,
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
  },
  panelAndroid: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.base,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.base,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  headerTitle: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.gray900,
  },
  headerSubtitle: {
    fontSize: FontSizes.xs,
    color: Colors.gray400,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonDark: {
    backgroundColor: Colors.gray800,
  },

  divider: {
    height: 1,
    backgroundColor: Colors.gray200,
    marginHorizontal: Spacing.lg,
  },

  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing['2xl'],
  },

  // Sections
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  sectionLabel: {
    flex: 1,
    fontSize: 11,
    fontWeight: FontWeights.bold,
    letterSpacing: 1,
    color: Colors.gray400,
  },

  // Feature Card
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.base,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray200,
    gap: Spacing.md,
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.gray900,
  },
  featureDescription: {
    fontSize: 11,
    color: Colors.gray400,
    marginTop: 2,
  },
  featureAction: {
    marginLeft: Spacing.sm,
  },

  // Contrast
  contrastHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
    width: '100%',
  },
  contrastButtons: {
    flexDirection: 'row',
    gap: Spacing.xs,
    width: '100%',
  },
  contrastButtonWrapper: {
    flex: 1,
  },
  contrastButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.gray100,
    gap: 5,
  },
  contrastButtonActive: {
    ...Shadows.sm,
  },
  contrastButtonActiveNoGradient: {
    backgroundColor: Colors.gray900,
  },
  contrastDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  contrastButtonText: {
    fontSize: 11,
    fontWeight: FontWeights.semibold,
    color: Colors.gray500,
  },
  contrastInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.warningAlpha10,
    gap: Spacing.xs,
  },
  contrastInfoText: {
    fontSize: 10,
    fontWeight: FontWeights.medium,
    color: Colors.warning,
  },

  // Zoom
  zoomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    width: '100%',
  },
  zoomBadge: {
    backgroundColor: Colors.primaryAlpha10,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  zoomBadgeText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: Colors.primary,
  },
  zoomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    width: '100%',
  },
  zoomButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.base,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomButtonDisabled: {
    opacity: 0.3,
  },
  zoomTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.gray200,
    overflow: 'hidden',
  },
  zoomProgress: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  resetZoomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
  },
  resetZoomText: {
    fontSize: 11,
    color: Colors.gray400,
    fontWeight: FontWeights.medium,
  },

  // Reset All
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.base,
    backgroundColor: Colors.gray50,
    gap: Spacing.sm,
  },
  resetButtonDark: {
    backgroundColor: Colors.gray800,
  },
  resetButtonText: {
    fontSize: FontSizes.sm,
    color: Colors.gray500,
    fontWeight: FontWeights.medium,
  },
  resetButtonTextDark: {
    color: Colors.gray300,
  },

  // Footer
  footer: {
    paddingVertical: Spacing.base,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
    backgroundColor: Colors.gray50,
  },
  footerDark: {
    borderTopColor: Colors.gray700,
    backgroundColor: Colors.gray900,
  },
  footerText: {
    fontSize: 10,
    fontWeight: FontWeights.bold,
    color: Colors.gray400,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  footerTextDark: {
    color: Colors.gray500,
  },

  // Text variants
  textLight: {
    color: Colors.white,
  },

  // TTS Styles
  ttsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    width: '100%',
  },
  ttsControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  ttsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.base,
    backgroundColor: Colors.gray100,
  },
  ttsButtonDisabled: {
    opacity: 0.5,
  },
  ttsButtonText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.gray700,
  },
  ttsButtonTextDisabled: {
    color: Colors.gray400,
  },
  speechRateContainer: {
    width: '100%',
  },
  speechRateLabel: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
    color: Colors.gray600,
    marginBottom: Spacing.xs,
  },
  speechRateControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },

  // Language Styles
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  languageCard: {
    flex: 1,
    minWidth: '30%',
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.gray100,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryAlpha10,
  },
  languageCardDark: {
    backgroundColor: Colors.gray800,
  },
  languageFlag: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  languageLabel: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
    color: Colors.gray700,
    textAlign: 'center',
  },
  languageLabelActive: {
    color: Colors.primary,
    fontWeight: FontWeights.bold,
  },
  languageCheck: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
  },
});
