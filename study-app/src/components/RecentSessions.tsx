import { useEffect, useRef } from 'react';
import { animate, stagger } from 'animejs';
import type { Session } from '../types';
import styles from './RecentSessions.module.css';

interface Props {
  sessions: Session[];
  onResume: (session: Session) => void;
  onDelete: (id: string) => void;
}

function formatDate(ts: number): string {
  return new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(ts);
}

function sessionProgress(session: Session): number {
  if (!session.files.length) return 0;
  return session.currentFileIndex / session.files.length;
}

export default function RecentSessions({ sessions, onResume, onDelete }: Props) {
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!listRef.current) return;
    animate(listRef.current.children, {
      opacity: [0, 1],
      translateX: [-20, 0],
      duration: 600,
      delay: stagger(80),
      easing: 'easeOutExpo',
    });
  }, [sessions]);

  if (!sessions.length) return null;

  return (
    <section className={styles.section}>
      <h3 className={styles.heading}>Sesiones recientes</h3>
      <ul ref={listRef} className={styles.list}>
        {sessions.map(s => {
          const pct = Math.round(sessionProgress(s) * 100);
          return (
            <li key={s.id} className={styles.item}>
              <button className={styles.resumeBtn} onClick={() => onResume(s)}>
                <span className={styles.name}>{s.name}</span>
                <span className={styles.meta}>
                  {s.files.length} archivo{s.files.length !== 1 ? 's' : ''} · {formatDate(s.updatedAt)}
                </span>
                <div className={styles.bar}>
                  <div
                    className={styles.barFill}
                    style={{ width: `${pct}%`, background: `hsl(${pct * 1.2}, 85%, 55%)` }}
                  />
                </div>
              </button>
              <button
                className={styles.deleteBtn}
                onClick={() => onDelete(s.id)}
                aria-label="Eliminar sesión"
              >×</button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
