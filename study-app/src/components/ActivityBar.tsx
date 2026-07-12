import { useState, useEffect, useRef, useCallback } from 'react';
import { Page } from 'react-pdf';
import type { Session, PdfFile } from '../types';
import { progressColor } from '../utils/colors';
import { useNotes } from '../hooks/useNotes';
import NotesPanel from './NotesPanel';
import BookmarksPanel from './BookmarksPanel';
import styles from './ActivityBar.module.css';
import { ChevronLeft, ChevronRight, Bookmark } from 'lucide-react';

type Section = 'pages' | 'files' | 'notes' | 'bookmarks';

interface Props {
  isOpen: boolean;
  onToggle: () => void;
  session: Session;
  currentFile: PdfFile | null;
  numPages: number;
  onJumpToPage: (page: number) => void;
  onSwitchFile: (index: number) => void;
  onReorderFiles: (oldIndex: number, newIndex: number) => void;
  bookmarks: number[];
  onToggleBookmark: (page: number) => void;
  initialWidth?: number;
  onWidthChange?: (w: number) => void;
  lastSelection?: string;
  onClearSelection?: () => void;
}

// ── Lazy thumbnail ────────────────────────────────────────────────────────────

interface ThumbProps {
  pageNum: number;
  isActive: boolean;
  onClick: () => void;
}

function Thumbnail({ pageNum, isActive, onClick }: ThumbProps) {
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
        <Page
          pageNumber={pageNum}
          width={160}
          renderAnnotationLayer={false}
          renderTextLayer={false}
        />
      ) : (
        <div className={styles.thumbPlaceholder} />
      )}
      <span className={styles.thumbNum}>{pageNum}</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const ANIM_MS = 220;
const MIN_WIDTH = 200;
const MAX_WIDTH_VW = 0.4;
const DRAG_THRESHOLD = 4;

export default function ActivityBar({ isOpen, onToggle, session, currentFile, numPages, onJumpToPage, onSwitchFile, onReorderFiles, bookmarks, onToggleBookmark, initialWidth, onWidthChange, lastSelection, onClearSelection }: Props) {
  const [section, setSection] = useState<Section>('pages');
  const [visible, setVisible] = useState(isOpen);
  const [panelWidth, setPanelWidth] = useState(initialWidth ?? MIN_WIDTH);
  const panelWidthRef = useRef(initialWidth ?? MIN_WIDTH);
  const panelElRef = useRef<HTMLElement>(null);
  const dragRef = useRef<{ startX: number; startWidth: number; dragging: boolean } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
    } else {
      const t = setTimeout(() => setVisible(false), ANIM_MS);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const closing = visible && !isOpen;

  // Usa numPages prop en lugar del que viene en currentFile si está desactualizado
  const currentPage = currentFile?.currentPage ?? 1;

  const { notes, addNote, deleteNote, editNote } = useNotes(currentFile?.id);

  const handleJump = useCallback((p: number) => onJumpToPage(p), [onJumpToPage]);

  const scrollToActiveThumbnail = useCallback(() => {
    const activeEl = panelElRef.current?.querySelector(`.${styles.thumbActive}`);
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startWidth: panelWidthRef.current, dragging: false };

    const onMove = (ev: MouseEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const delta = d.startX - ev.clientX;
      if (!d.dragging && Math.abs(delta) > DRAG_THRESHOLD) d.dragging = true;
      if (d.dragging && panelElRef.current) {
        const max = window.innerWidth * MAX_WIDTH_VW;
        const w = Math.round(Math.max(MIN_WIDTH, Math.min(max, d.startWidth + delta)));
        panelElRef.current.style.width = w + 'px';
      }
    };

    const onUp = () => {
      const d = dragRef.current;
      if (d && !d.dragging) {
        onToggle();
      } else if (d && panelElRef.current) {
        const w = parseInt(panelElRef.current.style.width, 10);
        panelWidthRef.current = w;
        setPanelWidth(w);
        onWidthChange?.(w);
      }
      dragRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [onToggle, onWidthChange]);

  return (
    <div className={styles.wrapper}>
      {visible && (
      <aside ref={panelElRef} className={`${styles.panel} ${closing ? styles.panelExit : styles.panelEnter}`} style={{ width: panelWidth }}>
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
            <button
              className={`${styles.tab} ${section === 'notes' ? styles.tabActive : ''}`}
              onClick={() => setSection('notes')}
            >
              Notas
            </button>
            <button
              className={`${styles.tab} ${section === 'bookmarks' ? styles.tabActive : ''}`}
              onClick={() => setSection('bookmarks')}
            >
              <Bookmark size={12} fill={bookmarks.length > 0 ? 'currentColor' : 'none'} />
              {bookmarks.length > 0 && <span>{bookmarks.length}</span>}
            </button>
          </div>

          {/* Pages section */}
          {section === 'pages' && (
            <>
              {currentFile && numPages > 0 && (
                <div className={styles.sectionHeader}>
                  <button className={styles.jumpToActiveBtn} onClick={scrollToActiveThumbnail}>
                    Ir a la página actual (Pg. {currentPage})
                  </button>
                </div>
              )}
              <div className={`${styles.content} ${styles.contentPages}`}>
                {!currentFile ? (
                  <p className={styles.empty}>Sin archivo abierto.</p>
                ) : numPages === 0 ? (
                  <p className={styles.empty}>Cargando páginas…</p>
                ) : (
                  Array.from({ length: numPages }, (_, i) => i + 1).map(p => (
                    <Thumbnail
                      key={p}
                      pageNum={p}
                      isActive={p === currentPage}
                      onClick={() => handleJump(p)}
                    />
                  ))
                )}
              </div>
            </>
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
                    draggable
                    onDragStart={e => e.dataTransfer.setData('text/plain', i.toString())}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => {
                      e.preventDefault();
                      const oldIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
                      if (!isNaN(oldIndex) && oldIndex !== i) onReorderFiles(oldIndex, i);
                    }}
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

          {/* Notes section */}
          {section === 'notes' && (
            <div className={styles.content}>
              {currentFile ? (
                <NotesPanel
                  currentPage={currentPage}
                  notes={notes}
                  onAddNote={addNote}
                  onDeleteNote={deleteNote}
                  onEditNote={editNote}
                  onJumpToPage={handleJump}
                  lastSelection={lastSelection}
                  onClearSelection={onClearSelection}
                />
              ) : (
                <p className={styles.empty}>Sin archivo abierto.</p>
              )}
            </div>
          )}

          {/* Bookmarks section */}
          {section === 'bookmarks' && (
            <div className={styles.content}>
              {currentFile ? (
                <BookmarksPanel
                  currentPage={currentPage}
                  bookmarks={bookmarks}
                  onToggle={onToggleBookmark}
                  onJumpToPage={handleJump}
                />
              ) : (
                <p className={styles.empty}>Sin archivo abierto.</p>
              )}
            </div>
          )}
      </aside>
      )}

      {/* Collapse / expand button — always visible on the far right */}
      <button
        className={`${styles.toggleBtn} ${!isOpen ? styles.toggleBtnClosed : ''}`}
        onMouseDown={handleMouseDown}
        aria-label={isOpen ? 'Cerrar panel' : 'Abrir panel'}
        title={isOpen ? 'Cerrar panel (arrastrar para redimensionar)' : 'Abrir panel'}
      >
        {isOpen ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </div>
  );
}
