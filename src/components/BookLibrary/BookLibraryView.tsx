import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bookmark, BookOpen, CheckCircle2, Circle, Edit2, Filter, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../../store/authStore';
import {
  BOOK_OWNERSHIP_FILTER_LABELS,
  BOOK_READING_STATUS_LABELS,
  BOOK_STATUS_FILTER_LABELS,
  bookFilterOptions,
  type BookLibraryInput,
  type BookLibraryItem,
  type BookOwnershipFilter,
  type BookReadingStatus,
  type BookStatusFilter
} from '../../types/bookLibrary';
import {
  BOOK_LIBRARY_CHANGED_EVENT,
  deleteBookLibraryItem,
  fetchBookLibrary,
  insertBookLibraryItem,
  updateBookLibraryItem
} from '../../lib/bookLibraryService';
import { bookMatchesFilters, getBookLibraryStats, sortBooksByTitle } from '../../utils/bookLibraryStats';
import { includesNormalized, normalizeSearchText } from '../../utils/searchText';
import {
  CASHFLOW_INCOME_CHIP_CLASS,
  THEME_ACCENT_TEXT_CLASS,
  THEME_BRAND_GRADIENT_TEXT_CLASS,
  THEME_MUTED_CAPTION_CLASS
} from '../../constants/appThemeClasses';
import {
  LP_SEARCH_ACTIVE_STYLE,
  ListPageClearFiltersButton,
  ListPageErrorBanner,
  ListPageFilterSearchField,
  ListPageFilterSelect,
  ListPageMobileFilterChip,
  ListPageMobileFilterModal,
  ListPageMobileFilterSection,
  listPageMobileFilterIconButtonClass
} from '../common/listPage/listPageLayout';
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';
import { QuotePageSkeleton } from '../Quotes/QuoteSkeleton';
import { BookLibraryFormModal } from './BookLibraryFormModal';

const readingChip: Record<BookReadingStatus, string> = {
  unread: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  reading: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  read: CASHFLOW_INCOME_CHIP_CLASS
};

const statusPill = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
const summaryCardClass = 'bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 px-2';

const ownershipOptions = bookFilterOptions(BOOK_OWNERSHIP_FILTER_LABELS);
const statusOptions = bookFilterOptions(BOOK_STATUS_FILTER_LABELS);

type BookStats = ReturnType<typeof getBookLibraryStats>;

const summaryCards: {
  label: string;
  key: keyof BookStats;
  ownership: BookOwnershipFilter;
  status: BookStatusFilter;
  Icon: typeof BookOpen;
  caption: (s: BookStats) => string;
}[] = [
  { label: 'Titles', key: 'total', ownership: 'all', status: 'all', Icon: BookOpen, caption: () => 'In your library' },
  { label: 'Have', key: 'owned', ownership: 'have', status: 'all', Icon: Bookmark, caption: (s) => `${s.want} want` },
  { label: 'Unread', key: 'unread', ownership: 'all', status: 'unread', Icon: Circle, caption: () => 'Not started' },
  { label: 'Reading', key: 'reading', ownership: 'all', status: 'reading', Icon: BookOpen, caption: () => 'In progress' },
  { label: 'Read', key: 'read', ownership: 'all', status: 'read', Icon: CheckCircle2, caption: () => 'Finished' }
];

