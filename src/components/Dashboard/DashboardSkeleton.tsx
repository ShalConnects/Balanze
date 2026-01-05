import React from 'react';
import { Skeleton, SkeletonCard, SkeletonChart, SkeletonMobileCard, SkeletonStaggered } from '../common/Skeleton';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row gap-6 animate-fade-in pb-24 sm:pb-12">
      {/* Main Content - Full width on mobile, flex-1 on desktop */}
      <div className="flex-1 space-y-4 sm:space-y-5 md:space-y-6">
        
        {/* Multi-Currency Quick Access Skeleton - Enhanced with shimmer effect */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-3 sm:p-4 border border-blue-200 dark:border-blue-700 relative overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent hidden sm:block"></div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="space-y-1.5 sm:space-y-2 flex-1 min-w-0">
              <div className="h-4 sm:h-5 md:h-6 bg-gray-200 dark:bg-gray-700 rounded w-36 sm:w-48 animate-pulse"></div>
              <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 sm:w-64 animate-pulse"></div>
            </div>
            <div className="h-8 sm:h-9 md:h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-full sm:w-28 md:w-32 animate-pulse flex-shrink-0"></div>
          </div>
        </div>

        {/* Currency Overview Cards Skeleton - Enhanced with realistic layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 items-stretch">
          {/* USD Currency Card */}
          <div className="w-full h-full">
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-xl p-3 sm:p-4 shadow-sm border border-blue-200/50 dark:border-blue-800/50 relative overflow-hidden h-full flex flex-col">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent hidden sm:block"></div>
              <div className="flex items-center justify-between gap-2 sm:gap-3 mb-1 min-w-0">
                <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 sm:w-32 animate-pulse"></div>
                <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-12 sm:w-16 animate-pulse flex-shrink-0"></div>
              </div>
              <div className="space-y-2 sm:space-y-3 md:space-y-4 flex-1 mt-2 sm:mt-3">
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 sm:w-20 animate-pulse"></div>
                  <div className="h-4 sm:h-5 md:h-6 bg-gray-200 dark:bg-gray-700 rounded w-20 sm:w-24 animate-pulse flex-shrink-0"></div>
                </div>
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 sm:w-20 animate-pulse"></div>
                  <div className="h-4 sm:h-5 md:h-6 bg-gray-200 dark:bg-gray-700 rounded w-20 sm:w-24 animate-pulse flex-shrink-0"></div>
                </div>
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 sm:w-20 animate-pulse"></div>
                  <div className="h-4 sm:h-5 md:h-6 bg-gray-200 dark:bg-gray-700 rounded w-20 sm:w-24 animate-pulse flex-shrink-0"></div>
                </div>
              </div>
              <div className="mt-4 sm:mt-6">
                <div className="h-24 sm:h-28 md:h-32 bg-gray-200 dark:bg-gray-700 rounded-lg w-full animate-pulse"></div>
              </div>
            </div>
          </div>
          
          {/* EUR Currency Card */}
          <div className="w-full h-full">
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-xl p-3 sm:p-4 shadow-sm border border-blue-200/50 dark:border-blue-800/50 relative overflow-hidden h-full flex flex-col">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent hidden sm:block"></div>
              <div className="flex items-center justify-between gap-2 sm:gap-3 mb-1 min-w-0">
                <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 sm:w-32 animate-pulse"></div>
                <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-12 sm:w-16 animate-pulse flex-shrink-0"></div>
              </div>
              <div className="space-y-2 sm:space-y-3 md:space-y-4 flex-1 mt-2 sm:mt-3">
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 sm:w-20 animate-pulse"></div>
                  <div className="h-4 sm:h-5 md:h-6 bg-gray-200 dark:bg-gray-700 rounded w-20 sm:w-24 animate-pulse flex-shrink-0"></div>
                </div>
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 sm:w-20 animate-pulse"></div>
                  <div className="h-4 sm:h-5 md:h-6 bg-gray-200 dark:bg-gray-700 rounded w-20 sm:w-24 animate-pulse flex-shrink-0"></div>
                </div>
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 sm:w-20 animate-pulse"></div>
                  <div className="h-4 sm:h-5 md:h-6 bg-gray-200 dark:bg-gray-700 rounded w-20 sm:w-24 animate-pulse flex-shrink-0"></div>
                </div>
              </div>
              <div className="mt-4 sm:mt-6">
                <div className="h-24 sm:h-28 md:h-32 bg-gray-200 dark:bg-gray-700 rounded-lg w-full animate-pulse"></div>
              </div>
            </div>
          </div>
          
          {/* Donations & Savings Card */}
          <div className="w-full h-full">
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-xl p-3 sm:p-4 shadow-sm border border-blue-200/50 dark:border-blue-800/50 relative overflow-hidden h-full flex flex-col">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent hidden sm:block"></div>
              <div className="flex items-center justify-between gap-2 sm:gap-3 mb-2 sm:mb-3 min-w-0">
                <div className="h-4 sm:h-5 md:h-6 bg-gray-200 dark:bg-gray-700 rounded w-24 sm:w-32 animate-pulse"></div>
                <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-12 sm:w-16 animate-pulse flex-shrink-0"></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4 flex-1">
                <div className="w-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg p-2 sm:p-3 md:p-4">
                  <div className="animate-pulse">
                    <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-600 rounded w-20 sm:w-24 mb-1 sm:mb-2"></div>
                    <div className="h-4 sm:h-5 md:h-6 bg-gray-200 dark:bg-gray-600 rounded w-12 sm:w-16"></div>
                  </div>
                </div>
                <div className="w-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg p-2 sm:p-3 md:p-4">
                  <div className="animate-pulse">
                    <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-600 rounded w-20 sm:w-24 mb-1 sm:mb-2"></div>
                    <div className="h-4 sm:h-5 md:h-6 bg-gray-200 dark:bg-gray-600 rounded w-12 sm:w-16"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Purchase Overview */}
          <div className="w-full h-full">
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-xl p-3 sm:p-4 shadow-sm border border-blue-200/50 dark:border-blue-800/50 relative overflow-hidden h-full flex flex-col">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent hidden sm:block"></div>
              <div className="flex items-center justify-between gap-2 sm:gap-3 mb-1 sm:mb-2 min-w-0">
                <div className="h-4 sm:h-5 md:h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 sm:w-40 animate-pulse"></div>
                <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-12 sm:w-16 animate-pulse flex-shrink-0"></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3 md:gap-4 mb-0 flex-1">
                <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-2 sm:p-3">
                  <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 sm:w-20 mb-1 sm:mb-2 animate-pulse"></div>
                  <div className="h-4 sm:h-5 md:h-6 bg-gray-200 dark:bg-gray-700 rounded w-12 sm:w-16 animate-pulse"></div>
                </div>
                <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-2 sm:p-3">
                  <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 sm:w-20 mb-1 sm:mb-2 animate-pulse"></div>
                  <div className="h-4 sm:h-5 md:h-6 bg-gray-200 dark:bg-gray-700 rounded w-12 sm:w-16 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Lend & Borrow Summary */}
          <div className="w-full h-full">
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-xl p-3 sm:p-4 shadow-sm border border-blue-200/50 dark:border-blue-800/50 relative overflow-hidden h-full flex flex-col">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent hidden sm:block"></div>
              <div className="flex items-center justify-between gap-2 sm:gap-3 mb-1 sm:mb-2 min-w-0">
                <div className="h-4 sm:h-5 md:h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 sm:w-40 animate-pulse"></div>
                <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-12 sm:w-16 animate-pulse flex-shrink-0"></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3 md:gap-4 mb-0 flex-1">
                <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-2 sm:p-3">
                  <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 sm:w-20 mb-1 sm:mb-2 animate-pulse"></div>
                  <div className="h-4 sm:h-5 md:h-6 bg-gray-200 dark:bg-gray-700 rounded w-12 sm:w-16 animate-pulse"></div>
                </div>
                <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-2 sm:p-3">
                  <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 sm:w-20 mb-1 sm:mb-2 animate-pulse"></div>
                  <div className="h-4 sm:h-5 md:h-6 bg-gray-200 dark:bg-gray-700 rounded w-12 sm:w-16 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Transfer Summary */}
          <div className="w-full h-full">
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-xl p-3 sm:p-4 shadow-sm border border-blue-200/50 dark:border-blue-800/50 relative overflow-hidden h-full flex flex-col">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent hidden sm:block"></div>
              <div className="flex items-center justify-between gap-2 sm:gap-3 mb-1 sm:mb-2 min-w-0">
                <div className="h-4 sm:h-5 md:h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 sm:w-40 animate-pulse"></div>
                <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-12 sm:w-16 animate-pulse flex-shrink-0"></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3 md:gap-4 mb-0 flex-1">
                <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-2 sm:p-3">
                  <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 sm:w-20 mb-1 sm:mb-2 animate-pulse"></div>
                  <div className="h-4 sm:h-5 md:h-6 bg-gray-200 dark:bg-gray-700 rounded w-12 sm:w-16 animate-pulse"></div>
                </div>
                <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-2 sm:p-3">
                  <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 sm:w-20 mb-1 sm:mb-2 animate-pulse"></div>
                  <div className="h-4 sm:h-5 md:h-6 bg-gray-200 dark:bg-gray-700 rounded w-12 sm:w-16 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Clients Summary */}
          <div className="w-full h-full">
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-xl p-3 sm:p-4 shadow-sm border border-blue-200/50 dark:border-blue-800/50 relative overflow-hidden h-full flex flex-col">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent hidden sm:block"></div>
              <div className="flex items-center justify-between gap-2 sm:gap-3 mb-1 sm:mb-2 min-w-0">
                <div className="h-4 sm:h-5 md:h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 sm:w-40 animate-pulse"></div>
                <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-12 sm:w-16 animate-pulse flex-shrink-0"></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3 md:gap-4 mb-0 flex-1">
                <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-2 sm:p-3">
                  <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 sm:w-20 mb-1 sm:mb-2 animate-pulse"></div>
                  <div className="h-4 sm:h-5 md:h-6 bg-gray-200 dark:bg-gray-700 rounded w-12 sm:w-16 animate-pulse"></div>
                </div>
                <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-2 sm:p-3">
                  <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 sm:w-20 mb-1 sm:mb-2 animate-pulse"></div>
                  <div className="h-4 sm:h-5 md:h-6 bg-gray-200 dark:bg-gray-700 rounded w-12 sm:w-16 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* Motivational Quote Skeleton - Hidden on mobile, shown on desktop */}
        <div className="hidden lg:block bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700 relative overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0 mt-1 animate-pulse"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2 animate-pulse"></div>
              <div className="flex items-center justify-between mt-3">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
                <div className="flex space-x-2">
                  <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                  <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions Skeleton - Hidden on mobile, shown on desktop */}
        <div className="hidden lg:block w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 lg:p-6 shadow-sm border border-blue-200/50 dark:border-blue-800/50 relative overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent hidden sm:block"></div>
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
          </div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-100 dark:border-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                  <div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-1 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-1 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Sidebar - Hidden on mobile, shown on desktop */}
      <div className="hidden lg:block w-72 space-y-6">
        {/* Last Wish Countdown Widget Skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 lg:p-6 shadow-sm border border-gray-200 dark:border-gray-700 relative overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent hidden sm:block"></div>
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
          </div>
        </div>

        {/* Notes and Todos Widget Skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 lg:p-6 shadow-sm border border-gray-200 dark:border-gray-700 relative overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent hidden sm:block"></div>
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="p-3 rounded-lg border bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Section - Accordion Layout */}
      <div className="lg:hidden dashboard-mobile-container">
        <SkeletonStaggered count={4} />
      </div>
    </div>
  );
}; 

