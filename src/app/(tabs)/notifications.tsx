import React from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { useNotificationsQuery, useMarkAllReadMutation, useMarkReadMutation, useNotificationSocket } from '../../api/chat';
import Avatar from '../../components/common/Avatar';
import Skeleton from '../../components/feedback/Skeleton';
import { Ionicons } from '@expo/vector-icons';
import { useToastStore } from '../../store/toastStore';

export default function NotificationsScreen() {
  const { colors, spacing, typography, palette } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const showToast = useToastStore((state) => state.showToast);

  const { data: notifications = [], isLoading } = useNotificationsQuery();
  const markAllRead = useMarkAllReadMutation();
  const markRead = useMarkReadMutation();
  useNotificationSocket();

  const handleMarkAllRead = () => {
    markAllRead.mutate(undefined, {
      onSuccess: () => showToast('All notifications marked as read', 'success'),
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'LIKE':
        return (
          <View style={[styles.iconBadge, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
            <Ionicons name="heart" size={12} color={palette.error} />
          </View>
        );
      case 'COMMENT':
        return (
          <View style={[styles.iconBadge, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
            <Ionicons name="chatbubble" size={12} color={palette.info} />
          </View>
        );
      case 'FOLLOW':
        return (
          <View style={[styles.iconBadge, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
            <Ionicons name="person-add" size={12} color={palette.primary} />
          </View>
        );
      case 'COMMUNITY_JOIN':
      default:
        return (
          <View style={[styles.iconBadge, { backgroundColor: 'rgba(168, 85, 247, 0.1)' }]}>
            <Ionicons name="people" size={12} color={palette.primary} />
          </View>
        );
    }
  };

  const formatTime = (createdAt: string) => {
    const diff = Date.now() - new Date(createdAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const renderNotificationRow = ({ item }: { item: any }) => {
    const isRead = item.isRead;
    const actor = item.actor;

    return (
      <TouchableOpacity
        onPress={() => {
          if (!isRead) markRead.mutate(item.id);
          if (item.entityType === 'POST') {
            router.push({ pathname: '/(tabs)', params: { refetch: 'true' } });
          } else if (item.entityType === 'COMMUNITY') {
            router.push(`/community/${item.entityId}`);
          }
        }}
        activeOpacity={0.8}
        style={[
          styles.row,
          {
            borderBottomColor: colors.borderSecondary,
            backgroundColor: isRead ? 'transparent' : 'rgba(99, 102, 241, 0.05)',
          },
        ]}
      >
        <View style={styles.avatarContainer}>
          <Avatar url={actor?.avatarUrl} name={actor?.displayName ?? '?'} size={44} />
          <View style={styles.badgeWrapper}>{getNotificationIcon(item.type)}</View>
        </View>

        <View style={styles.details}>
          <Text style={{ fontSize: typography.sizes.sm, color: colors.text, lineHeight: 18 }}>
            <Text style={{ fontWeight: 'bold' }}>{actor?.displayName ?? 'Someone'}</Text>{' '}{item.body}
          </Text>
          <Text style={[styles.time, { color: colors.textMuted, fontSize: typography.sizes.xs }]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>

        {!isRead && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Navbar Header */}
      <View style={[styles.navbar, { borderBottomColor: colors.borderSecondary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.text, fontSize: typography.sizes.lg }]}>
          Notifications
        </Text>
        <TouchableOpacity onPress={handleMarkAllRead} style={styles.markBtn}>
          <Ionicons name="checkmark-done" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Notifications list */}
      {isLoading ? (
        <View style={{ padding: 20 }}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Skeleton width={44} height={44} borderRadius={22} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Skeleton width="60%" height={14} style={{ marginBottom: 6 }} />
                <Skeleton width="20%" height={10} />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationRow}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={40} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textSecondary, fontSize: typography.sizes.sm }]}>
                No notifications yet.
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
  },
  navTitle: {
    fontWeight: '700',
  },
  markBtn: {
    padding: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatarContainer: {
    position: 'relative',
  },
  badgeWrapper: {
    position: 'absolute',
    bottom: -2,
    right: -2,
  },
  iconBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  details: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
  },
  time: {
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 160,
  },
  emptyText: {
    marginTop: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
});
