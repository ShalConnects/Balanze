import React from 'react';

// Enhanced skeleton for settings page - matches real Settings structure
export const SettingsSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Main Container */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden relative">
        {/* Shimmer effect for the entire container */}
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
        
        {/* Tab Navigation Skeleton */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 relative z-10">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex-1 px-3 sm:px-6 py-3 sm:py-4">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20 mx-auto animate-pulse"></div>
            </div>
          ))}
        </div>

        {/* Content Area Skeleton */}
        <div className="p-4 sm:p-6 relative z-10">
          {/* Settings Sections */}
          <div className="space-y-6">
            {/* General Settings */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
              <div className="relative z-10">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-32 animate-pulse"></div>
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-40 animate-pulse"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-60 animate-pulse"></div>
                      </div>
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-12 animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Categories Settings */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
              <div className="relative z-10">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-32 animate-pulse"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="bg-white dark:bg-gray-700 rounded-lg p-3">
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded mb-2 w-24 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-32 animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Account Management */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
              <div className="relative z-10">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-40 animate-pulse"></div>
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full animate-pulse"></div>
                        <div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded mb-1 w-32 animate-pulse"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-24 animate-pulse"></div>
                        </div>
                      </div>
                      <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-20 animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Plans & Usage */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
              <div className="relative z-10">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-32 animate-pulse"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-4">
                    <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded mb-3 w-24 animate-pulse"></div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded mb-2 w-16 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-32 animate-pulse"></div>
                  </div>
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-4">
                    <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded mb-3 w-20 animate-pulse"></div>
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-24 animate-pulse"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-8 animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced skeleton for settings mobile view
export const SettingsMobileSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 px-2 animate-fade-in">
      {/* Mobile Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-2 relative overflow-hidden">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
        <div className="flex space-x-2 relative z-10">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          ))}
        </div>
      </div>

      {/* Mobile Settings Cards */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-12 animate-pulse"></div>
              </div>
              <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, subIndex) => (
                  <div key={subIndex} className="flex items-center justify-between">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
