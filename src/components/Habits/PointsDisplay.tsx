import React from 'react';
import { Star, TrendingUp } from 'lucide-react';
import { useHabitStore } from '../../store/useHabitStore';

export const PointsDisplay: React.FC = () => {
  const { gamification } = useHabitStore();

  if (!gamification) {
    return null;
  }

  return (
    <div className="flex items-center gap-5 px-5 py-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800 shadow-sm">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="p-2.5 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex-shrink-0">
          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
        </div>
        <div className="min-w-0">
          <div className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">Points</div>
          <div className="text-lg font-bold text-gray-900 dark:text-white truncate">
            {gamification.points.toLocaleString()}
          </div>
        </div>
      </div>
      
      <div className="h-10 w-px bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
      
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
          <TrendingUp className="w-5 h-5 text-blue-500" />
        </div>
        <div className="min-w-0">
          <div className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">Level</div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {gamification.level}
          </div>
        </div>
      </div>
    </div>
  );
};

