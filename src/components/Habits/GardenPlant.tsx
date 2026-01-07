import React from 'react';
import { Sprout, Flower2, TreePine, Leaf } from 'lucide-react';
import { Habit } from '../../types/habit';
import { useHabitStore } from '../../store/useHabitStore';

interface GardenPlantProps {
  habit: Habit;
  size?: 'sm' | 'md' | 'lg';
}

// Plant growth stages based on streak
const getPlantStage = (streak: number) => {
  if (streak === 0) return 'seed';
  if (streak < 3) return 'sprout';
  if (streak < 7) return 'small';
  if (streak < 14) return 'medium';
  if (streak < 30) return 'large';
  return 'mature';
};

const getColorClasses = (color: string) => {
  const colorMap = {
    yellow: 'text-yellow-500 dark:text-yellow-400',
    pink: 'text-pink-500 dark:text-pink-400',
    blue: 'text-blue-500 dark:text-blue-400',
    green: 'text-green-500 dark:text-green-400',
    orange: 'text-orange-500 dark:text-orange-400',
    purple: 'text-purple-500 dark:text-purple-400',
  };
  return colorMap[color as keyof typeof colorMap] || 'text-blue-500';
};

export const GardenPlant: React.FC<GardenPlantProps> = ({ habit, size = 'md' }) => {
  const { getStreak } = useHabitStore();
  const streak = getStreak(habit.id);
  const stage = getPlantStage(streak);
  const colorClasses = getColorClasses(habit.color);

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

  const renderPlant = () => {
    switch (stage) {
      case 'seed':
        return <div className={`${sizeClasses[size]} rounded-full border-2 ${colorClasses.replace('text-', 'border-')} bg-gray-100 dark:bg-gray-800`} />;
      case 'sprout':
        return <Sprout className={`${sizeClasses[size]} ${colorClasses}`} />;
      case 'small':
        return <Leaf className={`${sizeClasses[size]} ${colorClasses}`} />;
      case 'medium':
        return <Flower2 className={`${sizeClasses[size]} ${colorClasses}`} />;
      case 'large':
      case 'mature':
        return <TreePine className={`${sizeClasses[size]} ${colorClasses}`} />;
      default:
        return <Sprout className={`${sizeClasses[size]} ${colorClasses}`} />;
    }
  };

  return (
    <div className="flex flex-col items-center gap-1 sm:gap-1.5">
      <div className="relative">
        {renderPlant()}
        {streak > 0 && (
          <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-orange-500 text-white text-[9px] sm:text-[10px] font-bold px-0.5 sm:px-1 rounded-full min-w-[16px] sm:min-w-[18px] text-center">
            {streak}
          </div>
        )}
      </div>
      <div className="text-[10px] sm:text-xs font-medium text-gray-700 dark:text-gray-300 truncate max-w-[70px] sm:max-w-[80px] text-center">
        {habit.title}
      </div>
    </div>
  );
};

