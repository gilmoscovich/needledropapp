// app/(tabs)/bookmarks.tsx
import { useCallback, useRef, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActionSheetIOS,
  Platform,
  Alert,
  Share,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useBookmarks } from '@/hooks/useBookmarks';
import { usePlayback } from '@/hooks/usePlayback';
import { useToastContext } from '@/contexts/ToastContext';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SkeletonBookmarkCard } from '@/components/SkeletonBookmarkCard';
import { NoteEditSheet } from '@/components/NoteEditSheet';
import { Bookmark } from '@/types';
import {
  colors, typography, spacing, radius, shadows,
  TAB_BAR_HEIGHT, timestampBadgeStyle,
} from '@/constants/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface AlbumGroup extends Bookmark {
  bookmarks: Bookmark[];
  count:     number;
}

export default function BookmarksScreen() {
  const router = useRouter();
  const { bookmarks, loading, deleteBookmark, deleteBookmarksForAlbum, saveBookmark } = useBookmarks();
  const { showToast } = useToastContext();
  const [editingNote, setEditingNote] = useState<Bookmark | null>(null);
  const [sortNewest,  setSortNewest]  = useState(true);

  // Group flat bookmarks list by albumId — one card per album
  const albumGroups = useMemo<AlbumGroup[]>(() => {
    const map: Record<string, Bookmark[]> = {};
    for (const bm of bookmarks) {
      if (!map[bm.albumId]) map[bm.albumId] = [];
      map[bm.albumId].push(bm);
    }
    return Object.values(map)
      .map(group => ({
        ...group.sort((a, b) => b.savedAt - a.savedAt)[0], // album-level fields from most recent
        bookmarks: group.sort((a, b) => b.savedAt - a.savedAt),
        count:     group.length,
      }))
      .sort((a, b) => sortNewest ? b.savedAt - a.savedAt : a.savedAt - b.savedAt);
  }, [bookmarks, sortNewest]);

  const { resume } = usePlayback({
    onSuccess:        () => showToast('Now playing!', 'success'),
    onOpeningSpotify: () => showToast('Opening Spotify…', 'default'),
    onError:          (msg) => showToast(msg, 'error'),
    onExpired:        () => showToast('Session expired — please log in again', 'error'),
  });

  const handlePlayBookmark = useCallback((bm: Bookmark) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    resume(bm);
  }, [resume]);

  const handleEditNote = useCallback((bm: Bookmark) => {
    setEditingNote(bm);
  }, []);

  const handleShareBookmark = useCallback((bm: Bookmark) => {
    const trackId = bm.trackUri.split(':').pop();
    const url = `https://open.spotify.com/track/${trackId}`;
    const text = bm.timestamp
      ? `${bm.trackName} · ${bm.artist} at ${bm.timestamp}`
      : `${bm.trackName} · ${bm.artist}`;
    Share.share(
      Platform.OS === 'ios'
        ? { message: text, url }
        : { message: `${text}\n${url}` }
    );
  }, []);

  const handleDelete = useCallback((group: AlbumGroup) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    if (group.count === 1) {
      deleteBookmark(group.bookmarks[0].trackUri);
      return;
    }

    // Multiple bookmarks — let user pick which one to remove
    const trackNames = group.bookmarks.map(bm => bm.trackName);
    const options    = [...trackNames, 'Remove All', 'Cancel'];
    const removeAllIndex = options.length - 2;
    const cancelIndex    = options.length - 1;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title:                `Remove bookmark from "${group.albumName}"`,
          options,
          destructiveButtonIndex: removeAllIndex,
          cancelButtonIndex:      cancelIndex,
        },
        (index) => {
          if (index === cancelIndex) return;
          if (index === removeAllIndex) {
            deleteBookmarksForAlbum(group.albumId);
          } else {
            deleteBookmark(group.bookmarks[index].trackUri);
          }
        }
      );
    } else {
      // Android fallback
      Alert.alert(
        `Remove from "${group.albumName}"`,
        'Which bookmark do you want to remove?',
        [
          ...group.bookmarks.map(bm => ({
            text:    bm.trackName,
            onPress: () => deleteBookmark(bm.trackUri),
          })),
          {
            text:    'Remove All',
            style:   'destructive' as const,
            onPress: () => deleteBookmarksForAlbum(group.albumId),
          },
          { text: 'Cancel', style: 'cancel' as const },
        ]
      );
    }
  }, [deleteBookmark, deleteBookmarksForAlbum]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Bookmarks" />
        {[0, 1, 2, 3].map(i => <SkeletonBookmarkCard key={i} />)}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={albumGroups}
        keyExtractor={item => item.albumId}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: TAB_BAR_HEIGHT + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <ScreenHeader title="Bookmarks" />
            {albumGroups.length > 0 && (
              <View style={styles.sortRow}>
                <Text style={styles.countLabel}>
                  {albumGroups.length} ALBUM{albumGroups.length !== 1 ? 'S' : ''}
                </Text>
                <Pressable
                  onPress={() => setSortNewest(v => !v)}
                  style={({ pressed }) => [styles.sortBtn, pressed && { opacity: 0.7 }]}
                >
                  <MaterialIcons
                    name={sortNewest ? 'arrow-downward' : 'arrow-upward'}
                    size={12}
                    color={colors.outline}
                  />
                  <Text style={styles.sortBtnText}>{sortNewest ? 'Newest' : 'Oldest'}</Text>
                </Pressable>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={<BookmarksEmpty onSearch={() => router.push('/(tabs)/search')} />}
        renderItem={({ item }) => (
          <SwipeableAlbumCard
            group={item}
            onPlayBookmark={handlePlayBookmark}
            onShareBookmark={handleShareBookmark}
            onPress={() => router.push(`/album/${item.albumId}`)}
            onDelete={() => handleDelete(item)}
            onEditNote={handleEditNote}
          />
        )}
      />

      <NoteEditSheet
        visible={!!editingNote}
        bookmark={editingNote}
        onClose={() => setEditingNote(null)}
        onSave={async (updated) => {
          await saveBookmark(updated);
          setEditingNote(null);
        }}
      />
    </View>
  );
}

