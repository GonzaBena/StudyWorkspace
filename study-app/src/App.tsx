import { useState, useEffect, useCallback, useRef } from 'react';
import { animate } from 'animejs';
import { pdfjs } from 'react-pdf';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { useDarkMode } from './hooks/useDarkMode';
import { useSession } from './hooks/useSession';
import { useBookmarks } from './hooks/useBookmarks';
import { getSessions } from './utils/session';
import HomeCard from './components/HomeCard';
import RecentSessions from './components/RecentSessions';
import StatusBar from './components/StatusBar';
import PdfViewer, { type ViewerConfig } from './components/PdfViewer';
import ActivityBar from './components/ActivityBar';
import DarkModeToggle from './components/DarkModeToggle';
import DocInvertToggle from './components/DocInvertToggle';
import PdfSessionReader from './components/PdfSessionReader';
import StorageWarning from './components/StorageWarning';
import type { Session } from './types';
import './index.css';
import styles from './App.module.css';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

type View = 'home' | 'reader';

const DEFAULT_VIEWER_CONFIG: ViewerConfig = {
  zoomMode: 'custom',
  customScale: 1,
  interactMode: 'select',
};

export default function App() {
  const { isDark, toggle } = useDarkMode();
  const { session, currentFile, allDone, fileListProgress, resuming, openFiles, openFolder, resumeSession, updatePage, completeFile, switchToFile, reorderFiles, renameSession, closeSession, deleteSession } = useSession();
  const [view, setView] = useState<View>('home');
  const [savedSessions, setSavedSessions] = useState<Session[]>([]);
  const [viewerConfig, setViewerConfig]   = useState<ViewerConfig>(DEFAULT_VIEWER_CONFIG);
  const [activityOpen, setActivityOpen]   = useState(true);
  const [activityBarWidth, setActivityBarWidth] = useState(200);
  const [lastSelection,   setLastSelection]     = useState('');
  const [jumpRequest,  setJumpRequest]    = useState<number | null>(null);
  const [docInvert,    setDocInvert]      = useState(false);
  const { bookmarks, toggleBookmark } = useBookmarks(currentFile?.id);
  const homeRef   = useRef<HTMLDivElement>(null);
  const readerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSavedSessions(getSessions());
  }, []);

  useEffect(() => {
    if (session) {
      setViewerConfig(DEFAULT_VIEWER_CONFIG);
      setView('reader');
    }
  }, [session?.id]);

  const handleClose = useCallback(() => {
    closeSession();
    setSavedSessions(getSessions());
    setView('home');
    if (homeRef.current) {
      animate(homeRef.current, { opacity: [0, 1], duration: 500, easing: 'easeOutExpo' });
    }
  }, [closeSession]);

  const handleResume = useCallback(async (saved: Session) => {
    const ok = await resumeSession(saved);
    if (!ok) {
      alert('No se pudieron recuperar los archivos. Por favor, vuelve a abrirlos.');
    }
  }, [resumeSession]);

  const handleDelete = useCallback(async (id: string) => {
    await deleteSession(id);
    setSavedSessions(getSessions());
  }, [deleteSession]);

  const handleFilesOpen = useCallback(async (files: FileList) => {
    if (!files.length) {
      await openFiles();
    } else {
      await openFiles(files);
    }
    setSavedSessions(getSessions());
  }, [openFiles]);

  if (view === 'reader' && session && currentFile) {
    return (
      <div ref={readerRef} className={styles.readerLayout}>
        <StatusBar
          docProgress={currentFile.totalPages ? currentFile.currentPage / currentFile.totalPages : 0}
          listProgress={fileListProgress}
          currentFileName={currentFile.name}
          fileIndex={session.currentFileIndex}
          totalFiles={session.files.length}
          sessionName={session.name}
          onRenameSession={renameSession}
          onClose={handleClose}
        />
        <div className={styles.readerBody}>
          {allDone ? (
            <div className={styles.allDone}>
              <div className={styles.doneEmoji}>🎉</div>
              <h2>¡Lista completada!</h2>
              <p>Terminaste todos los archivos de esta sesión.</p>
              <button className={styles.doneBtn} onClick={handleClose}>Volver al inicio</button>
            </div>
          ) : (
            <PdfSessionReader
              key={currentFile.id}
              url={currentFile.url!}
              onPasswordRequest={(cb) => {
                const pass = prompt('Este PDF requiere contraseña. Introduce la contraseña:');
                if (pass !== null) cb(pass);
              }}
            >
              {(numPages, error, loading) => (
                <>
                  <PdfViewer
                    fileId={currentFile.id}
                    initialPage={currentFile.currentPage}
                    numPages={numPages}
                    error={error}
                    loading={loading}
                    onPageChange={updatePage}
                    onComplete={completeFile}
                    config={viewerConfig}
                    onConfigChange={setViewerConfig}
                    jumpRequest={jumpRequest}
                    onJumpApplied={() => setJumpRequest(null)}
                    docInvert={docInvert}
                    bookmarks={bookmarks}
                    onToggleBookmark={toggleBookmark}
                    onTextSelect={setLastSelection}
                  />
                  <ActivityBar
                    isOpen={activityOpen}
                    onToggle={() => setActivityOpen(o => !o)}
                    initialWidth={activityBarWidth}
                    onWidthChange={setActivityBarWidth}
                    lastSelection={lastSelection}
                    onClearSelection={() => setLastSelection('')}
                    session={session}
                    currentFile={currentFile}
                    numPages={numPages}
                    onJumpToPage={setJumpRequest}
                    onSwitchFile={switchToFile}
                    onReorderFiles={reorderFiles}
                    bookmarks={bookmarks}
                    onToggleBookmark={toggleBookmark}
                  />
                </>
              )}
            </PdfSessionReader>
          )}
        </div>
        <DocInvertToggle inverted={docInvert} onToggle={() => setDocInvert(v => !v)} rightOffset={activityOpen ? activityBarWidth : 0} />
        <DarkModeToggle isDark={isDark} onToggle={toggle} rightOffset={activityOpen ? activityBarWidth : 0} />
      </div>
    );
  }

  return (
    <div ref={homeRef} className={styles.homeLayout}>
      <header className={styles.header}>
        <h1 className={styles.logo}>StudyProgress</h1>
      </header>
      <main className={styles.main}>
        <StorageWarning />
        <HomeCard onFiles={handleFilesOpen} onFolder={openFolder} />
        <RecentSessions
          sessions={savedSessions}
          onResume={handleResume}
          onDelete={handleDelete}
        />
      </main>
      {resuming && (
        <div className={styles.resumingOverlay}>
          <div className={styles.resumingSpinner} />
        </div>
      )}
      <DarkModeToggle isDark={isDark} onToggle={toggle} />
      <span className={styles.version}>v{__APP_VERSION__}</span>
    </div>
  );
}
