import React from 'react';

// Enhanced skeleton for account cards (mobile view) - matches real AccountCard structure
export const AccountCardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm relative overflow-hidden"
          style={{ 
            animationDelay: `${index * 0.1}s`,
            animationDuration: '2.5s'
          }}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
          
          {/* Header with icon and name */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center animate-pulse">
                <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded"></div>
              </div>
              <div className="flex-1">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-1 animate-pulse"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
              </div>
            </div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16 animate-pulse"></div>
          </div>

          {/* Balance and stats */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
            </div>
            <div className="flex items-center justify-between">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700 mt-4">
            <div className="flex space-x-2">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            </div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Enhanced skeleton for account table (desktop view) - matches real table structure
export const AccountTableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900 text-[14px]">
        {/* Table Header - matches real header structure */}
        <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10 shadow-sm">
          <tr>
            {['Account Name', 'Type', 'Currency', 'Balance', 'Transactions', 'DPS', 'Actions'].map((_, index) => (
              <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
              </th>
            ))}
          </tr>
        </thead>
        
        {/* Table Body - matches real row structure */}
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex} className={`${rowIndex % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800/50'} relative overflow-hidden`}>
              {/* Shimmer effect for each row */}
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
              
              {/* Account Name - matches real account name structure */}
              <td className="px-6 py-4 relative z-10">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center mr-3 animate-pulse">
                    <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-1 w-32 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
                  </div>
                </div>
              </td>
              
              {/* Type - matches real type badge */}
              <td className="px-6 py-4 relative z-10">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20 animate-pulse"></div>
              </td>
              
              {/* Currency - matches real currency display */}
              <td className="px-6 py-4 text-center relative z-10">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse mx-auto"></div>
              </td>
              
              {/* Balance - matches real balance display */}
              <td className="px-6 py-4 text-center relative z-10">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse mx-auto"></div>
              </td>
              
              {/* Transactions - matches real transaction count */}
              <td className="px-6 py-4 text-center relative z-10">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12 animate-pulse mx-auto"></div>
              </td>
              
              {/* DPS - matches real DPS status */}
              <td className="px-6 py-4 text-center relative z-10">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16 animate-pulse mx-auto"></div>
              </td>
              
              {/* Actions - matches real action buttons */}
              <td className="px-6 py-4 text-center relative z-10">
                <div className="flex justify-center gap-2">
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Enhanced skeleton for account summary cards - matches real summary cards structure
export const AccountSummaryCardsSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-3 px-4 relative overflow-hidden">
          {/* Shimmer effect */}
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
          
          <div className="flex items-center justify-between relative z-10">
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

// Enhanced skeleton for account filters - matches real filter structure
export const AccountFiltersSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap md:flex-nowrap justify-between items-center w-full gap-3">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-2 flex-1">
            {/* Search */}
            <div className="flex-1 min-w-[200px] relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg pl-10 animate-pulse"></div>
            </div>
            
            {/* Currency Filter */}
            <div className="relative">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-32 animate-pulse"></div>
            </div>
            
            {/* Type Filter */}
            <div className="relative">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-28 animate-pulse"></div>
            </div>
            
            {/* Status Filter */}
            <div className="relative">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-32 animate-pulse"></div>
            </div>
            
            {/* Mobile Filter Button */}
            <div className="md:hidden">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
            </div>
          </div>
          
          {/* Desktop Action Buttons */}
          <div className="hidden md:flex items-center gap-2">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced skeleton for transaction filters - matches real transaction filter structure
export const TransactionFiltersSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap md:flex-nowrap justify-between items-center w-full gap-3">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-2 flex-1">
            {/* Search Filter */}
            <div className="flex-1 min-w-[200px] relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg pl-10 animate-pulse"></div>
            </div>
            
            {/* Type Filter */}
            <div className="relative">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-28 animate-pulse"></div>
            </div>
            
            {/* Category Filter */}
            <div className="relative">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-32 animate-pulse"></div>
            </div>
            
            {/* Account Filter */}
            <div className="relative">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-32 animate-pulse"></div>
            </div>
            
            {/* Mobile Filter Button */}
            <div className="md:hidden">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
            </div>
          </div>
          
          {/* Desktop Action Buttons */}
          <div className="hidden md:flex items-center gap-2">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced skeleton for transaction summary cards - matches real transaction summary structure
export const TransactionSummaryCardsSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-3 px-4 relative overflow-hidden">
          {/* Shimmer effect */}
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
          
          <div className="flex items-center justify-between relative z-10">
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

// Enhanced skeleton for transaction table - matches real transaction table structure
export const TransactionTableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900 text-[14px]">
        {/* Table Header - matches real header structure */}
        <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10 shadow-sm">
          <tr>
            {['Date', 'Description', 'Category', 'Account', 'Type', 'Amount', 'Actions'].map((_, index) => (
              <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
              </th>
            ))}
          </tr>
        </thead>
        
        {/* Table Body - matches real row structure */}
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex} className={`${rowIndex % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800/50'} relative overflow-hidden`}>
              {/* Shimmer effect for each row */}
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
              
              {/* Date - matches real date structure */}
              <td className="px-6 py-4 relative z-10">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center mr-3 animate-pulse">
                    <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-1 w-32 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
                  </div>
                </div>
              </td>
              
              {/* Description - matches real description display */}
              <td className="px-6 py-4 relative z-10">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
              </td>
              
              {/* Category - matches real category badge */}
              <td className="px-6 py-4 relative z-10">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20 animate-pulse"></div>
              </td>
              
              {/* Account - matches real account display */}
              <td className="px-6 py-4 text-center relative z-10">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse mx-auto"></div>
              </td>
              
              {/* Type - matches real type badge */}
              <td className="px-6 py-4 text-center relative z-10">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20 animate-pulse mx-auto"></div>
              </td>
              
              {/* Amount - matches real amount display */}
              <td className="px-6 py-4 text-center relative z-10">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse mx-auto"></div>
              </td>
              
              {/* Actions - matches real action buttons */}
              <td className="px-6 py-4 text-center relative z-10">
                <div className="flex justify-center gap-2">
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Enhanced skeleton for transaction mobile view - matches real transaction mobile structure
export const TransactionMobileSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm relative overflow-hidden"
          style={{ 
            animationDelay: `${index * 0.1}s`,
            animationDuration: '2.5s'
          }}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
          
          {/* Header with date and amount */}
          <div className="flex items-center justify-between mb-3 relative z-10">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center animate-pulse">
                <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
              </div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-1 animate-pulse"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
              </div>
            </div>
            <div className="text-right">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-1 animate-pulse"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
            </div>
          </div>

          {/* Description and category */}
          <div className="space-y-2 mb-3 relative z-10">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
            <div className="flex items-center justify-between">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20 animate-pulse"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700 relative z-10">
            <div className="flex space-x-2">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            </div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16 animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Enhanced skeleton for account analytics - matches real analytics structure
