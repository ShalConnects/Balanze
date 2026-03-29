import React from 'react';
import { LP } from '../common/listPage/listPageLayout';

const TABLE_ROW_SHIMMER_CLASS =
  'pointer-events-none absolute inset-0 z-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent';

function ClientTableSkeletonCell({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <td className={`${className} relative overflow-hidden`}>
      <div className={TABLE_ROW_SHIMMER_CLASS} aria-hidden />
      <div className="relative z-10">{children}</div>
    </td>
  );
}

// Enhanced skeleton for client cards (mobile view) - matches real ClientCard structure
export const ClientCardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
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

          {/* Contact info */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
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

// Enhanced skeleton for client table (desktop view) - matches real table structure
export const ClientTableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900 text-[14px]">
        {/* Table Header - matches real header structure */}
        <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10 shadow-sm">
          <tr>
            {['Client Name', 'Email', 'Phone', 'Currency', 'Status', 'Actions'].map((_, index) => (
              <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
              </th>
            ))}
          </tr>
        </thead>
        
        {/* Table Body - matches real row structure */}
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr
              key={rowIndex}
              className={rowIndex % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800/50'}
            >
              <ClientTableSkeletonCell className="px-6 py-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center mr-3 animate-pulse">
                    <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-1 w-32 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
                  </div>
                </div>
              </ClientTableSkeletonCell>
              <ClientTableSkeletonCell className="px-6 py-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
              </ClientTableSkeletonCell>
              <ClientTableSkeletonCell className="px-6 py-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
              </ClientTableSkeletonCell>
              <ClientTableSkeletonCell className="px-6 py-4 text-center">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse mx-auto"></div>
              </ClientTableSkeletonCell>
              <ClientTableSkeletonCell className="px-6 py-4 text-center">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16 animate-pulse mx-auto"></div>
              </ClientTableSkeletonCell>
              <ClientTableSkeletonCell className="px-6 py-4 text-center">
                <div className="flex justify-center gap-2">
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                </div>
              </ClientTableSkeletonCell>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Enhanced skeleton for client summary cards - matches real summary cards structure
export const ClientSummaryCardsSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, index) => (
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

// Skeleton filter row — parent supplies `LP.filterHeader` (Investments) or equivalent padding (ClientList loading)
export const ClientFiltersSkeleton: React.FC = () => {
  return (
    <div className={`${LP.filterRow} justify-between`} style={{ marginBottom: 0 }}>
      <div className={`${LP.filterRow} flex-1 min-w-0`}>
        <div>
          <div className="relative">
            <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
            <div className="h-8 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-gray-200 dark:bg-gray-700 pl-8 pr-2 animate-pulse" />
          </div>
        </div>
        <div className="relative hidden md:block">
          <div className="h-8 w-[7.5rem] rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse" />
        </div>
        <div className="relative hidden md:block">
          <div className="h-8 w-[7.5rem] rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse" />
        </div>
        <div className="md:hidden">
          <div className="w-8 h-8 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse" />
        </div>
      </div>
      <div className="hidden md:flex items-center gap-2 flex-shrink-0">
        <div className="h-8 w-28 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse" />
      </div>
    </div>
  );
};

