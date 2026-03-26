# NeedleDrop — Frontend Phase 4: Album Detail, Track Picker & Bookmarks

## Goal
Three interconnected screens:
1. **Album Detail** — hero art, tracklist, "Drop Needle" + "Bookmark" buttons
2. **Track Picker Modal** — slides up to let the user pick a track and set a timestamp
3. **Bookmarks Screen** — list of saved bookmarks with playback resume

---

## Prerequisites
Frontend Phase 3 complete — Library and Search work.
Backend phases 4 & 5 — `useBookmarks` and `usePlayback` exist.

---

## File to replace: `app/album/[id].tsx`

The full album detail screen.

```typescript
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
import { SpotifyAlbum, SpotifyTrack, Bookmark } from '@/types';
import {
  colors, typography, spacing, radius, shadows,
  vinylGradient, timestampBadgeStyle,
} from '@/constants/theme';

const { width } = Dimensions.get('window');
const ART_SIZE  = width - spacing.lg * 2;

export default function AlbumDetailScreen() {
  const { id }     = useLocalSearchParams<{ id: string }>();
  const router     = useRouter();
  const insets     = useSafeAreaInsets();
  const { getAlbum } = useSpotify();
  const { getBookmark, isBookmarked, saveBookmark, deleteBookmark } = useBookmarks();

  const [album,         setAlbum]         = useState<SpotifyAlbum | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [showPicker,    setShowPicker]    = useState(false);
  const [resumingTrack, setResumingTrack] = useState<string | null>(null);

  const existingBookmark = album ? getBookmark(album.id) : undefined;
  const bookmarked       = album ? isBookmarked(album.id) : false;

  // Toast-less playback for album detail (toast lives in Phase 5)
  const { resume, loadingAlbumId } = usePlayback({
    onSuccess: () => {
      setResumingTrack(null);
    },
    onOpeningSpotify: () => {
      // optionally show a message
    },
    onError: (msg) => {
      Alert.alert('Playback failed', msg);
      setResumingTrack(null);
    },
    onExpired: () => {
      Alert.alert('Session expired', 'Please log in again.');
    },
  });

  useEffect(() => {
    if (!id) return;
    getAlbum(id)
      .then(setAlbum)
      .catch(() => Alert.alert('Error', 'Could not load album.'))
      .finally(() => setLoading(false));
  }, [id]);

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
              <MaterialCommunityIcons name="bookmark-heart" size={14} color={colors.secondary} />
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
                name={bookmarked ? 'bookmark-heart' : 'bookmark-heart-outline'}
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
```

---

## File to create: `components/TrackPickerModal.tsx`

A bottom sheet modal for selecting which track to bookmark and entering a timestamp.

