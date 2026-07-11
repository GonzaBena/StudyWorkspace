import { useState, useCallback, useEffect, useRef } from 'react';
import { Page } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import styles from './PdfViewer.module.css';

type ZoomMode     = 'fit-width' | 'fit-height' | 'custom';
type InteractMode = 'pan' | 'select';

export interface ViewerConfig {
  zoomMode:     ZoomMode;
  customScale:  number;
  interactMode: InteractMode;
}

const ZOOM_STEPS = [0.25, 0.33, 0.5, 0.67, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];

interface Props {
  fileId: string;
  initialPage: number;
  numPages: number;
  error: Error | null;
  loading: boolean;
  onPageChange: (fileId: string, page: number, total: number) => void;
  onComplete: () => void;
  config: ViewerConfig;
  onConfigChange: (c: ViewerConfig) => void;
  jumpRequest?: number | null;
  onJumpApplied?: () => void;
  docInvert?: boolean;
  bookmarks?: number[];
  onToggleBookmark?: (page: number) => void;
}

export default function PdfViewer({ fileId, initialPage, numPages, error, loading, onPageChange, onComplete, config, onConfigChange, jumpRequest, onJumpApplied, docInvert, bookmarks, onToggleBookmark }: Props) {
  const [page, setPage] = useState(initialPage);
  const [containerWidth, setContainerWidth]   = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [rotation, setRotation] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'single' | 'continuous'>('single');
  const [zoomMode,     setZoomMode]     = useState<ZoomMode>(config.zoomMode);
  const [customScale,  setCustomScale]  = useState(config.customScale);
  const [interactMode, setInteractMode] = useState<InteractMode>(config.interactMode);
  const [naturalPageSize, setNaturalPageSize] = useState<{ width: number; height: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  // Page jump input
  const [editingPage, setEditingPage]   = useState(false);
  const [pageInput,   setPageInput]     = useState('');
  const pageInputRef = useRef<HTMLInputElement>(null);
  const containerRef    = useRef<HTMLDivElement>(null);
  const dragPos         = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const pinchRef        = useRef<{ dist: number; scale: number } | null>(null);
  const currentScaleRef = useRef(1);
  const configSynced    = useRef(false); // skip propagating on first render
  // Continuous scroll tracking
  const observerRef    = useRef<IntersectionObserver | null>(null);
  const pageVisibleRef = useRef<Map<number, number>>(new Map()); // pageNum → visible px
  const pageElemsRef   = useRef<Map<number, Element>>(new Map());
  const scrollPageRef  = useRef(1); // current page per scroll, avoids stale closure in observer

  useEffect(() => {
    setPage(initialPage);
    setNaturalPageSize(null);
    configSynced.current = false; // reset so the new file doesn't fire a spurious config update
  }, [fileId, initialPage]);

  // External page jump request (from ActivityBar thumbnails)
  useEffect(() => {
    if (jumpRequest == null || jumpRequest < 1 || numPages === 0 || jumpRequest > numPages) return;
    if (viewMode === 'continuous') {
      const el = pageElemsRef.current.get(jumpRequest);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Update state immediately for responsive feedback; observer will stay in sync during scroll
      scrollPageRef.current = jumpRequest;
      setPage(jumpRequest);
      onPageChange(fileId, jumpRequest, numPages);
    } else {
      setPage(jumpRequest);
      onPageChange(fileId, jumpRequest, numPages);
    }
    onJumpApplied?.();
  }, [jumpRequest]); // eslint-disable-line react-hooks/exhaustive-deps

  // Propagate config changes to parent (skip initial mount per file)
  useEffect(() => {
    if (!configSynced.current) { configSynced.current = true; return; }
    onConfigChange({ zoomMode, customScale, interactMode });
  }, [zoomMode, customScale, interactMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-focus + select-all when the page input appears
  useEffect(() => {
    if (editingPage) pageInputRef.current?.select();
  }, [editingPage]);

  // Keep scrollPageRef in sync with page state (set by buttons/jumps)
  useEffect(() => { scrollPageRef.current = page; }, [page]);

  // Scroll to top when changing pages in single-page mode
  useEffect(() => {
    if (viewMode === 'single' && containerRef.current) {
      containerRef.current.scrollTop = 0;
      containerRef.current.scrollLeft = 0;
    }
  }, [page, viewMode]);

  // Continuous scroll: IntersectionObserver to highlight the most visible page
  useEffect(() => {
    if (viewMode !== 'continuous' || !containerRef.current || numPages === 0) {
      observerRef.current?.disconnect();
      observerRef.current = null;
      pageVisibleRef.current.clear();
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const pn = Number((entry.target as HTMLElement).dataset.pageNum);
          if (pn) pageVisibleRef.current.set(pn, entry.intersectionRect.height);
        });

        let bestPx = -1, bestPage = scrollPageRef.current;
        pageVisibleRef.current.forEach((px, p) => {
          if (px > bestPx) { bestPx = px; bestPage = p; }
        });

        if (bestPage !== scrollPageRef.current) {
          scrollPageRef.current = bestPage;
          setPage(bestPage);
          onPageChange(fileId, bestPage, numPages);
        }
      },
      { root: containerRef.current, threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] },
    );

    observerRef.current = obs;
    pageElemsRef.current.forEach(el => obs.observe(el));

    // Scroll to current page immediately so the observer fires at the right position,
    // not at position 0 (which would incorrectly report page 1 as most visible).
    const targetEl = pageElemsRef.current.get(scrollPageRef.current);
    if (targetEl) targetEl.scrollIntoView({ behavior: 'instant', block: 'start' });

    return () => { obs.disconnect(); observerRef.current = null; };
  }, [viewMode, numPages, fileId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setContainerWidth(Math.floor(width));
      setContainerHeight(Math.floor(height));
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Keyboard shortcuts — arrow keys for page nav, +/- for zoom, H for mode toggle
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goNext();
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   goPrev();
      if ((e.key === '+' || e.key === '=') && !e.ctrlKey && !e.metaKey) handleZoomIn();
      if (e.key === '-' && !e.ctrlKey && !e.metaKey) handleZoomOut();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Touch handlers: pinch-to-zoom (2 fingers, any mode) + pan (1 finger, pan mode)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function pinchDist(touches: TouchList) {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    }

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault(); // block browser native zoom
        pinchRef.current = { dist: pinchDist(e.touches), scale: currentScaleRef.current };
        return;
      }
      if (interactMode !== 'pan' || e.touches.length !== 1) return;
      dragPos.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        scrollLeft: el.scrollLeft,
        scrollTop: el.scrollTop,
      };
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchRef.current) {
        e.preventDefault();
        const ratio    = pinchDist(e.touches) / pinchRef.current.dist;
        const newScale = Math.min(3, Math.max(0.25, pinchRef.current.scale * ratio));
        setZoomMode('custom');
        setCustomScale(newScale);
        return;
      }
      if (interactMode !== 'pan' || e.touches.length !== 1) return;
      e.preventDefault();
      const dx = e.touches[0].clientX - dragPos.current.x;
      const dy = e.touches[0].clientY - dragPos.current.y;
      el.scrollLeft = dragPos.current.scrollLeft - dx;
      el.scrollTop  = dragPos.current.scrollTop  - dy;
    };

    const onTouchEnd = () => { pinchRef.current = null; };

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove',  onTouchMove,  { passive: false });
    el.addEventListener('touchend',   onTouchEnd,   { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove',  onTouchMove);
      el.removeEventListener('touchend',   onTouchEnd);
    };
  }, [interactMode]);

  useEffect(() => {
    if (numPages > 0) {
      onPageChange(fileId, page, numPages);
    }
  }, [fileId, numPages]);

  const onPageLoadSuccess = useCallback((pageProxy: { getViewport: (o: { scale: number }) => { width: number; height: number } }) => {
    const vp = pageProxy.getViewport({ scale: 1 });
    setNaturalPageSize({ width: vp.width, height: vp.height });
  }, []);

  const goNext = useCallback(() => {
    setPage(p => {
      if (p >= numPages) return p;
      const next = p + 1;
      onPageChange(fileId, next, numPages);
      return next;
    });
  }, [numPages, fileId, onPageChange]);

  const goPrev = useCallback(() => {
    setPage(p => {
      if (p <= 1) return p;
      const prev = p - 1;
      onPageChange(fileId, prev, numPages);
      return prev;
    });
  }, [fileId, onPageChange]);

  // The scale currently being rendered, regardless of mode
  const getEffectiveScale = useCallback((): number => {
    if (zoomMode === 'custom' || !naturalPageSize) return customScale;
    if (zoomMode === 'fit-width')  return containerWidth  / naturalPageSize.width;
    if (zoomMode === 'fit-height') return Math.max(containerHeight - 32, 100) / naturalPageSize.height;
    return customScale;
  }, [zoomMode, customScale, naturalPageSize, containerWidth, containerHeight]);

  const handleZoomIn = useCallback(() => {
    const current = getEffectiveScale();
    const next = ZOOM_STEPS.find(z => z > current + 0.001);
    setZoomMode('custom');
    setCustomScale(next ?? ZOOM_STEPS[ZOOM_STEPS.length - 1]);
  }, [getEffectiveScale]);

  const handleZoomOut = useCallback(() => {
    const current = getEffectiveScale();
    const prev = [...ZOOM_STEPS].reverse().find(z => z < current - 0.001);
    setZoomMode('custom');
    setCustomScale(prev ?? ZOOM_STEPS[0]);
  }, [getEffectiveScale]);

  // Page jump input
  const startPageEdit = useCallback(() => {
    setPageInput(String(page));
    setEditingPage(true);
  }, [page]);

  const commitPageEdit = useCallback(() => {
    const n = parseInt(pageInput, 10);
    if (!isNaN(n) && n >= 1 && n <= numPages) {
      setPage(n);
      onPageChange(fileId, n, numPages);
    }
    setEditingPage(false);
  }, [pageInput, numPages, fileId, onPageChange]);

  const cancelPageEdit = useCallback(() => setEditingPage(false), []);

  const onPageInputKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitPageEdit();
    if (e.key === 'Escape') cancelPageEdit();
  }, [commitPageEdit, cancelPageEdit]);

  // Mouse pan handlers
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (interactMode !== 'pan') return;
    const el = containerRef.current!;
    dragPos.current = { x: e.clientX, y: e.clientY, scrollLeft: el.scrollLeft, scrollTop: el.scrollTop };
    setDragging(true);
    e.preventDefault();
  }, [interactMode]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging || interactMode !== 'pan') return;
    const el = containerRef.current!;
    el.scrollLeft = dragPos.current.scrollLeft - (e.clientX - dragPos.current.x);
    el.scrollTop  = dragPos.current.scrollTop  - (e.clientY - dragPos.current.y);
  }, [dragging, interactMode]);

  const onMouseUp = useCallback(() => setDragging(false), []);
  const onMouseLeave = useCallback(() => setDragging(false), []);

  const pageProps =
    zoomMode === 'fit-width'  ? { width:  containerWidth || undefined } :
    zoomMode === 'fit-height' ? { height: Math.max(containerHeight - 32, 100) || undefined } :
    { scale: customScale };

  const effectivePct = Math.round(getEffectiveScale() * 100);
  const zoomLabel   = `${effectivePct}%`;
  currentScaleRef.current = getEffectiveScale(); // keep ref in sync for touch handlers

  const containerClass = [
    styles.container,
    interactMode === 'pan' ? (dragging ? styles.grabbing : styles.grab) : '',
  ].join(' ');

  const isLast = page >= numPages && numPages > 0;
  const ready  = containerWidth > 0;

  return (
    <div className={styles.wrapper}>
      <div
        ref={containerRef}
        className={containerClass}
        style={docInvert ? { filter: 'invert(1) hue-rotate(180deg)' } : undefined}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
      >
        {loading && <div className={styles.loading}>Cargando PDF…</div>}
        {error && <div className={styles.error}>Error al cargar el PDF. {error.message}</div>}
        {!loading && !error && ready && numPages > 0 && (
          viewMode === 'single' ? (
            <Page pageNumber={page} onLoadSuccess={onPageLoadSuccess} rotate={rotation} {...pageProps} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', margin: 'auto' }}>
              {Array.from({ length: numPages }, (_, i) => i + 1).map(p => (
                <div
                  key={p}
                  data-page-num={String(p)}
                  ref={el => {
                    if (el) {
                      pageElemsRef.current.set(p, el);
                      observerRef.current?.observe(el);
                    } else {
                      const old = pageElemsRef.current.get(p);
                      if (old) observerRef.current?.unobserve(old);
                      pageElemsRef.current.delete(p);
                    }
                  }}
                >
                  <Page
                    pageNumber={p}
                    onLoadSuccess={p === 1 ? onPageLoadSuccess : undefined}
                    rotate={rotation}
                    {...pageProps}
                    renderAnnotationLayer={false}
                    renderTextLayer={false}
                  />
                </div>
              ))}
            </div>
          )
        )}
      </div>

      <nav className={styles.nav}>
        <button onClick={goPrev} disabled={page <= 1} className={styles.navBtn}>← Anterior</button>

        {editingPage ? (
          <input
            ref={pageInputRef}
            className={styles.pageInput}
            type="number"
            min={1}
            max={numPages}
            value={pageInput}
            onChange={e => setPageInput(e.target.value)}
            onBlur={commitPageEdit}
            onKeyDown={onPageInputKey}
          />
        ) : (
          <button className={styles.pageNum} onClick={startPageEdit} title="Haz clic para ir a una página">
            {page} / {numPages || '…'}
          </button>
        )}

        <div className={styles.toolbar}>
          {/* Bookmark toggle */}
          {onToggleBookmark && (
            <div className={styles.toolGroup}>
              <button
                onClick={() => onToggleBookmark(page)}
                className={`${styles.zoomBtn} ${bookmarks?.includes(page) ? styles.zoomActive : ''}`}
                title={bookmarks?.includes(page) ? 'Quitar marca de página' : 'Marcar página'}
              >
                {bookmarks?.includes(page) ? '★' : '☆'}
              </button>
            </div>
          )}

          <div className={styles.zoomDivider} />

          {/* Rotation & View Mode */}
          <div className={styles.toolGroup}>
            <button onClick={() => setRotation(r => (r - 90 + 360) % 360)} className={styles.zoomBtn} title="Rotar izquierda">↺</button>
            <button onClick={() => setRotation(r => (r + 90) % 360)} className={styles.zoomBtn} title="Rotar derecha">↻</button>
            <div className={styles.zoomDivider} />
            <button
              onClick={() => setViewMode(v => v === 'single' ? 'continuous' : 'single')}
              className={`${styles.zoomBtn} ${viewMode === 'continuous' ? styles.zoomActive : ''}`}
              title="Alternar vista continua"
            >↕</button>
          </div>

          <div className={styles.zoomDivider} />

          {/* Mode toggle */}
          <div className={styles.toolGroup}>
            <button
              onClick={() => setInteractMode('select')}
              className={`${styles.zoomBtn} ${interactMode === 'select' ? styles.zoomActive : ''}`}
              title="Modo selección (texto)"
              aria-label="Modo selección"
            >↖ Sel</button>
            <button
              onClick={() => setInteractMode('pan')}
              className={`${styles.zoomBtn} ${interactMode === 'pan' ? styles.zoomActive : ''}`}
              title="Modo desplazamiento"
              aria-label="Modo desplazamiento"
            >✋ Pan</button>
          </div>

          <div className={styles.zoomDivider} />

          {/* Zoom controls */}
          <div className={styles.toolGroup}>
            <button onClick={handleZoomOut} className={styles.zoomBtn} title="Reducir (−)">−</button>
            <span className={styles.zoomLabel}>{zoomLabel}</span>
            <button onClick={handleZoomIn}  className={styles.zoomBtn} title="Ampliar (+)">+</button>
            <div className={styles.zoomDivider} />
            <button
              onClick={() => setZoomMode('fit-width')}
              className={`${styles.zoomBtn} ${zoomMode === 'fit-width'  ? styles.zoomActive : ''}`}
              title="Ajustar al ancho"
            >⊞ W</button>
            <button
              onClick={() => setZoomMode('fit-height')}
              className={`${styles.zoomBtn} ${zoomMode === 'fit-height' ? styles.zoomActive : ''}`}
              title="Ajustar al alto"
            >⊟ H</button>
          </div>
        </div>

        {isLast ? (
          <button onClick={onComplete} className={`${styles.navBtn} ${styles.completeBtn}`}>✓ Completado →</button>
        ) : (
          <button onClick={goNext} disabled={page >= numPages} className={styles.navBtn}>Siguiente →</button>
        )}
      </nav>
    </div>
  );
}
