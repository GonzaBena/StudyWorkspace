import styles from './StatusBar.module.css';
import { progressColor } from '../utils/colors';

interface Props {
  docProgress: number;      // 0–1
  listProgress: number;     // 0–1
  currentFileName: string;
  fileIndex: number;
  totalFiles: number;
  onClose: () => void;
}

export default function StatusBar({ docProgress, listProgress, currentFileName, fileIndex, totalFiles, onClose }: Props) {
  const docPct = Math.round(docProgress * 100);
  const listPct = Math.round(listProgress * 100);

  return (
    <header className={styles.bar}>
      <div className={styles.info}>
        <span className={styles.filename} title={currentFileName}>{currentFileName}</span>
        <span className={styles.counter}>{fileIndex + 1} / {totalFiles}</span>
      </div>
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
