import React, { useMemo, useState } from 'react';
import { Check, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { SHOPPING_FREQUENCY_OPTIONS } from '../../constants/expenseNote';
import type { ExpenseNoteFmtAmount, ExpenseNoteItem } from '../../types/expenseNote';
import {
  buildShoppingSuggestions,
  estimateSuggestionsBudget,
  formatSuggestionsShareText,
  shoppingTripHelpLines,
  type ShoppingSuggestion,
} from '../../utils/shoppingSuggestions';
import { getShoppingFrequencyDays, setShoppingFrequencyDays } from '../../utils/shoppingFrequencyPrefs';
import { refreshShoppingDueCountFromCache } from '../../utils/shoppingListCache';
import { useAuthStore } from '../../store/authStore';
import { EXPENSE_NOTE_EMPTY, EXPENSE_NOTE_PANEL } from './expenseNoteCompactUi';

const urgencyClass: Record<ShoppingSuggestion['urgency'], string> = {
  out: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
  low: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  ok: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

const urgencyLabel: Record<ShoppingSuggestion['urgency'], string> = {
  out: 'Out',
  low: 'Low',
  ok: 'Due',
};

const SuggestionRow: React.FC<{
  s: ShoppingSuggestion;
  markingId: string | null;
  onMarkPurchased: (item: ExpenseNoteItem) => void;
  onSelectItem: (id: string) => void;
}> = ({ s, markingId, onMarkPurchased, onSelectItem }) => {
  const dueLabel =
    s.daysUntilRunOut < 0
      ? `${Math.abs(s.daysUntilRunOut)}d overdue`
      : s.daysUntilRunOut === 0
        ? 'today'
        : `${s.daysUntilRunOut}d`;
  return (
    <li className="flex items-center gap-2 px-2 py-2 bg-white dark:bg-gray-900 text-xs">
      <button
        type="button"
        title="Mark purchased"
        disabled={markingId === s.item.id}
        onClick={() => onMarkPurchased(s.item)}
        className="shrink-0 p-1 rounded-full border border-gray-300 dark:border-gray-600 hover:bg-green-50 dark:hover:bg-green-900/30 disabled:opacity-40"
      >
        <Check className="w-3.5 h-3.5 text-green-600" />
      </button>
      <button
        type="button"
        onClick={() => onSelectItem(s.item.id)}
        className="flex-1 min-w-0 text-left truncate text-gray-800 dark:text-gray-200 hover:underline"
      >
        {s.item.display_name}
      </button>
      <span className={`shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${urgencyClass[s.urgency]}`}>
        {urgencyLabel[s.urgency]}
      </span>
      <span className="shrink-0 text-gray-500 w-14 text-right">{dueLabel}</span>
    </li>
  );
};

export const ShoppingSuggestionsPanel: React.FC<{
  items: ExpenseNoteItem[];
  purchaseDates: Map<string, string[]>;
  markingId: string | null;
  fmtAmount?: ExpenseNoteFmtAmount;
  onMarkPurchased: (item: ExpenseNoteItem) => void;
  onSelectItem: (id: string) => void;
}> = ({ items, purchaseDates, markingId, fmtAmount, onMarkPurchased, onSelectItem }) => {
  const userId = useAuthStore((s) => s.user?.id);
  const [frequencyDays, setFrequencyDays] = useState(getShoppingFrequencyDays);

  const { suggestions, nextShoppingDate } = useMemo(
    () => buildShoppingSuggestions(items, purchaseDates, frequencyDays),
    [items, purchaseDates, frequencyDays]
  );

  const budgets = useMemo(() => estimateSuggestionsBudget(suggestions), [suggestions]);

  const budgetLabel = useMemo(() => {
    if (!budgets.length) return null;
    return budgets
      .map(({ currency, total }) =>
        fmtAmount ? fmtAmount(total, currency || undefined) : total.toLocaleString(undefined, { maximumFractionDigits: 0 })
      )
      .join(' · ');
  }, [budgets, fmtAmount]);

  const grouped = useMemo(() => {
    const map = new Map<string, ShoppingSuggestion[]>();
    for (const s of suggestions) {
      const key = s.item.category_name || 'Other';
      const list = map.get(key) || [];
      list.push(s);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [suggestions]);

  const setFrequency = (days: number) => {
    setShoppingFrequencyDays(days);
    setFrequencyDays(days);
    if (userId) refreshShoppingDueCountFromCache(userId);
  };

  const share = async () => {
    if (!suggestions.length) return;
    const text = formatSuggestionsShareText(suggestions, nextShoppingDate);
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Shopping list', text });
        return;
      } catch {
        /* fall through */
      }
    }
    await navigator.clipboard.writeText(text);
    toast.success('List copied to clipboard');
  };

  return (
    <div className={`${EXPENSE_NOTE_PANEL} space-y-3`}>
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
        <span>Next shop by</span>
        <strong className="text-gray-800 dark:text-gray-200">
          {nextShoppingDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
        </strong>
        <span className="text-gray-400">·</span>
        <span>Frequency</span>
        {SHOPPING_FREQUENCY_OPTIONS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setFrequency(d)}
            className={`px-2 py-0.5 rounded-full ${frequencyDays === d ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200' : 'bg-gray-100 dark:bg-gray-800'}`}
          >
            {d}d
          </button>
        ))}
        {budgetLabel && (
          <>
            <span className="text-gray-400">·</span>
            <span>
              Est. <strong>{budgetLabel}</strong>
            </span>
          </>
        )}
        {suggestions.length > 0 && (
          <button
            type="button"
            onClick={share}
            className="ml-auto inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
          >
            <Share2 className="w-3 h-3" />
            Share
          </button>
        )}
      </div>

      <details className="text-xs text-gray-500 dark:text-gray-400 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 px-2.5 py-2">
        <summary className="cursor-pointer select-none text-gray-600 dark:text-gray-300 font-medium">How this works</summary>
        <ul className="mt-2 space-y-1 list-disc pl-4">
          {shoppingTripHelpLines(frequencyDays).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </details>

      {suggestions.length > 0 ? (
        <div className="space-y-3 max-h-[min(55vh,480px)] overflow-y-auto">
          {grouped.map(([category, rows]) => (
            <div key={category}>
              <p className="text-[10px] font-medium uppercase text-gray-400 mb-1 px-1">{category}</p>
              <ul className="divide-y divide-gray-100 dark:divide-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                {rows.map((s) => (
                  <SuggestionRow
                    key={s.item.id}
                    s={s}
                    markingId={markingId}
                    onMarkPurchased={onMarkPurchased}
                    onSelectItem={onSelectItem}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p className={EXPENSE_NOTE_EMPTY}>
          Nothing due before your next shop. Add purchase history via transaction notes or quick add.
        </p>
      )}
    </div>
  );
};
