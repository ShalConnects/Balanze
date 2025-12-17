import React, { useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Globe, ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';
import { StatCard } from '../Dashboard/StatCard';
import { formatCurrency } from '../../utils/currency';
import { getExchangeRate } from '../../utils/exchangeRate';
import { isLendBorrowTransaction } from '../../utils/transactionUtils';

interface CurrencyPortfolioSummaryProps {
  accounts: any[];
  transactions: any[];
  userProfile?: any;
}

interface CurrencySummary {
  currency: string;
  balance: number;
  accountCount: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  netAmount: number;
  convertedBalance: number;
  convertedIncome: number;
  convertedExpenses: number;
  convertedNet: number;
}

export const CurrencyPortfolioSummary: React.FC<CurrencyPortfolioSummaryProps> = ({
  accounts,
  transactions,
  userProfile
}) => {
  const [baseCurrency, setBaseCurrency] = useState(userProfile?.local_currency || 'USD');
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});

  // Get all unique currencies
  const allCurrencies = useMemo(() => {
    const currencies = new Set<string>();
    accounts.forEach(acc => currencies.add(acc.currency));
    return Array.from(currencies).sort();
  }, [accounts]);

  // Calculate current month date range
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Calculate currency summaries
  const currencySummaries = useMemo((): CurrencySummary[] => {
    return allCurrencies.map(currency => {
      // Filter transactions for this currency and current month
      const currencyTransactions = transactions.filter(t => {
        const account = accounts.find(a => a.id === t.account_id);
        const tDate = new Date(t.date);
        return account?.currency === currency && 
               tDate >= startOfMonth && 
               tDate <= endOfMonth &&
               !t.tags?.some((tag: string) => tag.includes('transfer') || tag.includes('dps_transfer'));
      });

      // Calculate monthly income and expenses (excluding lend/borrow transactions)
      const monthlyIncome = currencyTransactions
        .filter(t => t.type === 'income' && !isLendBorrowTransaction(t))
        .reduce((sum, t) => sum + t.amount, 0);
      
      const monthlyExpenses = currencyTransactions
        .filter(t => t.type === 'expense' && !isLendBorrowTransaction(t))
        .reduce((sum, t) => sum + t.amount, 0);

      const netAmount = monthlyIncome - monthlyExpenses;

      // Calculate account balance for this currency
      const currencyAccounts = accounts.filter(acc => acc.currency === currency);
      const balance = currencyAccounts.reduce((sum, acc) => {
        let accBalance = acc.initial_balance || 0;
        transactions.forEach(t => {
          if (t.account_id === acc.id && new Date(t.date) <= endOfMonth) {
            if (t.type === 'income') accBalance += t.amount;
            else if (t.type === 'expense') accBalance -= t.amount;
          }
        });
        return sum + accBalance;
      }, 0);

      // Convert to base currency
      const rate = exchangeRates[currency] || 1;
      const convertedBalance = balance * rate;
      const convertedIncome = monthlyIncome * rate;
      const convertedExpenses = monthlyExpenses * rate;
      const convertedNet = netAmount * rate;

      return {
        currency,
        balance,
        accountCount: currencyAccounts.length,
        monthlyIncome,
        monthlyExpenses,
        netAmount,
        convertedBalance,
        convertedIncome,
        convertedExpenses,
        convertedNet
      };
    });
  }, [transactions, accounts, allCurrencies, startOfMonth, endOfMonth, exchangeRates]);

  // Calculate totals
  const totals = useMemo(() => {
    return currencySummaries.reduce((acc, summary) => ({
      totalBalance: acc.totalBalance + summary.convertedBalance,
      totalIncome: acc.totalIncome + summary.convertedIncome,
      totalExpenses: acc.totalExpenses + summary.convertedExpenses,
      totalNet: acc.totalNet + summary.convertedNet,
      currencyCount: acc.currencyCount + 1
    }), {
      totalBalance: 0,
      totalIncome: 0,
      totalExpenses: 0,
      totalNet: 0,
      currencyCount: 0
    });
  }, [currencySummaries]);

  // Get top performing currency
  const topPerformingCurrency = useMemo(() => {
    return currencySummaries
      .filter(s => s.netAmount > 0)
      .sort((a, b) => b.convertedNet - a.convertedNet)[0];
  }, [currencySummaries]);

  // Get currency with highest balance
  const highestBalanceCurrency = useMemo(() => {
    return currencySummaries
      .filter(s => s.balance > 0)
      .sort((a, b) => b.convertedBalance - a.convertedBalance)[0];
  }, [currencySummaries]);

  // Get currency with most activity
  const mostActiveCurrency = useMemo(() => {
    return currencySummaries
      .filter(s => s.monthlyIncome > 0 || s.monthlyExpenses > 0)
      .sort((a, b) => (b.monthlyIncome + b.monthlyExpenses) - (a.monthlyIncome + a.monthlyExpenses))[0];
  }, [currencySummaries]);

  // Load exchange rates
  React.useEffect(() => {
    const loadExchangeRates = async () => {
      const rates: Record<string, number> = {};
      for (const currency of allCurrencies) {
        if (currency !== baseCurrency) {
          try {
            const rate = await getExchangeRate(currency, baseCurrency);
            rates[currency] = rate;
          } catch (error) {
            rates[currency] = 1;
          }
        } else {
          rates[currency] = 1;
        }
      }
      setExchangeRates(rates);
    };

    if (allCurrencies.length > 0) {
      loadExchangeRates();
    }
  }, [allCurrencies, baseCurrency]);

  // Don't render if no currencies
  if (allCurrencies.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Globe className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Currency Portfolio
          </h2>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Info className="w-4 h-4" />
            <span>All amounts converted to {baseCurrency}</span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Portfolio"
          value={formatCurrency(totals.totalBalance, baseCurrency)}
          icon={<DollarSign />}
          color="blue"
          insight={`${totals.currencyCount} currencies`}
        />
        
        <StatCard
          title="Monthly Income"
          value={formatCurrency(totals.totalIncome, baseCurrency)}
          icon={<TrendingUp />}
          color="green"
          insight="This month"
        />
        
        <StatCard
          title="Monthly Expenses"
          value={formatCurrency(totals.totalExpenses, baseCurrency)}
          icon={<TrendingDown />}
          color="red"
          insight="This month"
        />
        
        <StatCard
          title="Net Change"
          value={formatCurrency(totals.totalNet, baseCurrency)}
          icon={totals.totalNet >= 0 ? <ArrowUpRight /> : <ArrowDownRight />}
          color={totals.totalNet >= 0 ? "green" : "red"}
          insight={totals.totalNet >= 0 ? "Positive" : "Negative"}
        />
      </div>

      {/* Currency Breakdown */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Currency Breakdown
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currencySummaries.map((summary) => (
            <div
              key={summary.currency}
              className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {summary.currency}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    ({summary.accountCount} accounts)
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(summary.balance, summary.currency)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    ≈ {formatCurrency(summary.convertedBalance, baseCurrency)}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Income:</span>
                  <span className="text-green-600 font-medium">
                    +{formatCurrency(summary.monthlyIncome, summary.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Expenses:</span>
                  <span className="text-red-600 font-medium">
                    -{formatCurrency(summary.monthlyExpenses, summary.currency)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Net:</span>
                  <span className={`font-medium ${summary.netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {summary.netAmount >= 0 ? '+' : ''}{formatCurrency(summary.netAmount, summary.currency)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insights */}
      {(topPerformingCurrency || highestBalanceCurrency || mostActiveCurrency) && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
            Portfolio Insights
          </h4>
          <div className="space-y-1 text-sm text-blue-800 dark:text-blue-300">
            {topPerformingCurrency && (
              <div>
                <strong>{topPerformingCurrency.currency}</strong> is your top performing currency this month
                {topPerformingCurrency.netAmount > 0 && (
                  <span> with a net gain of {formatCurrency(topPerformingCurrency.netAmount, topPerformingCurrency.currency)}</span>
                )}
              </div>
            )}
            {highestBalanceCurrency && (
              <div>
                <strong>{highestBalanceCurrency.currency}</strong> holds your largest balance
                <span> of {formatCurrency(highestBalanceCurrency.balance, highestBalanceCurrency.currency)}</span>
              </div>
            )}
            {mostActiveCurrency && (
              <div>
                <strong>{mostActiveCurrency.currency}</strong> has the most transaction activity this month
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
