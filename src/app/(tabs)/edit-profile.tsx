import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { apiClient } from '../../api/client';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTheme } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Avatar from '../../components/common/Avatar';
import { Ionicons } from '@expo/vector-icons';
import { pickImage, uploadImage, PickedImage } from '../../utils/imagePicker';

const profileSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters').max(30, 'Name must be under 30 characters'),
  bio: z.string().max(160, 'Bio must be under 160 characters').optional(),
  avatarUrl: z.string().url('Enter a valid image URL').or(z.literal('')).optional(),
  village: z.string().max(50, 'Village must be under 50 characters').optional(),
  occupation: z.string().max(50, 'Occupation must be under 50 characters').optional(),
  languages: z.string().max(100, 'Languages must be under 100 characters').optional(),
  interests: z.string().max(100, 'Interests must be under 100 characters').optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function EditProfile() {
  const { colors, spacing, typography, roundness } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, updateProfile } = useAuthStore();
  const showToast = useToastStore((state) => state.showToast);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName || '',
      bio: user?.bio || '',
      avatarUrl: user?.avatarUrl || '',
      village: user?.village || '',
      occupation: user?.occupation || '',
      languages: user?.languages || '',
      interests: user?.interests || '',
    },
  });

  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);
  const [pickedImage, setPickedImage] = useState<PickedImage | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const handlePickPhoto = async () => {
    setPhotoError(null);
    try {
      const picked = await pickImage();
      if (picked) {
        setLocalAvatarUri(picked.localUri);
        setPickedImage(picked);
      }
    } catch (e: any) {
      setPhotoError('Failed to select photo. Please try a valid image.');
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      let avatarUrl: string | undefined = data.avatarUrl || undefined;
      if (pickedImage) {
        const uploaded = await uploadImage(pickedImage);
        if (uploaded) {
          // Normalize relative URL to absolute
          avatarUrl = uploaded.startsWith('http')
            ? uploaded
            : `${apiClient.defaults.baseURL!.replace('/api/v1', '')}${uploaded}`;
        } else {
          showToast('Photo upload failed, other changes will still save.', 'error');
        }
      }

      const res = await apiClient.put('/users/me', {
        displayName: data.displayName,
        bio: data.bio || undefined,
        avatarUrl: avatarUrl || undefined,
        village: data.village || undefined,
        occupation: data.occupation || undefined,
        languages: data.languages || undefined,
        interests: data.interests || undefined,
      });

      const updated = res.data?.data ?? res.data;
      // Ensure avatarUrl in store is always absolute
      if (avatarUrl) updated.avatarUrl = avatarUrl;
      updateProfile(updated);
      showToast('Profile updated successfully!', 'success');
      router.back();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to update profile. Try again.';
      showToast(msg, 'error');
      console.error('Edit profile error:', e?.response?.data ?? e);
    }
  };

  if (!user) return null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.keyboardView, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top, paddingHorizontal: spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Navbar */}
        <View style={styles.navbar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.navTitle, { color: colors.text, fontSize: typography.sizes.lg }]}>
            Edit Profile
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Change Photo Option */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handlePickPhoto} activeOpacity={0.8}>
            <Avatar url={localAvatarUri ?? user.avatarUrl} name={user.displayName} size={80} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.changePhotoBtn} onPress={handlePickPhoto}>
            <Text style={{ color: colors.primary, fontSize: typography.sizes.sm, fontWeight: '700' }}>
              Change Profile Photo
            </Text>
          </TouchableOpacity>
          {photoError && (
            <Text style={{ color: colors.error ?? 'red', fontSize: typography.sizes.xs, marginTop: 4 }}>
              {photoError}
            </Text>
          )}
        </View>

        {/* Form Inputs */}
        <View style={styles.formContainer}>
          <Controller
            control={control}
            name="displayName"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Full Name"
                placeholder="Alex Rivers"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                leftIcon="person-outline"
                error={errors.displayName?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="bio"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Bio"
                placeholder="Tell us about yourself"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                multiline
                numberOfLines={3}
                leftIcon="document-text-outline"
                error={errors.bio?.message}
                containerStyle={{ minHeight: 90 }}
              />
            )}
          />
          
          <Controller
            control={control}
            name="village"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Native Village"
                placeholder="e.g. Kodagu"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                leftIcon="home-outline"
                error={errors.village?.message}
              />
            )}
          />
          
          <Controller
            control={control}
            name="occupation"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Occupation"
                placeholder="e.g. Agriculturist"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                leftIcon="briefcase-outline"
                error={errors.occupation?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="languages"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Languages"
                placeholder="e.g. Kannada, English"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                leftIcon="language-outline"
                error={errors.languages?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="interests"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Interests"
                placeholder="e.g. Agriculture, Volunteering"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                leftIcon="heart-outline"
                error={errors.interests?.message}
              />
            )}
          />

          <Button
            title="Save Updates"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            variant="gradient"
            style={styles.saveBtn}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 20,
  },
  backBtn: {
    padding: 4,
  },
  navTitle: {
    fontWeight: '700',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  changePhotoBtn: {
    marginTop: 12,
    padding: 4,
  },
  formContainer: {
    width: '100%',
  },
  saveBtn: {
    height: 52,
    marginTop: 20,
  },
});
