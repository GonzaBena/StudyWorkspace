const DB_NAME = 'study-progress';
const DB_VERSION = 2;
const HANDLES_STORE = 'file-handles';
const DATA_STORE    = 'file-data';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(HANDLES_STORE)) db.createObjectStore(HANDLES_STORE);
      if (!db.objectStoreNames.contains(DATA_STORE))    db.createObjectStore(DATA_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror  = () => reject(req.error);
  });
}

function put<T>(store: string, key: string, value: T): Promise<void> {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  }));
}

function get<T>(store: string, key: string): Promise<T | undefined> {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx  = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result as T);
    req.onerror   = () => reject(req.error);
  }));
}

function del(store: string, key: string): Promise<void> {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  }));
}

// FSAPI file handles
export const saveHandles   = (id: string, v: FileSystemFileHandle[])     => put(HANDLES_STORE, id, v);
export const loadHandles   = (id: string)                                 => get<FileSystemFileHandle[]>(HANDLES_STORE, id);
export const removeHandles = (id: string)                                 => del(HANDLES_STORE, id);

// Raw file content (for drag-drop / file-input sessions without FSAPI handles)
export type FileDataMap = Record<string, ArrayBuffer>;
export const saveFileData   = (id: string, v: FileDataMap) => put(DATA_STORE, id, v);
export const loadFileData   = (id: string)                 => get<FileDataMap>(DATA_STORE, id);
export const removeFileData = (id: string)                 => del(DATA_STORE, id);
