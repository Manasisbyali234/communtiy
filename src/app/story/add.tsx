import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { useToastStore } from '../../store/toastStore';

const { width, height } = Dimensions.get('window');

export default function AddStoryScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const showToast = useToastStore((state) => state.showToast);
  
  const [isCapturing, setIsCapturing] = useState(false);

  const handleCapture = () => {
    setIsCapturing(true);
    // Simulate capturing a photo
    setTimeout(() => {
      setIsCapturing(false);
      showToast('Story added successfully!', 'success');
      router.back();
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Mock Viewfinder Area */}
      <View style={styles.viewfinder}>
        {isCapturing ? (
          <View style={styles.loadingOverlay}>
            <Text style={styles.loadingText}>Capturing...</Text>
          </View>
        ) : (
          <View style={styles.cameraPreviewBox}>
            <Ionicons name="camera-outline" size={60} color="#555" />
            <Text style={styles.cameraPreviewText}>Camera Preview Mock</Text>
          </View>
        )}
      </View>

      {/* Top Actions */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="flash-outline" size={26} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Right Side Tools */}
      <View style={styles.toolsBar}>
        <TouchableOpacity style={styles.toolBtn}>
          <Text style={styles.toolIconText}>Aa</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolBtn}>
          <Ionicons name="color-palette-outline" size={24} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolBtn}>
          <Ionicons name="happy-outline" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.galleryButton}>
          <Ionicons name="images-outline" size={24} color="#FFF" />
        </TouchableOpacity>

        {/* Shutter Button */}
        <TouchableOpacity 
          style={styles.shutterRing}
          onPress={handleCapture}
          disabled={isCapturing}
        >
          <View style={styles.shutterButton} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.flipButton}>
          <Ionicons name="camera-reverse-outline" size={28} color="#FFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  viewfinder: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Platform.OS === 'ios' ? 40 : 20,
    marginVertical: Platform.OS === 'ios' ? 40 : 0, // margin to show black background
    overflow: 'hidden',
  },
  cameraPreviewBox: {
    alignItems: 'center',
    opacity: 0.5,
  },
  cameraPreviewText: {
    color: '#FFF',
    fontSize: 16,
    marginTop: 10,
    fontWeight: '500',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  topBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 5,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolsBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 120 : 90,
    right: 20,
    gap: 20,
    zIndex: 5,
  },
  toolBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolIconText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  bottomBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 60 : 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 30,
    zIndex: 5,
  },
  galleryButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 3,
  },
  shutterButton: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#FFF',
  },
  flipButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
