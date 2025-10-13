import React, { useState, useMemo, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight, Info, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../../utils/currency';
import { getExchangeRate, calculateConvertedAmount } from '../../utils/exchangeRate';
import { CustomDropdown } from '../Purchases/CustomDropdown';

interface MultiCurrencyOverviewProps {
  transactions: any[];
  accounts: any[];
  purchases: any[];
  userProfile?: any;
}

interface CurrencySummary {
  currency: string;
  totalIncome: number;
  totalExpenses: number;
  netAmount: number;
  convertedIncome: number;
  convertedExpenses: number;
  convertedNet: number;
  accountCount: number;
  balance: number;
}

export const MultiCurrencyOverview: React.FC<MultiCurrencyOverviewProps> = ({
  transactions,
  accounts,
  purchases,
  userProfile
}) => {
  const { t } = useTranslation();
  const [baseCurrency, setBaseCurrency] = useState(userProfile?.local_currency || 'USD');
  const [period, setPeriod] = useState<'1m' | '3m' | '6m' | '1y'>('1m');
  const [loading, setLoading] = useState(false);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});

  // Get all unique currencies
  const allCurrencies = useMemo(() => {
    const currencies = new Set<string>();
    accounts.forEach(acc => currencies.add(acc.currency));
    transactions.forEach(t => {
      const account = accounts.find(a => a.id === t.account_id);
      if (account) currencies.add(account.currency);
    });
    return Array.from(currencies).sort();
  }, [accounts, transactions]);

  // Calculate date range
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    let start: Date;
    
    if (period === '1m') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === '3m') {
      start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    } else if (period === '6m') {
      start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    } else {
      start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    }
    
    return {
      startDate: start,
      endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
    };
  }, [period]);

  // Fetch exchange rates for all currencies
  useEffect(() => {
    const fetchRates = async () => {
      setLoading(true);
      const rates: Record<string, number> = {};
      
      for (const currency of allCurrencies) {
        if (currency !== baseCurrency) {
          try {
            const rate = await getExchangeRate(currency, baseCurrency);
            rates[currency] = rate;
          } catch (error) {
            console.warn(`Failed to get rate for ${currency}:`, error);
            rates[currency] = 1; // Fallback
          }
        } else {
          rates[currency] = 1;
        }
      }
      
      setExchangeRates(rates);
      setLoading(false);
    };

    if (allCurrencies.length > 0) {
      fetchRates();
    }
  }, [allCurrencies, baseCurrency]);

  // Calculate currency summaries
  const currencySummaries = useMemo((): CurrencySummary[] => {
    return allCurrencies.map(currency => {
      // Filter transactions for this currency and period
      const currencyTransactions = transactions.filter(t => {
        const account = accounts.find(a => a.id === t.account_id);
        const tDate = new Date(t.date);
        return account?.currency === currency && 
               tDate >= startDate && 
               tDate <= endDate &&
               !t.tags?.some((tag: string) => tag.includes('transfer') || tag.includes('dps_transfer'));
      });

      // Calculate income and expenses
      const income = currencyTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expenses = currencyTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      const netAmount = income - expenses;

      // Convert to base currency
      const rate = exchangeRates[currency] || 1;
      const convertedIncome = income * rate;
      const convertedExpenses = expenses * rate;
      const convertedNet = netAmount * rate;

      // Calculate account balance for this currency
      const currencyAccounts = accounts.filter(acc => acc.currency === currency);
      const balance = currencyAccounts.reduce((sum, acc) => {
        let accBalance = acc.initial_balance || 0;
        transactions.forEach(t => {
          if (t.account_id === acc.id && new Date(t.date) <= endDate) {
            if (t.type === 'income') accBalance += t.amount;
            else if (t.type === 'expense') accBalance -= t.amount;
          }
        });
        return sum + accBalance;
      }, 0);

      return {
        currency,
        totalIncome: income,
        totalExpenses: expenses,
        netAmount,
        convertedIncome,
        convertedExpenses,
        convertedNet,
        accountCount: currencyAccounts.length,
        balance
      };
    });
  }, [transactions, accounts, allCurrencies, startDate, endDate, exchangeRates]);

  // Calculate totals
  const totals = useMemo(() => {
    return currencySummaries.reduce((acc, summary) => ({
      totalIncome: acc.totalIncome + summary.convertedIncome,
      totalExpenses: acc.totalExpenses + summary.convertedExpenses,
      netAmount: acc.netAmount + summary.convertedNet,
      balance: acc.balance + (summary.balance * (exchangeRates[summary.currency] || 1))
    }), {
      totalIncome: 0,
      totalExpenses: 0,
      netAmount: 0,
      balance: 0
    });
  }, [currencySummaries, exchangeRates]);

  // Get top performing currency
  const topPerformingCurrency = useMemo(() => {
    return currencySummaries
      .filter(s => s.netAmount > 0)
      .sort((a, b) => b.convertedNet - a.convertedNet)[0];
  }, [currencySummaries]);

  // Get currency with highest expenses
  const highestExpenseCurrency = useMemo(() => {
    return currencySummaries
      .filter(s => s.totalExpenses > 0)
      .sort((a, b) => b.convertedExpenses - a.convertedExpenses)[0];
  }, [currencySummaries]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {t('dashboard.multiCurrencyOverview')}
          </h2>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Info className="w-4 h-4" />
            <span>All amounts converted to {baseCurrency}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <CustomDropdown
            options={allCurrencies.map(c => ({ value: c, label: c }))}
            value={baseCurrency}
            onChange={setBaseCurrency}
            fullWidth={false}
            className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
          />
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
            className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
          />
          <button
            onClick={() => window.location.reload()}
            disabled={loading}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">Total Income</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                {formatCurrency(totals.totalIncome, baseCurrency)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">Total Expenses</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                {formatCurrency(totals.totalExpenses, baseCurrency)}
              </p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
        </div>

        <div className={`bg-gradient-to-r p-4 rounded-lg ${
          totals.netAmount >= 0 
            ? 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20' 
            : 'from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${
                totals.netAmount >= 0 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-orange-600 dark:text-orange-400'
              }`}>Net Amount</p>
              <p className={`text-2xl font-bold ${
                totals.netAmount >= 0 
                  ? 'text-blue-700 dark:text-blue-300' 
                  : 'text-orange-700 dark:text-orange-300'
              }`}>
                {formatCurrency(totals.netAmount, baseCurrency)}
              </p>
            </div>
            {totals.netAmount >= 0 ? (
              <ArrowUpRight className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            ) : (
              <ArrowDownRight className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            )}
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Total Balance</p>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {formatCurrency(totals.balance, baseCurrency)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
      </div>

      {/* Currency Breakdown */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Currency Breakdown</h3>
        {currencySummaries.map((summary) => (
          <div key={summary.currency} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {summary.currency}
                </h4>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {summary.accountCount} account{summary.accountCount !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">Balance</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(summary.balance, summary.currency)}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">Income</p>
                <p className="font-semibold text-green-700 dark:text-green-300">
                  {formatCurrency(summary.totalIncome, summary.currency)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatCurrency(summary.convertedIncome, baseCurrency)}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">Expenses</p>
                <p className="font-semibold text-red-700 dark:text-red-300">
                  {formatCurrency(summary.totalExpenses, summary.currency)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatCurrency(summary.convertedExpenses, baseCurrency)}
                </p>
              </div>
              
              <div>
                <p className={`text-sm font-medium ${
                  summary.netAmount >= 0 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-orange-600 dark:text-orange-400'
                }`}>Net</p>
                <p className={`font-semibold ${
                  summary.netAmount >= 0 
                    ? 'text-blue-700 dark:text-blue-300' 
                    : 'text-orange-700 dark:text-orange-300'
                }`}>
                  {formatCurrency(summary.netAmount, summary.currency)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatCurrency(summary.convertedNet, baseCurrency)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Insights */}
      {(topPerformingCurrency || highestExpenseCurrency) && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">Insights</h3>
          <div className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
            {topPerformingCurrency && (
              <p>
                💚 <strong>{topPerformingCurrency.currency}</strong> is your best performing currency 
                with a net gain of {formatCurrency(topPerformingCurrency.netAmount, topPerformingCurrency.currency)} 
                ({formatCurrency(topPerformingCurrency.convertedNet, baseCurrency)})
              </p>
            )}
            {highestExpenseCurrency && (
              <p>
                💸 <strong>{highestExpenseCurrency.currency}</strong> has your highest expenses at 
                {formatCurrency(highestExpenseCurrency.totalExpenses, highestExpenseCurrency.currency)} 
                ({formatCurrency(highestExpenseCurrency.convertedExpenses, baseCurrency)})
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}; 