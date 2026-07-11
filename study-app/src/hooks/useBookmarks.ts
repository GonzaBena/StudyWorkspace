import { useState, useEffect, useCallback } from 'react';
import { loadBookmarks, saveBookmarks } from '../utils/db';

export function useBookmarks(fileId: string | undefined) {
  const [bookmarks, setBookmarks] = useState<number[]>([]);

  useEffect(() => {
    if (!fileId) { setBookmarks([]); return; }
    loadBookmarks(fileId).then(data => setBookmarks(data || []));
  }, [fileId]);

  const toggleBookmark = useCallback((page: number) => {
    if (!fileId) return;
    setBookmarks(prev => {
      const next = prev.includes(page)
        ? prev.filter(p => p !== page)
        : [...prev, page].sort((a, b) => a - b);
      saveBookmarks(fileId, next);
      return next;
    });
  }, [fileId]);

  return { bookmarks, toggleBookmark };
}
