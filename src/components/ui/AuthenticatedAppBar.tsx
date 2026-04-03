import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Modal, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { useAuthStore } from '../../stores/auth.store';
import { useAccessibilityStyles } from '../../stores/useAccessibilityStyles';
import { useTranslation } from '../../lib/i18n';
import { Colors, BorderRadius, Shadows, Spacing } from '../../theme';

export function AuthenticatedAppBar() {
  const { logout } = useAuthStore();
  const { colors, fontSizes, textStyle, getAnimDuration, settings } = useAccessibilityStyles();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const drawerProgress = useRef(new Animated.Value(0)).current;
  const logoPulse = useRef(new Animated.Value(1)).current;
  const logoTilt = useRef(new Animated.Value(0)).current;

  const isDark = settings.theme === 'dark';

  const topGradient = useMemo(() => (
    isDark
      ? ([colors.background, colors.backgroundSecondary, colors.backgroundTertiary] as [string, string, string])
      : ([Colors.white, '#E8F7FF', '#BFE9FF'] as [string, string, string])
  ), [isDark, colors.background, colors.backgroundSecondary, colors.backgroundTertiary]);

  const topOverlayGradient = useMemo(() => (
    isDark
      ? (['rgba(255,255,255,0.03)', 'rgba(0,0,0,0.2)'] as [string, string])
      : (['rgba(255,255,255,0.0)', 'rgba(14,165,233,0.05)'] as [string, string])
  ), [isDark]);

  const brandTextColor = isDark ? colors.text : Colors.primary;
  const logoBoxBorderColor = isDark ? colors.borderStrong : 'rgba(255,255,255,0.65)';
  const logoutButtonBackground = isDark ? colors.surfaceElevated : Colors.white;
  const logoutButtonBorder = isDark ? colors.borderStrong : 'rgba(255,255,255,0.45)';

  const openDrawer = useCallback(() => {
    if (drawerVisible) {
      return;
    }
    setDrawerVisible(true);
    Animated.timing(drawerProgress, {
      toValue: 1,
      duration: getAnimDuration(220),
      useNativeDriver: true,
    }).start();
  }, [drawerVisible, drawerProgress, getAnimDuration]);

  const closeDrawer = useCallback((onClosed?: () => void) => {
    Animated.timing(drawerProgress, {
      toValue: 0,
      duration: getAnimDuration(180),
      useNativeDriver: true,
    }).start(() => {
      setDrawerVisible(false);
      if (onClosed) {
        onClosed();
      }
    });
  }, [drawerProgress, getAnimDuration]);

  const navigateTo = useCallback((action: () => void) => {
    closeDrawer(() => {
      action();
    });
  }, [closeDrawer]);

  const drawerItems = useMemo(() => ([
    {
      key: 'analysis',
      label: t.nav.analysis,
      icon: 'scan-outline' as const,
      onPress: () => navigateTo(() => navigation.navigate('Analysis')),
    },
    {
      key: 'chat',
      label: t.nav.coach,
      icon: 'chatbubble-outline' as const,
      onPress: () => navigateTo(() => navigation.navigate('Chat')),
    },
    {
      key: 'routine',
      label: t.nav.routine,
      icon: 'calendar-outline' as const,
      onPress: () => navigateTo(() => navigation.navigate('Routine')),
    },
    {
      key: 'progression',
      label: t.dashboard.healthEvolution || 'Progression',
      icon: 'trending-up-outline' as const,
      onPress: () => navigateTo(() => navigation.navigate('Home', { screen: 'Evolution' })),
    },
    {
      key: 'community',
      label: t.nav.community,
      icon: 'people-outline' as const,
      onPress: () => navigateTo(() => navigation.navigate('Home', { screen: 'Community' })),
    },
  ]), [t, navigateTo, navigation]);

  const drawerTranslateX = drawerProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-296, 0],
  });

  const backdropOpacity = drawerProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const logoRotate = logoTilt.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-8deg', '0deg', '8deg'],
  });

  useEffect(() => {
    if (settings.reduceMotion) {
      logoPulse.setValue(1);
      logoTilt.setValue(0);
      return;
    }

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(logoPulse, {
          toValue: 1.08,
          duration: getAnimDuration(900),
          useNativeDriver: true,
        }),
        Animated.timing(logoPulse, {
          toValue: 1,
          duration: getAnimDuration(900),
          useNativeDriver: true,
        }),
      ])
    );

    const tiltLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(logoTilt, {
          toValue: 1,
          duration: getAnimDuration(260),
          useNativeDriver: true,
        }),
        Animated.timing(logoTilt, {
          toValue: -1,
          duration: getAnimDuration(260),
          useNativeDriver: true,
        }),
        Animated.timing(logoTilt, {
          toValue: 0,
          duration: getAnimDuration(220),
          useNativeDriver: true,
        }),
        Animated.delay(getAnimDuration(850)),
      ])
    );

    pulseLoop.start();
    tiltLoop.start();

    return () => {
      pulseLoop.stop();
      tiltLoop.stop();
    };
  }, [logoPulse, logoTilt, settings.reduceMotion, getAnimDuration]);

  const handleAppBarSwipe = useCallback((event: any) => {
    const { state, translationX, velocityX } = event.nativeEvent;

    if (state !== State.END || drawerVisible) {
      return;
    }

    const isStrongRightSwipe = translationX > 90 && velocityX > 450;
    const isLongRightSwipe = translationX > 150;

    if (isStrongRightSwipe || isLongRightSwipe) {
      openDrawer();
    }
  }, [drawerVisible, openDrawer]);

  return (
    <PanGestureHandler
      onHandlerStateChange={handleAppBarSwipe}
      activeOffsetX={[-20, 20]}
      failOffsetY={[-12, 12]}
    >
      <LinearGradient
        colors={topGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.wrapper, { paddingTop: insets.top, borderBottomColor: colors.borderStrong }]}
      >
        <LinearGradient
          colors={topOverlayGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBackground}
        >
          <View style={styles.content}>
            <TouchableOpacity
              style={styles.brandRow}
              onPress={openDrawer}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={t.accessibility.openPanel}
            >
              <Animated.View
                style={[
                  styles.logoBox,
                  {
                    borderColor: logoBoxBorderColor,
                    transform: [{ scale: logoPulse }, { rotate: logoRotate }],
                  },
                ]}
              >
                <Ionicons name="sparkles" size={19} color={Colors.white} />
              </Animated.View>
              <Text style={[styles.brandText, { color: brandTextColor }]}>DeepSkyn</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={logout}
              style={[styles.logoutButton, { backgroundColor: logoutButtonBackground, borderColor: logoutButtonBorder }]}
              accessibilityRole="button"
              accessibilityLabel="Se deconnecter"
              activeOpacity={0.8}
            >
              <Ionicons name="log-out-outline" size={20} color={Colors.error} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <Modal visible={drawerVisible} transparent animationType="none" onRequestClose={() => closeDrawer()}>
          <View style={styles.drawerRoot}>
            <Animated.View style={[styles.drawerBackdrop, { opacity: backdropOpacity }]}>
              <Pressable style={StyleSheet.absoluteFillObject} onPress={() => closeDrawer()} />
            </Animated.View>

            <Animated.View
              style={[
                styles.drawer,
                {
                  backgroundColor: colors.surface,
                  borderRightColor: colors.border,
                  transform: [{ translateX: drawerTranslateX }],
                },
              ]}
            >
              <LinearGradient
                colors={topGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.drawerHeaderGradient,
                  {
                    borderBottomColor: colors.borderLight || colors.border,
                    paddingTop: insets.top + 14,
                  },
                ]}
              >
                <LinearGradient
                  colors={topOverlayGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.drawerHeaderOverlay}
                >
                  <View style={styles.drawerHeader}>
                    <View style={[styles.logoBox, { borderColor: logoBoxBorderColor }]}>
                      <Ionicons name="sparkles" size={19} color={Colors.white} />
                    </View>
                    <Text style={[styles.drawerTitle, textStyle, { color: brandTextColor, fontSize: fontSizes.xl }]}>DeepSkyn</Text>
                  </View>
                </LinearGradient>
              </LinearGradient>

              <View style={styles.drawerMenu}>
                {drawerItems.map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.drawerItem, { borderBottomColor: colors.borderLight || colors.border }]}
                    onPress={item.onPress}
                    activeOpacity={0.8}
                  >
                    <Ionicons name={item.icon} size={20} color={colors.primary} />
                    <Text style={[styles.drawerItemLabel, textStyle, { color: colors.text, fontSize: fontSizes.base }]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={[styles.drawerFooter, { borderTopColor: colors.borderLight || colors.border }]}> 
                <TouchableOpacity
                  style={[styles.drawerLogoutButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                  onPress={() => closeDrawer(() => logout())}
                  activeOpacity={0.85}
                >
                  <Ionicons name="log-out-outline" size={20} color={Colors.error} />
                  <Text style={[styles.drawerLogoutText, textStyle, { color: Colors.error, fontSize: fontSizes.base }]}> 
                    {t.nav.logout}
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>
      </LinearGradient>
    </PanGestureHandler>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderBottomWidth: 1,
    ...Shadows.sm,
  },
  gradientBackground: {
    width: '100%',
  },
  content: {
    height: 56,
    paddingHorizontal: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  brandText: {
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.base,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    ...Shadows.sm,
  },
  drawerRoot: {
    flex: 1,
    flexDirection: 'row',
  },
  drawerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.28)',
  },
  drawer: {
    width: 296,
    height: '100%',
    borderRightWidth: 1,
    ...Shadows.xl,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  drawerHeaderGradient: {
    borderBottomWidth: 1,
  },
  drawerHeaderOverlay: {
    width: '100%',
  },
  drawerTitle: {
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  drawerMenu: {
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.base,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  drawerItemLabel: {
    fontWeight: '600',
    flex: 1,
  },
  drawerFooter: {
    marginTop: 'auto',
    borderTopWidth: 1,
    padding: Spacing.base,
    paddingBottom: Spacing.lg,
  },
  drawerLogoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.base,
    borderWidth: 1,
  },
  drawerLogoutText: {
    fontWeight: '700',
  },
});

export default AuthenticatedAppBar;
