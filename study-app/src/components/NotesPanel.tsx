import { useState } from 'react';
import { ArrowRight, Quote, X, Trash2 } from 'lucide-react';
import type { NoteItem, NotesMap } from '../utils/db';
import styles from './NotesPanel.module.css';

interface Props {
  currentPage: number;
  notes: NotesMap;
  onAddNote: (page: number, text: string, selectedText?: string) => void;
  onDeleteNote: (page: number, noteId: string) => void;
  onJumpToPage: (page: number) => void;
  lastSelection?: string;
  onClearSelection?: () => void;
}

export default function NotesPanel({ currentPage, notes, onAddNote, onDeleteNote, onJumpToPage, lastSelection, onClearSelection }: Props) {
  const [text, setText] = useState('');

  const handleAdd = () => {
    if (!text.trim()) return;
    onAddNote(currentPage, text, lastSelection || undefined);
    setText('');
    onClearSelection?.();
  };

  const handleSelectionClick = (note: NoteItem & { page: number }) => {
    onJumpToPage(note.page);
    if (note.selectedText) {
      setTimeout(() => {
        window.getSelection()?.removeAllRanges();
        window.find(note.selectedText!, false, false, true);
      }, 300);
    }
  };

  const allNotes = Object.entries(notes)
    .flatMap(([p, arr]) => arr.map(n => ({ ...n, page: Number(p) })))
    .sort((a, b) => a.page - b.page || a.createdAt - b.createdAt);

  return (
    <div className={styles.panel}>
      <div className={styles.editor}>
        <h4>Nueva nota · Página {currentPage}</h4>

        {lastSelection && (
          <div className={styles.selectionBadge}>
            <Quote size={12} className={styles.quoteIcon} />
            <span className={styles.selectionText}>{lastSelection}</span>
            <button className={styles.selectionDismiss} onClick={onClearSelection} title="Quitar selección">
              <X size={12} />
            </button>
          </div>
        )}

        <textarea
          className={styles.textarea}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Escribe tu nota aquí..."
          onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAdd(); }}
        />
        <button className={styles.saveBtn} onClick={handleAdd} disabled={!text.trim()}>
          Agregar
        </button>
      </div>

      <div className={styles.list}>
        <h4>Todas las notas</h4>
        {allNotes.length === 0 ? (
          <p className={styles.empty}>No hay notas en este documento.</p>
        ) : (
          allNotes.map(note => (
            <div key={note.id} className={styles.noteItem}>
              <div className={styles.noteHeader}>
                <span className={styles.notePage}>Página {note.page}</span>
                <div className={styles.noteActions}>
                  <button className={styles.jumpBtn} onClick={() => onJumpToPage(note.page)}>
                    Ir <ArrowRight size={12} />
                  </button>
                  <button className={styles.deleteBtn} onClick={() => onDeleteNote(note.page, note.id)} title="Eliminar nota">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              {note.selectedText && (
                <div
                  className={styles.noteQuote}
                  onClick={() => handleSelectionClick(note)}
                  title="Ir al texto seleccionado"
                >
                  <Quote size={10} className={styles.quoteIcon} />
                  <span>{note.selectedText}</span>
                </div>
              )}
              <p className={styles.notePreview}>{note.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
