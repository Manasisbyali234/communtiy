import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { useToastStore } from '../../store/toastStore';
import * as ImagePicker from 'expo-image-picker';
import { apiClient } from '../../api/client';
import { useQueryClient } from '@tanstack/react-query';
import { communityKeys } from '../../api/community';
import { feedKeys } from '../../api/feed';
import { useThemeStore } from '../../store/themeStore';

type InputFieldProps = {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  multiline?: boolean;
  icon?: any;
  colors: any;
};

function InputField({ label, value, onChangeText, placeholder, multiline = false, icon = null, colors }: InputFieldProps) {
  return (
    <View style={styles.inputContainer}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
        {icon && <Ionicons name={icon} size={20} color={colors.textMuted} style={styles.inputIcon} />}
        <TextInput
          style={[
            styles.input,
            { color: colors.text },
            multiline && { height: 100, textAlignVertical: 'top', paddingTop: 12 },
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          multiline={multiline}
        />
      </View>
    </View>
  );
}

export default function CreateCommunity() {
  const { colors, spacing, typography, roundness } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const showToast = useToastStore((state) => state.showToast);

  const queryClient = useQueryClient();

  const { themeMode, setThemeMode } = useThemeStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [village, setVillage] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [bannerUri, setBannerUri] = useState<string | null>(null);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Rules
  const [rules, setRules] = useState<{ title: string; description: string }[]>([]);
  const [ruleTitle, setRuleTitle] = useState('');
  const [ruleDesc, setRuleDesc] = useState('');

  // Feed post prompts
  const [feedPosts, setFeedPosts] = useState<string[]>([]);
  const [feedPostInput, setFeedPostInput] = useState('');

  const addRule = () => {
    if (!ruleTitle.trim()) return;
    setRules((prev) => [...prev, { title: ruleTitle.trim(), description: ruleDesc.trim() }]);
    setRuleTitle('');
    setRuleDesc('');
  };

  const removeRule = (idx: number) => setRules((prev) => prev.filter((_, i) => i !== idx));

  const addFeedPost = () => {
    if (!feedPostInput.trim()) return;
    setFeedPosts((prev) => [...prev, feedPostInput.trim()]);
    setFeedPostInput('');
  };

  const removeFeedPost = (idx: number) => setFeedPosts((prev) => prev.filter((_, i) => i !== idx));

  const isFormValid = name.trim() && description.trim() && category.trim();

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)' as any);
  };

  const pickImage = async (type: 'banner' | 'avatar') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showToast('Permission to access photos is required', 'error');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: type === 'banner' ? [16, 9] : [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      if (type === 'banner') setBannerUri(result.assets[0].uri);
      else setAvatarUri(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string): Promise<string> => {
    const filename = uri.split('/').pop()?.split('?')[0] ?? 'image.jpg';
    const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

    const formData = new FormData();

    if (Platform.OS === 'web') {
      const blobRes = await fetch(uri);
      const blob = await blobRes.blob();
      formData.append('file', new File([blob], filename, { type: blob.type || mimeType }));
    } else {
      formData.append('file', { uri, name: filename, type: mimeType } as any);
    }

    const res = await apiClient.post('/media/upload', formData);
    return res.data.data.url as string;
  };

  const handleSubmit = async () => {
    if (!isFormValid) return;
    setUploading(true);
    try {
      const [bannerUrl, avatarUrl] = await Promise.all([
        bannerUri ? uploadImage(bannerUri) : Promise.resolve(undefined),
        avatarUri ? uploadImage(avatarUri) : Promise.resolve(undefined),
      ]);
      const res = await apiClient.post('/communities', {
        name: name.trim(),
        description: description.trim() || undefined,
        category: category.trim(),
        isPrivate,
        bannerUrl,
        avatarUrl,
      });
      const newCommunityId: string = res.data?.data?.id ?? res.data?.id;

      // Add rules
      if (newCommunityId && rules.length > 0) {
        await Promise.all(
          rules.map((r) => apiClient.post(`/communities/${newCommunityId}/rules`, { title: r.title, description: r.description || undefined }))
        );
      }

      await queryClient.invalidateQueries({ queryKey: communityKeys.list() });
      await queryClient.invalidateQueries({ queryKey: feedKeys.posts() });
      showToast('Community created! Now share your first post.', 'success');
      if (newCommunityId) {
        router.replace({ pathname: '/create/post', params: { communityId: newCommunityId } } as any);
      } else {
        goBack();
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message ?? err?.message ?? 'Failed to create community', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ── HEADER ────────────────────────────────────────────────── */}
      <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: Math.max(insets.top, 12) + 10 }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={goBack} style={styles.iconBtn}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Create Community</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        
        {/* Cover & Logo Uploader */}
        <View style={styles.imagesSection}>
          <TouchableOpacity
            style={[styles.coverUpload, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
            activeOpacity={0.7}
            onPress={() => pickImage('banner')}
          >
            {bannerUri ? (
              <Image source={{ uri: bannerUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            ) : (
              <>
                <Ionicons name="image-outline" size={32} color={colors.textMuted} />
                <Text style={[styles.uploadText, { color: colors.textSecondary }]}>Add Cover Photo</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.logoUpload, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
            activeOpacity={0.9}
            onPress={() => pickImage('avatar')}
          >
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={[StyleSheet.absoluteFill, { borderRadius: 40 }]} resizeMode="cover" />
            ) : (
              <Ionicons name="camera-outline" size={28} color={colors.textMuted} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.formContent}>
          <InputField label="Community Name" value={name} onChangeText={setName} placeholder="e.g. Mandya Youth Association" colors={colors} />
          <InputField label="Description" value={description} onChangeText={setDescription} placeholder="What is this community about?" multiline colors={colors} />
          
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <InputField label="Category" value={category} onChangeText={setCategory} placeholder="e.g. Youth, Farmers" colors={colors} />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <InputField label="Village / Location" value={village} onChangeText={setVillage} placeholder="Location" icon="location-outline" colors={colors} />
            </View>
          </View>

          {/* Privacy + Theme toggles */}
          <View style={{ marginBottom: 20 }}>
            <View style={[styles.switchRow, { borderColor: colors.border, backgroundColor: colors.inputBg }]}>
              <View style={styles.switchLeft}>
                <Ionicons
                  name={isPrivate ? 'lock-closed-outline' : 'earth-outline'}
                  size={20}
                  color={isPrivate ? colors.primary : colors.textSecondary}
                />
                <View style={{ marginLeft: 12 }}>
                  <Text style={[styles.switchLabel, { color: colors.text }]}>
                    {isPrivate ? 'Private Community' : 'Public Community'}
                  </Text>
                  <Text style={[styles.switchDesc, { color: colors.textSecondary }]}>
                    {isPrivate
                      ? 'Only approved members can join & view posts'
                      : 'Anyone can find and join this community'}
                  </Text>
                </View>
              </View>
              <Switch
                value={isPrivate}
                onValueChange={setIsPrivate}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFF"
              />
            </View>

            <View style={[styles.switchRow, { borderColor: colors.border, backgroundColor: colors.inputBg, marginTop: 10 }]}>
              <View style={styles.switchLeft}>
                <Ionicons
                  name={themeMode === 'dark' ? 'moon-outline' : 'sunny-outline'}
                  size={20}
                  color={colors.textSecondary}
                />
                <View style={{ marginLeft: 12 }}>
                  <Text style={[styles.switchLabel, { color: colors.text }]}>
                    {themeMode === 'dark' ? 'Dark Mode' : 'Light Mode'}
                  </Text>
                  <Text style={[styles.switchDesc, { color: colors.textSecondary }]}>
                    {themeMode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                  </Text>
                </View>
              </View>
              <Switch
                value={themeMode === 'dark'}
                onValueChange={(val) => setThemeMode(val ? 'dark' : 'light')}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFF"
              />
            </View>
          </View>

          {/* Rules section */}
          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Community Rules</Text>
            {rules.map((r, idx) => (
              <View key={idx} style={[styles.listItem, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.listItemTitle, { color: colors.text }]}>{r.title}</Text>
                  {!!r.description && <Text style={[styles.listItemDesc, { color: colors.textSecondary }]}>{r.description}</Text>}
                </View>
                <TouchableOpacity onPress={() => removeRule(idx)}>
                  <Ionicons name="close-circle" size={20} color={colors.error ?? '#B71C1C'} />
                </TouchableOpacity>
              </View>
            ))}
            <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border, marginBottom: 8 }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={ruleTitle}
                onChangeText={setRuleTitle}
                placeholder="Rule title"
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border, marginBottom: 8 }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={ruleDesc}
                onChangeText={setRuleDesc}
                placeholder="Description (optional)"
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <TouchableOpacity
              onPress={addRule}
              style={[styles.addBtn, { borderColor: colors.primary }]}
            >
              <Ionicons name="add" size={18} color={colors.primary} />
              <Text style={[styles.addBtnText, { color: colors.primary }]}>Add Rule</Text>
            </TouchableOpacity>
          </View>

          {/* Feed Posts section */}
          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Feed Post Prompts</Text>
            <Text style={[styles.sectionHint, { color: colors.textSecondary }]}>Suggest topics for members to post about.</Text>
            {feedPosts.map((fp, idx) => (
              <View key={idx} style={[styles.listItem, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <Text style={[styles.listItemTitle, { color: colors.text, flex: 1 }]}>{fp}</Text>
                <TouchableOpacity onPress={() => removeFeedPost(idx)}>
                  <Ionicons name="close-circle" size={20} color={colors.error ?? '#B71C1C'} />
                </TouchableOpacity>
              </View>
            ))}
            <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border, marginBottom: 8 }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={feedPostInput}
                onChangeText={setFeedPostInput}
                placeholder="e.g. Share your harvest photos!"
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <TouchableOpacity
              onPress={addFeedPost}
              style={[styles.addBtn, { borderColor: colors.primary }]}
            >
              <Ionicons name="add" size={18} color={colors.primary} />
              <Text style={[styles.addBtnText, { color: colors.primary }]}>Add Prompt</Text>
            </TouchableOpacity>
          </View>

        </View>

      </ScrollView>

      {/* ── BOTTOM ACTION BAR ──────────────────────────────────── */}
      <View style={[styles.bottomBar, { borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 16), backgroundColor: colors.background }]}>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!isFormValid || uploading}
          style={[
            styles.fullWidthButton,
            { backgroundColor: isFormValid && !uploading ? colors.primary : colors.inputBg }
          ]}
          activeOpacity={0.8}
        >
          {uploading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={[styles.fullWidthButtonText, { color: isFormValid ? '#FFF' : colors.textMuted }]}>
              Create Page
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
  scrollContent: {
    paddingBottom: 40,
  },
  imagesSection: {
    position: 'relative',
    marginBottom: 40,
  },
  coverUpload: {
    height: 140,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  uploadText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  logoUpload: {
    position: 'absolute',
    bottom: -35,
    left: 20,
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  formContent: {
    paddingHorizontal: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 4,
  },
  switchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 12,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  switchDesc: {
    fontSize: 12,
  },
  sectionBlock: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 13,
    marginBottom: 10,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  listItemTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  listItemDesc: {
    fontSize: 13,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    alignSelf: 'flex-start',
    gap: 4,
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
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
});
