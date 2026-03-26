// services/bookmarks.ts
// Pure AsyncStorage operations — no React, no state.
// The hook (useBookmarks) wraps this with state management.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Bookmark } from '@/types';

const STORAGE_KEY = 'nd_bookmarks';

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function loadBookmarks(): Promise<Bookmark[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Bookmark[];
  } catch {
    return [];
  }
}

// ─── Write ────────────────────────────────────────────────────────────────────

export async function persistBookmarks(bookmarks: Bookmark[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
}

// ─── Save (upsert) ────────────────────────────────────────────────────────────

/**
 * Save a bookmark. If one already exists for the same albumId, replace it.
 * Returns the new full list, sorted by savedAt descending.
 */
export async function saveBookmark(bookmark: Bookmark): Promise<Bookmark[]> {
  const existing = await loadBookmarks();
  const filtered = existing.filter(b => b.trackUri !== bookmark.trackUri);
  const updated  = [bookmark, ...filtered].sort((a, b) => b.savedAt - a.savedAt);
  await persistBookmarks(updated);
  return updated;
}

// ─── Delete ───────────────────────────────────────────────────────────────────

/**
 * Delete the bookmark for a given trackUri.
 * Returns the new full list.
 */
export async function deleteBookmark(trackUri: string): Promise<Bookmark[]> {
  const existing = await loadBookmarks();
  const updated  = existing.filter(b => b.trackUri !== trackUri);
  await persistBookmarks(updated);
  return updated;
}

// ─── Query ────────────────────────────────────────────────────────────────────

export async function getBookmarkByAlbumId(
  albumId: string
): Promise<Bookmark | undefined> {
  const bookmarks = await loadBookmarks();
  return bookmarks.find(b => b.albumId === albumId);
}

// ─── Clear all (for dev/testing) ──────────────────────────────────────────────

export async function clearAllBookmarks(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
