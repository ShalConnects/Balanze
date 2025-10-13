import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, PieChart, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../../utils/currency';

interface EarningsSpendingSummaryProps {
  transactions: any[];
  accounts: any[];
  period?: '1m' | '3m' | '6m' | '1y';
}

interface CurrencySummary {
  currency: string;
  earnings: number;
  spending: number;
  net: number;
  accountCount: number;
}

export const EarningsSpendingSummary: React.FC<EarningsSpendingSummaryProps> = ({
  transactions,
  accounts,
  period = '1m'
}) => {
  const { t } = useTranslation();

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

  // Get all currencies and calculate summaries
  const currencySummaries = useMemo((): CurrencySummary[] => {
    const currencies = new Set<string>();
    accounts.forEach(acc => currencies.add(acc.currency));
    
    return Array.from(currencies).map(currency => {
      // Filter transactions for this currency and period
      const currencyTransactions = transactions.filter(t => {
        const account = accounts.find(a => a.id === t.account_id);
        const tDate = new Date(t.date);
        return account?.currency === currency && 
               tDate >= startDate && 
               tDate <= endDate &&
               !t.tags?.some((tag: string) => tag.includes('transfer') || tag.includes('dps_transfer'));
      });

      const earnings = currencyTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const spending = currencyTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      const net = earnings - spending;
      const currencyAccounts = accounts.filter(acc => acc.currency === currency);

      return {
        currency,
        earnings,
        spending,
        net,
        accountCount: currencyAccounts.length
      };
    }).sort((a, b) => Math.abs(b.net) - Math.abs(a.net)); // Sort by absolute net value
  }, [transactions, accounts, startDate, endDate]);

  // Calculate totals
  const totals = useMemo(() => {
    return currencySummaries.reduce((acc, summary) => ({
      totalEarnings: acc.totalEarnings + summary.earnings,
      totalSpending: acc.totalSpending + summary.spending,
      totalNet: acc.totalNet + summary.net
    }), {
      totalEarnings: 0,
      totalSpending: 0,
      totalNet: 0
    });
  }, [currencySummaries]);

  // Get insights
  const insights = useMemo(() => {
    const positiveCurrencies = currencySummaries.filter(c => c.net > 0);
    const negativeCurrencies = currencySummaries.filter(c => c.net < 0);
    const highestEarner = currencySummaries.sort((a, b) => b.earnings - a.earnings)[0];
    const highestSpender = currencySummaries.sort((a, b) => b.spending - a.spending)[0];

    return {
      positiveCurrencies,
      negativeCurrencies,
      highestEarner,
      highestSpender,
      overallPositive: totals.totalNet > 0
    };
  }, [currencySummaries, totals]);

  if (currencySummaries.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No transaction data available for the selected period.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Earnings vs Spending
          </h2>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <PieChart className="w-4 h-4" />
            <span>{period === '1m' ? 'This Month' : 
                   period === '3m' ? 'Last 3 Months' :
                   period === '6m' ? 'Last 6 Months' : 'Last Year'}</span>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
          insights.overallPositive 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
        }`}>
          {insights.overallPositive ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span>
            {insights.overallPositive ? 'Net Positive' : 'Net Negative'}
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">Total Earnings</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                {currencySummaries.length > 1 ? `${currencySummaries.length} currencies` : 
                 formatCurrency(totals.totalEarnings, currencySummaries[0]?.currency || 'USD')}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">Total Spending</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                {currencySummaries.length > 1 ? `${currencySummaries.length} currencies` : 
                 formatCurrency(totals.totalSpending, currencySummaries[0]?.currency || 'USD')}
              </p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
        </div>

        <div className={`bg-gradient-to-r p-4 rounded-lg ${
          totals.totalNet >= 0 
            ? 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20' 
            : 'from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${
                totals.totalNet >= 0 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-orange-600 dark:text-orange-400'
              }`}>Net Result</p>
              <p className={`text-2xl font-bold ${
                totals.totalNet >= 0 
                  ? 'text-blue-700 dark:text-blue-300' 
                  : 'text-orange-700 dark:text-orange-300'
              }`}>
                {currencySummaries.length > 1 ? `${currencySummaries.length} currencies` : 
                 formatCurrency(totals.totalNet, currencySummaries[0]?.currency || 'USD')}
              </p>
            </div>
            <BarChart3 className={`w-8 h-8 ${
              totals.totalNet >= 0 
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-orange-600 dark:text-orange-400'
            }`} />
          </div>
        </div>
      </div>

      {/* Currency Breakdown */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">By Currency</h3>
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
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                summary.net >= 0 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
              }`}>
                {summary.net >= 0 ? '+' : ''}{formatCurrency(summary.net, summary.currency)}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">Earnings</p>
                <p className="font-semibold text-green-700 dark:text-green-300">
                  {formatCurrency(summary.earnings, summary.currency)}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">Spending</p>
                <p className="font-semibold text-red-700 dark:text-red-300">
                  {formatCurrency(summary.spending, summary.currency)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Key Insights */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3">💡 Key Insights</h3>
        <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          {insights.highestEarner && insights.highestEarner.earnings > 0 && (
            <p>
              <strong>{insights.highestEarner.currency}</strong> is your highest earning currency 
              with {formatCurrency(insights.highestEarner.earnings, insights.highestEarner.currency)}
            </p>
          )}
          
          {insights.highestSpender && insights.highestSpender.spending > 0 && (
            <p>
              <strong>{insights.highestSpender.currency}</strong> has your highest spending at 
              {formatCurrency(insights.highestSpender.spending, insights.highestSpender.currency)}
            </p>
          )}
          
          {insights.positiveCurrencies.length > 0 && (
            <p>
              <strong>{insights.positiveCurrencies.length}</strong> currency{insights.positiveCurrencies.length !== 1 ? 'ies are' : ' is'} 
              performing well with positive net results
            </p>
          )}
          
          {insights.negativeCurrencies.length > 0 && (
            <p>
              <strong>{insights.negativeCurrencies.length}</strong> currency{insights.negativeCurrencies.length !== 1 ? 'ies need' : ' needs'} 
              attention with negative net results
            </p>
          )}
        </div>
      </div>
    </div>
  );
}; 