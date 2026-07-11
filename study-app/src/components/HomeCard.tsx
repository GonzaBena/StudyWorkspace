import { useRef, useEffect, useState, useCallback } from 'react';
import { animate } from 'animejs';
import styles from './HomeCard.module.css';

interface Props {
  onFiles: (files: FileList) => void;
  onFolder: () => void;
}

export default function HomeCard({ onFiles, onFolder }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const hasFsApi = 'showOpenFilePicker' in window;

  useEffect(() => {
    if (!cardRef.current) return;
    animate(cardRef.current, {
      opacity: [0, 1],
      translateY: [40, 0],
      duration: 900,
      easing: 'easeOutExpo',
    });
  }, []);

  const handleClick = useCallback(() => {
    if (hasFsApi) {
      onFiles(new DataTransfer().files); // triggers FSAPI path in hook
    } else {
      fileInputRef.current?.click();
    }
  }, [hasFsApi, onFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragging(false), []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
  }, [onFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) onFiles(e.target.files);
  }, [onFiles]);

  return (
    <div
      ref={cardRef}
      className={`${styles.card} ${dragging ? styles.dragging : ''}`}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && handleClick()}
    >
      <div className={styles.glow} />
      <div className={styles.inner}>
        <div className={styles.icon}>
          {dragging ? '📂' : '📄'}
        </div>
        <h2 className={styles.title}>Cargar PDFs</h2>
        <p className={styles.subtitle}>
          Arrastra archivos o carpetas aquí<br />o haz clic para seleccionar
        </p>
        <div className={styles.dropIndicator}>
          <span /><span /><span />
        </div>
        {('showDirectoryPicker' in window) && (
          <button
            className={styles.folderBtn}
            onClick={e => { e.stopPropagation(); onFolder(); }}
          >
            📁 Abrir carpeta
          </button>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileInput}
      />
    </div>
  );
}
