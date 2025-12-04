import React from 'react';
import { 
  PurchaseCardSkeleton, 
  PurchaseTableSkeleton, 
  PurchaseSummaryCardsSkeleton, 
  PurchaseFiltersSkeleton, 
  PurchaseAnalyticsSkeleton,
  PurchaseFormSkeleton,
  PurchaseDetailsSkeleton,
  PurchaseLoadingOverlay
} from './PurchaseSkeleton';

// Comprehensive skeleton for the entire purchase page
export const PurchasePageSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Page Title */}
            <div className="flex items-center space-x-4">
              <div className="h-8 w-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg animate-pulse"></div>
              <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
              <div className="h-9 w-9 bg-orange-600 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Summary Cards */}
          <PurchaseSummaryCardsSkeleton />
          
          {/* Filters */}
          <PurchaseFiltersSkeleton />
          
          {/* Content Tabs/Views */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            {/* Tab Headers */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <div className="flex space-x-8 px-6">
                <div className="h-12 w-24 bg-gray-200 dark:bg-gray-700 rounded-t-lg animate-pulse"></div>
                <div className="h-12 w-32 bg-gray-200 dark:bg-gray-700 rounded-t-lg animate-pulse"></div>
                <div className="h-12 w-28 bg-gray-200 dark:bg-gray-700 rounded-t-lg animate-pulse"></div>
              </div>
            </div>
            
            {/* Tab Content */}
            <div className="p-6">
              {/* Purchase List View */}
              <div className="space-y-4">
                {/* List Header */}
                <div className="flex items-center justify-between">
                  <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                </div>
                
                {/* Purchase Table (Desktop) */}
                <div className="hidden lg:block">
                  <PurchaseTableSkeleton rows={6} />
                </div>
                
                {/* Purchase Cards (Mobile) */}
                <div className="lg:hidden">
                  <PurchaseCardSkeleton count={4} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Skeleton for purchase analytics page
export const PurchaseAnalyticsPageSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Page Title */}
            <div className="flex items-center space-x-4">
              <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg animate-pulse"></div>
              <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
            
            {/* Currency Selector */}
            <div className="h-9 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <PurchaseAnalyticsSkeleton />
      </div>
    </div>
  );
};

// Skeleton for purchase form modal
export const PurchaseFormModalSkeleton: React.FC = () => {
  return <PurchaseFormSkeleton />;
};

// Skeleton for purchase details modal
export const PurchaseDetailsModalSkeleton: React.FC = () => {
  return <PurchaseDetailsSkeleton />;
};

// Loading overlay for purchase operations
export const PurchaseOperationLoadingOverlay: React.FC<{ 
  message?: string; 
  operation?: 'loading' | 'saving' | 'deleting' | 'updating' 
}> = ({ 
  message, 
  operation = 'loading' 
}) => {
  const getDefaultMessage = () => {
    switch (operation) {
      case 'saving': return 'Saving purchase...';
      case 'deleting': return 'Deleting purchase...';
      case 'updating': return 'Updating purchase...';
      default: return 'Loading purchases...';
    }
  };

  return (
    <PurchaseLoadingOverlay message={message || getDefaultMessage()} />
  );
};

// Skeleton for purchase mobile view
export const PurchaseMobileViewSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg animate-pulse"></div>
            <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
          <div className="h-8 w-8 bg-orange-600 rounded-lg animate-pulse"></div>
        </div>
      </div>

      {/* Mobile Content */}
      <div className="p-4 space-y-4">
        {/* Summary Cards (Mobile) */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-16 animate-pulse"></div>
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-12 animate-pulse"></div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-20 animate-pulse"></div>
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-12 animate-pulse"></div>
          </div>
        </div>

        {/* Mobile Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="space-y-3">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            <div className="flex space-x-2">
              <div className="flex-1 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="flex-1 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="flex-1 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Purchase Cards */}
        <PurchaseCardSkeleton count={5} />
      </div>
    </div>
  );
};

// Skeleton for purchase list with search and filters
export const PurchaseListSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          <div className="h-10 w-28 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
        </div>
      </div>

      {/* Purchase List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-4">
          <PurchaseTableSkeleton rows={8} />
        </div>
      </div>
    </div>
  );
};

// Skeleton for purchase dashboard
export const PurchaseDashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-20 animate-pulse"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-1 w-16 animate-pulse"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12 animate-pulse"></div>
              </div>
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-32 animate-pulse"></div>
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-36 animate-pulse"></div>
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
      </div>

      {/* Recent Purchases */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-32 animate-pulse"></div>
        <PurchaseTableSkeleton rows={4} />
      </div>
    </div>
  );
}; 

