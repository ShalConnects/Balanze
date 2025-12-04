import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Transaction, Category } from '../../types';
import { isLendBorrowTransaction } from '../../utils/transactionUtils';

interface CategoryChartProps {
  transactions: Transaction[];
  categories: Category[];
}

export const CategoryChart: React.FC<CategoryChartProps> = ({ transactions, categories }) => {
  // Process data for expense categories
  const expenseTransactions = transactions.filter(t => t.type === 'expense' && !isLendBorrowTransaction(t));
  
  const categoryData = categories
    .filter(cat => cat.type === 'expense')
    .map(category => {
      const categoryTransactions = expenseTransactions.filter(t => t.category === category.name);
      const total = Math.abs(categoryTransactions.reduce((sum, t) => sum + t.amount, 0));
      
      return {
        name: category.name,
        value: total,
        color: category.color,
        count: categoryTransactions.length,
      };
    })
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value);

  const totalExpenses = categoryData.reduce((sum, item) => sum + item.value, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = totalExpenses > 0 ? (data.value / totalExpenses) * 100 : 0;
      
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            {formatCurrency(data.value)} ({percentage.toFixed(1)}%)
          </p>
          <p className="text-xs text-gray-500">{data.count} transactions</p>
        </div>
      );
    }
    return null;
  };

  if (categoryData.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Categories</h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <PieChart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No expense data available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Expense Categories</h3>
        <p className="text-sm text-gray-600">
          Total expenses: {formatCurrency(totalExpenses)}
        </p>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={categoryData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={120}
              paddingAngle={2}
              dataKey="value"
            >
              {categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 grid grid-cols-1 gap-2">
        {categoryData.slice(0, 5).map((item) => {
          const percentage = totalExpenses > 0 ? (item.value / totalExpenses) * 100 : 0;
          
          return (
            <div key={item.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-gray-700">{item.name}</span>
              </div>
              <div className="text-right">
                <span className="font-medium text-gray-900">{formatCurrency(item.value)}</span>
                <span className="text-gray-500 ml-1">({percentage.toFixed(1)}%)</span>
              </div>
            </div>
          );
        })}
        {categoryData.length > 5 && (
          <div className="text-xs text-gray-500 text-center pt-2">
            +{categoryData.length - 5} more categories
          </div>
        )}
      </div>
    </div>
  );
};

