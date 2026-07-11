import styles from './DarkModeToggle.module.css';
import own from './DocInvertToggle.module.css';

interface Props {
  inverted: boolean;
  onToggle: () => void;
}

export default function DocInvertToggle({ inverted, onToggle }: Props) {
  return (
    <button
      className={`${styles.toggle} ${own.btn}`}
      onClick={onToggle}
      aria-label={inverted ? 'Documento: modo normal' : 'Documento: modo oscuro'}
      title={inverted ? 'Modo normal del documento' : 'Invertir colores del documento'}
    >
      <span className={`${own.page} ${inverted ? own.pageInverted : ''}`} />
    </button>
  );
}
