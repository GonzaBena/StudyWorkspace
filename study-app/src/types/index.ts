export type AppView = 'home' | 'reader';

export interface PdfFile {
  id: string;
  name: string;
  currentPage: number;
  maxPage: number;      // furthest page reached — drives progress bars
  totalPages: number;
  url?: string;
  completed?: boolean;
}

export interface SessionStats {
  pomodorosCompleted: number;
  totalWorkTime: number; // in seconds
  totalBreakTime: number; // in seconds
  timePerFile: Record<string, number>; // fileId -> seconds spent
}

export interface Session {
  id: string;
  name: string;
  files: PdfFile[];
  currentFileIndex: number;
  createdAt: number;
  updatedAt: number;
  hasHandles?: boolean;
  hasFileData?: boolean;
  stats?: SessionStats;
}
