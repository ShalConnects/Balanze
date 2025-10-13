import React from 'react';
import { Skeleton } from './Skeleton';

interface SearchSkeletonProps {
  className?: string;
}

export const SearchSkeleton: React.FC<SearchSkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg dark:shadow-xl p-4 animate-fadein ${className}`}>
      <div className="px-4 pt-4 pb-8 min-h-[160px] sm:px-6 flex-1">
        {/* Recent Searches Skeleton */}
        <div className="mb-6">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-3 animate-pulse"></div>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-8 bg-gray-200 dark:bg-gray-700 rounded-full w-20 animate-pulse"
                style={{ animationDelay: `${index * 0.1}s` }}
              />
            ))}
          </div>
        </div>

        {/* Search Suggestions Skeleton */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-8 bg-gray-200 dark:bg-gray-700 rounded-full w-24 animate-pulse"
                style={{ animationDelay: `${index * 0.1}s` }}
              />
            ))}
          </div>
        </div>

        {/* Transactions Section Skeleton */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
          </div>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-lg animate-pulse"></div>
                <div className="flex-1 min-w-0">
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded mb-1 w-3/4 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Purchases Section Skeleton */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
          </div>
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                style={{ animationDelay: `${(index + 3) * 0.1}s` }}
              >
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-lg animate-pulse"></div>
                <div className="flex-1 min-w-0">
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded mb-1 w-2/3 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transfers Section Skeleton */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
          </div>
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                style={{ animationDelay: `${(index + 5) * 0.1}s` }}
              >
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-lg animate-pulse"></div>
                <div className="flex-1 min-w-0">
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded mb-1 w-3/4 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Accounts Section Skeleton */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
          </div>
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                style={{ animationDelay: `${(index + 7) * 0.1}s` }}
              >
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-lg animate-pulse"></div>
                <div className="flex-1 min-w-0">
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded mb-1 w-2/3 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Mobile-optimized search skeleton
export const SearchSkeletonMobile: React.FC<SearchSkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg dark:shadow-xl p-3 animate-fadein ${className}`}>
      <div className="px-3 pt-3 pb-6 min-h-[120px] flex-1">
        {/* Recent Searches Skeleton - Mobile */}
        <div className="mb-4">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-28 mb-2 animate-pulse"></div>
          <div className="flex flex-wrap gap-1">
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                key={index}
                className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16 animate-pulse"
                style={{ animationDelay: `${index * 0.1}s` }}
              />
            ))}
          </div>
        </div>

        {/* Search Results Skeleton - Mobile */}
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded-lg animate-pulse"></div>
              <div className="flex-1 min-w-0">
                <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded mb-1 w-3/4 animate-pulse"></div>
                <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-1/2 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Compact search skeleton for smaller dropdowns
export const SearchSkeletonCompact: React.FC<SearchSkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg dark:shadow-xl p-3 animate-fadein ${className}`}>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded-lg animate-pulse"></div>
            <div className="flex-1 min-w-0">
              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded mb-1 w-2/3 animate-pulse"></div>
              <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-1/3 animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
