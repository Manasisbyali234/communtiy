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
  Switch,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';
import { useCreateEventMutation } from '../../api/event';
import { apiClient } from '../../api/client';

function InputField({ label, value, onChangeText, placeholder, multiline = false, icon = null, colors, keyboardType }: any) {
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
          keyboardType={keyboardType}
        />
      </View>
    </View>
  );
}

export default function CreateEvent() {
  const { colors, spacing, typography, roundness } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const showToast = useToastStore((state) => state.showToast);
  const { user } = useAuthStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [venue, setVenue] = useState('');
  const [volunteersRequired, setVolunteersRequired] = useState(false);
  const [bannerUri, setBannerUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const createEvent = useCreateEventMutation();

  const pickBanner = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showToast('Permission to access photos is required.', 'error');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled) setBannerUri(result.assets[0].uri);
  };

  const isFormValid = title.trim() && description.trim() && date.trim().match(/^\d{2}\/\d{2}\/\d{4}$/) && venue.trim();

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)' as any);
  };

  const uploadBanner = async (uri: string): Promise<string> => {
    const formData = new FormData();

    if (Platform.OS === 'web') {
      const response = await fetch(uri);
      const blob = await response.blob();
      const ext = blob.type.split('/')[1] ?? 'jpg';
      formData.append('file', new File([blob], `banner.${ext}`, { type: blob.type }));
    } else {
      const filename = uri.split('/').pop() ?? 'banner.jpg';
      const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
      const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
      formData.append('file', { uri, name: filename, type: mimeType } as any);
    }

    const res = await apiClient.post('/media/upload-event', formData);
    return res.data.data.url as string;
  };

  const handleSubmit = async () => {
    if (!isFormValid) return;
    let startsAt: string;
    try {
      const [day, month, year] = date.trim().split('/');
      let hours = 0, minutes = 0;
      if (time.trim()) {
        const t = time.trim();
        const isPM = /pm/i.test(t);
        const isAM = /am/i.test(t);
        const [hStr, mStr] = t.replace(/[apm]/gi, '').trim().split(':');
        hours = parseInt(hStr) || 0;
        minutes = parseInt(mStr) || 0;
        if (isPM && hours < 12) hours += 12;
        if (isAM && hours === 12) hours = 0;
      }
      const parsed = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), hours, minutes);
      startsAt = isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
    } catch {
      startsAt = new Date().toISOString();
    }

    let coverUrl: string | undefined;
    if (bannerUri) {
      try {
        setUploading(true);
        coverUrl = await uploadBanner(bannerUri);
      } catch {
        showToast('Image upload failed. Event will be saved without a banner.', 'error');
      } finally {
        setUploading(false);
      }
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      location: venue.trim(),
      startsAt,
      ...(coverUrl ? { coverUrl } : {}),
    };
    try {
      await createEvent.mutateAsync(payload);
    } catch {
      // onError in the mutation already saves it locally
    }
    showToast('Event created successfully!', 'success');
    goBack();
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Create Event</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        
        {/* Banner Uploader */}
        <TouchableOpacity
          style={[styles.bannerUpload, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
          activeOpacity={0.7}
          onPress={pickBanner}
        >
          {bannerUri ? (
            <>
              <Image source={{ uri: bannerUri }} style={styles.bannerImage} />
              <View style={styles.bannerEditBadge}>
                <Ionicons name="pencil" size={14} color="#FFF" />
              </View>
            </>
          ) : (
            <>
              <Ionicons name="image-outline" size={32} color={colors.textMuted} />
              <Text style={[styles.bannerUploadText, { color: colors.textSecondary }]}>Add Event Banner</Text>
              <Text style={[styles.bannerUploadHint, { color: colors.textMuted }]}>Tap to upload (16:9)</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.formContent}>
          <InputField label="Event Title" value={title} onChangeText={setTitle} placeholder="e.g. Village Festival 2026" colors={colors} />
          <InputField label="Description" value={description} onChangeText={setDescription} placeholder="Describe your event..." multiline colors={colors} />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <InputField label="Date" value={date} onChangeText={setDate} placeholder="DD/MM/YYYY" icon="calendar-outline" colors={colors} keyboardType="numeric" />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <InputField label="Time" value={time} onChangeText={setTime} placeholder="HH:MM AM" icon="time-outline" colors={colors} />
            </View>
          </View>

          <InputField label="Venue / Location" value={venue} onChangeText={setVenue} placeholder="e.g. Community Hall, Mandya" icon="location-outline" colors={colors} />
          <InputField label="Category" value={category} onChangeText={setCategory} placeholder="e.g. Cultural, Meeting, Sports" colors={colors} />

          {/* Switch row for Volunteers */}
          <View style={styles.switchRow}>
            <View>
              <Text style={[styles.switchLabel, { color: colors.text }]}>Volunteers Required</Text>
              <Text style={[styles.switchDesc, { color: colors.textSecondary }]}>Allow members to register as volunteers</Text>
            </View>
            <Switch
              value={volunteersRequired}
              onValueChange={setVolunteersRequired}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFF"
            />
          </View>
        </View>

      </ScrollView>

      {/* ── BOTTOM ACTION BAR ──────────────────────────────────── */}
      <View style={[styles.bottomBar, { borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 16), backgroundColor: colors.background }]}>
        <TouchableOpacity 
          onPress={handleSubmit} 
          disabled={!isFormValid || createEvent.isPending || uploading} 
          style={[
            styles.fullWidthButton, 
            { backgroundColor: isFormValid && !createEvent.isPending && !uploading ? colors.primary : colors.inputBg }
          ]}
          activeOpacity={0.8}
        >
          <Text style={[styles.fullWidthButtonText, { color: isFormValid && !createEvent.isPending && !uploading ? '#FFF' : colors.textMuted }]}>
            {uploading ? 'Uploading image...' : createEvent.isPending ? 'Publishing...' : 'Publish Event'}
          </Text>
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
  bannerUpload: {
    height: 160,
    margin: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  bannerEditBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 20,
    padding: 6,
  },
  bannerUploadText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  bannerUploadHint: {
    marginTop: 4,
    fontSize: 12,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  switchDesc: {
    fontSize: 13,
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
