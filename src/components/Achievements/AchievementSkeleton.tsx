import React from 'react';

export const AchievementSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
      <div className="container mx-auto">
        {/* Unified Achievement Section Skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 lg:p-8 border border-gray-200 dark:border-gray-700/50 mb-6 sm:mb-8 relative overflow-hidden">
          {/* Shimmer effect */}
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
          
          {/* Stats & Progress Section Skeleton */}
          <div className="flex justify-center mb-8 relative">
            <div className="max-w-md w-full">
              {/* Stats Grid Skeleton */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="text-center">
                  <div className="h-6 sm:h-8 bg-gray-300 dark:bg-gray-600 rounded w-8 mx-auto mb-2 animate-pulse"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-20 mx-auto animate-pulse"></div>
                </div>
                <div className="flex items-center justify-center">
                  <div className="p-2 sm:p-3 bg-gray-300 dark:bg-gray-600 rounded-xl animate-pulse">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-400 dark:bg-gray-500 rounded"></div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="h-6 sm:h-8 bg-gray-300 dark:bg-gray-600 rounded w-12 mx-auto mb-2 animate-pulse"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-16 mx-auto animate-pulse"></div>
                </div>
              </div>
              
              {/* Progress Bar Skeleton */}
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-16 animate-pulse"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-20 animate-pulse"></div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 sm:h-3 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-400 to-purple-400 h-2 sm:h-3 rounded-full w-1/3 animate-pulse"></div>
                </div>
                <div className="text-center">
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-16 mx-auto animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Badge Collection Skeleton */}
          <div className="space-y-8 relative">
            <div className="space-y-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                  {Array.from({ length: 12 }).map((_, index) => (
                    <div
                      key={index}
                      className="rounded-xl p-3 sm:p-4 border-2 border-gray-200 dark:border-gray-600 bg-white/60 dark:bg-gray-800/40 animate-pulse"
                      style={{ 
                        animationDelay: `${index * 0.1}s`,
                        animationDuration: '2s'
                      }}
                    >
                      <div className="flex flex-col items-center text-center space-y-2 sm:space-y-3">
                        {/* Badge Icon Skeleton */}
                        <div className="p-2 sm:p-3 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse">
                          <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
                        </div>
                        
                        {/* Badge Info Skeleton */}
                        <div className="space-y-1 sm:space-y-2 w-full">
                          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mx-auto animate-pulse"></div>
                          <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded w-full animate-pulse"></div>
                          <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded w-2/3 mx-auto animate-pulse"></div>
                          <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded-full w-16 mx-auto animate-pulse"></div>
                          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mx-auto animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
