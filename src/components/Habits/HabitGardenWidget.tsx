import React, { useState, useEffect } from 'react';
import { Sprout, Plus, Check, ArrowRight, Flame, ChevronUp, ChevronDown } from 'lucide-react';
import { useHabitStore } from '../../store/useHabitStore';
import { useAuthStore } from '../../store/authStore';
import { HabitForm } from './HabitForm';
import { useNavigate } from 'react-router-dom';
import { format, isToday, startOfWeek } from 'date-fns';

interface HabitGardenWidgetProps {
  isAccordionExpanded?: boolean;
  onAccordionToggle?: () => void;
}

export const HabitGardenWidget: React.FC<HabitGardenWidgetProps> = ({
  isAccordionExpanded = true,
  onAccordionToggle
}) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const {
    habits,
    loading,
    fetchHabits,
    toggleCompletion,
    isCompleted,
    getStreak,
    fetchCompletions,
  } = useHabitStore();

  const [showForm, setShowForm] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  useEffect(() => {
    if (user) {
      fetchHabits();
      // Fetch today's completions
      fetchCompletions(todayStr, todayStr);
    }
  }, [user, fetchHabits, fetchCompletions, todayStr]);

  const handleToggle = async (habitId: string) => {
    await toggleCompletion(habitId, todayStr);
  };

  const handleViewAll = () => {
    navigate('/personal-growth?tab=habits');
  };

  // Show only first 3-4 habits in widget
  const displayHabits = habits.slice(0, 4);

  if (habits.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 relative group">
        {/* Toggle Button - positioned like drag handle on left side */}
        {onAccordionToggle && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAccordionToggle();
            }}
            className="absolute top-2 left-2 z-10 p-1.5 rounded-lg bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100 touch-manipulation transition-opacity"
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
        )}
        <div className={`flex items-center justify-between ${isAccordionExpanded ? 'mb-3' : ''}`}>
          <div className="flex items-center gap-2">
            <Sprout className="w-5 h-5 text-green-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Habit Garden</h3>
          </div>
        </div>
        {isAccordionExpanded && (
          <div className="text-center py-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Start building your daily habits
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-gradient-primary hover:bg-gradient-primary-hover text-white rounded-lg text-sm font-medium flex items-center gap-2 mx-auto transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Habit
            </button>
          </div>
        )}

        {showForm && (
          <HabitForm isOpen={showForm} onClose={() => setShowForm(false)} />
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 relative group">
      {/* Toggle Button - positioned like drag handle on left side */}
      {onAccordionToggle && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAccordionToggle();
          }}
          className="absolute top-2 left-2 z-10 p-1.5 rounded-lg bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100 touch-manipulation transition-opacity"
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
      )}
      <div className={`flex items-center justify-between ${isAccordionExpanded ? 'mb-3' : ''}`}>
        <div className="flex items-center gap-2">
          <Sprout className="w-5 h-5 text-green-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Habit Garden</h3>
        </div>
        <button
          onClick={handleViewAll}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          View All
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Content - Only show when expanded */}
      {isAccordionExpanded && (
        <>
      <div className="space-y-2">
        {displayHabits.map((habit) => {
          const completed = isCompleted(habit.id, todayStr);
          const streak = getStreak(habit.id);
          const colorClasses = {
            yellow: completed ? 'bg-yellow-400 dark:bg-yellow-500' : 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700',
            pink: completed ? 'bg-pink-400 dark:bg-pink-500' : 'bg-pink-100 dark:bg-pink-900/30 border-pink-300 dark:border-pink-700',
            blue: completed ? 'bg-blue-400 dark:bg-blue-500' : 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700',
            green: completed ? 'bg-green-400 dark:bg-green-500' : 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700',
            orange: completed ? 'bg-orange-400 dark:bg-orange-500' : 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700',
            purple: completed ? 'bg-purple-400 dark:bg-purple-500' : 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700',
          }[habit.color] || 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700';

          return (
            <div
              key={habit.id}
              className={`flex items-center justify-between p-2 rounded-lg border ${colorClasses} transition-all hover:shadow-sm`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <button
                  onClick={() => handleToggle(habit.id)}
                  className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                    completed
                      ? 'bg-white dark:bg-gray-800 border-white dark:border-gray-800'
                      : 'border-gray-300 dark:border-gray-600 bg-transparent'
                  }`}
                >
                  {completed && <Check className="w-4 h-4 text-gray-900 dark:text-white" />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {habit.title}
                  </div>
                  {streak > 0 && (
                    <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                      <Flame className="w-3 h-3 text-orange-500" />
                      <span>{streak} day{streak !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {habits.length > 4 && (
        <button
          onClick={handleViewAll}
          className="w-full mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline text-center"
        >
          +{habits.length - 4} more habits
        </button>
      )}
        </>
      )}

      {showForm && (
        <HabitForm isOpen={showForm} onClose={() => setShowForm(false)} />
      )}
    </div>
  );
};

