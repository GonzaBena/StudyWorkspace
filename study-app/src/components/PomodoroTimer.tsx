import { useState, useEffect, useCallback } from 'react';
import styles from './PomodoroTimer.module.css';

export default function PomodoroTimer() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isWork, setIsWork] = useState(true);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      const nextMode = !isWork;
      setIsWork(nextMode);
      setTimeLeft(nextMode ? 25 * 60 : 5 * 60);
      setIsActive(false);
      alert(nextMode ? '¡Tiempo de estudiar!' : '¡Tiempo de descanso!');
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, isWork]);

  const toggle = useCallback(() => setIsActive(a => !a), []);
  const reset = useCallback(() => {
    setIsActive(false);
    setTimeLeft(isWork ? 25 * 60 : 5 * 60);
  }, [isWork]);
  const switchMode = useCallback(() => {
    setIsActive(false);
    setIsWork(w => !w);
    setTimeLeft(!isWork ? 25 * 60 : 5 * 60);
  }, [isWork]);

  const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const secs = (timeLeft % 60).toString().padStart(2, '0');

  return (
    <div className={styles.pomodoro}>
      <button className={styles.mode} onClick={switchMode} title="Cambiar modo">
        {isWork ? '🧠 Trabajo' : '☕ Descanso'}
      </button>
      <div className={styles.timer}>{mins}:{secs}</div>
      <div className={styles.controls}>
        <button onClick={toggle} className={styles.btn} title={isActive ? 'Pausar' : 'Iniciar'}>{isActive ? '⏸' : '▶'}</button>
        <button onClick={reset} className={styles.btn} title="Reiniciar">🔄</button>
      </div>
    </div>
  );
}
