// components/AlbumCard.tsx
// Album card for grid layouts — art, title, artist, bookmark badge, play button.

import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { SpotifyAlbum, Bookmark } from '@/types';
import { colors, typography, spacing, radius, shadows, vinylGradient, timestampBadgeStyle } from '@/constants/theme';

interface AlbumCardProps {
  album:      SpotifyAlbum;
  bookmark?:  Bookmark;
  onPress:    () => void;
  onPlay?:    () => void;
  isLoading?: boolean;
}

export function AlbumCard({ album, bookmark, onPress, onPlay, isLoading }: AlbumCardProps) {
  const artUrl   = album.images?.[0]?.url ?? '';
  const artist   = album.artists?.[0]?.name ?? '';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.88 }]}
    >
      {/* Album art */}
      <View style={styles.artWrapper}>
        <Image
          source={{ uri: artUrl }}
          style={styles.art}
          contentFit="cover"
          transition={200}
        />

        {/* Bookmark badge — top-left */}
        {bookmark && (
          <View style={styles.bookmarkBadge}>
            <MaterialIcons name="bookmark" size={10} color={colors.secondary} />
            {bookmark.timestamp && (
              <Text style={styles.bookmarkTimestamp}>{bookmark.timestamp}</Text>
            )}
          </View>
        )}

        {/* Play button — bottom-right */}
        {onPlay && (
          <Pressable
            onPress={(e) => { e.stopPropagation(); onPlay(); }}
            style={({ pressed }) => [styles.playBtn, pressed && { opacity: 0.8, transform: [{ scale: 0.92 }] }]}
            hitSlop={8}
          >
            {isLoading ? (
              <LinearGradient
                colors={vinylGradient.colors}
                start={vinylGradient.start}
                end={vinylGradient.end}
                style={styles.playGradient}
              >
                <ActivityIndicator size="small" color={colors.onSecondary} />
              </LinearGradient>
            ) : (
              <LinearGradient
                colors={vinylGradient.colors}
                start={vinylGradient.start}
                end={vinylGradient.end}
                style={styles.playGradient}
              >
                <MaterialIcons name="play-arrow" size={18} color={colors.onSecondary} />
              </LinearGradient>
            )}
          </Pressable>
        )}
      </View>

      {/* Text info */}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{album.name}</Text>
        <Text style={styles.artist} numberOfLines={1}>{artist}</Text>
        {bookmark?.trackName && (
          <View style={styles.trackRow}>
            <View style={[styles.trackBadge, timestampBadgeStyle]}>
              <Text style={styles.trackText} numberOfLines={1}>
                {bookmark.trackName}
              </Text>
            </View>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius:    radius.lg,
    overflow:        'hidden',
    ...shadows.card,
  },
  artWrapper: {
    width:  '100%',
    aspectRatio: 1,
    position: 'relative',
  },
  art: {
    width:  '100%',
    height: '100%',
  },
  bookmarkBadge: {
    position:        'absolute',
    top:             spacing.sm,
    left:            spacing.sm,
    flexDirection:   'row',
    alignItems:      'center',
    gap:             3,
    borderRadius:    radius.full,
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    ...timestampBadgeStyle,
    backgroundColor: 'rgba(20, 18, 18, 0.75)',
  },
  bookmarkTimestamp: {
    ...typography.labelMd,
    color: colors.secondary,
  },
  playBtn: {
    position: 'absolute',
    bottom:   spacing.sm,
    right:    spacing.sm,
  },
  playGradient: {
    width:          36,
    height:         36,
    borderRadius:   18,
    alignItems:     'center',
    justifyContent: 'center',
    ...shadows.albumArt,
  },
  info: {
    padding: spacing.md,
    gap:     3,
  },
  title: {
    ...typography.titleMd,
    color: colors.onSurface,
  },
  artist: {
    ...typography.bodyMd,
    color: colors.outline,
  },
  trackRow: {
    marginTop: 4,
  },
  trackBadge: {
    alignSelf:       'flex-start',
    borderRadius:    radius.sm,
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
  },
  trackText: {
    ...typography.labelMd,
    color: colors.secondary,
  },
});
