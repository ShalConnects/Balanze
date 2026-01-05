import React, { useState } from 'react';
import { Download, Calendar, PieChart, TrendingUp, DollarSign } from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useAuthStore } from '../../store/authStore';
import { CategoryChart } from './CategoryChart';
import { MonthlyTrend } from './MonthlyTrend';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from 'date-fns';
import { TransactionChart } from '../Dashboard/TransactionChart';
import { AccountsOverview } from '../Dashboard/AccountsOverview';
import { isLendBorrowTransaction } from '../../utils/transactionUtils';

export const ReportsView: React.FC = () => {
  const { getActiveAccounts, getActiveTransactions, getDashboardStats, getCategories } = useFinanceStore();
  const { profile } = useAuthStore();
  const accounts = getActiveAccounts();
  const transactions = getActiveTransactions();
  const stats = getDashboardStats();
  const categories = getCategories();
  const [selectedPeriod, setSelectedPeriod] = useState<'current' | 'last3' | 'last6' | 'last12' | 'thisYear'>('current');
  
  // Filter currencies based on user's selected currencies
  const availableCurrencies = profile?.selected_currencies && profile.selected_currencies.length > 0
    ? stats.byCurrency.filter(s => profile.selected_currencies?.includes?.(s.currency))
    : stats.byCurrency;
  
  const [selectedCurrency, setSelectedCurrency] = useState(availableCurrencies[0]?.currency || 'USD');

  const getPeriodData = () => {
    const now = new Date();
    let startDate: Date;
    
    switch (selectedPeriod) {
      case 'current':
        startDate = startOfMonth(now);
        break;
      case 'last3':
        startDate = startOfMonth(subMonths(now, 2));
        break;
      case 'last6':
        startDate = startOfMonth(subMonths(now, 5));
        break;
      case 'last12':
        startDate = startOfMonth(subMonths(now, 11));
        break;
      case 'thisYear':
        startDate = startOfYear(now);
        break;
      default:
        startDate = startOfMonth(now);
    }

    const endDate = selectedPeriod === 'thisYear' ? endOfYear(now) : endOfMonth(now);
    
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
  };

  const periodTransactions = getPeriodData();
  
  const totalIncome = periodTransactions
    .filter(t => t.type === 'income' && !isLendBorrowTransaction(t))
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = Math.abs(periodTransactions
    .filter(t => t.type === 'expense' && !isLendBorrowTransaction(t))
    .reduce((sum, t) => sum + t.amount, 0));

  const netIncome = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0;

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'current':
        return 'Current Month';
      case 'last3':
        return 'Last 3 Months';
      case 'last6':
        return 'Last 6 Months';
      case 'last12':
        return 'Last 12 Months';
      case 'thisYear':
        return `This Year (${new Date().getFullYear()})`;
      default:
        return 'Current Month';
    }
  };

  const exportReport = () => {
    const reportData = {
      period: getPeriodLabel(),
      summary: {
        totalIncome: formatCurrency(totalIncome, 'USD'),
        totalExpenses: formatCurrency(totalExpenses, 'USD'),
        netIncome: formatCurrency(netIncome, 'USD'),
        savingsRate: formatPercentage(savingsRate),
      },
      transactions: periodTransactions.map(t => ({
        date: format(new Date(t.date), 'yyyy-MM-dd'),
        description: t.description,
        category: t.category,
        type: t.type,
        amount: formatCurrency(t.amount, t.account_id),
        tags: t.tags?.join(', ') || '',
      })),
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `financial-report-${format(new Date(), 'yyyy-MM-dd')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Financial Reports</h2>
          <p className="text-gray-600">Analyze your financial performance and trends</p>
        </div>
        <div className="flex space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none unified-dropdown"
          >
            <option value="current">Current Month</option>
            <option value="last3">Last 3 Months</option>
            <option value="last6">Last 6 Months</option>
            <option value="last12">Last 12 Months</option>
            <option value="thisYear">This Year</option>
          </select>
          <button
            onClick={exportReport}
            className="bg-gradient-primary hover:bg-gradient-primary-hover text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Financial Overview</h2>
          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors unified-dropdown"
          >
            {availableCurrencies.map(({ currency }) => (
              <option key={currency} value={currency}>{currency}</option>
            ))}
          </select>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="border-b lg:border-b-0 lg:border-r border-gray-200 pb-6 lg:pb-0 lg:pr-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">Cash Flow</h3>
            <TransactionChart selectedCurrency={selectedCurrency} />
          </div>
          <div className="lg:pl-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">Accounts Overview</h3>
            <AccountsOverview selectedCurrency={selectedCurrency} />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Income</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome, 'USD')}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses, 'USD')}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-red-600 transform rotate-180" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Net Income</p>
              <p className={`text-2xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(netIncome, 'USD')}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Savings Rate</p>
              <p className={`text-2xl font-bold ${savingsRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(savingsRate)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <PieChart className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryChart transactions={periodTransactions} categories={categories} />
        <MonthlyTrend transactions={periodTransactions} period={selectedPeriod} />
      </div>

      {/* Period Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-blue-900">Report Period: {getPeriodLabel()}</span>
        </div>
        <p className="text-sm text-blue-700 mt-1">
          Showing data for {periodTransactions.length} transactions
        </p>
      </div>
    </div>
  );
};

