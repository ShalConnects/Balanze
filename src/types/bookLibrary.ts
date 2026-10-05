export type BookReadingStatus = 'unread' | 'reading' | 'read';
export type BookOwnershipFilter = 'all' | 'want' | 'have';
export type BookStatusFilter = 'all' | BookReadingStatus;

export const BOOK_TITLE_MAX = 200;
export const BOOK_AUTHOR_MAX = 120;
export const BOOK_NOTE_MAX = 1000;

export const BOOK_READING_STATUS_LABELS: Record<BookReadingStatus, string> = {
  unread: 'Unread',
  reading: 'Reading',
  read: 'Read'
};

export const BOOK_OWNERSHIP_FILTER_LABELS: Record<BookOwnershipFilter, string> = {
  all: 'All',
  want: 'Want',
  have: 'Have'
};

export const BOOK_STATUS_FILTER_LABELS: Record<BookStatusFilter, string> = {
  all: 'All',
  unread: 'Unread',
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

export function bookFilterOptions<T extends string>(labels: Record<T, string>) {
  return (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value] }));
}
