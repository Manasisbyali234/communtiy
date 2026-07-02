import React from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { useChatsQuery } from '../../api/chat';
import Avatar from '../../components/common/Avatar';
import { Ionicons } from '@expo/vector-icons';
import { Conversation } from '../../types';

export default function ChatListScreen() {
  const { colors, spacing, typography, palette } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { data: chats = [], isLoading } = useChatsQuery();

  const renderChatItem = ({ item }: { item: Conversation }) => {
    const isUnread = (item.unreadCount || 0) > 0;
    
    // Format the time
    let timeString = '';
    if (item.lastMessage) {
      try {
        const date = new Date(item.lastMessage.createdAt);
        timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } catch (e) {}
    }

    return (
      <TouchableOpacity
        style={[styles.chatItem, { borderBottomColor: colors.borderSecondary }]}
        activeOpacity={0.7}
        onPress={() => router.push(`/chat/${item.id}`)}
      >
        <Avatar url={item.participant?.avatarUrl || ''} name={item.participant?.displayName || 'Unknown'} size={50} online={item.participant?.isOnline} />
        
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={[styles.displayName, { color: colors.text, fontSize: typography.sizes.md }]}>
              {item.participant?.displayName || 'Unknown'}
            </Text>
            <Text style={[styles.timeText, { color: isUnread ? colors.primary : colors.textMuted, fontSize: typography.sizes.xs }]}>
              {timeString}
            </Text>
          </View>
          
          <View style={styles.messagePreviewContainer}>
            <Text 
              style={[
                styles.messagePreview, 
                { 
                  color: isUnread ? colors.text : colors.textSecondary,
                  fontWeight: isUnread ? '600' : '400',
                  fontSize: typography.sizes.sm
                }
              ]}
              numberOfLines={1}
            >
              {item.lastMessage?.content || 'Started a new conversation'}
            </Text>
            
            {isUnread && (
              <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.unreadText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.borderSecondary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text, fontSize: typography.sizes.lg }]}>
          Messages
        </Text>
        <TouchableOpacity style={styles.newChatBtn} onPress={() => router.push('/chat/new')}>
          <Ionicons name="create-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : chats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textSecondary, fontSize: typography.sizes.md }]}>
            No messages yet.
          </Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          renderItem={renderChatItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
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
  headerTitle: {
    fontWeight: '700',
  },
  newChatBtn: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 12,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 20,
  },
  chatItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    alignItems: 'center',
  },
  chatInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  displayName: {
    fontWeight: '700',
  },
  timeText: {
    fontWeight: '500',
  },
  messagePreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  messagePreview: {
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
});
