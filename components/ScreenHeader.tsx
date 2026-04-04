// components/ScreenHeader.tsx
// Single-row header: avatar (taps to log out) → title → optional right slot.

import { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSpotify } from '@/hooks/useSpotify';
import { colors, typography, spacing } from '@/constants/theme';

interface ScreenHeaderProps {
  title:      string;
  rightSlot?: React.ReactNode;
}

export function ScreenHeader({ title, rightSlot }: ScreenHeaderProps) {
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

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <Pressable
        onPress={handleLogout}
        style={[styles.avatar, !avatarUrl && styles.avatarPlaceholder]}
      >
        {avatarUrl && (
          <Image source={{ uri: avatarUrl }} style={styles.avatarImg} contentFit="cover" />
        )}
      </Pressable>

      <Text style={styles.title} numberOfLines={1}>{title}</Text>

      {rightSlot && <View>{rightSlot}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom:     spacing.lg,
    backgroundColor:   colors.background,
  },
  avatar: {
    width:        40,
    height:       40,
    borderRadius: 20,
    overflow:     'hidden',
    flexShrink:   0,
  },
  avatarPlaceholder: {
    backgroundColor: colors.surfaceContainerHigh,
  },
  avatarImg: {
    width:  '100%',
    height: '100%',
  },
  title: {
    ...typography.headlineLg,
    color: colors.primary,
    flex:  1,
  },
});
