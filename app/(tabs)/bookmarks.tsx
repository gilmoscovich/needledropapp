// app/(tabs)/bookmarks.tsx
import { useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ActionSheetIOS,
  Platform,
  Alert,
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
import { Bookmark } from '@/types';
import {
  colors, typography, spacing, radius, shadows,
  TAB_BAR_HEIGHT,
} from '@/constants/theme';

interface AlbumGroup extends Bookmark {
  bookmarks: Bookmark[];
  count:     number;
}

export default function BookmarksScreen() {
  const router = useRouter();
  const { bookmarks, loading, deleteBookmark, deleteBookmarksForAlbum } = useBookmarks();
  const { showToast } = useToastContext();

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
      .sort((a, b) => b.savedAt - a.savedAt);
  }, [bookmarks]);

  const { resume, loadingAlbumId } = usePlayback({
    onSuccess:        () => showToast('Now playing!', 'success'),
    onOpeningSpotify: () => showToast('Opening Spotify…', 'default'),
    onError:          (msg) => showToast(msg, 'error'),
    onExpired:        () => showToast('Session expired — please log in again', 'error'),
  });

  const handlePlay = useCallback((group: AlbumGroup) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    resume(group.bookmarks[0]); // most-recently-saved bookmark
  }, [resume]);

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
              <Text style={[styles.countLabel, { paddingHorizontal: spacing.lg, marginBottom: spacing.sm }]}>
                {albumGroups.length} ALBUM{albumGroups.length !== 1 ? 'S' : ''}
              </Text>
            )}
          </View>
        }
        ListEmptyComponent={<BookmarksEmpty onSearch={() => router.push('/(tabs)/search')} />}
        renderItem={({ item }) => (
          <SwipeableAlbumCard
            group={item}
            isPlaying={loadingAlbumId === item.albumId}
            onPlay={() => handlePlay(item)}
            onPress={() => router.push(`/album/${item.albumId}`)}
            onDelete={() => handleDelete(item)}
          />
        )}
      />
    </View>
  );
}

function SwipeableAlbumCard(props: {
  group:     AlbumGroup;
  isPlaying: boolean;
  onPlay:    () => void;
  onPress:   () => void;
  onDelete:  () => void;
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
  isPlaying,
  onPlay,
  onPress,
}: {
  group:     AlbumGroup;
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
        {group.count > 1 && (
          <Text style={cardStyles.trackHint} numberOfLines={1}>
            {group.bookmarks[0].trackName}
          </Text>
        )}
        {group.count === 1 && (
          <Text style={cardStyles.trackHint} numberOfLines={1}>
            {group.bookmarks[0].trackNum}. {group.bookmarks[0].trackName}
          </Text>
        )}
      </View>

      {/* Play button */}
      <Pressable onPress={onPlay} disabled={isPlaying} style={cardStyles.playBtn}>
        <View style={cardStyles.playGradient}>
          {isPlaying
            ? <ActivityIndicator color={colors.onPill} size="small" />
            : <MaterialIcons name="play-arrow" size={20} color={colors.onPill} />
          }
        </View>
      </Pressable>
    </Pressable>
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
    flexDirection:    'row',
    alignItems:       'center',
    marginHorizontal: spacing.lg,
    marginBottom:     spacing.sm,
    padding:          spacing.md,
    borderRadius:     radius.xl,
    backgroundColor:  colors.surfaceContainer,
    gap:              spacing.md,
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
    backgroundColor: colors.secondary,
    alignItems:      'center',
    justifyContent:  'center',
    paddingHorizontal: 4,
    borderWidth:     2,
    borderColor:     colors.surfaceContainer,
  },
  countBadgeText: {
    ...typography.labelSm,
    color:      colors.background,
    fontWeight: '800',
    lineHeight: 14,
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
    color:     colors.outline,
    marginTop: spacing.sm,
  },
});
