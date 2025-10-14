import React, { useState } from 'react';
import {
  PurchasePageSkeleton,
  PurchaseAnalyticsPageSkeleton,
  PurchaseMobileViewSkeleton,
  PurchaseListSkeleton,
  PurchaseDashboardSkeleton,
  PurchaseFormModalSkeleton,
  PurchaseDetailsModalSkeleton,
  PurchaseOperationLoadingOverlay
} from './PurchasePageSkeleton';

export const PurchaseSkeletonDemo: React.FC = () => {
  const [demoType, setDemoType] = useState<'full-page' | 'analytics' | 'mobile' | 'list' | 'dashboard' | 'form' | 'details' | 'overlay'>('full-page');
  const [isLoading, setIsLoading] = useState(true);
  const [operation, setOperation] = useState<'loading' | 'saving' | 'deleting' | 'updating'>('loading');

  // Simulate loading
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const renderDemo = () => {
    if (isLoading) {
      switch (demoType) {
        case 'full-page':
          return <PurchasePageSkeleton />;
        case 'analytics':
          return <PurchaseAnalyticsPageSkeleton />;
        case 'mobile':
          return <PurchaseMobileViewSkeleton />;
        case 'list':
          return <PurchaseListSkeleton />;
        case 'dashboard':
          return <PurchaseDashboardSkeleton />;
        case 'form':
          return <PurchaseFormModalSkeleton />;
        case 'details':
          return <PurchaseDetailsModalSkeleton />;
        case 'overlay':
          return <PurchaseOperationLoadingOverlay operation={operation} />;
        default:
          return <PurchasePageSkeleton />;
      }
    }

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            Purchase Skeleton Loading Complete!
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            The skeleton loading has finished. Select a different demo type to see more examples.
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Demo Controls */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center gap-4">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              Purchase Skeleton Demo
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setDemoType('full-page');
                  setIsLoading(true);
                }}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  demoType === 'full-page' 
                    ? 'bg-orange-600 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Full Page
              </button>
              
              <button
                onClick={() => {
                  setDemoType('analytics');
                  setIsLoading(true);
                }}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  demoType === 'analytics' 
                    ? 'bg-orange-600 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Analytics
              </button>
              
              <button
                onClick={() => {
                  setDemoType('mobile');
                  setIsLoading(true);
                }}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  demoType === 'mobile' 
                    ? 'bg-orange-600 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Mobile View
              </button>
              
              <button
                onClick={() => {
                  setDemoType('list');
                  setIsLoading(true);
                }}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  demoType === 'list' 
                    ? 'bg-orange-600 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                List View
              </button>
              
              <button
                onClick={() => {
                  setDemoType('dashboard');
                  setIsLoading(true);
                }}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  demoType === 'dashboard' 
                    ? 'bg-orange-600 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Dashboard
              </button>
              
              <button
                onClick={() => {
                  setDemoType('form');
                  setIsLoading(true);
                }}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  demoType === 'form' 
                    ? 'bg-orange-600 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Form Modal
              </button>
              
              <button
                onClick={() => {
                  setDemoType('details');
                  setIsLoading(true);
                }}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  demoType === 'details' 
                    ? 'bg-orange-600 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Details Modal
              </button>
              
              <button
                onClick={() => {
                  setDemoType('overlay');
                  setIsLoading(true);
                }}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  demoType === 'overlay' 
                    ? 'bg-orange-600 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Loading Overlay
              </button>
            </div>

            {/* Operation Selector for Overlay */}
            {demoType === 'overlay' && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Operation:</span>
                <select
                  value={operation}
                  onChange={(e) => setOperation(e.target.value as any)}
                  className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="loading">Loading</option>
                  <option value="saving">Saving</option>
                  <option value="deleting">Deleting</option>
                  <option value="updating">Updating</option>
                </select>
              </div>
            )}
          </div>
          
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Current Demo: <span className="font-medium">{demoType.replace('-', ' ')}</span>
            {isLoading && <span className="ml-2 text-orange-600">Loading...</span>}
          </div>
        </div>
      </div>

      {/* Demo Content */}
      {renderDemo()}
    </div>
  );
}; 

