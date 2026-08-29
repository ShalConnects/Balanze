import React from 'react';
import { HABIT_FORMATION_DAYS, automaticityLabel } from '../../utils/habitPsychology';

export const AutomaticityMeter: React.FC<{ practiceDays: number; className?: string }> = ({
  practiceDays,
  className = '',
}) => {
  const pct = Math.min(100, Math.round((practiceDays / HABIT_FORMATION_DAYS) * 100));
  return (
    <div className={className}>
      <div className="h-1 rounded-full bg-gray-200 dark:bg-gray-700">
        <div className="h-1 rounded-full bg-gradient-primary transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-0.5 text-[9px] leading-tight text-gray-500 dark:text-gray-400 truncate">
        {practiceDays}/{HABIT_FORMATION_DAYS} · {automaticityLabel(practiceDays)}
      </p>
    </div>
  );
};
