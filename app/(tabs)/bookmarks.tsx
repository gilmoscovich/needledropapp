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
import { useToastContext } from '@/contexts/ToastContext';
import { SkeletonBookmarkCard } from '@/components/SkeletonBookmarkCard';
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

  const { showToast } = useToastContext();

  const { resume, loadingAlbumId } = usePlayback({
    onSuccess:        () => showToast('Now playing!', 'success'),
    onOpeningSpotify: () => showToast('Opening Spotify…', 'default'),
    onError:          (msg) => showToast(msg, 'error'),
    onExpired:        () => showToast('Session expired — please log in again', 'error'),
  });

  const handlePlay = useCallback((bm: Bookmark) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    resume(bm);
  }, [resume]);

  const handleDelete = useCallback((trackUri: string, trackName: string) => {
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
  }, [deleteBookmark]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={{ paddingTop: insets.top + spacing.lg, paddingHorizontal: spacing.lg, paddingBottom: spacing.xl }}>
          <Text style={styles.headerSub}>PERSONAL ARCHIVES</Text>
          <Text style={styles.headerTitle}>Sonic Timestamps</Text>
        </View>
        {[0, 1, 2, 3].map(i => <SkeletonBookmarkCard key={i} />)}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={bookmarks}
        keyExtractor={item => item.trackUri}
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
            onDelete={() => handleDelete(item.trackUri, item.trackName)}
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
      <MaterialCommunityIcons name="book-heart-outline" size={64} color={colors.outlineVariant} />
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
