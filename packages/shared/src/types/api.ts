export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ComicFilters {
  genres?: string[];
  size?: string;
  search?: string;
  authorId?: string;
  status?: string;
}

export type WSEventType = 
  | 'progress_sync'
  | 'achievement_unlocked'
  | 'reading_started'
  | 'reading_finished'
  | 'choice_made';

export interface WSEvent<T = unknown> {
  type: WSEventType;
  payload: T;
  timestamp: Date;
}

export interface ProgressSyncPayload {
  comicId: string;
  pageId: string;
  progress: number;
}
