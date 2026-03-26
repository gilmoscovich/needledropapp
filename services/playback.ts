// services/playback.ts
// Handles resuming a bookmarked album in Spotify.
// Retry logic for when no device is active.
// Opens Spotify via deep link as fallback.

import * as Linking from 'expo-linking';
import { Bookmark, PlaybackResult } from '@/types';
import { resumePlayback as spotifyResume } from '@/services/spotify';

const MAX_RETRIES    = 5;
const RETRY_DELAY_MS = 2000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function extractTrackId(trackUri: string): string {
  // "spotify:track:4iV5W9uYEdYUVa79Axb7Rh" → "4iV5W9uYEdYUVa79Axb7Rh"
  return trackUri.split(':')[2] ?? '';
}

async function openSpotify(bookmark: Bookmark): Promise<void> {
  const trackId = extractTrackId(bookmark.trackUri);
  const deepLink = trackId ? `spotify:track:${trackId}` : 'spotify://';
  // Skip canOpenURL — it requires LSApplicationQueriesSchemes which isn't
  // available in Expo Go. openURL works regardless.
  await Linking.openURL(deepLink).catch(() => {
    throw new Error('Spotify is not installed on this device');
  });
}

// ─── Retry loop ───────────────────────────────────────────────────────────────

async function retryPlayback(
  bookmark: Bookmark,
  token: string,
  onAttempt?: (attempt: number) => void
): Promise<PlaybackResult> {
  for (let i = 0; i < MAX_RETRIES; i++) {
    await delay(RETRY_DELAY_MS);
    onAttempt?.(i + 1);
    const result = await spotifyResume(bookmark, token);
    if (result === 'success') return 'success';
    if (result === 'expired') return 'expired';
    // 'no_device' or 'error' — keep retrying
  }
  return 'error';
}

// ─── Main resume function ─────────────────────────────────────────────────────

export interface ResumeOptions {
  onOpeningSpotify?: () => void;
  onRetrying?:       (attempt: number) => void;
}

export async function resumeBookmark(
  bookmark: Bookmark,
  token: string,
  options: ResumeOptions = {}
): Promise<PlaybackResult> {
  // First attempt
  const firstResult = await spotifyResume(bookmark, token);

  if (firstResult === 'success') return 'success';
  if (firstResult === 'expired') return 'expired';
  if (firstResult === 'error')   return 'error';

  // No active device — open Spotify and retry
  try {
    options.onOpeningSpotify?.();
    await openSpotify(bookmark);
  } catch {
    // Spotify not installed
    return 'error';
  }

  return retryPlayback(bookmark, token, options.onRetrying);
}
