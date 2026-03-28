// components/NowPlayingFAB.tsx
// Floating action button that sits above the bottom nav on all tab screens.
// Tapping it fetches currently playing and opens the QuickBookmarkModal.

import { useState } from 'react';
import { View, Pressable, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { QuickBookmarkModal } from './QuickBookmarkModal';
import { useCurrentlyPlaying, CurrentTrackInfo } from '@/hooks/useCurrentlyPlaying';
import { useToastContext } from '@/contexts/ToastContext';
import { colors, shadows, TAB_BAR_HEIGHT, spacing, typography } from '@/constants/theme';

export function NowPlayingFAB() {
  const { fetchNowPlaying, loading } = useCurrentlyPlaying();
  const { showToast } = useToastContext();
  const [trackInfo,    setTrackInfo]    = useState<CurrentTrackInfo | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handlePress = async () => {
    if (loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const info = await fetchNowPlaying();
    if (info) {
      setTrackInfo(info);
      setModalVisible(true);
    } else {
      showToast('Nothing playing right now', 'default');
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
        <View style={styles.gradient}>
          {loading ? (
            <ActivityIndicator color={colors.onPill} size="small" />
          ) : (
            <MaterialCommunityIcons name="bookmark-music" size={22} color={colors.onPill} />
          )}
          <Text style={styles.label}>
            {loading ? 'Checking…' : 'Bookmark Now'}
          </Text>
        </View>
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
