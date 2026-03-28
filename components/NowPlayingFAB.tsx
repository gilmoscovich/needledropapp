// components/NowPlayingFAB.tsx
// Floating action button — only visible when Spotify is actively playing.
// Auto-checks on foreground; tapping opens the QuickBookmarkModal.

import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Pressable, StyleSheet, Text, AppState, AppStateStatus } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { QuickBookmarkModal } from './QuickBookmarkModal';
import { useCurrentlyPlaying, CurrentTrackInfo } from '@/hooks/useCurrentlyPlaying';
import { colors, shadows, TAB_BAR_HEIGHT, spacing, typography } from '@/constants/theme';

const MIN_BACKGROUND_MS = 2000;

export function NowPlayingFAB() {
  const { fetchNowPlaying } = useCurrentlyPlaying();
  const [nowPlaying,   setNowPlaying]   = useState<CurrentTrackInfo | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const previousState  = useRef<AppStateStatus>(AppState.currentState);
  const backgroundedAt = useRef<number | null>(null);
  const isChecking     = useRef(false);

  // Silently refresh playing state — only keep result if actively playing
  const refresh = useCallback(async () => {
    if (isChecking.current) return;
    isChecking.current = true;
    try {
      const info = await fetchNowPlaying();
      setNowPlaying(info?.isPlaying ? info : null);
    } finally {
      isChecking.current = false;
    }
  }, [fetchNowPlaying]);

  // Check on mount
  useEffect(() => { refresh(); }, []);

  // Check on foreground return
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      const prev = previousState.current;

      if (nextState === 'background' || nextState === 'inactive') {
        backgroundedAt.current = Date.now();
      }

      if (nextState === 'active' && (prev === 'background' || prev === 'inactive')) {
        const elapsed = backgroundedAt.current !== null
          ? Date.now() - backgroundedAt.current
          : 0;
        if (elapsed >= MIN_BACKGROUND_MS) refresh();
      }

      previousState.current = nextState;
    });
    return () => sub.remove();
  }, [refresh]);

  const handlePress = () => {
    if (!nowPlaying) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setModalVisible(true);
  };

  if (!nowPlaying) return null;

  return (
    <>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.fab,
          pressed && { transform: [{ scale: 0.92 }], opacity: 0.9 },
        ]}
      >
        <View style={styles.gradient}>
          <MaterialCommunityIcons name="bookmark-music" size={22} color={colors.onPill} />
          <Text style={styles.label}>Bookmark Now</Text>
        </View>
      </Pressable>

      <QuickBookmarkModal
        visible={modalVisible}
        trackInfo={nowPlaying}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position:     'absolute',
    bottom:       TAB_BAR_HEIGHT + spacing.lg,
    right:        spacing.lg,
    borderRadius: 999,
    overflow:     'hidden',
    zIndex:       100,
    ...shadows.card,
  },
  gradient: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               spacing.sm,
    height:            52,
    paddingHorizontal: spacing.lg,
    borderRadius:      999,
    backgroundColor:   colors.pillBg,
  },
  label: {
    ...typography.titleMd,
    color: colors.onPill,
  },
});