export const BookLibraryView: React.FC = () => {
  const { user } = useAuthStore();
  const [books, setBooks] = useState<BookLibraryItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [ownership, setOwnership] = useState<BookOwnershipFilter>('all');
  const [status, setStatus] = useState<BookStatusFilter>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BookLibraryItem | null>(null);
  const [toDelete, setToDelete] = useState<BookLibraryItem | null>(null);
  const [showMobileFilterMenu, setShowMobileFilterMenu] = useState(false);
  const [tempOwnership, setTempOwnership] = useState<BookOwnershipFilter>('all');
  const [tempStatus, setTempStatus] = useState<BookStatusFilter>('all');
  const skipNextRefresh = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadError(null);
      setBooks([]);
      if (!user?.id) {
        setHydrated(true);
        return;
      }
      try {
        const data = await fetchBookLibrary(user.id);
        if (!cancelled) setBooks(data);
      } catch (err) {
        console.error(err);
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Failed to load books');
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const refresh = () => {
      if (skipNextRefresh.current) {
        skipNextRefresh.current = false;
        return;
      }
      fetchBookLibrary(user.id)
        .then(setBooks)
        .catch((err) => toast.error(err instanceof Error ? err.message : 'Failed to refresh books'));
    };
    window.addEventListener(BOOK_LIBRARY_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(BOOK_LIBRARY_CHANGED_EVENT, refresh);
  }, [user?.id]);

  const visibleBooks = useMemo(() => {
    const q = normalizeSearchText(debouncedSearch);
    return books.filter(
      (book) =>
        bookMatchesFilters(book, ownership, status) &&
        (includesNormalized(book.title, q) || includesNormalized(book.author, q) || includesNormalized(book.note, q))
    );
  }, [books, ownership, status, debouncedSearch]);

  const stats = useMemo(() => getBookLibraryStats(books), [books]);
  const searchPending = searchTerm !== debouncedSearch;
  const hasFilters = searchTerm.trim().length > 0 || ownership !== 'all' || status !== 'all';

  const clearFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setOwnership('all');
    setStatus('all');
  };

  const applySummary = (nextOwnership: BookOwnershipFilter, nextStatus: BookStatusFilter) => {
    setOwnership(nextOwnership);
    setStatus(nextStatus);
  };

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (book: BookLibraryItem) => {
    setEditing(book);
    setFormOpen(true);
  };

  const handleSave = useCallback(
    async (input: BookLibraryInput) => {
      skipNextRefresh.current = true;
      try {
        if (editing) {
          await updateBookLibraryItem(editing.id, input);
          setBooks((prev) => sortBooksByTitle(prev.map((b) => (b.id === editing.id ? { ...b, ...input } : b))));
          toast.success('Book updated');
        } else {
          const created = await insertBookLibraryItem(input);
          setBooks((prev) => sortBooksByTitle([created, ...prev]));
          toast.success('Book added');
        }
        setFormOpen(false);
        setEditing(null);
      } catch (err) {
        skipNextRefresh.current = false;
        console.error(err);
        toast.error(err instanceof Error ? err.message : 'Failed to save book');
        throw err;
      }
    },
    [editing]
  );

  const handleDelete = async () => {
    if (!toDelete) return;
    skipNextRefresh.current = true;
    try {
      await deleteBookLibraryItem(toDelete.id);
      setBooks((prev) => prev.filter((b) => b.id !== toDelete.id));
      toast.success('Book removed');
    } catch (err) {
      skipNextRefresh.current = false;
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Failed to remove book');
      throw err;
    }
  };

  const renderStatus = (book: BookLibraryItem) => (
    <div className="flex flex-wrap items-center gap-1.5">
      <span
        className={`${statusPill} ${
          book.owned ? CASHFLOW_INCOME_CHIP_CLASS : 'bg-amber-100 text-amber-900 dark:bg-amber-900/35 dark:text-amber-200'
        }`}
      >
        {book.owned ? 'Have' : 'Want'}
      </span>
      <span className={`${statusPill} ${readingChip[book.reading_status]}`}>
        {BOOK_READING_STATUS_LABELS[book.reading_status]}
      </span>
    </div>
  );

  const renderActions = (book: BookLibraryItem) => (
    <div className="flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => openEdit(book)}
        className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
        title="Edit book"
        aria-label="Edit book"
      >
        <Edit2 className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => setToDelete(book)}
        className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
        title="Delete book"
        aria-label="Delete book"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  const emptyBody = (
    <>
      <BookOpen className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {hasFilters ? 'No books found' : 'No books yet'}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-sm mx-auto px-4">
        {hasFilters ? 'Try adjusting your search terms or filters' : 'Add your first book to start tracking your library'}
      </p>
      {!hasFilters ? (
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-primary hover:bg-gradient-primary-hover text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add book</span>
        </button>
      ) : null}
    </>
  );

  if (!hydrated) return <QuotePageSkeleton />;

  return (
    <div className="max-w-full mx-auto">
      <div className="space-y-6">
        {loadError ? <ListPageErrorBanner title="Could not load books" message={loadError} /> : null}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 pb-[13px] lg:pb-0">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1" style={{ marginBottom: 0 }}>
              <ListPageFilterSearchField value={searchTerm} onChange={setSearchTerm} placeholder="Search books..." pending={searchPending} />
              <div className="md:hidden flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setTempOwnership(ownership);
                    setTempStatus(status);
                    setShowMobileFilterMenu(true);
                  }}
                  className={listPageMobileFilterIconButtonClass(hasFilters)}
                  style={hasFilters ? LP_SEARCH_ACTIVE_STYLE : undefined}
                  title="Filters"
                  aria-label="Filters"
                >
                  <Filter className="w-4 h-4" />
                </button>
              </div>
              <div className="md:hidden">
                <button
                  type="button"
                  onClick={openAdd}
                  className="bg-gradient-primary text-white px-2 py-1.5 rounded-md hover:bg-gradient-primary-hover transition-colors flex items-center justify-center text-[13px] h-8 w-8"
                  title="Add book"
                  aria-label="Add book"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="md:hidden">{hasFilters ? <ListPageClearFiltersButton onClick={clearFilters} /> : null}</div>
              <div className="hidden md:flex items-center gap-x-2">
                <ListPageFilterSelect
                  value={ownership}
                  onChange={(v) => setOwnership(v as BookOwnershipFilter)}
                  options={ownershipOptions}
                  highlight={ownership !== 'all'}
                  ariaLabel="Ownership"
                />
                <ListPageFilterSelect
                  value={status}
                  onChange={(v) => setStatus(v as BookStatusFilter)}
                  options={statusOptions}
                  highlight={status !== 'all'}
                  ariaLabel="Reading status"
                />
                {hasFilters ? <ListPageClearFiltersButton onClick={clearFilters} /> : null}
              </div>
              <div className="flex-grow" />
              <button
                type="button"
                onClick={openAdd}
                className="hidden md:flex bg-gradient-primary text-white px-3 py-1.5 h-8 rounded-md hover:bg-gradient-primary-hover transition-colors items-center space-x-1.5 text-[13px]"
                title="Add book"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add book</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 p-3">
            {summaryCards.map(({ label, key, ownership: nextO, status: nextS, Icon, caption }) => {
              const active = ownership === nextO && status === nextS;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => applySummary(nextO, nextS)}
                  className={`${summaryCardClass} w-full text-left ${active ? 'border-blue-200 dark:border-blue-700' : ''}`}
                  style={active ? LP_SEARCH_ACTIVE_STYLE : undefined}
                  aria-pressed={active}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-left min-w-0">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</p>
                      <p className={THEME_BRAND_GRADIENT_TEXT_CLASS} style={{ fontSize: '1.2rem' }}>
                        {stats[key]}
                      </p>
                      <p className={THEME_MUTED_CAPTION_CLASS} style={{ fontSize: '11px' }}>
                        {caption(stats)}
                      </p>
                    </div>
                    <Icon className={`${THEME_ACCENT_TEXT_CLASS} flex-shrink-0`} style={{ width: '1.2rem', height: '1.2rem' }} />
                  </div>
                </button>
              );
            })}
          </div>

          {visibleBooks.length === 0 ? (
            <div className="p-12 text-center">{emptyBody}</div>
          ) : (
            <div className="overflow-x-auto lg:rounded-b-xl" style={{ borderBottomLeftRadius: '0.75rem', borderBottomRightRadius: '0.75rem' }}>
              <div className="hidden lg:block max-h-[500px] overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900 text-[14px]">
                  <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {visibleBooks.map((book) => (
                      <tr key={book.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-[0.7rem] min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{book.title}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{book.author || '—'}</div>
                          {book.note ? (
                            <div className="text-xs text-gray-400 dark:text-gray-500 line-clamp-1 mt-0.5">{book.note}</div>
                          ) : null}
                        </td>
                        <td className="px-6 py-[0.7rem]">{renderStatus(book)}</td>
                        <td className="px-6 py-[0.7rem]">{renderActions(book)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="lg:hidden max-h-[500px] overflow-y-auto">
                <div className="space-y-4 px-2.5">
                  {visibleBooks.map((book) => (
                    <div
                      key={book.id}
                      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                    >
                      <div className="p-3 sm:p-4">
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                          <div className="col-span-2">
                            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Book</div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{book.title}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">{book.author || '—'}</div>
                            {book.note ? (
                              <div className="text-xs text-gray-400 dark:text-gray-500 line-clamp-2 mt-1">{book.note}</div>
                            ) : null}
                          </div>
                          <div>
                            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Status</div>
                            {renderStatus(book)}
                          </div>
                          <div>
                            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Actions</div>
                            <div className="flex justify-start">{renderActions(book)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <ListPageMobileFilterModal
        open={showMobileFilterMenu}
        onBackdropClick={() => setShowMobileFilterMenu(false)}
        onApply={() => {
          setOwnership(tempOwnership);
          setStatus(tempStatus);
          setShowMobileFilterMenu(false);
        }}
        onClearAll={() => {
          clearFilters();
          setShowMobileFilterMenu(false);
        }}
        applyActive={tempOwnership !== ownership || tempStatus !== status}
      >
        <ListPageMobileFilterSection label="Ownership">
          {ownershipOptions.map((opt) => (
            <ListPageMobileFilterChip
              key={opt.value}
              selected={tempOwnership === opt.value}
              onClick={() => setTempOwnership(opt.value)}
            >
              {opt.label}
            </ListPageMobileFilterChip>
          ))}
        </ListPageMobileFilterSection>
        <ListPageMobileFilterSection label="Reading status" borderBottom={false}>
          {statusOptions.map((opt) => (
            <ListPageMobileFilterChip
              key={opt.value}
              selected={tempStatus === opt.value}
              onClick={() => setTempStatus(opt.value)}
            >
              {opt.label}
            </ListPageMobileFilterChip>
          ))}
        </ListPageMobileFilterSection>
      </ListPageMobileFilterModal>

      <BookLibraryFormModal open={formOpen} book={editing} onClose={() => setFormOpen(false)} onSubmit={handleSave} />
      <DeleteConfirmationModal
        isOpen={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        title="Delete book?"
        message="This removes the book from your library. This cannot be undone."
        recordDetails={toDelete ? <p className="text-sm font-medium text-gray-900 dark:text-white">{toDelete.title}</p> : undefined}
        confirmLabel="Delete book"
      />
    </div>
  );
};
