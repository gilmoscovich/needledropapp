// components/ScreenHeader.tsx
// Glassmorphic top header with user avatar (tapping opens logout).
// Fetches user profile internally — no props needed for auth.

import { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSpotify } from '@/hooks/useSpotify';
import { colors, typography, spacing, glassNavStyle } from '@/constants/theme';

interface ScreenHeaderProps {
  title:      string;
  subtitle?:  string;
  rightSlot?: React.ReactNode;
}

export function ScreenHeader({ title, subtitle, rightSlot }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { getUserProfile, logout, ready } = useSpotify();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    getUserProfile()
      .then(user => setAvatarUrl(user?.images?.[0]?.url ?? null))
      .catch(() => {});
  }, [ready]);

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Log Out',
      "You'll need to log back in to use NeedleDrop.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  }, [logout, router]);

  const Inner = (
    <View style={[styles.bar, { paddingTop: insets.top + spacing.sm }]}>
      <Pressable
        onPress={handleLogout}
        style={[styles.avatar, !avatarUrl && styles.avatarPlaceholder]}
      >
        {avatarUrl && (
          <Image source={{ uri: avatarUrl }} style={styles.avatarImg} contentFit="cover" />
        )}
      </Pressable>

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
  avatar: {
    width:        36,
    height:       36,
    borderRadius: 18,
    overflow:     'hidden',
  },
  avatarPlaceholder: {
    backgroundColor: colors.surfaceContainerHigh,
  },
  avatarImg: {
    width:  '100%',
    height: '100%',
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
