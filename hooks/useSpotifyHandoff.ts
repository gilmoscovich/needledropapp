// hooks/useSpotifyHandoff.ts
// Detects when the user returns to NeedleDrop from Spotify (background → active)
// and fires onHandoff with the currently/recently playing track.

import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useCurrentlyPlaying, CurrentTrackInfo } from './useCurrentlyPlaying';

const MIN_BACKGROUND_MS = 2000; // ignore rapid flips shorter than this

interface UseSpotifyHandoffOptions {
  onHandoff: (info: CurrentTrackInfo) => void;
}

export function useSpotifyHandoff({ onHandoff }: UseSpotifyHandoffOptions) {
  const { fetchNowPlaying } = useCurrentlyPlaying();

  const previousState  = useRef<AppStateStatus>(AppState.currentState);
  const backgroundedAt = useRef<number | null>(null);
  const isChecking     = useRef(false);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextState: AppStateStatus) => {
      const prev = previousState.current;

      // Record when we go to background
      if (nextState === 'background' || nextState === 'inactive') {
        backgroundedAt.current = Date.now();
      }

      // Act only on background/inactive → active transitions
      if (nextState === 'active' && (prev === 'background' || prev === 'inactive')) {
        const elapsed = backgroundedAt.current !== null
          ? Date.now() - backgroundedAt.current
          : 0;

        // Skip rapid flips and concurrent checks
        if (elapsed < MIN_BACKGROUND_MS || isChecking.current) {
          previousState.current = nextState;
          return;
        }

        isChecking.current = true;
        try {
          const info = await fetchNowPlaying();
          if (info) onHandoff(info);
        } finally {
          isChecking.current = false;
        }
      }

      previousState.current = nextState;
    });

    return () => subscription.remove();
  }, [fetchNowPlaying, onHandoff]);
}
