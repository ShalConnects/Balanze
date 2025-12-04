import React, { useState, useMemo } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { formatCurrency } from '../../utils/currency';
import { CustomDropdown } from '../Purchases/CustomDropdown';
import { useAuthStore } from '../../store/authStore';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Handshake,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Sparkles,
  ChevronDown,
  ThumbsUp,
  ThumbsDown,
  Trophy,
  Award,
  Star,
  Plus,
  CreditCard
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Dummy data for demonstration
const generateDummyData = (currency: string) => {
  const now = new Date();
  
  // Generate loan aging data
  const agingData = [
    { age: '0-30d', count: 8, amount: 2400, color: '#10B981' },
    { age: '31-60d', count: 3, amount: 1200, color: '#F59E0B' },
    { age: '61+d', count: 2, amount: 800, color: '#EF4444' }
  ];
  
  // Generate upcoming due dates
  const upcomingDue = [
    { id: 1, type: 'lend', person: 'John Smith', amount: 500, dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), icon: '🤝' },
    { id: 2, type: 'borrow', person: 'Sarah Johnson', amount: 300, dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), icon: '💼' },
    { id: 3, type: 'lend', person: 'Mike Wilson', amount: 750, dueDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000), icon: '🤝' },
    { id: 4, type: 'borrow', person: 'Lisa Brown', amount: 200, dueDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), icon: '💼' },
    { id: 5, type: 'lend', person: 'David Lee', amount: 400, dueDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000), icon: '🤝' }
  ];
  
  // Generate milestones/badges
  const milestones = [
    { id: 1, title: 'Loan Round-Trip', description: 'Completed 5 full loan cycles', icon: Trophy, achieved: true, color: '#F59E0B' },
    { id: 2, title: 'Super Lender', description: 'Lent over $10,000 total', icon: Award, achieved: true, color: '#10B981' },
    { id: 3, title: 'Trust Builder', description: 'Maintained 100% repayment rate', icon: Star, achieved: false, color: '#3B82F6' },
    { id: 4, title: 'Quick Settler', description: 'Settled 3 loans within 30 days', icon: CheckCircle, achieved: true, color: '#8B5CF6' }
  ];
  
  return {
    agingData,
    upcomingDue,
    milestones
  };
};

