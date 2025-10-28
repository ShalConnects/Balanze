import React from 'react';
import { Skeleton, SkeletonCard, SkeletonTable } from '../common/Skeleton';

// Statistics cards skeleton - matches real statistics structure (5 cards)
export const HistoryStatisticsSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 p-3 justify-start">
      {Array.from({ length: 5 }).map((_, index) => (
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

// Search and filters skeleton - matches real filter structure
export const HistoryFiltersSkeleton: React.FC = () => {
  return (
    <div className="p-3 border-b border-gray-200 dark:border-gray-700">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {/* Search skeleton */}
        <div className="flex-1 min-w-[200px] relative">
          <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-md pl-8 animate-pulse"></div>
        </div>
        
        {/* Filter buttons skeleton */}
        <div className="flex items-center gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-8 bg-gray-200 dark:bg-gray-700 rounded-md w-20 animate-pulse"></div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Table skeleton for desktop view
export const HistoryTableSkeleton: React.FC = () => {
  return (
    <div className="hidden lg:block max-h-[500px] overflow-y-auto">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900 text-[14px]">
          <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
            <tr>
              {['Date', 'Activities', 'Transactions', 'Purchases', 'Accounts', 'Transfers', 'Actions'].map((header, index) => (
                <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {Array.from({ length: 5 }).map((_, rowIndex) => (
              <tr 
                key={rowIndex} 
                className="hover:bg-gray-50 dark:hover:bg-gray-800"
                style={{ 
                  animationDelay: `${rowIndex * 0.1}s`,
                  animationDuration: '2s'
                }}
              >
                {Array.from({ length: 7 }).map((_, colIndex) => (
                  <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Timeline item skeleton - matches real timeline item structure
export const HistoryTimelineItemSkeleton: React.FC = () => {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
      {/* Activity Icon skeleton */}
      <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
      
      {/* Content skeleton */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12 animate-pulse"></div>
          </div>
        </div>
        
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
      </div>
    </div>
  );
};

// Timeline group skeleton - matches real timeline group structure
export const HistoryTimelineGroupSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Group header skeleton */}
      <div className="w-full flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
        </div>
        <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>
      
      {/* Group content skeleton */}
      <div className="border-t border-gray-200 dark:border-gray-700">
        <div className="p-3 space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <HistoryTimelineItemSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
};

// Main history skeleton - matches real history page structure
export const HistorySkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Unified Table View Container */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto lg:rounded-b-xl" style={{ borderBottomLeftRadius: '0.75rem', borderBottomRightRadius: '0.75rem' }}>
        {/* Filters Section */}
        <HistoryFiltersSkeleton />
        
        {/* Summary Cards */}
        <HistoryStatisticsSkeleton />
        
        {/* Desktop Table Section */}
        <HistoryTableSkeleton />
      </div>
    </div>
  );
};

// Mobile-optimized history skeleton
export const HistoryMobileSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Unified Table View Container */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto lg:rounded-b-xl" style={{ borderBottomLeftRadius: '0.75rem', borderBottomRightRadius: '0.75rem' }}>
        {/* Filters Section */}
        <HistoryFiltersSkeleton />
        
        {/* Summary Cards */}
        <HistoryStatisticsSkeleton />
        
        {/* Mobile Card Section */}
        <div className="lg:hidden max-h-[500px] overflow-y-auto">
          <div className="space-y-4 px-2.5">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Group header skeleton */}
                <div className="w-full flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
                  </div>
                  <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
                
                {/* Group content skeleton */}
                <div className="border-t border-gray-200 dark:border-gray-700">
                  <div className="p-3 space-y-2">
                    {Array.from({ length: 2 }).map((_, itemIndex) => (
                      <div key={itemIndex} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                        <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
                              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12 animate-pulse"></div>
                            </div>
                          </div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced skeleton with shimmer effect
export const HistoryShimmerSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Unified Table View Container with shimmer */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto lg:rounded-b-xl relative overflow-hidden" style={{ borderBottomLeftRadius: '0.75rem', borderBottomRightRadius: '0.75rem' }}>
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
        <div className="relative">
          {/* Filters Section */}
          <HistoryFiltersSkeleton />
          
          {/* Summary Cards */}
          <HistoryStatisticsSkeleton />
          
          {/* Desktop Table Section */}
          <HistoryTableSkeleton />
        </div>
      </div>
    </div>
  );
};

export default HistorySkeleton;

