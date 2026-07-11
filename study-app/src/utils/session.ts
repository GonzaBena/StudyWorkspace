import type { Session } from '../types';

const KEY = 'study-sessions';
const MAX = 5;

export function getSessions(): Session[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveSession(session: Session): void {
  const rest = getSessions().filter(s => s.id !== session.id);
  const updated = [{ ...session, updatedAt: Date.now() }, ...rest].slice(0, MAX);
  localStorage.setItem(KEY, JSON.stringify(updated));
}

export function removeSession(id: string): void {
  localStorage.setItem(KEY, JSON.stringify(getSessions().filter(s => s.id !== id)));
}
