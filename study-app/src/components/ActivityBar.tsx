import { useState, useEffect, useRef, useCallback } from 'react';
import { Document, Page } from 'react-pdf';
import type { Session, PdfFile } from '../types';
import { progressColor } from '../utils/colors';
import styles from './ActivityBar.module.css';

type Section = 'pages' | 'files';

interface Props {
  isOpen: boolean;
  onToggle: () => void;
  session: Session;
  currentFile: PdfFile | null;
  onJumpToPage: (page: number) => void;
  onSwitchFile: (index: number) => void;
}

// ── Lazy thumbnail ────────────────────────────────────────────────────────────

interface ThumbProps {
  url: string;
  pageNum: number;
  isActive: boolean;
  onClick: () => void;
}

function Thumbnail({ url, pageNum, isActive, onClick }: ThumbProps) {
  const ref     = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setShow(true); },
      { threshold: 0 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // scroll active thumbnail into view
  useEffect(() => {
    if (isActive) ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [isActive]);

  return (
    <div
      ref={ref}
      className={`${styles.thumb} ${isActive ? styles.thumbActive : ''}`}
      onClick={onClick}
      title={`Página ${pageNum}`}
    >
      {show ? (
        <Document file={url} loading={null} error={null}>
          <Page
            pageNumber={pageNum}
            width={110}
            renderAnnotationLayer={false}
            renderTextLayer={false}
          />
        </Document>
      ) : (
        <div className={styles.thumbPlaceholder} />
      )}
      <span className={styles.thumbNum}>{pageNum}</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ActivityBar({ isOpen, onToggle, session, currentFile, onJumpToPage, onSwitchFile }: Props) {
  const [section, setSection] = useState<Section>('pages');

  const numPages   = currentFile?.totalPages ?? 0;
  const currentPage = currentFile?.currentPage ?? 1;

  const handleJump = useCallback((p: number) => onJumpToPage(p), [onJumpToPage]);

  return (
    <>
      {/* Collapse / expand button — always visible */}
      <button
        className={styles.toggleBtn}
        onClick={onToggle}
        aria-label={isOpen ? 'Cerrar panel' : 'Abrir panel'}
        title={isOpen ? 'Cerrar panel' : 'Abrir panel'}
      >
        {isOpen ? '›' : '‹'}
      </button>

      {isOpen && (
        <aside className={styles.panel}>
          {/* Section tabs */}
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${section === 'pages' ? styles.tabActive : ''}`}
              onClick={() => setSection('pages')}
            >
              Páginas
            </button>
            <button
              className={`${styles.tab} ${section === 'files' ? styles.tabActive : ''}`}
              onClick={() => setSection('files')}
            >
              Archivos
            </button>
          </div>

          {/* Pages section */}
          {section === 'pages' && (
            <div className={styles.content}>
              {!currentFile?.url ? (
                <p className={styles.empty}>Sin archivo abierto.</p>
              ) : numPages === 0 ? (
                <p className={styles.empty}>Cargando páginas…</p>
              ) : (
                Array.from({ length: numPages }, (_, i) => i + 1).map(p => (
                  <Thumbnail
                    key={p}
                    url={currentFile.url!}
                    pageNum={p}
                    isActive={p === currentPage}
                    onClick={() => handleJump(p)}
                  />
                ))
              )}
            </div>
          )}

          {/* Files section */}
          {section === 'files' && (
            <div className={styles.content}>
              {session.files.map((f, i) => {
                const pct     = f.totalPages > 0 ? Math.round((f.currentPage / f.totalPages) * 100) : 0;
                const isActive = i === session.currentFileIndex;
                return (
                  <button
                    key={f.id}
                    className={`${styles.fileItem} ${isActive ? styles.fileActive : ''}`}
                    onClick={() => onSwitchFile(i)}
                  >
                    <div className={styles.fileName} title={f.name}>{f.name}</div>
                    <div className={styles.fileProgress}>
                      <div className={styles.fileBar}>
                        <div
                          className={styles.fileBarFill}
                          style={{ width: `${pct}%`, background: progressColor(pct) }}
                        />
                      </div>
                      <span className={styles.filePct} style={{ color: progressColor(pct) }}>{pct}%</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </aside>
      )}
    </>
  );
}
