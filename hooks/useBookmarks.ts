// hooks/useBookmarks.ts
// React state wrapper around services/bookmarks.ts.
// Loads bookmarks on mount, exposes reactive state + actions.

import { useState, useEffect, useCallback } from 'react';
import { Bookmark } from '@/types';
import * as bookmarkService from '@/services/bookmarks';
import { isValidTimestamp } from '@/services/spotify';

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading,   setLoading]   = useState(true);

  // Load on mount
  useEffect(() => {
    bookmarkService.loadBookmarks().then(bks => {
      setBookmarks(bks);
      setLoading(false);
    });
  }, []);

  // Save (create or update)
  const saveBookmark = useCallback(async (bookmark: Bookmark): Promise<void> => {
    // Validate timestamp before saving
    if (bookmark.timestamp && !isValidTimestamp(bookmark.timestamp)) {
      throw new Error('Invalid timestamp format. Use mm:ss or h:mm:ss.');
    }
    const updated = await bookmarkService.saveBookmark(bookmark);
    setBookmarks(updated);
  }, []);

  // Delete by trackUri
  const deleteBookmark = useCallback(async (trackUri: string): Promise<void> => {
    const updated = await bookmarkService.deleteBookmark(trackUri);
    setBookmarks(updated);
  }, []);

  // Get most recent bookmark for an album (for AlbumCard / play)
  const getBookmark = useCallback(
    (albumId: string): Bookmark | undefined =>
      bookmarks.find(b => b.albumId === albumId),
    [bookmarks]
  );

  // Get all bookmarks for an album
  const getBookmarksForAlbum = useCallback(
    (albumId: string): Bookmark[] =>
      bookmarks.filter(b => b.albumId === albumId),
    [bookmarks]
  );

  // Check if an album has any bookmark
  const isBookmarked = useCallback(
    (albumId: string): boolean =>
      bookmarks.some(b => b.albumId === albumId),
    [bookmarks]
  );

  return {
    bookmarks,
    bookmarkCount: bookmarks.length,
    loading,
    saveBookmark,
    deleteBookmark,
    getBookmark,
    getBookmarksForAlbum,
    isBookmarked,
  };
}
