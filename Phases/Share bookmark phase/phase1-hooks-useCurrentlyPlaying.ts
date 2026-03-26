// hooks/useCurrentlyPlaying.ts
import { useState, useCallback } from 'react';
import { msToTimestamp } from '@/services/spotify';
import { useSpotifyAuth } from './useSpotifyAuth';
import { SpotifyAuthError } from '@/services/spotify';

export interface CurrentTrackInfo {
  trackUri:       string;
  trackName:      string;
  trackNum:       number;
  albumId:        string;
  albumName:      string;
  albumUri:       string;
  artist:         string;
  art:            string;
  progressMs:     number;
  timestamp:      string;      // pre-formatted "m:ss" — empty string if from recently-played
  isPlaying:      boolean;     // false = came from recently-played fallback
  needsFullAlbum: boolean;     // true = recently-played, needs extra getAlbum() call in Phase 4
}

async function fetchCurrentlyPlaying(token: string): Promise<CurrentTrackInfo | null> {
  const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) throw new SpotifyAuthError();
  if (res.status === 204 || res.status === 404) return null;

  const data = await res.json();
  if (!data?.item) return null;

  const track = data.item;
  const album = track.album;

  return {
    trackUri:       track.uri,
    trackName:      track.name,
    trackNum:       track.track_number,
    albumId:        album.id,
    albumName:      album.name,
    albumUri:       album.uri,
    artist:         album.artists?.map((a: any) => a.name).join(', ') ?? '',
    art:            album.images?.[0]?.url ?? '',
    progressMs:     data.progress_ms ?? 0,
    timestamp:      msToTimestamp(data.progress_ms ?? 0),
    isPlaying:      data.is_playing,
    needsFullAlbum: false,
  };
}

async function fetchRecentlyPlayed(token: string): Promise<CurrentTrackInfo | null> {
  const res = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=1', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) throw new SpotifyAuthError();
  if (!res.ok) return null;

  const data = await res.json();
  const item = data?.items?.[0];
  if (!item) return null;

  const track = item.track;
  const album = track.album;

  return {
    trackUri:       track.uri,
    trackName:      track.name,
    trackNum:       track.track_number,
    albumId:        album.id,
    albumName:      album.name,
    albumUri:       album.uri,
    artist:         album.artists?.map((a: any) => a.name).join(', ') ?? '',
    art:            album.images?.[0]?.url ?? '',
    progressMs:     0,
    timestamp:      '',
    isPlaying:      false,
    needsFullAlbum: true,   // recently-played returns simplified album — no tracks.items
  };
}

export function useCurrentlyPlaying() {
  const { token, logout } = useSpotifyAuth();
  const [trackInfo, setTrackInfo] = useState<CurrentTrackInfo | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const fetchNowPlaying = useCallback(async (): Promise<CurrentTrackInfo | null> => {
    if (!token) return null;

    setLoading(true);
    setError(null);

    try {
      // Try currently playing first
      const current = await fetchCurrentlyPlaying(token);
      if (current) {
        setTrackInfo(current);
        return current;
      }

      // Fall back to recently played
      const recent = await fetchRecentlyPlayed(token);
      setTrackInfo(recent);
      return recent;

    } catch (err) {
      if (err instanceof SpotifyAuthError) await logout();
      setError('Could not fetch track info');
      setTrackInfo(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [token, logout]);

  return { fetchNowPlaying, trackInfo, loading, error };
}
