import { useState, useEffect, useCallback } from 'react';
import { loadNotes, saveNotes, type NotesMap } from '../utils/db';

export function useNotes(fileId: string | undefined) {
  const [notes, setNotes] = useState<NotesMap>({});

  useEffect(() => {
    if (!fileId) {
      setNotes({});
      return;
    }
    loadNotes(fileId).then(data => {
      setNotes(data || {});
    });
  }, [fileId]);

  const saveNote = useCallback((page: number, content: string) => {
    if (!fileId) return;
    setNotes(prev => {
      const next = { ...prev };
      if (!content.trim()) {
        delete next[page];
      } else {
        next[page] = content;
      }
      saveNotes(fileId, next);
      return next;
    });
  }, [fileId]);

  return { notes, saveNote };
}
