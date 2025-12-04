import React from 'react';
import { Skeleton, SkeletonCard, SkeletonTable } from '../common/Skeleton';

// Transfer card skeleton - matches real transfer card structure
export const TransferCardSkeleton: React.FC = () => {
  return (
    <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800 relative overflow-hidden">
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
      
      {/* Transfer Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 relative">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-20 animate-pulse"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
          <div className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
      </div>

      {/* Transfer Details skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center relative">
        {/* From Account skeleton */}
        <div className="text-center sm:text-left">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-24 animate-pulse"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-1 w-20 animate-pulse"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
        </div>
        
        {/* Center Arrow skeleton */}
        <div className="flex justify-center">
          <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        
        {/* To Account skeleton */}
        <div className="text-center sm:text-right">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-24 animate-pulse"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-1 w-20 animate-pulse"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
        </div>
      </div>
      
      {/* Note skeleton */}
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse"></div>
      </div>
    </div>
  );
};

// Search and header skeleton - matches real header structure
export const TransfersHeaderSkeleton: React.FC = () => {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
      <div className="flex gap-3 items-center">
        {/* Search Field skeleton */}
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md pl-10 animate-pulse"></div>
        </div>
        
        {/* New Transfer Button skeleton */}
        <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
      </div>
    </div>
  );
};

// Mobile tab dropdown skeleton - matches real mobile tab structure
export const TransfersMobileTabSkeleton: React.FC = () => {
  return (
    <div className="block sm:hidden border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
      <div className="w-full flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-600">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg">
            <div className="w-3.5 h-3.5 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
          </div>
          <div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse mb-1"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
          </div>
        </div>
        <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>
    </div>
  );
};

