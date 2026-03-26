// app/index.tsx
import { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSpotifyAuth } from '@/hooks/useSpotifyAuth';
import { colors } from '@/constants/theme';

export default function Index() {
  const { isAuthenticated, ready } = useSpotifyAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (isAuthenticated) {
      router.replace('/(tabs)/library');
    } else {
      router.replace('/login');
    }
  }, [ready, isAuthenticated]);

  // Show nothing while deciding — splash screen is still visible
  return <View style={{ flex: 1, backgroundColor: colors.background }} />;
}
