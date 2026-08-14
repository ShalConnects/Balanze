import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { CustomDropdown } from '../Purchases/CustomDropdown';
import type { BookLibraryInput, BookLibraryItem, BookReadingStatus } from '../../types/bookLibrary';
import { BOOK_READING_STATUS_LABELS } from '../../types/bookLibrary';
import { invModalInputClass } from '../Dashboard/businessInvestmentModalFormTokens';

const emptyForm = (): BookLibraryInput => ({
  title: '',
  author: '',
  owned: false,
  reading_status: 'unread',
  note: ''
});

const readingOptions = (Object.keys(BOOK_READING_STATUS_LABELS) as BookReadingStatus[]).map((value) => ({
  value,
  label: BOOK_READING_STATUS_LABELS[value]
}));

interface BookLibraryFormModalProps {
  open: boolean;
  book: BookLibraryItem | null;
  onClose: () => void;
  onSubmit: (input: BookLibraryInput) => Promise<void>;
}

export const BookLibraryFormModal: React.FC<BookLibraryFormModalProps> = ({ open, book, onClose, onSubmit }) => {
  const [form, setForm] = useState<BookLibraryInput>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(
      book
        ? { title: book.title, author: book.author || '', owned: book.owned, reading_status: book.reading_status, note: book.note || '' }
        : emptyForm()
    );
  }, [open, book]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || saving) return;
    setSaving(true);
    try {
      await onSubmit({
        title: form.title.trim(),
        author: form.author?.trim() || undefined,
        owned: form.owned,
        reading_status: form.reading_status,
        note: form.note?.trim() || undefined
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={saving ? undefined : onClose} />
      <div
        className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">{book ? 'Edit book' : 'Add book'}</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 disabled:opacity-50"
            aria-label="Close form"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <input
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="Title *"
            className={invModalInputClass}
            required
            maxLength={200}
            disabled={saving}
          />
          <input
            value={form.author || ''}
            onChange={(e) => setForm((p) => ({ ...p, author: e.target.value }))}
            placeholder="Author"
            className={invModalInputClass}
            maxLength={120}
            disabled={saving}
          />
          <CustomDropdown
            value={form.reading_status}
            onChange={(value) => setForm((p) => ({ ...p, reading_status: value as BookReadingStatus }))}
            options={readingOptions}
            placeholder="Reading status"
            fullWidth
            disabled={saving}
          />
          <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={form.owned}
              onChange={(e) => setForm((p) => ({ ...p, owned: e.target.checked }))}
              className="rounded border-gray-300 dark:border-gray-600"
              disabled={saving}
            />
            I have this book
          </label>
          <textarea
            value={form.note || ''}
            onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
            placeholder="Optional note"
            rows={3}
            className={`${invModalInputClass} min-h-[80px] h-auto resize-none`}
            maxLength={1000}
            disabled={saving}
          />
          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !form.title.trim()}
              className="px-4 py-2 bg-gradient-primary text-white rounded-lg hover:bg-gradient-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : book ? 'Update' : 'Add book'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
