# NeedleDrop — Frontend Phase 2: Navigation Shell

## Goal
Build the tab navigation shell: a custom glassmorphism bottom nav bar
with three tabs (Library, Bookmarks, Search). All screens are empty
placeholders for now — just the chrome.

---

## Prerequisites
Frontend Phase 1 complete — root layout and login exist.

---

## How the navigation works

```
app/
├── _layout.tsx              ← root Stack (login, tabs, album detail)
├── index.tsx                ← redirect
├── login.tsx                ← login screen
├── (tabs)/
│   ├── _layout.tsx          ← tab layout with custom bottom bar
│   ├── library.tsx          ← placeholder
│   ├── bookmarks.tsx        ← placeholder
│   └── search.tsx           ← placeholder
└── album/
    └── [id].tsx             ← placeholder
```

The custom tab bar is a `BlurView` overlay — it floats over content
so screens can scroll under it. This means every screen must add
`paddingBottom: TAB_BAR_HEIGHT` to its scroll container.

---

## File to create: `components/BottomNav.tsx`

```typescript
// components/BottomNav.tsx
// Glass-morphic bottom navigation bar.
// Rendered as a custom tabBar inside the tab layout.

import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, radius, TAB_BAR_HEIGHT, glassNavStyle } from '@/constants/theme';

interface Tab {
  key:   string;
  label: string;
  route: string;
}

const TABS: Tab[] = [
  { key: 'library',   label: 'Library',   route: 'library'   },
  { key: 'bookmarks', label: 'Bookmarks', route: 'bookmarks' },
  { key: 'search',    label: 'Search',    route: 'search'    },
];

interface BottomNavProps {
  state:       any;
  descriptors: any;
  navigation:  any;
}

export function BottomNav({ state, descriptors, navigation }: BottomNavProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: glassNavStyle.backgroundColor }]} />
      )}

      <View style={styles.row}>
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;

          const onPress = () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={styles.tab}
              accessibilityRole="button"
              accessibilityLabel={route.name}
            >
              <View style={[styles.iconWrapper, isFocused && styles.iconWrapperActive]}>
                <TabIcon name={route.name} active={isFocused} />
              </View>
              <Text style={[styles.label, isFocused && styles.labelActive]}>
                {route.name.charAt(0).toUpperCase() + route.name.slice(1)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function TabIcon({ name, active }: { name: string; active: boolean }) {
  const color = active ? colors.secondary : colors.outline;
  const size  = 22;

  switch (name) {
    case 'library':
      return <MaterialIcons name="library-music" size={size} color={color} />;
    case 'bookmarks':
      return <MaterialCommunityIcons name="bookmark-heart" size={size} color={color} />;
    case 'search':
      return <MaterialIcons name="search" size={size} color={color} />;
    default:
      return <MaterialIcons name="radio" size={size} color={color} />;
  }
}

const styles = StyleSheet.create({
  container: {
    position:        'absolute',
    bottom:          0,
    left:            0,
    right:           0,
    height:          TAB_BAR_HEIGHT,
    overflow:        'hidden',
    borderTopWidth:  1,
    borderTopColor:  'rgba(80, 68, 64, 0.15)',
  },
  row: {
    flex:           1,
    flexDirection:  'row',
    alignItems:     'center',
    paddingTop:     spacing.sm,
    paddingHorizontal: spacing.md,
  },
  tab: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            4,
    paddingVertical: spacing.xs,
  },
  iconWrapper: {
    width:          44,
    height:         32,
    borderRadius:   radius.full,
    alignItems:     'center',
    justifyContent: 'center',
  },
  iconWrapperActive: {
    backgroundColor: colors.secondaryContainer,
  },
  label: {
    ...typography.labelMd,
    color:       colors.outline,
    letterSpacing: 0.5,
  },
  labelActive: {
    color: colors.secondary,
  },
});
```

---

## File to create: `app/(tabs)/_layout.tsx`

