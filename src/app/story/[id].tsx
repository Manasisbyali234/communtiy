import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions, Animated, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useTheme } from '../../theme';

const { width, height } = Dimensions.get('window');

// Mock data
const STORY_DURATION = 5000;
const STORIES = {
  '1': { name: 'Gowda Sabha', avatarUrl: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=80', imageUrl: 'https://images.unsplash.com/photo-1542044896530-05d85be9b11a?w=800' },
  '2': { name: 'Kodagu DC', avatarUrl: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=80', imageUrl: 'https://images.unsplash.com/photo-1506744626753-2fea95d1a9ce?w=800' },
  '3': { name: 'Youth Club', avatarUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=80', imageUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800' },
  '4': { name: 'Farmers', avatarUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=80', imageUrl: 'https://images.unsplash.com/photo-1592982537447-6f2963162796?w=800' },
};

export default function ViewStoryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const story = STORIES[id as keyof typeof STORIES] || STORIES['1'];

  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start progress animation
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        router.back();
      }
    });

    return () => progress.stopAnimation();
  }, [id, router, progress]);

  const handlePressLeft = () => {
    // In a real app, go to previous story
    router.back();
  };

  const handlePressRight = () => {
    // In a real app, go to next story or finish
    router.back();
  };

  const progressBarWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.storyContainer}>
        {/* Background Image */}
        <Image
          source={{ uri: story.imageUrl }}
          style={styles.backgroundImage}
          contentFit="cover"
        />

        {/* Gradient overlay for header */}
        <View style={styles.gradientTop} />

        {/* Header (Progress Bar & User Info) */}
        <View style={styles.header}>
          {/* Progress Bar Container */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBg}>
              <Animated.View style={[styles.progressBarFill, { width: progressBarWidth }]} />
            </View>
          </View>

          {/* User Info Row */}
          <View style={styles.userInfoRow}>
            <View style={styles.userInfoLeft}>
              <Image source={{ uri: story.avatarUrl }} style={styles.avatar} contentFit="cover" />
              <Text style={styles.userName}>{story.name}</Text>
              <Text style={styles.timeText}>2h</Text>
            </View>
            <View style={styles.userInfoRight}>
              <TouchableOpacity style={styles.iconBtn}>
                <Ionicons name="ellipsis-horizontal" size={20} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
                <Ionicons name="close" size={28} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Touch Navigation Zones */}
        <View style={styles.touchZones}>
          <TouchableOpacity 
            style={styles.touchLeft} 
            activeOpacity={1} 
            onPress={handlePressLeft} 
          />
          <TouchableOpacity 
            style={styles.touchRight} 
            activeOpacity={1} 
            onPress={handlePressRight} 
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  storyContainer: {
    flex: 1,
    borderRadius: Platform.OS === 'ios' ? 12 : 0,
    overflow: 'hidden',
    position: 'relative',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFill,
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 10 : 20,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    zIndex: 10,
  },
  progressBarContainer: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 12,
  },
  progressBarBg: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFF',
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  userInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  userName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  timeText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
  userInfoRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    padding: 4,
  },
  touchZones: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
    zIndex: 5,
  },
  touchLeft: {
    flex: 0.3, // Left 30% goes back
  },
  touchRight: {
    flex: 0.7, // Right 70% goes forward
  },
});
