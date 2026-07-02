import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToastStore } from '../../store/toastStore';
import { useTheme } from '../../theme';
import { Ionicons } from '@expo/vector-icons';

export const Toast: React.FC = () => {
  const { toast, hideToast } = useToastStore();
  const { colors, spacing, roundness, typography, shadows, palette } = useTheme();
  const insets = useSafeAreaInsets();

  const translateY = useSharedValue(-150);

  useEffect(() => {
    if (toast.visible) {
      translateY.value = withSpring(insets.top + spacing.sm, {
        damping: 15,
        stiffness: 120,
      });

      const timer = setTimeout(() => {
        hideToast();
      }, 3500);

      return () => clearTimeout(timer);
    } else {
      translateY.value = withTiming(-150, { duration: 300 });
    }
  }, [toast.visible, insets.top]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  if (!toast.message && !toast.visible) return null;

  const getToastIcon = () => {
    switch (toast.type) {
      case 'success':
        return <Ionicons name="checkmark-circle" size={20} color={palette.success} />;
      case 'error':
        return <Ionicons name="alert-circle" size={20} color={palette.error} />;
      case 'info':
      default:
        return <Ionicons name="information-circle" size={20} color={palette.info} />;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'success':
        return palette.success;
      case 'error':
        return palette.error;
      case 'info':
      default:
        return palette.info;
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        animatedStyle,
        {
          backgroundColor: colors.cardBg,
          borderRadius: roundness.lg,
          borderColor: getBorderColor(),
          borderLeftWidth: 5,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          ...shadows.lg,
        },
      ]}
    >
      <View style={styles.content}>
        {getToastIcon()}
        <Text
          numberOfLines={2}
          style={[
            styles.text,
            {
              color: colors.text,
              fontSize: typography.sizes.sm,
              marginLeft: spacing.sm,
            },
          ]}
        >
          {toast.message}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 99999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    flex: 1,
    fontWeight: '500',
  },
});
export default Toast;
