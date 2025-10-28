import React from 'react';

// Quote card skeleton for mobile view - matches real quote card structure
export const QuoteCardSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 relative overflow-hidden"
          style={{ 
            animationDelay: `${index * 0.1}s`,
            animationDuration: '2s'
          }}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
          
          <div className="relative">
            {/* Quote text skeleton */}
            <div className="space-y-2 mb-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
            </div>
            
            {/* Author skeleton */}
            <div className="flex items-center justify-between mb-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16 animate-pulse"></div>
            </div>
            
            {/* Category and date skeleton */}
            <div className="flex items-center justify-between">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-20 animate-pulse"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Quote table skeleton for desktop view - matches real table structure
export const QuoteTableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="overflow-x-auto relative">
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
      
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900 relative">
        {/* Table Header */}
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {['Quote', 'Author', 'Category', 'Date', 'Actions'].map((header, index) => (
              <th key={index} className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
              </th>
            ))}
          </tr>
        </thead>
        
        {/* Table Body */}
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr 
              key={rowIndex} 
              className="hover:bg-gray-50 dark:hover:bg-gray-800"
              style={{ 
                animationDelay: `${rowIndex * 0.1}s`,
                animationDuration: '2s'
              }}
            >
              {/* Quote column */}
              <td className="px-3 py-3 text-sm text-gray-900 dark:text-white">
                <div className="max-w-sm">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse mb-1"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
                </div>
              </td>
              
              {/* Author column */}
              <td className="px-3 py-3 text-sm text-gray-600 dark:text-gray-300">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
              </td>
              
              {/* Category column */}
              <td className="px-3 py-3 text-sm">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20 animate-pulse"></div>
              </td>
              
              {/* Date column */}
              <td className="px-3 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse mx-auto"></div>
              </td>
              
              {/* Actions column */}
              <td className="px-3 py-3 text-center text-sm">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse mx-auto"></div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Quote summary cards skeleton - matches real summary cards structure
export const QuoteSummaryCardsSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div 
          key={index} 
          className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 px-2 relative overflow-hidden"
          style={{ 
            animationDelay: `${index * 0.1}s`,
            animationDuration: '2s'
          }}
        >
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
          <div className="flex items-center justify-between relative">
            <div className="text-left flex-1">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-1 w-16 animate-pulse"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-8 animate-pulse mb-1"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
            </div>
            <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded-lg ml-3 animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Quote filters skeleton - matches real filter structure
export const QuoteFiltersSkeleton: React.FC = () => {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      {/* Search skeleton */}
      <div className="flex-1 min-w-[200px] relative">
        <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-md pl-8 animate-pulse"></div>
      </div>
      
      {/* Filter buttons skeleton */}
      <div className="flex items-center gap-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-8 bg-gray-200 dark:bg-gray-700 rounded-md w-20 animate-pulse"></div>
        ))}
      </div>
    </div>
  );
};

// Main quotes page skeleton - matches real quotes page structure
export const QuotePageSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Unified Quotes Container skeleton */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 pb-[13px] lg:pb-0 relative overflow-hidden">
        {/* Shimmer effect */}
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
        
        {/* Filters Section skeleton */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-700 relative">
          <QuoteFiltersSkeleton />
        </div>
        
        {/* Summary Cards skeleton */}
        <div className="p-4 relative">
          <QuoteSummaryCardsSkeleton />
        </div>
        
        {/* Responsive skeleton - Desktop table, Mobile cards */}
        <div className="hidden md:block p-4 relative">
          <QuoteTableSkeleton rows={6} />
        </div>
        <div className="md:hidden p-4 relative">
          <QuoteCardSkeleton count={4} />
        </div>
      </div>
    </div>
  );
};

// Mobile-optimized quotes skeleton
export const QuoteMobileSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      {/* Mobile container skeleton */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden relative">
        {/* Shimmer effect */}
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
        
        {/* Mobile header skeleton */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 relative">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
            </div>
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
          </div>
        </div>
        
        {/* Mobile content skeleton */}
        <div className="p-4 relative">
          <QuoteCardSkeleton count={3} />
        </div>
      </div>
    </div>
  );
};

// Enhanced skeleton with shimmer effect
export const QuoteShimmerSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Unified Quotes Container with shimmer */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden relative">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
        
        <div className="relative">
          {/* Filters Section */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <QuoteFiltersSkeleton />
          </div>
          
          {/* Summary Cards */}
          <div className="p-4">
            <QuoteSummaryCardsSkeleton />
          </div>
          
          {/* Desktop Table Section */}
          <div className="hidden md:block p-4">
            <QuoteTableSkeleton rows={5} />
          </div>
          
          {/* Mobile Card Section */}
          <div className="md:hidden p-4">
            <QuoteCardSkeleton count={3} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotePageSkeleton;
