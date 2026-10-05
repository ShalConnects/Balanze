import type {
  BookLibraryItem,
  BookOwnershipFilter,
  BookStatusFilter
} from '../types/bookLibrary';

export function getBookLibraryStats(books: BookLibraryItem[]) {
  let owned = 0;
  let unread = 0;
  let reading = 0;
  let read = 0;
  for (const book of books) {
    if (book.owned) owned += 1;
    if (book.reading_status === 'unread') unread += 1;
    else if (book.reading_status === 'reading') reading += 1;
    else if (book.reading_status === 'read') read += 1;
  }
  return { total: books.length, owned, want: books.length - owned, unread, reading, read };
}

export function bookMatchesFilters(
  book: BookLibraryItem,
  ownership: BookOwnershipFilter,
  status: BookStatusFilter
): boolean {
  if (ownership === 'want' && book.owned) return false;
  if (ownership === 'have' && !book.owned) return false;
  if (status !== 'all' && book.reading_status !== status) return false;
  return true;
}

export function sortBooksByTitle(books: BookLibraryItem[]) {
  return [...books].sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));
}
