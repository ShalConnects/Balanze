import React from 'react';
import { Flame, TrendingUp } from 'lucide-react';
import { Habit } from '../../types/habit';
import { useHabitStore } from '../../store/useHabitStore';
import { startOfWeek } from 'date-fns';

interface HabitStatsProps {
  habit: Habit;
  weekStart: Date;
}

export const HabitStats: React.FC<HabitStatsProps> = ({ habit, weekStart }) => {
  const { getHabitStats } = useHabitStore();
  const stats = getHabitStats(habit.id, weekStart);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
      <h4 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3 truncate">
        {habit.title}
      </h4>
      
      <div className="space-y-2 sm:space-y-3">
        {/* Current Streak */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500 flex-shrink-0" />
            <span className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">Current Streak</span>
          </div>
          <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
            {stats.currentStreak} {stats.currentStreak === 1 ? 'day' : 'days'}
          </span>
        </div>

        {/* Best Streak */}
        {stats.bestStreak > 0 && (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
              <span className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">Best Streak</span>
            </div>
            <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
              {stats.bestStreak} {stats.bestStreak === 1 ? 'day' : 'days'}
            </span>
          </div>
        )}

        {/* Weekly Completion */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">This Week</span>
          <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
            {stats.weeklyCompletion}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 sm:h-2">
          <div
            className="bg-gradient-primary h-1.5 sm:h-2 rounded-full transition-all duration-300"
            style={{ width: `${stats.weeklyCompletion}%` }}
          />
        </div>
      </div>
    </div>
  );
};

