import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { chartColors } from '../../styles/colors';
import { format, subDays, addDays } from 'date-fns';

interface TrendDataPoint {
  date: string;
  balance: number;
  movingAverage?: number;
  forecastLow?: number;
  forecastHigh?: number;
  isHistorical: boolean;
}

interface TrendChartProps {
  data?: TrendDataPoint[];
  className?: string;
  'aria-labelledby'?: string;
}

// Mock data generator for demonstration
const generateMockData = (): TrendDataPoint[] => {
  const data: TrendDataPoint[] = [];
  const baseDate = new Date();
  
  // Historical data (30 days)
  for (let i = 30; i >= 0; i--) {
    const date = subDays(baseDate, i);
    const baseBalance = 50000 + Math.sin(i / 5) * 10000 + (Math.random() - 0.5) * 5000;
    
    data.push({
      date: format(date, 'yyyy-MM-dd'),
      balance: Math.max(0, baseBalance),
      isHistorical: true
    });
  }
  
  // Calculate 30-day moving average
  data.forEach((point, index) => {
    if (index >= 29) {
      const sum = data.slice(index - 29, index + 1).reduce((acc, p) => acc + p.balance, 0);
      point.movingAverage = sum / 30;
    }
  });
  
  // Forecast data (30 days)
  const lastBalance = data[data.length - 1].balance;
  const trend = (lastBalance - data[data.length - 7].balance) / 7; // 7-day trend
  
  for (let i = 1; i <= 30; i++) {
    const date = addDays(baseDate, i);
    const forecastBalance = lastBalance + (trend * i);
    const uncertainty = i * 1000; // Increasing uncertainty over time
    
    data.push({
      date: format(date, 'yyyy-MM-dd'),
      balance: forecastBalance,
      forecastLow: Math.max(0, forecastBalance - uncertainty),
      forecastHigh: forecastBalance + uncertainty,
      isHistorical: false
    });
  }
  
  return data;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isHistorical = data.isHistorical;
    
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900">
          {format(new Date(label), 'MMM dd, yyyy')}
        </p>
        <div className="mt-2 space-y-1">
          {isHistorical ? (
            <>
              <p className="text-sm text-blue-600">
                Balance: ₹{payload[0].value?.toLocaleString()}
              </p>
              {payload[1] && (
                <p className="text-sm text-blue-400">
                  30-day avg: ₹{payload[1].value?.toLocaleString()}
                </p>
              )}
            </>
          ) : (
            <>
              <p className="text-sm text-blue-300">
                Forecast: ₹{data.balance?.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                Range: ₹{data.forecastLow?.toLocaleString()} - ₹{data.forecastHigh?.toLocaleString()}
              </p>
            </>
          )}
        </div>
        {!isHistorical && (
          <p className="text-xs text-gray-400 mt-2">
            Based on 7-day trend
          </p>
        )}
      </div>
    );
  }
  return null;
};

const TrendChart: React.FC<TrendChartProps> = ({ 
  data = generateMockData(), 
  className = '',
  'aria-labelledby': ariaLabelledBy 
}) => {
  const [showMovingAverage, setShowMovingAverage] = useState(true);
  const [showForecast, setShowForecast] = useState(true);

  const { historicalData, forecastData, currentBalance, weekChange } = useMemo(() => {
    const historical = data.filter(d => d.isHistorical);
    const forecast = data.filter(d => !d.isHistorical);
    const current = historical[historical.length - 1]?.balance || 0;
    const weekAgo = historical[historical.length - 8]?.balance || current;
    const change = current - weekAgo;
    
    return {
      historicalData: historical,
      forecastData: forecast,
      currentBalance: current,
      weekChange: change
    };
  }, [data]);

  const formatCurrency = (value: number) => `₹${value.toLocaleString()}`;
  
  const trendInsight = useMemo(() => {
    const changePercent = ((weekChange / (currentBalance - weekChange)) * 100).toFixed(1);
    const direction = weekChange >= 0 ? 'increased' : 'decreased';
    const trend = weekChange >= 0 ? 'positive' : 'negative';
    
    return {
      text: `Your balance has ${direction} by ${Math.abs(parseFloat(changePercent))}% over the past week.`,
      trend,
      confidence: 0.85
    };
  }, [weekChange, currentBalance]);

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 id="trend-title" className="text-lg font-semibold text-gray-900">
            Balance Trend
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Daily balance with 30-day forecast
          </p>
        </div>
        
        {/* Controls */}
        <div className="flex flex-wrap gap-2 mt-3 sm:mt-0">
          <button
            type="button"
            onClick={() => setShowMovingAverage(!showMovingAverage)}
            className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
              showMovingAverage 
                ? 'bg-blue-50 text-blue-700 border-blue-200' 
                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
            }`}
            aria-pressed={showMovingAverage}
          >
            30-day Average
          </button>
          <button
            type="button"
            onClick={() => setShowForecast(!showForecast)}
            className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
              showForecast 
                ? 'bg-blue-50 text-blue-700 border-blue-200' 
                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
            }`}
            aria-pressed={showForecast}
          >
            Forecast
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80 w-full" role="img" aria-labelledby={ariaLabelledBy || "trend-title"}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => format(new Date(value), 'MMM dd')}
              stroke="#6b7280"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={formatCurrency}
              stroke="#6b7280"
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Forecast uncertainty band */}
            {showForecast && (
              <Area
                dataKey="forecastHigh"
                stroke="none"
                fill={chartColors.trend.background}
                fillOpacity={0.3}
              />
            )}
            
            {/* Historical balance line */}
            <Line
              dataKey="balance"
              stroke={chartColors.trend.primary}
              strokeWidth={2}
              dot={false}
              connectNulls={false}
              name="Balance"
            />
            
            {/* Moving average line */}
            {showMovingAverage && (
              <Line
                dataKey="movingAverage"
                stroke={chartColors.trend.secondary}
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
                connectNulls={false}
                name="30-day Average"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Insight Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-start gap-3">
          <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
            trendInsight.trend === 'positive' ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <div className="flex-1">
            <p className="text-sm text-gray-700">{trendInsight.text}</p>
            <p className="text-xs text-gray-500 mt-1">
              Confidence: {(trendInsight.confidence * 100).toFixed(0)}%
            </p>
          </div>
        </div>
      </div>

      {/* Hidden data table for screen readers */}
      <div className="sr-only">
        <table>
          <caption>Daily balance data for the past 30 days and 30-day forecast</caption>
          <thead>
            <tr>
              <th>Date</th>
              <th>Balance</th>
              <th>30-day Average</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            {data.map((point, index) => (
              <tr key={index}>
                <td>{format(new Date(point.date), 'MMM dd, yyyy')}</td>
                <td>{formatCurrency(point.balance)}</td>
                <td>{point.movingAverage ? formatCurrency(point.movingAverage) : 'N/A'}</td>
                <td>{point.isHistorical ? 'Historical' : 'Forecast'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TrendChart;
