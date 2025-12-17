import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatCard } from './StatCard';
import { CustomDropdown } from '../Purchases/CustomDropdown';
import { Info, X, TrendingUp, TrendingDown } from 'lucide-react';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { isLendBorrowTransaction } from '../../utils/transactionUtils';

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
  const navigate = useNavigate();
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
  // Get all active accounts for this currency (exclude inactive/hidden accounts from totals)
  const currencyAccounts = accounts.filter(acc => acc.currency === currency && acc.isActive);
  
  // Separate DPS and regular accounts based on has_dps field (consistent with account section)
  // Main accounts with DPS enabled
  const dpsMainAccounts = currencyAccounts.filter(acc => acc.has_dps === true);
  // Regular accounts (excluding DPS savings accounts which are linked accounts)
  const regularAccounts = currencyAccounts.filter(acc => {
    // Exclude accounts that are linked as DPS savings accounts
    const isDpsSavingsAccount = accounts.some(otherAccount => 
      otherAccount.dps_savings_account_id === acc.id
    );
    return !acc.has_dps && !isDpsSavingsAccount;
  });
  
  // Get DPS savings accounts (the linked accounts where DPS money is stored)
  // Only show DPS savings accounts where the main account has DPS enabled
  const dpsSavingsAccounts = currencyAccounts.filter(acc => {
    return accounts.some(mainAccount => 
      mainAccount.dps_savings_account_id === acc.id && 
      mainAccount.has_dps === true &&
      mainAccount.currency === currency &&
      mainAccount.isActive
    );
  });
  
  // Sort accounts: zero balance accounts at the end of their respective lists
  const sortedDpsSavingsAccounts = [...(dpsSavingsAccounts || [])].sort((a, b) => {
    const balanceA = a.calculated_balance || 0;
    const balanceB = b.calculated_balance || 0;
    const isZeroA = balanceA === 0;
    const isZeroB = balanceB === 0;
    if (isZeroA === isZeroB) return 0; // Maintain original order within same group
    return isZeroA ? 1 : -1; // Zero balances go to end
  });
  
  const sortedRegularAccounts = [...(regularAccounts || [])].sort((a, b) => {
    const balanceA = a.calculated_balance || 0;
    const balanceB = b.calculated_balance || 0;
    const isZeroA = balanceA === 0;
    const isZeroB = balanceB === 0;
    if (isZeroA === isZeroB) return 0; // Maintain original order within same group
    return isZeroA ? 1 : -1; // Zero balances go to end
  });
  
  // Combine regular accounts and DPS main accounts for display (both are shown in "Accounts" section)
  const sortedAllRegularAccounts = [...(regularAccounts || []), ...(dpsMainAccounts || [])].sort((a, b) => {
    const balanceA = a.calculated_balance || 0;
    const balanceB = b.calculated_balance || 0;
    const isZeroA = balanceA === 0;
    const isZeroB = balanceB === 0;
    if (isZeroA === isZeroB) return 0; // Maintain original order within same group
    return isZeroA ? 1 : -1; // Zero balances go to end
  });
  
  // Calculate DPS total from DPS savings accounts (where the money actually is)
  const dpsTotal = sortedDpsSavingsAccounts.reduce((sum, acc) => sum + (acc.calculated_balance || 0), 0);
  
  // Calculate regular accounts total (includes DPS main accounts for display consistency)
  const regularAccountsTotal = sortedAllRegularAccounts.reduce((sum, acc) => sum + (acc.calculated_balance || 0), 0);

  // Date range logic - memoized for performance
  const { startDate, endDate, prevStartDate, prevEndDate } = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date;
    let prevStart: Date;
    let prevEnd: Date;
    
    if (period === '1m') {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
      prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    } else if (period === '3m') {
      start = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      prevStart = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0);
      prevEnd = new Date(now.getFullYear(), now.getMonth() - 3, 0, 23, 59, 59);
    } else if (period === '6m') {
      start = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      prevStart = new Date(now.getFullYear(), now.getMonth() - 11, 1, 0, 0, 0);
      prevEnd = new Date(now.getFullYear(), now.getMonth() - 6, 0, 23, 59, 59);
    } else {
      start = new Date(now.getFullYear(), now.getMonth() - 11, 1, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      prevStart = new Date(now.getFullYear() - 1, now.getMonth(), 1, 0, 0, 0);
      prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    }
    
    return { startDate: start, endDate: end, prevStartDate: prevStart, prevEndDate: prevEnd };
  }, [period]);

  // Calculate balance as of endDate for each account - optimized with pre-filtered transactions
  const accountTransactionsMap = useMemo(() => {
    const map: Record<string, typeof allTransactions> = {};
    currencyAccounts.forEach(acc => {
      map[acc.id] = allTransactions.filter(t => t.account_id === acc.id);
    });
    return map;
  }, [allTransactions, currencyAccounts]);
  
  function getAccountBalanceAtDate(account: any, endDate: Date) {
    // Start with initial balance
    let balance = account.initial_balance || 0;
    // Use pre-filtered transactions for this account
    const accountTransactions = accountTransactionsMap[account.id] || [];
    accountTransactions.forEach(t => {
      if (new Date(t.date) <= endDate) {
        if (t.type === 'income') balance += t.amount;
        else if (t.type === 'expense') balance -= t.amount;
        // If you have transfer logic, handle here as well
      }
    });
    return balance;
  }

  // Minimal header (Option 1): compute last updated timestamp for this currency
  const lastCurrencyActivityDate = useMemo(() => {
    const relevant = allTransactions
      .filter(t => accountCurrencyMap[t.account_id] === currency)
      .map(t => new Date(t.date).getTime());
    if (relevant.length === 0) return null;
    const maxTs = Math.max(...relevant);
    return new Date(maxTs);
  }, [allTransactions, accountCurrencyMap, currency]);

  function getRelativeTimeString(date: Date | null) {
    if (!date) return 'No recent activity';
    const now = new Date().getTime();
    const diffSec = Math.max(1, Math.floor((now - date.getTime()) / 1000));
    if (diffSec < 60) return 'Updated just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `Updated ${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `Updated ${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    return `Updated ${diffDay}d ago`;
  }

  function formatBalanceChange(change: number | null) {
    if (change === null) return null;
    if (change === 0) return { text: '0%', color: 'text-gray-500', arrow: '' };
    
    const isPositive = change > 0;
    const color = isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
    const arrow = isPositive ? '▲' : '▼';
    const sign = change > 0 ? '+' : '';
    
    return {
      text: `${sign}${Math.round(change)}%`,
      color,
      arrow
    };
  }

  // Filter transactions for this currency and period - memoized for performance
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter(t => {
      const accCurrency = accountCurrencyMap[t.account_id];
      const tDate = new Date(t.date);
      return accCurrency === currency && tDate >= startDate && tDate <= endDate;
    });
  }, [allTransactions, accountCurrencyMap, currency, startDate, endDate]);
  
  const filteredIncome = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'income' && 
        !t.tags?.some((tag: string) => 
          tag.includes('transfer') || tag.includes('dps_transfer') || tag === 'dps_deletion'
        ) &&
        !isLendBorrowTransaction(t)
      )
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);
    
  const filteredExpenses = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'expense' && 
        !t.tags?.some((tag: string) => 
          tag.includes('transfer') || tag.includes('dps_transfer') || tag === 'dps_deletion'
        ) &&
        !isLendBorrowTransaction(t)
      )
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  // Previous period transactions - memoized for performance
  const prevFilteredTransactions = useMemo(() => {
    return allTransactions.filter(t => {
      const accCurrency = accountCurrencyMap[t.account_id];
      const tDate = new Date(t.date);
      return accCurrency === currency && tDate >= prevStartDate && tDate <= prevEndDate;
    });
  }, [allTransactions, accountCurrencyMap, currency, prevStartDate, prevEndDate]);
  
  const prevIncome = useMemo(() => {
    return prevFilteredTransactions
      .filter(t => t.type === 'income' && 
        !t.tags?.some((tag: string) => 
          tag.includes('transfer') || tag.includes('dps_transfer') || tag === 'dps_deletion'
        ) &&
        !isLendBorrowTransaction(t)
      )
      .reduce((sum, t) => sum + t.amount, 0);
  }, [prevFilteredTransactions]);
  
  const prevExpenses = useMemo(() => {
    return prevFilteredTransactions
      .filter(t => t.type === 'expense' && 
        !t.tags?.some((tag: string) => 
          tag.includes('transfer') || tag.includes('dps_transfer') || tag === 'dps_deletion'
        ) &&
        !isLendBorrowTransaction(t)
      )
      .reduce((sum, t) => sum + t.amount, 0);
  }, [prevFilteredTransactions]);

  // Option 2: Calculate balance change from previous period
  const balanceChange = useMemo(() => {
    const prevTotalBalance = currencyAccounts.reduce((sum, acc) => sum + getAccountBalanceAtDate(acc, prevStartDate), 0);
    const currentTotalBalance = currencyAccounts.reduce((sum, acc) => sum + getAccountBalanceAtDate(acc, endDate), 0);
    
    if (prevTotalBalance === 0 && currentTotalBalance === 0) return null;
    if (prevTotalBalance === 0) return 100; // New data, show 100% increase
    
    return ((currentTotalBalance - prevTotalBalance) / Math.abs(prevTotalBalance)) * 100;
  }, [currencyAccounts, prevStartDate, endDate, accountTransactionsMap]);

  // Calculate percent change
  function getPercentChange(current: number, prev: number) {
    if (prev === 0 && current === 0) return null; // No data at all
    if (prev === 0 && current > 0) return 100; // New data, show 100% increase
    return ((current - prev) / Math.abs(prev)) * 100;
  }
  
  // Calculate net change (income - expenses)
  const netChange = filteredIncome - filteredExpenses;
  const prevNetChange = prevIncome - prevExpenses;
  const netChangePercent = getPercentChange(netChange, prevNetChange);
  
  // Calculate total account count - match what's actually displayed in the tooltip
  const totalAccountCount = (sortedAllRegularAccounts?.length || 0) + (sortedDpsSavingsAccounts?.length || 0);

  return (
    <div 
      className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-xl p-3 sm:p-4 lg:p-5 shadow-sm hover:shadow-lg transition-all duration-300 border border-blue-200/50 dark:border-blue-800/50 hover:border-blue-300 dark:hover:border-blue-700 h-full flex flex-col cursor-pointer group"
      onClick={() => navigate('/analytics')}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate('/analytics');
        }
      }}
      aria-label={`View ${currency} currency analytics`}
    >
      {/* Mobile-optimized header */}
      <div className="mb-3 sm:mb-4">
        {/* Amount row */}
        <div className="flex flex-row items-center justify-between gap-1 mb-1">
           <div className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold tabular-nums text-gray-900 dark:text-white break-words">
             {formatCurrency(regularAccountsTotal + dpsTotal, currency)}
           </div>
          
          {/* Right side: Info button and period selector - all on same row */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 w-auto justify-end">
            {/* Combined info button with account count - compact for mobile */}
            <div className="relative">
              <button
                type="button"
                className="flex items-center gap-1.5 sm:gap-1.5 px-0 py-[6px] sm:py-[6px] min-h-[36px] sm:min-h-[36px] min-w-[36px] sm:min-w-[36px] rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 focus:outline-none transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation"
                style={{ WebkitTapHighlightColor: 'transparent' }}
                onMouseEnter={() => !isMobile && setShowTooltip(true)}
                onMouseLeave={() => !isMobile && setShowTooltip(false)}
                onFocus={() => !isMobile && setShowTooltip(true)}
                onBlur={() => !isMobile && setShowTooltip(false)}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isMobile) {
                    setShowMobileModal(true);
                  } else {
                    setShowTooltip(v => !v);
                  }
                }}
                tabIndex={0}
                aria-label="Show account info"
              >
                <Info className="w-4 h-4 sm:w-4 sm:h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200 flex-shrink-0" />
                {totalAccountCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[18px] sm:min-w-[18px] h-[18px] sm:h-[18px] px-1.5 sm:px-1.5 text-[10px] sm:text-[10px] font-medium bg-gradient-to-br from-blue-500 to-purple-500 dark:from-blue-400 dark:to-purple-400 text-white rounded-full flex-shrink-0">
                    {totalAccountCount}
                  </span>
                )}
              </button>
              {showTooltip && !isMobile && (
                <div className="absolute right-0 top-full z-50 mt-2 w-56 sm:w-64 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg p-2 sm:p-3 text-xs text-gray-700 dark:text-gray-200 animate-fadein">
                  <div className="font-semibold mb-2">Total: {formatCurrency(regularAccountsTotal + dpsTotal, currency)}</div>
                  
                  {/* Regular Accounts (includes DPS main accounts) */}
                  {sortedAllRegularAccounts.length > 0 && (
                    <>
                      <div className="font-medium mb-1">Accounts ({sortedAllRegularAccounts.length}):</div>
                      <ul className="space-y-1">
                        {sortedAllRegularAccounts.map(acc => {
                          const balance = acc.calculated_balance || 0;
                          const isNegative = balance < 0;
                          const isZero = balance === 0;
                          return (
                            <li key={acc.id} className={`flex justify-between ${isZero ? 'opacity-50' : ''}`}>
                              <span className={`truncate max-w-[100px] sm:max-w-[120px] ${isZero ? 'text-gray-400 dark:text-gray-500' : ''}`} title={acc.name}>{acc.name}</span>
                              <span className={`ml-2 tabular-nums text-xs ${isNegative ? 'text-red-600 dark:text-red-400' : isZero ? 'text-gray-400 dark:text-gray-500' : ''}`}>
                                {formatCurrency(balance, currency)}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                      <div className="mt-1 pt-1 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between font-medium">
                          <span>Total Accounts:</span>
                          <span className="tabular-nums">{formatCurrency(regularAccountsTotal, currency)}</span>
                        </div>
                      </div>
                    </>
                  )}
                  
                  {/* DPS Accounts */}
                  {sortedDpsSavingsAccounts.length > 0 && (
                    <>
                      <div className="my-2 pt-2">
                        <div className="font-medium mb-1">DPS Accounts ({sortedDpsSavingsAccounts.length}):</div>
                        <ul className="space-y-1">
                          {sortedDpsSavingsAccounts.map(acc => {
                            const balance = acc.calculated_balance || 0;
                            const isNegative = balance < 0;
                            const isZero = balance === 0;
                            return (
                              <li key={acc.id} className={`flex justify-between ${isZero ? 'opacity-50' : ''}`}>
                                <span className={`truncate max-w-[100px] sm:max-w-[120px] ${isZero ? 'text-gray-400 dark:text-gray-500' : ''}`} title={acc.name}>{acc.name}</span>
                                <span className={`ml-2 tabular-nums text-xs ${isNegative ? 'text-red-600 dark:text-red-400' : isZero ? 'text-gray-400 dark:text-gray-500' : ''}`}>
                                  {formatCurrency(balance, currency)}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                        <div className="mt-1 pt-1 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex justify-between font-medium">
                            <span>Total DPS:</span>
                            <span className="tabular-nums">{formatCurrency(dpsTotal, currency)}</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            
            {/* Period selector - compact for mobile */}
            <div onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
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
                className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-[9px] xs:text-[10px] sm:text-xs h-6 xs:h-7 min-h-0 hover:bg-gray-50 dark:hover:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none rounded-lg px-2 xs:px-3 py-1 w-auto"
                style={{ padding: isMobile ? '4px 8px' : '6px 12px', minWidth: isMobile ? '80px' : '100px' }}
                dropdownMenuClassName="!bg-white dark:!bg-gray-800 !border-gray-200 dark:!border-gray-600 !shadow-lg"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        </div>
        
        {/* Net change and timestamp row */}
        <div className="flex flex-row items-center justify-between gap-0 mt-2">
          <div className="flex items-center gap-2 flex-wrap">
            {netChangePercent !== null && (
              <div className={`flex items-center gap-1 text-[10px] xs:text-xs font-semibold ${
                netChangePercent > 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : netChangePercent < 0 
                  ? 'text-red-600 dark:text-red-400' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {netChangePercent > 0 ? (
                  <TrendingUp className="w-2.5 h-2.5 xs:w-3 xs:h-3 flex-shrink-0" />
                ) : netChangePercent < 0 ? (
                  <TrendingDown className="w-2.5 h-2.5 xs:w-3 xs:h-3 flex-shrink-0" />
                ) : null}
                <span className="whitespace-nowrap">Net: {formatCurrency(netChange, currency)}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Delta - balance change percentage */}
            {formatBalanceChange(balanceChange) && (
              <span className={`text-[10px] xs:text-[11px] font-medium flex items-center gap-0.5 ${formatBalanceChange(balanceChange)!.color} whitespace-nowrap`}>
                <span className="text-[10px] xs:text-[11px] flex-shrink-0">{formatBalanceChange(balanceChange)!.arrow}</span>
                <span>{formatBalanceChange(balanceChange)!.text}</span>
              </span>
            )}
            <div className="text-[10px] xs:text-[11px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {getRelativeTimeString(lastCurrencyActivityDate)}
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile-optimized stats grid */}
      <div className="grid grid-cols-2 xs:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-2 xs:gap-2.5 sm:gap-3 flex-1">
        <div className="w-full min-w-0">
          <StatCard
            title={<span className="text-[11px] xs:text-[12px] sm:text-[13px]">{t('dashboard.monthlyIncome')}</span>}
            value={formatCurrency(filteredIncome, currency)}
            color="green"
            gradient={false}
            animated={true}
          />
        </div>
        <div className="w-full min-w-0">
          <StatCard
            title={<span className="text-[11px] xs:text-[12px] sm:text-[13px]">{t('dashboard.monthlyExpenses')}</span>}
            value={formatCurrency(filteredExpenses, currency)}
            color="red"
            gradient={false}
            animated={true}
          />
        </div>
      </div>

      {/* Mobile Modal for Account Info */}
      {showMobileModal && isMobile && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4" onClick={(e) => {
          e.stopPropagation();
          setShowMobileModal(false);
        }}>
          <div className="fixed inset-0 bg-black/50" onClick={(e) => {
            e.stopPropagation();
            setShowMobileModal(false);
          }} />
          <div className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg p-3 w-64 animate-fadein" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-gray-700 dark:text-gray-200">Total: {formatCurrency(regularAccountsTotal + dpsTotal, currency)}</div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMobileModal(false);
                }}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            
            {/* Regular Accounts (includes DPS main accounts) */}
            {sortedAllRegularAccounts.length > 0 && (
              <>
                <div className="font-medium mb-1 text-gray-700 dark:text-gray-200">Accounts ({sortedAllRegularAccounts.length}):</div>
                <ul className="space-y-1 max-h-48 overflow-y-auto">
                  {sortedAllRegularAccounts.map(acc => {
                    const balance = acc.calculated_balance || 0;
                    const isNegative = balance < 0;
                    const isZero = balance === 0;
                    return (
                      <li key={acc.id} className={`flex justify-between text-xs ${isZero ? 'opacity-50 text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-200'}`}>
                        <span className={`truncate max-w-[120px] ${isZero ? 'text-gray-400 dark:text-gray-500' : ''}`} title={acc.name}>{acc.name}</span>
                        <span className={`ml-2 tabular-nums ${isNegative ? 'text-red-600 dark:text-red-400' : isZero ? 'text-gray-400 dark:text-gray-500' : ''}`}>
                          {formatCurrency(balance, currency)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-1 pt-1 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between font-medium text-xs text-gray-700 dark:text-gray-200">
                    <span>Total Accounts:</span>
                    <span className="tabular-nums">{formatCurrency(regularAccountsTotal, currency)}</span>
                  </div>
                </div>
              </>
            )}
            
            {/* DPS Accounts */}
            {sortedDpsSavingsAccounts.length > 0 && (
              <>
                <div className="my-2 pt-2">
                  <div className="font-medium mb-1 text-gray-700 dark:text-gray-200">DPS Accounts ({sortedDpsSavingsAccounts.length}):</div>
                  <ul className="space-y-1 max-h-32 overflow-y-auto">
                    {sortedDpsSavingsAccounts.map(acc => {
                      const balance = acc.calculated_balance || 0;
                      const isNegative = balance < 0;
                      const isZero = balance === 0;
                      return (
                        <li key={acc.id} className={`flex justify-between text-xs ${isZero ? 'opacity-50 text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-200'}`}>
                          <span className={`truncate max-w-[120px] ${isZero ? 'text-gray-400 dark:text-gray-500' : ''}`} title={acc.name}>{acc.name}</span>
                          <span className={`ml-2 tabular-nums ${isNegative ? 'text-red-600 dark:text-red-400' : isZero ? 'text-gray-400 dark:text-gray-500' : ''}`}>
                            {formatCurrency(balance, currency)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="mt-1 pt-1 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between font-medium text-xs text-gray-700 dark:text-gray-200">
                      <span>Total DPS:</span>
                      <span className="tabular-nums">{formatCurrency(dpsTotal, currency)}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}; 

