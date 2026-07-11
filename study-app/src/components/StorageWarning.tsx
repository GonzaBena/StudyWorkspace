import { useState, useEffect } from 'react';
import styles from './StorageWarning.module.css';

export default function StorageWarning() {
  const [usagePct, setUsagePct] = useState<number | null>(null);

  useEffect(() => {
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then(({ usage, quota }) => {
        if (usage && quota) {
          setUsagePct((usage / quota) * 100);
        }
      });
    }
  }, []);

  if (usagePct === null || usagePct < 75) return null;

  return (
    <div className={styles.warning}>
      ⚠️ El almacenamiento local está casi lleno ({usagePct.toFixed(1)}%). Considera eliminar sesiones antiguas para liberar espacio y evitar errores.
    </div>
  );
}
