import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length >= 2) {
    const budgeted = payload.find((p: any) => p.dataKey === 'budgeted')?.value || 0;
    const actual = payload.find((p: any) => p.dataKey === 'actual')?.value || 0;
    const variance = actual - budgeted;
    const variancePercent = ((variance / budgeted) * 100).toFixed(1);
    
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg min-w-48">
        <p className="font-medium text-gray-900 mb-2">{label}</p>
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Budgeted:</span>
            <span className="font-medium">₹{budgeted.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Actual:</span>
            <span className="font-medium">₹{actual.toLocaleString()}</span>
          </div>
          <div className="border-t pt-1 mt-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Variance:</span>
              <span className={`font-medium ${
                variance > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {variance > 0 ? '+' : ''}₹{variance.toLocaleString()} ({variancePercent}%)
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
  data = generateMockBudgetData(),
  className = '',
  currency = '₹'
}) => {
  const [viewMode, setViewMode] = useState<'grouped' | 'stacked'>('grouped');
  const [sortBy, setSortBy] = useState<'category' | 'variance' | 'actual'>('variance');

  const sortedData = useMemo(() => {
    const sorted = [...data];
    
    switch (sortBy) {
      case 'variance':
        return sorted.sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));
      case 'actual':
        return sorted.sort((a, b) => b.actual - a.actual);
      case 'category':
      default:
        return sorted.sort((a, b) => a.category.localeCompare(b.category));
    }
  }, [data, sortBy]);

  const summary = useMemo(() => {
    const totalBudgeted = data.reduce((sum, item) => sum + item.budgeted, 0);
    const totalActual = data.reduce((sum, item) => sum + item.actual, 0);
    const totalVariance = totalActual - totalBudgeted;
    const overBudgetCount = data.filter(item => item.variance > 0).length;
    
    return {
      totalBudgeted,
      totalActual,
      totalVariance,
      totalVariancePercent: (totalVariance / totalBudgeted) * 100,
      overBudgetCount,
      onTrackCount: data.length - overBudgetCount
    };
  }, [data]);

  const formatCurrency = (value: number) => `${currency}${Math.abs(value).toLocaleString()}`;

  const getBarColor = (variance: number, index: number) => {
    if (variance > 0) return chartColors.budget.over;
    if (variance < 0) return chartColors.budget.under;
    return getCategoryColor(index).color;
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
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
        
        {/* Controls */}
        <div className="flex flex-wrap gap-2 mt-3 sm:mt-0">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-1 text-xs border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Sort categories by"
          >
            <option value="variance">Sort by Variance</option>
            <option value="actual">Sort by Actual</option>
            <option value="category">Sort by Category</option>
          </select>
          
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'grouped' ? 'stacked' : 'grouped')}
            className="px-3 py-1 text-xs font-medium rounded-md border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={`Switch to ${viewMode === 'grouped' ? 'stacked' : 'grouped'} view`}
          >
            {viewMode === 'grouped' ? 'Stack Bars' : 'Group Bars'}
          </button>
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
            <Tooltip content={<CustomTooltip />} />
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

      {/* Category Insights */}
      <div className="mt-6 space-y-3">
        <h3 className="text-sm font-medium text-gray-900">Category Insights</h3>
        <div className="space-y-2">
          {sortedData.slice(0, 3).map((item, index) => {
            const isOverBudget = item.variance > 0;
            const absVariancePercent = Math.abs(item.variancePercent).toFixed(0);
            
            return (
              <div key={item.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getBarColor(item.variance, index) }}
                  />
                  <span className="text-sm font-medium text-gray-900">
                    {item.category}
                  </span>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${
                    isOverBudget ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {isOverBudget ? '+' : '-'}{absVariancePercent}%
                  </p>
                  <p className="text-xs text-gray-500">
                    {isOverBudget ? 'over' : 'under'} budget
                  </p>
                </div>
              </div>
            );
          })}
        </div>
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
