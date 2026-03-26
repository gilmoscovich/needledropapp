// hooks/useSpotify.ts
// Wraps spotify service calls with auto-logout on 401.

import { useCallback } from 'react';
import { useSpotifyAuth } from './useSpotifyAuth';
import { SpotifyAuthError } from '@/services/spotify';
import * as spotifyService from '@/services/spotify';
import { SpotifyAlbum, SpotifyUser } from '@/types';

export function useSpotify() {
  const { token, logout, ready } = useSpotifyAuth();

  const handleError = useCallback(async (err: unknown) => {
    if (err instanceof SpotifyAuthError) {
      await logout();
      throw err;  // re-throw so caller knows what happened
    }
    throw err;
  }, [logout]);

  const getUserProfile = useCallback(async (): Promise<SpotifyUser> => {
    try {
      return await spotifyService.getUserProfile(token!);
    } catch (err) {
      return handleError(err) as never;
    }
  }, [token, handleError]);

  const searchAlbums = useCallback(async (query: string): Promise<SpotifyAlbum[]> => {
    try {
      return await spotifyService.searchAlbums(query, token!);
    } catch (err) {
      return handleError(err) as never;
    }
  }, [token, handleError]);

  const getMyAlbums = useCallback(async (): Promise<SpotifyAlbum[]> => {
    try {
      return await spotifyService.getMyAlbums(token!);
    } catch (err) {
      return handleError(err) as never;
    }
  }, [token, handleError]);

  const getAlbum = useCallback(async (albumId: string): Promise<SpotifyAlbum> => {
    try {
      return await spotifyService.getAlbum(albumId, token!);
    } catch (err) {
      return handleError(err) as never;
    }
  }, [token, handleError]);

  return { getUserProfile, searchAlbums, getMyAlbums, getAlbum, ready, logout };
}
