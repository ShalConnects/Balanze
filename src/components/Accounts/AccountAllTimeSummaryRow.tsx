import React from 'react';
import { Account, Transaction } from '../../types';
import { getAccountAllTimeSummary } from '../../utils/transactionUtils';
import { formatCurrency } from '../../utils/currency';
import { format } from 'date-fns';

interface Props {
  account: Account;
  transactions: Transaction[];
}

export const AccountAllTimeSummaryRow: React.FC<Props> = ({ account, transactions }) => {
  const { totalIncome, totalExpenses, firstDate, lastDate } = getAccountAllTimeSummary(account.id, transactions);
  return (
    <div className="w-full min-w-0 px-2 sm:px-3 py-2 mb-2 bg-gray-100 rounded-lg border border-gray-200 text-xs sm:text-sm flex flex-wrap gap-x-3 gap-y-1">
      <span className="font-semibold text-gray-800">All-Time Summary</span>
      <span className="text-green-600">Income: {formatCurrency(totalIncome, account.currency)}</span>
      <span className="text-red-600">Expenses: {formatCurrency(totalExpenses, account.currency)}</span>
      {firstDate && <span className="text-gray-600">First Tx: {format(new Date(firstDate), 'MMM d, yyyy')}</span>}
      {lastDate && <span className="text-gray-600">Last Tx: {format(new Date(lastDate), 'MMM d, yyyy')}</span>}
    </div>
  );
};
