import { Page } from 'react-pdf';
import { Bookmark, X } from 'lucide-react';
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
        <Bookmark size={14} fill={isBookmarked ? 'currentColor' : 'none'} />
        {isBookmarked ? 'Quitar marca' : 'Marcar'} página {currentPage}
      </button>

      <div className={styles.grid}>
        {bookmarks.length === 0 ? (
          <p className={styles.empty}>No hay páginas marcadas.</p>
        ) : (
          bookmarks.map(page => (
            <div
              key={page}
              className={`${styles.card} ${page === currentPage ? styles.cardActive : ''}`}
            >
              <button className={styles.thumbBtn} onClick={() => onJumpToPage(page)}>
                <Page
                  pageNumber={page}
                  width={120}
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                />
              </button>
              <div className={styles.cardFooter}>
                <span className={styles.pageLabel}>Pág. {page}</span>
                <button className={styles.removeBtn} onClick={() => onToggle(page)} title="Quitar marca">
                  <X size={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
