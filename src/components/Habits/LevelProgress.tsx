import React from 'react';
import { useHabitStore } from '../../store/useHabitStore';

export const LevelProgress: React.FC = () => {
  const { gamification } = useHabitStore();

  if (!gamification) {
    return null;
  }

  const { points, level, pointsForNextLevel, progressToNextLevel } = gamification;
  const pointsInCurrentLevel = points - (level > 1 ? ((level - 1) * (level - 1) - 2 * (level - 1) + 1) * 100 : 0);
  const pointsNeeded = pointsForNextLevel - points;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3 gap-2">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Level {level}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400 text-right truncate font-medium">
          {pointsNeeded > 0 ? (
            <>
              <span className="hidden sm:inline">{pointsNeeded} to Level {level + 1}</span>
              <span className="sm:hidden">{pointsNeeded} to L{level + 1}</span>
            </>
          ) : (
            <span className="text-yellow-600 dark:text-yellow-400 font-semibold">Max Level!</span>
          )}
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden shadow-inner">
        <div
          className="bg-gradient-primary h-2.5 rounded-full transition-all duration-500 ease-out shadow-sm"
          style={{ width: `${Math.min(100, Math.max(0, progressToNextLevel))}%` }}
        />
      </div>
      {pointsNeeded > 0 && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center font-medium">
          <span className="hidden sm:inline">
            {pointsInCurrentLevel} / {pointsForNextLevel - (level > 1 ? ((level - 1) * (level - 1) - 2 * (level - 1) + 1) * 100 : 0)} points
          </span>
          <span className="sm:hidden">
            {pointsInCurrentLevel} / {pointsForNextLevel - (level > 1 ? ((level - 1) * (level - 1) - 2 * (level - 1) + 1) * 100 : 0)}
          </span>
        </div>
      )}
    </div>
  );
};

