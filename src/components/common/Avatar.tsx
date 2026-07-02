import React, { useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme';

interface AvatarProps {
  url?: string;
  name?: string;
  size?: number;
  gradientBorder?: boolean;
  online?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  url,
  name = '',
  size = 40,
  gradientBorder = false,
  online = false,
}) => {
  const { colors, roundness, typography, palette } = useTheme();

  const getInitials = (fullName: string) => {
    if (!fullName) return '';
    const parts = fullName.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  const ringPadding = gradientBorder ? 2.5 : 0;
  const innerSize = size - ringPadding * 2;

  const [imgError, setImgError] = useState(false);
  React.useEffect(() => setImgError(false), [url]);

  const renderImage = () => {
    if (url && !imgError) {
      return (
        <Image
          source={{ uri: url }}
          style={{
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
          }}
          contentFit="cover"
          transition={300}
          onError={() => setImgError(true)}
        />
      );
    }

    return (
      <View
        style={[
          styles.fallback,
          {
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
            backgroundColor: colors.surfaceSecondary,
          },
        ]}
      >
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: innerSize * 0.4,
            fontWeight: typography.weights.bold,
          }}
        >
          {getInitials(name)}
        </Text>
      </View>
    );
  };

  const renderStatus = () => {
    if (!online) return null;
    const indicatorSize = size * 0.28;
    return (
      <View
        style={[
          styles.statusIndicator,
          {
            width: indicatorSize,
            height: indicatorSize,
            borderRadius: indicatorSize / 2,
            backgroundColor: palette.success,
            borderColor: colors.background,
            borderWidth: 1.5,
            right: -2,
            bottom: -2,
          },
        ]}
      />
    );
  };

  if (gradientBorder) {
    return (
      <View style={{ width: size, height: size }}>
        <LinearGradient
          colors={[palette.gradientStart, palette.gradientMiddle, palette.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.gradientContainer,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              padding: ringPadding,
            },
          ]}
        >
          <View
            style={{
              backgroundColor: colors.background,
              borderRadius: (size - 2) / 2,
              padding: 2,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {renderImage()}
          </View>
        </LinearGradient>
        {renderStatus()}
      </View>
    );
  }

  return (
    <View style={{ width: size, height: size }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1,
          borderColor: colors.borderSecondary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {renderImage()}
      </View>
      {renderStatus()}
    </View>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIndicator: {
    position: 'absolute',
  },
});
export default Avatar;
