import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import styles from './NotesPanel.module.css';

interface Props {
  currentPage: number;
  notes: Record<number, string>;
  onSaveNote: (page: number, content: string) => void;
  onJumpToPage: (page: number) => void;
}

export default function NotesPanel({ currentPage, notes, onSaveNote, onJumpToPage }: Props) {
  const [currentText, setCurrentText] = useState('');

  useEffect(() => {
    setCurrentText(notes[currentPage] || '');
  }, [currentPage, notes]);

  const handleSave = () => {
    onSaveNote(currentPage, currentText);
  };

  const pagesWithNotes = Object.keys(notes).map(Number).sort((a, b) => a - b);

  return (
    <div className={styles.panel}>
      <div className={styles.editor}>
        <h4>Nota para la página {currentPage}</h4>
        <textarea
          className={styles.textarea}
          value={currentText}
          onChange={e => setCurrentText(e.target.value)}
          placeholder="Escribe tus notas aquí..."
        />
        <button className={styles.saveBtn} onClick={handleSave}>
          Guardar Nota
        </button>
      </div>
      
      <div className={styles.list}>
        <h4>Todas las notas</h4>
        {pagesWithNotes.length === 0 ? (
          <p className={styles.empty}>No hay notas en este documento.</p>
        ) : (
          pagesWithNotes.map(page => (
            <div key={page} className={styles.noteItem}>
              <div className={styles.noteHeader}>
                <span className={styles.notePage}>Página {page}</span>
                <button className={styles.jumpBtn} onClick={() => onJumpToPage(page)}>Ir <ArrowRight size={12} /></button>
              </div>
              <p className={styles.notePreview}>{notes[page]}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