export const AccountAnalyticsSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 skeleton-mobile">
      {/* KPI Cards - matches real KPI structure */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Balance */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-24 animate-pulse"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-1 w-32 animate-pulse"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
            </div>
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          </div>
        </div>
        
        {/* Active Accounts */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-26 animate-pulse"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-1 w-32 animate-pulse"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
            </div>
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          </div>
        </div>
        
        {/* Total Transactions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-20 animate-pulse"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-1 w-16 animate-pulse"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
            </div>
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          </div>
        </div>
        
        {/* Average Balance */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-28 animate-pulse"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-1 w-24 animate-pulse"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
            </div>
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>
      
      {/* Charts - matches real chart structure */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Balance Trend Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-48 animate-pulse"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        
        {/* Account Distribution Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-52 animate-pulse"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

// Enhanced skeleton for account form - matches real form structure
export const AccountFormSkeleton: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50"></div>
      <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* Account Name */}
          <div>
            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse"></div>
            <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          </div>

          {/* Account Type */}
          <div>
            <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse"></div>
            <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          </div>

          {/* Initial Balance */}
          <div>
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse"></div>
            <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          </div>

          {/* Currency */}
          <div>
            <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse"></div>
            <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          </div>

          {/* Description */}
          <div>
            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse"></div>
            <div className="h-20 w-full bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Loading overlay with spinner - matches real loading overlay
export const AccountLoadingOverlay: React.FC<{ message?: string }> = ({ message = 'Loading accounts...' }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-700 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
        <p className="text-gray-700 dark:text-gray-300 font-medium text-sm">{message}</p>
      </div>
    </div>
  );
};

// Shimmer effect component - enhanced shimmer
export const AccountShimmer: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
    </div>
  );
}; 

