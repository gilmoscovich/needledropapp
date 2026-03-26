# NeedleDrop — Frontend Phase 5: Polish

## Goal
Add the finishing layer: global toast notifications, skeleton loaders
for loading states, and haptics wired into every key interaction.
After this phase the app feels finished and production-ready.

---

## Prerequisites
Frontend Phase 4 complete — all screens exist and work.

---

## Part A — Toast System

### File to create: `contexts/ToastContext.tsx`

Makes toast available from any screen without prop drilling.

```typescript
// contexts/ToastContext.tsx
import { createContext, useContext, useRef, useState, useCallback, ReactNode } from 'react';
import { ToastType } from '@/types';

interface ToastMessage {
  id:      number;
  message: string;
  type:    ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
  toast:     ToastMessage | null;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
  toast:     null,
});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast,  setToast]  = useState<ToastMessage | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const showToast = useCallback((message: string, type: ToastType = 'default') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ id: Date.now(), message, type });
    timerRef.current = setTimeout(() => setToast(null), 2800);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, toast }}>
      {children}
    </ToastContext.Provider>
  );
}

export const useToastContext = () => useContext(ToastContext);
```

### File to create: `components/Toast.tsx`

Animated toast that slides up from above the bottom nav.

```typescript
// components/Toast.tsx
import { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useToastContext } from '@/contexts/ToastContext';
import { colors, typography, spacing, radius, TAB_BAR_HEIGHT } from '@/constants/theme';
import { ToastType } from '@/types';

export function Toast() {
  const { toast } = useToastContext();
  const insets    = useSafeAreaInsets();
  const anim      = useRef(new Animated.Value(0)).current;
  const prevId    = useRef<number | null>(null);

  useEffect(() => {
    if (toast && toast.id !== prevId.current) {
      prevId.current = toast.id;
      // Slide in
      Animated.spring(anim, {
        toValue:  1,
        tension:  100,
        friction: 10,
        useNativeDriver: true,
      }).start();
    } else if (!toast) {
      // Slide out
      Animated.timing(anim, {
        toValue:  0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [toast]);

  const translateY = anim.interpolate({
    inputRange:  [0, 1],
    outputRange: [40, 0],
  });
  const opacity = anim;

  const icon = toastIcon(toast?.type ?? 'default');
  const bg   = toastBg(toast?.type ?? 'default');

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        { bottom: TAB_BAR_HEIGHT + spacing.lg + insets.bottom },
        { opacity, transform: [{ translateY }] },
      ]}
    >
      <View style={[styles.pill, { backgroundColor: bg }]}>
        <MaterialIcons name={icon} size={16} color={toastIconColor(toast?.type ?? 'default')} />
        <Text style={[styles.message, { color: toastTextColor(toast?.type ?? 'default') }]}>
          {toast?.message}
        </Text>
      </View>
    </Animated.View>
  );
}

function toastIcon(type: ToastType): any {
  switch (type) {
    case 'success': return 'check-circle';
    case 'error':   return 'error-outline';
    default:        return 'info-outline';
  }
}

function toastBg(type: ToastType): string {
  switch (type) {
    case 'success': return colors.secondaryContainer;
    case 'error':   return colors.errorContainer;
    default:        return colors.surfaceContainerHighest;
  }
}

function toastIconColor(type: ToastType): string {
  switch (type) {
    case 'success': return colors.secondary;
    case 'error':   return colors.error;
    default:        return colors.primary;
  }
}

function toastTextColor(type: ToastType): string {
  switch (type) {
    case 'success': return colors.onSecondaryContainer;
    case 'error':   return colors.error;
    default:        return colors.onSurface;
  }
}

const styles = StyleSheet.create({
  container: {
    position:       'absolute',
    left:           spacing.lg,
    right:          spacing.lg,
    alignItems:     'center',
    zIndex:         9999,
  },
  pill: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical:  spacing.md,
    borderRadius:     radius.full,
    maxWidth:         360,
  },
  message: {
    ...typography.bodyMd,
  },
});
```

### Update `app/_layout.tsx` to include providers

```typescript
// app/_layout.tsx — updated
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Manrope_400Regular, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import * as SplashScreen from 'expo-splash-screen';
import { ToastProvider } from '@/contexts/ToastContext';
import { Toast } from '@/components/Toast';
import { colors } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ToastProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="album/[id]"
          options={{ presentation: 'card', animation: 'slide_from_right' }}
        />
      </Stack>
      <Toast />
    </ToastProvider>
  );
}
```

