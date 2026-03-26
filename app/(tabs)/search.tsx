// app/(tabs)/search.tsx
// Album search — text input → Spotify API → 2-column grid results.

import { useState, useCallback, useRef } from 'react';
import {
  View,
  TextInput,
  FlatList,
  StyleSheet,
  Text,
  Pressable,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SpotifyAlbum } from '@/types';
import { useSpotify } from '@/hooks/useSpotify';
import { useBookmarks } from '@/hooks/useBookmarks';
import { usePlayback } from '@/hooks/usePlayback';
import { useToastContext } from '@/contexts/ToastContext';
import { ScreenHeader } from '@/components/ScreenHeader';
import { AlbumCard } from '@/components/AlbumCard';
import {
  colors,
  typography,
  spacing,
  radius,
  TAB_BAR_HEIGHT,
} from '@/constants/theme';

const COLUMN_GAP = spacing.md;
const PADDING    = spacing.lg;

export default function SearchScreen() {
  const router  = useRouter();
  const spotify = useSpotify();

  const [query,     setQuery]     = useState('');
  const [albums,    setAlbums]    = useState<SpotifyAlbum[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { getBookmark, getBookmarksForAlbum } = useBookmarks();
  const { showToast } = useToastContext();
  const { resume, loadingAlbumId } = usePlayback({
    onSuccess:        () => showToast('Playing from bookmark', 'success'),
    onOpeningSpotify: () => showToast('Opening Spotify…', 'default'),
    onError:          (msg) => showToast(msg, 'error'),
    onExpired:        () => showToast('Session expired — please log in again', 'error'),
  });

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setAlbums([]);
      setHasSearched(false);
      setSearching(false);
      return;
    }

    setSearching(true);
    try {
      const results = await spotify.searchAlbums(trimmed);
      setAlbums(results);
      setHasSearched(true);
    } catch {
      showToast('Search failed — please try again', 'error');
    } finally {
      setSearching(false);
    }
  }, [spotify, showToast]);

  const handleChangeText = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(text), 500);
  };

  const handleSubmit = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    runSearch(query);
    Keyboard.dismiss();
  };

  const handleClear = () => {
    setQuery('');
    setAlbums([]);
    setHasSearched(false);
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

  return (
    <View style={styles.container}>
      <ScreenHeader title="Search" />

      {/* Search input */}
      <View style={styles.inputRow}>
        <View style={styles.inputWrapper}>
          <MaterialIcons name="search" size={20} color={colors.outline} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Albums, artists…"
            placeholderTextColor={colors.outline}
            value={query}
            onChangeText={handleChangeText}
            onSubmitEditing={handleSubmit}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <Pressable onPress={handleClear} hitSlop={8}>
              <MaterialIcons name="close" size={18} color={colors.outline} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Content area */}
      {searching ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.secondary} />
        </View>
      ) : !hasSearched ? (
        <View style={styles.center}>
          <MaterialIcons name="album" size={48} color={colors.surfaceContainerHighest} />
          <Text style={styles.hintText}>Search your favourite albums</Text>
        </View>
      ) : albums.length === 0 ? (
        <View style={styles.center}>
          <MaterialIcons name="search-off" size={48} color={colors.outline} />
          <Text style={styles.hintText}>No albums found for "{query}"</Text>
        </View>
      ) : (
        <FlatList
          data={albums}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const bookmark = getBookmark(item.id);
            const albumBookmarks = getBookmarksForAlbum(item.id);
            return (
              <View style={styles.cardWrapper}>
                <AlbumCard
                  album={item}
                  bookmark={bookmark}
                  bookmarkCount={albumBookmarks.length}
                  onPress={() => handleAlbumPress(item)}
                  onPlay={bookmark ? () => handlePlay(item) : undefined}
                  isLoading={loadingAlbumId === item.id}
                />
              </View>
            );
          }}
        />
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: colors.background,
  },
  inputRow: {
    paddingHorizontal: PADDING,
    paddingVertical:   spacing.md,
    backgroundColor:   colors.background,
  },
  inputWrapper: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   colors.surfaceContainerLow,
    borderRadius:      radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical:   spacing.md,
    gap:               spacing.sm,
  },
  inputIcon: {
    // icon sits left of text
  },
  input: {
    flex:     1,
    ...typography.bodyMd,
    color:    colors.onSurface,
    padding:  0,
  },
  center: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            spacing.lg,
    paddingBottom:  TAB_BAR_HEIGHT,
  },
  hintText: {
    ...typography.bodyMd,
    color:     colors.outline,
    textAlign: 'center',
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
});
