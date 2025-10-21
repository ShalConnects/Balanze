import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart, 
  Target, 
  Plus,
  BarChart3,
  Wallet,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { InvestmentDashboardStats, InvestmentAsset, InvestmentGoal, InvestmentTransaction } from '../../types/investment';
import { formatCurrency } from '../../utils/currency';
import { SkeletonCard } from '../common/Skeleton';

interface InvestmentDashboardProps {
  stats: InvestmentDashboardStats;
  loading?: boolean;
  onAddAsset?: () => void;
  onAddTransaction?: () => void;
  onAddGoal?: () => void;
}

export const InvestmentDashboard: React.FC<InvestmentDashboardProps> = ({
  stats,
  loading = false,
  onAddAsset,
  onAddTransaction,
  onAddGoal
}) => {
  const [timeRange, setTimeRange] = useState<'1M' | '3M' | '6M' | '1Y' | 'ALL'>('1Y');

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonCard className="h-80" />
          <SkeletonCard className="h-80" />
        </div>
      </div>
    );
  }

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const getPerformanceColor = (value: number) => {
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getPerformanceIcon = (value: number) => {
    return value >= 0 ? ArrowUpRight : ArrowDownRight;
  };

  const PerformanceIcon = getPerformanceIcon(stats.return_percentage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Investment Portfolio</h1>
          <p className="text-gray-600">Track and manage your investments</p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <button
            onClick={onAddAsset}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Asset
          </button>
          <button
            onClick={onAddTransaction}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Portfolio Value */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Portfolio</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.total_portfolio_value)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Wallet className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Total Gain/Loss */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Gain/Loss</p>
              <div className="flex items-center gap-2">
                <p className={`text-2xl font-bold ${getPerformanceColor(stats.total_gain_loss)}`}>
                  {formatCurrency(stats.total_gain_loss)}
                </p>
                <PerformanceIcon className={`w-5 h-5 ${getPerformanceColor(stats.total_gain_loss)}`} />
              </div>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Return Percentage */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Return</p>
              <p className={`text-2xl font-bold ${getPerformanceColor(stats.return_percentage)}`}>
                {formatPercentage(stats.return_percentage)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Asset Count */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Assets</p>
              <p className="text-2xl font-bold text-gray-900">{stats.asset_count}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <PieChart className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Portfolio Allocation */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Portfolio Allocation</h3>
            <PieChart className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={stats.portfolio_allocation}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="total_value"
                >
                  {stats.portfolio_allocation.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {stats.portfolio_allocation.map((allocation, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: allocation.color }}
                  />
                  <span className="text-gray-600">{allocation.asset_type}</span>
                </div>
                <div className="text-right">
                  <span className="font-medium">{allocation.percentage.toFixed(1)}%</span>
                  <span className="text-gray-500 ml-2">
                    {formatCurrency(allocation.total_value)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performing Assets */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Top Assets</h3>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {stats.top_assets.slice(0, 5).map((asset, index) => (
              <div key={asset.symbol} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {asset.symbol.substring(0, 2)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{asset.symbol}</p>
                    <p className="text-sm text-gray-500">{asset.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    {formatCurrency(asset.current_value)}
                  </p>
                  <p className={`text-sm ${getPerformanceColor(asset.return_percentage)}`}>
                    {formatPercentage(asset.return_percentage)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Investment Goals */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Investment Goals</h3>
          <button
            onClick={onAddGoal}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Goal
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-600">Active Goals</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.active_goals}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-gray-600">Completed</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.completed_goals}</p>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
          <button
            onClick={onAddTransaction}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View All
          </button>
        </div>
        <div className="space-y-3">
          {stats.recent_transactions.slice(0, 5).map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  transaction.transaction_type === 'buy' ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <div>
                  <p className="font-medium text-gray-900">
                    {transaction.transaction_type === 'buy' ? 'Bought' : 'Sold'} {transaction.quantity} shares
                  </p>
                  <p className="text-sm text-gray-500">{transaction.transaction_date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">
                  {formatCurrency(transaction.total_amount)}
                </p>
                <p className="text-sm text-gray-500">
                  @ {formatCurrency(transaction.price_per_share)}/share
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
