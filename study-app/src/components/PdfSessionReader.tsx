import { useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { Document } from 'react-pdf';
import styles from './PdfSessionReader.module.css';

interface Props {
  url: string;
  onPasswordRequest?: (callback: (password: string) => void, reason: number) => void;
  children: (numPages: number, error: Error | null, loading: boolean) => ReactNode;
}

export default function PdfSessionReader({ url, children, onPasswordRequest }: Props) {
  const [numPages, setNumPages] = useState<number>(0);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  const onLoadSuccess = useCallback(({ numPages: n }: { numPages: number }) => {
    setNumPages(n);
    setLoading(false);
  }, []);

  const onLoadError = useCallback((err: Error) => {
    setError(err);
    setLoading(false);
  }, []);

  return (
    <Document
      file={url}
      onLoadSuccess={onLoadSuccess}
      onLoadError={onLoadError}
      onPassword={onPasswordRequest}
      className={styles.document}
      loading={null}
      error={null}
    >
      {children(numPages, error, loading)}
    </Document>
  );
}
