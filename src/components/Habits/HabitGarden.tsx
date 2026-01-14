import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Sprout } from 'lucide-react';
import { useHabitStore } from '../../store/useHabitStore';
import { Habit } from '../../types/habit';
import { HabitForm } from './HabitForm';
import { HabitWeekView } from './HabitWeekView';
import { HabitStatsTable } from './HabitStatsTable';
import { Loader } from '../common/Loader';
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';
import { PointsDisplay } from './PointsDisplay';
import { HabitStatsDashboard } from './HabitStatsDashboard';
import { AchievementModal } from './AchievementModal';
import { CelebrationAnimation } from './CelebrationAnimation';
import { GardenPlant } from './GardenPlant';
import { startOfWeek, addDays, format, subDays } from 'date-fns';
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
    getStreak,
  } = useHabitStore();

  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
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
      // Note: Completions are fetched by HabitWeekView when weekStart changes
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, weekStart]);

  // Fetch wider date range for garden view and stats view to ensure accurate streak calculations
  useEffect(() => {
    if (user && (viewMode === 'garden' || viewMode === 'stats')) {
      // Fetch last 60 days of completions for accurate streak calculation
      // Streaks can span multiple weeks, and best streak needs full history
      const today = new Date();
      const sixtyDaysAgo = subDays(today, 60);
      fetchCompletions(
        format(sixtyDaysAgo, 'yyyy-MM-dd'),
        format(today, 'yyyy-MM-dd')
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, viewMode]);

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
      try {
        await deleteHabit(deletingHabitId);
        setDeletingHabitId(null);
      } catch (error) {
        // Error is already handled by the store (shows toast)
        // Just close the modal
        setDeletingHabitId(null);
      }
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingHabit(null);
  };

  return (
    <div className="min-h-screen">
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
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Stats Sidebar - Hidden on mobile, shown on desktop */}
            <div className="hidden lg:block">
              <HabitStatsDashboard onShowAchievements={() => setShowAchievements(true)} />
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2 border border-gray-200 dark:border-gray-700 rounded-xl">
            {/* Tab System */}
            {habits.length > 0 && (
              <div>
                {/* Tab Navigation */}
                <div className="rounded-t-xl overflow-x-auto">
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

            {/* Week View Tab Panel */}
            <div
              className={`transition-all duration-300 ${
                viewMode === 'week' ? 'block' : 'hidden'
              }`}
            >
              <div className="rounded-b-xl">
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
              <div className="rounded-b-xl">
                <div className="p-2 sm:p-4 md:p-6">
                  <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 md:mb-6">
                    Your Garden
                  </h3>
                  {(() => {
                    // Sort habits by streak (highest first)
                    const sortedHabits = [...habits].sort((a, b) => {
                      const streakA = getStreak(a.id);
                      const streakB = getStreak(b.id);
                      return streakB - streakA; // Descending order (highest streak first)
                    });
                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
                        {sortedHabits.map((habit) => (
                          <GardenPlant key={habit.id} habit={habit} size="md" />
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Habit Stats Tab Panel */}
            <div
              className={`transition-all duration-300 ${
                viewMode === 'stats' ? 'block' : 'hidden'
              }`}
            >
              <div className="rounded-b-xl">
                <div className="p-2 sm:p-4 md:p-6">
                  <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 md:mb-6">
                    Habit Statistics
                  </h3>
                  <HabitStatsTable habits={habits} weekStart={weekStart} />
                </div>
              </div>
            </div>
              </div>
            )}

            {/* Mobile Stats - Shown only on mobile */}
            <div className="lg:hidden mt-4 sm:mt-6 space-y-4">
              <HabitStatsDashboard onShowAchievements={() => setShowAchievements(true)} />
            </div>
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

