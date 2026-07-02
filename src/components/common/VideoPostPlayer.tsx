import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

interface VideoPostPlayerProps {
  url: string;
}

export const VideoPostPlayer: React.FC<VideoPostPlayerProps> = ({ url }) => {
  return (
    <View style={styles.container}>
      <Image
        source={{ uri: url }}
        style={styles.image}
        contentFit="cover"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignSelf: 'stretch',
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

export default VideoPostPlayer;
