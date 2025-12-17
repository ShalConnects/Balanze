import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowLeft, RefreshCw, Eye, Quote, AlertCircle, Coins } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useAuthStore } from '../../store/authStore';
import { CurrencyComparisonWidget } from '../Dashboard/CurrencyComparisonWidget';
import { EarningsSpendingSummary } from '../Dashboard/EarningsSpendingSummary';
import { CustomDropdown } from '../Purchases/CustomDropdown';

export const CurrencyAnalytics: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    transactions, 
    accounts, 
    purchases,
    fetchTransactions,
    fetchAccounts,
    fetchPurchases,
    loading 
  } = useFinanceStore();

  const [selectedPeriod, setSelectedPeriod] = useState<'1m' | '3m' | '6m' | '1y'>('1m');
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasNavigatedRef = useRef(false);
  
  // Check if Multi-Currency Analytics is hidden on dashboard
  const [showMultiCurrencyAnalytics, setShowMultiCurrencyAnalytics] = useState(() => {
    const saved = localStorage.getItem('showMultiCurrencyAnalytics');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Check if Quote Widget is hidden on dashboard
  const [showQuoteWidget, setShowQuoteWidget] = useState(() => {
    const saved = localStorage.getItem('showQuoteWidget');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Fetch data on component mount
  useEffect(() => {
    hasNavigatedRef.current = true;
    const fetchData = async () => {
      try {
        setError(null);
        await Promise.all([
          fetchTransactions(),
          fetchAccounts(),
          fetchPurchases()
        ]);
      } catch (error) {
        console.error('Error fetching currency analytics data:', error);
        setError('Failed to load currency analytics data. Please try refreshing the page.');
      }
    };

    fetchData();
  }, [fetchTransactions, fetchAccounts, fetchPurchases]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      await Promise.all([
        fetchTransactions(),
        fetchAccounts(),
        fetchPurchases()
      ]);
    } catch (error) {
      console.error('Error refreshing currency analytics data:', error);
      setError('Failed to refresh data. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleShowOnDashboard = () => {
    setShowMultiCurrencyAnalytics(true);
    localStorage.setItem('showMultiCurrencyAnalytics', 'true');
    // Navigate back to dashboard
    navigate('/dashboard');
  };

  const handleShowQuoteWidget = () => {
    setShowQuoteWidget(true);
    localStorage.setItem('showQuoteWidget', 'true');
    // Navigate back to dashboard
    navigate('/dashboard');
  };


  // Memoize active accounts and currency calculations
  const activeAccounts = useMemo(() => {
    return accounts.filter(acc => acc.isActive);
  }, [accounts]);

  const uniqueCurrencies = useMemo(() => {
    return new Set(activeAccounts.map(acc => acc.currency));
  }, [activeAccounts]);

  const hasMultipleCurrencies = useMemo(() => {
    return uniqueCurrencies.size > 1;
  }, [uniqueCurrencies]);

  const hasNoAccounts = useMemo(() => {
    return activeAccounts.length === 0;
  }, [activeAccounts]);

  const isSingleCurrency = useMemo(() => {
    return activeAccounts.length > 0 && uniqueCurrencies.size === 1;
  }, [activeAccounts, uniqueCurrencies]);


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              // Use ref to track if we've navigated, fallback to dashboard
              if (hasNavigatedRef.current || document.referrer) {
                navigate(-1);
              } else {
                navigate('/dashboard');
              }
            }}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Currency Analytics</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
              Comprehensive multi-currency financial insights and performance analysis
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <CustomDropdown
            options={[
              { value: '1m', label: '1 Month' },
              { value: '3m', label: '3 Months' },
              { value: '6m', label: '6 Months' },
              { value: '1y', label: '1 Year' },
            ]}
            value={selectedPeriod}
            onChange={val => setSelectedPeriod(val as '1m' | '3m' | '6m' | '1y')}
            fullWidth={false}
            className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-xs sm:text-sm"
          />
          <button
            onClick={handleRefresh}
            disabled={loading || isRefreshing}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Refresh data"
            title="Refresh data"
          >
            <RefreshCw className={`w-5 h-5 ${loading || isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          {!showMultiCurrencyAnalytics && (
            <button
              onClick={handleShowOnDashboard}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm"
              title="Show Multi-Currency Analytics on Dashboard"
              aria-label="Show Multi-Currency Analytics on Dashboard"
            >
              <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Show Analytics</span>
              <span className="sm:hidden">Analytics</span>
            </button>
          )}
          {!showQuoteWidget && (
            <button
              onClick={handleShowQuoteWidget}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm"
              title="Show Quote Widget on Dashboard"
              aria-label="Show Quote Widget on Dashboard"
            >
              <Quote className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Show Quotes</span>
              <span className="sm:hidden">Quotes</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-red-900 dark:text-red-100 mb-1">Error</h3>
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && !isRefreshing && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 dark:text-gray-400">Loading currency analytics...</p>
          </div>
        </div>
      )}

      {/* Content - Only show if not loading, no error, and we have data */}
      {!loading && !error && !hasNoAccounts && !isSingleCurrency && (
        <div className="space-y-6">
          <CurrencyComparisonWidget
            transactions={transactions}
            accounts={accounts}
            baseCurrency={(user as any)?.local_currency || 'USD'}
          />
          
          <EarningsSpendingSummary
            transactions={transactions}
            accounts={accounts}
            period={selectedPeriod}
          />
        </div>
      )}

      {/* Empty States - Only show if not loading, no error */}
      {!loading && !error && (
        <>
          {/* No Data State */}
          {hasNoAccounts && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Coins className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Currency Data Available
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Add accounts with different currencies to see currency analytics.
              </p>
              <button
                onClick={() => navigate('/accounts')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Add Account
              </button>
            </div>
          )}

          {/* Single Currency State */}
          {!hasNoAccounts && isSingleCurrency && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Coins className="w-8 h-8 text-blue-500 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Single Currency Detected
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Currency analytics are most useful when you have accounts in multiple currencies.
              </p>
              <button
                onClick={() => navigate('/accounts')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Add Multi-Currency Account
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}; 

