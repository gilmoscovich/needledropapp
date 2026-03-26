// components/Toast.tsx
// Floating notification bar — success / error / default.
// Positioned just above the tab bar.

import { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ToastType } from '@/types';
import { colors, typography, spacing, radius, TAB_BAR_HEIGHT } from '@/constants/theme';

interface ToastProps {
  message: string;
  type:    ToastType;
}

const ICON: Record<ToastType, React.ComponentProps<typeof MaterialIcons>['name']> = {
  success: 'check-circle',
  error:   'error',
  default: 'info',
};

const BG: Record<ToastType, string> = {
  success: colors.secondaryContainer,
  error:   colors.errorContainer,
  default: colors.surfaceContainerHigh,
};

const TEXT_COLOR: Record<ToastType, string> = {
  success: colors.secondary,
  error:   colors.error,
  default: colors.onSurface,
};

export function Toast({ message, type }: ToastProps) {
  const opacity   = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(opacity,    { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 8 }),
    ]).start();
  }, [message]);

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: BG[type] },
        { opacity, transform: [{ translateY }] },
      ]}
    >
      <MaterialIcons name={ICON[type]} size={16} color={TEXT_COLOR[type]} />
      <Text style={[styles.text, { color: TEXT_COLOR[type] }]} numberOfLines={2}>
        {message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position:          'absolute',
    bottom:            TAB_BAR_HEIGHT + spacing.sm,
    left:              spacing.lg,
    right:             spacing.lg,
    flexDirection:     'row',
    alignItems:        'center',
    gap:               spacing.sm,
    paddingVertical:   spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius:      radius.xxl,
    zIndex:            999,
  },
  text: {
    ...typography.bodyMd,
    flex: 1,
  },
});
