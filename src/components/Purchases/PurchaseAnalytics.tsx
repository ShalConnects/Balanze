import React, { useState, useMemo, useEffect } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { formatCurrency } from '../../utils/currency';
import { CustomDropdown } from './CustomDropdown';
import { useAuthStore } from '../../store/authStore';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  ShoppingBag,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Sparkles,
  BarChart3,
  Target,
  Zap,
  Download
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  ComposedChart,
  BarChart,
  Bar
} from 'recharts';
import { addMonths, format, getDaysInMonth, startOfMonth, getDay, isSameDay, subMonths, startOfDay, endOfDay, isWithinInterval } from 'date-fns';

export const PurchaseAnalytics: React.FC = () => {
  const { getMultiCurrencyPurchaseAnalytics, purchases, getActiveAccounts } = useFinanceStore();
  const { profile } = useAuthStore();
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [selectedPeriod, setSelectedPeriod] = useState<'current' | 'last3' | 'last6' | 'last12'>('current');
  
  const analytics = getMultiCurrencyPurchaseAnalytics();
  const accounts = getActiveAccounts();
  
  // Get available currencies from accounts
  const availableCurrencies = Array.from(new Set(accounts.map(a => a.currency)));
  
  // Filter currencies based on user's selected currencies
  const userCurrencies = useMemo(() => {
    if (profile?.selected_currencies && profile.selected_currencies.length > 0) {
      return profile.selected_currencies;
    }
    return availableCurrencies;
  }, [profile?.selected_currencies, availableCurrencies]);
  
  const filteredCurrencies = useMemo(() => {
    return availableCurrencies.filter(currency => 
      userCurrencies.includes(currency)
    );
  }, [availableCurrencies, userCurrencies]);
  
  const currencyOptions = useMemo(() => {
    return filteredCurrencies.length > 0 
      ? filteredCurrencies.map(currency => ({ value: currency, label: currency }))
      : availableCurrencies.map(currency => ({ value: currency, label: currency }));
  }, [filteredCurrencies, availableCurrencies]);



  // Set default currency
  useEffect(() => {
    if (currencyOptions.length > 0 && (!selectedCurrency || !currencyOptions.find(c => c.value === selectedCurrency))) {
      setSelectedCurrency(currencyOptions[0].value);
    }
  }, [currencyOptions, selectedCurrency]);

  const formatCurrencyWithSymbol = (amount: number) => {
    return formatCurrency(amount, selectedCurrency);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Get purchases for selected currency
  const getCurrencyPurchases = (currency: string) => {
    return purchases.filter(p => p.currency === currency);
  };

  // Get current currency analytics
  const currentCurrencyAnalytics = analytics.byCurrency.find(a => a.currency === selectedCurrency);
  const currencyPurchases = getCurrencyPurchases(selectedCurrency);

  // Filter purchases by period
  const getPeriodPurchases = (period: string) => {
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'current':
        startDate = startOfMonth(now);
        break;
      case 'last3':
        startDate = subMonths(now, 3);
        break;
      case 'last6':
        startDate = subMonths(now, 6);
        break;
      case 'last12':
        startDate = subMonths(now, 12);
        break;
      default:
        startDate = startOfMonth(now);
    }
    
    return currencyPurchases.filter(purchase => {
      const purchaseDate = new Date(purchase.purchase_date);
      return purchaseDate >= startDate && purchaseDate <= now;
    });
  };

  const periodPurchases = getPeriodPurchases(selectedPeriod);

  // Calculate KPIs for the selected period
  const totalSpent = periodPurchases
    .filter(p => p.status === 'purchased')
    .reduce((sum, p) => sum + Number(p.price), 0);
  
  const purchaseCount = periodPurchases.filter(p => p.status === 'purchased').length;
  const plannedCount = periodPurchases.filter(p => p.status === 'planned').length;
  const averagePurchase = purchaseCount > 0 ? totalSpent / purchaseCount : 0;
  
  // Budget utilization (dummy calculation)
  const budgetUtilization = 75;
  const budgetVsActual = -100;

  // Generate trend data for the selected period
  const generateTrendData = () => {
    const now = new Date();
    const days = selectedPeriod === 'current' ? 30 : selectedPeriod === 'last3' ? 90 : selectedPeriod === 'last6' ? 180 : 365;
    const trendData = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      
      const dayPurchases = periodPurchases.filter(p => {
        const purchaseDate = new Date(p.purchase_date);
        return purchaseDate.toISOString().split('T')[0] === dateKey;
      });
      
      const dailySpend = dayPurchases
        .filter(p => p.status === 'purchased')
        .reduce((sum, p) => sum + Number(p.price), 0);
      
      const purchaseCount = dayPurchases.filter(p => p.status === 'purchased').length;
      
      trendData.push({
        date: dateKey,
        spend: Math.round(dailySpend),
        purchases: purchaseCount
      });
    }
    
    return trendData;
  };

  const trendData = useMemo(() => generateTrendData(), [periodPurchases, selectedPeriod]);

  // Generate category breakdown
  const generateCategoryData = () => {
    const categoryMap = new Map();
    
    periodPurchases
      .filter(p => p.status === 'purchased')
      .forEach(purchase => {
        const category = purchase.category || 'Other';
        if (!categoryMap.has(category)) {
          categoryMap.set(category, { total: 0, count: 0 });
        }
        categoryMap.get(category).total += Number(purchase.price);
        categoryMap.get(category).count += 1;
      });
    
    const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];
    
    return Array.from(categoryMap.entries()).map(([name, data], index) => ({
      name,
      value: Math.round(data.total),
      count: data.count,
      color: colors[index % colors.length]
    }));
  };

  const categoryData = useMemo(() => generateCategoryData(), [periodPurchases]);

  // Smart alerts
  const generateAlerts = () => {
    const alerts = [];
    
    // Check if spending is lower than previous period
    const recentSpending = trendData.slice(-7).reduce((sum, day) => sum + day.spend, 0);
    const previousPeriodSpending = trendData.slice(-14, -7).reduce((sum, day) => sum + day.spend, 0);
    
    if (recentSpending < previousPeriodSpending * 0.8 && previousPeriodSpending > 0) {
      alerts.push({
        type: 'success' as const,
        message: '🎉 You spent 20% less this week vs. last week!',
        icon: Sparkles
      });
    }
    
    if (budgetUtilization > 80) {
      alerts.push({
        type: 'warning' as const,
        message: `⚠️ Over budget on Entertainment by ${formatCurrencyWithSymbol(30)} – consider cutting back.`,
        icon: AlertTriangle
      });
    }
    
    if (purchaseCount === 0) {
      alerts.push({
        type: 'info' as const,
        message: `📈 No purchases found for ${selectedCurrency} in this period. Add some purchases to see insights!`,
        icon: ShoppingBag
      });
    }
    
    return alerts;
  };

  const alerts = generateAlerts();

  // KPI Cards Component
  const KPICards: React.FC = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Spend */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Total Spent</h3>
          <div className="space-y-2">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrencyWithSymbol(totalSpent)}</p>
            <p className={`text-sm ${budgetVsActual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {budgetVsActual >= 0 ? '+' : ''}{formatCurrencyWithSymbol(budgetVsActual)} vs budget
            </p>
          </div>
        </div>

        {/* Budget Utilization */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Budget Utilization</h3>
          <div className="relative">
            <div className="relative w-16 h-16 mx-auto mb-3">
              <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  className="text-gray-200"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                  className={`${budgetUtilization <= 80 ? 'text-green-500' : 'text-orange-500'}`}
                  strokeDasharray={`${(budgetUtilization / 100) * 176} 176`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-gray-900">{budgetUtilization}%</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-300">
              {budgetUtilization <= 80 ? 'On track' : 'Over budget'}
            </p>
          </div>
        </div>

        {/* Purchase Count */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Purchase Count</h3>
          <div className="space-y-2">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{purchaseCount}</p>
            <p className="text-sm text-gray-500 dark:text-gray-300">{plannedCount} planned</p>
          </div>
        </div>

        {/* Average Purchase */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Average Purchase</h3>
          <div className="space-y-2">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrencyWithSymbol(averagePurchase)}</p>
            <p className="text-sm text-gray-500 dark:text-gray-300">per item</p>
          </div>
        </div>
      </div>
    );
  };

  // Spending Trend Component
  const SpendingTrend: React.FC = () => {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Spending Trend ({selectedPeriod === 'current' ? '30 Days' : selectedPeriod === 'last3' ? '3 Months' : selectedPeriod === 'last6' ? '6 Months' : '12 Months'})</h3>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }} 
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              formatter={(value: any) => [formatCurrencyWithSymbol(value), 'Amount']} 
              labelFormatter={(label) => new Date(label).toLocaleDateString()}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Area 
              dataKey="spend" 
              fill="rgba(59, 130, 246, 0.1)" 
              stroke="none" 
              fillOpacity={0.3} 
            />
            <Line 
              type="monotone" 
              dataKey="spend" 
              stroke="#3B82F6" 
              strokeWidth={2} 
              dot={false} 
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Category Breakdown Component
  const CategoryBreakdown: React.FC = () => {
    if (categoryData.length === 0) {
      return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Category Breakdown ({selectedCurrency})</h3>
          <div className="text-center text-gray-500 dark:text-gray-400">No purchase data available</div>
        </div>
      );
    }

    const highestCategory = categoryData.reduce((max, item) => item.value > max.value ? item : max);
    
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Category Breakdown ({selectedCurrency})</h3>
        <div className="flex items-center space-x-6">
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.name === highestCategory.name ? '#F59E0B' : entry.color}
                      stroke={entry.name === highestCategory.name ? '#D97706' : entry.color}
                      strokeWidth={entry.name === highestCategory.name ? 2 : 1}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    formatCurrencyWithSymbol(value),
                    name
                  ]}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                          <p className="font-semibold text-gray-900 dark:text-white">{data.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {formatCurrencyWithSymbol(data.value)} ({data.count} items)
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1">
            <div className="space-y-3">
              {categoryData.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.name === highestCategory.name ? '#F59E0B' : category.color }}
                    />
                    <span className={`text-sm text-gray-900 dark:text-white ${category.name === highestCategory.name ? 'font-semibold' : ''}`}>
                      {category.name}
                    </span>
                    {category.name === highestCategory.name && (
                      <span className="text-xs bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 px-2 py-1 rounded-full">
                        Highest
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrencyWithSymbol(category.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Alerts Component
  const AlertsComponent: React.FC = () => {
    if (alerts.length === 0) return null;
    
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Insights & Alerts ({selectedCurrency})</h3>
        <div className="space-y-3">
          {alerts.map((alert, index) => (
            <div 
              key={index}
              className={`p-3 rounded-lg border ${
                alert.type === 'success' 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-800 dark:text-green-300' 
                  : alert.type === 'warning'
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300'
                  : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <alert.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{alert.message}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-gray-600 dark:text-gray-300">Comprehensive insights into your purchase behavior</p>
        </div>
        <div className="flex space-x-3">
          <CustomDropdown
            options={currencyOptions}
            value={selectedCurrency}
            onChange={setSelectedCurrency}
            fullWidth={false}
          />
          <CustomDropdown
            options={[
              { value: 'current', label: 'Current Month' },
              { value: 'last3', label: 'Last 3 Months' },
              { value: 'last6', label: 'Last 6 Months' },
              { value: 'last12', label: 'Last 12 Months' },
            ]}
            value={selectedPeriod}
            onChange={val => setSelectedPeriod(val as any)}
            fullWidth={false}
          />
          <button className="bg-gradient-primary hover:bg-gradient-primary-hover text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <KPICards />

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SpendingTrend />
        <CategoryBreakdown />
      </div>

      {/* Alerts */}
      <AlertsComponent />
    </div>
  );
}; 

