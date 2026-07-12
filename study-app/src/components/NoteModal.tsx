import { useState, useEffect, useRef } from 'react';
import { Quote, X } from 'lucide-react';
import type { NoteItem } from '../utils/db';
import styles from './NoteModal.module.css';

interface Props {
  note: NoteItem & { page: number };
  onSave: (page: number, noteId: string, newText: string) => void;
  onClose: () => void;
}

export default function NoteModal({ note, onSave, onClose }: Props) {
  const [text, setText] = useState(note.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
    textareaRef.current?.select();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSave = () => {
    if (text.trim()) {
      onSave(note.page, note.id, text);
    }
    onClose();
  };

  return (
    <div className={styles.backdrop} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modal} role="dialog" aria-modal="true">
        <div className={styles.header}>
          <span className={styles.pageLabel}>Nota · Página {note.page}</span>
          <button className={styles.closeBtn} onClick={onClose} title="Cerrar">
            <X size={16} />
          </button>
        </div>

        {note.selectedText && (
          <div className={styles.quoteBlock}>
            <Quote size={14} className={styles.quoteIcon} />
            <p className={styles.quoteText}>{note.selectedText}</p>
          </div>
        )}

        <textarea
          ref={textareaRef}
          className={styles.textarea}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSave(); }}
          rows={5}
        />

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancelar</button>
          <button className={styles.saveBtn} onClick={handleSave} disabled={!text.trim()}>Guardar</button>
        </div>
      </div>
    </div>
  );
}
