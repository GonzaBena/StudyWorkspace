import { useState, useEffect, useCallback, useRef } from 'react';
import { animate } from 'animejs';
import { pdfjs } from 'react-pdf';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { useDarkMode } from './hooks/useDarkMode';
import { useSession } from './hooks/useSession';
import { getSessions } from './utils/session';
import HomeCard from './components/HomeCard';
import RecentSessions from './components/RecentSessions';
import StatusBar from './components/StatusBar';
import PdfViewer from './components/PdfViewer';
import DarkModeToggle from './components/DarkModeToggle';
import type { Session } from './types';
import './index.css';
import styles from './App.module.css';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

type View = 'home' | 'reader';

export default function App() {
  const { isDark, toggle } = useDarkMode();
  const { session, currentFile, allDone, fileListProgress, openFiles, openFolder, resumeSession, updatePage, completeFile, closeSession, deleteSession } = useSession();
  const [view, setView] = useState<View>('home');
  const [savedSessions, setSavedSessions] = useState<Session[]>([]);
  const homeRef = useRef<HTMLDivElement>(null);
  const readerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSavedSessions(getSessions());
  }, []);

  useEffect(() => {
    if (session) {
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
          onClose={handleClose}
        />
        {allDone ? (
          <div className={styles.allDone}>
            <div className={styles.doneEmoji}>🎉</div>
            <h2>¡Lista completada!</h2>
            <p>Terminaste todos los archivos de esta sesión.</p>
            <button className={styles.doneBtn} onClick={handleClose}>Volver al inicio</button>
          </div>
        ) : (
          <PdfViewer
            key={currentFile.id}
            url={currentFile.url!}
            fileId={currentFile.id}
            initialPage={currentFile.currentPage}
            onPageChange={updatePage}
            onComplete={completeFile}
          />
        )}
        <DarkModeToggle isDark={isDark} onToggle={toggle} />
      </div>
    );
  }

  return (
    <div ref={homeRef} className={styles.homeLayout}>
      <header className={styles.header}>
        <h1 className={styles.logo}>StudyProgress</h1>
      </header>
      <main className={styles.main}>
        <HomeCard onFiles={handleFilesOpen} onFolder={openFolder} />
        <RecentSessions
          sessions={savedSessions}
          onResume={handleResume}
          onDelete={handleDelete}
        />
      </main>
      <DarkModeToggle isDark={isDark} onToggle={toggle} />
    </div>
  );
}
