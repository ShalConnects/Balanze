import React from 'react';

export const AchievementSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Hero Section Skeleton */}
      <div className="glassmorphism-container rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Left side - Title and stats */}
          <div className="flex-1 space-y-4">
            <div className="space-y-3">
              <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded-lg w-3/4"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
            </div>
            
            {/* Stats skeleton */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
              </div>
            </div>
          </div>
          
          {/* Right side - Progress bar skeleton */}
          <div className="lg:w-80 space-y-3">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
          </div>
        </div>
      </div>

      {/* Badge Grid Skeleton */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {Array.from({ length: 12 }).map((_, index) => (
            <div
              key={index}
              className="rounded-xl p-3 sm:p-4 border-2 border-gray-200 dark:border-gray-600 bg-white/60 dark:bg-gray-800/40"
            >
              <div className="flex flex-col items-center text-center space-y-2 sm:space-y-3">
                {/* Badge Icon Skeleton */}
                <div className="p-2 sm:p-3 rounded-xl bg-gray-200 dark:bg-gray-700">
                  <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
                </div>
                
                {/* Badge Info Skeleton */}
                <div className="space-y-1 sm:space-y-2 w-full">
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mx-auto"></div>
                  <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                  <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded w-2/3 mx-auto"></div>
                  <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded-full w-16 mx-auto"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mx-auto"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