```typescript
// components/TrackPickerModal.tsx
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SpotifyAlbum, SpotifyTrack, Bookmark } from '@/types';
import { isValidTimestamp } from '@/services/spotify';
import {
  colors, typography, spacing, radius,
  timestampBadgeStyle,
} from '@/constants/theme';

interface TrackPickerModalProps {
  visible:          boolean;
  album:            SpotifyAlbum;
  existingBookmark?: Bookmark;
  onClose:          () => void;
  onSave:           (bookmark: Bookmark) => Promise<void>;
}

export function TrackPickerModal({
  visible,
  album,
  existingBookmark,
  onClose,
  onSave,
}: TrackPickerModalProps) {
  const insets = useSafeAreaInsets();

  const [selectedTrack, setSelectedTrack] = useState<SpotifyTrack | null>(null);
  const [timestamp,     setTimestamp]     = useState('');
  const [saving,        setSaving]        = useState(false);
  const [tsError,       setTsError]       = useState('');

  // Prefill with existing bookmark if editing
  useEffect(() => {
    if (!visible) return;
    if (existingBookmark) {
      const track = album.tracks.items.find(t => t.uri === existingBookmark.trackUri);
      setSelectedTrack(track ?? null);
      setTimestamp(existingBookmark.timestamp ?? '');
    } else {
      setSelectedTrack(null);
      setTimestamp('');
    }
    setTsError('');
  }, [visible, existingBookmark]);

  const handleTimestampChange = (text: string) => {
    setTimestamp(text);
    if (text && !isValidTimestamp(text)) {
      setTsError('Format: mm:ss or h:mm:ss');
    } else {
      setTsError('');
    }
  };

  const handleSave = async () => {
    if (!selectedTrack) {
      Alert.alert('Select a track', 'Choose which track to bookmark.');
      return;
    }
    if (timestamp && !isValidTimestamp(timestamp)) {
      setTsError('Format: mm:ss or h:mm:ss');
      return;
    }

    const trackIndex = album.tracks.items.findIndex(t => t.uri === selectedTrack.uri);

    const bookmark: Bookmark = {
      albumId:    album.id,
      albumName:  album.name,
      artist:     album.artists.map(a => a.name).join(', '),
      art:        album.images?.[0]?.url ?? '',
      albumUri:   album.uri,
      trackUri:   selectedTrack.uri,
      trackName:  selectedTrack.name,
      trackIndex: trackIndex,
      trackNum:   selectedTrack.track_number,
      timestamp:  timestamp.trim() || null,
      savedAt:    Date.now(),
    };

    setSaving(true);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await onSave(bookmark);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={[styles.container, { paddingBottom: insets.bottom + spacing.lg }]}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Bookmark</Text>
              <Text style={styles.headerAlbum} numberOfLines={1}>{album.name}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={20} color={colors.outline} />
            </Pressable>
          </View>

          {/* Timestamp input */}
          <View style={styles.tsSection}>
            <Text style={styles.sectionLabel}>TIMESTAMP (OPTIONAL)</Text>
            <View style={styles.tsInputWrapper}>
              <MaterialIcons name="schedule" size={16} color={colors.outline} />
              <TextInput
                style={styles.tsInput}
                value={timestamp}
                onChangeText={handleTimestampChange}
                placeholder="2:34 or 1:04:22"
                placeholderTextColor={colors.outline}
                keyboardType="numbers-and-punctuation"
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
              {timestamp.length > 0 && (
                <Pressable onPress={() => { setTimestamp(''); setTsError(''); }}>
                  <MaterialIcons name="close" size={14} color={colors.outline} />
                </Pressable>
              )}
            </View>
            {tsError ? <Text style={styles.tsError}>{tsError}</Text> : null}
          </View>

          {/* Track list */}
          <Text style={[styles.sectionLabel, { paddingHorizontal: spacing.lg, marginBottom: spacing.sm }]}>
            SELECT TRACK
          </Text>
          <ScrollView
            style={styles.trackList}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {album.tracks.items.map((track, index) => {
              const isSelected = selectedTrack?.uri === track.uri;
              return (
                <Pressable
                  key={track.uri}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedTrack(track);
                  }}
                  style={[styles.trackRow, isSelected && styles.trackRowSelected]}
                >
                  {isSelected && <View style={styles.trackActiveBorder} />}
                  <Text style={[styles.trackNum, isSelected && styles.trackNumActive]}>
                    {String(index + 1).padStart(2, '0')}
                  </Text>
                  <Text
                    style={[styles.trackName, isSelected && styles.trackNameActive]}
                    numberOfLines={1}
                  >
                    {track.name}
                  </Text>
                  {isSelected && (
                    <MaterialCommunityIcons
                      name="bookmark-heart"
                      size={16}
                      color={colors.secondary}
                    />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Save button */}
          <Pressable
            onPress={handleSave}
            disabled={saving || !selectedTrack}
            style={({ pressed }) => [
              styles.saveBtn,
              (!selectedTrack || saving) && styles.saveBtnDisabled,
              pressed && { opacity: 0.85 },
            ]}
          >
            <MaterialCommunityIcons
              name="bookmark-heart"
              size={18}
              color={!selectedTrack ? colors.outline : colors.onPrimary}
            />
            <Text style={[styles.saveBtnText, !selectedTrack && { color: colors.outline }]}>
              {saving ? 'Saving…' : 'Save Bookmark'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex:            1,
    backgroundColor: colors.surfaceContainerLow,
  },
  handle: {
    width:           40,
    height:          4,
    borderRadius:    2,
    backgroundColor: colors.outlineVariant,
    alignSelf:       'center',
    marginTop:       spacing.md,
    marginBottom:    spacing.sm,
  },
  header: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    ...typography.headlineSm,
    color: colors.onSurface,
  },
  headerAlbum: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  closeBtn: {
    width:           36,
    height:          36,
    borderRadius:    18,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems:      'center',
    justifyContent:  'center',
  },

  // Timestamp section
  tsSection: {
    paddingHorizontal: spacing.lg,
    marginBottom:      spacing.lg,
    gap:               spacing.sm,
  },
  sectionLabel: {
    ...typography.labelSm,
    color: colors.outline,
  },
  tsInputWrapper: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             spacing.sm,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius:    radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  tsInput: {
    flex:     1,
    ...typography.bodyMd,
    color:    colors.onSurface,
    padding:  0,
  },
  tsError: {
    ...typography.labelMd,
    color: colors.error,
  },

  // Track rows
  trackList: {
    flex: 1,
  },
  trackRow: {
    flexDirection:   'row',
    alignItems:      'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap:             spacing.md,
    position:        'relative',
  },
  trackRowSelected: {
    backgroundColor: 'rgba(92,64,51,0.15)',
  },
  trackActiveBorder: {
    position:        'absolute',
    left:            0,
    top:             '20%',
    bottom:          '20%',
    width:           3,
    borderRadius:    2,
    backgroundColor: colors.secondary,
  },
  trackNum: {
    ...typography.headlineSm,
    color:     colors.outlineVariant,
    width:     28,
    textAlign: 'right',
    fontSize:  16,
  },
  trackNumActive: {
    color: colors.secondary,
  },
  trackName: {
    ...typography.titleMd,
    color: colors.onSurface,
    flex:  1,
  },
  trackNameActive: {
    color:      colors.secondary,
    fontWeight: '700',
  },

  // Save button
  saveBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop:       spacing.md,
    backgroundColor: colors.primary,
    borderRadius:    radius.full,
    paddingVertical: spacing.lg,
  },
  saveBtnDisabled: {
    backgroundColor: colors.surfaceContainerHighest,
  },
  saveBtnText: {
    ...typography.titleMd,
    color: colors.onPrimary,
  },
});
```

