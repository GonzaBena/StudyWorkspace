import { useState, useCallback } from 'react';
import type { Session, PdfFile } from '../types';
import { saveSession, removeSession } from '../utils/session';
import {
  saveHandles, loadHandles, removeHandles,
  saveFileData, loadFileData, removeFileData,
  type FileDataMap,
} from '../utils/db';
import { celebrate, celebrateBig } from '../utils/confetti';

const FSAPI = 'showOpenFilePicker' in window;

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

async function readArrayBuffer(file: File): Promise<ArrayBuffer> {
  return file.arrayBuffer();
}

async function getAllPdfsFromDirectory(
  dirHandle: FileSystemDirectoryHandle,
): Promise<{ handle: FileSystemFileHandle; file: File }[]> {
  const results: { handle: FileSystemFileHandle; file: File }[] = [];
  for await (const [, entry] of dirHandle.entries()) {
    if (entry.kind === 'file' && entry.name.toLowerCase().endsWith('.pdf')) {
      const file = await (entry as FileSystemFileHandle).getFile();
      results.push({ handle: entry as FileSystemFileHandle, file });
    }
  }
  return results;
}

function buildSession(
  id: string,
  name: string,
  _files: File[],
  pdfFiles: PdfFile[],
  hasHandles: boolean,
): Session {
  return {
    id,
    name,
    files: pdfFiles,
    currentFileIndex: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    hasHandles,
    hasFileData: !hasHandles,
  };
}

