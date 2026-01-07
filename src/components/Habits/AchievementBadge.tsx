import React from 'react';
import { Trophy, Award, Star, Flame, Target, Zap } from 'lucide-react';
import { HabitAchievement, AchievementType } from '../../types/habit';

interface AchievementBadgeProps {
  achievement: HabitAchievement;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

const ACHIEVEMENT_CONFIG: Record<AchievementType, { icon: React.ComponentType<any>; name: string; description: string; color: string }> = {
  first_completion: { icon: Star, name: 'First Steps', description: 'Complete your first habit', color: 'yellow' },
  streak_3: { icon: Flame, name: 'On Fire', description: '3-day streak', color: 'orange' },
  streak_7: { icon: Flame, name: 'Week Warrior', description: '7-day streak', color: 'red' },
  streak_14: { icon: Flame, name: 'Two Week Champion', description: '14-day streak', color: 'red' },
  streak_30: { icon: Trophy, name: 'Month Master', description: '30-day streak', color: 'purple' },
  streak_50: { icon: Trophy, name: 'Streak Legend', description: '50-day streak', color: 'purple' },
  streak_100: { icon: Trophy, name: 'Century Streak', description: '100-day streak', color: 'gold' },
  perfect_week: { icon: Target, name: 'Perfect Week', description: 'Complete all habits for a week', color: 'green' },
  perfect_month: { icon: Target, name: 'Perfect Month', description: 'Complete all habits for a month', color: 'green' },
  completions_10: { icon: Award, name: 'Getting Started', description: '10 total completions', color: 'blue' },
  completions_50: { icon: Award, name: 'Habit Builder', description: '50 total completions', color: 'blue' },
  completions_100: { icon: Award, name: 'Century Club', description: '100 total completions', color: 'purple' },
  completions_500: { icon: Trophy, name: 'Habit Master', description: '500 total completions', color: 'gold' },
  level_5: { icon: Zap, name: 'Level 5', description: 'Reach level 5', color: 'blue' },
  level_10: { icon: Zap, name: 'Level 10', description: 'Reach level 10', color: 'purple' },
  level_25: { icon: Zap, name: 'Level 25', description: 'Reach level 25', color: 'purple' },
  level_50: { icon: Zap, name: 'Level 50', description: 'Reach level 50', color: 'gold' },
};

const getColorClasses = (color: string) => {
  const colorMap: Record<string, { bg: string; border: string; text: string }> = {
    yellow: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', border: 'border-yellow-400', text: 'text-yellow-700 dark:text-yellow-300' },
    orange: { bg: 'bg-orange-100 dark:bg-orange-900/30', border: 'border-orange-400', text: 'text-orange-700 dark:text-orange-300' },
    red: { bg: 'bg-red-100 dark:bg-red-900/30', border: 'border-red-400', text: 'text-red-700 dark:text-red-300' },
    green: { bg: 'bg-green-100 dark:bg-green-900/30', border: 'border-green-400', text: 'text-green-700 dark:text-green-300' },
    blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', border: 'border-blue-400', text: 'text-blue-700 dark:text-blue-300' },
    purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', border: 'border-purple-400', text: 'text-purple-700 dark:text-purple-300' },
    gold: { bg: 'bg-yellow-200 dark:bg-yellow-800/40', border: 'border-yellow-500', text: 'text-yellow-800 dark:text-yellow-200' },
  };
  return colorMap[color] || colorMap.blue;
};

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({ 
  achievement, 
  onClick,
  size = 'md' 
}) => {
  const config = ACHIEVEMENT_CONFIG[achievement.achievement_type];
  if (!config) return null;

  const Icon = config.icon;
  const colorClasses = getColorClasses(config.color);
  const isClaimed = !!achievement.claimed_at;
  const isUnclaimed = !isClaimed;

  const sizeClasses = {
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4',
  };

  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div
      onClick={onClick}
      className={`
        ${sizeClasses[size]}
        ${colorClasses.bg}
        border-2 ${colorClasses.border}
        rounded-lg
        ${isUnclaimed ? 'ring-2 ring-offset-2 ring-blue-400 dark:ring-blue-500 animate-pulse' : ''}
        ${onClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''}
        flex flex-col items-center justify-center
        text-center
        relative
      `}
      title={config.description}
    >
      {isUnclaimed && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white dark:border-gray-800" />
      )}
      <Icon className={`${iconSizes[size]} ${colorClasses.text} mb-1`} />
      <div className={`text-xs font-semibold ${colorClasses.text} ${size === 'sm' ? 'text-[10px]' : ''}`}>
        {config.name}
      </div>
      {isUnclaimed && (
        <div className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5 font-medium">
          New!
        </div>
      )}
    </div>
  );
};

