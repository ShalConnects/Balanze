import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';
import { showToast } from '../lib/toast';
import { format } from 'date-fns';
import type { Habit, HabitInput, HabitCompletion, HabitStats, HabitAchievement, HabitGamification, AchievementType } from '../types/habit';

interface HabitStore {
  // State
  habits: Habit[];
  completions: HabitCompletion[];
  loading: boolean;
  error: string | null;
  
  // Gamification State
  gamification: HabitGamification | null;
  achievements: HabitAchievement[];
  unclaimedAchievements: HabitAchievement[];

  // Habit Management
  fetchHabits: () => Promise<void>;
  addHabit: (habit: HabitInput) => Promise<Habit | null>;
  updateHabit: (id: string, habit: Partial<HabitInput>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  updateHabitPositions: (updates: Array<{ id: string; position: number }>) => Promise<void>;
  getHabit: (id: string) => Habit | undefined;

  // Completion Management
  fetchCompletions: (startDate?: string, endDate?: string) => Promise<void>;
  toggleCompletion: (habitId: string, date: string) => Promise<void>;
  isCompleted: (habitId: string, date: string) => boolean;

  // Stats
  getStreak: (habitId: string) => number;
  getBestStreak: (habitId: string) => number;
  getWeeklyCompletion: (habitId: string, weekStart: Date) => number;
  getHabitStats: (habitId: string, weekStart: Date) => HabitStats;

  // Gamification
  fetchGamification: () => Promise<void>;
  fetchAchievements: () => Promise<void>;
  claimAchievement: (achievementId: string) => Promise<void>;
  calculatePoints: (isNewCompletion: boolean, streak: number, allHabitsCompletedToday: boolean) => number;
  checkAndUnlockAchievements: () => Promise<void>;

  // Utility
  clearError: () => void;
}

// Helper function to normalize dates for comparison (removes time component)
const normalizeDate = (date: Date | string): Date => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const normalized = new Date(d);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

// Helper function to compare dates (YYYY-MM-DD strings or Date objects)
const compareDates = (date1: Date | string, date2: Date | string): number => {
  const d1 = normalizeDate(date1);
  const d2 = normalizeDate(date2);
  return d1.getTime() - d2.getTime();
};

// Helper function to calculate level from points
const calculateLevel = (points: number): number => {
  return Math.max(1, Math.floor(Math.sqrt(Math.max(0, points) / 100)) + 1);
};

// Helper function to calculate points needed for next level
const pointsForNextLevel = (currentLevel: number): number => {
  return ((currentLevel * currentLevel - 2 * currentLevel + 1) * 100);
};

// Helper function to calculate progress to next level (0-100)
const progressToNextLevel = (currentPoints: number, currentLevel: number): number => {
  const pointsForCurrentLevel = currentLevel > 1 
    ? pointsForNextLevel(currentLevel - 1)
    : 0;
  const pointsForNext = pointsForNextLevel(currentLevel);
  const pointsInCurrentLevel = currentPoints - pointsForCurrentLevel;
  const pointsNeededForNext = pointsForNext - pointsForCurrentLevel;
  return Math.min(100, Math.max(0, (pointsInCurrentLevel / pointsNeededForNext) * 100));
};

export const useHabitStore = create<HabitStore>((set, get) => ({
  // Initial state
  habits: [],
  completions: [],
  loading: false,
  error: null,
  gamification: null,
  achievements: [],
  unclaimedAchievements: [],

  // Fetch all habits for the current user
  fetchHabits: async () => {
    const state = get();
    // Prevent multiple simultaneous calls
    if (state.loading) {
      return;
    }

    const user = useAuthStore.getState().user;
    if (!user) {
      set({ error: 'Not authenticated' });
      return;
    }

    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .order('position', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) {
        // Check for table not found errors
        if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          throw new Error('Habits table not found. Please run the database migration (create_habits_tables.sql).');
        }
        throw error;
      }
      set({ habits: data || [], loading: false, error: null });
    } catch (error: any) {
      console.error('Error fetching habits:', error);
      const errorMessage = error?.message || 'Failed to load habits';
      set({ habits: [], error: errorMessage, loading: false });
      showToast.error(errorMessage);
    }
  },

  // Add a new habit
  addHabit: async (habit: HabitInput) => {
    const user = useAuthStore.getState().user;
    if (!user) {
      set({ error: 'Not authenticated' });
      return null;
    }

    // Validate title
    if (!habit.title || !habit.title.trim()) {
      const errorMsg = 'Habit title is required';
      set({ error: errorMsg });
      showToast.error(errorMsg);
      return null;
    }

    set({ loading: true, error: null });
    try {
      // Get current max position - handle null positions properly
      const { habits } = get();
      const positions = habits
        .map(h => h.position)
        .filter((p): p is number => p !== null && p !== undefined);
      const maxPosition = positions.length > 0 ? Math.max(...positions) : -1;

      const { data, error } = await supabase
        .from('habits')
        .insert({
          ...habit,
          user_id: user.id,
          position: maxPosition + 1,
          color: habit.color || 'blue',
        })
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        habits: [...state.habits, data],
        loading: false,
      }));

