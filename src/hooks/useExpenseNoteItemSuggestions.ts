import { useCallback, useRef, useState } from 'react';
import { searchExpenseNoteItems } from '../lib/expenseNoteService';
import { getActiveExpenseNoteSegment } from '../utils/expenseNoteParser';

export type ExpenseNoteSuggestItem = { id: string; display_name: string; category_name?: string };

export function applyExpenseNoteSuggestion(rawText: string, caret: number, name: string): string {
  const before = rawText.slice(0, caret);
  const after = rawText.slice(caret);
  const lastComma = before.lastIndexOf(',');
  const head = lastComma >= 0 ? `${before.slice(0, lastComma + 1)} ` : '';
  return `${head}${name}${after.trim() ? `, ${after.replace(/^\s*,\s*/, '')}` : ''}`.replace(/^\s*,\s*/, '');
}

export function useExpenseNoteItemSuggestions(userId: string | undefined) {
  const [suggestions, setSuggestions] = useState<ExpenseNoteSuggestItem[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const refresh = useCallback(
    (text: string, caret: number) => {
      if (!userId) return;
      const segment = getActiveExpenseNoteSegment(text, caret).trim();
      if (segment.length < 2) {
        setSuggestions([]);
        return;
      }
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        searchExpenseNoteItems(userId, segment)
          .then(setSuggestions)
          .catch(() => setSuggestions([]));
      }, 150);
    },
    [userId]
  );

  const clear = useCallback(() => setSuggestions([]), []);
  return { suggestions, refresh, clear };
}
