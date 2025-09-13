import React, { useState, useMemo, useEffect } from 'react';
import { StatCard } from './StatCard';
import { CustomDropdown } from '../Purchases/CustomDropdown';
import { LineChart, Line } from 'recharts';
import { Info, Calendar, Clock, X } from 'lucide-react';
import { useMobileDetection } from '../../hooks/useMobileDetection';

interface CurrencyOverviewCardProps {
  currency: string;
  transactions: any[];
  accounts: any[];
  t: (key: string, options?: any) => string;
  formatCurrency: (amount: number, currency: string) => string;
}

export const CurrencyOverviewCard: React.FC<CurrencyOverviewCardProps> = ({
  currency,
  transactions: allTransactions,
  accounts,
  t,
  formatCurrency,
}) => {
  // Use '1m' as default
  const [period, setPeriod] = useState<'1m' | '3m' | '6m' | '1y'>('1m');

  // Helper: Map account_id to currency
  const accountCurrencyMap = useMemo(() => {
    const map: Record<string, string> = {};
    accounts.forEach(acc => { map[acc.id] = acc.currency; });
    return map;
  }, [accounts]);

  // Tooltip state
  const [showTooltip, setShowTooltip] = useState(false);
  const [showMobileModal, setShowMobileModal] = useState(false);
  const { isMobile } = useMobileDetection();
  // Get all accounts for this currency
  const currencyAccounts = accounts.filter(acc => acc.currency === currency);

  // Force re-render when transactions or accounts change
  useEffect(() => {
    // This will trigger a re-render when the props change
  }, [allTransactions, accounts, currency]);

  // Date range logic
  const now = new Date();
  let startDate: Date;
  let endDate: Date;
  if (period === '1m') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  } else if (period === '3m') {
    startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  } else if (period === '6m') {
    startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  } else {
    startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1, 0, 0, 0);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  }

  // Calculate balance as of endDate for each account
  function getAccountBalanceAtDate(account: any, endDate: Date) {
    // Start with initial balance
    let balance = account.initial_balance || 0;
    // Add all transactions for this account up to endDate
    allTransactions.forEach(t => {
      if (t.account_id === account.id && new Date(t.date) <= endDate) {
        if (t.type === 'income') balance += t.amount;
        else if (t.type === 'expense') balance -= t.amount;
        // If you have transfer logic, handle here as well
      }
    });
    return balance;
  }
  const totalBalance = currencyAccounts.reduce((sum, acc) => sum + getAccountBalanceAtDate(acc, endDate), 0);

  // Filter transactions for this currency and period
  const filteredTransactions = allTransactions.filter(t => {
    const accCurrency = accountCurrencyMap[t.account_id];
    const tDate = new Date(t.date);
    return accCurrency === currency && tDate >= startDate && tDate <= endDate;
  });
  
  const filteredIncome = filteredTransactions
    .filter(t => t.type === 'income' && !t.tags?.some((tag: string) => 
      tag.includes('transfer') || tag.includes('dps_transfer') || tag === 'dps_deletion'
    ))
    .reduce((sum, t) => sum + t.amount, 0);
    
  const filteredExpenses = filteredTransactions
    .filter(t => t.type === 'expense' && !t.tags?.some((tag: string) => 
      tag.includes('transfer') || tag.includes('dps_transfer') || tag === 'dps_deletion'
    ))
    .reduce((sum, t) => sum + t.amount, 0);

  // Debug logging for BDT currency
  if (currency === 'BDT') {
    const expenseTransactions = filteredTransactions.filter(t => t.type === 'expense' && !t.tags?.some((tag: string) => 
      tag.includes('transfer') || tag.includes('dps_transfer') || tag === 'dps_deletion'
    ));
    
    console.log('Dashboard BDT Debug:', {
      currency,
      period,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalTransactions: allTransactions.length,
      filteredTransactionsCount: filteredTransactions.length,
      filteredExpenses,
      expenseTransactionsCount: expenseTransactions.length,
      expenseTransactions: expenseTransactions.map(t => ({ 
        id: t.id, 
        transaction_id: t.transaction_id, 
        amount: t.amount, 
        date: t.date, 
        description: t.description,
        account_currency: accounts.find(a => a.id === t.account_id)?.currency
      }))
    });
  }





  // Compare label logic
  let prevStartDate: Date, prevEndDate: Date, compareLabel: string;
  if (period === '1m') {
    prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
    prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    compareLabel = 'Compared to previous month';
  } else if (period === '3m') {
    prevStartDate = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0);
    prevEndDate = new Date(now.getFullYear(), now.getMonth() - 3, 0, 23, 59, 59);
    compareLabel = 'Compared to previous 3 months';
  } else if (period === '6m') {
    prevStartDate = new Date(now.getFullYear(), now.getMonth() - 11, 1, 0, 0, 0);
    prevEndDate = new Date(now.getFullYear(), now.getMonth() - 6, 0, 23, 59, 59);
    compareLabel = 'Compared to previous 6 months';
  } else {
    prevStartDate = new Date(now.getFullYear() - 1, now.getMonth(), 1, 0, 0, 0);
    prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    compareLabel = 'Compared to previous year';
  }
  // Previous period transactions
  const prevFilteredTransactions = allTransactions.filter(t => {
    const accCurrency = accountCurrencyMap[t.account_id];
    const tDate = new Date(t.date);
    return accCurrency === currency && tDate >= prevStartDate && tDate <= prevEndDate;
  });
  const prevIncome = prevFilteredTransactions
    .filter(t => t.type === 'income' && !t.tags?.some((tag: string) => 
      tag.includes('transfer') || tag.includes('dps_transfer') || tag === 'dps_deletion'
    ))
    .reduce((sum, t) => sum + t.amount, 0);
  const prevExpenses = prevFilteredTransactions
    .filter(t => t.type === 'expense' && !t.tags?.some((tag: string) => 
      tag.includes('transfer') || tag.includes('dps_transfer') || tag === 'dps_deletion'
    ))
    .reduce((sum, t) => sum + t.amount, 0);

  // Calculate percent change
  function getPercentChange(current: number, prev: number) {
    if (prev === 0 && current === 0) return null; // No data at all
    if (prev === 0 && current > 0) return 100; // New data, show 100% increase
    return ((current - prev) / Math.abs(prev)) * 100;
  }
  const incomeChange = getPercentChange(filteredIncome, prevIncome);
  const expensesChange = getPercentChange(filteredExpenses, prevExpenses);

  // Generate sparkline data based on filter
  let sparkData: { name: string; income: number; expense: number }[] = [];
  if (period === '1m') {
    // Daily data for the month
    const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const start = new Date(startDate);
    const end = new Date(endDate);
    for (let d = 1; d <= daysInMonth(start); d++) {
      const day = new Date(start.getFullYear(), start.getMonth(), d);
      const dayStr = day.toISOString().slice(0, 10);
      const dayIncome = filteredTransactions.filter(t => t.type === 'income' && t.date.slice(0, 10) === dayStr).reduce((sum, t) => sum + t.amount, 0);
      const dayExpense = filteredTransactions.filter(t => t.type === 'expense' && t.date.slice(0, 10) === dayStr).reduce((sum, t) => sum + t.amount, 0);
      sparkData.push({ name: dayStr, income: dayIncome, expense: dayExpense });
    }
  } else {
    // Monthly data for the year
    const start = new Date(startDate);
    const end = new Date(endDate);
    for (let m = 0; m <= end.getMonth(); m++) {
      const month = new Date(start.getFullYear(), m, 1);
      const monthStr = month.toLocaleString('default', { month: 'short' });
      const monthIncome = filteredTransactions.filter(t => t.type === 'income' && new Date(t.date).getMonth() === m).reduce((sum, t) => sum + t.amount, 0);
      const monthExpense = filteredTransactions.filter(t => t.type === 'expense' && new Date(t.date).getMonth() === m).reduce((sum, t) => sum + t.amount, 0);
      sparkData.push({ name: monthStr, income: monthIncome, expense: monthExpense });
    }
  }
  // Determine trend color
  function getTrendColor(arr: number[], isExpense = false) {
    if (arr.length < 2) return '#9ca3af'; // gray-400
    const first = arr[0], last = arr[arr.length - 1];
    if (last > first) return isExpense ? '#ef4444' : '#22c55e'; // up: green, down: red
    if (last < first) return isExpense ? '#22c55e' : '#ef4444'; // up: green, down: red
    return '#9ca3af'; // gray
  }
  const incomeArr = sparkData.map(d => d.income);
  const expenseArr = sparkData.map(d => d.expense);
  const incomeColor = getTrendColor(incomeArr, false);
  const expenseColor = getTrendColor(expenseArr, true);

  function renderInsight(change: number | null, label: string, isExpense = false) {
    if (change === null) {
      return <span className="text-xs text-gray-400">No data available</span>;
    }
    const isZero = change === 0;
    
    // For income: positive change is good (green), negative change is bad (red)
    // For expenses: positive change is bad (red), negative change is good (green)
    let color: string;
    if (isZero) {
      color = 'text-gray-400';
    } else if (isExpense) {
      // For expenses: positive change = bad (red), negative change = good (green)
      color = change > 0 ? 'text-red-600' : 'text-green-600';
    } else {
      // For income: positive change = good (green), negative change = bad (red)
      color = change > 0 ? 'text-green-600' : 'text-red-600';
    }
    
    const sign = change > 0 ? '+' : '';
    return (
      <span className={`text-xs font-semibold ${color}`}>{sign}{Math.round(change)}% {label}</span>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 flex-1">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('dashboard.currencyOverview', { currencyCode: currency })}</h2>
          <div className="relative flex items-center">
            <button
              type="button"
              className="ml-1 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 focus:outline-none transition-all duration-200 hover:scale-110 active:scale-95"
              onMouseEnter={() => !isMobile && setShowTooltip(true)}
              onMouseLeave={() => !isMobile && setShowTooltip(false)}
              onFocus={() => !isMobile && setShowTooltip(true)}
              onBlur={() => !isMobile && setShowTooltip(false)}
              onClick={() => {
                if (isMobile) {
                  setShowMobileModal(true);
                } else {
                  setShowTooltip(v => !v);
                }
              }}
              tabIndex={0}
              aria-label="Show account info"
            >
              <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200" />
            </button>
            {showTooltip && !isMobile && (
              <div className="absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg p-3 text-xs text-gray-700 dark:text-gray-200 animate-fadein">
                <div className="font-semibold mb-2">Total: {formatCurrency(totalBalance, currency)}</div>
                <div className="font-medium mb-1">Accounts ({currencyAccounts.length}):</div>
                <ul className="space-y-1">
                  {currencyAccounts.map(acc => (
                    <li key={acc.id} className="flex justify-between">
                      <span className="truncate max-w-[120px]" title={acc.name}>{acc.name}</span>
                      <span className="ml-2 tabular-nums">{formatCurrency(acc.calculated_balance || 0, currency)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        <CustomDropdown
          options={[
            { value: '1m', label: '1 Month' },
            { value: '3m', label: '3 Months' },
            { value: '6m', label: '6 Months' },
            { value: '1y', label: '1 Year' },
          ]}
          value={period}
          onChange={val => setPeriod(val as '1m' | '3m' | '6m' | '1y')}
          fullWidth={false}
          className="bg-transparent border-0 shadow-none text-gray-500 text-xs h-7 min-h-0 hover:bg-gray-100 focus:ring-0 focus:outline-none"
          style={{ padding: '10px', paddingRight: '5px' }}
          dropdownMenuClassName="!bg-[#d3d3d3bf] !top-[20px]"
        />
      </div>
      <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
        <div className="w-full">
          <StatCard
            title={<span className="text-[13px]">{t('dashboard.monthlyIncome')}</span>}
            value={formatCurrency(filteredIncome, currency)}
            trend="up"
            color="green"
            gradient={true}
            animated={true}
            insight={renderInsight(incomeChange, compareLabel)}
            trendGraph={
              <LineChart width={60} height={24} data={sparkData} margin={{ top: 6, right: 0, left: 0, bottom: 0 }}>
                <Line type="monotone" dataKey="income" stroke={incomeColor} strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            }
          />
        </div>
        <div className="w-full">
          <StatCard
            title={<span className="text-[13px]">{t('dashboard.monthlyExpenses')}</span>}
            value={formatCurrency(filteredExpenses, currency)}
            trend="down"
            color="red"
            gradient={true}
            animated={true}
            insight={renderInsight(expensesChange, compareLabel, true)}
            trendGraph={
              <LineChart width={60} height={24} data={sparkData} margin={{ top: 6, right: 0, left: 0, bottom: 0 }}>
                <Line type="monotone" dataKey="expense" stroke={expenseColor} strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            }
          />
        </div>
      </div>

      {/* Mobile Modal for Account Info */}
      {showMobileModal && isMobile && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowMobileModal(false)} />
          <div className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg p-3 w-64 animate-fadein">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-gray-700 dark:text-gray-200">Total: {formatCurrency(totalBalance, currency)}</div>
              <button
                onClick={() => setShowMobileModal(false)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="font-medium mb-1 text-gray-700 dark:text-gray-200">Accounts ({currencyAccounts.length}):</div>
            <ul className="space-y-1 max-h-48 overflow-y-auto">
              {currencyAccounts.map(acc => (
                <li key={acc.id} className="flex justify-between text-xs text-gray-700 dark:text-gray-200">
                  <span className="truncate max-w-[120px]" title={acc.name}>{acc.name}</span>
                  <span className="ml-2 tabular-nums">{formatCurrency(acc.calculated_balance || 0, currency)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}; 