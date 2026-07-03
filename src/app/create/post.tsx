import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image as RNImage,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { useCommunitiesQuery } from '../../api/community';
import { useCreatePostMutation } from '../../api/feed';
import Avatar from '../../components/common/Avatar';
import { Ionicons } from '@expo/vector-icons';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';
import { pickImage, uploadPostImage } from '../../utils/imagePicker';

export default function CreatePost() {
  const { colors, typography } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const showToast = useToastStore((state) => state.showToast);
  const { user } = useAuthStore();

  const { communityId: preselectedCommId } = useLocalSearchParams<{ communityId?: string }>();

  const { data: communities = [] } = useCommunitiesQuery();
  const createPostMutation = useCreatePostMutation();

  const [content, setContent] = useState('');
  const [selectedCommId, setSelectedCommId] = useState<string>(preselectedCommId ?? '');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);

  const [showTagInput, setShowTagInput] = useState(false);

  // When communities load, ensure preselected community is selected
  useEffect(() => {
    if (preselectedCommId) setSelectedCommId(preselectedCommId);
  }, [preselectedCommId]);

  const joinedCommunities = communities.filter((c) => c.isJoined);
  const selectedCommunity = communities.find((c) => c.id === selectedCommId);

  const handleAddTag = () => {
    const formatted = tagInput.trim().toLowerCase().replace(/#/g, '');
    if (formatted && !tags.includes(formatted)) {
      setTags([...tags, formatted]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleAttachMockImage = async () => {
    const picked = await pickImage();
    if (!picked) return;
    const url = await uploadPostImage(picked);
    if (url) setMediaUrl(url);
  };

  const handlePostSubmit = () => {
    if (!content.trim() && !mediaUrl) return;

    createPostMutation.mutate(
      {
        content: content.trim(),
        communityId: selectedCommId || undefined,
        mediaType: mediaUrl ? 'IMAGE' : undefined,
        mediaUrl: mediaUrl || undefined,
        tags: tags.length > 0 ? tags : undefined,
      } as any,
      {
        onSuccess: () => {
          showToast('Shared successfully!', 'success');
          setContent('');
          setSelectedCommId('');
          setTags([]);
          setMediaUrl(null);
          router.replace('/(tabs)' as any);
        },
        onError: () => {
          showToast('Failed to create post. Try again.', 'error');
        },
      }
    );
  };

  const isPostEnabled = (content.trim().length > 0 || mediaUrl) && !createPostMutation.isPending;
  const primaryActionColor = colors.primary || '#0095F6';

  // Helper for menu rows
  const MenuRow = ({ icon, label, value, onPress, isLast = false }: any) => (
    <TouchableOpacity 
      style={[styles.menuRow, !isLast && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuLeft}>
        <Ionicons name={icon} size={24} color={colors.text} style={styles.menuIcon} />
        <Text style={[styles.menuText, { color: colors.text }]}>{label}</Text>
      </View>
      <View style={styles.menuRight}>
        {value ? <Text style={[styles.menuValue, { color: colors.textSecondary }]} numberOfLines={1}>{value}</Text> : null}
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* ── HEADER ────────────────────────────────────────────────── */}
      <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: Math.max(insets.top, 12) + 10 }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.replace('/(tabs)' as any)} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>New post</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        
        {/* ── CAPTION & MEDIA AREA ────────────────────────────────── */}
        <View style={[styles.captionRow, { borderBottomColor: colors.border }]}>
          <View style={styles.avatarWrapper}>
            <Avatar url={user?.avatarUrl} name={user?.displayName || 'User'} size={40} />
          </View>
          
          <View style={styles.captionInputContainer}>
            <TextInput
              placeholder="Write a caption..."
              placeholderTextColor={colors.textMuted}
              value={content}
              onChangeText={setContent}
              multiline
              autoFocus
              style={[styles.textInput, { color: colors.text }]}
            />
          </View>

          {mediaUrl ? (
            <TouchableOpacity onPress={() => setMediaUrl(null)} style={styles.thumbnailContainer} activeOpacity={0.8}>
              <RNImage source={{ uri: mediaUrl }} style={styles.thumbnail} resizeMode="cover" />
              <View style={styles.removeIconBadge}>
                <Ionicons name="close" size={14} color="#FFF" />
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleAttachMockImage} style={[styles.thumbnailPlaceholder, { borderColor: colors.border, backgroundColor: colors.inputBg }]} activeOpacity={0.7}>
              <Ionicons name="image-outline" size={26} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* ── SETTINGS MENU ───────────────────────────────────────── */}
        <View style={styles.menuList}>
          
          <MenuRow 
            icon="pricetag-outline" 
            label="Tag people" 
            value={tags.length > 0 ? tags.join(', ') : ''} 
            onPress={() => setShowTagInput(!showTagInput)} 
          />

          {showTagInput && (
            <View style={[styles.expansionArea, { backgroundColor: colors.surfaceSecondary }]}>
              {tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {tags.map((tag) => (
                    <View key={tag} style={[styles.tagBadge, { backgroundColor: colors.background }]}>
                      <Text style={[styles.tagText, { color: primaryActionColor }]}>#{tag}</Text>
                      <TouchableOpacity onPress={() => handleRemoveTag(tag)} style={styles.tagRemove}>
                        <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
              <View style={[styles.tagInputWrapper, { backgroundColor: colors.background }]}>
                <Ionicons name="search" size={16} color={colors.textMuted} style={styles.searchIcon} />
                <TextInput
                  placeholder="Search for a tag..."
                  placeholderTextColor={colors.textMuted}
                  value={tagInput}
                  onChangeText={setTagInput}
                  onSubmitEditing={handleAddTag}
                  autoCapitalize="none"
                  returnKeyType="done"
                  style={[styles.tagInput, { color: colors.text }]}
                />
              </View>
            </View>
          )}

          <MenuRow 
            icon="location-outline" 
            label="Add location" 
            onPress={() => {}} 
          />

          <View style={[styles.expansionArea, { backgroundColor: colors.background, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 12, marginLeft: 2 }}>Share to community</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.commScroll}>
              <TouchableOpacity
                onPress={() => setSelectedCommId('')}
                style={[
                  styles.commPill,
                  { backgroundColor: selectedCommId === '' ? primaryActionColor : colors.background,
                    borderColor: selectedCommId === '' ? primaryActionColor : colors.border }
                ]}
              >
                <Text style={[styles.commPillText, { color: selectedCommId === '' ? '#FFF' : colors.text }]}>
                  General Feed
                </Text>
              </TouchableOpacity>

              {/* Show all joined communities + preselected one if not already in list */}
              {[...joinedCommunities, ...(preselectedCommId && !joinedCommunities.find(c => c.id === preselectedCommId) ? communities.filter(c => c.id === preselectedCommId) : [])].map((comm) => {
                const isSelected = selectedCommId === comm.id;
                return (
                  <TouchableOpacity
                    key={comm.id}
                    onPress={() => setSelectedCommId(comm.id)}
                    style={[
                      styles.commPill,
                      { backgroundColor: isSelected ? primaryActionColor : colors.background,
                        borderColor: isSelected ? primaryActionColor : colors.border }
                    ]}
                  >
                    <Text style={[styles.commPillText, { color: isSelected ? '#FFF' : colors.text }]}>
                      {comm.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <MenuRow 
            icon="settings-outline" 
            label="Advanced settings" 
            isLast={true}
            onPress={() => {}} 
          />

        </View>
      </ScrollView>

      {/* ── BOTTOM ACTION BAR ──────────────────────────────────── */}
      <View style={[styles.bottomBar, { borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 16), backgroundColor: colors.background }]}>
        <TouchableOpacity 
          onPress={handlePostSubmit} 
          disabled={!isPostEnabled} 
          style={[
            styles.fullWidthButton, 
            { backgroundColor: isPostEnabled ? primaryActionColor : colors.inputBg }
          ]}
          activeOpacity={0.8}
        >
          {createPostMutation.isPending ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={[styles.fullWidthButtonText, { color: isPostEnabled ? '#FFF' : colors.textMuted }]}>
              Share Now
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
    letterSpacing: -0.3,
  },
  // Bottom Bar
  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  fullWidthButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidthButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  
  // Content Area
  scrollContent: {
    paddingBottom: 60,
  },
  
  // Caption Section
  captionRow: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 120,
    alignItems: 'flex-start',
  },
  avatarWrapper: {
    marginRight: 12,
    marginTop: 2,
  },
  captionInputContainer: {
    flex: 1,
    marginRight: 12,
  },
  textInput: {
    fontSize: 16,
    lineHeight: 24,
    textAlignVertical: 'top',
    minHeight: 70,
  },
  
  // Thumbnail
  thumbnailContainer: {
    width: 72,
    height: 72,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeIconBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  thumbnailPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Menu List
  menuList: {
    marginTop: 4,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingRight: 16,
    marginLeft: 16, // Creates the iOS-style indented separator
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    marginRight: 14,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '400',
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '60%',
  },
  menuValue: {
    fontSize: 15,
    marginRight: 8,
  },
  
  // Expansions
  expansionArea: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  
  // Tags Inside Expansion
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tagRemove: {
    padding: 2,
    marginLeft: 2,
  },
  tagInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  tagInput: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  
  // Community Inside Expansion
  commScroll: {
    gap: 10,
  },
  commPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  commPillText: {
    fontSize: 14,
    fontWeight: '600',
  },
});