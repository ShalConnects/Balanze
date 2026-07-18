import React, { useEffect, useState } from 'react';
import { ChevronDown, History } from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useAuthStore } from '../../store/authStore';
import { formatCurrency } from '../../utils/currency';
import { formatTimeUTC } from '../../utils/timezoneUtils';
import {
  type TransactionHistoryEntry,
  formatAmountHistoryDelta,
  formatHistoryActorLabel,
  formatHistoryFieldValue,
  groupTransactionHistoryForDisplay,
  transactionHasAuditTrail,
  transactionHistoryGroupActorNote,
} from '../../utils/transactionHistoryUtils';

const shellClass = (variant: 'panel' | 'embedded') =>
  variant === 'embedded'
    ? 'px-4 py-3 bg-gray-50 dark:bg-gray-800/40'
    : 'px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700';

export const TransactionEditHistory: React.FC<{
  transactionId: string;
  currency: string;
  currentAmount: number;
  variant?: 'panel' | 'embedded';
  hideHeader?: boolean;
}> = ({ transactionId, currency, currentAmount, variant = 'panel', hideHeader = false }) => {
  const fetchHistory = useFinanceStore((s) => s.fetchTransactionEditHistory);
  const accounts = useFinanceStore((s) => s.accounts);
  const { user } = useAuthStore();
  const [history, setHistory] = useState<TransactionHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const accountNameById = Object.fromEntries(accounts.map((a) => [a.id, a.name]));

  useEffect(() => {
    if (!transactionId) return;
    let cancelled = false;
    setLoading(true);
    setFetchError(null);
    fetchHistory(transactionId).then((res) => {
      if (cancelled) return;
      setHistory(res.rows);
      setFetchError(res.error);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [transactionId, fetchHistory, retryToken]);

  if (loading) {
    return (
      <div className={`${shellClass(variant)} animate-pulse`}>
        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          ))}
        </div>
      </div>
    );
  }
  if (fetchError) {
    return (
      <div className={`${shellClass(variant)} text-sm text-red-600 dark:text-red-400 flex flex-wrap items-center gap-2`}>
        <span>Could not load edit history ({fetchError}).</span>
        <button
          type="button"
          className="text-blue-600 dark:text-blue-400 underline"
          onClick={() => setRetryToken((n) => n + 1)}
        >
          Retry
        </button>
      </div>
    );
  }
  if (history.length === 0) {
    return (
      <div className={`${shellClass(variant)} text-sm text-gray-500 dark:text-gray-400`}>
        No edits recorded yet. Future changes will appear here.
      </div>
    );
  }

  return (
    <div className={shellClass(variant)}>
      {!hideHeader && (
        <div className="flex items-center gap-2 mb-2">
          <History className="w-4 h-4 text-gray-500" aria-hidden />
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Edit History</span>
        </div>
      )}
      <div className="space-y-3 text-sm">
        {groupTransactionHistoryForDisplay(history).map((g) => {
          const groupActor = transactionHistoryGroupActorNote(g.items, user?.id);
          return (
            <div key={g.field_name} className="space-y-1">
              <div className="flex flex-wrap items-baseline gap-x-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                <span>{g.label}</span>
                {groupActor && <span className="font-normal text-gray-500">{groupActor}</span>}
              </div>
              {g.items.map((h) => {
                const rowActor = groupActor ? null : formatHistoryActorLabel(h.updated_by, user?.id);
                const amountDelta =
                  h.field_name === 'amount' ? formatAmountHistoryDelta(h.old_value, h.new_value, currency) : null;
                const isAmountRow = g.field_name === 'amount';
                return (
                  <div
                    key={h.id ? String(h.id) : `${h.field_name}-${h.updated_at}`}
                    className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-gray-700 dark:text-gray-300${isAmountRow ? ' text-xs' : ''}`}
                  >
                    <span>{formatHistoryFieldValue(h.field_name, h.old_value, currency, accountNameById)}</span>
                    <span className="text-gray-400">→</span>
                    <span>{formatHistoryFieldValue(h.field_name, h.new_value, currency, accountNameById)}</span>
                    {amountDelta && (
                      <span className="text-xs text-gray-600 dark:text-gray-400">{amountDelta}</span>
                    )}
                    <span className="text-xs text-gray-500">{formatTimeUTC(h.updated_at, 'MMM dd, h:mm a')}</span>
                    {rowActor && <span className="text-xs text-gray-500">· {rowActor}</span>}
                  </div>
                );
              })}
            </div>
          );
        })}
        <div className="pt-1.5 mt-1.5 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500">
          Current total: {formatCurrency(currentAmount, currency)}
        </div>
      </div>
    </div>
  );
};

/** Collapsible edit history for TransactionForm (lazy fetch on expand). */
export const TransactionEditHistorySection: React.FC<{
  transaction: { transaction_id?: string; updated_at?: string; created_at: string };
  currency: string;
  currentAmount: number;
}> = ({ transaction, currency, currentAmount }) => {
  const cache = useFinanceStore((s) => s.transactionHistoryCache);
  const [open, setOpen] = useState(false);
  if (!transactionHasAuditTrail(transaction, cache)) return null;

  const tid = transaction.transaction_id || '';
  const editCount = cache?.get(tid)?.length;

  return (
    <details
      className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary className="flex items-center gap-2 px-4 py-2.5 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50">
        <History className="w-4 h-4 text-gray-500 shrink-0" aria-hidden />
        <span className="text-sm font-medium">Edit history</span>
        {editCount != null && editCount > 0 && (
          <span className="text-xs text-gray-500 dark:text-gray-400">({editCount})</span>
        )}
        <ChevronDown
          className={`ml-auto w-4 h-4 text-gray-500 shrink-0 transition-transform${open ? ' rotate-180' : ''}`}
          aria-hidden
        />
      </summary>
      {open && (
        <TransactionEditHistory
          transactionId={tid}
          currency={currency}
          currentAmount={currentAmount}
          variant="embedded"
          hideHeader
        />
      )}
    </details>
  );
};
