import styles from './BookmarksPanel.module.css';

interface Props {
  currentPage: number;
  bookmarks: number[];
  onToggle: (page: number) => void;
  onJumpToPage: (page: number) => void;
}

export default function BookmarksPanel({ currentPage, bookmarks, onToggle, onJumpToPage }: Props) {
  const isBookmarked = bookmarks.includes(currentPage);

  return (
    <div className={styles.panel}>
      <button
        className={`${styles.toggleBtn} ${isBookmarked ? styles.toggleBtnActive : ''}`}
        onClick={() => onToggle(currentPage)}
      >
        <span className={styles.star}>{isBookmarked ? '★' : '☆'}</span>
        {isBookmarked ? 'Quitar marca' : 'Marcar'} página {currentPage}
      </button>

      <div className={styles.list}>
        {bookmarks.length === 0 ? (
          <p className={styles.empty}>No hay páginas marcadas.</p>
        ) : (
          bookmarks.map(page => (
            <div
              key={page}
              className={`${styles.item} ${page === currentPage ? styles.itemActive : ''}`}
            >
              <button className={styles.jumpBtn} onClick={() => onJumpToPage(page)}>
                <span className={styles.starSmall}>★</span> Página {page}
              </button>
              <button className={styles.removeBtn} onClick={() => onToggle(page)} title="Quitar marca">
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
