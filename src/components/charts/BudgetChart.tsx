import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { chartColors, getCategoryColor, getAccessibleTextColor } from '../../styles/colors';

interface BudgetDataPoint {
  category: string;
  budgeted: number;
  actual: number;
  variance: number;
  variancePercent: number;
}

interface BudgetChartProps {
  data?: BudgetDataPoint[];
  className?: string;
  currency?: string;
}

// Mock data generator
const generateMockBudgetData = (): BudgetDataPoint[] => {
  const categories = [
    'Food & Dining',
    'Transportation', 
    'Shopping',
    'Entertainment',
    'Bills & Utilities',
    'Healthcare',
    'Travel',
    'Education'
  ];

  return categories.map((category, index) => {
    const budgeted = Math.floor(Math.random() * 15000) + 5000;
    const actual = budgeted + (Math.random() - 0.5) * budgeted * 0.4;
    const variance = actual - budgeted;
    const variancePercent = (variance / budgeted) * 100;

    return {
      category,
      budgeted,
      actual: Math.max(0, actual),
      variance,
      variancePercent
    };
  });
};

const CustomTooltip = ({ active, payload, label, currency = 'INR' }: any) => {
  if (active && payload && payload.length >= 2) {
    const budgeted = payload.find((p: any) => p.dataKey === 'budgeted')?.value || 0;
    const actual = payload.find((p: any) => p.dataKey === 'actual')?.value || 0;
    const variance = actual - budgeted;
    const variancePercent = ((variance / budgeted) * 100).toFixed(1);
    
    // Currency symbol mapping
    const currencySymbols: Record<string, string> = {
      USD: '$',
      BDT: '৳',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      ALL: 'L',
      INR: '₹',
      CAD: '$',
      AUD: '$',
    };
    const symbol = currencySymbols[currency] || currency;
    
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg min-w-48">
        <p className="font-medium text-gray-900 mb-2">{label}</p>
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Budgeted:</span>
            <span className="font-medium">{symbol}{budgeted.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Actual:</span>
            <span className="font-medium">{symbol}{actual.toLocaleString()}</span>
          </div>
          <div className="border-t pt-1 mt-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Variance:</span>
              <span className={`font-medium ${
                variance > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {variance > 0 ? '+' : ''}{symbol}{variance.toLocaleString()} ({variancePercent}%)
              </span>
            </div>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          {variance > 0 ? 'Over budget' : variance < 0 ? 'Under budget' : 'On budget'}
        </div>
      </div>
    );
  }
  return null;
};

const BudgetChart: React.FC<BudgetChartProps> = ({ 
  data,
  className = '',
  currency = '₹'
}) => {

  const sortedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    const sorted = [...data];
    
    // Always sort by variance (highest absolute variance first)
    return sorted.sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));
  }, [data]);

  const summary = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        totalBudgeted: 0,
        totalActual: 0,
        totalVariance: 0,
        totalVariancePercent: 0,
        overBudgetCount: 0,
        onTrackCount: 0
      };
    }
    
    const totalBudgeted = data.reduce((sum, item) => sum + item.budgeted, 0);
    const totalActual = data.reduce((sum, item) => sum + item.actual, 0);
    const totalVariance = totalActual - totalBudgeted;
    const overBudgetCount = data.filter(item => item.variance > 0).length;
    
    return {
      totalBudgeted,
      totalActual,
      totalVariance,
      totalVariancePercent: totalBudgeted > 0 ? (totalVariance / totalBudgeted) * 100 : 0,
      overBudgetCount,
      onTrackCount: data.length - overBudgetCount
    };
  }, [data]);

  const formatCurrency = (value: number) => {
    const currencySymbols: Record<string, string> = {
      USD: '$',
      BDT: '৳',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      ALL: 'L',
      INR: '₹',
      CAD: '$',
      AUD: '$',
    };
    const symbol = currencySymbols[currency] || currency;
    return `${symbol}${Math.abs(value).toLocaleString()}`;
  };

  const getBarColor = (variance: number, index: number) => {
    if (variance > 0) return chartColors.budget.over;
    if (variance < 0) return chartColors.budget.under;
    return getCategoryColor(index).color;
  };

  // Show empty state if no data
  if (!data || data.length === 0) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <BarChart3 className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Budget Data Available</h3>
          <p className="text-gray-500 mb-4">
            Set up purchase categories with monthly budgets to see budget analytics.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 sm:border sm:border-gray-200 border-0 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Budget vs Actual
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Monthly spending by category
          </p>
        </div>
        
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 font-medium">TOTAL BUDGETED</p>
          <p className="text-lg font-semibold text-gray-900">
            {formatCurrency(summary.totalBudgeted)}
          </p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 font-medium">TOTAL ACTUAL</p>
          <p className="text-lg font-semibold text-gray-900">
            {formatCurrency(summary.totalActual)}
          </p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 font-medium">VARIANCE</p>
          <p className={`text-lg font-semibold ${
            summary.totalVariance > 0 ? 'text-red-600' : 'text-green-600'
          }`}>
            {summary.totalVariance > 0 ? '+' : ''}{formatCurrency(summary.totalVariance)}
          </p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 font-medium">OVER BUDGET</p>
          <p className="text-lg font-semibold text-gray-900">
            {summary.overBudgetCount}/{data.length}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80 w-full" role="img" aria-label="Budget vs actual spending by category">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sortedData}
            margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
            barCategoryGap="10%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="category" 
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={80}
              stroke="#6b7280"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={formatCurrency}
              stroke="#6b7280"
            />
            <Tooltip content={<CustomTooltip currency={currency} />} />
            <Legend />
            
            <Bar 
              dataKey="budgeted" 
              name="Budgeted"
              fill="#94a3b8"
              radius={[2, 2, 0, 0]}
            />
            <Bar 
              dataKey="actual" 
              name="Actual"
              radius={[2, 2, 0, 0]}
            >
              {sortedData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getBarColor(entry.variance, index)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>


      {/* Hidden data table for screen readers */}
      <div className="sr-only">
        <table>
          <caption>Budget vs actual spending by category</caption>
          <thead>
            <tr>
              <th>Category</th>
              <th>Budgeted Amount</th>
              <th>Actual Amount</th>
              <th>Variance</th>
              <th>Variance Percentage</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((item) => (
              <tr key={item.category}>
                <td>{item.category}</td>
                <td>{formatCurrency(item.budgeted)}</td>
                <td>{formatCurrency(item.actual)}</td>
                <td>{item.variance > 0 ? '+' : ''}{formatCurrency(item.variance)}</td>
                <td>{item.variancePercent.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BudgetChart;

