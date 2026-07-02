import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { FlashList as ShopifyFlashList } from '@shopify/flash-list';
const FlashList = ShopifyFlashList as any;
import { useTheme } from '../../theme';
import BottomSheet from '../common/BottomSheet';
import Avatar from '../common/Avatar';
import { usePostCommentsQuery, useAddCommentMutation } from '../../api/feed';
import { Ionicons } from '@expo/vector-icons';

interface CommentSheetProps {
  postId: string | null;
  visible: boolean;
  onClose: () => void;
}

export const CommentSheet: React.FC<CommentSheetProps> = ({ postId, visible, onClose }) => {
  const { colors, spacing, typography, palette } = useTheme();
  const [commentText, setCommentText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const EMOJIS = ['😀','😂','😍','🥰','😎','😭','😅','🤔','😊','🙏','👍','❤️','🔥','🎉','😢','😡','🤣','😇','🥳','😴','👏','💪','🤝','✨','💯','🙌','😏','🤗','😬','🫡'];

  const { data: comments = [], isLoading } = usePostCommentsQuery(postId || '');
  const addCommentMutation = useAddCommentMutation();

  const handleSubmitComment = () => {
    if (!commentText.trim() || !postId) return;

    addCommentMutation.mutate(
      { postId, content: commentText.trim() },
      {
        onSuccess: () => {
          setCommentText('');
        },
      }
    );
  };

  const renderCommentItem = ({ item }: { item: any }) => (
    <View style={[styles.commentItem, { borderBottomColor: colors.borderSecondary }]}>
      <Avatar url={item.author.avatarUrl} name={item.author.displayName} size={32} />
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={[styles.commentAuthor, { color: colors.text, fontSize: typography.sizes.sm }]}>
            {item.author.displayName}
          </Text>
          <Text style={[styles.commentTime, { color: colors.textMuted, fontSize: typography.sizes.xs }]}>
            3h ago
          </Text>
        </View>
        <Text style={[styles.commentText, { color: colors.textSecondary, fontSize: typography.sizes.sm }]}>
          {item.content}
        </Text>
        <View style={styles.commentActions}>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons
              name={item.isLiked ? 'heart' : 'heart-outline'}
              size={14}
              color={item.isLiked ? colors.error : colors.textMuted}
            />
            {item.likesCount > 0 && (
              <Text style={[styles.actionText, { color: colors.textMuted }]}>
                {item.likesCount}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Comments">
      <View style={styles.container}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : (
          <FlashList
            data={comments}
            renderItem={renderCommentItem}
            estimatedItemSize={70}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.textSecondary, fontSize: typography.sizes.sm }]}>
                  No comments yet. Start the conversation!
                </Text>
              </View>
            )}
          />
        )}

        {/* Comment Input Field Bar */}
        <View style={[styles.inputWrapper, { backgroundColor: colors.cardBg, borderTopColor: colors.borderSecondary }]}>
          {showEmoji && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.emojiScroll}>
              {EMOJIS.map((emoji) => (
                <TouchableOpacity key={emoji} onPress={() => setCommentText(t => t + emoji)} style={styles.emojiBtn}>
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          <View
            style={[
              styles.inputContainer,
              {
                borderTopColor: colors.borderSecondary,
                backgroundColor: colors.cardBg,
                paddingBottom: spacing.sm,
              },
            ]}
          >
          <TouchableOpacity style={styles.emojiToggle} onPress={() => setShowEmoji(v => !v)}>
            <Ionicons name="happy-outline" size={22} color={showEmoji ? colors.primary : colors.textSecondary} />
          </TouchableOpacity>
          <TextInput
            placeholder="Add a comment..."
            placeholderTextColor={colors.textMuted}
            value={commentText}
            onChangeText={setCommentText}
            style={[
              styles.input,
              {
                backgroundColor: colors.inputBg,
                color: colors.text,
                borderRadius: 20,
                fontSize: typography.sizes.sm,
              },
            ]}
            multiline
          />
          <TouchableOpacity
            onPress={handleSubmitComment}
            disabled={!commentText.trim() || addCommentMutation.isPending}
            style={[
              styles.sendBtn,
              {
                backgroundColor: commentText.trim() ? colors.primary : colors.inputBg,
              },
            ]}
          >
            {addCommentMutation.isPending ? (
              <ActivityIndicator size="small" color={palette.white} />
            ) : (
              <Ionicons name="arrow-up" size={18} color={commentText.trim() ? palette.white : colors.textMuted} />
            )}
          </TouchableOpacity>
          </View>
        </View>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 80,
  },
  commentItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  commentContent: {
    flex: 1,
    marginLeft: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  commentAuthor: {
    fontWeight: '600',
  },
  commentTime: {},
  commentText: {
    lineHeight: 18,
  },
  commentActions: {
    flexDirection: 'row',
    marginTop: 6,
    alignItems: 'center',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontWeight: '500',
  },
  inputWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
  },
  emojiScroll: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
  emojiBtn: {
    padding: 5,
  },
  emojiText: {
    fontSize: 26,
  },
  emojiToggle: {
    padding: 4,
    marginRight: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    marginRight: 8,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
export default CommentSheet;
