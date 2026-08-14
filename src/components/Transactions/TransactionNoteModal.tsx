import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../../store/authStore';
import { MAX_TRANSACTION_NOTE_LENGTH } from '../../constants/transactionNote';
import { EXPENSE_NOTE_RAW_MAX } from '../../constants/expenseNote';
import { ExpenseNoteLoadingCaption, ExpenseNoteParseHint, ExpenseNoteParsedPreviewTable, ExpenseNoteSuggestTextarea } from './expenseNoteCompactUi';
import {
  fetchExpenseNoteRawText,
  saveExpenseNoteForTransaction,
} from '../../lib/expenseNoteService';
import { buildExpenseNoteSummary, parseExpenseNoteText, sumExpenseNoteLines } from '../../utils/expenseNoteParser';

interface TransactionNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** When set, loads structured docs. Also saves on commit unless `persist` is false. */
  transactionId?: string;
  /** False: load/draft only; parent persists with the rest of the form. Default true. */
  persist?: boolean;
  currentNote: string | undefined;
  /** Seed raw text for draft mode (e.g. duplicate-from source). */
  draftRawText?: string;
  /** `note` is the summary for `transactions.note`; `rawText` is the item list. */
  onSave: (note: string, rawText?: string) => Promise<void>;
}

export const TransactionNoteModal: React.FC<TransactionNoteModalProps> = ({
  isOpen,
  onClose,
  transactionId,
  persist = true,
  currentNote,
  draftRawText,
  onSave,
}) => {
  const { user } = useAuthStore();
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);
  const [hydrating, setHydrating] = useState(false);
  const [fallthroughGuard, setFallthroughGuard] = useState(false);
  const guardTimer = useRef<ReturnType<typeof window.setTimeout>>();

  const parsedLines = useMemo(() => parseExpenseNoteText(rawText), [rawText]);
  const lineTotal = useMemo(() => sumExpenseNoteLines(parsedLines), [parsedLines]);

  useEffect(() => () => window.clearTimeout(guardTimer.current), []);

  // Seed immediately (no empty flash). Draft mode trusts parent text and does not refetch.
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    const fallback = draftRawText || currentNote || '';
    setRawText(fallback);
    if (!persist || !transactionId || !user?.id) return;

    setHydrating(true);
    void fetchExpenseNoteRawText(user.id, transactionId)
      .then((raw) => {
        if (!cancelled) setRawText(raw ?? fallback);
      })
      .catch(() => {
        if (!cancelled) setRawText(fallback);
      })
      .finally(() => {
        if (!cancelled) setHydrating(false);
      });

    return () => {
      cancelled = true;
    };
    // Intentionally omit currentNote: re-hydrate only when open target changes, not when list note updates
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate per open/target
  }, [isOpen, persist, transactionId, user?.id, draftRawText]);

  const dismiss = () => {
    if (!persist) {
      setFallthroughGuard(true);
      window.clearTimeout(guardTimer.current);
      guardTimer.current = window.setTimeout(() => setFallthroughGuard(false), 350);
    }
    onClose();
  };

  const commit = async (summary: string, raw: string) => {
    await onSave(summary, raw);
    dismiss();
  };

  /** Summary + list update first; structured doc syncs in background unless parent will persist. */
  const finish = async (summary: string, raw: string, okMsg: string) => {
    if (persist && transactionId && user?.id) {
      void saveExpenseNoteForTransaction(user.id, transactionId, raw).catch((e) => {
        console.error(e);
        toast.error('Failed to sync expense note');
      });
    }
    await commit(summary, raw);
    toast.success(persist ? okMsg : raw ? 'Note added' : 'Note removed');
  };

  const handleSave = async () => {
    if (rawText.length > EXPENSE_NOTE_RAW_MAX) {
      toast.error(`Note cannot exceed ${EXPENSE_NOTE_RAW_MAX} characters`);
      return;
    }
    const trimmed = rawText.trim();
    setLoading(true);
    try {
      const summary = trimmed ? buildExpenseNoteSummary(parsedLines) || trimmed : '';
      await finish(summary, trimmed, trimmed ? 'Note saved' : 'Note deleted');
    } catch (e) {
      console.error(e);
      toast.error('Failed to save note');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await finish('', '', 'Note deleted');
    } catch {
      toast.error('Failed to delete note');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen && !fallthroughGuard) return null;
  if (!isOpen) {
    return createPortal(<div className="fixed inset-0 z-[102]" aria-hidden />, document.body);
  }

  const charCount = rawText.length;
  const isOverLimit = charCount > EXPENSE_NOTE_RAW_MAX;
  const hasContent = rawText.trim().length > 0 || (currentNote && currentNote.trim().length > 0);

  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100]"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          dismiss();
        }}
      />
      <div className="fixed inset-0 flex items-center justify-center z-[101] pointer-events-none p-3 sm:p-4">
        <div
          role="dialog"
          aria-modal="true"
          className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 w-full max-w-lg shadow-2xl pointer-events-auto max-h-[90vh] overflow-y-auto"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
              {hasContent ? 'Expense note' : 'Add expense note'}
            </h3>
            <button type="button" onClick={dismiss} disabled={loading} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg" aria-label="Close">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mb-2">
            <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">Items (comma-separated)</label>
            <ExpenseNoteLoadingCaption active={hydrating} className="mb-1.5" />
            <ExpenseNoteSuggestTextarea
              value={rawText}
              onChange={setRawText}
              userId={user?.id}
              disabled={loading || hydrating}
              maxLength={EXPENSE_NOTE_RAW_MAX}
              rows={3}
              placeholder="Toast 43, Egg 12 138, Chicken 218x160"
              textareaClassName={`w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none min-h-[88px] ${hydrating ? 'opacity-60 animate-pulse' : ''}`}
            />
            <span className={`text-xs mt-1 block ${isOverLimit ? 'text-red-500' : 'text-gray-500'}`}>
              {charCount}/{MAX_TRANSACTION_NOTE_LENGTH}
            </span>
            {!hydrating && <ExpenseNoteParseHint lines={parsedLines} className="mt-1" />}
          </div>

          {!hydrating && parsedLines.length > 0 && (
            <div className="mb-3">
              <ExpenseNoteParsedPreviewTable lines={parsedLines} lineTotal={lineTotal} />
            </div>
          )}

          <div className="flex items-center justify-between gap-2 mt-4">
            <div>
              {hasContent && (
                <button type="button" onClick={handleDelete} disabled={loading} className="px-3 py-2 text-sm text-red-600 flex items-center gap-1.5 disabled:opacity-50">
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={dismiss} disabled={loading} className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={loading || isOverLimit || hydrating}
                className="px-4 py-2 text-sm text-white bg-gradient-primary rounded-lg disabled:opacity-50"
              >
                {loading ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};
