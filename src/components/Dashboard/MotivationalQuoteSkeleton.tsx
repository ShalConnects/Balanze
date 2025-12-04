import React from 'react';
import { Skeleton } from '../common/Skeleton';

export const MotivationalQuoteSkeleton: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700 relative overflow-hidden">
      {/* Background decoration skeleton */}
      <div className="absolute top-0 right-0 w-16 h-16 opacity-10">
        <Skeleton className="w-full h-full rounded-full" />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Skeleton className="w-4 h-4 rounded-full" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-1">
            <Skeleton className="w-5 h-5 rounded-full" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="space-y-2 mb-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            
            <div className="flex items-center justify-between mt-2">
              <Skeleton className="h-3 w-24" />
              
              <div className="flex items-center space-x-2">
                <Skeleton className="w-6 h-6 rounded-full" />
                <Skeleton className="w-6 h-6 rounded-full" />
                <Skeleton className="w-6 h-6 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Subtle animation skeleton */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-pink-400 opacity-20"></div>
    </div>
  );
}; 

