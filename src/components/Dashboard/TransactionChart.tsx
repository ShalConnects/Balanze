import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useFinanceStore } from '../../store/useFinanceStore';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { formatCurrency } from '../../utils/currency';

interface TransactionChartProps {
  selectedCurrency: string;
}

export const TransactionChart: React.FC<TransactionChartProps> = ({ selectedCurrency }) => {
  const { transactions, getActiveAccounts } = useFinanceStore();
  const accounts = getActiveAccounts();

  // Generate data for the last 30 days
  const endDate = new Date();
  const startDate = subDays(endDate, 29);
  const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

  // Filter transactions by selected currency
  const currencyTransactions = transactions.filter(transaction => {
    const account = accounts.find(a => a.id === transaction.account_id);
    return account?.currency === selectedCurrency;
  });

  const chartData = dateRange.map(date => {
    const dayTransactions = currencyTransactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return format(transactionDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
    });

    const income = dayTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = Math.abs(dayTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0));

    return {
      date: format(date, 'MMM dd'),
      income,
      expenses,
      net: income - expenses,
    };
  });

  return (
    <div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6B7280' }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              tickFormatter={(value) => formatCurrency(value, selectedCurrency)}
            />
            <Tooltip 
              formatter={(value: number, name: string) => [formatCurrency(value, selectedCurrency), name]}
              labelStyle={{ color: '#374151' }}
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Area
              type="monotone"
              dataKey="income"
              stroke="#10B981"
              fill="url(#incomeGradient)"
              strokeWidth={2}
              name="Income"
            />
            <Area
              type="monotone"
              dataKey="expenses"
              stroke="#EF4444"
              fill="url(#expenseGradient)"
              strokeWidth={2}
              name="Expenses"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

