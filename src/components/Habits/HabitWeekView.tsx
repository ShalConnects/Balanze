import React from 'react';
import { Check, X as XIcon, Edit2, Trash2, Plus } from 'lucide-react';
import { Habit } from '../../types/habit';
import { useHabitStore } from '../../store/useHabitStore';
import { format, startOfWeek, addDays, isToday, isSameDay } from 'date-fns';

interface HabitWeekViewProps {
  habits: Habit[];
  weekStart: Date;
  onWeekChange: (newWeekStart: Date) => void;
  onEditHabit?: (habit: Habit) => void;
  onDeleteHabit?: (habitId: string) => void;
  onAddHabit?: () => void;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const getColorClasses = (color: string, isCompleted: boolean) => {
  const colorMap = {
    yellow: {
      bg: isCompleted ? 'bg-yellow-400 dark:bg-yellow-500' : 'bg-yellow-100 dark:bg-yellow-900/30',
      border: isCompleted ? 'border-yellow-500 dark:border-yellow-400' : 'border-yellow-300 dark:border-yellow-700',
      text: 'text-yellow-900 dark:text-yellow-100',
    },
    pink: {
      bg: isCompleted ? 'bg-pink-400 dark:bg-pink-500' : 'bg-pink-100 dark:bg-pink-900/30',
      border: isCompleted ? 'border-pink-500 dark:border-pink-400' : 'border-pink-300 dark:border-pink-700',
      text: 'text-pink-900 dark:text-pink-100',
    },
    blue: {
      bg: isCompleted ? 'bg-blue-400 dark:bg-blue-500' : 'bg-blue-100 dark:bg-blue-900/30',
      border: isCompleted ? 'border-blue-500 dark:border-blue-400' : 'border-blue-300 dark:border-blue-700',
      text: 'text-blue-900 dark:text-blue-100',
    },
    green: {
      bg: isCompleted ? 'bg-green-400 dark:bg-green-500' : 'bg-green-100 dark:bg-green-900/30',
      border: isCompleted ? 'border-green-500 dark:border-green-400' : 'border-green-300 dark:border-green-700',
      text: 'text-green-900 dark:text-green-100',
    },
    orange: {
      bg: isCompleted ? 'bg-orange-400 dark:bg-orange-500' : 'bg-orange-100 dark:bg-orange-900/30',
      border: isCompleted ? 'border-orange-500 dark:border-orange-400' : 'border-orange-300 dark:border-orange-700',
      text: 'text-orange-900 dark:text-orange-100',
    },
    purple: {
      bg: isCompleted ? 'bg-purple-400 dark:bg-purple-500' : 'bg-purple-100 dark:bg-purple-900/30',
      border: isCompleted ? 'border-purple-500 dark:border-purple-400' : 'border-purple-300 dark:border-purple-700',
      text: 'text-purple-900 dark:text-purple-100',
    },
  };
  return colorMap[color as keyof typeof colorMap] || colorMap.blue;
};

export const HabitWeekView: React.FC<HabitWeekViewProps> = ({ habits, weekStart, onWeekChange, onEditHabit, onDeleteHabit, onAddHabit }) => {
  const { toggleCompletion, isCompleted, fetchCompletions } = useHabitStore();

  // Calculate week dates
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Fetch completions for the week when component mounts or week changes
  React.useEffect(() => {
    const weekEnd = addDays(weekStart, 6);
    fetchCompletions(
      format(weekStart, 'yyyy-MM-dd'),
      format(weekEnd, 'yyyy-MM-dd')
    );
  }, [weekStart, fetchCompletions]);

  const handleToggle = async (habitId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    await toggleCompletion(habitId, dateStr);
  };

  const handlePreviousWeek = () => {
    const newWeekStart = addDays(weekStart, -7);
    onWeekChange(newWeekStart);
  };

  const handleNextWeek = () => {
    const newWeekStart = addDays(weekStart, 7);
    onWeekChange(newWeekStart);
  };

  const handleToday = () => {
    const today = new Date();
    const todayWeekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    onWeekChange(todayWeekStart);
  };

  if (habits.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p>No habits yet. Create your first habit to get started!</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-3 sm:mb-4 gap-1.5 sm:gap-2">
        <button
          onClick={handlePreviousWeek}
          className="px-2 sm:px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex-shrink-0"
        >
          <span className="hidden sm:inline">← Previous</span>
          <span className="sm:hidden">←</span>
        </button>
        
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-1 justify-center min-w-0">
          <button
            onClick={handleToday}
            className="px-2 sm:px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap flex-shrink-0"
          >
            Today
          </button>
          <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white text-center truncate">
            <span className="hidden md:inline">
              {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
            </span>
            <span className="hidden sm:inline md:hidden">
              {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d')}
            </span>
            <span className="sm:hidden">
              {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'd')}
            </span>
          </h3>
        </div>

        <button
          onClick={handleNextWeek}
          className="px-2 sm:px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex-shrink-0"
        >
          <span className="hidden sm:inline">Next →</span>
          <span className="sm:hidden">→</span>
        </button>
      </div>

      {/* Week Grid */}
      <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
        <div className="min-w-[600px] sm:min-w-full">
          {/* Header Row - Days */}
          <div className="grid grid-cols-[120px_repeat(7,1fr)] sm:grid-cols-[150px_repeat(7,1fr)] lg:grid-cols-[180px_repeat(7,1fr)] gap-1 mb-1.5">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-1">
              Habit
            </div>
            {weekDates.map((date, index) => {
              const isTodayDate = isToday(date);
              return (
                <div
                  key={index}
                  className={`text-center text-[10px] font-medium px-1 py-0.5 rounded ${
                    isTodayDate
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <div className="hidden sm:block">{DAYS[index]}</div>
                  <div className="sm:hidden">{DAYS[index][0]}</div>
                  <div className="text-[9px] mt-0.5">{format(date, 'd')}</div>
                </div>
              );
            })}
          </div>

          {/* Habit Rows */}
          <div className="space-y-1">
            {/* Add Habit Row */}
            {onAddHabit && (
              <div 
                onClick={onAddHabit}
                className="grid grid-cols-[120px_repeat(7,1fr)] sm:grid-cols-[150px_repeat(7,1fr)] lg:grid-cols-[180px_repeat(7,1fr)] gap-1 items-center p-1 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
              >
                <div className="px-1">
                  <div className="w-full flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                    <Plus className="w-3 h-3" />
                    <span>Add Habit</span>
                  </div>
                </div>
                {weekDates.map((_, dayIndex) => (
                  <div key={dayIndex} className="flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full border-2 border-gray-300 dark:border-gray-600 opacity-30" />
                  </div>
                ))}
              </div>
            )}
            
            {habits.map((habit) => {
              const colorClasses = getColorClasses(habit.color, false);
              return (
                <div
                  key={habit.id}
                  className={`grid grid-cols-[120px_repeat(7,1fr)] sm:grid-cols-[150px_repeat(7,1fr)] lg:grid-cols-[180px_repeat(7,1fr)] gap-1 items-center p-1 rounded-lg border ${colorClasses.border} ${colorClasses.bg} transition-all hover:shadow-sm`}
                >
                  {/* Habit Name with Actions */}
                  <div className="px-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs font-medium truncate ${colorClasses.text}`}>
                          {habit.title}
                        </div>
                        {habit.description && (
                          <div className="hidden sm:block text-[10px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                            {habit.description}
                          </div>
                        )}
                      </div>
                      {(onEditHabit || onDeleteHabit) && (
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          {onEditHabit && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditHabit(habit);
                              }}
                              className="p-0.5 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                              title="Edit habit"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          )}
                          {onDeleteHabit && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteHabit(habit.id);
                              }}
                              className="p-0.5 text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                              title="Delete habit"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Day Checkboxes */}
                  {weekDates.map((date, dayIndex) => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const completed = isCompleted(habit.id, dateStr);
                    const isTodayDate = isToday(date);
                    const dayColorClasses = getColorClasses(habit.color, completed);

                    return (
                      <button
                        key={dayIndex}
                        onClick={() => handleToggle(habit.id, date)}
                        className={`
                          w-full aspect-square max-w-[32px] sm:max-w-[36px] mx-auto
                          rounded-lg border-2 transition-all
                          flex items-center justify-center
                          ${completed ? dayColorClasses.bg : 'bg-transparent'}
                          ${dayColorClasses.border}
                          ${isTodayDate ? 'ring-2 ring-blue-400 dark:ring-blue-500' : ''}
                          hover:scale-105 active:scale-95
                          ${completed ? 'hover:opacity-80' : 'hover:bg-opacity-50'}
                        `}
                        title={`${format(date, 'MMM d, yyyy')} - ${completed ? 'Mark as incomplete' : 'Mark as complete'}`}
                      >
                        {completed ? (
                          <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white dark:text-gray-900" />
                        ) : (
                          <div className="w-2 h-2 rounded-full border-2 border-current opacity-30" />
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

