import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Notification } from '../types/index';

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  recalculateUnreadCount: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchNotifications: async () => {
    // Prevent multiple simultaneous fetches
    const currentState = get();
    if (currentState.isLoading) {
      return;
    }

    set({ isLoading: true, error: null });
    try {
      // Get current user from auth store
      const { user } = await import('../store/authStore').then(module => module.useAuthStore.getState());
      
      if (!user) {
        set({ notifications: [], unreadCount: 0, isLoading: false });
        return;
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted', false) // Exclude deleted notifications
        .order('created_at', { ascending: false })
        .limit(100); // Limit to prevent performance issues with too many notifications

      if (error) {
        console.error('Error fetching notifications:', error);
        // Don't throw error, just set empty notifications
        set({ notifications: [], unreadCount: 0, isLoading: false, error: error.message });
        return;
      }

      // Deduplicate urgent notifications by title (keep the most recent unread one)
      // Only deduplicate notifications that start with urgency prefixes
      const urgencyPrefixes = ['🚨 URGENT:', '⚠️ DUE SOON:', '📅 UPCOMING:'];
      const deduplicated = (data || []).reduce((acc: Notification[], current: Notification) => {
        const isUrgent = urgencyPrefixes.some(prefix => current.title?.startsWith(prefix));
        
        if (isUrgent) {
          // For urgent notifications, find duplicates by title
          const existingIndex = acc.findIndex(n => 
            n.title === current.title && 
            urgencyPrefixes.some(prefix => n.title?.startsWith(prefix))
          );
          
          if (existingIndex === -1) {
            // No duplicate found, add it
            acc.push(current);
          } else {
            // Duplicate found - keep the most recent unread one, or newest if both are read/unread
            const existing = acc[existingIndex];
            const currentDate = new Date(current.created_at);
            const existingDate = new Date(existing.created_at);
            
            // Prefer unread over read, or newer over older
            if ((!current.is_read && existing.is_read) || 
                (current.is_read === existing.is_read && currentDate > existingDate)) {
              acc[existingIndex] = current;
            }
          }
        } else {
          // For non-urgent notifications, add all (no deduplication)
          acc.push(current);
        }
        return acc;
      }, []);

      set({ notifications: deduplicated, isLoading: false, error: null });
      // Recalculate unread count to ensure consistency
      get().recalculateUnreadCount();
    } catch (error) {
      console.error('Error in fetchNotifications:', error);
      set({ notifications: [], unreadCount: 0, error: (error as Error).message, isLoading: false });
    }
  },

  markAsRead: async (id: string) => {
    try {
      // Optimistic update
      set(state => {
        const notification = state.notifications.find(n => n.id === id);
        const wasUnread = notification && !notification.is_read;
        return {
          notifications: state.notifications.map(n =>
            n.id === id ? { ...n, is_read: true } : n
          ),
          unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount
        };
      });

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) {
        console.error('Error marking notification as read:', error);
        // Revert optimistic update on error
        set(state => {
          const notification = state.notifications.find(n => n.id === id);
          const wasRead = notification && notification.is_read;
          return {
            notifications: state.notifications.map(n =>
              n.id === id ? { ...n, is_read: false } : n
            ),
            unreadCount: wasRead ? state.unreadCount + 1 : state.unreadCount,
            error: error.message
          };
        });
      }
    } catch (error) {
      console.error('Error in markAsRead:', error);
      set({ error: (error as Error).message });
    }
  },

  markAllAsRead: async () => {
    try {
      // Get current user from auth store
      const { user } = await import('../store/authStore').then(module => module.useAuthStore.getState());
      
      if (!user) {
        set({ error: 'User not authenticated' });
        return;
      }

      // Optimistic update
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, is_read: true })),
        unreadCount: 0
      }));

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        // Revert optimistic update on error by refetching
        get().fetchNotifications();
        set({ error: error.message });
        return;
      }

      // Success - state already updated optimistically
    } catch (error) {
      console.error('Error in markAllAsRead:', error);
      // Revert optimistic update on error by refetching
      get().fetchNotifications();
      set({ error: (error as Error).message });
    }
  },

  deleteNotification: async (id: string) => {
    try {
      // Optimistic update
      const currentState = get();
      const notificationToDelete = currentState.notifications.find(n => n.id === id);
      const wasUnread = notificationToDelete && !notificationToDelete.is_read;
      
      set(state => ({
        notifications: state.notifications.filter(n => n.id !== id),
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount
      }));

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting notification:', error);
        // Revert optimistic update on error
        if (notificationToDelete) {
          set(state => ({
            notifications: [...state.notifications, notificationToDelete].sort((a, b) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            ),
            unreadCount: wasUnread ? state.unreadCount + 1 : state.unreadCount,
            error: error.message
          }));
        }
      }
    } catch (error) {
      console.error('Error in deleteNotification:', error);
      set({ error: (error as Error).message });
    }
  },

  clearAllNotifications: async () => {
    try {
      // Get current user from auth store
      const { user } = await import('../store/authStore').then(module => module.useAuthStore.getState());
      
      if (!user) {
        set({ error: 'User not authenticated' });
        return;
      }

      // Optimistic update
      set({ notifications: [], unreadCount: 0 });

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Error clearing all notifications:', error);
        // Revert optimistic update on error by refetching
        get().fetchNotifications();
        set({ error: error.message });
        return;
      }

      // Success - state already updated optimistically
    } catch (error) {
      console.error('Error in clearAllNotifications:', error);
      // Revert optimistic update on error by refetching
      get().fetchNotifications();
      set({ error: (error as Error).message });
    }
  },

  recalculateUnreadCount: () => {
    set(state => ({
      unreadCount: state.notifications.filter(n => !n.is_read).length
    }));
  }
})); 

