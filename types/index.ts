// types/index.ts

export interface SpotifyTrack {
  uri: string;
  name: string;
  duration_ms: number;
  track_number: number;
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  uri: string;
  artists: { name: string }[];
  images: { url: string; width: number; height: number }[];
  tracks: {
    items: SpotifyTrack[];
  };
}

export interface SpotifyUser {
  id: string;
  display_name: string;
  images: { url: string }[];
}

export interface Bookmark {
  albumId: string;
  albumName: string;
  artist: string;
  art: string;
  albumUri: string;
  trackUri: string;
  trackName: string;
  trackIndex: number;   // 0-based position in album
  trackNum: number;     // 1-based display number
  timestamp: string | null;  // "mm:ss" or "h:mm:ss" format
  savedAt: number;      // Date.now()
}

export type PlaybackResult = 'success' | 'no_device' | 'expired' | 'error';

export type ToastType = 'success' | 'error' | 'default';
