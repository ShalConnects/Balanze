import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Transaction } from '../../types/index';
import { format, startOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';

interface MonthlyTrendProps {
  transactions: Transaction[];
  period: 'current' | 'last3' | 'last6' | 'last12';
}

export const MonthlyTrend: React.FC<MonthlyTrendProps> = ({ transactions, period }) => {
  const getMonthsRange = () => {
    const now = new Date();
    let monthsBack: number;
    
    switch (period) {
      case 'current':
        monthsBack = 0;
        break;
      case 'last3':
        monthsBack = 2;
        break;
      case 'last6':
        monthsBack = 5;
        break;
      case 'last12':
        monthsBack = 11;
        break;
      default:
        monthsBack = 0;
    }

    const startDate = startOfMonth(subMonths(now, monthsBack));
    const endDate = startOfMonth(now);
    
    return eachMonthOfInterval({ start: startDate, end: endDate });
  };

  const months = getMonthsRange();

  const chartData = months.map(month => {
    const monthTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return (
        transactionDate.getMonth() === month.getMonth() &&
        transactionDate.getFullYear() === month.getFullYear()
      );
    });

    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = Math.abs(monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0));

    return {
      month: format(month, 'MMM yyyy'),
      income,
      expenses,
      net: income - expenses,
    };
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center space-x-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600">{entry.dataKey}:</span>
              <span className="font-medium" style={{ color: entry.color }}>
                {formatCurrency(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trend</h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <LineChart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No data available for selected period</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Monthly Trend</h3>
        <p className="text-sm text-gray-600">Income vs expenses over time</p>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="month" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6B7280' }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              tickFormatter={formatCurrency}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
            />
            <Line
              type="monotone"
              dataKey="income"
              stroke="#10B981"
              strokeWidth={3}
              dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2 }}
              name="Income"
            />
            <Line
              type="monotone"
              dataKey="expenses"
              stroke="#EF4444"
              strokeWidth={3}
              dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#EF4444', strokeWidth: 2 }}
              name="Expenses"
            />
            <Line
              type="monotone"
              dataKey="net"
              stroke="#3B82F6"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 3 }}
              name="Net Income"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

