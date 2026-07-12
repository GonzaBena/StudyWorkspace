import { useState, useEffect, useCallback } from 'react';
import { loadNotes, saveNotes, type NotesMap, type NoteItem } from '../utils/db';

export type { NoteItem };

function makeId() { return Math.random().toString(36).slice(2, 10); }

export function useNotes(fileId: string | undefined) {
  const [notes, setNotes] = useState<NotesMap>({});

  useEffect(() => {
    if (!fileId) { setNotes({}); return; }
    loadNotes(fileId).then(raw => {
      if (!raw) { setNotes({}); return; }
      // Migrate old string-per-page format to NoteItem[]
      const migrated: NotesMap = {};
      for (const [k, v] of Object.entries(raw)) {
        const page = Number(k);
        if (typeof v === 'string') {
          migrated[page] = (v as string).trim()
            ? [{ id: makeId(), text: v as string, createdAt: 0 }]
            : [];
        } else {
          migrated[page] = v as NoteItem[];
        }
      }
      setNotes(migrated);
    });
  }, [fileId]);

  const addNote = useCallback((page: number, text: string, selectedText?: string) => {
    if (!fileId || !text.trim()) return;
    setNotes(prev => {
      const item: NoteItem = {
        id: makeId(),
        text: text.trim(),
        selectedText: selectedText?.trim() || undefined,
        createdAt: Date.now(),
      };
      const updated = { ...prev, [page]: [...(prev[page] ?? []), item] };
      saveNotes(fileId, updated);
      return updated;
    });
  }, [fileId]);

  const deleteNote = useCallback((page: number, noteId: string) => {
    if (!fileId) return;
    setNotes(prev => {
      const remaining = (prev[page] ?? []).filter(n => n.id !== noteId);
      const updated = { ...prev };
      if (remaining.length) updated[page] = remaining; else delete updated[page];
      saveNotes(fileId, updated);
      return updated;
    });
  }, [fileId]);

  const editNote = useCallback((page: number, noteId: string, newText: string) => {
    if (!fileId || !newText.trim()) return;
    setNotes(prev => {
      const updated = {
        ...prev,
        [page]: (prev[page] ?? []).map(n => n.id === noteId ? { ...n, text: newText.trim() } : n),
      };
      saveNotes(fileId, updated);
      return updated;
    });
  }, [fileId]);

  return { notes, addNote, deleteNote, editNote };
}
