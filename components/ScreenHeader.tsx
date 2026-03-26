// components/ScreenHeader.tsx
// Glassmorphic top header with wordmark + user avatar.
// Passed a title prop for the page heading below the bar.

import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, glassNavStyle } from '@/constants/theme';

interface ScreenHeaderProps {
  title:          string;
  subtitle?:      string;
  avatarUrl?:     string;
  onAvatarPress?: () => void;
  rightSlot?:     React.ReactNode;
}

export function ScreenHeader({
  title,
  subtitle,
  avatarUrl,
  onAvatarPress,
  rightSlot,
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  const Inner = (
    <View style={[styles.bar, { paddingTop: insets.top + spacing.sm }]}>
      {/* Left: avatar + wordmark */}
      <View style={styles.left}>
        {(avatarUrl || onAvatarPress) && (
          <Pressable onPress={onAvatarPress} style={[styles.avatar, !avatarUrl && styles.avatarPlaceholder]}>
            {avatarUrl && (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImg} contentFit="cover" />
            )}
          </Pressable>
        )}
        <Text style={styles.wordmark}>NEEDLE DROP</Text>
      </View>

      {/* Right slot (search icon, etc.) */}
      {rightSlot && <View style={styles.right}>{rightSlot}</View>}
    </View>
  );

  return (
    <View>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={70} tint="dark" style={styles.blurWrapper}>
          {Inner}
        </BlurView>
      ) : (
        <View style={[styles.blurWrapper, { backgroundColor: glassNavStyle.backgroundColor }]}>
          {Inner}
        </View>
      )}

      {/* Page title — below the bar, part of scroll header */}
      <View style={styles.titleBlock}>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        <Text style={styles.title}>{title}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  blurWrapper: {
    overflow: 'hidden',
  },
  bar: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom:     spacing.md,
  },
  left: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing.sm,
  },
  avatar: {
    width:        32,
    height:       32,
    borderRadius: 16,
    overflow:     'hidden',
  },
  avatarImg: {
    width:  '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    backgroundColor: colors.surfaceContainerHigh,
  },
  wordmark: {
    ...typography.labelLg,
    color:         colors.primary,
    letterSpacing: 3,
  },
  right: {
    flexDirection: 'row',
    gap:           spacing.lg,
  },
  titleBlock: {
    paddingHorizontal: spacing.lg,
    paddingTop:        spacing.xl,
    paddingBottom:     spacing.md,
    backgroundColor:   colors.background,
  },
  subtitle: {
    ...typography.labelSm,
    color:         colors.secondary,
    marginBottom:  4,
    letterSpacing: 3,
  },
  title: {
    ...typography.headlineLg,
    color: colors.primary,
  },
});
