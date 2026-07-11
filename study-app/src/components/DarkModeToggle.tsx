import { useEffect, useRef } from 'react';
import { animate } from 'animejs';
import styles from './DarkModeToggle.module.css';

interface Props {
  isDark: boolean;
  onToggle: () => void;
}

export default function DarkModeToggle({ isDark, onToggle }: Props) {
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!btnRef.current) return;
    animate(btnRef.current, {
      rotate: [0, 360],
      duration: 500,
      easing: 'easeOutBack',
    });
  }, [isDark]);

  return (
    <button
      ref={btnRef}
      className={styles.toggle}
      onClick={onToggle}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={isDark ? 'Modo claro' : 'Modo oscuro'}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}
