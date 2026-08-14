export type BookReadingStatus = 'unread' | 'reading' | 'read';
export type BookLibraryFilter = 'all' | 'want' | 'have' | 'reading' | 'read';

export const BOOK_READING_STATUS_LABELS: Record<BookReadingStatus, string> = {
  unread: 'Unread',
  reading: 'Reading',
  read: 'Read'
};

export const BOOK_LIBRARY_FILTER_LABELS: Record<BookLibraryFilter, string> = {
  all: 'All',
  want: 'Want',
  have: 'Have',
  reading: 'Reading',
  read: 'Read'
};

export interface BookLibraryItem {
  id: string;
  title: string;
  author?: string;
  owned: boolean;
  reading_status: BookReadingStatus;
  note?: string;
  created_at: string;
}

export type BookLibraryInput = Omit<BookLibraryItem, 'id' | 'created_at'>;