### Wire toast into Bookmarks screen

In `app/(tabs)/bookmarks.tsx`, replace the placeholder `usePlayback` callbacks:

```typescript
// At the top of BookmarksScreen()
const { showToast } = useToastContext();

// Update usePlayback callbacks:
const { resume, loadingAlbumId } = usePlayback({
  onSuccess:        () => showToast('Now playing!', 'success'),
  onOpeningSpotify: () => showToast('Opening Spotify…', 'default'),
  onError:          (msg) => showToast(msg, 'error'),
  onExpired:        () => showToast('Session expired — please log in again', 'error'),
});
```

### Wire toast into Album Detail screen

Same pattern in `app/album/[id].tsx`:

```typescript
const { showToast } = useToastContext();

const { resume, loadingAlbumId } = usePlayback({
  onSuccess:        () => showToast('Now playing!', 'success'),
  onOpeningSpotify: () => showToast('Opening Spotify…', 'default'),
  onError:          (msg) => showToast(msg, 'error'),
  onExpired:        () => showToast('Session expired', 'error'),
});
```

---

## Part B — Skeleton Loaders

Replace `ActivityIndicator` loading states with contextual skeletons.

### File to create: `components/SkeletonCard.tsx`

```typescript
// components/SkeletonCard.tsx
// Animated shimmer skeleton for album cards.
import { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, radius } from '@/constants/theme';

const CARD_GAP   = spacing.md;
const CARD_WIDTH = (Dimensions.get('window').width - spacing.lg * 2 - CARD_GAP) / 2;

export function SkeletonCard() {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.8] });

  return (
    <Animated.View style={[styles.card, { opacity }]}>
      <View style={styles.art} />
      <View style={styles.titleLine} />
      <View style={styles.artistLine} />
    </Animated.View>
  );
}

export function SkeletonGrid() {
  return (
    <View style={styles.grid}>
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection:   'row',
    flexWrap:        'wrap',
    paddingHorizontal: spacing.lg,
    gap:             spacing.md,
    paddingTop:      spacing.md,
  },
  card: {
    width: CARD_WIDTH,
    gap:   spacing.sm,
  },
  art: {
    width:           '100%',
    aspectRatio:     1,
    borderRadius:    radius.xl,
    backgroundColor: colors.surfaceContainerHigh,
  },
  titleLine: {
    height:          14,
    width:           '80%',
    borderRadius:    radius.sm,
    backgroundColor: colors.surfaceContainerHigh,
  },
  artistLine: {
    height:          11,
    width:           '55%',
    borderRadius:    radius.sm,
    backgroundColor: colors.surfaceContainer,
  },
});
```

### File to create: `components/SkeletonBookmarkCard.tsx`

```typescript
// components/SkeletonBookmarkCard.tsx
import { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '@/constants/theme';

export function SkeletonBookmarkCard() {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.8] });

  return (
    <Animated.View style={[styles.card, { opacity }]}>
      <View style={styles.art} />
      <View style={styles.lines}>
        <View style={styles.line1} />
        <View style={styles.line2} />
        <View style={styles.line3} />
      </View>
      <View style={styles.circle} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection:   'row',
    alignItems:      'center',
    marginHorizontal: spacing.lg,
    marginBottom:    spacing.sm,
    padding:         spacing.md,
    borderRadius:    radius.xl,
    backgroundColor: colors.surfaceContainer,
    gap:             spacing.md,
  },
  art: {
    width:           64,
    height:          64,
    borderRadius:    radius.lg,
    backgroundColor: colors.surfaceContainerHigh,
  },
  lines: {
    flex: 1,
    gap:  6,
  },
  line1: {
    height:          13,
    width:           '80%',
    borderRadius:    radius.sm,
    backgroundColor: colors.surfaceContainerHigh,
  },
  line2: {
    height:          11,
    width:           '65%',
    borderRadius:    radius.sm,
    backgroundColor: colors.surfaceContainerHigh,
  },
  line3: {
    height:          10,
    width:           '40%',
    borderRadius:    radius.sm,
    backgroundColor: colors.surfaceContainer,
  },
  circle: {
    width:           44,
    height:          44,
    borderRadius:    22,
    backgroundColor: colors.surfaceContainerHigh,
  },
});
```

