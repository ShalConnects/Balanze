import React from 'react';
import { Account, Transaction } from '../../types';
import { getAccountAllTimeSummary } from '../../utils/transactionUtils';
import { formatCurrency } from '../../utils/currency';
import { formatAppDate } from '../../utils/timezoneUtils';

interface Props {
  account: Account;
  transactions: Transaction[];
}

export const AccountAllTimeSummaryRow: React.FC<Props> = ({ account, transactions }) => {
  const { totalIncome, totalExpenses, firstDate, lastDate } = getAccountAllTimeSummary(account.id, transactions);
  return (
    <div className="w-full min-w-0 px-2 sm:px-3 py-2 mb-2 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 text-xs sm:text-sm flex flex-wrap gap-x-3 gap-y-1">
      <span className="font-semibold text-gray-800 dark:text-gray-100">All-Time Summary</span>
      <span className="text-green-600 dark:text-green-400">Income: {formatCurrency(totalIncome, account.currency)}</span>
      <span className="text-red-600 dark:text-red-400">Expenses: {formatCurrency(totalExpenses, account.currency)}</span>
      {firstDate && <span className="text-gray-600 dark:text-gray-400">First Tx: {formatAppDate(firstDate)}</span>}
      {lastDate && <span className="text-gray-600 dark:text-gray-400">Last Tx: {formatAppDate(lastDate)}</span>}
    </div>
  );
};
