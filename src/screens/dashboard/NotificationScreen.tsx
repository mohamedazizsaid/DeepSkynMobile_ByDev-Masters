import React, { useEffect, useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Badge, LoadingSpinner, EmptyState } from '../../components';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights } from '../../theme';
import { useNotificationStore } from '../../stores/notification.store';
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
      <View style={styles.loadingContainer}>
        <LoadingSpinner message="Chargement des notifications..." />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={Colors.gray700} />
          </TouchableOpacity>
          <Text style={styles.title}>Notifications</Text>
          <TouchableOpacity onPress={handleMarkAllRead} disabled={unreadCount === 0}>
            <Text style={[styles.markRead, unreadCount === 0 && styles.markReadDisabled]}>
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
              style={[styles.notifRow, !notif.isRead ? styles.notifRowUnread : undefined]}
              activeOpacity={0.7}
              onPress={() => handleNotificationPress(notif)}
              onLongPress={() => handleDelete(notif.id)}
            >
              <View style={[styles.notifIcon, { backgroundColor: iconData.color + '20' }]}>
                <Ionicons name={iconData.icon} size={20} color={iconData.color} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.notifTitleRow}>
                  <Text style={styles.notifTitle}>{notif.title}</Text>
                  {!notif.isRead && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.notifMessage}>{notif.message}</Text>
                <Text style={styles.notifTime}>{getRelativeTime(notif.createdAt)}</Text>
              </View>
            </TouchableOpacity>
          );
        })
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  loadingContainer: { flex: 1, backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: Spacing.xl, paddingTop: 60, paddingBottom: Spacing.base },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: FontSizes.xl, fontWeight: FontWeights.bold, color: Colors.gray900 },
  markRead: { fontSize: FontSizes.sm, color: Colors.primary, fontWeight: FontWeights.medium },
  markReadDisabled: { color: Colors.gray400 },
  unreadBanner: { marginTop: Spacing.md },
  notifRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.base,
    borderBottomWidth: 1, borderBottomColor: Colors.gray100,
  },
  notifRowUnread: { backgroundColor: Colors.primaryAlpha5 },
  notifIcon: {
    width: 44, height: 44, borderRadius: BorderRadius.base,
    alignItems: 'center', justifyContent: 'center',
  },
  notifTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  notifTitle: { fontSize: FontSizes.base, fontWeight: FontWeights.semibold, color: Colors.gray900 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  notifMessage: { fontSize: FontSizes.sm, color: Colors.gray500, marginTop: 2, lineHeight: 20 },
  notifTime: { fontSize: FontSizes.xs, color: Colors.gray400, marginTop: 4 },
});
