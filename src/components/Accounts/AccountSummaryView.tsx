import React, { useMemo, useState } from 'react';
import { Copy } from 'lucide-react';
import { Account, Transaction } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { getAccountAllTimeSummary } from '../../utils/transactionUtils';
import { formatAppDate } from '../../utils/timezoneUtils';
import { groupAccountsByCurrency } from '../../utils/accountUtils';
export const AccountSummaryModalContent: React.FC<{
  accounts: Account[];
  transactions: Transaction[];
}> = ({ accounts, transactions }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyText = async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(prev => (prev === key ? null : prev)), 1200);
    } catch {
      // Ignore clipboard failure in compact summary action.
    }
  };

  const groups = useMemo(() => groupAccountsByCurrency(accounts), [accounts]);
  const summaries = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getAccountAllTimeSummary>>();
    for (const account of accounts) map.set(account.id, getAccountAllTimeSummary(account.id, transactions));
    return map;
  }, [accounts, transactions]);

  if (accounts.length === 0) {
    return (
      <div className="py-16 text-center px-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No account records found</h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
          Start tracking your financial accounts by adding your first account
        </p>
      </div>
    );
  }

  return (
    <div className="max-h-[70vh] overflow-y-auto p-3 sm:p-4 space-y-4">
      {groups.map(({ currency, accounts: currencyAccounts, total }) => (
        <section key={currency} className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              {currency} ({currencyAccounts.length})
            </div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              Total: {formatCurrency(total, currency)}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currencyAccounts.map(account => {
              const summary = summaries.get(account.id);
              return (
                <article
                  key={account.id}
                  className={`rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-gray-50/40 dark:bg-gray-800/40 ${
                    account.isActive ? '' : 'opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {account.name.charAt(0).toUpperCase() + account.name.slice(1)}
                        </h3>
                        {!account.isActive ? (
                          <span className="text-[11px] text-gray-400">Inactive</span>
                        ) : null}
                      </div>
                    </div>
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => void copyText(formatCurrency(account.calculated_balance || 0, currency), `balance-${account.id}`)}
                        className="flex items-center justify-end gap-1 rounded px-1 py-0.5 hover:bg-gray-100 dark:hover:bg-gray-700/40 transition-colors"
                        aria-label="Copy balance"
                        title="Copy balance"
                      >
                        <p className="font-bold text-blue-600 dark:text-blue-400">
                          {formatCurrency(account.calculated_balance || 0, currency)}
                        </p>
                        {copiedKey === `balance-${account.id}` ? (
                          <span className="text-[11px] text-green-600 dark:text-green-400">Copied</span>
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  <dl className="mt-3 space-y-1 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-gray-500 dark:text-gray-400">Description</dt>
                      <dd className="text-right text-gray-900 dark:text-white">
                        <button
                          type="button"
                          onClick={() => void copyText(account.description || 'No description', `desc-${account.id}`)}
                          className="inline-flex items-center gap-1 rounded px-1 py-0.5 hover:bg-gray-100 dark:hover:bg-gray-700/40 transition-colors"
                          aria-label="Copy description"
                          title="Copy description"
                        >
                          <span>{account.description || 'No description'}</span>
                          {copiedKey === `desc-${account.id}` ? (
                            <span className="text-[11px] text-green-600 dark:text-green-400">Copied</span>
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400" />
                          )}
                        </button>
                      </dd>
                    </div>
                    {account.has_dps ? (
                      <div className="flex justify-between gap-3">
                        <dt className="text-gray-500 dark:text-gray-400">DPS</dt>
                        <dd className="text-right text-gray-900 dark:text-white">
                          {account.dps_type ? `Enabled (${account.dps_type})` : 'Enabled'}
                        </dd>
                      </div>
                    ) : null}
                    {summary ? (
                      <div className="flex justify-between gap-3">
                        <dt className="text-gray-500 dark:text-gray-400">Activity</dt>
                        <dd className="text-right text-gray-900 dark:text-white">
                          {summary.count} tx{summary.count === 1 ? '' : 's'}
                          {summary.lastDate ? ` · ${formatAppDate(summary.lastDate)}` : ''}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                </article>
              );
            })}
          </div>
        </section>
      ))}
      <div className="sr-only" aria-live="polite">
        {copiedKey ? 'Copied to clipboard' : ''}
      </div>
    </div>
  );
};
