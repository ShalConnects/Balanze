import React from 'react';
import { Account, Transaction } from '../../types';
import { getAccountAllTimeSummary } from '../../utils/transactionUtils';
import { getAccountColor } from '../../utils/accountIcons';
import { formatCurrency } from '../../utils/currency';

interface AccountInfoPanelProps {
  account: Account;
  transactions: Transaction[];
  onPrintStatement: () => void;
  compact?: boolean;
}

export const AccountInfoPanel: React.FC<AccountInfoPanelProps> = ({
  account,
  transactions,
  onPrintStatement,
  compact = false
}) => {
  const { count } = getAccountAllTimeSummary(account.id, transactions);
  return (
    <>
      <div><b>Name:</b> {account.name.charAt(0).toUpperCase() + account.name.slice(1)}</div>
      <div><b>Type:</b> <span className={`inline-flex items-center px-2 rounded-full text-xs font-medium ${getAccountColor(account.type)} ml-1 ${compact ? 'py-0.5' : 'py-1'}`}>
        {account.type === 'cash' ? 'Cash Wallet' : account.type.charAt(0).toUpperCase() + account.type.slice(1)}
      </span></div>
      <div><b>Initial Balance:</b> {formatCurrency(Number(account.initial_balance), account.currency)}</div>
      <div><b>Currency:</b> {account.currency}</div>
      <div><b>Description:</b> {account.description || 'N/A'}</div>
      <div><b>Transactions:</b> {count}</div>
      <div><b>Donation Preference:</b> None</div>

      <div className={compact ? 'mt-3 sm:mt-4 p-2 bg-blue-50 rounded-lg border border-blue-200' : 'mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200'}>
        <div className={`font-semibold text-blue-900 mb-1 ${compact ? 'text-xs' : 'text-sm'}`}>Current Balance</div>
        <div className={`font-bold text-blue-600 ${compact ? 'text-sm sm:text-base' : 'text-lg'}`}>{formatCurrency(account.calculated_balance || 0, account.currency)}</div>
      </div>
      <div className={compact ? 'mt-2 sm:mt-3' : 'mt-4'}>
        <button onClick={onPrintStatement} className={`w-full bg-gradient-primary text-white rounded-lg hover:bg-gradient-primary-hover transition-colors ${compact ? 'px-2 py-1.5 text-xs' : 'px-4 py-3 text-sm font-medium'}`}>
          Print Statement
        </button>
      </div>
    </>
  );
};
