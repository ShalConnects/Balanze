import React from 'react';
import { Edit2, Trash2, Plus, Info, ChevronRight } from 'lucide-react';
import { Account, Transaction } from '../../types';
import { getAccountColor } from '../../utils/accountIcons';
import { AccountCard } from './AccountCard';
import { formatCurrency } from '../../utils/accountUtils';

interface AccountMobileViewProps {
  accounts: Account[];
  transactions: Transaction[];
  onEditAccount: (account: Account) => void;
  onDeleteAccount: (account: Account) => void;
  onAddAccount: () => void;
  onShowInfo: (account: Account) => void;
  onAddTransaction: (accountId: string) => void;
}

export const AccountMobileView: React.FC<AccountMobileViewProps> = React.memo(({
  accounts,
  transactions,
  onEditAccount,
  onDeleteAccount,
  onAddAccount,
  onShowInfo,
  onAddTransaction
}) => {
  if (accounts.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <Plus className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No accounts yet</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
          Start managing your finances by adding your first account
        </p>
        <button
          onClick={onAddAccount}
          className="bg-gradient-primary text-white px-6 py-3 rounded-lg hover:bg-gradient-primary-hover transition-colors flex items-center justify-center mx-auto"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Your First Account
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">

      {/* Account Cards */}
      <div className="space-y-3">
        {accounts.map((account) => {
          const accountTransactions = transactions.filter(t => t.account_id === account.id);
          const isDpsSavingsAccount = account.dps_savings_account_id ? true : false;
          // Alternative condition - check if it's a DPS account
          const isDpsAccount = account.has_dps || account.dps_savings_account_id;

          return (
            <div
              key={account.id}
              id={`account-${account.id}`}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-all duration-200"
            >
              {/* Account Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div 
                    className={`w-3 h-3 rounded-full ${account.isActive ? 'bg-green-500' : 'bg-gray-400'}`}
                    role="status"
                    aria-label={account.isActive ? 'Active account' : 'Inactive account'}
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
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

              {/* Account Stats */}
              <div className="flex items-center justify-between mb-3 text-xs text-gray-500 dark:text-gray-400">
                <span>{accountTransactions.length} transactions</span>
                {account.has_dps && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                    DPS Active
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onShowInfo(account)}
                    className="flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium"
                  >
                    <Info className="w-4 h-4 mr-1" />
                    Details
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
                
                <div className="flex items-center space-x-2">
                  {!isDpsSavingsAccount && (
                    <button
                      onClick={() => onAddTransaction(account.id)}
                      className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="Add transaction"
                      aria-label={`Add transaction to ${account.name}`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => onEditAccount(account)}
                    className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Edit account"
                    aria-label={`Edit ${account.name} account`}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  
                  {!isDpsAccount && account.type !== 'cash' && (
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
        })}
      </div>

      {/* Quick Stats Footer */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Quick Stats</h3>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Active Accounts:</span>
            <span className="ml-1 font-medium text-gray-900 dark:text-white">
              {accounts.filter(a => a.isActive).length}
            </span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Total Transactions:</span>
            <span className="ml-1 font-medium text-gray-900 dark:text-white">
              {transactions.length}
            </span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">DPS Accounts:</span>
            <span className="ml-1 font-medium text-gray-900 dark:text-white">
              {accounts.filter(a => a.has_dps).length}
            </span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Total Balance:</span>
            <span className="ml-1 font-medium text-gray-900 dark:text-white">
              {formatCurrency(
                accounts.reduce((sum, a) => sum + a.calculated_balance, 0),
                accounts[0]?.currency || 'USD'
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

AccountMobileView.displayName = 'AccountMobileView'; 

