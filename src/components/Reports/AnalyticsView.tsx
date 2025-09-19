import React, { useState, useEffect, useMemo } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  LineChart,
  Line,
  Area,
  AreaChart,
  ComposedChart,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PiggyBank, 
  CreditCard,
  CheckCircle,
  AlertTriangle,
  Target,
  Calendar,
  Download,
  Globe,
  BarChart3,
  TrendingUpIcon,
  Filter,
  CalendarDays,
  Lightbulb,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useAuthStore } from '../../store/authStore';
import { format, startOfMonth, endOfMonth, subMonths, eachMonthOfInterval, parseISO } from 'date-fns';
import { CustomDropdown } from '../Purchases/CustomDropdown';
import { useNavigate } from 'react-router-dom';

export const AnalyticsView: React.FC = () => {
  const { getActiveTransactions, getDashboardStats, getActiveAccounts } = useFinanceStore();
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  const transactions = getActiveTransactions();
  const accounts = getActiveAccounts();
  const stats = getDashboardStats();
  const [selectedPeriod, setSelectedPeriod] = useState<'current' | 'last3' | 'last6' | 'last12'>('current');
  const [selectedCurrency, setSelectedCurrency] = useState(stats.byCurrency[0]?.currency || 'USD');
  const [showTrends, setShowTrends] = useState(true);

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Helper: Map account_id to currency
  const accountCurrencyMap = useMemo(() => {
    const map: Record<string, string> = {};
    accounts.forEach(acc => { map[acc.id] = acc.currency; });
    return map;
  }, [accounts]);

  // Get transactions for selected currency
  const getCurrencyTransactions = (currency: string) => {
    return transactions.filter(t => {
      const accCurrency = accountCurrencyMap[t.account_id];
      return accCurrency === currency;
    });
  };

  // Get current currency stats
  const currentCurrencyStats = stats.byCurrency.find(s => s.currency === selectedCurrency);
  const currencyTransactions = getCurrencyTransactions(selectedCurrency);

  // Filter currencies based on profile.selected_currencies
  const currencyOptions = useMemo(() => {
    if (profile?.selected_currencies && profile.selected_currencies.length > 0) {
      return stats.byCurrency.filter(s => profile.selected_currencies?.includes?.(s.currency));
    }
    return stats.byCurrency;
  }, [profile?.selected_currencies, stats.byCurrency]);

  // Generate monthly trends data
  const monthlyTrendsData = useMemo(() => {
    const months = eachMonthOfInterval({
      start: subMonths(new Date(), 11),
      end: new Date()
    });

    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthTransactions = currencyTransactions.filter(t => {
        const transactionDate = parseISO(t.date);
        return transactionDate >= monthStart && transactionDate <= monthEnd;
      });

      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      return {
        month: format(month, 'MMM'),
        income,
        expenses,
        net: income - expenses,
        date: month
      };
    });
  }, [currencyTransactions]);

  // Calculate trends
  const trends = useMemo(() => {
    if (monthlyTrendsData.length < 2) return null;
    
    const current = monthlyTrendsData[monthlyTrendsData.length - 1];
    const previous = monthlyTrendsData[monthlyTrendsData.length - 2];
    
    const incomeChange = previous.income > 0 ? ((current.income - previous.income) / previous.income) * 100 : 0;
    const expenseChange = previous.expenses > 0 ? ((current.expenses - previous.expenses) / previous.expenses) * 100 : 0;
    const netChange = previous.net !== 0 ? ((current.net - previous.net) / Math.abs(previous.net)) * 100 : 0;
    
    return { incomeChange, expenseChange, netChange };
  }, [monthlyTrendsData]);

  // Net Cash Flow Gauge Component
  const NetCashFlowGauge: React.FC = () => {
    if (!currentCurrencyStats) {
      return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200">Net Cash Flow</h3>
          <div className="text-center text-gray-500 dark:text-gray-400">No data available for {selectedCurrency}</div>
        </div>
      );
    }

    const { monthlyIncome, monthlyExpenses } = currentCurrencyStats;
    const surplus = monthlyIncome - monthlyExpenses;
    const isSurplus = surplus >= 0;
    
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Net Cash Flow ({selectedCurrency})</h3>
          {trends && (
            <div className={`flex items-center space-x-1 text-sm ${
              trends.netChange >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {trends.netChange >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              <span>{Math.abs(trends.netChange).toFixed(1)}%</span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-600 dark:text-gray-300">Income</span>
                <span className="font-semibold text-green-600">{formatCurrency(monthlyIncome, selectedCurrency)}</span>
                {trends && (
                  <span className={`text-xs ${trends.incomeChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {trends.incomeChange >= 0 ? '+' : ''}{trends.incomeChange.toFixed(1)}%
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <TrendingDown className="w-5 h-5 text-red-600" />
                <span className="text-sm text-gray-600 dark:text-gray-300">Expenses</span>
                <span className="font-semibold text-red-600">{formatCurrency(monthlyExpenses, selectedCurrency)}</span>
                {trends && (
                  <span className={`text-xs ${trends.expenseChange <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {trends.expenseChange >= 0 ? '+' : ''}{trends.expenseChange.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
            <div className={`text-center p-4 rounded-lg ${isSurplus ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700'}`}>
              <div className={`text-2xl font-bold ${isSurplus ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {isSurplus ? 'Surplus' : 'Deficit'}
              </div>
              <div className={`text-xl font-semibold ${isSurplus ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                {formatCurrency(Math.abs(surplus), selectedCurrency)}
              </div>
            </div>
          </div>
          <div className="w-24 h-24 relative">
            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="#E5E7EB"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke={isSurplus ? "#10B981" : "#EF4444"}
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${Math.min(100, (Math.abs(surplus) / monthlyIncome) * 100)} 100`}
                strokeDashoffset="0"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-sm font-semibold ${isSurplus ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatPercentage((Math.abs(surplus) / monthlyIncome) * 100)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Monthly Trends Chart Component
  const MonthlyTrendsChart: React.FC = () => {
    if (monthlyTrendsData.length === 0) {
      return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200">Monthly Trends ({selectedCurrency})</h3>
          <div className="text-center text-gray-500 dark:text-gray-400">No trend data available</div>
        </div>
      );
    }

    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200">Monthly Trends ({selectedCurrency})</h3>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={monthlyTrendsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="month" 
              stroke="#6B7280"
              fontSize={12}
            />
            <YAxis 
              stroke="#6B7280"
              fontSize={12}
              tickFormatter={(value) => formatCurrency(value, selectedCurrency)}
            />
            <Tooltip 
              formatter={(value: number) => [formatCurrency(value, selectedCurrency), '']}
              labelFormatter={(label) => `${label} 2024`}
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#F9FAFB'
              }}
            />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="income" 
              stackId="1"
              stroke="#10B981" 
              fill="#10B981" 
              fillOpacity={0.3}
              name="Income"
            />
            <Area 
              type="monotone" 
              dataKey="expenses" 
              stackId="1"
              stroke="#EF4444" 
              fill="#EF4444" 
              fillOpacity={0.3}
              name="Expenses"
            />
            <Line 
              type="monotone" 
              dataKey="net" 
              stroke="#3B82F6" 
              strokeWidth={3}
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              name="Net"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Spending by Category Donut Component
  const SpendingByCategoryDonut: React.FC = () => {
    // Calculate spending by category for the selected currency
    const categorySpending = currencyTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, transaction) => {
        const category = transaction.category || 'Uncategorized';
        if (!acc[category]) {
          acc[category] = 0;
        }
        acc[category] += Math.abs(transaction.amount);
        return acc;
      }, {} as Record<string, number>);

    const data = Object.entries(categorySpending).map(([name, value], index) => ({
      name,
      value,
      color: `hsl(${index * 60}, 70%, 50%)`,
      current: value,
      average: value * 0.9 // Dummy average for now
    }));

    if (data.length === 0) {
      return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200">Spending by Category ({selectedCurrency})</h3>
          <div className="text-center text-gray-500 dark:text-gray-400">No spending data available</div>
        </div>
      );
    }

    const highestCategory = data.reduce((max, item) => item.value > max.value ? item : max);
    
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200">Spending by Category ({selectedCurrency})</h3>
        <div className="flex items-center space-x-6">
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
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
                    formatCurrency(value, selectedCurrency),
                    name
                  ]}
                  labelFormatter={(label) => `${label} (Current vs Avg)`}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                          <p className="font-semibold">{data.name}</p>
                          <p className="text-sm text-gray-600">
                            Current: {formatCurrency(data.current, selectedCurrency)}
                          </p>
                          <p className="text-sm text-gray-500">
                            Average: {formatCurrency(data.average, selectedCurrency)}
                          </p>
                          <p className={`text-sm ${data.current < data.average ? 'text-green-600' : 'text-red-600'}`}>
                            {data.current < data.average ? '↓' : '↑'} {Math.abs(((data.current - data.average) / data.average) * 100).toFixed(1)}%
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
              {data.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.name === highestCategory.name ? '#F59E0B' : category.color }}
                    />
                    <span className={`text-sm ${category.name === highestCategory.name ? 'font-semibold' : ''}`}>
                      {category.name}
                    </span>
                    {category.name === highestCategory.name && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                        Highest
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium">{formatCurrency(category.value, selectedCurrency)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Debt Payoff Progress Component
  const DebtPayoffProgress: React.FC = () => {
    // Calculate debt-related transactions for the selected currency
    const debtTransactions = currencyTransactions.filter(t => 
      t.type === 'expense' && 
      (t.category?.toLowerCase().includes('debt') || 
       t.category?.toLowerCase().includes('loan') ||
       t.description?.toLowerCase().includes('debt') ||
       t.description?.toLowerCase().includes('loan'))
    );

    const totalDebt = debtTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const paidOff = totalDebt * 0.7; // Dummy calculation - in real app, this would track actual debt payments
    const remaining = totalDebt - paidOff;
    const percentage = totalDebt > 0 ? (paidOff / totalDebt) * 100 : 0;
    const milestone = Math.floor(percentage / 10) * 10;
    
    if (totalDebt === 0) {
      return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200">Debt Payoff Progress ({selectedCurrency})</h3>
          <div className="text-center text-gray-500 dark:text-gray-400">No debt transactions found</div>
        </div>
      );
    }
    
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200">Debt Payoff Progress ({selectedCurrency})</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Debt</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(totalDebt, selectedCurrency)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Remaining</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(remaining, selectedCurrency)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Paid Off</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(paidOff, selectedCurrency)}</p>
            </div>
          </div>
          
          <div className="relative">
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className="bg-gradient-to-r from-green-500 to-green-600 h-4 rounded-full transition-all duration-1000"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="absolute -top-8 left-0 right-0 flex justify-between text-xs text-gray-500">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{formatPercentage(percentage)}</div>
            <p className="text-sm text-gray-600">Complete</p>
          </div>
          
          {milestone > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <div className="text-2xl">🎉</div>
              <div className="font-semibold text-green-800">{milestone}% paid off!</div>
            </div>
          )}
          
          <div className="mt-4">
            <h4 className="text-sm font-semibold mb-2">Monthly Debt Payments</h4>
            <div className="text-sm text-gray-600">
              Based on {debtTransactions.length} debt-related transactions
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Savings Goal Thermometer Component
  const SavingsGoalThermometer: React.FC = () => {
    // Calculate savings-related transactions for the selected currency
    const savingsTransactions = currencyTransactions.filter(t => 
      t.type === 'income' && 
      (t.category?.toLowerCase().includes('savings') || 
       t.category?.toLowerCase().includes('investment') ||
       t.description?.toLowerCase().includes('savings') ||
       t.description?.toLowerCase().includes('investment'))
    );

    const totalSaved = savingsTransactions.reduce((sum, t) => sum + t.amount, 0);
    const target = totalSaved * 1.5; // Dummy target - in real app, this would come from savings goals
    const percentage = target > 0 ? (totalSaved / target) * 100 : 0;
    const monthlyContribution = totalSaved / 12; // Average monthly contribution
    const projectedCompletion = target > totalSaved ? Math.ceil((target - totalSaved) / monthlyContribution) : 0;
    
    if (totalSaved === 0) {
      return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200">Savings Goal ({selectedCurrency})</h3>
          <div className="text-center text-gray-500 dark:text-gray-400">No savings transactions found</div>
        </div>
      );
    }
    
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200">Savings Goal ({selectedCurrency})</h3>
        <div className="flex items-center space-x-6">
          <div className="flex-1">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Target</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(target, selectedCurrency)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Current</p>
                  <p className="text-xl font-bold text-blue-600">{formatCurrency(totalSaved, selectedCurrency)}</p>
                </div>
              </div>
              
              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-6">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-6 rounded-full transition-all duration-1000"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="absolute -top-6 left-0 right-0 flex justify-between text-xs text-gray-500">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatPercentage(percentage)}</div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Complete</p>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-semibold text-blue-800 dark:text-blue-300">Projection</span>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  At this rate, you'll hit 100% in {projectedCompletion} months
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Monthly contribution: {formatCurrency(monthlyContribution, selectedCurrency)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex-shrink-0">
            <div className="w-20 h-32 bg-gray-100 dark:bg-gray-800 rounded-full border-4 border-gray-200 dark:border-gray-600 relative overflow-hidden">
              <div 
                className="absolute bottom-0 w-full bg-gradient-to-t from-blue-500 to-blue-600 transition-all duration-1000"
                style={{ height: `${percentage}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <PiggyBank className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Smart Recommendations Component
  const SmartRecommendations: React.FC = () => {
    const recommendations = [];
    
    if (currentCurrencyStats) {
      const { monthlyIncome, monthlyExpenses } = currentCurrencyStats;
      const netIncome = monthlyIncome - monthlyExpenses;
      const savingsRate = monthlyIncome > 0 ? (netIncome / monthlyIncome) * 100 : 0;
      
      // Savings recommendations
      if (savingsRate < 20) {
        recommendations.push({
          type: 'savings',
          title: 'Increase Savings Rate',
          description: `Your current savings rate is ${formatPercentage(savingsRate)}. Aim for 20% to build wealth faster.`,
          action: 'Set up automatic transfers',
          priority: 'high'
        });
      }
      
      // Spending recommendations
      if (monthlyExpenses > monthlyIncome * 0.8) {
        recommendations.push({
          type: 'spending',
          title: 'Review High Spending',
          description: 'Your expenses are high relative to income. Consider reviewing discretionary spending.',
          action: 'Analyze spending categories',
          priority: 'medium'
        });
      }
      
      // Debt recommendations
      const debtTransactions = currencyTransactions.filter(t => 
        t.type === 'expense' && 
        (t.category?.toLowerCase().includes('debt') || 
         t.category?.toLowerCase().includes('loan'))
      );
      
      if (debtTransactions.length > 0) {
        recommendations.push({
          type: 'debt',
          title: 'Focus on Debt Payoff',
          description: 'You have debt payments. Consider prioritizing high-interest debt first.',
          action: 'Create debt payoff plan',
          priority: 'high'
        });
      }
    }
    
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'general',
        title: 'Great Financial Health!',
        description: 'Your finances look healthy. Keep up the good work!',
        action: 'Continue current habits',
        priority: 'low'
      });
    }
    
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Lightbulb className="w-5 h-5 text-yellow-600" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Smart Recommendations</h3>
        </div>
        <div className="space-y-3">
          {recommendations.map((rec, index) => (
            <div 
              key={index}
              className={`p-4 rounded-lg border ${
                rec.priority === 'high' 
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700' 
                  : rec.priority === 'medium'
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700'
                  : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{rec.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{rec.description}</p>
                  <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                    {rec.action} →
                  </button>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  rec.priority === 'high' 
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                    : rec.priority === 'medium'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                }`}>
                  {rec.priority}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Positive Reinforcement Alerts Component
  const PositiveReinforcementAlerts: React.FC = () => {
    // Generate alerts based on real data
    const alerts = [];
    
    if (currentCurrencyStats) {
      const { monthlyIncome, monthlyExpenses } = currentCurrencyStats;
      const netIncome = monthlyIncome - monthlyExpenses;
      
      // Surplus alert
      if (netIncome > 0) {
        alerts.push({
          type: 'success',
          message: `👍 Great job! You have a ${formatCurrency(netIncome, selectedCurrency)} surplus this month!`,
          category: 'Cash Flow'
        });
      } else {
        alerts.push({
          type: 'warning',
          message: `⚠️ You have a ${formatCurrency(Math.abs(netIncome), selectedCurrency)} deficit this month.`,
          category: 'Cash Flow'
        });
      }
      
      // Savings rate alert
      const savingsRate = monthlyIncome > 0 ? (netIncome / monthlyIncome) * 100 : 0;
      if (savingsRate >= 20) {
        alerts.push({
          type: 'success',
          message: `🎉 Excellent! You're saving ${formatPercentage(savingsRate)} of your income!`,
          category: 'Savings'
        });
      } else if (savingsRate >= 10) {
        alerts.push({
          type: 'success',
          message: `💪 Good progress! You're saving ${formatPercentage(savingsRate)} of your income.`,
          category: 'Savings'
        });
      } else {
        alerts.push({
          type: 'warning',
          message: `📈 Consider increasing your savings rate. Currently at ${formatPercentage(savingsRate)}.`,
          category: 'Savings'
        });
      }
    }
    
    // Category spending alerts
    const categorySpending = currencyTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, transaction) => {
        const category = transaction.category || 'Uncategorized';
        if (!acc[category]) {
          acc[category] = 0;
        }
        acc[category] += Math.abs(transaction.amount);
        return acc;
      }, {} as Record<string, number>);

    const highestSpendingCategory = Object.entries(categorySpending)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (highestSpendingCategory) {
      alerts.push({
        type: 'warning',
        message: `📊 Your highest spending category is ${highestSpendingCategory[0]} at ${formatCurrency(highestSpendingCategory[1], selectedCurrency)}`,
        category: 'Spending'
      });
    }
    
    if (alerts.length === 0) {
      alerts.push({
        type: 'success',
        message: `📈 No transactions found for ${selectedCurrency}. Add some transactions to see insights!`,
        category: 'General'
      });
    }
    
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200">Insights & Alerts ({selectedCurrency})</h3>
        <div className="space-y-3">
          {alerts.map((alert, index) => (
            <div 
              key={index}
              className={`p-3 rounded-lg border ${
                alert.type === 'success' 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-800 dark:text-green-300' 
                  : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                {alert.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                )}
                <span className="text-sm font-medium">{alert.message}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div data-tour="analytics-overview" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Financial Analytics</h2>
          <p className="text-gray-600 dark:text-gray-300">Comprehensive insights into your financial health</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <CustomDropdown
            options={currencyOptions.map(({ currency }) => ({ value: currency, label: currency }))}
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
          <button 
            onClick={() => setShowTrends(!showTrends)}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
          >
            <TrendingUpIcon className="w-4 h-4" />
            <span>{showTrends ? 'Hide' : 'Show'} Trends</span>
          </button>
          <button 
            onClick={() => navigate('/currency-analytics')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
          >
            <Globe className="w-4 h-4" />
            <span>Currency Analytics</span>
          </button>
          <button 
            data-tour="export-data"
            className="bg-gradient-primary hover:bg-gradient-primary-hover text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Monthly Trends Chart - Full Width */}
      {showTrends && <div data-tour="balance-trend"><MonthlyTrendsChart /></div>}

      {/* Main Analytics Grid */}
      <div data-tour="spending-chart" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NetCashFlowGauge />
        <SpendingByCategoryDonut />
        <DebtPayoffProgress />
        <SavingsGoalThermometer />
      </div>

      {/* Smart Recommendations */}
      <SmartRecommendations />

      {/* Positive Reinforcement Alerts */}
      <PositiveReinforcementAlerts />
    </div>
  );
}; 