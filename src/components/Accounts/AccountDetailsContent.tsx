import React, { useMemo } from 'react';
import { Account, Transaction } from '../../types';
import { groupTransactionsByDate } from '../../utils/transactionUtils';
import { formatCurrency } from '../../utils/currency';
import { formatTransactionDescription } from '../../utils/transactionDescriptionFormatter';
import { AccountAllTimeSummaryRow } from './AccountAllTimeSummaryRow';
import { AccountInfoPanel } from './AccountInfoPanel';

export interface AccountDetailsContentProps {
  account: Account;
  transactions: Transaction[];
  onPrintStatement: () => void;
  /** Modal: viewport-sized overlay panel. Inline: full-width embed in expanded row (responsive, scrollable). */
  variant: 'modal' | 'inline';
  onClose?: () => void;
  /** Rendered below Account Info / Print in the sidebar; inline variant only. */
  inlineSidebarFooter?: React.ReactNode;
}

export const AccountDetailsContent: React.FC<AccountDetailsContentProps> = ({
  account,
  transactions,
  onPrintStatement,
  variant,
  onClose,
  inlineSidebarFooter,
}) => {
  const { accountTransactions, groupedTransactions, balanceMap } = useMemo(() => {
    const accountTxs = transactions
      .filter(t => t.account_id === account.id)
      .sort((a, b) => {
        const aT = a.updated_at ? Math.max(new Date(a.created_at).getTime(), new Date(a.updated_at).getTime()) : new Date(a.created_at).getTime();
        const bT = b.updated_at ? Math.max(new Date(b.created_at).getTime(), new Date(b.updated_at).getTime()) : new Date(b.created_at).getTime();
        return bT - aT;
      });
    const sorted = [...accountTxs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const map = new Map<string, number>();
    let balance = Number(account.initial_balance);
    sorted.forEach(tx => {
      balance += tx.type === 'income' ? tx.amount : -tx.amount;
      map.set(tx.id, balance);
    });
    return {
      accountTransactions: accountTxs,
      groupedTransactions: groupTransactionsByDate(accountTxs),
      balanceMap: map,
    };
  }, [account.id, account.initial_balance, transactions]);

  const rootClass =
    variant === 'modal'
      ? 'relative flex flex-col bg-white dark:bg-gray-900 shadow-2xl w-full h-[100dvh] sm:h-auto sm:max-h-[calc(100vh-2rem)] sm:rounded-lg sm:max-w-6xl overflow-hidden'
      : 'relative flex flex-col w-full max-w-none bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden max-h-[min(85vh,880px)] min-h-0';

  return (
    <div className={rootClass} style={variant === 'modal' ? { paddingTop: 'env(safe-area-inset-top, 0px)' } : undefined}>
      {variant === 'modal' && (
        <div className="flex-shrink-0 flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1 min-w-0">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">{account.name}</h2>
            <div className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-0.5 sm:mt-1">
              {formatCurrency(account.calculated_balance || 0, account.currency)}
            </div>
          </div>
          {onClose && (
            <button type="button" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-2 ml-2 flex-shrink-0" onClick={onClose} aria-label="Close">
              ✕
            </button>
          )}
        </div>
      )}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0 p-3 sm:p-4 overflow-hidden">
          <h3 className="text-sm sm:text-base font-bold mb-2 text-gray-900 dark:text-white">Transactions</h3>
          <AccountAllTimeSummaryRow account={account} transactions={transactions} />
          <div className="flex-1 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden mt-2 min-h-0 flex flex-col bg-white dark:bg-gray-950/30">
            <div className="flex-1 overflow-y-auto overscroll-contain min-h-[180px] sm:min-h-[260px] max-h-[50vh] lg:max-h-none">
              {accountTransactions.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">No transactions found</div>
              ) : (
                <table className="w-full border-collapse">
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {groupedTransactions.map(([label, group]) => (
                      <React.Fragment key={label}>
                        <tr className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                          <td colSpan={6} className="px-2 sm:px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">{label}</h4>
                          </td>
                        </tr>
                        {group.map(t => (
                          <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/80">
                            <td className="px-1 sm:px-2 py-2 text-xs text-gray-900 dark:text-gray-100 hidden sm:table-cell">
                              {new Date(t.date).toLocaleDateString()}
                            </td>
                            <td className="px-1 sm:px-2 py-2 text-xs font-medium text-gray-900 dark:text-gray-100 min-w-0 max-w-[120px] sm:max-w-none truncate">
                              {formatTransactionDescription(t.description)}
                            </td>
                            <td className="px-1 sm:px-2 py-2 text-xs text-gray-500 dark:text-gray-400 hidden md:table-cell">{t.category}</td>
                            <td className="px-1 sm:px-2 py-2 text-xs">
                              <span
                                className={`inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full ${
                                  t.type === 'income'
                                    ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200'
                                    : 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200'
                                }`}
                              >
                                {t.type}
                              </span>
                            </td>
                            <td className="px-1 sm:px-2 py-2 text-xs text-right font-medium whitespace-nowrap">
                              <span className={t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                {t.type === 'income' ? '+' : '-'}
                                {formatCurrency(t.amount, account.currency)}
                              </span>
                            </td>
                            <td className="px-1 sm:px-2 py-2 text-xs text-right text-blue-600 dark:text-blue-400 font-medium hidden lg:table-cell">
                              {formatCurrency(balanceMap.get(t.id) || 0, account.currency)}
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 w-full lg:w-64 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700 p-3 sm:p-4 overflow-y-auto max-h-[40vh] lg:max-h-none">
          <h3 className="text-sm sm:text-base font-bold mb-2 text-gray-900 dark:text-white">Account Info</h3>
          <div className="p-2 sm:p-3 bg-gray-50 dark:bg-gray-800/60 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="space-y-1.5 sm:space-y-2 text-xs text-gray-800 dark:text-gray-200">
              <AccountInfoPanel account={account} transactions={transactions} onPrintStatement={onPrintStatement} compact />
            </div>
          </div>
          {variant === 'inline' && inlineSidebarFooter}
        </div>
      </div>
    </div>
  );
};