```typescript
// app/(tabs)/_layout.tsx
// Tab navigator with our custom bottom nav.
// Redirects to login if the user isn't authenticated.

import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { useRouter } from 'expo-router';
import { useSpotifyAuth } from '@/hooks/useSpotifyAuth';
import { BottomNav } from '@/components/BottomNav';

export default function TabLayout() {
  const { isAuthenticated, ready } = useSpotifyAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !isAuthenticated) {
      router.replace('/login');
    }
  }, [ready, isAuthenticated]);

  return (
    <Tabs
      tabBar={props => <BottomNav {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="library"   options={{ title: 'Library'   }} />
      <Tabs.Screen name="bookmarks" options={{ title: 'Bookmarks' }} />
      <Tabs.Screen name="search"    options={{ title: 'Search'    }} />
    </Tabs>
  );
}
```

---

## Placeholder screens

Create these three files as minimal placeholders — they'll be filled
in Phases 3 and 4:

### `app/(tabs)/library.tsx`

```typescript
// app/(tabs)/library.tsx — placeholder
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, TAB_BAR_HEIGHT } from '@/constants/theme';

export default function LibraryScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.center}>
        <Text style={styles.text}>Library — coming in Phase 3</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: TAB_BAR_HEIGHT },
  text:      { ...typography.bodyMd, color: colors.outline },
});
```

### `app/(tabs)/bookmarks.tsx`

```typescript
// app/(tabs)/bookmarks.tsx — placeholder
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, TAB_BAR_HEIGHT } from '@/constants/theme';

export default function BookmarksScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.center}>
        <Text style={styles.text}>Bookmarks — coming in Phase 4</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: TAB_BAR_HEIGHT },
  text:      { ...typography.bodyMd, color: colors.outline },
});
```

### `app/(tabs)/search.tsx`

```typescript
// app/(tabs)/search.tsx — placeholder
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, TAB_BAR_HEIGHT } from '@/constants/theme';

export default function SearchScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.center}>
        <Text style={styles.text}>Search — coming in Phase 3</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: TAB_BAR_HEIGHT },
  text:      { ...typography.bodyMd, color: colors.outline },
});
```

### `app/album/[id].tsx`

```typescript
// app/album/[id].tsx — placeholder
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/constants/theme';

export default function AlbumDetailScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <MaterialIcons name="arrow-back" size={24} color={colors.onSurface} />
      </Pressable>
      <View style={styles.center}>
        <Text style={styles.text}>Album Detail — coming in Phase 4</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  back:      { padding: spacing.lg },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text:      { ...typography.bodyMd, color: colors.outline },
});
```

---

## Verify structure

```
app/
├── _layout.tsx           ✓ (Phase 1)
├── index.tsx             ✓ (Phase 1)
├── login.tsx             ✓ (Phase 1)
├── (tabs)/
│   ├── _layout.tsx       ✓
│   ├── library.tsx       ✓ placeholder
│   ├── bookmarks.tsx     ✓ placeholder
│   └── search.tsx        ✓ placeholder
└── album/
    └── [id].tsx          ✓ placeholder

components/
└── BottomNav.tsx         ✓
```

Run `npx expo start`. After login you should see:
- Three tabs at the bottom with icons
- Active tab: icons glow warm amber + pill background
- Inactive tabs: muted grey
- Haptic feedback on tab switch (iOS)
- Glass / blur effect on iOS, dark fill on Android

---

## Definition of done

- [ ] Three tabs visible after login
- [ ] Active tab icon is `colors.secondary` (#E6BEAD)
- [ ] Active tab has pill background (`colors.secondaryContainer`)
- [ ] Inactive tabs are `colors.outline`
- [ ] Bottom bar has blur (iOS) or dark translucent fill (Android)
- [ ] Haptic feedback fires on tab press
- [ ] Tapping an unauthenticated deep link redirects to `/login`
- [ ] No TypeScript errors

---

## Do NOT build in this phase
- Any actual screen content
- Any data fetching
- Album detail
