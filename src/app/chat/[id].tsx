import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { useMessagesQuery, useSendMessageMutation, useChatSocket, useChatsQuery } from '../../api/chat';
import { useAuthStore } from '../../store/authStore';
import Avatar from '../../components/common/Avatar';
import { Ionicons } from '@expo/vector-icons';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, typography, roundness, palette } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [inputText, setInputText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const EMOJIS = ['😀','😂','😍','🥰','😎','😭','😅','🤔','😊','🙏','👍','❤️','🔥','🎉','😢','😡','🤣','😇','🥳','😴','👏','💪','🤝','✨','💯','🙌','😏','🤗','😬','🫡'];

  const chatId = id;

  const { user: currentUser } = useAuthStore();
  const { data: conversations = [] } = useChatsQuery();
  const conversation = conversations.find((c: any) => c.id === chatId);
  
  // Find the other participant in the conversation
  const participant = conversation?.participants?.find((p: any) => p.userId !== currentUser?.id)?.user 
    || conversation?.participant; 

  const chatDetails = {
    id: chatId,
    participant: participant || { displayName: 'Unknown', avatarUrl: '', username: 'unknown' },
  };

  const { data: messages = [], isLoading } = useMessagesQuery(chatId);
  useChatSocket(chatId); // Listen for real-time messages in this conversation
  const sendMessageMutation = useSendMessageMutation();

  const handleSend = () => {
    if (!inputText.trim()) return;

    sendMessageMutation.mutate(
      { chatId, content: inputText.trim() },
      {
        onSuccess: () => {
          setInputText('');
          // Delay scroll to end to let layout update
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        },
      }
    );
  };

  const handleAttach = () => {
    Alert.alert(
      'Attach Media',
      'Choose an option',
      [
        { text: 'Camera', onPress: () => {} },
        { text: 'Gallery', onPress: () => {} },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  // Scroll to bottom on load or new messages
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [messages.length]);

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  const renderMessageBubble = ({ item }: { item: any }) => {
    const isMe = item.senderId === currentUser?.id;
    return (
      <View
        style={[
          styles.messageRow,
          {
            justifyContent: isMe ? 'flex-end' : 'flex-start',
            marginBottom: spacing.md,
          },
        ]}
      >
        {!isMe && (
          <View style={{ marginRight: 8, alignSelf: 'flex-end' }}>
            <Avatar url={chatDetails.participant.avatarUrl} name={chatDetails.participant.displayName} size={28} />
          </View>
        )}
        <View
          style={[
            styles.bubble,
            {
              backgroundColor: isMe ? colors.primary : colors.surface,
              borderBottomLeftRadius: isMe ? roundness.lg : 2,
              borderBottomRightRadius: isMe ? 2 : roundness.lg,
              borderTopLeftRadius: roundness.lg,
              borderTopRightRadius: roundness.lg,
              maxWidth: '75%',
              paddingVertical: spacing.sm + 2,
              paddingHorizontal: spacing.md,
            },
          ]}
        >
          <Text style={{ color: isMe ? palette.white : colors.text, fontSize: typography.sizes.md }}>
            {item.content}
          </Text>
          <Text
            style={[
              styles.timeText,
              {
                color: isMe ? 'rgba(255, 255, 255, 0.7)' : colors.textMuted,
                fontSize: typography.sizes.xs * 0.85,
                textAlign: 'right',
                marginTop: 4,
              },
            ]}
          >
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: colors.background }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Chat Navbar Header */}
        <View style={[styles.header, { borderBottomColor: colors.borderSecondary }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.profileRow}
            activeOpacity={0.8}
          >
            <Avatar url={chatDetails.participant.avatarUrl} name={chatDetails.participant.displayName} size={36} online />
            <View style={{ marginLeft: 10 }}>
              <Text style={[styles.displayName, { color: colors.text, fontSize: typography.sizes.md }]}>
                {chatDetails.participant.displayName}
              </Text>
              <Text style={{ color: palette.success, fontSize: typography.sizes.xs, fontWeight: '600' }}>
                Online
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Scrollable list */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessageBubble}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Compose Text Input Bar */}
        <View
          style={[
            styles.inputContainer,
            {
              borderTopColor: colors.borderSecondary,
              backgroundColor: colors.cardBg,
              paddingBottom: insets.bottom + spacing.sm,
            },
          ]}
        >
          <TouchableOpacity style={styles.attachBtn} onPress={handleAttach}>
            <Ionicons name="add" size={24} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.attachBtn} onPress={() => setShowEmoji(v => !v)}>
            <Ionicons name="happy-outline" size={22} color={showEmoji ? colors.primary : colors.textSecondary} />
          </TouchableOpacity>
          
          <TextInput
            placeholder="Type a message..."
            placeholderTextColor={colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
            style={[
              styles.input,
              {
                backgroundColor: colors.inputBg,
                color: colors.text,
                borderRadius: roundness.lg,
                fontSize: typography.sizes.sm,
              },
            ]}
          />

          <TouchableOpacity
            onPress={handleSend}
            disabled={!inputText.trim()}
            style={[
              styles.sendBtn,
              {
                backgroundColor: inputText.trim() ? colors.primary : 'transparent',
              },
            ]}
          >
            <Ionicons
              name="paper-plane"
              size={18}
              color={inputText.trim() ? palette.white : colors.textMuted}
            />
          </TouchableOpacity>
        </View>
        {showEmoji && (
          <View style={[styles.emojiPanel, { backgroundColor: colors.cardBg, borderTopColor: colors.borderSecondary }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.emojiScroll}>
              {EMOJIS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  onPress={() => setInputText(t => t + emoji)}
                  style={styles.emojiBtn}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
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
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
  },
  profileRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  displayName: {
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  bubble: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  timeText: {
    fontWeight: '400',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
  },
  attachBtn: {
    padding: 4,
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    maxHeight: 100,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiPanel: {
    borderTopWidth: 1,
    paddingVertical: 8,
  },
  emojiScroll: {
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  emojiBtn: {
    padding: 6,
  },
  emojiText: {
    fontSize: 26,
  },
});
