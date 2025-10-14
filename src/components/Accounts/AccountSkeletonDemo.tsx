import React, { useState, useEffect } from 'react';
import { AccountsPageSkeleton } from './AccountsPageSkeleton';
import { AccountCardSkeleton, AccountTableSkeleton, AccountSummaryCardsSkeleton } from './AccountSkeleton';

export const AccountSkeletonDemo: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [demoType, setDemoType] = useState<'full' | 'cards' | 'table' | 'summary'>('full');

  useEffect(() => {
    // Simulate loading for demo purposes
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Demo Controls */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Skeleton Loading Demo</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setDemoType('full')}
              className={`px-3 py-1 rounded text-sm ${
                demoType === 'full' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Full Page
            </button>
            <button
              onClick={() => setDemoType('cards')}
              className={`px-3 py-1 rounded text-sm ${
                demoType === 'cards' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Mobile Cards
            </button>
            <button
              onClick={() => setDemoType('table')}
              className={`px-3 py-1 rounded text-sm ${
                demoType === 'table' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Desktop Table
            </button>
            <button
              onClick={() => setDemoType('summary')}
              className={`px-3 py-1 rounded text-sm ${
                demoType === 'summary' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Summary Cards
            </button>
          </div>
        </div>

        {/* Skeleton Display */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {demoType === 'full' && 'Full Page Skeleton'}
            {demoType === 'cards' && 'Mobile Cards Skeleton'}
            {demoType === 'table' && 'Desktop Table Skeleton'}
            {demoType === 'summary' && 'Summary Cards Skeleton'}
          </h3>
          
          {demoType === 'full' && <AccountsPageSkeleton isMobile={false} />}
          {demoType === 'cards' && <AccountCardSkeleton count={4} />}
          {demoType === 'table' && <AccountTableSkeleton rows={5} />}
          {demoType === 'summary' && <AccountSummaryCardsSkeleton />}
        </div>

        {/* Loading Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-4 h-4 bg-blue-600 rounded-full animate-pulse"></div>
            <span className="text-blue-800 dark:text-blue-200 font-medium">Loading...</span>
          </div>
          <p className="text-blue-700 dark:text-blue-300 text-sm">
            This demo shows the improved skeleton loading with better proportions and realistic layouts. 
            The skeletons now match the actual component structure more closely.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-4 h-4 bg-green-600 rounded-full"></div>
          <span className="text-green-800 dark:text-green-200 font-medium">Loading Complete!</span>
        </div>
        <p className="text-green-700 dark:text-green-300 text-sm">
          The skeleton loading has completed. You can see how the improved proportions and spacing 
          make the loading experience much more realistic and professional.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Improvements Made</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900 dark:text-white">Better Proportions</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Realistic width and height ratios</li>
              <li>• Proper spacing between elements</li>
              <li>• Consistent padding and margins</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900 dark:text-white">Enhanced Animations</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Smooth pulse animations</li>
              <li>• Consistent timing</li>
              <li>• Dark mode support</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900 dark:text-white">Realistic Layouts</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Matches actual component structure</li>
              <li>• Proper flex layouts</li>
              <li>• Responsive design</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900 dark:text-white">Accessibility</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Reduced motion support</li>
              <li>• High contrast mode</li>
              <li>• Screen reader friendly</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}; 

