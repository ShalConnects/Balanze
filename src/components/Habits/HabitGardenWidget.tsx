import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Check, ArrowRight, Flame, ChevronUp, ChevronDown } from 'lucide-react';
import { useHabitStore } from '../../store/useHabitStore';
import { useAuthStore } from '../../store/authStore';
import { HabitForm } from './HabitForm';
import { useNavigate } from 'react-router-dom';
import { format, subDays } from 'date-fns';
import { HABIT_FORMATION_DAYS } from '../../utils/habitPsychology';
import {
  DASHBOARD_WIDGET_ACCORDION_BTN,
  DASHBOARD_WIDGET_BADGE,
  DASHBOARD_WIDGET_CONTENT,
  DASHBOARD_WIDGET_HEADER,
  DASHBOARD_WIDGET_HEADER_BORDER,
  DASHBOARD_WIDGET_ROW,
  DASHBOARD_WIDGET_SHELL,
  DASHBOARD_WIDGET_TITLE,
  DASHBOARD_WIDGET_VIEW_ALL,
} from '../../constants/dashboardWidget';

interface HabitGardenWidgetProps {
  isAccordionExpanded?: boolean;
  onAccordionToggle?: () => void;
}

export const HabitGardenWidget: React.FC<HabitGardenWidgetProps> = ({
  isAccordionExpanded = true,
  onAccordionToggle,
}) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { habits, fetchHabits, toggleCompletion, isCompleted, getStreak, fetchCompletions } =
    useHabitStore();

  const [showForm, setShowForm] = useState(false);
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    if (!user) return;
    fetchHabits();
    fetchCompletions(format(subDays(new Date(), HABIT_FORMATION_DAYS - 1), 'yyyy-MM-dd'), todayStr);
  }, [user, fetchHabits, fetchCompletions, todayStr]);

  const handleViewAll = () => navigate('/personal-growth?tab=habits');

  const { completedCount, displayHabits } = useMemo(() => {
    const completed = habits.filter((h) => isCompleted(h.id, todayStr)).length;
    return { completedCount: completed, displayHabits: habits.slice(0, 4) };
  }, [habits, isCompleted, todayStr]);

  const accordionBtn = onAccordionToggle && (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onAccordionToggle();
      }}
      className={DASHBOARD_WIDGET_ACCORDION_BTN}
      title={isAccordionExpanded ? 'Collapse' : 'Expand'}
      aria-label={isAccordionExpanded ? 'Collapse widget' : 'Expand widget'}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {isAccordionExpanded ? (
        <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
      ) : (
        <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
      )}
    </button>
  );

  if (habits.length === 0) {
    return (
      <div className={DASHBOARD_WIDGET_SHELL}>
        {accordionBtn}
        <div className={DASHBOARD_WIDGET_HEADER}>
          <h3 className={DASHBOARD_WIDGET_TITLE}>Habit Garden</h3>
        </div>
        {isAccordionExpanded && (
          <div className={`${DASHBOARD_WIDGET_CONTENT} text-center py-4`}>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Start building your daily habits</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-3 py-1.5 bg-gradient-primary hover:bg-gradient-primary-hover text-white rounded-lg text-xs font-medium inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Habit
            </button>
          </div>
        )}
        {showForm && <HabitForm isOpen={showForm} onClose={() => setShowForm(false)} />}
      </div>
    );
  }

  return (
    <div className={DASHBOARD_WIDGET_SHELL}>
      {accordionBtn}
      <div
        className={`${DASHBOARD_WIDGET_HEADER} ${
          isAccordionExpanded ? DASHBOARD_WIDGET_HEADER_BORDER : ''
        }`}
      >
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <h3 className={DASHBOARD_WIDGET_TITLE}>Habit Garden</h3>
          <span
            className={`${DASHBOARD_WIDGET_BADGE} ${
              completedCount === habits.length
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
            }`}
          >
            {completedCount}/{habits.length} done
          </span>
        </div>
        <button type="button" onClick={handleViewAll} className={DASHBOARD_WIDGET_VIEW_ALL}>
          <span>View All</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {isAccordionExpanded && (
        <div className={DASHBOARD_WIDGET_CONTENT}>
          {displayHabits.map((habit) => {
            const completed = isCompleted(habit.id, todayStr);
            const streak = getStreak(habit.id);
            return (
              <div key={habit.id} className={DASHBOARD_WIDGET_ROW}>
                <button
                  type="button"
                  onClick={() => toggleCompletion(habit.id, todayStr)}
                  className={`mt-1.5 flex-shrink-0 w-4 h-4 rounded-full border flex items-center justify-center touch-manipulation ${
                    completed
                      ? 'border-green-500 bg-green-500 text-white'
                      : 'border-gray-300 dark:border-gray-600 text-gray-400 hover:border-green-500 hover:text-green-600'
                  }`}
                  title={completed ? 'Mark incomplete' : 'Mark complete'}
                  aria-label={`Toggle ${habit.title}`}
                >
                  {completed && <Check className="w-2.5 h-2.5" />}
                </button>
                <button
                  type="button"
                  onClick={handleViewAll}
                  className="flex-1 min-w-0 py-1.5 pr-1 text-left touch-manipulation"
                >
                  <p
                    className={`text-xs sm:text-sm font-medium truncate leading-snug ${
                      completed
                        ? 'line-through text-gray-400 dark:text-gray-500'
                        : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {habit.title}
                  </p>
                  {streak > 0 && (
                    <p className="mt-0.5 flex items-center gap-1 text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400">
                      <Flame className="w-3 h-3 text-orange-500" />
                      {streak}d streak
                    </p>
                  )}
                </button>
              </div>
            );
          })}
          {habits.length > 4 && (
            <button
              type="button"
              onClick={handleViewAll}
              className="py-1.5 text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 font-medium"
            >
              +{habits.length - 4} more habits
            </button>
          )}
        </div>
      )}

      {showForm && <HabitForm isOpen={showForm} onClose={() => setShowForm(false)} />}
    </div>
  );
};
