import React, { useEffect, useCallback, useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card, Badge, LoadingSpinner, EmptyState } from '../../components';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights } from '../../theme';
import { useNotificationStore } from '../../stores/notification.store';
import { useAccessibilityStyles } from '../../stores/useAccessibilityStyles';
import { getRelativeTime } from '../../lib/utils';
import type { Notification, NotificationType } from '../../lib/types';

const getNotificationIcon = (type: NotificationType): { icon: keyof typeof Ionicons.glyphMap; color: string } => {
  switch (type) {
    case 'success':
      return { icon: 'checkmark-circle', color: Colors.success };
    case 'warning':
      return { icon: 'warning', color: Colors.warning };
    case 'error':
      return { icon: 'alert-circle', color: Colors.error };
    default:
      return { icon: 'information-circle', color: Colors.primary };
  }
};

export function NotificationScreen({ navigation }: any) {
  const { 
    notifications, 
    unreadCount, 
    fetchNotifications, 
    fetchUnreadCount, 
    markAsRead, 
    markAllAsRead,
    removeNotification,
  } = useNotificationStore();
  const { colors, fontSizes } = useAccessibilityStyles();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const dynamicStyles = useMemo(() => ({
    safeArea: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1, backgroundColor: colors.background },
    loadingContainer: { flex: 1, backgroundColor: colors.background, justifyContent: 'center' as const, alignItems: 'center' as const },
    title: { fontSize: fontSizes.xl, fontWeight: FontWeights.bold, color: colors.text },
    markRead: { fontSize: fontSizes.sm, color: colors.primary, fontWeight: FontWeights.medium },
    markReadDisabled: { color: colors.textTertiary },
    notifRow: {
      flexDirection: 'row' as const, alignItems: 'flex-start' as const, gap: Spacing.md,
      paddingHorizontal: Spacing.xl, paddingVertical: Spacing.base,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    notifRowUnread: { backgroundColor: colors.surface },
    notifTitle: { fontSize: fontSizes.base, fontWeight: FontWeights.semibold, color: colors.text },
    notifMessage: { fontSize: fontSizes.sm, color: colors.textSecondary, marginTop: 2, lineHeight: 20 },
    notifTime: { fontSize: fontSizes.xs, color: colors.textTertiary, marginTop: 4 },
  }), [colors, fontSizes]);

  const loadNotifications = useCallback(async () => {
    try {
      await Promise.all([fetchNotifications(), fetchUnreadCount()]);
    } catch (error) {
      console.error('Notifications load error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchNotifications, fetchUnreadCount]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const handleMarkAllRead = () => {
    if (unreadCount === 0) return;
    Alert.alert(
      'Tout marquer comme lu',
      'Voulez-vous marquer toutes les notifications comme lues ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Oui', onPress: markAllAsRead },
      ]
    );
  };

  const handleNotificationPress = async (notif: Notification) => {
    if (!notif.isRead) {
      await markAsRead(notif.id);
    }
    if (notif.actionUrl) {
      // Navigation basée sur l'URL d'action
      console.log('Navigate to:', notif.actionUrl);
    }
  };

  const handleDelete = (notifId: string) => {
    Alert.alert(
      'Supprimer',
      'Voulez-vous supprimer cette notification ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => removeNotification(notifId) },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={dynamicStyles.safeArea}>
        <View style={dynamicStyles.loadingContainer}>
          <LoadingSpinner message="Chargement des notifications..." />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={dynamicStyles.safeArea}>
      <ScrollView 
        style={dynamicStyles.container} 
        showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={dynamicStyles.title}>Notifications</Text>
          <TouchableOpacity onPress={handleMarkAllRead} disabled={unreadCount === 0}>
            <Text style={[dynamicStyles.markRead, unreadCount === 0 && dynamicStyles.markReadDisabled]}>
              Tout lire
            </Text>
          </TouchableOpacity>
        </View>
        {unreadCount > 0 && (
          <View style={styles.unreadBanner}>
            <Badge text={`${unreadCount} non lue${unreadCount > 1 ? 's' : ''}`} variant="primary" />
          </View>
        )}
      </View>

      {notifications.length === 0 ? (
        <EmptyState
          icon="notifications-off-outline"
          title="Aucune notification"
          description="Vous n'avez pas encore de notifications"
        />
      ) : (
        notifications.map((notif) => {
          const iconData = getNotificationIcon(notif.type);
          return (
            <TouchableOpacity
              key={notif.id}
              style={[dynamicStyles.notifRow, !notif.isRead ? dynamicStyles.notifRowUnread : undefined]}
              activeOpacity={0.7}
              onPress={() => handleNotificationPress(notif)}
              onLongPress={() => handleDelete(notif.id)}
            >
              <View style={[styles.notifIcon, { backgroundColor: iconData.color + '20' }]}>
                <Ionicons name={iconData.icon} size={20} color={iconData.color} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.notifTitleRow}>
                  <Text style={dynamicStyles.notifTitle}>{notif.title}</Text>
                  {!notif.isRead && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
                </View>
                <Text style={dynamicStyles.notifMessage}>{notif.message}</Text>
                <Text style={dynamicStyles.notifTime}>{getRelativeTime(notif.createdAt)}</Text>
              </View>
            </TouchableOpacity>
          );
        })
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.base, paddingBottom: Spacing.base },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  unreadBanner: { marginTop: Spacing.md },
  notifIcon: {
    width: 44, height: 44, borderRadius: BorderRadius.base,
    alignItems: 'center', justifyContent: 'center',
  },
  notifTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
});
