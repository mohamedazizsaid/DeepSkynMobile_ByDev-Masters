import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights } from '../../theme';
import type { Notification, NotificationType } from '../../lib/types';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onPress?: (notification: Notification) => void;
}

const typeIcons: Record<NotificationType, { name: string; color: string; bgColor: string }> = {
  info: { name: 'information', color: Colors.info, bgColor: Colors.primaryAlpha10 },
  success: { name: 'check-circle', color: Colors.success, bgColor: Colors.successAlpha10 },
  warning: { name: 'alert', color: Colors.warning, bgColor: Colors.warningAlpha10 },
  error: { name: 'close-circle', color: Colors.error, bgColor: Colors.errorAlpha10 },
};

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onPress,
}: NotificationItemProps) {
  const typeConfig = typeIcons[notification.type] || typeIcons.info;

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins}min`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `Il y a ${diffDays}j`;
  };

  const renderRightActions = () => (
    <View style={styles.swipeActions}>
      {!notification.isRead && (
        <TouchableOpacity
          style={[styles.swipeAction, styles.swipeActionRead]}
          onPress={() => onMarkAsRead(notification.id)}
        >
          <Feather name="check" size={20} color={Colors.white} />
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={[styles.swipeAction, styles.swipeActionDelete]}
        onPress={() => onDelete(notification.id)}
      >
        <Feather name="trash-2" size={20} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );

  return (
    <Swipeable renderRightActions={renderRightActions} overshootRight={false}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onPress?.(notification)}
        style={[
          styles.container,
          !notification.isRead && styles.containerUnread,
        ]}
      >
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: typeConfig.bgColor }]}>
          <MaterialCommunityIcons
            name={typeConfig.name as any}
            size={20}
            color={typeConfig.color}
          />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.header}>
            <Text
              style={[
                styles.title,
                !notification.isRead && styles.titleUnread,
              ]}
              numberOfLines={1}
            >
              {notification.title}
            </Text>
            <Text style={styles.time}>{formatTime(notification.createdAt)}</Text>
          </View>
          <Text style={styles.message} numberOfLines={2}>
            {notification.message}
          </Text>

          {/* Action buttons on hover/focus */}
          <View style={styles.actions}>
            {!notification.isRead && (
              <TouchableOpacity
                onPress={() => onMarkAsRead(notification.id)}
                style={styles.actionButton}
              >
                <View style={styles.actionIconContainer}>
                  <Feather name="check" size={12} color={Colors.primary} />
                </View>
                <Text style={styles.actionText}>Marquer comme lu</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => onDelete(notification.id)}
              style={styles.actionButton}
            >
              <View style={[styles.actionIconContainer, styles.actionIconDelete]}>
                <Feather name="trash-2" size={12} color={Colors.gray400} />
              </View>
              <Text style={[styles.actionText, styles.actionTextDelete]}>
                Supprimer
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Unread indicator */}
        {!notification.isRead && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.base,
    marginHorizontal: Spacing.sm,
    marginVertical: Spacing.xs,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  containerUnread: {
    backgroundColor: Colors.primaryAlpha5,
    borderColor: Colors.primaryAlpha20,
  },

  // Icon
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },

  // Content
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  title: {
    flex: 1,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.gray600,
    marginRight: Spacing.sm,
  },
  titleUnread: {
    color: Colors.gray900,
    fontWeight: FontWeights.bold,
  },
  time: {
    fontSize: 10,
    fontWeight: FontWeights.bold,
    color: Colors.gray400,
    textTransform: 'uppercase',
    letterSpacing: -0.5,
  },
  message: {
    fontSize: FontSizes.sm,
    color: Colors.gray500,
    lineHeight: 20,
  },

  // Actions
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.base,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  actionIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primaryAlpha10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconDelete: {
    backgroundColor: Colors.gray100,
  },
  actionText: {
    fontSize: 11,
    fontWeight: FontWeights.bold,
    color: Colors.primary,
  },
  actionTextDelete: {
    color: Colors.gray400,
  },

  // Unread dot
  unreadDot: {
    position: 'absolute',
    right: Spacing.sm,
    top: '50%',
    marginTop: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 3,
  },

  // Swipe actions
  swipeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xs,
  },
  swipeAction: {
    width: 60,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeActionRead: {
    backgroundColor: Colors.primary,
    borderTopLeftRadius: BorderRadius.lg,
    borderBottomLeftRadius: BorderRadius.lg,
  },
  swipeActionDelete: {
    backgroundColor: Colors.error,
    borderTopRightRadius: BorderRadius.lg,
    borderBottomRightRadius: BorderRadius.lg,
  },
});