### Update Library screen to use skeletons

In `app/(tabs)/library.tsx`, replace the `ActivityIndicator` loading state:

```typescript
// Replace this:
if (loading) {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

// With this:
if (loading) {
  return (
    <View style={styles.container}>
      <ScreenHeader title="My Library" subtitle="COLLECTION" />
      <SkeletonGrid />
    </View>
  );
}
```

Import `SkeletonGrid` at the top:
```typescript
import { SkeletonGrid } from '@/components/SkeletonCard';
```

### Update Bookmarks screen to use skeletons

In `app/(tabs)/bookmarks.tsx`, replace the loading state:

```typescript
// Replace the ActivityIndicator loading state with:
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
```

Import `SkeletonBookmarkCard` at the top:
```typescript
import { SkeletonBookmarkCard } from '@/components/SkeletonBookmarkCard';
```

---

## Part C — Haptics Polish

These should already be in place from earlier phases. Verify all
these interactions fire haptics:

| Interaction                     | Haptic type                      |
|---------------------------------|----------------------------------|
| Tab switch                      | `impactAsync(Light)`             |
| AlbumCard press                 | `impactAsync(Light)`             |
| Track row selection (picker)    | `selectionAsync()`               |
| Drop Needle / Play button       | `impactAsync(Medium)`            |
| Save Bookmark success           | `notificationAsync(Success)`     |
| Delete Bookmark confirm         | `notificationAsync(Warning)`     |
| Login button                    | `impactAsync(Light)`             |

Add to login button in `app/login.tsx`:

```typescript
const handleLogin = async () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  try {
    await login();
  } catch {
    Alert.alert('Login failed', 'Could not connect to Spotify. Please try again.');
  }
};
```

---

## Final project structure

```
needledrop/
├── app/
│   ├── _layout.tsx              ✓ ToastProvider + Toast
│   ├── index.tsx                ✓
│   ├── login.tsx                ✓
│   ├── (tabs)/
│   │   ├── _layout.tsx          ✓
│   │   ├── library.tsx          ✓ + SkeletonGrid
│   │   ├── bookmarks.tsx        ✓ + SkeletonBookmarkCard + toast
│   │   └── search.tsx           ✓
│   └── album/
│       └── [id].tsx             ✓ + toast
├── components/
│   ├── BottomNav.tsx            ✓
│   ├── ScreenHeader.tsx         ✓
│   ├── AlbumCard.tsx            ✓
│   ├── TrackPickerModal.tsx     ✓
│   ├── Toast.tsx                ✓
│   ├── SkeletonCard.tsx         ✓ (SkeletonCard + SkeletonGrid)
│   └── SkeletonBookmarkCard.tsx ✓
├── contexts/
│   └── ToastContext.tsx         ✓
├── constants/
│   └── theme.ts                 ✓ (Phase 1)
├── types/
│   └── index.ts                 ✓ (Phase 1)
├── services/
│   ├── auth.ts                  ✓ (Phase 2)
│   ├── spotify.ts               ✓ (Phase 3)
│   ├── bookmarks.ts             ✓ (Phase 4)
│   └── playback.ts              ✓ (Phase 5)
└── hooks/
    ├── useSpotifyAuth.ts        ✓
    ├── useSpotify.ts            ✓
    ├── useBookmarks.ts          ✓
    ├── usePlayback.ts           ✓
    └── useToast.ts              ✓
```

---

## Definition of done

- [ ] Toast slides up from above the bottom nav on success/error/default
- [ ] Toast auto-dismisses after 2.8 seconds
- [ ] "Now playing!" success toast fires after playback starts
- [ ] "Opening Spotify…" default toast fires during retry wait
- [ ] Error toast fires when playback fails
- [ ] Library shows skeleton cards (pulsing) while fetching
- [ ] Bookmarks shows skeleton cards (pulsing) while loading
- [ ] Skeletons are replaced by real data seamlessly
- [ ] All haptic triggers from the table are wired in
- [ ] No TypeScript errors across all files

---

## What comes next — Phase 6

- EAS build configuration (`eas.json`)
- App Store submission (iOS)
- Google Play submission (Android)
- Push notifications (optional)
- Analytics (optional)
