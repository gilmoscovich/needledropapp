// hooks/usePlayback.ts
// Wraps the playback service with loading state, toast callbacks,
// and auto-logout on token expiry.

import { useState, useCallback } from 'react';
import { Bookmark } from '@/types';
import { resumeBookmark } from '@/services/playback';
import { useSpotifyAuth } from './useSpotifyAuth';

export type PlaybackStatus =
  | 'idle'
  | 'starting'
  | 'opening_spotify'
  | 'retrying'
  | 'success'
  | 'error';

interface UsePlaybackReturn {
  resume:         (bookmark: Bookmark) => Promise<void>;
  loadingAlbumId: string | null;  // albumId currently being resumed
  status:         PlaybackStatus;
}

export function usePlayback(callbacks: {
  onSuccess?:        () => void;
  onOpeningSpotify?: () => void;
  onError?:          (message: string) => void;
  onExpired?:        () => void;
} = {}): UsePlaybackReturn {
  const { token, logout } = useSpotifyAuth();
  const [loadingAlbumId, setLoadingAlbumId] = useState<string | null>(null);
  const [status,         setStatus]         = useState<PlaybackStatus>('idle');

  const resume = useCallback(async (bookmark: Bookmark) => {
    if (loadingAlbumId || !token) return;

    setLoadingAlbumId(bookmark.albumId);
    setStatus('starting');

    const result = await resumeBookmark(bookmark, token, {
      onOpeningSpotify: () => {
        setStatus('opening_spotify');
        callbacks.onOpeningSpotify?.();
      },
      onRetrying: (attempt) => {
        setStatus('retrying');
        console.log(`[Playback] Retry attempt ${attempt}`);
      },
    });

    setLoadingAlbumId(null);

    switch (result) {
      case 'success':
        setStatus('success');
        callbacks.onSuccess?.();
        break;
      case 'expired':
        setStatus('idle');
        callbacks.onExpired?.();
        await logout();
        break;
      case 'no_device':
      case 'error':
        setStatus('error');
        callbacks.onError?.('Could not connect to Spotify');
        break;
    }
  }, [token, logout, loadingAlbumId, callbacks]);

  return { resume, loadingAlbumId, status };
}
