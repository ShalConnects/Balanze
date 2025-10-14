import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Target } from 'lucide-react';
interface DonationTrendsChartProps {
  records: any[]; // Using any for now to avoid import issues
  currency: string;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export const DonationTrendsChart: React.FC<DonationTrendsChartProps> = ({ records, currency }) => {
  // Filter only donated records
  const donatedRecords = records.filter(r => r.status === 'donated');
  
  // Generate monthly data for the last 12 months
  const generateMonthlyData = () => {
    const endDate = new Date();
    const startDate = subMonths(endDate, 11);
    const months = eachMonthOfInterval({ start: startDate, end: endDate });
    
    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthRecords = donatedRecords.filter(record => {
        const recordDate = new Date(record.created_at);
        return recordDate >= monthStart && recordDate <= monthEnd;
      });
      
      const totalAmount = monthRecords.reduce((sum, record) => sum + (record.amount || 0), 0);
      const manualCount = monthRecords.filter(r => !r.transaction_id || r.custom_transaction_id?.startsWith('MD')).length;
      const transactionCount = monthRecords.length - manualCount;
      
      return {
        month: format(month, 'MMM yyyy'),
        amount: totalAmount,
        count: monthRecords.length,
        manualCount,
        transactionCount,
        date: month
      };
    });
  };

  const monthlyData = generateMonthlyData();
  
  // Calculate trends
  const currentMonth = monthlyData[monthlyData.length - 1];
  const previousMonth = monthlyData[monthlyData.length - 2];
  const amountTrend = previousMonth ? ((currentMonth.amount - previousMonth.amount) / previousMonth.amount) * 100 : 0;
  const countTrend = previousMonth ? ((currentMonth.count - previousMonth.count) / previousMonth.count) * 100 : 0;
  
  // Calculate total statistics
  const totalDonated = donatedRecords.reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalCount = donatedRecords.length;
  const averageDonation = totalCount > 0 ? totalDonated / totalCount : 0;
  
  // Category distribution (by currency for now, could be enhanced with actual categories)
  const currencyDistribution = donatedRecords.reduce((acc, record) => {
    let currency = 'USD';
    if (!record.transaction_id || record.custom_transaction_id?.startsWith('MD')) {
      const currencyMatch = record.note?.match(/Currency:\s*([A-Z]{3})/);
      if (currencyMatch) currency = currencyMatch[1];
    }
    acc[currency] = (acc[currency] || 0) + (record.amount || 0);
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(currencyDistribution).map(([key, value], index) => ({
    name: key,
    value: value as number,
    color: COLORS[index % COLORS.length]
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Donated</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {currency} {totalDonated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Donations</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalCount}</p>
            </div>
            <Target className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Donation</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {currency} {averageDonation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly Trend</p>
              <div className="flex items-center space-x-1">
                {amountTrend >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                <p className={`text-lg font-bold ${amountTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(amountTrend).toFixed(1)}%
                </p>
              </div>
            </div>
            <Calendar className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Donation Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="month" 
                stroke="#6B7280"
                fontSize={12}
              />
              <YAxis 
                stroke="#6B7280"
                fontSize={12}
                tickFormatter={(value) => `${currency} ${value.toLocaleString()}`}
              />
              <Tooltip 
                formatter={(value: number) => [`${currency} ${value.toLocaleString()}`, 'Amount']}
                labelFormatter={(label) => `Month: ${label}`}
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="amount" 
                stroke="#3B82F6" 
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Donation Count Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Donation Count by Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="month" 
                stroke="#6B7280"
                fontSize={12}
              />
              <YAxis 
                stroke="#6B7280"
                fontSize={12}
              />
              <Tooltip 
                formatter={(value: number) => [value, 'Count']}
                labelFormatter={(label) => `Month: ${label}`}
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
              />
              <Bar dataKey="manualCount" fill="#10B981" name="Manual" />
              <Bar dataKey="transactionCount" fill="#3B82F6" name="Transaction" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Currency Distribution */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Donations by Currency</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [`${currency} ${value.toLocaleString()}`, 'Amount']}
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="flex flex-col justify-center space-y-3">
            {pieData.map((entry, index) => (
              <div key={entry.name} className="flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {entry.name}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {currency} {entry.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}; 

