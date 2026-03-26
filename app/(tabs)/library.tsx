// app/(tabs)/library.tsx
// User's Spotify library — saved albums in a 2-column grid.
// Pull-to-refresh, bookmark indicators, per-card play buttons.

import { useEffect, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Text,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SpotifyAlbum, SpotifyUser } from '@/types';
import { useSpotify } from '@/hooks/useSpotify';
import { useBookmarks } from '@/hooks/useBookmarks';
import { usePlayback } from '@/hooks/usePlayback';
import { useToastContext } from '@/contexts/ToastContext';
import { ScreenHeader } from '@/components/ScreenHeader';
import { AlbumCard } from '@/components/AlbumCard';
import { SkeletonGrid } from '@/components/SkeletonCard';
import {
  colors,
  typography,
  spacing,
  TAB_BAR_HEIGHT,
} from '@/constants/theme';

const COLUMN_GAP = spacing.md;
const PADDING    = spacing.lg;

export default function LibraryScreen() {
  const router  = useRouter();
  const spotify = useSpotify();
  const { logout, ready } = spotify;

  const [albums,     setAlbums]     = useState<SpotifyAlbum[]>([]);
  const [user,       setUser]       = useState<SpotifyUser | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const { bookmarks, getBookmark } = useBookmarks();
  const { showToast }              = useToastContext();
  const { resume, loadingAlbumId } = usePlayback({
    onSuccess:        () => showToast('Playing from bookmark', 'success'),
    onOpeningSpotify: () => showToast('Opening Spotify…', 'default'),
    onError:          (msg) => showToast(msg, 'error'),
    onExpired:        () => showToast('Session expired — please log in again', 'error'),
  });

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [albumsData, userData] = await Promise.all([
        spotify.getMyAlbums(),
        spotify.getUserProfile(),
      ]);
      setAlbums(albumsData);
      setUser(userData);
    } catch {
      setError('Could not load your library. Pull down to retry.');
    }
  }, [spotify]);

  useEffect(() => {
    if (!ready) return;
    loadData().finally(() => setLoading(false));
  }, [ready]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAlbumPress = (album: SpotifyAlbum) => {
    router.push(`/album/${album.id}`);
  };

  const handlePlay = (album: SpotifyAlbum) => {
    const bookmark = getBookmark(album.id);
    if (!bookmark) {
      showToast('No bookmark saved for this album', 'default');
      return;
    }
    resume(bookmark);
  };

  // ─── Loading skeleton ─────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="My Library" subtitle="COLLECTION" />
        <SkeletonGrid />
      </View>
    );
  }

  // ─── Error state ──────────────────────────────────────────────
  if (error) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="My Library" />
        <View style={styles.emptyCenter}>
          <MaterialIcons name="cloud-off" size={48} color={colors.outline} />
          <Text style={styles.emptyText}>{error}</Text>
          <Pressable onPress={() => { setLoading(true); loadData().finally(() => setLoading(false)); }} style={styles.retryBtn}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ─── Empty state ──────────────────────────────────────────────
  if (albums.length === 0) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="My Library" />
        <View style={styles.emptyCenter}>
          <MaterialIcons name="library-music" size={48} color={colors.outline} />
          <Text style={styles.emptyText}>No saved albums yet.{'\n'}Save some albums in Spotify first.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="My Library"
        subtitle={bookmarks.length > 0 ? `${bookmarks.length} bookmark${bookmarks.length === 1 ? '' : 's'}` : undefined}
        avatarUrl={user?.images?.[0]?.url}
        onAvatarPress={logout}
      />

      <FlatList
        data={albums}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.secondary}
          />
        }
        renderItem={({ item }) => {
          const bookmark = getBookmark(item.id);
          return (
            <View style={styles.cardWrapper}>
              <AlbumCard
                album={item}
                bookmark={bookmark}
                onPress={() => handleAlbumPress(item)}
                onPlay={bookmark ? () => handlePlay(item) : undefined}
                isLoading={loadingAlbumId === item.id}
              />
            </View>
          );
        }}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: colors.background,
  },
  grid: {
    paddingHorizontal: PADDING,
    paddingTop:        spacing.md,
    paddingBottom:     TAB_BAR_HEIGHT + spacing.xl,
    gap:               COLUMN_GAP,
  },
  row: {
    gap: COLUMN_GAP,
  },
  cardWrapper: {
    flex: 1,
  },
  loadingCenter: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    paddingBottom:  TAB_BAR_HEIGHT,
  },
  emptyCenter: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    paddingBottom:  TAB_BAR_HEIGHT,
    gap:            spacing.lg,
    paddingHorizontal: spacing.xxl,
  },
  emptyText: {
    ...typography.bodyMd,
    color:     colors.outline,
    textAlign: 'center',
  },
  retryBtn: {
    paddingVertical:   spacing.sm,
    paddingHorizontal: spacing.xl,
    backgroundColor:   colors.surfaceContainerHigh,
    borderRadius:      999,
  },
  retryText: {
    ...typography.labelLg,
    color: colors.onSurface,
  },
});
