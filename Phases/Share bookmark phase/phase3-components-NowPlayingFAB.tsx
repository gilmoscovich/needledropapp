// components/NowPlayingFAB.tsx
// Floating action button that sits above the bottom nav on all tab screens.
// Tapping it fetches currently playing and opens the QuickBookmarkModal.

import { useState } from 'react';
import { Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { QuickBookmarkModal } from './QuickBookmarkModal';
import { useCurrentlyPlaying, CurrentTrackInfo } from '@/hooks/useCurrentlyPlaying';
import { colors, shadows, vinylGradient, TAB_BAR_HEIGHT, spacing } from '@/constants/theme';

export function NowPlayingFAB() {
  const { fetchNowPlaying, loading } = useCurrentlyPlaying();
  const [trackInfo,    setTrackInfo]    = useState<CurrentTrackInfo | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handlePress = async () => {
    if (loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const info = await fetchNowPlaying();
    if (info) {
      setTrackInfo(info);
      setModalVisible(true);
    }
  };

  return (
    <>
      <Pressable
        onPress={handlePress}
        disabled={loading}
        style={({ pressed }) => [
          styles.fab,
          pressed && { transform: [{ scale: 0.92 }], opacity: 0.9 },
        ]}
      >
        <LinearGradient
          colors={vinylGradient.colors}
          start={vinylGradient.start}
          end={vinylGradient.end}
          style={styles.gradient}
        >
          {loading ? (
            <ActivityIndicator color={colors.onPrimary} size="small" />
          ) : (
            <MaterialCommunityIcons
              name="bookmark-music"
              size={24}
              color={colors.onPrimary}
            />
          )}
        </LinearGradient>
      </Pressable>

      {trackInfo && (
        <QuickBookmarkModal
          visible={modalVisible}
          trackInfo={trackInfo}
          onClose={() => setModalVisible(false)}
        />
      )}
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
    width:          56,
    height:         56,
    borderRadius:   28,
    alignItems:     'center',
    justifyContent: 'center',
  },
});
