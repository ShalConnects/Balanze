import React, { useMemo, useRef } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import { Transaction, Account } from '../../types';
import { formatCurrency } from '../../utils/accountUtils';
import { isLendBorrowTransaction } from '../../utils/transactionUtils';

interface TransactionSummaryCardsProps {
  transactions: Transaction[];
  accounts: Account[];
  dateRange: {
    start: string;
    end: string;
  };
}

export const TransactionSummaryCards: React.FC<TransactionSummaryCardsProps> = ({
  transactions,
  accounts,
  dateRange
}) => {
  const lastLoggedValuesRef = useRef<string>(''); // Track last logged values to reduce log frequency
  
  const stats = useMemo(() => {
    // Debug: Count lend/borrow transactions
    const allLendBorrowTransactions = transactions.filter(t => isLendBorrowTransaction(t));
    const lendBorrowIncome = transactions.filter(t => t.type === 'income' && isLendBorrowTransaction(t));
    const lendBorrowExpense = transactions.filter(t => t.type === 'expense' && isLendBorrowTransaction(t));
    
    const incomeTransactions = transactions.filter(t => t.type === 'income' && !isLendBorrowTransaction(t));
    const expenseTransactions = transactions.filter(t => t.type === 'expense' && !isLendBorrowTransaction(t));
    
    const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
    const netAmount = totalIncome - totalExpenses;
    
    // Get unique currencies from accounts
    const currencies = [...new Set(accounts.map(a => a.currency))];
    const primaryCurrency = currencies[0] || 'USD';
    
    // Calculate average transaction amount
    const averageAmount = transactions.length > 0 
      ? transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length 
      : 0;
    
    // Get most active account
    const accountStats = accounts.map(account => {
      const accountTransactions = transactions.filter(t => t.account_id === account.id);
      return {
        account,
        count: accountTransactions.length,
        total: accountTransactions.reduce((sum, t) => sum + t.amount, 0)
      };
    }).sort((a, b) => b.count - a.count);
    
    const mostActiveAccount = accountStats[0];

    return {
      totalIncome,
      totalExpenses,
      netAmount,
      transactionCount: transactions.length,
      averageAmount,
      primaryCurrency,
      mostActiveAccount
    };
  }, [transactions, accounts]);

  const getDateRangeLabel = () => {
    if (!dateRange.start || !dateRange.end) {
      return 'All Time';
    }

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    if (dateRange.start === todayStr && dateRange.end === todayStr) {
      return 'Today';
    }

    const day = today.getDay();
    const diffToMonday = (day === 0 ? -6 : 1) - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const mondayStr = monday.toISOString().slice(0, 10);
    const sundayStr = sunday.toISOString().slice(0, 10);
    
    if (dateRange.start === mondayStr && dateRange.end === sundayStr) {
      return 'This Week';
    }

    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const firstOfMonthStr = firstOfMonth.toISOString().slice(0, 10);
    const lastOfMonthStr = lastOfMonth.toISOString().slice(0, 10);
    
    if (dateRange.start === firstOfMonthStr && dateRange.end === lastOfMonthStr) {
      return 'This Month';
    }

    return `${dateRange.start} to ${dateRange.end}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
      {/* Total Income */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-green-600 dark:text-green-400">Total Income</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">
              {formatCurrency(stats.totalIncome, stats.primaryCurrency)}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              {stats.transactionCount > 0 && (
                `${transactions.filter(t => t.type === 'income').length} transactions`
              )}
            </p>
          </div>
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
        </div>
      </div>

      {/* Total Expenses */}
      <div className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-lg border border-red-200 dark:border-red-800 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-red-600 dark:text-red-400">Total Expenses</p>
            <p className="text-2xl font-bold text-red-700 dark:text-red-300">
              {formatCurrency(stats.totalExpenses, stats.primaryCurrency)}
            </p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              {stats.transactionCount > 0 && (
                `${transactions.filter(t => t.type === 'expense').length} transactions`
              )}
            </p>
          </div>
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
            <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
        </div>
      </div>

      {/* Net Amount */}
      <div className={`bg-gradient-to-br rounded-lg border p-4 ${
        stats.netAmount >= 0 
          ? 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800'
          : 'from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium ${
              stats.netAmount >= 0 
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-orange-600 dark:text-orange-400'
            }`}>
              Net Amount
            </p>
            <p className={`text-2xl font-bold ${
              stats.netAmount >= 0 
                ? 'text-blue-700 dark:text-blue-300' 
                : 'text-orange-700 dark:text-orange-300'
            }`}>
              {formatCurrency(Math.abs(stats.netAmount), stats.primaryCurrency)}
            </p>
            <p className={`text-xs mt-1 ${
              stats.netAmount >= 0 
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-orange-600 dark:text-orange-400'
            }`}>
              {stats.netAmount >= 0 ? 'Profit' : 'Loss'}
            </p>
          </div>
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
            stats.netAmount >= 0 
              ? 'bg-blue-100 dark:bg-blue-900/30' 
              : 'bg-orange-100 dark:bg-orange-900/30'
          }`}>
            <DollarSign className={`w-6 h-6 ${
              stats.netAmount >= 0 
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-orange-600 dark:text-orange-400'
            }`} />
          </div>
        </div>
      </div>

      {/* Transaction Stats */}
      <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-lg border border-purple-200 dark:border-purple-800 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Transactions</p>
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {stats.transactionCount}
            </p>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
              {stats.transactionCount > 0 && (
                `Avg: ${formatCurrency(stats.averageAmount, stats.primaryCurrency)}`
              )}
            </p>
            {stats.mostActiveAccount && (
              <p className="text-xs text-purple-600 dark:text-purple-400">
                Most active: {stats.mostActiveAccount.account.name}
              </p>
            )}
          </div>
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
            <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
      </div>
    </div>
  );
}; 

