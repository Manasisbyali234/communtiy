import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Modal,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  height?: number;
  title?: string;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  children,
  height = SCREEN_HEIGHT * 0.7,
  title,
}) => {
  const { colors, spacing, roundness, typography } = useTheme();
  const insets = useSafeAreaInsets();

  const translateY = useSharedValue(height);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 20, stiffness: 100 });
      backdropOpacity.value = withTiming(0.5, { duration: 300 });
    } else {
      translateY.value = withTiming(height, { duration: 250 });
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible, height]);

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const handleClose = () => {
    translateY.value = withTiming(height, { duration: 200 });
    backdropOpacity.value = withTiming(0, { duration: 150 });
    setTimeout(onClose, 200);
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Backdrop — sits behind sheet */}
        <Animated.View
          style={[styles.backdrop, backdropAnimatedStyle, { backgroundColor: '#000000' }]}
          pointerEvents="none"
        />
        <Pressable style={styles.backdropPressable} onPress={handleClose} />

        {/* Sheet — sits on top */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <Animated.View
            style={[
              styles.sheet,
              sheetAnimatedStyle,
              {
                backgroundColor: colors.cardBg,
                height,
                borderTopLeftRadius: roundness.xl,
                borderTopRightRadius: roundness.xl,
                paddingBottom: insets.bottom + spacing.sm,
              },
            ]}
          >
            {/* Grabber */}
            <View style={styles.grabberContainer}>
              <View style={[styles.grabber, { backgroundColor: colors.border }]} />
            </View>

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.borderSecondary }]}>
              {title ? (
                <Text
                  style={[
                    styles.title,
                    {
                      color: colors.text,
                      fontSize: typography.sizes.lg,
                      fontWeight: typography.weights.bold,
                    },
                  ]}
                >
                  {title}
                </Text>
              ) : (
                <View style={{ flex: 1 }} />
              )}
              <Pressable
                onPress={handleClose}
                style={[styles.closeBtn, { backgroundColor: colors.inputBg }]}
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            {/* Body */}
            <View style={styles.body}>{children}</View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropPressable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  keyboardView: {
    width: '100%',
  },
  sheet: {
    width: '100%',
    overflow: 'hidden',
  },
  grabberContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 10,
  },
  grabber: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  title: {
    flex: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
});

export default BottomSheet;
