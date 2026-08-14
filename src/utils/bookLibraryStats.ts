import type { BookLibraryFilter, BookLibraryItem } from '../types/bookLibrary';

export function getBookLibraryStats(books: BookLibraryItem[]) {
  let owned = 0;
  let reading = 0;
  let read = 0;
  for (const book of books) {
    if (book.owned) owned += 1;
    if (book.reading_status === 'reading') reading += 1;
    if (book.reading_status === 'read') read += 1;
  }
  return { total: books.length, owned, want: books.length - owned, reading, read };
}

export function bookMatchesFilter(book: BookLibraryItem, filter: BookLibraryFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'want') return !book.owned;
  if (filter === 'have') return book.owned;
  return book.reading_status === filter;
}

export function sortBooksByTitle(books: BookLibraryItem[]) {
  return [...books].sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));
}