function SwipeableAlbumCard(props: {
  group:            AlbumGroup;
  onPlayBookmark:   (bm: Bookmark) => void;
  onShareBookmark:  (bm: Bookmark) => void;
  onPress:          () => void;
  onDelete:         () => void;
  onEditNote:       (bm: Bookmark) => void;
}) {
  const swipeRef = useRef<Swipeable>(null);

  const renderRightActions = () => (
    <Pressable
      onPress={() => { swipeRef.current?.close(); props.onDelete(); }}
      style={cardStyles.deleteAction}
    >
      <MaterialIcons name="delete" size={22} color="#fff" />
      <Text style={cardStyles.deleteActionText}>Remove</Text>
    </Pressable>
  );

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      rightThreshold={60}
      overshootRight={false}
    >
      <AlbumCard {...props} />
    </Swipeable>
  );
}

function AlbumCard({
  group,
  onPlayBookmark,
  onShareBookmark,
  onPress,
  onEditNote,
}: {
  group:           AlbumGroup;
  onPlayBookmark:  (bm: Bookmark) => void;
  onShareBookmark: (bm: Bookmark) => void;
  onPress:         () => void;
  onDelete:        () => void;
  onEditNote:      (bm: Bookmark) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={cardStyles.card}>
      {/* Header row */}
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [cardStyles.cardHeader, pressed && { opacity: 0.9 }]}
      >
        {/* Album art + count badge */}
        <View style={cardStyles.artWrapper}>
          {group.art ? (
            <Image source={{ uri: group.art }} style={cardStyles.art} contentFit="cover" />
          ) : (
            <View style={[cardStyles.art, cardStyles.artPlaceholder]} />
          )}
          {group.count > 1 && (
            <View style={cardStyles.countBadge}>
              <Text style={cardStyles.countBadgeText}>{group.count}</Text>
            </View>
          )}
        </View>

        {/* Text content */}
        <View style={cardStyles.content}>
          <Text style={cardStyles.albumName} numberOfLines={1}>{group.albumName}</Text>
          <Text style={cardStyles.artist} numberOfLines={1}>{group.artist}</Text>
          <Text style={cardStyles.trackHint} numberOfLines={1}>
            {group.count === 1
              ? `${group.bookmarks[0].trackNum}. ${group.bookmarks[0].trackName}`
              : group.bookmarks[0].trackName}
          </Text>
        </View>

        <Pressable
          onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setExpanded(e => !e);
          }}
          hitSlop={8}
          style={cardStyles.chevronBtn}
        >
          <MaterialIcons
            name={expanded ? 'expand-less' : 'expand-more'}
            size={22}
            color={colors.outline}
          />
        </Pressable>
      </Pressable>

      {/* Expanded bookmark rows */}
      {expanded && (
        <View style={cardStyles.expandedSection}>
          {group.bookmarks.map(bm => (
            <Pressable
              key={bm.trackUri}
              style={cardStyles.expandedRow}
              onLongPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onEditNote(bm);
              }}
              delayLongPress={400}
            >
              <Text style={cardStyles.expandedTrackNum}>
                {String(bm.trackNum).padStart(2, '0')}
              </Text>
              <View style={cardStyles.expandedMeta}>
                <Text style={cardStyles.expandedTrackName} numberOfLines={1}>{bm.trackName}</Text>
                <View style={cardStyles.expandedBadges}>
                  {bm.timestamp && (
                    <View style={[cardStyles.expandedTsBadge, timestampBadgeStyle]}>
                      <Text style={cardStyles.expandedTsText}>{bm.timestamp}</Text>
                    </View>
                  )}
                  {bm.note && (
                    <Pressable onPress={() => onEditNote(bm)} hitSlop={4}>
                      <Text style={cardStyles.expandedNote} numberOfLines={1}>{bm.note}</Text>
                    </Pressable>
                  )}
                </View>
              </View>
              <Pressable
                onPress={() => onShareBookmark(bm)}
                hitSlop={8}
                style={cardStyles.shareBtn}
              >
                <MaterialIcons name="share" size={16} color={colors.outline} />
              </Pressable>
              <Pressable
                onPress={() => onPlayBookmark(bm)}
                style={cardStyles.expandedPlayBtn}
              >
                <MaterialIcons name="play-arrow" size={18} color={colors.onPill} />
              </Pressable>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

function BookmarksEmpty({ onSearch }: { onSearch: () => void }) {
  return (
    <View style={emptyStyles.container}>
      <MaterialIcons name="bookmark-border" size={64} color={colors.outlineVariant} />
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
    alignItems:        'center',
    paddingTop:        spacing.xxxl,
    paddingBottom:     spacing.xl,
    gap:               spacing.md,
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
    marginTop:         spacing.sm,
    paddingVertical:   spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius:      radius.full,
    backgroundColor:   colors.primaryContainer,
  },
  btnText: {
    ...typography.titleMd,
    color: colors.primary,
  },
});

const cardStyles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    marginBottom:     spacing.sm,
    borderRadius:     radius.xl,
    backgroundColor:  colors.surfaceContainer,
    overflow:         'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems:    'center',
    padding:       spacing.md,
    gap:           spacing.md,
  },
  chevronBtn: {
    width:           44,
    height:          44,
    alignItems:      'center',
    justifyContent:  'center',
  },
  expandedSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(80,68,64,0.3)',
    paddingVertical: spacing.xs,
  },
  expandedRow: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: spacing.md,
    paddingVertical:   spacing.sm,
    gap:               spacing.sm,
  },
  expandedTrackNum: {
    ...typography.labelMd,
    color:     colors.outline,
    width:     22,
    textAlign: 'right',
  },
  expandedMeta: {
    flex: 1,
    gap:  2,
  },
  expandedTrackName: {
    ...typography.bodyMd,
    color: colors.onSurface,
  },
  expandedBadges: {
    flexDirection: 'row',
    alignItems:    'center',
    flexWrap:      'wrap',
    gap:           spacing.xs,
  },
  expandedTsBadge: {
    alignSelf:         'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical:   2,
    borderRadius:      radius.full,
  },
  expandedTsText: {
    ...typography.labelMd,
    color: colors.secondary,
  },
  expandedNote: {
    ...typography.labelMd,
    color:         colors.onSurfaceVariant,
    letterSpacing: 0,
    textTransform: 'none' as const,
    fontWeight:    '400' as const,
  },
  expandedPlayBtn: {
    width:           34,
    height:          34,
    borderRadius:    17,
    backgroundColor: colors.pillBg,
    alignItems:      'center',
    justifyContent:  'center',
  },
  artWrapper: {
    position: 'relative',
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
  countBadge: {
    position:        'absolute',
    top:             -6,
    right:           -6,
    minWidth:        22,
    height:          22,
    borderRadius:    11,
    backgroundColor: '#5C4033',
    alignItems:      'center',
    justifyContent:  'center',
    paddingHorizontal: 4,
  },
  countBadgeText: {
    fontSize:           12,
    fontWeight:         '800',
    color:              colors.secondary,
    textAlign:          'center',
    textAlignVertical:  'center',
    includeFontPadding: false,
    lineHeight:         22,
  },
  content: {
    flex: 1,
    gap:  2,
  },
  albumName: {
    ...typography.titleMd,
    color: colors.onSurface,
  },
  artist: {
    ...typography.labelLg,
    color:         colors.outline,
    letterSpacing: 0.5,
  },
  trackHint: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  deleteAction: {
    justifyContent:  'center',
    alignItems:      'center',
    width:           80,
    marginBottom:    spacing.sm,
    marginRight:     spacing.lg,
    borderRadius:    radius.xl,
    backgroundColor: '#c0392b',
    gap:             4,
  },
  deleteActionText: {
    ...typography.labelSm,
    color: '#fff',
  },
  shareBtn: {
    width:           36,
    height:          36,
    alignItems:      'center',
    justifyContent:  'center',
  },
  playBtn: {
    borderRadius: radius.full,
    overflow:     'hidden',
    ...shadows.card,
  },
  playGradient: {
    width:           44,
    height:          44,
    borderRadius:    22,
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: colors.pillBg,
  },
});

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: colors.background,
  },
  list: {
    gap: 0,
  },
  countLabel: {
    ...typography.labelMd,
    color: colors.outline,
  },
  sortRow: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: spacing.lg,
    marginTop:         spacing.sm,
    marginBottom:      spacing.sm,
  },
  sortBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               4,
    backgroundColor:   colors.surfaceContainerHigh,
    borderRadius:      radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical:   spacing.xs,
  },
  sortBtnText: {
    ...typography.labelMd,
    color: colors.outline,
  },
});
