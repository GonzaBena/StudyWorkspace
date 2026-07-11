import { useEffect } from 'react';
import { SHORTCUTS, type ShortcutAction } from '../config/shortcuts';

export type ShortcutHandlers = Partial<Record<ShortcutAction, () => void>>;

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      if ((e.target as HTMLElement).tagName === 'TEXTAREA') return;

      for (const s of SHORTCUTS) {
        if (e.key !== s.key) continue;
        if (s.ctrl  !== undefined && s.ctrl  !== e.ctrlKey)  continue;
        if (s.meta  !== undefined && s.meta  !== e.metaKey)  continue;
        if (s.shift !== undefined && s.shift !== e.shiftKey) continue;

        const handler = handlers[s.action];
        if (handler) {
          e.preventDefault();
          handler();
          return;
        }
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
}