export function useSession() {
  const [session, setSession]   = useState<Session | null>(null);
  const [urls, setUrls]         = useState<Map<string, string>>(new Map());

  // ── helpers ────────────────────────────────────────────────────────────────

  async function persistFiles(
    sessionId: string,
    files: File[],
    pdfFiles: PdfFile[],
    handles: FileSystemFileHandle[],
  ) {
    if (handles.length) {
      await saveHandles(sessionId, handles);
    } else {
      const map: FileDataMap = {};
      await Promise.all(
        files.map(async (f, i) => {
          map[pdfFiles[i].id] = await readArrayBuffer(f);
        }),
      );
      await saveFileData(sessionId, map);
    }
  }

  function makeUrlMap(files: File[], pdfFiles: PdfFile[]): Map<string, string> {
    const m = new Map<string, string>();
    files.forEach((f, i) => m.set(pdfFiles[i].id, URL.createObjectURL(f)));
    return m;
  }

  // ── open ───────────────────────────────────────────────────────────────────

  const openFiles = useCallback(async (inputFiles?: FileList | File[]) => {
    let handles: FileSystemFileHandle[] = [];
    let files: File[] = [];

    if (inputFiles) {
      files = Array.from(inputFiles).filter(f => f.name.toLowerCase().endsWith('.pdf'));
    } else if (FSAPI) {
      try {
        handles = await (
          window as unknown as {
            showOpenFilePicker: (o: object) => Promise<FileSystemFileHandle[]>;
          }
        ).showOpenFilePicker({
          multiple: true,
          types: [{ description: 'PDF', accept: { 'application/pdf': ['.pdf'] } }],
        });
        files = await Promise.all(handles.map(h => h.getFile()));
      } catch {
        return; // user cancelled
      }
    }

    if (!files.length) return;

    const id       = makeId();
    const pdfFiles = files.map(f => ({
      id: makeId(), name: f.name, currentPage: 1, totalPages: 0,
    } as PdfFile));

    const urlMap   = makeUrlMap(files, pdfFiles);
    const withUrls = pdfFiles.map(pf => ({ ...pf, url: urlMap.get(pf.id) }));

    const newSession = buildSession(
      id,
      files[0].name.replace(/\.pdf$/i, ''),
      files,
      withUrls,
      handles.length > 0,
    );

    await persistFiles(id, files, pdfFiles, handles);
    setUrls(urlMap);
    setSession(newSession);
    saveSession(newSession);
  }, []);

  const openFolder = useCallback(async () => {
    if (!('showDirectoryPicker' in window)) return;
    try {
      const dirHandle = await (
        window as unknown as { showDirectoryPicker: () => Promise<FileSystemDirectoryHandle> }
      ).showDirectoryPicker();

      const entries = await getAllPdfsFromDirectory(dirHandle);
      if (!entries.length) return;

      const id       = makeId();
      const files    = entries.map(e => e.file);
      const handles  = entries.map(e => e.handle);
      const pdfFiles = files.map(f => ({
        id: makeId(), name: f.name, currentPage: 1, totalPages: 0,
      } as PdfFile));

      const urlMap   = makeUrlMap(files, pdfFiles);
      const withUrls = pdfFiles.map(pf => ({ ...pf, url: urlMap.get(pf.id) }));

      const newSession = buildSession(id, dirHandle.name, files, withUrls, true);
      await persistFiles(id, files, pdfFiles, handles);
      setUrls(urlMap);
      setSession(newSession);
      saveSession(newSession);
    } catch {
      // cancelled
    }
  }, []);

  // ── resume ─────────────────────────────────────────────────────────────────

  const resumeSession = useCallback(async (saved: Session): Promise<boolean> => {
    const urlMap: Map<string, string> = new Map();
    const verifiedFiles: PdfFile[]    = [];

    try {
      if (saved.hasHandles) {
        const handles = await loadHandles(saved.id);
        if (handles?.length) {
          for (let i = 0; i < handles.length; i++) {
            try {
              const perm = await (
                handles[i] as FileSystemFileHandle & {
                  requestPermission?: (o: object) => Promise<PermissionState>;
                }
              ).requestPermission?.({ mode: 'read' });
              if (perm === 'denied') continue;

              const file = await handles[i].getFile();
              const url  = URL.createObjectURL(file);
              const pf   = saved.files[i];
              if (pf) { urlMap.set(pf.id, url); verifiedFiles.push({ ...pf, url }); }
            } catch {
              // file deleted or access revoked — skip
            }
          }
        }
      } else if (saved.hasFileData) {
        const dataMap = await loadFileData(saved.id);
        if (dataMap) {
          for (const pf of saved.files) {
            const buffer = dataMap[pf.id];
            if (buffer) {
              const url = URL.createObjectURL(new Blob([buffer], { type: 'application/pdf' }));
              urlMap.set(pf.id, url);
              verifiedFiles.push({ ...pf, url });
            }
          }
        }
      }
    } catch (err) {
      console.error('resume error:', err);
    }

    if (!verifiedFiles.length) return false;

    // Preserve currentFileIndex but clamp to available files
    const idx     = Math.min(saved.currentFileIndex, verifiedFiles.length - 1);
    const resumed = { ...saved, files: verifiedFiles, currentFileIndex: idx };
    setUrls(urlMap);
    setSession(resumed);
    return true;
  }, []);

  // ── page progress ──────────────────────────────────────────────────────────

  const updatePage = useCallback((fileId: string, page: number, totalPages: number) => {
    setSession(prev => {
      if (!prev) return prev;
      const files   = prev.files.map(f => f.id === fileId ? { ...f, currentPage: page, totalPages } : f);
      const updated = { ...prev, files, updatedAt: Date.now() };
      saveSession(updated);
      return updated;
    });
  }, []);

  const completeFile = useCallback(() => {
    setSession(prev => {
      if (!prev) return prev;
      const next = prev.currentFileIndex + 1;
      if (next >= prev.files.length) {
        celebrateBig();
        const updated = { ...prev, updatedAt: Date.now() };
        saveSession(updated);
        return updated;
      }
      celebrate();
      const updated = { ...prev, currentFileIndex: next, updatedAt: Date.now() };
      saveSession(updated);
      return updated;
    });
  }, []);

  // ── close / delete ─────────────────────────────────────────────────────────

  const closeSession = useCallback(() => {
    urls.forEach(url => URL.revokeObjectURL(url));
    setUrls(new Map());
    setSession(null);
  }, [urls]);

  const deleteSession = useCallback(async (id: string) => {
    removeSession(id);
    await Promise.allSettled([removeHandles(id), removeFileData(id)]);
  }, []);

  const switchToFile = useCallback((index: number) => {
    setSession(prev => {
      if (!prev || index < 0 || index >= prev.files.length) return prev;
      const updated = { ...prev, currentFileIndex: index, updatedAt: Date.now() };
      saveSession(updated);
      return updated;
    });
  }, []);

  const reorderFiles = useCallback((oldIndex: number, newIndex: number) => {
    setSession(prev => {
      if (!prev) return prev;
      const files = [...prev.files];
      const [moved] = files.splice(oldIndex, 1);
      files.splice(newIndex, 0, moved);
      
      let newCurrentIndex = prev.currentFileIndex;
      if (oldIndex === prev.currentFileIndex) {
        newCurrentIndex = newIndex;
      } else if (oldIndex < prev.currentFileIndex && newIndex >= prev.currentFileIndex) {
        newCurrentIndex--;
      } else if (oldIndex > prev.currentFileIndex && newIndex <= prev.currentFileIndex) {
        newCurrentIndex++;
      }

      const updated = { ...prev, files, currentFileIndex: newCurrentIndex, updatedAt: Date.now() };
      saveSession(updated);
      return updated;
    });
  }, []);

  const renameSession = useCallback((newName: string) => {
    setSession(prev => {
      if (!prev) return prev;
      const updated = { ...prev, name: newName, updatedAt: Date.now() };
      saveSession(updated);
      return updated;
    });
  }, []);

  // ── derived ────────────────────────────────────────────────────────────────

  const currentFile = session ? session.files[session.currentFileIndex] ?? null : null;
  const allDone     = session ? session.currentFileIndex >= session.files.length : false;

  // Average of each file's individual progress (e.g. 10% + 40% → 25% overall)
  const fileListProgress = session?.files.length
    ? session.files.reduce((sum, f) =>
        sum + (f.totalPages > 0 ? f.currentPage / f.totalPages : 0), 0
      ) / session.files.length
    : 0;

  return {
    session,
    currentFile,
    allDone,
    fileListProgress,
    openFiles,
    openFolder,
    resumeSession,
    updatePage,
    completeFile,
    switchToFile,
    reorderFiles,
    renameSession,
    closeSession,
    deleteSession,
  };
}
