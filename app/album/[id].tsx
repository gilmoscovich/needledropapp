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
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { TrackPickerModal } from '@/components/TrackPickerModal';
import { useSpotify } from '@/hooks/useSpotify';
import { useBookmarks } from '@/hooks/useBookmarks';
import { usePlayback } from '@/hooks/usePlayback';
import { useToastContext } from '@/contexts/ToastContext';
import { SpotifyAlbum, SpotifyTrack, Bookmark } from '@/types';
import {
  colors, typography, spacing, radius, shadows,
  vinylGradient, timestampBadgeStyle,
} from '@/constants/theme';

const { width } = Dimensions.get('window');

export default function AlbumDetailScreen() {
  const { id }     = useLocalSearchParams<{ id: string }>();
  const router     = useRouter();
  const insets     = useSafeAreaInsets();
  const { getAlbum, ready } = useSpotify();
  const { getBookmark, isBookmarked, saveBookmark, deleteBookmark } = useBookmarks();

  const [album,      setAlbum]      = useState<SpotifyAlbum | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [showPicker, setShowPicker] = useState(false);

  const existingBookmark = album ? getBookmark(album.id) : undefined;
  const bookmarked       = album ? isBookmarked(album.id) : false;

  const { showToast } = useToastContext();

  const { resume, loadingAlbumId } = usePlayback({
    onSuccess:        () => showToast('Now playing!', 'success'),
    onOpeningSpotify: () => showToast('Opening Spotify…', 'default'),
    onError:          (msg) => showToast(msg, 'error'),
    onExpired:        () => showToast('Session expired', 'error'),
  });

  useEffect(() => {
    if (!id || !ready) return;
    getAlbum(id)
      .then(setAlbum)
      .catch(() => Alert.alert('Error', 'Could not load album.'))
      .finally(() => setLoading(false));
  }, [id, ready]);

  const handleDropNeedle = useCallback(async () => {
    if (!existingBookmark || !album) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await resume(existingBookmark);
  }, [existingBookmark, album, resume]);

  const handleDeleteBookmark = () => {
    if (!album) return;
    Alert.alert(
      'Remove Bookmark',
      'Remove the bookmark for this album?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => deleteBookmark(album.id),
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

  if (!album) return null;

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

          {/* Bookmark badge — if already bookmarked */}
          {bookmarked && existingBookmark && (
            <Pressable onPress={handleDeleteBookmark} style={styles.bookmarkBadge}>
              <MaterialCommunityIcons name="book-heart" size={14} color={colors.secondary} />
              <Text style={styles.bookmarkBadgeText}>
                {existingBookmark.trackName}
              </Text>
              {existingBookmark.timestamp && (
                <View style={[styles.tsBadge, timestampBadgeStyle]}>
                  <Text style={styles.tsBadgeText}>{existingBookmark.timestamp}</Text>
                </View>
              )}
            </Pressable>
          )}

          {/* Action buttons */}
          <View style={styles.actions}>
            {/* Drop Needle — only if bookmarked */}
            {bookmarked ? (
              <Pressable
                onPress={handleDropNeedle}
                disabled={loadingAlbumId === album.id}
                style={styles.dropNeedleBtn}
              >
                <LinearGradient
                  colors={vinylGradient.colors}
                  start={vinylGradient.start}
                  end={vinylGradient.end}
                  style={styles.dropNeedleGradient}
                >
                  {loadingAlbumId === album.id ? (
                    <ActivityIndicator color={colors.onPrimary} size="small" />
                  ) : (
                    <MaterialIcons name="album" size={18} color={colors.onPrimary} />
                  )}
                  <Text style={styles.dropNeedleText}>
                    {loadingAlbumId === album.id ? 'Connecting…' : 'Drop Needle'}
                  </Text>
                </LinearGradient>
              </Pressable>
            ) : null}

            {/* Bookmark button */}
            <Pressable
              onPress={() => setShowPicker(true)}
              style={[styles.bookmarkBtn, bookmarked && styles.bookmarkBtnActive]}
            >
              <MaterialCommunityIcons
                name={bookmarked ? 'book-heart' : 'book-heart-outline'}
                size={18}
                color={bookmarked ? colors.secondary : colors.primary}
              />
              <Text style={[styles.bookmarkBtnText, bookmarked && { color: colors.secondary }]}>
                {bookmarked ? 'Update' : 'Bookmark'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Tracklist */}
        <View style={styles.tracklist}>
          <Text style={styles.tracklistHeader}>Tracklist</Text>
          <Text style={styles.trackCount}>
            {album.tracks.items.length} TRACKS
          </Text>

          {album.tracks.items.map((track, index) => (
            <TrackRow
              key={track.uri}
              track={track}
              index={index}
              isBookmarked={
                existingBookmark?.trackUri === track.uri
              }
              bookmarkedTimestamp={
                existingBookmark?.trackUri === track.uri
                  ? existingBookmark.timestamp
                  : null
              }
            />
          ))}
        </View>
      </ScrollView>

      {/* Track picker modal */}
      <TrackPickerModal
        visible={showPicker}
        album={album}
        existingBookmark={existingBookmark}
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
    flexDirection:   'row',
    alignItems:      'center',
    gap:             spacing.sm,
    alignSelf:       'flex-start',
    marginTop:       spacing.xs,
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
    flexDirection:  'row',
    gap:            spacing.md,
    marginTop:      spacing.md,
    marginBottom:   spacing.lg,
  },
  dropNeedleBtn: {
    flex:         1,
    borderRadius: radius.full,
    overflow:     'hidden',
    ...shadows.card,
  },
  dropNeedleGradient: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  dropNeedleText: {
    ...typography.titleMd,
    color: colors.onPrimary,
  },
  bookmarkBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             spacing.sm,
    borderRadius:    radius.full,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth:     1,
    borderColor:     colors.outlineVariant,
  },
  bookmarkBtnActive: {
    borderColor:     colors.secondary,
    backgroundColor: 'rgba(92,64,51,0.12)',
  },
  bookmarkBtnText: {
    ...typography.titleMd,
    color: colors.primary,
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
