import React from 'react';
import { Account, Transaction } from '../../types';

interface AccountSummaryCardsProps {
  filteredAccounts: Account[];
  transactions: Transaction[];
}

export const AccountSummaryCards: React.FC<AccountSummaryCardsProps> = ({
  filteredAccounts,
  transactions
}) => {
  const filteredTransactions = transactions.filter(t => filteredAccounts.some(a => a.id === t.account_id));
  const currency = filteredAccounts[0]?.currency || 'USD';
  const currencySymbol = {
    USD: '$', BDT: '৳', EUR: '€', GBP: '£', JPY: '¥', ALL: 'L', INR: '₹', CAD: '$', AUD: '$'
  }[currency] || currency;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 p-3">
      <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 px-2 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="text-left">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Active Accounts</p>
            <p className="font-bold text-green-600 dark:text-green-400" style={{ fontSize: '1.2rem' }}>
              {filteredAccounts.filter(a => a.isActive).length}
            </p>
          </div>
          <span className="text-green-600" style={{ fontSize: '1.2rem' }}>{currencySymbol}</span>
        </div>
      </div>
      
      <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 px-2 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="text-left">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Transactions</p>
            <p className="font-bold text-blue-600 dark:text-blue-400" style={{ fontSize: '1.2rem' }}>
              {filteredTransactions.length}
            </p>
          </div>
          <span className="text-blue-600" style={{ fontSize: '1.2rem' }}>{currencySymbol}</span>
        </div>
      </div>
      
      <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 px-2 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="text-left">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">DPS Accounts</p>
            <p className="font-bold text-purple-600 dark:text-purple-400" style={{ fontSize: '1.2rem' }}>
              {filteredAccounts.filter(a => a.has_dps).length}
            </p>
          </div>
          <svg className="text-purple-600" style={{ fontSize: '1.2rem', width: '1.2rem', height: '1.2rem' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2l4 -4" />
          </svg>
        </div>
      </div>
    </div>
  );
}; 

