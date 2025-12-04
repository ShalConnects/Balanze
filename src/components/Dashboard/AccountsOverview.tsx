import React from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Account } from '../../types';
import { getAccountIcon, getAccountColor } from '../../utils/accountIcons';
import { formatCurrency } from '../../utils/currency';
import { CreditCard } from 'lucide-react';

interface AccountsOverviewProps {
  selectedCurrency: string;
}

export const AccountsOverview: React.FC<AccountsOverviewProps> = ({ selectedCurrency }) => {
  const { getActiveAccounts } = useFinanceStore();
  const accounts = getActiveAccounts();

  // Filter accounts by selected currency
  const filteredAccounts = accounts.filter(a => a.currency === selectedCurrency);
  const totalBalance = filteredAccounts.reduce((sum, a) => sum + a.calculated_balance, 0);

  if (accounts.length === 0) {
    return (
      <div className="text-gray-500 dark:text-gray-400 flex items-center justify-center h-40">
        No accounts available.
      </div>
    );
  }

  if (filteredAccounts.length === 0) {
    return (
      <div className="text-gray-500 dark:text-gray-400 flex items-center justify-center h-40">
        No accounts found for {selectedCurrency}
      </div>
    );
  }

  return (
    <div className="space-y-3 h-64 overflow-auto">
      {filteredAccounts.map((account) => (
        <div
          key={account.id}
          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">{account.name}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">{account.bank_name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-medium text-gray-900 dark:text-white">
              {formatCurrency(account.calculated_balance, selectedCurrency)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {((account.calculated_balance / totalBalance) * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

