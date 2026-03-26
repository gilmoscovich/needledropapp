# NeedleDrop — Frontend Phase 3: Library & Search Screens

## Goal
Build the Library and Search screens with full data from Spotify.
Both share the `AlbumCard` component and a reusable `ScreenHeader`.
Tapping an album navigates to `/album/[id]` (built in Phase 4).

---

## Prerequisites
Frontend Phase 2 complete — navigation shell exists.
Backend Phase 3 complete — `useSpotify` hook works.

---

## File to create: `components/ScreenHeader.tsx`

Shared editorial header used by Library and Search.

```typescript
// components/ScreenHeader.tsx
// Glassmorphic top header with wordmark + user avatar.
// Passed a title prop for the page heading below the bar.

import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, glassNavStyle } from '@/constants/theme';

interface ScreenHeaderProps {
  title:       string;
  subtitle?:   string;
  avatarUrl?:  string;
  onAvatarPress?: () => void;
  rightSlot?:  React.ReactNode;
}

export function ScreenHeader({
  title,
  subtitle,
  avatarUrl,
  onAvatarPress,
  rightSlot,
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  const Inner = (
    <View style={[styles.bar, { paddingTop: insets.top + spacing.sm }]}>
      {/* Left: avatar + wordmark */}
      <View style={styles.left}>
        {avatarUrl ? (
          <Pressable onPress={onAvatarPress} style={styles.avatar}>
            <Image source={{ uri: avatarUrl }} style={styles.avatarImg} contentFit="cover" />
          </Pressable>
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]} />
        )}
        <Text style={styles.wordmark}>NEEDLE DROP</Text>
      </View>

      {/* Right slot (search icon, etc.) */}
      {rightSlot && <View style={styles.right}>{rightSlot}</View>}
    </View>
  );

  return (
    <View>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={70} tint="dark" style={styles.blurWrapper}>
          {Inner}
        </BlurView>
      ) : (
        <View style={[styles.blurWrapper, { backgroundColor: glassNavStyle.backgroundColor }]}>
          {Inner}
        </View>
      )}

      {/* Page title — below the bar, part of scroll header */}
      <View style={styles.titleBlock}>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        <Text style={styles.title}>{title}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  blurWrapper: {
    overflow: 'hidden',
  },
  bar: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom:  spacing.md,
  },
  left: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing.sm,
  },
  avatar: {
    width:        32,
    height:       32,
    borderRadius: 16,
    overflow:     'hidden',
  },
  avatarImg: {
    width:  '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    backgroundColor: colors.surfaceContainerHigh,
  },
  wordmark: {
    ...typography.labelLg,
    color:         colors.primary,
    letterSpacing: 3,
  },
  right: {
    flexDirection: 'row',
    gap:           spacing.lg,
  },
  titleBlock: {
    paddingHorizontal: spacing.lg,
    paddingTop:        spacing.xl,
    paddingBottom:     spacing.md,
    backgroundColor:   colors.background,
  },
  subtitle: {
    ...typography.labelSm,
    color:         colors.secondary,
    marginBottom:  4,
    letterSpacing: 3,
  },
  title: {
    ...typography.headlineLg,
    color: colors.primary,
  },
});
```

---

## File to create: `components/AlbumCard.tsx`

Used in Library (2-column grid) and Search (2-column grid).