---

## File to replace: `app/(tabs)/bookmarks.tsx`

The personal archives screen — list of all bookmarks, play resume.

```typescript
// app/(tabs)/bookmarks.tsx
import { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useBookmarks } from '@/hooks/useBookmarks';
import { usePlayback } from '@/hooks/usePlayback';
import { Bookmark } from '@/types';
import {
  colors, typography, spacing, radius, shadows,
  vinylGradient, timestampBadgeStyle, TAB_BAR_HEIGHT,
} from '@/constants/theme';

const { width } = Dimensions.get('window');

export default function BookmarksScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { bookmarks, loading, deleteBookmark } = useBookmarks();

  const { resume, loadingAlbumId } = usePlayback({
    onSuccess:        () => {},
    onOpeningSpotify: () => {},
    onError:          (msg) => Alert.alert('Playback failed', msg),
    onExpired:        () => Alert.alert('Session expired', 'Please log in again.'),
  });

  const handlePlay = useCallback((bm: Bookmark) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    resume(bm);
  }, [resume]);

  const handleDelete = useCallback((albumId: string, albumName: string) => {
    Alert.alert(
      'Remove Bookmark',
      `Remove "${albumName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => deleteBookmark(albumId),
        },
      ]
    );
  }, [deleteBookmark]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={bookmarks}
        keyExtractor={item => item.albumId}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: TAB_BAR_HEIGHT + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
            <Text style={styles.headerSub}>PERSONAL ARCHIVES</Text>
            <Text style={styles.headerTitle}>Sonic Timestamps</Text>
            <Text style={styles.headerBody}>
              Your curated collection of moments captured in time.
            </Text>
            {bookmarks.length > 0 && (
              <Text style={styles.countLabel}>
                {bookmarks.length} ACTIVE BOOKMARK{bookmarks.length !== 1 ? 'S' : ''}
              </Text>
            )}
          </View>
        }
        ListEmptyComponent={<BookmarksEmpty onSearch={() => router.push('/(tabs)/search')} />}
        renderItem={({ item }) => (
          <BookmarkCard
            bookmark={item}
            isPlaying={loadingAlbumId === item.albumId}
            onPlay={() => handlePlay(item)}
            onPress={() => router.push(`/album/${item.albumId}`)}
            onDelete={() => handleDelete(item.albumId, item.albumName)}
          />
        )}
      />
    </View>
  );
}

