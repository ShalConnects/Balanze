import React from 'react';
import { Heart, TrendingUp } from 'lucide-react';
import { StatCard } from '../Dashboard/StatCard';

interface QuoteSummaryCardsProps {
  filteredQuotes: any[];
}

export const QuoteSummaryCards: React.FC<QuoteSummaryCardsProps> = ({
  filteredQuotes
}) => {
  // Calculate insights
  const totalQuotes = filteredQuotes.length;
  
  // Category breakdown
  const categoryBreakdown = filteredQuotes.reduce((acc, quote) => {
    const category = quote.category || 'General';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Format category breakdown
  const categoryInsight = Object.entries(categoryBreakdown)
    .map(([category, count]) => `${count} ${category.charAt(0).toUpperCase() + category.slice(1)}`)
    .join(', ');

  // Recent quotes (last 7 days)
  const recentQuotes = filteredQuotes.filter(quote => {
    const quoteDate = new Date(quote.createdAt);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return quoteDate >= sevenDaysAgo;
  }).length;


  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 p-3">
      <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 px-2">
        <div className="flex items-center justify-between">
          <div className="text-left">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Quotes</p>
            <p className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" style={{fontSize: '1.2rem'}}>{totalQuotes}</p>
            <p className="text-gray-500 dark:text-gray-400" style={{fontSize: '11px'}}>{categoryInsight || 'No categories yet'}</p>
          </div>
          <Heart className="text-blue-600" style={{fontSize: '1.2rem', width: '1.2rem', height: '1.2rem'}} />
        </div>
      </div>
      
      <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 px-2">
        <div className="flex items-center justify-between">
          <div className="text-left">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Recent Quotes</p>
            <p className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" style={{fontSize: '1.2rem'}}>{recentQuotes}</p>
            <p className="text-gray-500 dark:text-gray-400" style={{fontSize: '11px'}}>Added in last 7 days</p>
          </div>
          <TrendingUp className="text-blue-600" style={{fontSize: '1.2rem', width: '1.2rem', height: '1.2rem'}} />
        </div>
      </div>
      
    </div>
  );
};
