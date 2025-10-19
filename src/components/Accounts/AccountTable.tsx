import React, { useMemo, useState } from 'react';
import { Edit2, Trash2, InfoIcon, PlusCircle, Wallet, ChevronUp, ChevronDown } from 'lucide-react';
import { Account, Transaction } from '../../types';
import { getAccountColor } from '../../utils/accountIcons';

interface AccountTableProps {
  accounts: Account[];
  transactions: Transaction[];
  expandedRows: Set<string>;
  onToggleRow: (accountId: string) => void;
  onEditAccount: (account: Account) => void;
  onDeleteAccount: (account: Account) => void;
  onAddTransaction: (accountId: string) => void;
  onShowInfo: (account: Account) => void;
  onUpdateAccount: (accountId: string, updates: any) => Promise<void>;
  onMoveAccountUp: (accountId: string) => Promise<void>;
  onMoveAccountDown: (accountId: string) => Promise<void>;
  isRearrangeMode: boolean;
  formatCurrency: (amount: number, currency: string) => string;
}

export const AccountTable: React.FC<AccountTableProps> = React.memo(({
  accounts,
  transactions,
  expandedRows,
  onToggleRow,
  onEditAccount,
  onDeleteAccount,
  onAddTransaction,
  onShowInfo,
  onUpdateAccount,
  onMoveAccountUp,
  onMoveAccountDown,
  isRearrangeMode,
  formatCurrency
}) => {

  // Memoize expensive calculations
  const accountData = useMemo(() => {
    return accounts.map(account => {
      const accountTransactions = transactions
        .filter(t => t.account_id === account.id)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const incomeTransactions = accountTransactions.filter(t => t.type === 'income');
      const expenseTransactions = accountTransactions.filter(t => t.type === 'expense');
      
      // Calculate total saved and donated
      let totalSaved = 0;
      let totalDonated = 0;
      incomeTransactions.forEach(t => {
        const income = t.amount;
        if (t.category === 'Savings') {
          totalSaved += income;
        } else if (t.category === 'Donation') {
          totalDonated += income;
        }
      });
      
      // Get DPS savings account
      const dpsSavingsAccount = accounts.find(a => a.id === account.dps_savings_account_id);
      
      // Check if this account is a DPS savings account
      const isDpsSavingsAccount = accounts.some(otherAccount => 
        otherAccount.dps_savings_account_id === account.id
      );

      return {
        account,
        accountTransactions,
        incomeTransactions,
        expenseTransactions,
        totalSaved,
        totalDonated,
        dpsSavingsAccount,
        isDpsSavingsAccount
      };
    });
  }, [accounts, transactions]);

  const isRowExpanded = (accountId: string) => expandedRows.has(accountId);

  if (accountData.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <Wallet className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No accounts found</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
          Start managing your finances by adding your first account
        </p>
      </div>
    );
  }

  return (
    <table className="hidden md:table min-w-full divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900 text-[14px]">
      <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10 shadow-sm">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Account Name
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Type
          </th>
          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
            Currency
          </th>
          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
            Balance
          </th>
          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
            Transactions
          </th>
          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
            DPS
          </th>
          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
        {accountData.map((data, index) => {
          const { account, accountTransactions, incomeTransactions, expenseTransactions, totalSaved, totalDonated, dpsSavingsAccount, isDpsSavingsAccount } = data;
          const isEven = index % 2 === 0;
          
          return (
            <React.Fragment key={account.id}>
              <tr 
                id={`account-${account.id}`}
                className={`
                  transition-all duration-200 ease-in-out cursor-pointer
                  ${isEven ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800/50'}
                  hover:bg-blue-50 dark:hover:bg-blue-900/20 
                  hover:shadow-sm
                `} 
                onClick={() => onToggleRow(account.id)}
              >
                <td className="px-6 py-[0.7rem]">
                  <div className="flex items-center">
                    {isRearrangeMode && (
                      <div className="mr-2 flex flex-col space-y-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMoveAccountUp(account.id);
                          }}
                          disabled={index === 0}
                          className={`p-1 rounded transition-colors ${
                            index === 0 
                              ? 'text-gray-300 cursor-not-allowed' 
                              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700'
                          }`}
                          title="Move up"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMoveAccountDown(account.id);
                          }}
                          disabled={index === accounts.length - 1}
                          className={`p-1 rounded transition-colors ${
                            index === accounts.length - 1 
                              ? 'text-gray-300 cursor-not-allowed' 
                              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700'
                          }`}
                          title="Move down"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    <div className="flex-1">
                      <div 
                        className="text-sm font-medium text-gray-900 dark:text-white relative group"
                      >
                        {account.name.charAt(0).toUpperCase() + account.name.slice(1)}
                        {account.description && (
                          <div className="absolute left-0 bottom-full mb-2 w-64 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 shadow-xl border border-gray-700">
                            {account.description}
                            <div className="absolute bottom-0 left-4 transform translate-y-1/2 w-2 h-2 bg-gray-800 rotate-45 border-r border-b border-gray-700"></div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="ml-2">
                      <svg 
                        className={`w-4 h-4 text-gray-400 transition-transform ${isRowExpanded(account.id) ? 'rotate-90' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-[0.7rem]">
                  <span className={`inline-flex items-center justify-center text-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAccountColor(account.type)}`}>
                    {account.type === 'cash' ? 'Cash' : account.type.charAt(0).toUpperCase() + account.type.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-[0.7rem] text-center">
                  <span className="text-sm text-gray-900 dark:text-white">{account.currency}</span>
                </td>
                <td className="px-6 py-[0.7rem] text-center">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(account.calculated_balance, account.currency)}
                  </span>
                </td>
                <td className="px-6 py-[0.7rem] text-center">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {accountTransactions.length}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {incomeTransactions.length} income, {expenseTransactions.length} expense
                  </div>
                </td>
                <td className="px-6 py-[0.7rem] text-center">
                  <div className="flex flex-col items-center gap-1">
                    {account.has_dps ? (
                      <>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200">
                          Active
                        </span>
                        {dpsSavingsAccount && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {formatCurrency(dpsSavingsAccount.calculated_balance, dpsSavingsAccount.currency)}
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-[0.7rem] text-center">
                  <div className="flex justify-center gap-2 items-center" onClick={(e) => e.stopPropagation()}>
                    {(!isDpsSavingsAccount && account.type !== 'cash') && (
                      <button
                        onClick={async () => {
                          await onUpdateAccount(account.id, { isActive: !account.isActive });
                        }}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 ${account.isActive ? 'bg-green-600' : 'bg-gray-300'}`}
                        title={account.isActive ? 'Deactivate Account' : 'Activate Account'}
                      >
                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 ${account.isActive ? 'translate-x-5' : 'translate-x-1'}`} />
                      </button>
                    )}
                    <button
                      onClick={() => onShowInfo(account)}
                      className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                      title="More Info"
                    >
                      <InfoIcon className="w-4 h-4" />
                    </button>
                    {!isDpsSavingsAccount && (
                      <button
                        onClick={() => onEditAccount(account)}
                        className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {!isDpsSavingsAccount && (
                      <button
                        onClick={() => onAddTransaction(account.id)}
                        className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                        title="Add Transaction"
                      >
                        <PlusCircle className="w-4 h-4" />
                      </button>
                    )}
                    {(account.type !== 'cash' && !isDpsSavingsAccount) && (
                      <button
                        onClick={() => onDeleteAccount(account)}
                        className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
              
              {/* Expanded Row Content */}
              {isRowExpanded(account.id) && (
                <tr className="bg-gray-50 dark:bg-gray-800">
                  <td colSpan={7} className="px-6 py-[0.7rem]">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Account Details */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Account Details</h4>
                        <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                          <div>
                            <span className="font-medium">Initial Balance:</span> {formatCurrency(Number(account.initial_balance), account.currency)}
                          </div>
                          {!isDpsSavingsAccount && (
                            <>
                              <div><span className="font-medium">Total Saved:</span> {formatCurrency(totalSaved, account.currency)}</div>
                              <div><span className="font-medium">Total Donated:</span> {formatCurrency(totalDonated, account.currency)}</div>
                            </>
                          )}
                          <div><span className="font-medium">Last Transaction:</span> {accountTransactions.length > 0 ? new Date(accountTransactions[accountTransactions.length - 1].date).toLocaleDateString() : 'None'}</div>
                        </div>
                      </div>

                      {/* DPS Information */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">DPS Settings</h4>
                        {account.has_dps ? (
                          <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                            <div><span className="font-medium">Type:</span> {account.dps_type}</div>
                            <div><span className="font-medium">Amount Type:</span> {account.dps_amount_type}</div>
                            {account.dps_fixed_amount && (
                              <div><span className="font-medium">Fixed Amount:</span> {formatCurrency(account.dps_fixed_amount, account.currency)}</div>
                            )}
                            {dpsSavingsAccount && (
                              <div><span className="font-medium">Savings Account:</span> {dpsSavingsAccount.name}</div>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            <div>DPS not enabled</div>
                          </div>
                        )}
                      </div>

                      {/* Recent Activity */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-900">Recent Activity</h4>
                        <div className="text-xs text-gray-600 space-y-1">
                          {accountTransactions.slice(0, 3).map((transaction) => (
                            <div key={transaction.id} className="flex justify-between">
                              <span className="truncate">{transaction.description}</span>
                              <span className={`font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount, account.currency)}
                              </span>
                            </div>
                          ))}
                          {accountTransactions.length === 0 && (
                            <div className="text-gray-400">No transactions yet</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          );
        })}
      </tbody>
    </table>
  );
});

AccountTable.displayName = 'AccountTable'; 

