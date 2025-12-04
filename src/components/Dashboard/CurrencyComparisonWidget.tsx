import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../../utils/currency';
import { getExchangeRate } from '../../utils/exchangeRate';

interface CurrencyComparisonWidgetProps {
  transactions: any[];
  accounts: any[];
  baseCurrency: string;
}

interface CurrencyPerformance {
  currency: string;
  totalIncome: number;
  totalExpenses: number;
  netAmount: number;
  convertedNet: number;
  performance: 'positive' | 'negative' | 'neutral';
  exchangeRate: number;
}

export const CurrencyComparisonWidget: React.FC<CurrencyComparisonWidgetProps> = ({
  transactions,
  accounts,
  baseCurrency
}) => {
  const { t } = useTranslation();
  const [showDetails, setShowDetails] = useState(false);

  // Get all currencies
  const allCurrencies = useMemo(() => {
    const currencies = new Set<string>();
    accounts.forEach(acc => currencies.add(acc.currency));
    return Array.from(currencies).sort();
  }, [accounts]);

  // Calculate currency performance
  const currencyPerformance = useMemo((): CurrencyPerformance[] => {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1); // Current month
    
    return allCurrencies.map(currency => {
      // Filter transactions for this currency and current month
      const currencyTransactions = transactions.filter(t => {
        const account = accounts.find(a => a.id === t.account_id);
        const tDate = new Date(t.date);
        return account?.currency === currency && 
               tDate >= startDate && 
               tDate <= now &&
               !t.tags?.some((tag: string) => tag.includes('transfer') || tag.includes('dps_transfer'));
      });

      const income = currencyTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expenses = currencyTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      const netAmount = income - expenses;
      
      // Determine performance
      let performance: 'positive' | 'negative' | 'neutral';
      if (netAmount > 0) performance = 'positive';
      else if (netAmount < 0) performance = 'negative';
      else performance = 'neutral';

      return {
        currency,
        totalIncome: income,
        totalExpenses: expenses,
        netAmount,
        convertedNet: 0, // Will be calculated after exchange rates
        performance,
        exchangeRate: currency === baseCurrency ? 1 : 0 // Placeholder
      };
    });
  }, [transactions, accounts, allCurrencies, baseCurrency]);

  // Get top and bottom performing currencies
  const topPerformer = currencyPerformance
    .filter(c => c.performance === 'positive')
    .sort((a, b) => b.netAmount - a.netAmount)[0];

  const bottomPerformer = currencyPerformance
    .filter(c => c.performance === 'negative')
    .sort((a, b) => a.netAmount - b.netAmount)[0];

  // Calculate total net worth across all currencies
  const totalNetWorth = currencyPerformance.reduce((sum, c) => sum + c.netAmount, 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Currency Performance
          </h3>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Info className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          This Month
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">Total Net Worth</p>
              <p className="text-xl font-bold text-green-700 dark:text-green-300">
                {formatCurrency(totalNetWorth, baseCurrency)}
              </p>
            </div>
            <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
        </div>

        {topPerformer && (
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Best Performer</p>
                <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                  {topPerformer.currency}
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  +{formatCurrency(topPerformer.netAmount, topPerformer.currency)}
                </p>
              </div>
              <ArrowUpRight className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        )}

        {bottomPerformer && (
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Needs Attention</p>
                <p className="text-lg font-bold text-orange-700 dark:text-orange-300">
                  {bottomPerformer.currency}
                </p>
                <p className="text-sm text-orange-600 dark:text-orange-400">
                  {formatCurrency(bottomPerformer.netAmount, bottomPerformer.currency)}
                </p>
              </div>
              <ArrowDownRight className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        )}
      </div>

      {/* Currency Breakdown */}
      {showDetails && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Detailed Breakdown</h4>
          {currencyPerformance.map((currency) => (
            <div key={currency.currency} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  currency.performance === 'positive' ? 'bg-green-500' :
                  currency.performance === 'negative' ? 'bg-red-500' : 'bg-gray-400'
                }`} />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {currency.currency}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {currency.totalIncome > 0 && `Income: ${formatCurrency(currency.totalIncome, currency.currency)}`}
                    {currency.totalIncome > 0 && currency.totalExpenses > 0 && ' • '}
                    {currency.totalExpenses > 0 && `Expenses: ${formatCurrency(currency.totalExpenses, currency.currency)}`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-semibold ${
                  currency.performance === 'positive' ? 'text-green-600 dark:text-green-400' :
                  currency.performance === 'negative' ? 'text-red-600 dark:text-red-400' :
                  'text-gray-600 dark:text-gray-400'
                }`}>
                  {currency.performance === 'positive' ? '+' : ''}
                  {formatCurrency(currency.netAmount, currency.currency)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {currency.performance === 'positive' ? 'Gaining' : 
                   currency.performance === 'negative' ? 'Losing' : 'Neutral'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Insights */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">💡 Insights</h4>
        <div className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
          {topPerformer && (
            <p>
              <strong>{topPerformer.currency}</strong> is performing best this month with a net gain of{' '}
              {formatCurrency(topPerformer.netAmount, topPerformer.currency)}
            </p>
          )}
          {bottomPerformer && (
            <p>
              <strong>{bottomPerformer.currency}</strong> needs attention with a net loss of{' '}
              {formatCurrency(Math.abs(bottomPerformer.netAmount), bottomPerformer.currency)}
            </p>
          )}
          {allCurrencies.length > 1 && (
            <p>
              You're managing {allCurrencies.length} currencies. Consider consolidating to{' '}
              reduce complexity and exchange rate risks.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}; 

