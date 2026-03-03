import React, { useMemo } from 'react';
import { Account, Transaction } from '../../types';
import { groupTransactionsByDate } from '../../utils/transactionUtils';
import { formatCurrency } from '../../utils/currency';
import { formatTransactionDescription } from '../../utils/transactionDescriptionFormatter';
import { AccountAllTimeSummaryRow } from './AccountAllTimeSummaryRow';
import { AccountInfoPanel } from './AccountInfoPanel';

interface AccountDetailsModalProps {
  account: Account;
  transactions: Transaction[];
  onClose: () => void;
  onPrintStatement: () => void;
}

export const AccountDetailsModal: React.FC<AccountDetailsModalProps> = ({
  account,
  transactions,
  onClose,
  onPrintStatement
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
      balanceMap: map
    };
  }, [account.id, account.initial_balance, transactions]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 lg:items-start lg:pt-16">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="relative flex flex-col bg-white shadow-2xl w-full h-[100dvh] sm:h-auto sm:max-h-[calc(100vh-2rem)] sm:rounded-lg sm:max-w-6xl overflow-hidden" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex-1 min-w-0">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{account.name}</h2>
            <div className="text-sm font-bold text-blue-600 mt-0.5 sm:mt-1">{formatCurrency(account.calculated_balance || 0, account.currency)}</div>
          </div>
          <button className="text-gray-500 hover:text-gray-700 p-2 ml-2 flex-shrink-0" onClick={onClose} aria-label="Close">✕</button>
        </div>
        {/* Content */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
          <div className="flex-1 flex flex-col min-h-0 p-3 sm:p-4 overflow-hidden">
            <h3 className="text-sm sm:text-base font-bold mb-2">Transactions</h3>
            <AccountAllTimeSummaryRow account={account} transactions={transactions} />
            <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden mt-2 min-h-0 flex flex-col">
              <div className="flex-1 overflow-y-auto overscroll-contain min-h-[200px] sm:min-h-[300px]">
                {accountTransactions.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-500 text-sm">No transactions found</div>
                ) : (
                  <table className="w-full border-collapse">
                    <tbody className="bg-white divide-y divide-gray-200">
                      {groupedTransactions.map(([label, group]) => (
                        <React.Fragment key={label}>
                          <tr className="bg-gray-50 sticky top-0 z-10">
                            <td colSpan={6} className="px-2 sm:px-3 py-2 border-b border-gray-200">
                              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">{label}</h4>
                            </td>
                          </tr>
                          {group.map((t) => (
                            <tr key={t.id} className="hover:bg-gray-50">
                              <td className="px-1 sm:px-2 py-2 text-xs text-gray-900 hidden sm:table-cell">{new Date(t.date).toLocaleDateString()}</td>
                              <td className="px-1 sm:px-2 py-2 text-xs font-medium text-gray-900 min-w-0 max-w-[120px] sm:max-w-none truncate">{formatTransactionDescription(t.description)}</td>
                              <td className="px-1 sm:px-2 py-2 text-xs text-gray-500 hidden md:table-cell">{t.category}</td>
                              <td className="px-1 sm:px-2 py-2 text-xs">
                                <span className={`inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full ${t.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{t.type}</span>
                              </td>
                              <td className="px-1 sm:px-2 py-2 text-xs text-right font-medium whitespace-nowrap">
                                <span className={t.type === 'income' ? 'text-green-600' : 'text-red-600'}>{t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, account.currency)}</span>
                              </td>
                              <td className="px-1 sm:px-2 py-2 text-xs text-right text-blue-600 font-medium hidden lg:table-cell">{formatCurrency(balanceMap.get(t.id) || 0, account.currency)}</td>
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
          <div className="flex-shrink-0 lg:w-64 border-t lg:border-t-0 lg:border-l border-gray-200 p-3 sm:p-4 overflow-y-auto">
            <h3 className="text-sm sm:text-base font-bold mb-2">Account Info</h3>
            <div className="p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="space-y-1.5 sm:space-y-2 text-xs">
                <AccountInfoPanel account={account} transactions={transactions} onPrintStatement={onPrintStatement} compact />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
