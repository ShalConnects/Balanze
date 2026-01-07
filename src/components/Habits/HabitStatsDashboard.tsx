import React from 'react';
import { Trophy, Star, Flame, Target, TrendingUp, Award } from 'lucide-react';
import { useHabitStore } from '../../store/useHabitStore';
import { PointsDisplay } from './PointsDisplay';
import { LevelProgress } from './LevelProgress';
import { AchievementBadge } from './AchievementBadge';

interface HabitStatsDashboardProps {
  onShowAchievements?: () => void;
}

export const HabitStatsDashboard: React.FC<HabitStatsDashboardProps> = ({ onShowAchievements }) => {
  const { gamification, achievements, habits, unclaimedAchievements, getStreak } = useHabitStore();

  if (!gamification) {
    return null;
  }
  const claimedAchievements = achievements.filter(a => a.claimed_at);
  const totalStreaks = habits.map(h => getStreak(h.id));
  const maxStreak = totalStreaks.length > 0 ? Math.max(...totalStreaks) : 0;
  const totalStreakSum = totalStreaks.reduce((sum, streak) => sum + streak, 0);
  const averageStreak = habits.length > 0 ? Math.round(totalStreakSum / habits.length) : 0;

  return (
    <div className="space-y-6">
      {/* Points and Level */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200 p-6">
        <PointsDisplay />
        <div className="mt-6">
          <LevelProgress />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Your Stats
        </h3>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex items-center gap-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0 shadow-sm">
              <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Total Habits</div>
              <div className="text-base font-bold text-gray-900 dark:text-white">
                {habits.length}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0 shadow-sm">
              <Star className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Completions</div>
              <div className="text-base font-bold text-gray-900 dark:text-white">
                {gamification.totalCompletions}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex-shrink-0 shadow-sm">
              <Flame className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Best Streak</div>
              <div className="text-base font-bold text-gray-900 dark:text-white">
                {maxStreak} days
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex-shrink-0 shadow-sm">
              <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Avg Streak</div>
              <div className="text-base font-bold text-gray-900 dark:text-white">
                {averageStreak} days
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Achievements */}
      {claimedAchievements.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
              Recent Achievements
            </h3>
            {onShowAchievements ? (
              <button
                onClick={onShowAchievements}
                className="relative p-2.5 text-yellow-500 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-all duration-150 hover:scale-105 active:scale-95"
                title="View all achievements"
              >
                <Trophy className="w-5 h-5 flex-shrink-0" />
                {unclaimedAchievements.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                    {unclaimedAchievements.length}
                  </span>
                )}
              </button>
            ) : (
              <Trophy className="w-5 h-5 text-yellow-500 flex-shrink-0" />
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {claimedAchievements.slice(0, 6).map((achievement) => (
              <AchievementBadge key={achievement.id} achievement={achievement} size="sm" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

