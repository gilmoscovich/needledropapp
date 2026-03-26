// services/spotify.ts
// All Spotify Web API calls.
// Every function takes a token — no global state.
// On 401: throws SpotifyAuthError so hooks can handle logout.
// On other errors: throws with a descriptive message.

import { SpotifyAlbum, SpotifyUser, Bookmark, PlaybackResult } from '@/types';

const BASE_URL = 'https://api.spotify.com/v1';

// ─── Custom error types ───────────────────────────────────────────────────────

export class SpotifyAuthError extends Error {
  constructor() {
    super('Spotify token expired or invalid');
    this.name = 'SpotifyAuthError';
  }
}

export class SpotifyNoDeviceError extends Error {
  constructor() {
    super('No active Spotify device');
    this.name = 'SpotifyNoDeviceError';
  }
}

// ─── Base fetch wrapper ───────────────────────────────────────────────────────

async function spotifyFetch<T>(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (res.status === 401) throw new SpotifyAuthError();
  if (res.status === 204) return undefined as T;  // success, no body

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`[${res.status}] ${body?.error?.message ?? 'Unknown error'}`);
  }

  return res.json() as Promise<T>;
}

// ─── User ─────────────────────────────────────────────────────────────────────

export async function getUserProfile(token: string): Promise<SpotifyUser> {
  return spotifyFetch<SpotifyUser>('/me', token);
}

// ─── Search ───────────────────────────────────────────────────────────────────

export async function searchAlbums(
  query: string,
  token: string
): Promise<SpotifyAlbum[]> {
  const q    = encodeURIComponent(query);
  const data = await spotifyFetch<{ albums: { items: SpotifyAlbum[] } }>(
    `/search?q=${q}&type=album`,
    token
  );
  return data.albums?.items ?? [];
}

// ─── Library ──────────────────────────────────────────────────────────────────

export async function getMyAlbums(token: string): Promise<SpotifyAlbum[]> {
  const data = await spotifyFetch<{
    items: { album: SpotifyAlbum }[];
  }>('/me/albums?limit=50', token);
  return (data.items ?? []).map(item => item.album);
}

// ─── Album detail ─────────────────────────────────────────────────────────────

export async function getAlbum(
  albumId: string,
  token: string
): Promise<SpotifyAlbum> {
  return spotifyFetch<SpotifyAlbum>(`/albums/${albumId}`, token);
}

// ─── Playback ─────────────────────────────────────────────────────────────────

export async function resumePlayback(
  bookmark: Bookmark,
  token: string
): Promise<PlaybackResult> {
  const position_ms = bookmark.timestamp
    ? timestampToMs(bookmark.timestamp)
    : 0;

  try {
    await spotifyFetch('/me/player/play', token, {
      method: 'PUT',
      body: JSON.stringify({
        context_uri: bookmark.albumUri,
        offset:      { position: bookmark.trackIndex },
        position_ms,
      }),
    });
    return 'success';
  } catch (err) {
    if (err instanceof SpotifyAuthError) return 'expired';
    if (err instanceof Error && err.message.startsWith('[404]')) return 'no_device';
    return 'error';
  }
}

// ─── Timestamp utilities ──────────────────────────────────────────────────────

/**
 * Convert mm:ss or h:mm:ss string to milliseconds.
 * "2:34"    → 154000
 * "1:04:22" → 3862000
 */
export function timestampToMs(ts: string): number {
  const parts = ts.split(':').map(Number);
  if (parts.some(isNaN)) return 0;

  if (parts.length === 2) {
    const [m, s] = parts;
    return (m * 60 + s) * 1000;
  }
  if (parts.length === 3) {
    const [h, m, s] = parts;
    return (h * 3600 + m * 60 + s) * 1000;
  }
  return 0;
}

/**
 * Convert milliseconds to m:ss string.
 * 154000 → "2:34"
 */
export function msToTimestamp(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Validate a timestamp string is in mm:ss or h:mm:ss format.
 * Returns true if valid.
 */
export function isValidTimestamp(ts: string): boolean {
  if (!ts.trim()) return true;  // empty is valid (means no timestamp)
  const regex = /^(\d+):([0-5]\d)(?::([0-5]\d))?$/;
  return regex.test(ts.trim());
}
