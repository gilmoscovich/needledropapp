// app/album/[id].tsx
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { TrackPickerModal } from '@/components/TrackPickerModal';
import { useSpotify } from '@/hooks/useSpotify';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useToastContext } from '@/contexts/ToastContext';
import { SpotifyAlbum, SpotifyTrack, Bookmark } from '@/types';
import {
  colors, typography, spacing, radius, shadows,
  timestampBadgeStyle,
} from '@/constants/theme';

const { width } = Dimensions.get('window');

export default function AlbumDetailScreen() {
  const { id }     = useLocalSearchParams<{ id: string }>();
  const router     = useRouter();
  const insets     = useSafeAreaInsets();
  const { getAlbum, ready } = useSpotify();
  const { getBookmarksForAlbum, saveBookmark, deleteBookmark, deleteBookmarksForAlbum } = useBookmarks();

  const [album,      setAlbum]      = useState<SpotifyAlbum | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [loadError,  setLoadError]  = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const existingBookmarks = album ? getBookmarksForAlbum(album.id) : [];
  const bookmarked        = existingBookmarks.length > 0;

  const { showToast } = useToastContext();

  useEffect(() => {
    if (!id || !ready) return;
    getAlbum(id)
      .then(setAlbum)
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, [id, ready]);

  const handleAlbumFinished = useCallback(() => {
    if (!album) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      'Album Finished?',
      `Remove all ${existingBookmarks.length} bookmark${existingBookmarks.length !== 1 ? 's' : ''} for "${album.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove All',
          style: 'destructive',
          onPress: async () => {
            await deleteBookmarksForAlbum(album.id);
            showToast('Album removed from your list', 'default');
          },
        },
      ]
    );
  }, [album, existingBookmarks.length, deleteBookmarksForAlbum, showToast]);

  const handleDeleteBookmark = (trackUri: string, trackName: string) => {
    Alert.alert(
      'Remove Bookmark',
      `Remove "${trackName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => deleteBookmark(trackUri),
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (loadError || !album) {
    return (
      <View style={styles.loadingContainer}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtn, { top: insets.top + spacing.sm }]}
          hitSlop={12}
        >
          <MaterialIcons name="arrow-back" size={22} color={colors.onSurface} />
        </Pressable>
        <MaterialIcons name="cloud-off" size={48} color={colors.outline} />
        <Text style={styles.errorText}>Could not load album.</Text>
        <Pressable onPress={() => router.back()} style={styles.errorBackBtn}>
          <Text style={styles.errorBackText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const artUrl  = album.images?.[0]?.url;
  const artist  = album.artists?.map(a => a.name).join(', ') ?? '';

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxxl }}
      >
        {/* Hero: art + gradient fade */}
        <View style={styles.heroWrapper}>
          {artUrl ? (
            <Image source={{ uri: artUrl }} style={styles.heroArt} contentFit="cover" />
          ) : (
            <View style={[styles.heroArt, styles.heroArtPlaceholder]} />
          )}
          <LinearGradient
            colors={['transparent', colors.background]}
            style={styles.heroGradient}
          />
        </View>

        {/* Back button — overlay on hero */}
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtn, { top: insets.top + spacing.sm }]}
          hitSlop={12}
        >
          <MaterialIcons name="arrow-back" size={22} color={colors.onSurface} />
        </Pressable>

        {/* Album info */}
        <View style={styles.info}>
          <Text style={styles.albumName}>{album.name}</Text>
          <Text style={styles.artistName}>{artist}</Text>

          {/* Bookmark badges — one per bookmarked track */}
          {existingBookmarks.map(bm => (
            <View key={bm.trackUri} style={styles.bookmarkBadge}>
              <MaterialCommunityIcons name="book-heart" size={14} color={colors.secondary} />
              <Text style={styles.bookmarkBadgeText}>{bm.trackName}</Text>
              {bm.timestamp && (
                <View style={[styles.tsBadge, timestampBadgeStyle]}>
                  <Text style={styles.tsBadgeText}>{bm.timestamp}</Text>
                </View>
              )}
              <Pressable
                onPress={() => handleDeleteBookmark(bm.trackUri, bm.trackName)}
                hitSlop={8}
                style={styles.bookmarkBadgeDelete}
              >
                <MaterialIcons name="close" size={12} color={colors.outline} />
              </Pressable>
            </View>
          ))}

          {/* Action buttons */}
          <View style={styles.actions}>
            <Pressable
              onPress={() => setShowPicker(true)}
              style={[styles.bookmarkBtn, bookmarked && styles.bookmarkBtnActive]}
            >
              <Text style={styles.bookmarkBtnText}>
                {bookmarked ? 'Add Another' : 'Bookmark'}
              </Text>
            </Pressable>

            {bookmarked && (
              <Pressable
                onPress={handleAlbumFinished}
                style={({ pressed }) => [styles.albumFinishedBtn, pressed && { opacity: 0.8 }]}
              >
                <Text style={styles.albumFinishedBtnText}>Album Finished</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Tracklist */}
        <View style={styles.tracklist}>
          <Text style={styles.tracklistHeader}>Tracklist</Text>
          <Text style={styles.trackCount}>
            {album.tracks.items.length} TRACKS
          </Text>

          {album.tracks.items.map((track, index) => {
            const bm = existingBookmarks.find(b => b.trackUri === track.uri);
            return (
              <TrackRow
                key={track.uri}
                track={track}
                index={index}
                isBookmarked={!!bm}
                bookmarkedTimestamp={bm?.timestamp ?? null}
              />
            );
          })}
        </View>
      </ScrollView>

      {/* Track picker modal */}
      <TrackPickerModal
        visible={showPicker}
        album={album}
        existingBookmarks={existingBookmarks}
        onClose={() => setShowPicker(false)}
        onSave={async (bookmark) => {
          await saveBookmark(bookmark);
          setShowPicker(false);
        }}
      />
    </View>
  );
}

