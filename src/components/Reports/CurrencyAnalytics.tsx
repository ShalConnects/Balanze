import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, RefreshCw, Eye, Home, Quote } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useAuthStore } from '../../store/authStore';
import { MultiCurrencyOverview } from '../Dashboard/MultiCurrencyOverview';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'comparison' | 'earnings'>('overview');
  
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
    const fetchData = async () => {
      try {
        await Promise.all([
          fetchTransactions(),
          fetchAccounts(),
          fetchPurchases()
        ]);
      } catch (error) {
        console.error('Error fetching data for currency analytics:', error);
      }
    };

    fetchData();
  }, [fetchTransactions, fetchAccounts, fetchPurchases]);

  const handleExport = () => {
    // TODO: Implement export functionality
    // Export currency analytics data
  };

  const handleRefresh = () => {
    window.location.reload();
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

  const tabs = [
    { id: 'overview', label: 'Multi-Currency Overview', description: 'Complete view across all currencies' },
    { id: 'comparison', label: 'Currency Performance', description: 'Compare currency performance' },
    { id: 'earnings', label: 'Earnings vs Spending', description: 'Detailed earnings and spending analysis' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/analytics')}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Currency Analytics</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Comprehensive multi-currency financial insights and performance analysis
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
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
            className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600"
          />
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {!showMultiCurrencyAnalytics && (
            <button
              onClick={handleShowOnDashboard}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              title="Show Multi-Currency Analytics on Dashboard"
            >
              <Eye className="w-4 h-4" />
              <span>Show Analytics</span>
            </button>
          )}
          {!showQuoteWidget && (
            <button
              onClick={handleShowQuoteWidget}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              title="Show Quote Widget on Dashboard"
            >
              <Quote className="w-4 h-4" />
              <span>Show Quotes</span>
            </button>
          )}
          <button
            onClick={handleExport}
            className="bg-gradient-primary hover:bg-gradient-primary-hover text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="text-left">
                <div className="font-medium">{tab.label}</div>
                <div className="text-xs opacity-75">{tab.description}</div>
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 dark:text-gray-400">Loading currency analytics...</p>
          </div>
        </div>
      )}

      {/* Content */}
      {!loading && (
        <div className="space-y-6">
          {/* Multi-Currency Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  💡 Multi-Currency Overview
                </h3>
                <p className="text-blue-800 dark:text-blue-200 text-sm">
                  This view shows your complete financial picture across all currencies with automatic conversion to your base currency. 
                  All amounts are converted using current exchange rates for easy comparison.
                </p>
              </div>
              
              <MultiCurrencyOverview
                transactions={transactions}
                accounts={accounts}
                purchases={purchases}
                userProfile={user}
              />
            </div>
          )}

          {/* Currency Performance Tab */}
          {activeTab === 'comparison' && (
            <div className="space-y-6">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                  📊 Currency Performance Analysis
                </h3>
                <p className="text-green-800 dark:text-green-200 text-sm">
                  Compare how different currencies are performing for you. Identify which currencies are generating positive returns 
                  and which ones need attention.
                </p>
              </div>
              
              <CurrencyComparisonWidget
                transactions={transactions}
                accounts={accounts}
                baseCurrency={(user as any)?.local_currency || 'USD'}
              />
            </div>
          )}

          {/* Earnings vs Spending Tab */}
          {activeTab === 'earnings' && (
            <div className="space-y-6">
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-2">
                  💰 Earnings vs Spending Analysis
                </h3>
                <p className="text-purple-800 dark:text-purple-200 text-sm">
                  Detailed breakdown of your earnings and spending across each currency. Understand your cash flow patterns 
                  and identify opportunities for improvement.
                </p>
              </div>
              
              <EarningsSpendingSummary
                transactions={transactions}
                accounts={accounts}
                period={selectedPeriod}
              />
            </div>
          )}
        </div>
      )}

      {/* No Data State */}
      {!loading && accounts.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">💱</span>
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
      {!loading && accounts.length > 0 && accounts.every(acc => acc.currency === accounts[0]?.currency) && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">💱</span>
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
    </div>
  );
}; 