import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useNotificationStore } from '../../stores/notification.store';
import { useAccessibilityStore } from '../../stores/accessibility.store';
import { NotificationItem } from './NotificationItem';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights, Shadows } from '../../theme';
import type { Notification } from '../../lib/types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PANEL_WIDTH = Math.min(SCREEN_WIDTH - 32, 400);

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
  } = useNotificationStore();

  const { theme } = useAccessibilityStore();
  const [loading, setLoading] = useState(false);
  const isDark = theme === 'dark';

  // Animations
  const translateX = useSharedValue(PANEL_WIDTH);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      Promise.all([fetchNotifications(), fetchUnreadCount()]).finally(() =>
        setLoading(false)
      );
      
      translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
      backdropOpacity.value = withTiming(1, { duration: 200 });
    } else {
      translateX.value = withSpring(PANEL_WIDTH, { damping: 20, stiffness: 200 });
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [isOpen, fetchNotifications, fetchUnreadCount, translateX, backdropOpacity]);

  // Swipe to close gesture
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationX > 0) {
        translateX.value = event.translationX;
      }
    })
    .onEnd((event) => {
      if (event.translationX > PANEL_WIDTH / 3 || event.velocityX > 500) {
        translateX.value = withSpring(PANEL_WIDTH, { damping: 20, stiffness: 200 });
        backdropOpacity.value = withTiming(0, { duration: 200 });
        runOnJS(onClose)();
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    });

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    // Handle navigation if actionUrl exists
    if (notification.actionUrl) {
      // TODO: Navigate to actionUrl
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Feather name="bell-off" size={40} color={Colors.gray300} />
      </View>
      <Text style={styles.emptyTitle}>Tout est calme ici</Text>
      <Text style={styles.emptyDescription}>
        Vous n'avez aucune notification pour le moment. Revenez plus tard !
      </Text>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingState}>
      <View style={styles.loadingSpinner}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <MaterialCommunityIcons
          name="shimmer"
          size={24}
          color={Colors.primary}
          style={styles.loadingIcon}
        />
      </View>
      <Text style={styles.loadingText}>Chargement premium...</Text>
    </View>
  );

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={onClose}
          />
        </Animated.View>

        {/* Panel */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.panelWrapper, panelStyle]}>
            {Platform.OS === 'ios' ? (
              <BlurView
                intensity={95}
                tint={isDark ? 'dark' : 'light'}
                style={styles.panel}
              >
                <PanelContent
                  notifications={notifications}
                  unreadCount={unreadCount}
                  loading={loading}
                  isDark={isDark}
                  onClose={onClose}
                  onMarkAsRead={markAsRead}
                  onMarkAllAsRead={markAllAsRead}
                  onDelete={removeNotification}
                  onNotificationPress={handleNotificationPress}
                  renderEmptyState={renderEmptyState}
                  renderLoadingState={renderLoadingState}
                />
              </BlurView>
            ) : (
              <View style={[styles.panel, styles.panelAndroid, isDark && styles.panelDark]}>
                <PanelContent
                  notifications={notifications}
                  unreadCount={unreadCount}
                  loading={loading}
                  isDark={isDark}
                  onClose={onClose}
                  onMarkAsRead={markAsRead}
                  onMarkAllAsRead={markAllAsRead}
                  onDelete={removeNotification}
                  onNotificationPress={handleNotificationPress}
                  renderEmptyState={renderEmptyState}
                  renderLoadingState={renderLoadingState}
                />
              </View>
            )}
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Panel Content Component
// ─────────────────────────────────────────────────────────────────────────────
interface PanelContentProps {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  isDark: boolean;
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onNotificationPress: (notification: Notification) => void;
  renderEmptyState: () => React.ReactNode;
  renderLoadingState: () => React.ReactNode;
}

function PanelContent({
  notifications,
  unreadCount,
  loading,
  isDark,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onNotificationPress,
  renderEmptyState,
  renderLoadingState,
}: PanelContentProps) {
  return (
    <>
      {/* Gradient Line */}
      <LinearGradient
        colors={['#0EA5E9', '#06B6D4', '#F9A8D4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientLine}
      />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.bellContainer}>
            <Feather name="bell" size={24} color={Colors.primary} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          <View>
            <Text style={[styles.headerTitle, isDark && styles.textLight]}>
              Notifications
            </Text>
            <Text style={styles.headerSubtitle}>
              Restez informé de votre activité
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={onMarkAllAsRead}
              style={styles.markAllButton}
              accessibilityLabel="Tout marquer comme lu"
            >
              <Feather name="check-circle" size={20} color={Colors.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            accessibilityLabel="Fermer"
          >
            <Feather name="x" size={20} color={Colors.gray500} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          renderLoadingState()
        ) : notifications.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <NotificationItem
                notification={item}
                onMarkAsRead={onMarkAsRead}
                onDelete={onDelete}
                onPress={onNotificationPress}
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

      {/* Footer */}
      <View style={[styles.footer, isDark && styles.footerDark]}>
        <Text style={styles.footerText}>DeepSkyn Notification Engine</Text>
      </View>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  panelWrapper: {
    position: 'absolute',
    top: Spacing.base,
    bottom: Spacing.base,
    right: Spacing.base,
    width: PANEL_WIDTH,
  },
  panel: {
    flex: 1,
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
  },
  panelAndroid: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    ...Shadows.xl,
  },
  panelDark: {
    backgroundColor: 'rgba(15, 23, 42, 0.98)',
  },

  // Gradient line
  gradientLine: {
    height: 4,
    width: '100%',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  bellContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primaryAlpha10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: FontWeights.bold,
    color: Colors.white,
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.gray900,
  },
  headerSubtitle: {
    fontSize: FontSizes.xs,
    color: Colors.gray400,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  markAllButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.base,
    backgroundColor: Colors.gray50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.base,
    backgroundColor: Colors.gray50,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Content
  content: {
    flex: 1,
  },
  listContent: {
    paddingVertical: Spacing.sm,
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.gray50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.gray900,
    marginBottom: Spacing.sm,
  },
  emptyDescription: {
    fontSize: FontSizes.sm,
    color: Colors.gray500,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Loading state
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.base,
  },
  loadingSpinner: {
    position: 'relative',
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIcon: {
    position: 'absolute',
  },
  loadingText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.gray500,
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  footerText: {
    fontSize: 10,
    fontWeight: FontWeights.bold,
    color: Colors.gray400,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  // Text variants
  textLight: {
    color: Colors.white,
  },
});
