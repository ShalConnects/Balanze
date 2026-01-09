import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle, Sprout } from 'lucide-react';
import { useHabitStore } from '../../store/useHabitStore';
import { Habit, HabitInput, HabitColor } from '../../types/habit';
import { Loader } from '../common/Loader';

interface HabitFormProps {
  isOpen: boolean;
  onClose: () => void;
  habit?: Habit | null;
}

const HABIT_COLORS: HabitColor[] = ['yellow', 'pink', 'blue', 'green', 'orange', 'purple'];

const colorOptions = [
  { label: 'Yellow', value: 'yellow' },
  { label: 'Pink', value: 'pink' },
  { label: 'Blue', value: 'blue' },
  { label: 'Green', value: 'green' },
  { label: 'Orange', value: 'orange' },
  { label: 'Purple', value: 'purple' },
];

export const HabitForm: React.FC<HabitFormProps> = ({ isOpen, onClose, habit }) => {
  const { addHabit, updateHabit, loading, error } = useHabitStore();
  const [formData, setFormData] = useState<HabitInput>({
    title: '',
    description: '',
    color: 'blue',
    icon: undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [formSubmitted, setFormSubmitted] = useState(false);

  useEffect(() => {
    if (habit) {
      setFormData({
        title: habit.title,
        description: habit.description || '',
        color: habit.color,
        icon: habit.icon,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        color: 'blue',
        icon: undefined,
      });
    }
    setErrors({});
    setTouched({});
    setFormSubmitted(false);
  }, [habit, isOpen]);

  const handleFieldChange = (field: keyof HabitInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleBlur = (field: keyof HabitInput) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const getInputClasses = (field: keyof HabitInput) => {
    const baseClasses = 'w-full px-3 py-1.5 text-sm h-9 rounded-lg border transition-colors duration-200 bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600';
    const errorClasses = errors[field] && (touched[field] || formSubmitted) ? 'border-red-500 focus:ring-red-500' : '';
    return `${baseClasses} ${errorClasses}`;
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);

    if (!validate()) {
      return;
    }

    try {
      if (habit) {
        await updateHabit(habit.id, formData);
      } else {
        await addHabit(formData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving habit:', error);
    }
  };

  if (!isOpen) return null;

  const getColorPreview = (color: HabitColor) => {
    const colorMap = {
      yellow: 'bg-yellow-400',
      pink: 'bg-pink-400',
      blue: 'bg-blue-400',
      green: 'bg-green-400',
      orange: 'bg-orange-400',
      purple: 'bg-purple-400',
    };
    return colorMap[color];
  };

  return (
    <>
      <Loader isLoading={loading} message={habit ? 'Updating habit...' : 'Creating habit...'} />
      
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4" onClick={onClose}>
        <div 
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg mx-auto max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 rounded-t-xl p-2.5 sm:p-3 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <Sprout className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
              <h2 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate">
                {habit ? 'Edit Habit' : 'Create Habit'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg p-1 transition-colors flex-shrink-0"
              disabled={loading}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-3 sm:p-4">
            {/* Error Banner */}
            {error && (
              <div className="mb-2.5 sm:mb-3 p-2 sm:p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-1.5 sm:gap-2">
                <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-red-800 dark:text-red-200 break-words">{error}</p>
                </div>
              </div>
            )}

            <div className="space-y-2.5 sm:space-y-3">
              {/* Title and Color Selector - Same Row */}
              <div className="grid grid-cols-[1fr_auto] gap-2 sm:gap-3 items-start">
                {/* Title */}
                <div className="relative min-h-[3rem]">
                  <input
                    id="habit-title"
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleFieldChange('title', e.target.value)}
                    onBlur={() => handleBlur('title')}
                    className={getInputClasses('title')}
                    placeholder="Habit name *"
                    disabled={loading}
                  />
                  {errors.title && (touched.title || formSubmitted) && (
                    <span className="text-xs text-red-600 dark:text-red-400 absolute left-0 top-full mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      {errors.title}
                    </span>
                  )}
                </div>

                {/* Color Selector */}
                <div className="relative flex items-center gap-1 sm:gap-2 flex-wrap">
                  {HABIT_COLORS.map((color) => {
                    const colorMap = {
                      yellow: 'bg-yellow-400',
                      pink: 'bg-pink-400',
                      blue: 'bg-blue-400',
                      green: 'bg-green-400',
                      orange: 'bg-orange-400',
                      purple: 'bg-purple-400',
                    };
                    const isSelected = formData.color === color;
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => handleFieldChange('color', color)}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg ${colorMap[color]} border-2 transition-all flex-shrink-0 ${
                          isSelected
                            ? 'border-gray-900 dark:border-gray-100 scale-110'
                            : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                        }`}
                        disabled={loading}
                        title={color.charAt(0).toUpperCase() + color.slice(1)}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Description - Full Width */}
              <div className="relative">
                <textarea
                  id="habit-description"
                  value={formData.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  onBlur={() => handleBlur('description')}
                  className={`${getInputClasses('description')} min-h-[80px] resize-none`}
                  placeholder="Description (optional)"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-2 mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-gradient-primary hover:bg-gradient-primary-hover rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {habit ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  habit ? 'Update Habit' : 'Create Habit'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