export const LendBorrowAnalytics: React.FC = () => {
  const { getLendBorrowAnalytics, lendBorrowRecords } = useFinanceStore();
  const { profile } = useAuthStore();
  const [selectedCurrency, setSelectedCurrency] = useState('USD');

  
  const analytics = getLendBorrowAnalytics();
  const currentCurrencyAnalytics = analytics.byCurrency?.find(a => a.currency === selectedCurrency) || analytics.byCurrency?.[0];
  
  // Generate real data from actual records
  const realData = useMemo(() => {
    const now = new Date();
    const currencyRecords = lendBorrowRecords.filter(r => r.currency === selectedCurrency);
    
    // Separate records that affect account balance from standalone records
    const recordsAffectingBalance = currencyRecords.filter(r => r.affect_account_balance === true);
    const standaloneRecords = currencyRecords.filter(r => r.affect_account_balance === false);
    
    // Calculate loan aging data
    const agingData = [
      { age: '0-30d', count: 0, amount: 0, color: '#10B981' },
      { age: '31-60d', count: 0, amount: 0, color: '#F59E0B' },
      { age: '61+d', count: 0, amount: 0, color: '#EF4444' }
    ];
    
    // Only include records that affect account balance in aging analysis
    recordsAffectingBalance.forEach(record => {
      if (record.due_date && record.due_date !== '') {
        const dueDate = new Date(record.due_date);
        const daysDiff = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff <= 30) {
          agingData[0].count++;
          agingData[0].amount += record.amount;
        } else if (daysDiff <= 60) {
          agingData[1].count++;
          agingData[1].amount += record.amount;
        } else {
          agingData[2].count++;
          agingData[2].amount += record.amount;
        }
      }
    });
    
    // Generate upcoming due dates from real records (only those affecting balance)
    const upcomingDue = recordsAffectingBalance
      .filter(record => record.due_date && record.due_date !== '' && record.status === 'active')
      .map(record => {
        const dueDate = new Date(record.due_date);
        const daysDiff = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return {
          id: record.id,
          type: record.type,
          person: record.person_name,
          amount: record.amount,
          dueDate: dueDate,
          icon: record.type === 'lend' ? '🤝' : '💼'
        };
      })
      .filter(item => item.dueDate > now) // Only future due dates
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime()) // Sort by due date
      .slice(0, 5); // Take top 5
    
    // Calculate real milestones based on actual data (only records affecting balance)
    const totalRecords = recordsAffectingBalance.length;
    const settledRecords = recordsAffectingBalance.filter(r => r.status === 'settled').length;
    const totalLent = recordsAffectingBalance.filter(r => r.type === 'lend').reduce((sum, r) => sum + r.amount, 0);
    const repaymentRate = totalRecords > 0 ? (settledRecords / totalRecords) * 100 : 0;
    
    const milestones = [
      { 
        id: 1, 
        title: 'Loan Round-Trip', 
        description: 'Completed 5 full loan cycles', 
        icon: Trophy, 
        achieved: settledRecords >= 5, 
        color: '#F59E0B' 
      },
      { 
        id: 2, 
        title: 'Super Lender', 
        description: 'Lent over $10,000 total', 
        icon: Award, 
        achieved: totalLent >= 10000, 
        color: '#10B981' 
      },
      { 
        id: 3, 
        title: 'Trust Builder', 
        description: 'Maintained 100% repayment rate', 
        icon: Star, 
        achieved: repaymentRate >= 100, 
        color: '#3B82F6' 
      },
      { 
        id: 4, 
        title: 'Quick Settler', 
        description: 'Settled 3 loans within 30 days', 
        icon: CheckCircle, 
        achieved: settledRecords >= 3, 
        color: '#8B5CF6' 
      }
    ];
    
    return {
      agingData,
      upcomingDue,
      milestones
    };
  }, [lendBorrowRecords, selectedCurrency]);
  
  // Calculate KPIs from real data (only records affecting account balance)
  const currencyRecords = lendBorrowRecords.filter(r => r.currency === selectedCurrency);
  const recordsAffectingBalance = currencyRecords.filter(r => r.affect_account_balance === true);
  const standaloneRecords = currencyRecords.filter(r => r.affect_account_balance === false);
  
  const totalLent = recordsAffectingBalance.filter(r => r.type === 'lend').reduce((sum, r) => sum + r.amount, 0);
  const totalBorrowed = recordsAffectingBalance.filter(r => r.type === 'borrow').reduce((sum, r) => sum + r.amount, 0);
  const outstandingLent = recordsAffectingBalance.filter(r => r.type === 'lend' && r.status === 'active').reduce((sum, r) => sum + r.amount, 0);
  const outstandingBorrowed = recordsAffectingBalance.filter(r => r.type === 'borrow' && r.status === 'active').reduce((sum, r) => sum + r.amount, 0);
  const overdueCount = recordsAffectingBalance.filter(r => r.status === 'overdue').length;
  const activeLentCount = recordsAffectingBalance.filter(r => r.type === 'lend' && r.status === 'active').length;
  const activeBorrowedCount = recordsAffectingBalance.filter(r => r.type === 'borrow' && r.status === 'active').length;
  
  // Standalone records stats
  const standaloneLent = standaloneRecords.filter(r => r.type === 'lend').reduce((sum, r) => sum + r.amount, 0);
  const standaloneBorrowed = standaloneRecords.filter(r => r.type === 'borrow').reduce((sum, r) => sum + r.amount, 0);
  const standaloneCount = standaloneRecords.length;
  
  // Calculate net position and percentages
  const netPosition = totalLent - totalBorrowed;
  const isNetPositive = netPosition >= 0;
  const lentRepaidPercent = totalLent > 0 ? ((totalLent - outstandingLent) / totalLent) * 100 : 0;
  const borrowRepaidPercent = totalBorrowed > 0 ? ((totalBorrowed - outstandingBorrowed) / totalBorrowed) * 100 : 0;
  
  const formatCurrencyWithSymbol = (amount: number) => {
    return formatCurrency(amount, selectedCurrency);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysUntilDue = (dueDate: Date) => {
    const diffTime = dueDate.getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Currency options: only show selected_currencies if available, else all
  const allCurrencyOptions = [
    { value: 'USD', label: 'USD' },
    { value: 'EUR', label: 'EUR' },
    { value: 'GBP', label: 'GBP' },
    { value: 'BDT', label: 'BDT' },
    { value: 'JPY', label: 'JPY' },
    { value: 'CAD', label: 'CAD' },
    { value: 'AUD', label: 'AUD' },
  ];
  const currencyOptions = profile?.selected_currencies && profile.selected_currencies.length > 0
    ? allCurrencyOptions.filter(opt => profile.selected_currencies?.includes?.(opt.value))
    : allCurrencyOptions;

  return (
    <div className="space-y-6 w-full">
      {/* Header with Currency Selector and Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Lent & Borrow Analytics</h1>
          <p className="text-gray-600 dark:text-gray-300">Comprehensive insights into your lending and borrowing activity</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Currency Selector */}
          <CustomDropdown
            options={currencyOptions}
            value={selectedCurrency}
            onChange={setSelectedCurrency}
            fullWidth={false}
          />
        </div>
      </div>

      {/* Hero KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Lent Out Card */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <Handshake className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Lent Out</span>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrencyWithSymbol(totalLent)}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">• {activeLentCount} active loans</p>
          </div>
        </div>

        {/* Total Borrowed Card */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Borrowed</span>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrencyWithSymbol(totalBorrowed)}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">• {activeBorrowedCount} active debts</p>
          </div>
        </div>

        {/* Net Position Card */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isNetPositive ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
                {isNetPositive ? (
                  <ThumbsUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : (
                  <ThumbsDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                )}
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Net Position</span>
            </div>
          </div>
          <div className="space-y-2">
            <p className={`text-3xl font-bold ${isNetPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {isNetPositive ? '+' : ''}{formatCurrencyWithSymbol(netPosition)}
            </p>
            <p className={`text-sm ${isNetPositive ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
              {isNetPositive ? 'Net lender' : 'Net borrower'}
            </p>
          </div>
        </div>

        {/* Overdue Loans Card */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Overdue Loans</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-red-600 dark:text-red-400">{overdueCount}</span>
              {overdueCount > 0 && (
                <div className="bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 text-xs px-2 py-1 rounded-full font-medium">
                  Action needed
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {overdueCount > 0 ? 'Requires attention' : 'All loans current'}
            </p>
          </div>
        </div>
      </div>

      {/* Outstanding Balance Progress Bars */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Repayment Progress</h3>
        <div className="space-y-6">
          {/* Lent Repaid Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Lent Repaid</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{lentRepaidPercent.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div 
                className="bg-green-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${lentRepaidPercent}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatCurrencyWithSymbol(totalLent - outstandingLent)} repaid of {formatCurrencyWithSymbol(totalLent)}
            </p>
          </div>

          {/* Borrow Repaid Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Borrow Repaid</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{borrowRepaidPercent.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div 
                className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${borrowRepaidPercent}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatCurrencyWithSymbol(totalBorrowed - outstandingBorrowed)} repaid of {formatCurrencyWithSymbol(totalBorrowed)}
            </p>
          </div>
        </div>
        {/* Comment: Progress bars leverage progress metaphors to reward repayments */}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Loan Aging Chart */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Loan Aging Analysis</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={realData.agingData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="age" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value: any, name: any) => [
                  name === 'count' ? `${value} loans` : formatCurrencyWithSymbol(value), 
                  name === 'count' ? 'Count' : 'Amount'
                ]}
                labelFormatter={(label) => `${label} overdue`}
              />
              <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Current</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span>Near Due</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>Overdue</span>
            </div>
          </div>
          {/* Comment: Color highlights exploit loss aversion to draw attention to late loans */}
        </div>

        {/* Gamified Milestones */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Trophy Case</h3>
          <div className="grid grid-cols-2 gap-4">
            {realData.milestones.map((milestone: any) => (
              <div
                key={milestone.id}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  milestone.achieved 
                    ? 'border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20' 
                    : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className={`p-2 rounded-full ${
                      milestone.achieved 
                        ? 'bg-green-100 dark:bg-green-900/40' 
                        : 'bg-gray-100 dark:bg-gray-700'
                    }`}
                  >
                    <milestone.icon 
                      className={`w-5 h-5 ${
                        milestone.achieved 
                          ? milestone.color === '#F59E0B' ? 'text-yellow-600' : 'text-green-600'
                          : 'text-gray-400'
                      }`} 
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-medium text-sm ${
                      milestone.achieved ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {milestone.title}
                    </h4>
                    <p className={`text-xs ${
                      milestone.achieved ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'
                    }`}>
                      {milestone.description}
                    </p>
                  </div>
                  {milestone.achieved && (
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  )}
                </div>
              </div>
            ))}
          </div>
          {/* Comment: Badges tap into reward psychology and gamification loops */}
        </div>
      </div>

      {/* Upcoming Due Timeline */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upcoming Due Dates</h3>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {realData.upcomingDue.map((item: any) => {
            const daysUntilDue = getDaysUntilDue(item.dueDate);
            const isUrgent = daysUntilDue <= 7;
            const isWarning = daysUntilDue <= 14;
            
            return (
              <div
                key={item.id}
                className={`flex-shrink-0 p-4 rounded-lg border-2 min-w-[200px] transition-all duration-200 group cursor-pointer ${
                  isUrgent 
                    ? 'border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40' 
                    : isWarning 
                    ? 'border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/40'
                    : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title={`${item.person} — ${formatCurrencyWithSymbol(item.amount)} — Due ${formatDate(item.dueDate)}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm text-gray-900 dark:text-white">{item.person}</h4>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {formatCurrencyWithSymbol(item.amount)}
                    </p>
                    <p className={`text-xs ${
                      isUrgent ? 'text-red-600 dark:text-red-400' : isWarning ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {daysUntilDue === 0 ? 'Due today' : 
                       daysUntilDue === 1 ? 'Due tomorrow' : 
                       `Due in ${daysUntilDue} days`}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {/* Comment: Temporal salience boosts action by making upcoming tasks visible */}
      </div>

      {/* Standalone Records Section */}
      {standaloneCount > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Standalone Records</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <Handshake className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Standalone Lent</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrencyWithSymbol(standaloneLent)}</p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Standalone Borrowed</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrencyWithSymbol(standaloneBorrowed)}</p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <Eye className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Records</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{standaloneCount}</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
            These records don't affect your account balance and are tracked separately for reference only.
          </p>
        </div>
      )}

    </div>
  );
}; 

