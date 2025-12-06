// Achievement Store (Zustand)
// Manages achievement state and integrates with existing user actions

import { create } from 'zustand';
import { 
  Achievement, 
  UserAchievement, 
  AchievementProgress, 
  UserAchievementSummary,
  AchievementStore,
  AchievementAction,
  AchievementNotification
} from '../types/achievement';
import { achievementService } from '../lib/achievementService';
import { useAuthStore } from './authStore';
import { supabase } from '../lib/supabase';

export const useAchievementStore = create<AchievementStore>((set, get) => ({
  achievements: [],
  userAchievements: [],
  achievementProgress: [],
  summary: null,
  loading: false,
  error: null,
  showAchievementNotification: false,
  currentNotification: null,

  // Fetch all available achievements
  fetchAchievements: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true });

      if (error) throw error;
      set({ achievements: data || [], loading: false });
    } catch (error: any) {
      console.error('Error fetching achievements:', error);
      set({ error: error.message, loading: false });
    }
  },

  // Fetch user's earned achievements
  fetchUserAchievements: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const achievements = await achievementService.getUserAchievements(userId);
      set({ userAchievements: achievements, loading: false });
    } catch (error: any) {
      console.error('Error fetching user achievements:', error);
      set({ error: error.message, loading: false });
    }
  },

  // Fetch user's achievement progress
  fetchAchievementProgress: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const progress = await achievementService.getAchievementProgress(userId);
      set({ achievementProgress: progress, loading: false });
    } catch (error: any) {
      console.error('Error fetching achievement progress:', error);
      set({ error: error.message, loading: false });
    }
  },

  // Fetch user's achievement summary
  fetchAchievementSummary: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const summary = await achievementService.getAchievementSummary(userId);
      set({ summary, loading: false });
    } catch (error: any) {
      console.error('Error fetching achievement summary:', error);
      set({ error: error.message, loading: false });
    }
  },

  // Check and award achievements based on user action
  checkAndAwardAchievements: async (action: AchievementAction, data?: any) => {
    const { user } = useAuthStore.getState();
    if (!user) return;

    try {
      const result = await achievementService.checkAchievements(user.id, action, data);
      
      // Update local state with new achievements
      if (result.earned.length > 0) {
        const { userAchievements } = get();
        set({ 
          userAchievements: [...userAchievements, ...result.earned],
          showAchievementNotification: true,
          currentNotification: result.notifications[0] || null
        });

        // Create notification for each earned achievement
        for (const earnedAchievement of result.earned) {
          await get().createAchievementNotification(user.id, earnedAchievement);
        }

        // Auto-hide notification after 5 seconds
        setTimeout(() => {
          set({ showAchievementNotification: false, currentNotification: null });
        }, 5000);
      }

      // Update progress
      if (result.progress.length > 0) {
        const { achievementProgress } = get();
        const updatedProgress = [...achievementProgress];
        
        result.progress.forEach(newProgress => {
          const existingIndex = updatedProgress.findIndex(
            p => p.achievement_id === newProgress.achievement_id
          );
          if (existingIndex >= 0) {
            updatedProgress[existingIndex] = newProgress;
          } else {
            updatedProgress.push(newProgress);
          }
        });
        
        set({ achievementProgress: updatedProgress });
      }
    } catch (error: any) {
      console.error('Error checking achievements:', error);
    }
  },

  // Mark achievement as viewed
  markAchievementAsViewed: async (achievementId: string) => {
    const { user } = useAuthStore.getState();
    if (!user) return;

    try {
      // This would update a viewed status in the database
      // For now, just hide the notification
      set({ showAchievementNotification: false, currentNotification: null });
    } catch (error: any) {
      console.error('Error marking achievement as viewed:', error);
    }
  },

  // UI state management
  setShowAchievementNotification: (show: boolean) => {
    set({ showAchievementNotification: show });
  },

  // Create achievement notification
  createAchievementNotification: async (userId: string, achievement: any) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'success',
          title: '🏆 Achievement Unlocked!',
          body: `You earned "${achievement.name}" - ${achievement.description}`,
          is_read: false
        });

      if (error) {
        console.error('Error creating achievement notification:', error);
      }
    } catch (error) {
      console.error('Error creating achievement notification:', error);
    }
  }
}));
