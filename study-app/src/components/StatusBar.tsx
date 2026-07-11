import { useState } from 'react';
import styles from './StatusBar.module.css';
import { progressColor } from '../utils/colors';
import PomodoroTimer from './PomodoroTimer';

interface Props {
  docProgress: number;      // 0–1
  listProgress: number;     // 0–1
  currentFileName: string;
  fileIndex: number;
  totalFiles: number;
  sessionName: string;
  onRenameSession: (name: string) => void;
  onClose: () => void;
}

export default function StatusBar({ docProgress, listProgress, currentFileName, fileIndex, totalFiles, sessionName, onRenameSession, onClose }: Props) {
  const docPct = Math.round(docProgress * 100);
  const listPct = Math.round(listProgress * 100);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(sessionName);

  const handleSave = () => {
    setIsEditing(false);
    if (editName.trim() && editName.trim() !== sessionName) {
      onRenameSession(editName.trim());
    }
  };

  return (
    <header className={styles.bar}>
      <div className={styles.info}>
        {isEditing ? (
          <input
            autoFocus
            className={styles.nameInput}
            value={editName}
            onChange={e => setEditName(e.target.value)}
            onBlur={handleSave}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
          />
        ) : (
          <div className={styles.filenameContainer}>
            <span
              className={styles.sessionName}
              title="Doble clic para renombrar sesión"
              onDoubleClick={() => { setEditName(sessionName); setIsEditing(true); }}
            >
              {sessionName}
            </span>
            <span className={styles.filename} title={currentFileName}>({currentFileName})</span>
          </div>
        )}
        <span className={styles.counter}>{fileIndex + 1} / {totalFiles}</span>
      </div>
      <PomodoroTimer />
      <div className={styles.bars}>
        <div className={styles.track} title={`Documento: ${docPct}%`}>
          <div
            className={styles.fill}
            style={{ width: `${docPct}%`, background: progressColor(docPct) }}
          />
        </div>
        <div className={styles.track} title={`Lista: ${listPct}%`}>
          <div
            className={styles.fill}
            style={{ width: `${listPct}%`, background: progressColor(listPct) }}
          />
        </div>
        <div className={styles.percentages}>
          <span style={{ color: progressColor(docPct) }}>{docPct}%</span>
          <span style={{ color: progressColor(listPct) }}>{listPct}%</span>
        </div>
      </div>
      <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar sesión">
        ✕ Cerrar
      </button>
    </header>
  );
}
