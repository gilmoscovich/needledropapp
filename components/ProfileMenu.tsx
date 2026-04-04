// components/ProfileMenu.tsx
// Small dropdown menu that pops down from the avatar button.

import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius, shadows } from '@/constants/theme';

interface ProfileMenuProps {
  visible:   boolean;
  onClose:   () => void;
  onHelp:    () => void;
  onSignOut: () => void;
}

const AVATAR_SIZE   = 40;
const AVATAR_LEFT   = spacing.lg;

export function ProfileMenu({ visible, onClose, onHelp, onSignOut }: ProfileMenuProps) {
  const insets    = useSafeAreaInsets();
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  // Distance from screen top to the bottom edge of the avatar
  const menuTop = insets.top + spacing.sm + AVATAR_SIZE + 8;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1,   useNativeDriver: true, tension: 200, friction: 18 }),
        Animated.timing(fadeAnim,  { toValue: 1,   useNativeDriver: true, duration: 150 }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, { toValue: 0.85, useNativeDriver: true, duration: 120 }),
        Animated.timing(fadeAnim,  { toValue: 0,    useNativeDriver: true, duration: 120 }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      {/* Full-screen invisible tap target to dismiss */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={StyleSheet.absoluteFill} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.menu,
          { top: menuTop, left: AVATAR_LEFT },
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <MenuRow
          icon="help-outline"
          label="Help"
          onPress={() => { onClose(); onHelp(); }}
        />
        <View style={styles.divider} />
        <MenuRow
          icon="logout"
          label="Sign Out"
          onPress={() => { onClose(); onSignOut(); }}
          destructive
        />
      </Animated.View>
    </Modal>
  );
}

function MenuRow({
  icon,
  label,
  onPress,
  destructive = false,
}: {
  icon:        string;
  label:       string;
  onPress:     () => void;
  destructive?: boolean;
}) {
  const color = destructive ? colors.error : colors.onSurface;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <MaterialIcons name={icon as any} size={19} color={color} />
      <Text style={[styles.rowLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  menu: {
    position:        'absolute',
    width:           190,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius:    radius.lg,
    paddingVertical: spacing.xs,
    transformOrigin: 'top left',
    ...shadows.card,
  },
  divider: {
    height:          StyleSheet.hairlineWidth,
    backgroundColor: colors.outlineVariant,
    marginHorizontal: spacing.sm,
  },
  row: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               spacing.md,
    paddingVertical:   spacing.md,
    paddingHorizontal: spacing.lg,
  },
  rowPressed: {
    backgroundColor: colors.surfaceContainerHighest,
  },
  rowLabel: {
    ...typography.bodyMd,
  },
});
