import React from 'react';
import { Flame, TrendingUp } from 'lucide-react';
import { Habit } from '../../types/habit';
import { useHabitStore } from '../../store/useHabitStore';

interface HabitStatsTableProps {
  habits: Habit[];
  weekStart: Date;
}

export const HabitStatsTable: React.FC<HabitStatsTableProps> = ({ habits, weekStart }) => {
  const { getHabitStats } = useHabitStore();

  if (habits.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No habits to display
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto -mx-2 sm:mx-0 px-2 sm:px-0">
      <div className="min-w-[500px] sm:min-w-full">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left px-2 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                Habit
              </th>
              <th className="text-center px-2 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                Current Streak
              </th>
              <th className="text-center px-2 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                Best Streak
              </th>
              <th className="text-center px-2 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                This Week
              </th>
            </tr>
          </thead>
        <tbody>
          {habits.map((habit) => {
            const stats = getHabitStats(habit.id, weekStart);
            return (
              <tr
                key={habit.id}
                className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <td className="px-2 py-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div
                      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                        habit.color === 'yellow' ? 'bg-yellow-400' :
                        habit.color === 'pink' ? 'bg-pink-400' :
                        habit.color === 'blue' ? 'bg-blue-400' :
                        habit.color === 'green' ? 'bg-green-400' :
                        habit.color === 'orange' ? 'bg-orange-400' :
                        'bg-purple-400'
                      }`}
                    />
                    <span className="text-xs font-medium text-gray-900 dark:text-white truncate">
                      {habit.title}
                    </span>
                  </div>
                </td>
                <td className="px-2 py-2 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Flame className="w-3 h-3 text-orange-500 flex-shrink-0" />
                    <span className="text-xs font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                      {stats.currentStreak} {stats.currentStreak === 1 ? 'day' : 'days'}
                    </span>
                  </div>
                </td>
                <td className="px-2 py-2 text-center">
                  {stats.bestStreak > 0 ? (
                    <div className="flex items-center justify-center gap-1">
                      <TrendingUp className="w-3 h-3 text-green-500 flex-shrink-0" />
                      <span className="text-xs font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                        {stats.bestStreak} {stats.bestStreak === 1 ? 'day' : 'days'}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 dark:text-gray-500">-</span>
                  )}
                </td>
                <td className="px-2 py-2 text-center">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">
                      {stats.weeklyCompletion}%
                    </span>
                    <div className="w-full max-w-[60px] bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                      <div
                        className="bg-gradient-primary h-1 rounded-full transition-all duration-300"
                        style={{ width: `${stats.weeklyCompletion}%` }}
                      />
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

