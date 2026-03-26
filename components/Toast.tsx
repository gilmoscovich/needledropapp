// components/Toast.tsx
// Global animated toast — reads from ToastContext, no props needed.
// Rendered once in _layout.tsx above everything.

import { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useToastContext } from '@/contexts/ToastContext';
import { colors, typography, spacing, radius, TAB_BAR_HEIGHT } from '@/constants/theme';
import { ToastType } from '@/types';

export function Toast() {
  const { toast } = useToastContext();
  const insets    = useSafeAreaInsets();
  const anim      = useRef(new Animated.Value(0)).current;
  const prevId    = useRef<number | null>(null);

  useEffect(() => {
    if (toast && toast.id !== prevId.current) {
      prevId.current = toast.id;
      Animated.spring(anim, {
        toValue:  1,
        tension:  100,
        friction: 10,
        useNativeDriver: true,
      }).start();
    } else if (!toast) {
      Animated.timing(anim, {
        toValue:  0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [toast]);

  const translateY = anim.interpolate({
    inputRange:  [0, 1],
    outputRange: [40, 0],
  });
  const opacity = anim;

  const type = toast?.type ?? 'default';

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        { bottom: TAB_BAR_HEIGHT + spacing.lg + insets.bottom },
        { opacity, transform: [{ translateY }] },
      ]}
    >
      <View style={[styles.pill, { backgroundColor: toastBg(type) }]}>
        <MaterialIcons name={toastIcon(type)} size={16} color={toastIconColor(type)} />
        <Text style={[styles.message, { color: toastTextColor(type) }]}>
          {toast?.message}
        </Text>
      </View>
    </Animated.View>
  );
}

function toastIcon(type: ToastType): React.ComponentProps<typeof MaterialIcons>['name'] {
  switch (type) {
    case 'success': return 'check-circle';
    case 'error':   return 'error-outline';
    default:        return 'info-outline';
  }
}

function toastBg(type: ToastType): string {
  switch (type) {
    case 'success': return colors.secondaryContainer;
    case 'error':   return colors.errorContainer;
    default:        return colors.surfaceContainerHighest;
  }
}

function toastIconColor(type: ToastType): string {
  switch (type) {
    case 'success': return colors.secondary;
    case 'error':   return colors.error;
    default:        return colors.primary;
  }
}

function toastTextColor(type: ToastType): string {
  switch (type) {
    case 'success': return colors.onSecondaryContainer;
    case 'error':   return colors.error;
    default:        return colors.onSurface;
  }
}

const styles = StyleSheet.create({
  container: {
    position:   'absolute',
    left:       spacing.lg,
    right:      spacing.lg,
    alignItems: 'center',
    zIndex:     9999,
  },
  pill: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical:   spacing.md,
    borderRadius:      radius.full,
    maxWidth:          360,
  },
  message: {
    ...typography.bodyMd,
  },
});
