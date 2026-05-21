import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../../store/authStore';
import { MAX_TRANSACTION_NOTE_LENGTH } from '../../constants/transactionNote';
import { EXPENSE_NOTE_RAW_MAX } from '../../constants/expenseNote';
import { ExpenseNoteParseHint, ExpenseNoteParsedPreviewTable } from './expenseNoteCompactUi';
import {
  deleteExpenseNoteDocument,
  loadExpenseNoteDocument,
  saveExpenseNoteDocument,
  searchExpenseNoteItems,
} from '../../lib/expenseNoteService';
import {
  buildExpenseNoteSummary,
  getActiveExpenseNoteSegment,
  parseExpenseNoteText,
  sumExpenseNoteLines,
} from '../../utils/expenseNoteParser';

interface TransactionNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId: string;
  currentNote: string | undefined;
  onSave: (note: string) => Promise<void>;
}

export const TransactionNoteModal: React.FC<TransactionNoteModalProps> = ({
  isOpen,
  onClose,
  transactionId,
  currentNote,
  onSave,
}) => {
  const { user } = useAuthStore();
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);
  const [bootLoading, setBootLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<{ id: string; display_name: string; category_name?: string }[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestTimer = useRef<ReturnType<typeof setTimeout>>();

  const parsedLines = useMemo(() => parseExpenseNoteText(rawText), [rawText]);
  const lineTotal = useMemo(() => sumExpenseNoteLines(parsedLines), [parsedLines]);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setBootLoading(true);
    try {
      const doc = await loadExpenseNoteDocument(user.id, transactionId);
      setRawText(doc?.rawText ?? currentNote ?? '');
    } catch {
      setRawText(currentNote || '');
    } finally {
      setBootLoading(false);
    }
  }, [user?.id, transactionId, currentNote]);

  useEffect(() => {
    if (isOpen) {
      load();
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen, load]);

  const refreshSuggestions = (text: string, caret: number) => {
    if (!user?.id) return;
    const segment = getActiveExpenseNoteSegment(text, caret).trim();
    if (segment.length < 2) {
      setSuggestions([]);
      return;
    }
    clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => {
      searchExpenseNoteItems(user.id, segment).then(setSuggestions);
    }, 150);
  };

  const applySuggestion = (name: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const caret = el.selectionStart ?? rawText.length;
    const before = rawText.slice(0, caret);
    const after = rawText.slice(caret);
    const lastComma = before.lastIndexOf(',');
    const head = lastComma >= 0 ? before.slice(0, lastComma + 1) + ' ' : '';
    setRawText(`${head}${name}${after.trim() ? ', ' + after.replace(/^\s*,\s*/, '') : ''}`.replace(/^\s*,\s*/, ''));
    setSuggestions([]);
    setTimeout(() => el.focus(), 0);
  };

  const handleSave = async () => {
    if (!user?.id) return;
    if (rawText.length > EXPENSE_NOTE_RAW_MAX) {
      toast.error(`Note cannot exceed ${EXPENSE_NOTE_RAW_MAX} characters`);
      return;
    }
    const trimmed = rawText.trim();
    setLoading(true);
    try {
      if (!trimmed) {
        await deleteExpenseNoteDocument(transactionId);
        await onSave('');
        onClose();
        toast.success('Note deleted');
        return;
      }
      const summary = await saveExpenseNoteDocument(user.id, transactionId, {
        rawText: trimmed,
        lines: parsedLines,
      });
      await onSave(summary || buildExpenseNoteSummary(parsedLines));
      onClose();
      toast.success('Note saved');
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
      await deleteExpenseNoteDocument(transactionId);
      await onSave('');
      onClose();
      toast.success('Note deleted');
    } catch {
      toast.error('Failed to delete note');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const charCount = rawText.length;
  const isOverLimit = charCount > EXPENSE_NOTE_RAW_MAX;
  const hasContent = rawText.trim().length > 0 || (currentNote && currentNote.trim().length > 0);

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100]" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-[101] pointer-events-none p-3 sm:p-4">
        <div
          role="dialog"
          aria-modal="true"
          className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 w-full max-w-lg shadow-2xl pointer-events-auto max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
              {hasContent ? 'Expense note' : 'Add expense note'}
            </h3>
            <button type="button" onClick={onClose} disabled={loading} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg" aria-label="Close">
              <X className="w-4 h-4" />
            </button>
          </div>

          {bootLoading ? (
            <div className="py-8 text-center text-sm text-gray-500 animate-pulse">Loading…</div>
          ) : (
            <>
              <div className="mb-2 relative">
                <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">Items (comma-separated)</label>
                <textarea
                  ref={textareaRef}
                  value={rawText}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v.length <= EXPENSE_NOTE_RAW_MAX) {
                      setRawText(v);
                      refreshSuggestions(v, e.target.selectionStart ?? v.length);
                    }
                  }}
                  onClick={(e) => refreshSuggestions(rawText, e.currentTarget.selectionStart ?? 0)}
                  onKeyUp={(e) => refreshSuggestions(rawText, e.currentTarget.selectionStart ?? 0)}
                  placeholder="Toast 43, Egg 12 138, Chicken 218x160"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none min-h-[88px]"
                  rows={3}
                  disabled={loading}
                />
                {suggestions.length > 0 && (
                  <ul className="absolute left-0 right-0 top-full z-10 mt-1 max-h-36 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg">
                    {suggestions.map((s) => (
                      <li key={s.id}>
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            applySuggestion(s.display_name);
                          }}
                        >
                          {s.display_name}
                          {s.category_name && <span className="text-gray-400 ml-1">· {s.category_name}</span>}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <span className={`text-xs mt-1 block ${isOverLimit ? 'text-red-500' : 'text-gray-500'}`}>
                  {charCount}/{MAX_TRANSACTION_NOTE_LENGTH}
                </span>
                <ExpenseNoteParseHint lines={parsedLines} className="mt-1" />
              </div>

              {parsedLines.length > 0 && (
                <div className="mb-3">
                  <ExpenseNoteParsedPreviewTable lines={parsedLines} lineTotal={lineTotal} />
                </div>
              )}
            </>
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
              <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={loading || isOverLimit || bootLoading}
                className="px-4 py-2 text-sm text-white bg-gradient-primary rounded-lg disabled:opacity-50"
              >
                {loading ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
