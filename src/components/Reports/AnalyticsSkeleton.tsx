import React from 'react';

// Enhanced skeleton for analytics page - matches real AnalyticsView structure
export const AnalyticsSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0 animate-fade-in">
      {/* Main Container */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden relative">
        {/* Shimmer effect for the entire container */}
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
        
        {/* Tab Navigation Skeleton */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 relative z-10">
          <div className="flex-1 px-3 sm:px-6 py-3 sm:py-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mx-auto animate-pulse"></div>
          </div>
          <div className="flex-1 px-3 sm:px-6 py-3 sm:py-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mx-auto animate-pulse"></div>
          </div>
        </div>

        {/* Filter Bar Skeleton */}
        <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50/30 to-purple-50/30 dark:from-blue-900/10 dark:to-purple-900/10 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
              {/* Currency Filter */}
              <div className="flex-1 sm:flex-none">
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-full sm:w-32 animate-pulse"></div>
              </div>
              
              {/* Period Filter */}
              <div className="flex-1 sm:flex-none">
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-full sm:w-32 animate-pulse"></div>
              </div>
            </div>
            
            {/* Export Button */}
            <div className="flex-1 sm:flex-none">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-full sm:w-24 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Content Area Skeleton */}
        <div className="p-4 sm:p-6 relative z-10">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 relative overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-20 animate-pulse"></div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-1 w-16 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
                  </div>
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Chart 1 */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
              <div className="relative z-10">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-40 animate-pulse"></div>
                <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
            </div>
            
            {/* Chart 2 */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
              <div className="relative z-10">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-40 animate-pulse"></div>
                <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Insights Section */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
            <div className="relative z-10">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-32 animate-pulse"></div>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-700 rounded-lg">
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full animate-pulse"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded mb-1 w-48 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-32 animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced skeleton for analytics mobile view
export const AnalyticsMobileSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 px-2 animate-fade-in">
      {/* Mobile Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-3 relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
            <div className="relative z-10">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-16 animate-pulse"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-1 w-12 animate-pulse"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 relative overflow-hidden">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
        <div className="relative z-10">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-32 animate-pulse"></div>
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
      </div>

      {/* Mobile Insights */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 relative overflow-hidden">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
        <div className="relative z-10">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-24 animate-pulse"></div>
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded mb-1 w-40 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-28 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
