// contexts/BookmarksContext.tsx
// Single shared bookmarks state for the whole app.
// Replaces per-component useBookmarks() instances so saves are
// immediately visible everywhere without needing a reload.

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Bookmark } from '@/types';
import * as bookmarkService from '@/services/bookmarks';
import { isValidTimestamp } from '@/services/spotify';

interface BookmarksContextValue {
  bookmarks:            Bookmark[];
  bookmarkCount:        number;
  loading:              boolean;
  saveBookmark:         (bookmark: Bookmark) => Promise<void>;
  deleteBookmark:          (trackUri: string) => Promise<void>;
  deleteBookmarksForAlbum: (albumId: string) => Promise<void>;
  getBookmark:          (albumId: string) => Bookmark | undefined;
  getBookmarksForAlbum: (albumId: string) => Bookmark[];
  isBookmarked:         (albumId: string) => boolean;
}

const BookmarksContext = createContext<BookmarksContextValue | null>(null);

export function BookmarksProvider({ children }: { children: ReactNode }) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    bookmarkService.loadBookmarks().then(bks => {
      setBookmarks(bks);
      setLoading(false);
    });
  }, []);

  const saveBookmark = useCallback(async (bookmark: Bookmark): Promise<void> => {
    if (bookmark.timestamp && !isValidTimestamp(bookmark.timestamp)) {
      throw new Error('Invalid timestamp format. Use mm:ss or h:mm:ss.');
    }
    const updated = await bookmarkService.saveBookmark(bookmark);
    setBookmarks(updated);
  }, []);

  const deleteBookmark = useCallback(async (trackUri: string): Promise<void> => {
    const updated = await bookmarkService.deleteBookmark(trackUri);
    setBookmarks(updated);
  }, []);

  const deleteBookmarksForAlbum = useCallback(async (albumId: string): Promise<void> => {
    const updated = await bookmarkService.deleteBookmarksForAlbum(albumId);
    setBookmarks(updated);
  }, []);

  const getBookmark = useCallback(
    (albumId: string) => bookmarks.find(b => b.albumId === albumId),
    [bookmarks]
  );

  const getBookmarksForAlbum = useCallback(
    (albumId: string) => bookmarks.filter(b => b.albumId === albumId),
    [bookmarks]
  );

  const isBookmarked = useCallback(
    (albumId: string) => bookmarks.some(b => b.albumId === albumId),
    [bookmarks]
  );

  return (
    <BookmarksContext.Provider value={{
      bookmarks,
      bookmarkCount: bookmarks.length,
      loading,
      saveBookmark,
      deleteBookmark,
      deleteBookmarksForAlbum,
      getBookmark,
      getBookmarksForAlbum,
      isBookmarked,
    }}>
      {children}
    </BookmarksContext.Provider>
  );
}

export function useBookmarks(): BookmarksContextValue {
  const ctx = useContext(BookmarksContext);
  if (!ctx) throw new Error('useBookmarks must be used inside BookmarksProvider');
  return ctx;
}
