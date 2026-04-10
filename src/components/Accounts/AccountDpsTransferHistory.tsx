import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { ArrowRight } from 'lucide-react';
import { Account } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { formatTimeUTC } from '../../utils/timezoneUtils';

export type DpsTransferHistoryRow = {
  id: string;
  from_account_id: string;
  to_account_id: string;
  amount: number;
  date: string;
  created_at?: string;
  from_account?: { name: string; currency?: string } | null;
  to_account?: { name: string; currency?: string } | null;
};

const MAX_ROWS = 10;

interface AccountDpsTransferHistoryProps {
  account: Account;
  accounts: Account[];
  dpsSavingsAccount: Account | undefined;
  isDpsSavingsAccount: boolean;
  dpsTransfers: DpsTransferHistoryRow[];
  /** Tighter top spacing when stacked under another block (e.g. modal) */
  embedded?: boolean;
  /** Optional header action (e.g. open DPS transfer) */
  onDpsTransfer?: () => void;
}

export const AccountDpsTransferHistory: React.FC<AccountDpsTransferHistoryProps> = ({
  account,
  accounts,
  dpsSavingsAccount,
  isDpsSavingsAccount,
  dpsTransfers,
  embedded = false,
  onDpsTransfer,
}) => {
  const rows = useMemo(() => {
    if (!account.has_dps && !isDpsSavingsAccount) return [];
    const ids = new Set<string>([account.id]);
    if (dpsSavingsAccount) ids.add(dpsSavingsAccount.id);
    return dpsTransfers
      .filter(t => ids.has(t.from_account_id) || ids.has(t.to_account_id))
      .slice(0, MAX_ROWS);
  }, [account.id, account.has_dps, isDpsSavingsAccount, dpsSavingsAccount, dpsTransfers]);

  if (!account.has_dps && !isDpsSavingsAccount) return null;

  const currencyFor = (accountId: string, nested?: { currency?: string } | null) =>
    nested?.currency ?? accounts.find(a => a.id === accountId)?.currency ?? 'USD';

  return (
    <div
      className={
        embedded
          ? 'pt-4 border-t border-gray-200 dark:border-gray-700'
          : 'mt-4 pt-4 border-t border-gray-200 dark:border-gray-700'
      }
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white">DPS transfer history</h4>
        {onDpsTransfer && (
          <button
            type="button"
            onClick={onDpsTransfer}
            className="shrink-0 text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
          >
            DPS transfer
          </button>
        )}
      </div>
      {rows.length === 0 ? (
        <p className="text-xs text-gray-500 dark:text-gray-400 italic">No DPS transfers yet</p>
      ) : (
        <div className="space-y-2 max-h-40 overflow-y-auto pr-0.5">
          {rows.map(t => {
            const fromCur = currencyFor(t.from_account_id, t.from_account);
            return (
              <div key={t.id} className="bg-purple-50/80 dark:bg-purple-900/20 rounded-lg p-2.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 min-w-0 flex-1">
                    <span className="font-medium text-gray-900 dark:text-white truncate">
                      {t.from_account?.name ?? accounts.find(a => a.id === t.from_account_id)?.name ?? '—'}
                    </span>
                    <ArrowRight className="h-3 w-3 text-gray-400 shrink-0" />
                    <span className="font-medium text-gray-900 dark:text-white truncate">
                      {t.to_account?.name ?? accounts.find(a => a.id === t.to_account_id)?.name ?? '—'}
                    </span>
                  </div>
                  <span className="text-gray-500 dark:text-gray-400 shrink-0 tabular-nums">
                    {format(new Date(t.date), 'MMM d')}
                    {t.created_at ? ` • ${formatTimeUTC(t.created_at, 'h:mm a')}` : ''}
                  </span>
                </div>
                <div className="mt-1 text-purple-700 dark:text-purple-300 font-medium tabular-nums">
                  {formatCurrency(Number(t.amount), fromCur)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
