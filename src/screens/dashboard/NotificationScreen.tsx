import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Badge } from '../../components';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights } from '../../theme';

export function NotificationScreen({ navigation }: any) {
  const notifications = [
    {
      id: '1', type: 'routine', read: false,
      icon: 'checkmark-circle' as const, color: Colors.success,
      title: 'Routine Reminder', message: 'Time for your evening skincare routine!',
      time: '5 min ago',
    },
    {
      id: '2', type: 'analysis', read: false,
      icon: 'scan' as const as any, color: Colors.primary,
      title: 'Analysis Complete', message: 'Your skin analysis results are ready.',
      time: '1h ago',
    },
    {
      id: '3', type: 'community', read: true,
      icon: 'heart' as const, color: Colors.error,
      title: 'New Like', message: 'Sarah K. liked your post.',
      time: '3h ago',
    },
    {
      id: '4', type: 'ai', read: true,
      icon: 'sparkles' as const, color: Colors.purple,
      title: 'AI Insight', message: 'Your hydration levels have improved 12% this week!',
      time: '1d ago',
    },
    {
      id: '5', type: 'subscription', read: true,
      icon: 'star' as const, color: Colors.amber,
      title: 'Premium Offer', message: 'Get 50% off Premium for the next 24 hours.',
      time: '2d ago',
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={Colors.gray700} />
          </TouchableOpacity>
          <Text style={styles.title}>Notifications</Text>
          <TouchableOpacity>
            <Text style={styles.markRead}>Mark all read</Text>
          </TouchableOpacity>
        </View>
      </View>

      {notifications.map((notif) => (
        <TouchableOpacity
          key={notif.id}
          style={[styles.notifRow, !notif.read ? styles.notifRowUnread : undefined]}
          activeOpacity={0.7}
        >
          <View style={[styles.notifIcon, { backgroundColor: notif.color + '20' }]}>
            <Ionicons name={notif.icon} size={20} color={notif.color} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.notifTitleRow}>
              <Text style={styles.notifTitle}>{notif.title}</Text>
              {!notif.read && <View style={styles.unreadDot} />}
            </View>
            <Text style={styles.notifMessage}>{notif.message}</Text>
            <Text style={styles.notifTime}>{notif.time}</Text>
          </View>
        </TouchableOpacity>
      ))}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: { paddingHorizontal: Spacing.xl, paddingTop: 60, paddingBottom: Spacing.base },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: FontSizes.xl, fontWeight: FontWeights.bold, color: Colors.gray900 },
  markRead: { fontSize: FontSizes.sm, color: Colors.primary, fontWeight: FontWeights.medium },
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