```typescript
// components/AlbumCard.tsx
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, radius, shadows } from '@/constants/theme';
import { SpotifyAlbum } from '@/types';

interface AlbumCardProps {
  album:     SpotifyAlbum;
  onPress:   (album: SpotifyAlbum) => void;
  // Optional: show bookmark indicator dot
  bookmarked?: boolean;
}

const CARD_GAP    = spacing.md;
const CARD_WIDTH  = (Dimensions.get('window').width - spacing.lg * 2 - CARD_GAP) / 2;

export function AlbumCard({ album, onPress, bookmarked }: AlbumCardProps) {
  const artUrl  = album.images?.[0]?.url;
  const artist  = album.artists?.map(a => a.name).join(', ') ?? '';

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(album);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
      ]}
    >
      {/* Album art */}
      <View style={styles.artWrapper}>
        {artUrl ? (
          <Image
            source={{ uri: artUrl }}
            style={styles.art}
            contentFit="cover"
            transition={300}
          />
        ) : (
          <View style={[styles.art, styles.artPlaceholder]} />
        )}

        {/* Bookmark indicator */}
        {bookmarked && <View style={styles.bookmarkDot} />}
      </View>

      {/* Text */}
      <View style={styles.meta}>
        <Text style={styles.albumName} numberOfLines={2}>{album.name}</Text>
        <Text style={styles.artist}    numberOfLines={1}>{artist}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    gap:   spacing.sm,
  },
  artWrapper: {
    position:     'relative',
    width:        '100%',
    aspectRatio:  1,
    borderRadius: radius.xl,
    overflow:     'hidden',
    ...shadows.albumArt,
  },
  art: {
    width:  '100%',
    height: '100%',
  },
  artPlaceholder: {
    backgroundColor: colors.surfaceContainerHigh,
  },
  bookmarkDot: {
    position:        'absolute',
    top:             spacing.sm,
    right:           spacing.sm,
    width:           10,
    height:          10,
    borderRadius:    5,
    backgroundColor: colors.secondary,
    borderWidth:     1.5,
    borderColor:     colors.background,
  },
  meta: {
    gap: 2,
    paddingHorizontal: 2,
  },
  albumName: {
    ...typography.titleMd,
    color: colors.onSurface,
  },
  artist: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
});
```

---

## File to replace: `app/(tabs)/library.tsx`

```typescript
// app/(tabs)/library.tsx
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Text,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { ScreenHeader } from '@/components/ScreenHeader';
import { AlbumCard } from '@/components/AlbumCard';
import { useSpotify } from '@/hooks/useSpotify';
import { useBookmarks } from '@/hooks/useBookmarks';
import { SpotifyAlbum, SpotifyUser } from '@/types';
import { colors, spacing, typography, TAB_BAR_HEIGHT } from '@/constants/theme';

export default function LibraryScreen() {
  const router   = useRouter();
  const insets   = useSafeAreaInsets();
  const { getUserProfile, getMyAlbums } = useSpotify();
  const { isBookmarked } = useBookmarks();

  const [albums,      setAlbums]      = useState<SpotifyAlbum[]>([]);
  const [user,        setUser]        = useState<SpotifyUser | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [profile, savedAlbums] = await Promise.all([
        getUserProfile(),
        getMyAlbums(),
      ]);
      setUser(profile);
      setAlbums(savedAlbums);
    } catch (err: any) {
      setError('Could not load your library.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    load();
  };

  const handleAlbumPress = (album: SpotifyAlbum) => {
    router.push(`/album/${album.id}`);
  };

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
        data={albums}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: TAB_BAR_HEIGHT + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <ScreenHeader
            title="My Library"
            subtitle="COLLECTION"
            avatarUrl={user?.images?.[0]?.url}
          />
        }
        ListEmptyComponent={
          error
            ? <EmptyState message={error} icon="error-outline" />
            : <EmptyState
                message={"Save albums in Spotify\nto see them here."}
                icon="library-music"
              />
        }
        renderItem={({ item }) => (
          <AlbumCard
            album={item}
            onPress={handleAlbumPress}
            bookmarked={isBookmarked(item.id)}
          />
        )}
      />
    </View>
  );
}

function EmptyState({ message, icon }: { message: string; icon: string }) {
  return (
    <View style={emptyStyles.container}>
      <MaterialIcons name={icon as any} size={48} color={colors.outlineVariant} />
      <Text style={emptyStyles.text}>{message}</Text>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            spacing.md,
    paddingTop:     spacing.xxxl,
    paddingHorizontal: spacing.xxl,
  },
  text: {
    ...typography.bodyMd,
    color:     colors.outline,
    textAlign: 'center',
    lineHeight: 22,
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
    gap: spacing.xl,
  },
  row: {
    paddingHorizontal: spacing.lg,
    gap:               spacing.md,
  },
});
```

