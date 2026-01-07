import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Sprout } from 'lucide-react';
import { useHabitStore } from '../../store/useHabitStore';
import { HabitForm } from './HabitForm';
import { HabitWeekView } from './HabitWeekView';
import { HabitStatsTable } from './HabitStatsTable';
import { Loader } from '../common/Loader';
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';
import { PointsDisplay } from './PointsDisplay';
import { LevelProgress } from './LevelProgress';
import { HabitStatsDashboard } from './HabitStatsDashboard';
import { AchievementModal } from './AchievementModal';
import { CelebrationAnimation } from './CelebrationAnimation';
import { GardenPlant } from './GardenPlant';
import { startOfWeek } from 'date-fns';
import { useAuthStore } from '../../store/authStore';

export const HabitGarden: React.FC = () => {
  const { user } = useAuthStore();
  const {
    habits,
    loading,
    fetchHabits,
    deleteHabit,
    fetchCompletions,
    fetchGamification,
    fetchAchievements,
    unclaimedAchievements,
  } = useHabitStore();

  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<any>(null);
  const [deletingHabitId, setDeletingHabitId] = useState<string | null>(null);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState('');
  const [viewMode, setViewMode] = useState<'week' | 'garden' | 'stats'>('week');
  const [weekStart, setWeekStart] = useState(() => {
    const today = new Date();
    return startOfWeek(today, { weekStartsOn: 1 }); // Monday
  });

  useEffect(() => {
    if (user) {
      fetchHabits();
      fetchGamification();
      fetchAchievements();
      // Fetch completions for current week
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      fetchCompletions(
        weekStart.toISOString().split('T')[0],
        weekEnd.toISOString().split('T')[0]
      );
    }
  }, [user, fetchHabits, fetchCompletions, fetchGamification, fetchAchievements, weekStart]);

  // Show celebration when new achievements are unlocked
  useEffect(() => {
    if (unclaimedAchievements.length > 0) {
      setCelebrationMessage(`${unclaimedAchievements.length} New Achievement${unclaimedAchievements.length !== 1 ? 's' : ''} Unlocked!`);
      setShowCelebration(true);
    }
  }, [unclaimedAchievements.length]);

  const handleAddHabit = () => {
    setEditingHabit(null);
    setShowForm(true);
  };

  const handleEditHabit = (habit: any) => {
    setEditingHabit(habit);
    setShowForm(true);
  };

  const handleDeleteHabit = async () => {
    if (deletingHabitId) {
      await deleteHabit(deletingHabitId);
      setDeletingHabitId(null);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingHabit(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Loader isLoading={loading} message="Loading habits..." />

      {/* Main Content */}
      {habits.length === 0 ? (
        <div className="text-center py-6 sm:py-8 md:py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-3 sm:px-4">
          <Sprout className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-gray-400 dark:text-gray-500 mx-auto mb-2 sm:mb-3 md:mb-4" />
          <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-1.5 sm:mb-2">
            No habits yet
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 md:mb-6 px-2">
            Create your first habit to start tracking your progress
          </p>
          <button
            onClick={handleAddHabit}
            className="px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 bg-gradient-primary hover:bg-gradient-primary-hover text-white rounded-lg font-medium flex items-center gap-1.5 sm:gap-2 mx-auto transition-colors text-xs sm:text-sm md:text-base"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">Create Your First Habit</span>
            <span className="sm:hidden">Create Habit</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Stats Sidebar - Hidden on mobile, shown on desktop */}
          <div className="hidden lg:block">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 pt-4 pb-4 px-4 space-y-4">
              <HabitStatsDashboard onShowAchievements={() => setShowAchievements(true)} />
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Tab System */}
            {habits.length > 0 && (
              <div className="mb-0">
                {/* Tab Navigation */}
                <div className="bg-white dark:bg-gray-800 rounded-t-xl border border-gray-200 dark:border-gray-700 border-b-0 shadow-sm overflow-x-auto">
                  <div className="border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-0.5 sm:gap-1 min-w-max">
                      <button
                        onClick={() => setViewMode('week')}
                        className={`px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base font-medium transition-all relative whitespace-nowrap ${
                          viewMode === 'week'
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                      >
                        Week View
                        {viewMode === 'week' && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                        )}
                      </button>
                      <button
                        onClick={() => setViewMode('garden')}
                        className={`px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base font-medium transition-all relative whitespace-nowrap ${
                          viewMode === 'garden'
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                      >
                        Garden View
                        {viewMode === 'garden' && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                        )}
                      </button>
                      <button
                        onClick={() => setViewMode('stats')}
                        className={`px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base font-medium transition-all relative whitespace-nowrap ${
                          viewMode === 'stats'
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                      >
                        Habit Stats
                        {viewMode === 'stats' && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Week View Tab Panel */}
            <div
              className={`transition-all duration-300 ${
                viewMode === 'week' ? 'block' : 'hidden'
              }`}
            >
              <div className="bg-white dark:bg-gray-800 rounded-b-xl border border-gray-200 dark:border-gray-700 border-t-0 shadow-sm">
                <div className="p-2 sm:p-4 md:p-6">
                  {/* Week View */}
                  <HabitWeekView
                    habits={habits}
                    weekStart={weekStart}
                    onWeekChange={setWeekStart}
                    onEditHabit={handleEditHabit}
                    onDeleteHabit={setDeletingHabitId}
                    onAddHabit={handleAddHabit}
                  />
                </div>
              </div>
            </div>

            {/* Garden View Tab Panel */}
            <div
              className={`transition-all duration-300 ${
                viewMode === 'garden' ? 'block' : 'hidden'
              }`}
            >
              <div className="bg-white dark:bg-gray-800 rounded-b-xl border border-gray-200 dark:border-gray-700 border-t-0 shadow-sm">
                <div className="p-2 sm:p-4 md:p-6">
                  <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 md:mb-6">
                    Your Garden
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
                    {habits.map((habit) => (
                      <GardenPlant key={habit.id} habit={habit} size="md" />
                    ))}
                  </div>
                  <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
                    <LevelProgress />
                  </div>
                </div>
              </div>
            </div>

            {/* Habit Stats Tab Panel */}
            <div
              className={`transition-all duration-300 ${
                viewMode === 'stats' ? 'block' : 'hidden'
              }`}
            >
              <div className="bg-white dark:bg-gray-800 rounded-b-xl border border-gray-200 dark:border-gray-700 border-t-0 shadow-sm">
                <div className="p-2 sm:p-4 md:p-6">
                  <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 md:mb-6">
                    Habit Statistics
                  </h3>
                  <HabitStatsTable habits={habits} weekStart={weekStart} />
                </div>
              </div>
            </div>

            {/* Mobile Stats - Shown only on mobile */}
            <div className="lg:hidden mt-4 sm:mt-6 space-y-4">
              <HabitStatsDashboard onShowAchievements={() => setShowAchievements(true)} />
            </div>
          </div>
        </div>
      )}

      {/* Habit Form Modal */}
      {showForm && (
        <HabitForm
          isOpen={showForm}
          onClose={handleCloseForm}
          habit={editingHabit}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingHabitId && (() => {
        const habitToDelete = habits.find(h => h.id === deletingHabitId);
        return (
          <DeleteConfirmationModal
            isOpen={!!deletingHabitId}
            onClose={() => setDeletingHabitId(null)}
            onConfirm={handleDeleteHabit}
            title="Delete Habit"
            message={
              <>
                Are you sure you want to delete <strong>"{habitToDelete?.title || 'this habit'}"</strong>? This will also delete all completion records for this habit.
              </>
            }
          />
        );
      })()}

      {/* Achievement Modal */}
      <AchievementModal
        isOpen={showAchievements}
        onClose={() => setShowAchievements(false)}
      />

      {/* Celebration Animation */}
      <CelebrationAnimation
        show={showCelebration}
        message={celebrationMessage}
        onComplete={() => setShowCelebration(false)}
      />
    </div>
  );
};

