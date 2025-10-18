import React from 'react';
import { Account, Transaction } from '../../types';
import { StatCard } from '../Dashboard/StatCard';
import { Wallet, TrendingUp, Target, Users, Calendar } from 'lucide-react';

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

  // Calculate insights
  const activeAccounts = filteredAccounts.filter(a => a.isActive);
  const accountTypeBreakdown = activeAccounts.reduce((acc, account) => {
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
  const accountTypeInsight = Object.entries(accountTypeBreakdown)
    .map(([type, count]) => `${count} ${type}`)
    .join(', ');

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

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 p-3">
      <StatCard
        title="Active Accounts"
        value={activeAccounts.length.toString()}
        icon={<Wallet className="w-5 h-5" />}
        color="green"
        insight={accountTypeInsight || 'No active accounts'}
      />
      
      <StatCard
        title="Total Transactions"
        value={filteredTransactions.length.toString()}
        icon={<TrendingUp className="w-5 h-5" />}
        color="blue"
        insight={transactionInsight || 'No transactions'}
      />
      
      <StatCard
        title="DPS Accounts"
        value={dpsAccounts.length.toString()}
        icon={<Target className="w-5 h-5" />}
        color="purple"
        insight={dpsTypeInsight || 'No DPS accounts'}
      />

      <StatCard
        title="Total Balance"
        value={`${currencySymbol}${activeAccounts.reduce((sum, account) => sum + account.calculated_balance, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        icon={<Users className="w-5 h-5" />}
        color="gray"
        insight={`${activeAccounts.length} accounts`}
      />

      <StatCard
        title="Monthly Activity"
        value={thisMonthTransactions.length.toString()}
        icon={<Calendar className="w-5 h-5" />}
        color="blue"
        insight={monthlyInsight}
      />
    </div>
  );
}; 

