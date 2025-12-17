import React from 'react';
import { Account, Transaction } from '../../types';
import { StatCard } from '../Dashboard/StatCard';
import { Wallet, TrendingUp, Target, Users, Calendar, Globe } from 'lucide-react';

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

  // Determine if showing all accounts or just active (infer from filteredAccounts)
  const hasInactiveAccounts = filteredAccounts.some(a => !a.isActive);
  const showAllAccounts = hasInactiveAccounts;
  
  // Calculate insights
  const activeAccounts = filteredAccounts.filter(a => a.isActive);
  const accountsToShow = showAllAccounts ? filteredAccounts : activeAccounts;
  const accountTypeBreakdown = accountsToShow.reduce((acc, account) => {
    acc[account.type] = (acc[account.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const transactionBreakdown = filteredTransactions.reduce((acc, transaction) => {
    acc[transaction.type] = (acc[transaction.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const dpsAccounts = filteredAccounts.filter(a => a.has_dps);
  const dpsTypeBreakdown = dpsAccounts.reduce((acc, account) => {
    const dpsType = account.dps_type || 'flexible';
    acc[dpsType] = (acc[dpsType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Format account type breakdown
  let accountTypeInsight = Object.entries(accountTypeBreakdown)
    .map(([type, count]) => `${count} ${type}`)
    .join(', ');
  
  // Add active/inactive breakdown if showing all accounts
  if (showAllAccounts) {
    const inactiveCount = filteredAccounts.length - activeAccounts.length;
    if (inactiveCount > 0) {
      accountTypeInsight = `${activeAccounts.length} active, ${inactiveCount} inactive`;
    } else {
      accountTypeInsight = accountTypeInsight || 'No accounts';
    }
  } else {
    accountTypeInsight = accountTypeInsight || 'No active accounts';
  }

  // Format transaction breakdown
  const transactionInsight = Object.entries(transactionBreakdown)
    .map(([type, count]) => `${count} ${type}`)
    .join(', ');

  // Format DPS type breakdown
  const dpsTypeInsight = Object.entries(dpsTypeBreakdown)
    .map(([type, count]) => `${count} ${type}`)
    .join(', ');

  // Calculate monthly activity
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const thisMonthTransactions = filteredTransactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear;
  });
  
  const lastMonthTransactions = filteredTransactions.filter(t => {
    const transactionDate = new Date(t.date);
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    return transactionDate.getMonth() === lastMonth && transactionDate.getFullYear() === lastMonthYear;
  });
  
  const monthlyChange = lastMonthTransactions.length > 0 
    ? Math.round(((thisMonthTransactions.length - lastMonthTransactions.length) / lastMonthTransactions.length) * 100)
    : 0;
  
  const monthlyInsight = monthlyChange !== 0 
    ? `${monthlyChange > 0 ? '+' : ''}${monthlyChange}% vs last month`
    : 'Same as last month';

  // Calculate currencies
  const currencies = [...new Set(filteredAccounts.map(account => account.currency))];
  const currencyInsight = currencies.length > 1 
    ? currencies.join(', ') 
    : currencies[0] || 'No currencies';

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 p-3">
      <StatCard
        title={showAllAccounts ? 'All Accounts' : 'Active Accounts'}
        value={showAllAccounts ? filteredAccounts.length.toString() : activeAccounts.length.toString()}
        icon={<Wallet />}
        color="blue"
        insight={accountTypeInsight}
      />
      
      <StatCard
        title="Total Transactions"
        value={filteredTransactions.length.toString()}
        icon={<TrendingUp />}
        color="blue"
        insight={transactionInsight || 'No transactions'}
      />
      
      {dpsAccounts.length > 0 && (
        <StatCard
          title="DPS Accounts"
          value={dpsAccounts.length.toString()}
          icon={<Target />}
          color="blue"
          insight={dpsTypeInsight || 'No DPS accounts'}
        />
      )}

      <StatCard
        title="Total Balance"
        value={`${currencySymbol}${activeAccounts.reduce((sum, account) => sum + account.calculated_balance, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        icon={<Users />}
        color="blue"
        insight={`${activeAccounts.length} accounts`}
      />

      <StatCard
        title="Monthly Activity"
        value={thisMonthTransactions.length.toString()}
        icon={<Calendar />}
        color="blue"
        insight={monthlyInsight}
      />

      <StatCard
        title="Currencies"
        value={currencies.length.toString()}
        icon={<Globe />}
        color="blue"
        insight={currencyInsight}
      />
    </div>
  );
}; 