      showToast.success('Habit added successfully');
      return data;
    } catch (error: any) {
      console.error('Error adding habit:', error);
      const errorMessage = error?.message || 'Failed to add habit';
      set({ error: errorMessage, loading: false });
      showToast.error(errorMessage);
      return null;
    }
  },

  // Update a habit
  updateHabit: async (id: string, habit: Partial<HabitInput>) => {
    // Validate title if provided
    if (habit.title !== undefined && (!habit.title || !habit.title.trim())) {
      const errorMsg = 'Habit title cannot be empty';
      set({ error: errorMsg });
      showToast.error(errorMsg);
      return;
    }

    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('habits')
        .update(habit)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Habit not found');
        }
        throw error;
      }

      if (!data) {
        throw new Error('Habit not found');
      }

      set(state => ({
        habits: state.habits.map(h => h.id === id ? data : h),
        loading: false,
      }));

      showToast.success('Habit updated successfully');
    } catch (error: any) {
      console.error('Error updating habit:', error);
      const errorMessage = error?.message || 'Failed to update habit';
      set({ error: errorMessage, loading: false });
      showToast.error(errorMessage);
    }
  },

  // Delete a habit
  deleteHabit: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        habits: state.habits.filter(h => h.id !== id),
        completions: state.completions.filter(c => c.habit_id !== id),
        loading: false,
      }));

      showToast.success('Habit deleted successfully');
    } catch (error: any) {
      console.error('Error deleting habit:', error);
      const errorMessage = error?.message || 'Failed to delete habit';
      set({ error: errorMessage, loading: false });
      showToast.error(errorMessage);
    }
  },

  // Update habit positions (for reordering)
  updateHabitPositions: async (updates: Array<{ id: string; position: number }>) => {
    if (!updates || updates.length === 0) {
      return;
    }

    try {
      // Optimistically update local state first (like useClientStore pattern)
      set(state => ({
        habits: state.habits.map(habit => {
          const update = updates.find(u => u.id === habit.id);
          return update ? { ...habit, position: update.position } : habit;
        }),
      }));

      // Update in database - check for errors
      const updateResults = await Promise.allSettled(
        updates.map(({ id, position }) =>
          supabase
            .from('habits')
            .update({ position })
            .eq('id', id)
        )
      );

      // Check if any updates failed
      const failedUpdates = updateResults.filter(result => result.status === 'rejected');
      if (failedUpdates.length > 0) {
        console.error('Some position updates failed:', failedUpdates);
        // Refresh habits to get correct state
        await get().fetchHabits();
        throw new Error('Failed to update some habit positions');
      }

      // Check for Supabase errors
      const errors = updateResults
        .map((result, index) => result.status === 'fulfilled' && result.value.error ? { index, error: result.value.error } : null)
        .filter((e): e is { index: number; error: any } => e !== null);

      if (errors.length > 0) {
        // Refresh habits to get correct state
        await get().fetchHabits();
        throw new Error('Failed to update habit positions');
      }
    } catch (error: any) {
      console.error('Error updating habit positions:', error);
      // Refresh habits to ensure consistency
      await get().fetchHabits();
      showToast.error('Failed to reorder habits');
    }
  },

  // Get a habit by ID
  getHabit: (id: string) => {
    return get().habits.find(h => h.id === id);
  },

  // Fetch completions for a date range
  // Note: This replaces all completions in state. If you need to merge, call with overlapping ranges carefully.
  // For better performance, components should fetch only the date range they need.
  fetchCompletions: async (startDate?: string, endDate?: string) => {
    const user = useAuthStore.getState().user;
    if (!user) {
      set({ error: 'Not authenticated' });
      return;
    }

    // Validate date format if provided (YYYY-MM-DD)
    if (startDate && !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      console.warn('Invalid startDate format, expected YYYY-MM-DD:', startDate);
      return;
    }
    if (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      console.warn('Invalid endDate format, expected YYYY-MM-DD:', endDate);
      return;
    }

    try {
      let query = supabase
        .from('habit_completions')
        .select('*')
        .eq('user_id', user.id);

      if (startDate) {
        query = query.gte('completion_date', startDate);
      }
      if (endDate) {
        query = query.lte('completion_date', endDate);
      }

      const { data, error } = await query.order('completion_date', { ascending: false });

      if (error) throw error;
      set({ completions: data || [], error: null });
    } catch (error: any) {
      console.error('Error fetching completions:', error);
      const errorMessage = error?.message || 'Failed to load completions';
      set({ error: errorMessage });
      showToast.error(errorMessage);
    }
  },

  // Toggle completion for a habit on a specific date
  toggleCompletion: async (habitId: string, date: string) => {
    const user = useAuthStore.getState().user;
    if (!user) {
      set({ error: 'Not authenticated' });
      return;
    }

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const errorMsg = 'Invalid date format. Expected YYYY-MM-DD';
      set({ error: errorMsg });
      showToast.error(errorMsg);
      return;
    }

    // Validate habit exists
    const habit = get().getHabit(habitId);
    if (!habit) {
      const errorMsg = 'Habit not found';
      set({ error: errorMsg });
      showToast.error(errorMsg);
      return;
    }

    const { completions } = get();
    const existingCompletion = completions.find(
      c => c.habit_id === habitId && c.completion_date === date
    );

    try {
      if (existingCompletion) {
        // Remove completion
        const { error } = await supabase
          .from('habit_completions')
          .delete()
          .eq('id', existingCompletion.id);

        if (error) throw error;

        set(state => ({
          completions: state.completions.filter(c => c.id !== existingCompletion.id),
        }));
      } else {
        // Add completion - check if it exists in DB first (in case local state is out of sync)
        const { data: existing, error: checkError } = await supabase
          .from('habit_completions')
          .select('id')
          .eq('habit_id', habitId)
          .eq('user_id', user.id)
          .eq('completion_date', date)
          .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
          throw checkError;
        }

        if (existing) {
          // Already exists in DB, add to local state
          const { data: completion, error: fetchError } = await supabase
            .from('habit_completions')
            .select('*')
            .eq('id', existing.id)
            .single();

          if (fetchError) throw fetchError;
          if (completion) {
            set(state => ({
              completions: [...state.completions, completion],
            }));
          }
        } else {
          // Insert new completion
          const { data, error } = await supabase
            .from('habit_completions')
            .insert({
              habit_id: habitId,
              user_id: user.id,
              completion_date: date,
            })
            .select()
            .single();

          if (error) throw error;

          set(state => ({
            completions: [...state.completions, data],
          }));

          // Award points and update gamification
          // Wait a bit to ensure completion is in state before calculating streak
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const { habits, gamification, completions: updatedCompletions } = get();
          const streak = get().getStreak(habitId);
          
          // Check if all habits are completed today
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const todayStr = format(today, 'yyyy-MM-dd');
          const allHabitsCompletedToday = habits.length > 0 && habits.every(h => 
            get().isCompleted(h.id, todayStr)
          );

          // Calculate points
          const pointsEarned = get().calculatePoints(true, streak, allHabitsCompletedToday);
          
          if (pointsEarned > 0) {
            // Update profile with new points
            const currentPoints = gamification?.points || 0;
            const newPoints = currentPoints + pointsEarned;
            const newLevel = calculateLevel(newPoints);
            const totalCompletions = (gamification?.totalCompletions || 0) + 1;

            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                habit_points: newPoints,
                habit_level: newLevel,
                total_habit_completions: totalCompletions,
              })
              .eq('id', user.id);

            if (!updateError) {
              // Update local state
              set({
                gamification: {
                  points: newPoints,
                  level: newLevel,
                  totalCompletions,
                  pointsForNextLevel: pointsForNextLevel(newLevel),
                  progressToNextLevel: progressToNextLevel(newPoints, newLevel),
                },
              });

              // Refresh gamification to ensure sync
              await get().fetchGamification();
              
              // Check for achievements
              await get().checkAndUnlockAchievements();
              
              // Refresh achievements to show new ones
              await get().fetchAchievements();
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Error toggling completion:', error);
      const errorMessage = error?.message || 'Failed to update completion';
      showToast.error(errorMessage);
      
      // Refresh completions to sync with DB
      // Try to determine date range from current completions or use a safe default
      const { completions: currentCompletions } = get();
      if (currentCompletions.length > 0) {
        // Sort by date to get min/max
        const sorted = [...currentCompletions].sort((a, b) => 
          a.completion_date.localeCompare(b.completion_date)
        );
        const start = sorted[0].completion_date;
        const end = sorted[sorted.length - 1].completion_date;
        // Extend range slightly to ensure we get the completion we just tried to toggle
        const dateObj = new Date(date);
        const extendedStart = new Date(dateObj);
        extendedStart.setDate(extendedStart.getDate() - 7);
        const extendedEnd = new Date(dateObj);
        extendedEnd.setDate(extendedEnd.getDate() + 7);
        
        await get().fetchCompletions(
          extendedStart.toISOString().split('T')[0],
          extendedEnd.toISOString().split('T')[0]
        );
      } else {
        // If no completions, fetch around the date we tried to toggle
        const dateObj = new Date(date);
        const start = new Date(dateObj);
        start.setDate(start.getDate() - 7);
        const end = new Date(dateObj);
        end.setDate(end.getDate() + 7);
        
        await get().fetchCompletions(
          start.toISOString().split('T')[0],
          end.toISOString().split('T')[0]
        );
      }
    }
  },

  // Check if a habit is completed on a specific date
  isCompleted: (habitId: string, date: string) => {
    const { completions } = get();
    return completions.some(
      c => c.habit_id === habitId && c.completion_date === date
    );
  },

  // Calculate current streak for a habit
  getStreak: (habitId: string) => {
    const { completions } = get();
    const habitCompletions = completions
      .filter(c => c.habit_id === habitId)
      .map(c => normalizeDate(c.completion_date))
      .sort((a, b) => b.getTime() - a.getTime()); // Most recent first

    if (habitCompletions.length === 0) return 0;

    const today = normalizeDate(new Date());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Check if today or yesterday is completed
    const todayCompleted = habitCompletions.some(
      d => d.getTime() === today.getTime()
    );
    const yesterdayCompleted = habitCompletions.some(
      d => d.getTime() === yesterday.getTime()
    );

    // If today is completed, start counting from today
    // If not but yesterday is, start from yesterday (streak continues)
    let checkDate = todayCompleted ? today : (yesterdayCompleted ? yesterday : null);
    if (!checkDate) return 0;

    // Count consecutive days backwards
    let streak = 0;
    for (const completionDate of habitCompletions) {
      if (completionDate.getTime() === checkDate.getTime()) {
        streak++;
        const nextDate = new Date(checkDate);
        nextDate.setDate(nextDate.getDate() - 1);
        checkDate = nextDate;
      } else if (completionDate.getTime() < checkDate.getTime()) {
        // We've passed the expected date, streak is broken
        break;
      }
    }

    return streak;
  },

  // Calculate best streak for a habit
  getBestStreak: (habitId: string) => {
    const { completions } = get();
    const habitCompletions = completions
      .filter(c => c.habit_id === habitId)
      .map(c => normalizeDate(c.completion_date))
      .sort((a, b) => a.getTime() - b.getTime()); // Oldest first

    if (habitCompletions.length === 0) return 0;
    if (habitCompletions.length === 1) return 1;

    let bestStreak = 1;
    let currentStreak = 1;

    for (let i = 1; i < habitCompletions.length; i++) {
      const prevDate = habitCompletions[i - 1];
      const currDate = habitCompletions[i];

      const daysDiff = Math.floor(
        (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff === 1) {
        currentStreak++;
        bestStreak = Math.max(bestStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }

    return bestStreak;
  },

  // Calculate weekly completion percentage
  getWeeklyCompletion: (habitId: string, weekStart: Date) => {
    const { completions } = get();
    const normalizedWeekStart = normalizeDate(weekStart);
    const weekEnd = new Date(normalizedWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const normalizedWeekEnd = normalizeDate(weekEnd);

    const weekCompletions = completions.filter(c => {
      if (c.habit_id !== habitId) return false;
      const date = normalizeDate(c.completion_date);
      return compareDates(date, normalizedWeekStart) >= 0 && compareDates(date, normalizedWeekEnd) <= 0;
    });

    return Math.round((weekCompletions.length / 7) * 100);
  },

  // Get comprehensive stats for a habit
  getHabitStats: (habitId: string, weekStart: Date) => {
    const { completions } = get();
    const habitCompletions = completions.filter(c => c.habit_id === habitId);

    return {
      currentStreak: get().getStreak(habitId),
      bestStreak: get().getBestStreak(habitId),
      weeklyCompletion: get().getWeeklyCompletion(habitId, weekStart),
      totalCompletions: habitCompletions.length,
    };
  },

  // Fetch gamification data (points, level)
  fetchGamification: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('habit_points, habit_level, total_habit_completions')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      const points = data?.habit_points || 0;
      const level = data?.habit_level || calculateLevel(points);
      const totalCompletions = data?.total_habit_completions || 0;

      set({
        gamification: {
          points,
          level,
          totalCompletions,
          pointsForNextLevel: pointsForNextLevel(level),
          progressToNextLevel: progressToNextLevel(points, level),
        },
      });
    } catch (error: any) {
      console.error('Error fetching gamification:', error);
      // Set defaults on error
      set({
        gamification: {
          points: 0,
          level: 1,
          totalCompletions: 0,
          pointsForNextLevel: 100,
          progressToNextLevel: 0,
        },
      });
    }
  },

  // Fetch achievements
  fetchAchievements: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('habit_achievements')
        .select('*')
        .eq('user_id', user.id)
        .order('unlocked_at', { ascending: false });

      if (error) throw error;

      const achievements = (data || []) as HabitAchievement[];
      const unclaimed = achievements.filter(a => !a.claimed_at);

      set({
        achievements,
        unclaimedAchievements: unclaimed,
      });
    } catch (error: any) {
      console.error('Error fetching achievements:', error);
      set({ achievements: [], unclaimedAchievements: [] });
    }
  },

  // Claim an achievement
  claimAchievement: async (achievementId: string) => {
    try {
      const { data, error } = await supabase
        .from('habit_achievements')
        .update({ claimed_at: new Date().toISOString() })
        .eq('id', achievementId)
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        achievements: state.achievements.map(a =>
          a.id === achievementId ? data as HabitAchievement : a
        ),
        unclaimedAchievements: state.unclaimedAchievements.filter(a => a.id !== achievementId),
      }));

      showToast.success('Achievement claimed!');
    } catch (error: any) {
      console.error('Error claiming achievement:', error);
      showToast.error('Failed to claim achievement');
    }
  },

  // Calculate points for a completion
  calculatePoints: (isNewCompletion: boolean, streak: number, allHabitsCompletedToday: boolean) => {
    if (!isNewCompletion) return 0; // No points for uncompleting

    let points = 10; // Base points per completion

    // Streak bonus (max +50 points)
    const streakBonus = Math.min(50, streak * 5);
    points += streakBonus;

    // Perfect day bonus (all habits completed)
    if (allHabitsCompletedToday) {
      points += 20;
    }

    return points;
  },

  // Check and unlock achievements
  checkAndUnlockAchievements: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const { habits, completions, gamification } = get();
    
    if (!gamification) {
      await get().fetchGamification();
      return;
    }

    const totalCompletions = completions.length;
    const points = gamification.points;
    const level = gamification.level;

    // Calculate streaks for all habits
    const streaks = habits.map(habit => get().getStreak(habit.id));
    const maxStreak = streaks.length > 0 ? Math.max(...streaks) : 0;

    // Check weekly completion
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1); // Monday
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const weekCompletions = completions.filter(c => {
      const date = new Date(c.completion_date);
      return date >= weekStart && date <= weekEnd;
    });
    const perfectWeek = habits.length > 0 && weekCompletions.length === habits.length * 7;

    // Achievement checks
    const achievementsToUnlock: AchievementType[] = [];

    // First completion
    if (totalCompletions === 1 && !get().achievements.some(a => a.achievement_type === 'first_completion')) {
      achievementsToUnlock.push('first_completion');
    }

    // Streak achievements
    if (maxStreak >= 3 && !get().achievements.some(a => a.achievement_type === 'streak_3')) {
      achievementsToUnlock.push('streak_3');
    }
    if (maxStreak >= 7 && !get().achievements.some(a => a.achievement_type === 'streak_7')) {
      achievementsToUnlock.push('streak_7');
    }
    if (maxStreak >= 14 && !get().achievements.some(a => a.achievement_type === 'streak_14')) {
      achievementsToUnlock.push('streak_14');
    }
    if (maxStreak >= 30 && !get().achievements.some(a => a.achievement_type === 'streak_30')) {
      achievementsToUnlock.push('streak_30');
    }
    if (maxStreak >= 50 && !get().achievements.some(a => a.achievement_type === 'streak_50')) {
      achievementsToUnlock.push('streak_50');
    }
    if (maxStreak >= 100 && !get().achievements.some(a => a.achievement_type === 'streak_100')) {
      achievementsToUnlock.push('streak_100');
    }

    // Completion count achievements
    if (totalCompletions >= 10 && !get().achievements.some(a => a.achievement_type === 'completions_10')) {
      achievementsToUnlock.push('completions_10');
    }
    if (totalCompletions >= 50 && !get().achievements.some(a => a.achievement_type === 'completions_50')) {
      achievementsToUnlock.push('completions_50');
    }
    if (totalCompletions >= 100 && !get().achievements.some(a => a.achievement_type === 'completions_100')) {
      achievementsToUnlock.push('completions_100');
    }
    if (totalCompletions >= 500 && !get().achievements.some(a => a.achievement_type === 'completions_500')) {
      achievementsToUnlock.push('completions_500');
    }

    // Perfect week
    if (perfectWeek && !get().achievements.some(a => a.achievement_type === 'perfect_week')) {
      achievementsToUnlock.push('perfect_week');
    }

    // Level achievements
    if (level >= 5 && !get().achievements.some(a => a.achievement_type === 'level_5')) {
      achievementsToUnlock.push('level_5');
    }
    if (level >= 10 && !get().achievements.some(a => a.achievement_type === 'level_10')) {
      achievementsToUnlock.push('level_10');
    }
    if (level >= 25 && !get().achievements.some(a => a.achievement_type === 'level_25')) {
      achievementsToUnlock.push('level_25');
    }
    if (level >= 50 && !get().achievements.some(a => a.achievement_type === 'level_50')) {
      achievementsToUnlock.push('level_50');
    }

    // Unlock achievements
    if (achievementsToUnlock.length > 0) {
      try {
        const { data, error } = await supabase
          .from('habit_achievements')
          .insert(
            achievementsToUnlock.map(type => ({
              user_id: user.id,
              achievement_type: type,
            }))
          )
          .select();

        if (error) throw error;

        const newAchievements = (data || []) as HabitAchievement[];
        set(state => ({
          achievements: [...state.achievements, ...newAchievements],
          unclaimedAchievements: [...state.unclaimedAchievements, ...newAchievements],
        }));
      } catch (error: any) {
        console.error('Error unlocking achievements:', error);
      }
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));
