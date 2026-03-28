import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { History } from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useAuthStore } from '../../store/authStore';
import { formatCurrency } from '../../utils/currency';
import {
  type TransactionHistoryEntry,
  formatHistoryActorLabel,
  formatHistoryFieldValue,
  transactionHistoryFieldLabel,
} from '../../utils/transactionHistoryUtils';

export const TransactionEditHistory: React.FC<{
  transactionId: string;
  currency: string;
  currentAmount: number;
}> = ({ transactionId, currency, currentAmount }) => {
  const fetchHistory = useFinanceStore((s) => s.fetchTransactionEditHistory);
  const { user } = useAuthStore();
  const [history, setHistory] = useState<TransactionHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

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
      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 animate-pulse">
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
      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 text-sm text-red-600 dark:text-red-400 flex flex-wrap items-center gap-2">
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
      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
        No edits recorded yet. Future changes will appear here.
      </div>
    );
  }

  return (
    <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-2">
        <History className="w-4 h-4 text-gray-500" aria-hidden />
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Edit History</span>
      </div>
      <div className="space-y-1.5 text-sm">
        {history.map((h) => {
          const actor = formatHistoryActorLabel(h.updated_by, user?.id);
          return (
            <div
              key={h.id ? String(h.id) : `${h.field_name}-${h.updated_at}`}
              className="flex flex-wrap items-center gap-x-2 gap-y-1 text-gray-700 dark:text-gray-300"
            >
              <span className="font-medium">{transactionHistoryFieldLabel(h.field_name)}:</span>
              <span>{formatHistoryFieldValue(h.field_name, h.old_value, currency)}</span>
              <span className="text-gray-400">→</span>
              <span>{formatHistoryFieldValue(h.field_name, h.new_value, currency)}</span>
              <span className="text-xs text-gray-500">{format(new Date(h.updated_at), 'MMM dd, h:mm a')}</span>
              {actor && <span className="text-xs text-gray-500">· {actor}</span>}
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
