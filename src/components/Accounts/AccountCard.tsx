import React from 'react';
import { Edit2, Trash2, Wallet } from 'lucide-react';
import { Account, Transaction } from '../../types';
import { getAccountColor } from '../../utils/accountIcons';

interface AccountCardProps {
  account: Account;
  transactions: Transaction[];
  onEditAccount: (account: Account) => void;
  onDeleteAccount: (account: Account) => void;
  formatCurrency: (amount: number, currency: string) => string;
}

export const AccountCard: React.FC<AccountCardProps> = React.memo(({
  account,
  transactions,
  onEditAccount,
  onDeleteAccount,
  formatCurrency
}) => {
  const accountTransactions = transactions.filter(t => t.account_id === account.id);
  const dpsSavingsAccount = transactions.find(t => t.account_id === account.dps_savings_account_id);
  const isDpsSavingsAccount = account.dps_savings_account_id ? true : false;

  return (
    <div 
      id={`account-${account.id}`}
      className={`
        bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm
        hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600
        transition-all duration-200 ease-in-out
      `}
      role="article"
      aria-labelledby={`account-name-${account.id}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div 
            className={`w-3 h-3 rounded-full ${account.isActive ? 'bg-green-500' : 'bg-gray-400'}`}
            role="status"
            aria-label={account.isActive ? 'Active account' : 'Inactive account'}
          />
          <div>
            <div 
              id={`account-name-${account.id}`}
              className="text-sm font-medium text-gray-900 dark:text-white"
            >
              {account.name}
            </div>
            <div className="text-xs">
              <span className={`inline-flex items-center justify-center text-center px-2 py-0.5 rounded-full text-xs font-medium ${getAccountColor(account.type)}`}>
                {account.type === 'cash' ? 'Cash Wallet' : account.type.charAt(0).toUpperCase() + account.type.slice(1)}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {formatCurrency(account.calculated_balance, account.currency)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{account.currency}</div>
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {accountTransactions.length} transactions
          </span>
          {account.has_dps && (
            <span 
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
              role="status"
              aria-label="DPS account"
            >
              DPS
            </span>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onEditAccount(account)}
            className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            title="Edit account"
            aria-label={`Edit ${account.name} account`}
          >
            <Edit2 className="w-4 h-4" />
          </button>
          {!isDpsSavingsAccount && account.type !== 'cash' && (
            <button
              onClick={() => onDeleteAccount(account)}
              className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Delete account"
              aria-label={`Delete ${account.name} account`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

AccountCard.displayName = 'AccountCard'; 

