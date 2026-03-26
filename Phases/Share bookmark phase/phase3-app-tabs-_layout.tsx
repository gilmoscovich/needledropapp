// app/(tabs)/_layout.tsx
// Tab navigator with our custom bottom nav.
// Redirects to login if the user isn't authenticated.
// NowPlayingFAB floats above all tab screens.

import { useEffect } from 'react';
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { useRouter } from 'expo-router';
import { useSpotifyAuth } from '@/hooks/useSpotifyAuth';
import { BottomNav } from '@/components/BottomNav';
import { NowPlayingFAB } from '@/components/NowPlayingFAB';

export default function TabLayout() {
  const { isAuthenticated, ready } = useSpotifyAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !isAuthenticated) {
      router.replace('/login');
    }
  }, [ready, isAuthenticated]);

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        tabBar={props => <BottomNav {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="library"   options={{ title: 'Library'   }} />
        <Tabs.Screen name="bookmarks" options={{ title: 'Bookmarks' }} />
        <Tabs.Screen name="search"    options={{ title: 'Search'    }} />
      </Tabs>

      {/* FAB floats above all tab screens */}
      <NowPlayingFAB />
    </View>
  );
}
