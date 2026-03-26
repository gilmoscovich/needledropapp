// hooks/useCurrentlyPlaying.ts
// Phase 4 version — handles the recently-played edge case by fetching
// the full album (with tracks.items) via getAlbum() when needsFullAlbum is true.

import { useState, useCallback } from 'react';
import { msToTimestamp } from '@/services/spotify';
import { getAlbum } from '@/services/spotify';
import { useSpotifyAuth } from './useSpotifyAuth';
import { SpotifyAuthError } from '@/services/spotify';

export interface CurrentTrackInfo {
  trackUri:       string;
  trackName:      string;
  trackNum:       number;
  trackIndex:     number;      // 0-based, resolved — safe to use directly in Bookmark
  albumId:        string;
  albumName:      string;
  albumUri:       string;
  artist:         string;
  art:            string;
  progressMs:     number;
  timestamp:      string;      // pre-formatted "m:ss" — empty string if from recently-played
  isPlaying:      boolean;     // false = came from recently-played fallback
  needsFullAlbum: boolean;     // always false by Phase 4 — resolved before returning
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

  // currently-playing returns full track object — trackIndex = track_number - 1
  const trackIndex = Math.max((track.track_number ?? 1) - 1, 0);

  return {
    trackUri:       track.uri,
    trackName:      track.name,
    trackNum:       track.track_number,
    trackIndex,
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
    trackIndex:     Math.max((track.track_number ?? 1) - 1, 0), // placeholder — resolved below
    albumId:        album.id,
    albumName:      album.name,
    albumUri:       album.uri,
    artist:         album.artists?.map((a: any) => a.name).join(', ') ?? '',
    art:            album.images?.[0]?.url ?? '',
    progressMs:     0,
    timestamp:      '',
    isPlaying:      false,
    needsFullAlbum: true,
  };
}

/**
 * Resolve the correct trackIndex for recently-played tracks.
 * The recently-played endpoint returns a simplified album without tracks.items,
 * so we fetch the full album and find the track by URI.
 */
async function resolveTrackIndex(
  trackUri: string,
  albumId: string,
  token: string,
  fallback: number
): Promise<number> {
  try {
    const fullAlbum = await getAlbum(albumId, token);
    const index = fullAlbum.tracks.items.findIndex(t => t.uri === trackUri);
    return index >= 0 ? index : fallback;
  } catch {
    return fallback;
  }
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
      if (!recent) {
        setTrackInfo(null);
        return null;
      }

      // Resolve the real trackIndex via full album fetch
      const resolvedIndex = await resolveTrackIndex(
        recent.trackUri,
        recent.albumId,
        token,
        recent.trackIndex
      );

      const resolved: CurrentTrackInfo = {
        ...recent,
        trackIndex:     resolvedIndex,
        needsFullAlbum: false,   // resolved — safe to use
      };

      setTrackInfo(resolved);
      return resolved;

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
