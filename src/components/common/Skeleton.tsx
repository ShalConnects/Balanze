import React from 'react';

interface SkeletonProps {
  className?: string;
  height?: string;
  width?: string;
  rounded?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  height = 'h-4', 
  width = 'w-full',
  rounded = true 
}) => {
  return (
    <div 
      className={`
        bg-gray-200 dark:bg-gray-700 
        animate-pulse 
        ${rounded ? 'rounded' : ''} 
        ${height} 
        ${width} 
        ${className}
      `}
    />
  );
};

// Predefined skeleton components for common use cases
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm ${className}`}>
    <Skeleton className="mb-3" height="h-6" width="w-3/4" />
    <Skeleton className="mb-2" height="h-4" width="w-full" />
    <Skeleton className="mb-2" height="h-4" width="w-2/3" />
    <Skeleton className="mb-4" height="h-4" width="w-1/2" />
    <Skeleton className="mb-2" height="h-8" width="w-full" />
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; className?: string }> = ({ 
  rows = 5, 
  className = '' 
}) => (
  <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm ${className}`}>
    {/* Table header */}
    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
      <div className="flex space-x-4">
        <Skeleton height="h-4" width="w-1/4" />
        <Skeleton height="h-4" width="w-1/4" />
        <Skeleton height="h-4" width="w-1/4" />
        <Skeleton height="h-4" width="w-1/4" />
      </div>
    </div>
    
    {/* Table rows */}
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex space-x-4">
          <Skeleton height="h-4" width="w-1/4" />
          <Skeleton height="h-4" width="w-1/4" />
          <Skeleton height="h-4" width="w-1/4" />
          <Skeleton height="h-4" width="w-1/4" />
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonChart: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm ${className}`}>
    <Skeleton className="mb-4" height="h-6" width="w-1/3" />
    <div className="flex items-end justify-between h-32 space-x-2">
      {Array.from({ length: 7 }).map((_, index) => (
        <Skeleton 
          key={index} 
          height={`h-${Math.floor(Math.random() * 20) + 8}`} 
          width="w-8" 
        />
      ))}
    </div>
  </div>
);

// Enhanced mobile-optimized skeleton components
export const SkeletonMobileCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-all duration-200 ${className}`}>
    {/* Header */}
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
          <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
        </div>
        <div className="flex-1 min-w-0">
          <Skeleton className="mb-1" height="h-5" width="w-32" />
          <Skeleton className="h-5" width="w-20" rounded={true} />
        </div>
      </div>
      <div className="text-right ml-4">
        <Skeleton className="mb-1" height="h-6" width="w-24" />
        <Skeleton className="h-3" width="w-12" />
      </div>
    </div>

    {/* Stats */}
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-4" width="w-16" />
        <Skeleton className="h-4" width="w-20" />
      </div>
      <Skeleton className="h-5" width="w-16" rounded={true} />
    </div>

    {/* Actions */}
    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
      <Skeleton className="h-8" width="w-20" />
      <div className="flex items-center space-x-2">
        <Skeleton className="w-8 h-8" rounded={true} />
        <Skeleton className="w-8 h-8" rounded={true} />
        <Skeleton className="w-8 h-8" rounded={true} />
      </div>
    </div>
  </div>
);

// Mobile-optimized skeleton list
export const SkeletonMobileList: React.FC<{ count?: number; className?: string }> = ({ 
  count = 3, 
  className = '' 
}) => (
  <div className={`space-y-4 p-4 ${className}`}>
    {Array.from({ length: count }).map((_, index) => (
      <SkeletonMobileCard key={index} />
    ))}
  </div>
);

// Mobile-optimized skeleton with staggered animation
export const SkeletonStaggered: React.FC<{ count?: number; className?: string }> = ({ 
  count = 3, 
  className = '' 
}) => (
  <div className={`space-y-4 p-4 ${className}`}>
    {Array.from({ length: count }).map((_, index) => (
      <div 
        key={index} 
        className="animate-pulse"
        style={{ 
          animationDelay: `${index * 0.1}s`,
          animationDuration: '1.5s'
        }}
      >
        <SkeletonMobileCard />
      </div>
    ))}
  </div>
);

// Mobile-optimized skeleton for filters
export const SkeletonMobileFilters: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm ${className}`}>
    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
      <div className="flex flex-wrap md:flex-nowrap justify-between items-center w-full gap-3">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-2 flex-1">
          {/* Search */}
          <div className="flex-1 min-w-[200px] relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg pl-10 animate-pulse"></div>
          </div>
          
          {/* Filters */}
          <div className="relative">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-32 animate-pulse"></div>
          </div>
          <div className="relative">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-28 animate-pulse"></div>
          </div>
          <div className="relative">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-32 animate-pulse"></div>
          </div>
          <div className="relative">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-32 animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Mobile-optimized skeleton for summary cards
export const SkeletonMobileSummaryCards: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 p-3 ${className}`}>
    {Array.from({ length: 5 }).map((_, index) => (
      <div key={index} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 py-3 px-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="text-left flex-1">
            <Skeleton className="mb-2" height="h-3" width="w-20" />
            <Skeleton className="h-5" width="w-8" />
          </div>
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg ml-3 animate-pulse"></div>
        </div>
      </div>
    ))}
  </div>
); 