---

## File to replace: `app/(tabs)/search.tsx`

```typescript
// app/(tabs)/search.tsx
import { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { AlbumCard } from '@/components/AlbumCard';
import { useSpotify } from '@/hooks/useSpotify';
import { useBookmarks } from '@/hooks/useBookmarks';
import { SpotifyAlbum } from '@/types';
import {
  colors, typography, spacing, radius, TAB_BAR_HEIGHT,
} from '@/constants/theme';

export default function SearchScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { searchAlbums } = useSpotify();
  const { isBookmarked } = useBookmarks();

  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState<SpotifyAlbum[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const handleChange = useCallback((text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!text.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchAlbums(text.trim());
        setResults(res);
        setSearched(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 500);
  }, [searchAlbums]);

  const handleAlbumPress = (album: SpotifyAlbum) => {
    Keyboard.dismiss();
    router.push(`/album/${album.id}`);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setSearched(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Fixed search bar */}
      <View style={styles.searchBarWrapper}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color={colors.outline} />
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={handleChange}
            placeholder="Curate your sound…"
            placeholderTextColor={colors.outline}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <Pressable onPress={clearSearch}>
              <MaterialIcons name="close" size={18} color={colors.outline} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Results / empty state */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: TAB_BAR_HEIGHT + spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            !searched
              ? <SearchEmptyState />
              : results.length === 0
              ? (
                <View style={styles.center}>
                  <Text style={styles.noResults}>No albums found for "{query}"</Text>
                </View>
              )
              : (
                <View style={styles.resultsHeader}>
                  <Text style={styles.resultsLabel}>
                    {results.length} RESULTS
                  </Text>
                </View>
              )
          }
          renderItem={({ item }) => (
            <AlbumCard
              album={item}
              onPress={handleAlbumPress}
              bookmarked={isBookmarked(item.id)}
            />
          )}
        />
      )}
    </View>
  );
}

function SearchEmptyState() {
  return (
    <View style={emptyStyles.container}>
      <MaterialIcons name="auto-awesome" size={40} color={colors.outlineVariant} />
      <Text style={emptyStyles.title}>Discover your next drop</Text>
      <Text style={emptyStyles.body}>
        Search any artist, album, or genre.
      </Text>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: {
    alignItems:    'center',
    paddingTop:    spacing.xxxl,
    paddingBottom: spacing.xl,
    gap:           spacing.md,
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
});

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: colors.background,
  },
  searchBarWrapper: {
    paddingHorizontal: spacing.lg,
    paddingBottom:     spacing.md,
    paddingTop:        spacing.sm,
    backgroundColor:   colors.background,
  },
  searchBar: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             spacing.sm,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius:    radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  input: {
    flex:       1,
    ...typography.bodyLg,
    color:      colors.onSurface,
    padding:    0,
  },
  list: {
    gap: spacing.xl,
    paddingTop: spacing.sm,
  },
  row: {
    paddingHorizontal: spacing.lg,
    gap:               spacing.md,
  },
  center: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    paddingTop:     spacing.xxxl,
  },
  noResults: {
    ...typography.bodyMd,
    color:     colors.outline,
    textAlign: 'center',
  },
  resultsHeader: {
    paddingHorizontal: spacing.lg,
    paddingBottom:     spacing.md,
  },
  resultsLabel: {
    ...typography.labelSm,
    color: colors.outline,
  },
});
```

---

## Definition of done

- [ ] Library shows user's saved Spotify albums in a 2-column grid
- [ ] Pull-to-refresh works on Library
- [ ] Library empty state shows when user has no saved albums
- [ ] Search debounces — waits 500ms before firing
- [ ] Search results appear as the user types
- [ ] Clear button (×) resets search
- [ ] Bookmarked albums show a warm dot indicator on the art
- [ ] Tapping an album navigates to `/album/[id]`
- [ ] Both screens show user avatar in the header
- [ ] No TypeScript errors

---

## Do NOT build in this phase
- Album detail screen (Phase 4)
- Track picker modal (Phase 4)
- Bookmarks screen (Phase 4)