function BookmarkCard({
  bookmark,
  isPlaying,
  onPlay,
  onPress,
  onDelete,
}: {
  bookmark:  Bookmark;
  isPlaying: boolean;
  onPlay:    () => void;
  onPress:   () => void;
  onDelete:  () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [
      cardStyles.card,
      pressed && { opacity: 0.9 },
    ]}>
      {/* Album art */}
      <View style={cardStyles.artWrapper}>
        {bookmark.art ? (
          <Image source={{ uri: bookmark.art }} style={cardStyles.art} contentFit="cover" />
        ) : (
          <View style={[cardStyles.art, cardStyles.artPlaceholder]} />
        )}
      </View>

      {/* Text content */}
      <View style={cardStyles.content}>
        <Text style={cardStyles.albumName} numberOfLines={1}>{bookmark.albumName}</Text>
        <Text style={cardStyles.trackName} numberOfLines={1}>
          {bookmark.trackNum}. {bookmark.trackName}
        </Text>
        <Text style={cardStyles.artist} numberOfLines={1}>{bookmark.artist}</Text>

        {/* Timestamp badge */}
        {bookmark.timestamp && (
          <View style={[cardStyles.tsBadge, timestampBadgeStyle]}>
            <MaterialIcons name="schedule" size={10} color={colors.secondary} />
            <Text style={cardStyles.tsText}>{bookmark.timestamp}</Text>
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={cardStyles.actions}>
        {/* Play button */}
        <Pressable onPress={onPlay} disabled={isPlaying} style={cardStyles.playBtn}>
          <LinearGradient
            colors={vinylGradient.colors}
            start={vinylGradient.start}
            end={vinylGradient.end}
            style={cardStyles.playGradient}
          >
            {isPlaying
              ? <ActivityIndicator color={colors.onPrimary} size="small" />
              : <MaterialIcons name="play-arrow" size={20} color={colors.onPrimary} />
            }
          </LinearGradient>
        </Pressable>

        {/* More / delete */}
        <Pressable onPress={onDelete} style={cardStyles.deleteBtn} hitSlop={8}>
          <MaterialIcons name="more-vert" size={18} color={colors.outline} />
        </Pressable>
      </View>
    </Pressable>
  );
}

function BookmarksEmpty({ onSearch }: { onSearch: () => void }) {
  return (
    <View style={emptyStyles.container}>
      <MaterialCommunityIcons name="bookmark-heart-outline" size={64} color={colors.outlineVariant} />
      <Text style={emptyStyles.title}>No bookmarks yet</Text>
      <Text style={emptyStyles.body}>
        Find an album, pick a track, and drop the needle.
      </Text>
      <Pressable onPress={onSearch} style={emptyStyles.btn}>
        <Text style={emptyStyles.btnText}>Browse Albums</Text>
      </Pressable>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: {
    alignItems:    'center',
    paddingTop:    spacing.xxxl,
    paddingBottom: spacing.xl,
    gap:           spacing.md,
    paddingHorizontal: spacing.xxl,
  },
  title: {
    ...typography.headlineSm,
    color: colors.onSurface,
  },
  body: {
    ...typography.bodyMd,
    color:     colors.outline,
    textAlign: 'center',
  },
  btn: {
    marginTop:       spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius:    radius.full,
    backgroundColor: colors.primaryContainer,
  },
  btnText: {
    ...typography.titleMd,
    color: colors.primary,
  },
});

const cardStyles = StyleSheet.create({
  card: {
    flexDirection:     'row',
    alignItems:        'center',
    marginHorizontal:  spacing.lg,
    marginBottom:      spacing.sm,
    padding:           spacing.md,
    borderRadius:      radius.xl,
    backgroundColor:   colors.surfaceContainer,
    gap:               spacing.md,
  },
  artWrapper: {
    ...shadows.albumArt,
  },
  art: {
    width:        64,
    height:       64,
    borderRadius: radius.lg,
  },
  artPlaceholder: {
    backgroundColor: colors.surfaceContainerHigh,
  },
  content: {
    flex: 1,
    gap:  2,
  },
  albumName: {
    ...typography.titleMd,
    color: colors.onSurface,
  },
  trackName: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  artist: {
    ...typography.labelLg,
    color:         colors.outline,
    letterSpacing: 0.5,
  },
  tsBadge: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             4,
    alignSelf:       'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical:  2,
    borderRadius:    radius.full,
    marginTop:       2,
  },
  tsText: {
    ...typography.labelMd,
    color: colors.secondary,
  },
  actions: {
    alignItems: 'center',
    gap:        spacing.sm,
  },
  playBtn: {
    borderRadius: radius.full,
    overflow:     'hidden',
    ...shadows.card,
  },
  playGradient: {
    width:          44,
    height:         44,
    borderRadius:   22,
    alignItems:     'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    padding: spacing.xs,
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
  list: {
    gap: 0,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom:     spacing.xl,
    gap:               spacing.sm,
  },
  headerSub: {
    ...typography.labelSm,
    color: colors.secondary,
  },
  headerTitle: {
    ...typography.headlineLg,
    color: colors.primary,
  },
  headerBody: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  countLabel: {
    ...typography.labelMd,
    color:     colors.outline,
    marginTop: spacing.sm,
  },
});
```

---

## Definition of done

- [ ] Album detail loads and displays full album with hero art
- [ ] Tracklist shows all tracks with correct numbering
- [ ] Currently bookmarked track is highlighted (warm accent border + color)
- [ ] "Bookmark" button opens the Track Picker modal
- [ ] Track Picker: selecting a track highlights it with the active border
- [ ] Timestamp field validates format in real time
- [ ] Saving a bookmark closes the modal + updates the album detail
- [ ] "Drop Needle" button appears when album is bookmarked
- [ ] Bookmarks screen lists all saved bookmarks
- [ ] Play button on bookmark card triggers resume (opens Spotify + retries)
- [ ] Tapping a bookmark card goes to album detail
- [ ] Long-pressing / tapping more-vert offers delete
- [ ] Empty state on Bookmarks screen with "Browse Albums" CTA
- [ ] No TypeScript errors

---

## Do NOT build in this phase
- Toast notifications (Phase 5)
- Skeleton loading states (Phase 5)
- Haptics polish (Phase 5)
