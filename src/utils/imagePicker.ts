import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { apiClient } from '../api/client';

export interface PickedImage {
  localUri: string;
  filename: string;
  mimeType: string;
}

export async function pickImage(): Promise<PickedImage | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 0.8,
  });

  if (result.canceled) return null;

  const asset = result.assets[0];
  const filename = asset.uri.split('/').pop() ?? 'photo.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const mimeType = match ? `image/${match[1].toLowerCase().replace('jpg', 'jpeg')}` : 'image/jpeg';

  return { localUri: asset.uri, filename, mimeType };
}

export async function uploadImage(picked: PickedImage): Promise<string | null> {
  const formData = new FormData();

  if (Platform.OS === 'web') {
    const response = await fetch(picked.localUri);
    const blob = await response.blob();
    formData.append('file', new File([blob], picked.filename, { type: picked.mimeType }));
  } else {
    formData.append('file', { uri: picked.localUri, name: picked.filename, type: picked.mimeType } as any);
  }

  const res = await apiClient.post('/media/upload', formData);

  const url = res.data?.data?.url ?? res.data?.url ?? null;
  return url;
}

async function _uploadToEndpoint(picked: PickedImage, endpoint: string): Promise<string | null> {
  const formData = new FormData();

  if (Platform.OS === 'web') {
    const response = await fetch(picked.localUri);
    const blob = await response.blob();
    formData.append('file', new File([blob], picked.filename, { type: picked.mimeType }));
  } else {
    formData.append('file', { uri: picked.localUri, name: picked.filename, type: picked.mimeType } as any);
  }

  const res = await apiClient.post(endpoint, formData);
  return res.data?.data?.url ?? res.data?.url ?? null;
}

export async function uploadProfilePhoto(picked: PickedImage): Promise<string | null> {
  return _uploadToEndpoint(picked, '/media/upload-profile-photo');
}

export async function uploadCoverPhoto(picked: PickedImage): Promise<string | null> {
  return _uploadToEndpoint(picked, '/media/upload-cover-photo');
}

export async function uploadPostImage(picked: PickedImage): Promise<string | null> {
  return _uploadToEndpoint(picked, '/media/upload-post-image');
}

/** @deprecated use pickImage + uploadImage separately */
export async function pickAndSaveImage(): Promise<string | null> {
  const picked = await pickImage();
  if (!picked) return null;
  return uploadImage(picked);
}