function TrackRow({
  track,
  index,
  isBookmarked,
  bookmarkedTimestamp,
}: {
  track:               SpotifyTrack;
  index:               number;
  isBookmarked:        boolean;
  bookmarkedTimestamp: string | null | undefined;
}) {
  return (
    <View style={[trackStyles.row, isBookmarked && trackStyles.rowActive]}>
      {isBookmarked && <View style={trackStyles.activeBorder} />}

      <Text style={[trackStyles.num, isBookmarked && trackStyles.numActive]}>
        {String(index + 1).padStart(2, '0')}
      </Text>

      <View style={trackStyles.meta}>
        <Text style={[trackStyles.name, isBookmarked && trackStyles.nameActive]} numberOfLines={1}>
          {track.name}
        </Text>
        {isBookmarked && bookmarkedTimestamp && (
          <View style={[trackStyles.tsBadge, timestampBadgeStyle]}>
            <MaterialIcons name="graphic-eq" size={10} color={colors.secondary} />
            <Text style={trackStyles.tsText}>
              Dropped at {bookmarkedTimestamp}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const trackStyles = StyleSheet.create({
  row: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius:   radius.lg,
    gap:            spacing.lg,
    position:       'relative',
  },
  rowActive: {
    backgroundColor: 'rgba(92,64,51,0.15)',
  },
  activeBorder: {
    position:        'absolute',
    left:            0,
    top:             '15%',
    bottom:          '15%',
    width:           3,
    borderRadius:    2,
    backgroundColor: colors.secondary,
  },
  num: {
    ...typography.headlineSm,
    color:     colors.outlineVariant,
    width:     32,
    textAlign: 'right',
  },
  numActive: {
    color: colors.secondary,
  },
  meta: {
    flex: 1,
    gap:  4,
  },
  name: {
    ...typography.titleMd,
    color: colors.onSurface,
  },
  nameActive: {
    color:      colors.secondary,
    fontWeight: '800',
  },
  tsBadge: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             4,
    alignSelf:       'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical:  3,
    borderRadius:    radius.full,
  },
  tsText: {
    ...typography.labelMd,
    color: colors.secondary,
  },
});

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex:            1,
    backgroundColor: colors.background,
    alignItems:      'center',
    justifyContent:  'center',
    gap:             spacing.lg,
  },
  errorText: {
    ...typography.bodyMd,
    color: colors.outline,
  },
  errorBackBtn: {
    paddingVertical:   spacing.sm,
    paddingHorizontal: spacing.xl,
    backgroundColor:   colors.surfaceContainerHigh,
    borderRadius:      999,
  },
  errorBackText: {
    ...typography.labelLg,
    color: colors.onSurface,
  },
  heroWrapper: {
    width:  '100%',
    height: width,
  },
  heroArt: {
    width:  '100%',
    height: '100%',
  },
  heroArtPlaceholder: {
    backgroundColor: colors.surfaceContainerHigh,
  },
  heroGradient: {
    position: 'absolute',
    bottom:   0,
    left:     0,
    right:    0,
    height:   width * 0.5,
  },
  backBtn: {
    position:        'absolute',
    left:            spacing.lg,
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: 'rgba(32,31,31,0.8)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  info: {
    paddingHorizontal: spacing.lg,
    paddingTop:        spacing.md,
    gap:               spacing.sm,
    marginTop:         -spacing.xl,
  },
  albumName: {
    ...typography.headlineMd,
    color: colors.onSurface,
  },
  artistName: {
    ...typography.bodyLg,
    color: colors.onSurfaceVariant,
  },
  bookmarkBadge: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               spacing.sm,
    alignSelf:         'flex-start',
    marginTop:         spacing.xs,
    backgroundColor:   'rgba(92,64,51,0.10)',
    borderRadius:      999,
    paddingVertical:   4,
    paddingHorizontal: spacing.sm,
  },
  bookmarkBadgeDelete: {
    marginLeft: 2,
  },
  bookmarkBadgeText: {
    ...typography.labelLg,
    color: colors.secondary,
  },
  tsBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical:  2,
    borderRadius:     radius.full,
  },
  tsBadgeText: {
    ...typography.labelMd,
    color: colors.secondary,
  },
  actions: {
    flexDirection: 'column',
    gap:           spacing.sm,
    marginTop:     spacing.md,
    marginBottom:  spacing.lg,
  },
  bookmarkBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'center',
    gap:               spacing.sm,
    borderRadius:      radius.full,
    paddingVertical:   spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor:   colors.pillBg,
  },
  bookmarkBtnActive: {
    backgroundColor: colors.pillBg,
  },
  bookmarkBtnText: {
    ...typography.titleMd,
    color: colors.onPill,
  },
  albumFinishedBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'center',
    gap:               spacing.sm,
    borderRadius:      radius.full,
    paddingVertical:   spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor:   colors.surfaceContainerHigh,
    borderWidth:       1,
    borderColor:       colors.errorContainer,
  },
  albumFinishedBtnText: {
    ...typography.titleMd,
    color: colors.error,
  },
  tracklist: {
    paddingHorizontal: 0,
    paddingTop:        spacing.lg,
  },
  tracklistHeader: {
    ...typography.headlineMd,
    color:             colors.primary,
    paddingHorizontal: spacing.lg,
  },
  trackCount: {
    ...typography.labelSm,
    color:             colors.outline,
    paddingHorizontal: spacing.lg,
    marginTop:         4,
    marginBottom:      spacing.md,
  },
});
