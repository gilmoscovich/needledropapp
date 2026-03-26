// app/index.tsx — TEMPORARY full backend test
import { View, Text, Button, ScrollView } from 'react-native';
import { useSpotifyAuth } from '@/hooks/useSpotifyAuth';
import { useSpotify } from '@/hooks/useSpotify';
import { useBookmarks } from '@/hooks/useBookmarks';
import { usePlayback } from '@/hooks/usePlayback';
import { useToast } from '@/hooks/useToast';
import { resumeBookmark } from '@/services/playback';
import { useState } from 'react';

export default function Index() {
  const { token, login, logout, isAuthenticated } = useSpotifyAuth();
  const { searchAlbums, getAlbum } = useSpotify();
  const { bookmarks, saveBookmark } = useBookmarks();
  const { toast, showToast } = useToast();
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) => setLog(p => [msg, ...p.slice(0, 9)]);

  const { resume, loadingAlbumId, status } = usePlayback({
    onSuccess:        () => { showToast('Now playing!', 'success'); addLog('Playback started'); },
    onOpeningSpotify: () => { showToast('Opening Spotify…', 'default'); addLog('Opening Spotify...'); },
    onError:          (m) => { showToast(m, 'error'); addLog(`Error: ${m}`); },
    onExpired:        () => { showToast('Session expired', 'error'); addLog('Token expired — logged out'); },
  });

  const testFullFlow = async () => {
    if (!isAuthenticated) return;
    try {
      // 1. Search for an album
      addLog('Searching...');
      const albums = await searchAlbums('radiohead ok computer');
      const album  = albums[0];
      if (!album) { addLog('No albums found'); return; }

      // 2. Get full album with tracks
      const full = await getAlbum(album.id);
      addLog(`Found: ${full.name} — ${full.tracks.items.length} tracks`);

      // 3. Save a bookmark at track 2, timestamp 1:30
      await saveBookmark({
        albumId:    full.id,
        albumName:  full.name,
        artist:     full.artists.map(a => a.name).join(', '),
        art:        full.images[0]?.url ?? '',
        albumUri:   full.uri,
        trackUri:   full.tracks.items[1].uri,
        trackName:  full.tracks.items[1].name,
        trackIndex: 1,
        trackNum:   2,
        timestamp:  '1:30',
        savedAt:    Date.now(),
      });
      addLog(`Saved bookmark: Track 2 at 1:30`);
    } catch (e: any) {
      addLog(`Error: ${e.message}`);
    }
  };

  const testPlayback = async () => {
    const bm = bookmarks[0];
    if (!bm) { addLog('No bookmarks — run full flow first'); return; }
    try {
      addLog(`Resuming: ${bm.trackName} @ ${bm.timestamp}`);
      const result = await resumeBookmark(bm, token!, {
        onOpeningSpotify: () => addLog('Opening Spotify...'),
        onRetrying: (n) => addLog(`Retry attempt ${n}...`),
      });
      addLog(`Result: ${result}`);
    } catch (e: any) {
      addLog(`Raw error: ${e.message}`);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#131313', padding: 20, paddingTop: 60 }}>
      <Text style={{ color: '#cec5ba', fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
        Backend Test
      </Text>

      {!isAuthenticated
        ? <Button title="Login with Spotify" onPress={login} />
        : <>
            <Button title="Logout" onPress={logout} />
            <View style={{ height: 12 }} />
            <Button title="1. Full flow (search → bookmark)" onPress={testFullFlow} />
            <View style={{ height: 8 }} />
            <Button title="2. Resume first bookmark in Spotify" onPress={testPlayback} />
          </>
      }

      <Text style={{ color: '#9c8e88', marginTop: 20, fontSize: 12 }}>
        Token: {token ? token.substring(0, 20) + '...' : 'none'}
      </Text>
      <Text style={{ color: '#9c8e88', fontSize: 12 }}>
        Status: {status} | Loading: {loadingAlbumId ?? 'none'}
      </Text>
      <Text style={{ color: '#9c8e88', fontSize: 12 }}>
        Bookmarks saved: {bookmarks.length}
      </Text>

      {toast && (
        <View style={{
          marginTop: 16, padding: 12, backgroundColor: '#353534',
          borderRadius: 20, alignItems: 'center',
        }}>
          <Text style={{ color: toast.type === 'success' ? '#e6bead' : '#e5e2e1' }}>
            {toast.message}
          </Text>
        </View>
      )}

      {log.map((l, i) => (
        <Text key={i} style={{ color: '#9c8e88', fontSize: 11, marginTop: 6 }}>{l}</Text>
      ))}
    </ScrollView>
  );
}