// Desktop tabs skeleton - matches real desktop tab structure
export const TransfersDesktopTabSkeleton: React.FC = () => {
  return (
    <div className="hidden sm:block border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
      <div className="flex">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex-1 px-4 py-3">
            <div className="flex items-center justify-center gap-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-6 animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Main transfers skeleton - matches real transfers page structure
export const TransfersSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Unified Transfers Container skeleton */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden relative">
        {/* Shimmer effect */}
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
        
        {/* Header Section skeleton */}
        <TransfersHeaderSkeleton />
        
        {/* Mobile Tab Dropdown skeleton */}
        <TransfersMobileTabSkeleton />
        
        {/* Desktop Tabs skeleton */}
        <TransfersDesktopTabSkeleton />
        
        {/* Content Area skeleton */}
        <div className="p-4 max-h-[calc(100vh-200px)] sm:max-h-96 overflow-y-auto bg-white dark:bg-gray-900 relative">
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse"
                style={{ 
                  animationDelay: `${index * 0.1}s`,
                  animationDuration: '2s'
                }}
              >
                <TransferCardSkeleton />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Mobile-optimized transfers skeleton
export const TransfersMobileSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      {/* Mobile Header skeleton */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex gap-2 items-center">
            <div className="flex-1 relative">
              <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded pl-8 animate-pulse"></div>
            </div>
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>
        
        {/* Mobile Tab skeleton */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="w-full p-2 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse mb-1"></div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
                </div>
              </div>
              <div className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
        
        {/* Mobile Content skeleton */}
        <div className="p-3 max-h-[calc(100vh-180px)] overflow-y-auto transfers-content-area">
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse"
                style={{ 
                  animationDelay: `${index * 0.1}s`,
                  animationDuration: '2s'
                }}
              >
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-800">
                  {/* Mobile Transfer Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-16 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12 animate-pulse"></div>
                      <div className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    </div>
                  </div>
                  
                  {/* Mobile Transfer Details */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-center flex-1">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse mb-1"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12 animate-pulse"></div>
                      </div>
                      <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      <div className="text-center flex-1">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse mb-1"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12 animate-pulse"></div>
                      </div>
                    </div>
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
export const TransfersShimmerSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Unified Transfers Container with shimmer */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden relative">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
        
        {/* Header Section with shimmer */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 relative">
          <div className="flex gap-3 items-center">
            <div className="relative flex-1">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md pl-10 animate-pulse"></div>
            </div>
            <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
          </div>
        </div>
        
        {/* Mobile Tab with shimmer */}
        <div className="block sm:hidden border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 relative">
          <div className="w-full flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg">
                <div className="w-3.5 h-3.5 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
              </div>
              <div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse mb-1"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
              </div>
            </div>
            <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>
        
        {/* Desktop Tabs with shimmer */}
        <div className="hidden sm:block border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 relative">
          <div className="flex">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex-1 px-4 py-3">
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-6 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Content Area with shimmer */}
        <div className="p-4 max-h-[calc(100vh-200px)] sm:max-h-96 overflow-y-auto bg-white dark:bg-gray-900 relative">
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800 relative"
                style={{ 
                  animationDelay: `${index * 0.1}s`,
                  animationDuration: '2s'
                }}
              >
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                
                {/* Transfer Header skeleton */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 relative">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-20 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
                    <div className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                </div>

                {/* Transfer Details skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center relative">
                  <div className="text-center sm:text-left">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-24 animate-pulse"></div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-1 w-20 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
                  </div>
                  
                  <div className="flex justify-center">
                    <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                  
                  <div className="text-center sm:text-right">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-24 animate-pulse"></div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-1 w-20 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 relative">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced skeleton components for Transfer_new page structure

// Filters skeleton - matches Transfer_new filter section
export const TransferFiltersSkeleton: React.FC = () => {
  return (
    <div className="flex flex-wrap md:flex-nowrap items-center w-full gap-2">
      {/* Search Input skeleton */}
      <div className="flex-1 min-w-[200px]">
        <div className="relative">
          <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-md pl-8 animate-pulse"></div>
        </div>
      </div>
      
      {/* Mobile Action Buttons skeleton */}
      <div className="flex items-center gap-1 md:hidden">
        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
      </div>
      
      {/* Desktop Filters skeleton */}
      <div className="hidden md:flex items-center gap-2">
        <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
        <div className="h-8 w-28 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
      </div>
      
      {/* Desktop Action Buttons skeleton */}
      <div className="hidden md:flex items-center gap-2">
        <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
      </div>
    </div>
  );
};

// Summary card skeleton - matches Transfer_new summary card structure
export const TransferSummaryCardSkeleton: React.FC = () => {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 px-2 relative overflow-hidden">
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
      
      <div className="flex items-center justify-between relative z-10">
        <div className="text-left flex-1">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2 animate-pulse"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-1 animate-pulse"></div>
          <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
        </div>
        <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>
    </div>
  );
};

// Desktop table skeleton - matches Transfer_new table structure
export const TransferTableSkeleton: React.FC<{ rows?: number }> = ({ rows = 6 }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900 text-[14px]">
        {/* Table Header */}
        <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
          <tr>
            {['Date', '', 'Type', 'From Account', 'To Account'].map((_, index) => (
              <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
              </th>
            ))}
          </tr>
        </thead>
        
        {/* Table Body */}
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr 
              key={rowIndex} 
              className={`${rowIndex % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800/50'} relative overflow-hidden`}
              style={{ paddingTop: '1.2rem', paddingBottom: '1.2rem' }}
            >
              {/* Shimmer effect for each row */}
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
              
              {/* Date */}
              <td className="px-6 relative z-10" style={{ paddingTop: '1.2rem', paddingBottom: '1.2rem' }}>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
              </td>
              
              {/* Expand icon */}
              <td className="px-6 text-center relative z-10" style={{ paddingTop: '1.2rem', paddingBottom: '1.2rem' }}>
                <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded mx-auto animate-pulse"></div>
              </td>
              
              {/* Type badge */}
              <td className="px-6 text-center relative z-10" style={{ paddingTop: '1.2rem', paddingBottom: '1.2rem' }}>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20 mx-auto animate-pulse"></div>
              </td>
              
              {/* From Account */}
              <td className="px-6 relative z-10" style={{ paddingTop: '1.2rem', paddingBottom: '1.2rem' }}>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
              </td>
              
              {/* To Account */}
              <td className="px-6 relative z-10" style={{ paddingTop: '1.2rem', paddingBottom: '1.2rem' }}>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Enhanced mobile card skeleton - matches Transfer_new mobile card structure
export const TransferMobileCardSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4 shadow-sm relative overflow-hidden"
          style={{ 
            animationDelay: `${index * 0.1}s`,
            animationDuration: '2.5s'
          }}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
          
          {/* Mobile Header */}
          <div className="flex items-center justify-between mb-3 gap-1 relative z-10">
            <div className="flex items-center space-x-1 flex-1 min-w-0">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
              <div className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16 animate-pulse"></div>
          </div>
          
          {/* Mobile Transfer Info */}
          <div className="space-y-2 mb-3 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
            </div>
            
            {/* Amount Display */}
            <div className="flex items-center justify-between gap-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TransfersSkeleton;

