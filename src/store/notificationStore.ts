import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  getFavoriteQuotes, 
  addFavoriteQuote as addFavoriteQuoteToDB, 
  removeFavoriteQuote as removeFavoriteQuoteFromDB,
  removeFavoriteQuoteByContent,
  isQuoteFavorited as isQuoteFavoritedInDB,
  FavoriteQuote as DBFavoriteQuote 
} from '../lib/favoriteQuotesService';

export interface Notification {
  id: string;
  type: 'feature' | 'improvement' | 'bugfix' | 'announcement' | 'tip';
  title: string;
  message: string;
  actionText?: string;
  actionUrl?: string;
  icon?: string;
  createdAt: Date;
  read: boolean;
  dismissed: boolean;
  priority: 'low' | 'medium' | 'high';
  targetAudience?: 'all' | 'new' | 'existing' | 'power';
}

export interface FavoriteQuote {
  id: string;
  quote: string;
  author: string;
  createdAt: Date;
  category?: 'financial' | 'motivation' | 'success' | 'wisdom';
}

// Legacy interface for backward compatibility
export interface LegacyFavoriteQuote {
  id: string;
  quote: string;
  author: string;
  createdAt: Date;
  category?: 'financial' | 'motivation' | 'success' | 'wisdom';
}

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  favoriteQuotes: FavoriteQuote[];
  isLoadingQuotes: boolean;
  currentUserId: string | null;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read' | 'dismissed'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismissNotification: (id: string) => void;
  clearAll: () => void;
  getUnreadCount: () => number;
  initializeDefaultNotifications: () => void;
  addHelpCenterNotification: () => void;
  loadFavoriteQuotes: (userId: string) => Promise<void>;
  addFavoriteQuote: (quote: Omit<FavoriteQuote, 'id' | 'createdAt'>) => Promise<void>;
  removeFavoriteQuote: (id: string) => Promise<void>;
  removeFavoriteQuoteByContent: (quote: string, author: string) => Promise<void>;
  isQuoteFavorited: (quote: string, author: string) => boolean;
  setCurrentUserId: (userId: string | null) => void;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      favoriteQuotes: [],
      isLoadingQuotes: false,
      currentUserId: null,

      addNotification: (notificationData) => {
        const newNotification: Notification = {
          ...notificationData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          read: false,
          dismissed: false,
        };

        set((state) => ({
          notifications: [newNotification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        }));
      },

      markAsRead: (id) => {
        set((state) => {
          const updatedNotifications = state.notifications.map((notification) =>
            notification.id === id ? { ...notification, read: true } : notification
          );
          const newUnreadCount = updatedNotifications.filter((n) => !n.read && !n.dismissed).length;
          return {
            notifications: updatedNotifications,
            unreadCount: newUnreadCount,
          };
        });
      },

      markAllAsRead: () => {
        set((state) => {
          const updatedNotifications = state.notifications.map((notification) => ({
            ...notification,
            read: true,
          }));
          const newUnreadCount = updatedNotifications.filter((n) => !n.read && !n.dismissed).length;
          return {
            notifications: updatedNotifications,
            unreadCount: newUnreadCount,
          };
        });
      },

      dismissNotification: (id) => {
        set((state) => {
          const updatedNotifications = state.notifications.map((notification) =>
            notification.id === id ? { ...notification, dismissed: true } : notification
          );
          const newUnreadCount = updatedNotifications.filter((n) => !n.read && !n.dismissed).length;
          return {
            notifications: updatedNotifications,
            unreadCount: newUnreadCount,
          };
        });
      },

      clearAll: () => {
        set({ notifications: [], unreadCount: 0 });
      },

      getUnreadCount: () => {
        return get().notifications.filter((n) => !n.read && !n.dismissed).length;
      },

      loadFavoriteQuotes: async (userId: string) => {
        set({ isLoadingQuotes: true });
        try {
          const dbQuotes = await getFavoriteQuotes(userId);
          const convertedQuotes: FavoriteQuote[] = dbQuotes.map(dbQuote => ({
            id: dbQuote.id,
            quote: dbQuote.quote,
            author: dbQuote.author,
            category: dbQuote.category,
            createdAt: new Date(dbQuote.created_at)
          }));
          set({ favoriteQuotes: convertedQuotes, isLoadingQuotes: false });
        } catch (error) {
          console.error('Error loading favorite quotes:', error);
          set({ isLoadingQuotes: false });
        }
      },

      addFavoriteQuote: async (quoteData) => {
        const { currentUserId } = get();
        if (!currentUserId) {
          console.error('No current user ID for adding favorite quote');
          return;
        }

        try {
          const newQuote = await addFavoriteQuoteToDB(currentUserId, {
            quote: quoteData.quote,
            author: quoteData.author,
            category: quoteData.category
          });

          if (newQuote) {
            const convertedQuote: FavoriteQuote = {
              id: newQuote.id,
              quote: newQuote.quote,
              author: newQuote.author,
              category: newQuote.category,
              createdAt: new Date(newQuote.created_at)
            };

            set((state) => ({
              favoriteQuotes: [convertedQuote, ...state.favoriteQuotes],
            }));
          }
        } catch (error) {
          console.error('Error adding favorite quote:', error);
        }
      },

      removeFavoriteQuote: async (id) => {
        const { currentUserId } = get();
        if (!currentUserId) {
          console.error('No current user ID for removing favorite quote');
          return;
        }

        try {
          const success = await removeFavoriteQuoteFromDB(currentUserId, id);
          if (success) {
            set((state) => ({
              favoriteQuotes: state.favoriteQuotes.filter((quote) => quote.id !== id),
            }));
          }
        } catch (error) {
          console.error('Error removing favorite quote:', error);
        }
      },

      removeFavoriteQuoteByContent: async (quote: string, author: string) => {
        const { currentUserId } = get();
        if (!currentUserId) {
          console.error('No current user ID for removing favorite quote by content');
          return;
        }

        try {
          const success = await removeFavoriteQuoteByContent(currentUserId, quote, author);
          if (success) {
            set((state) => ({
              favoriteQuotes: state.favoriteQuotes.filter((favorite) => 
                !(favorite.quote === quote && favorite.author === author)
              ),
            }));
          }
        } catch (error) {
          console.error('Error removing favorite quote by content:', error);
        }
      },

      isQuoteFavorited: (quote: string, author: string) => {
        const { favoriteQuotes } = get();
        return favoriteQuotes.some((favorite) => 
          favorite.quote === quote && favorite.author === author
        );
      },

      setCurrentUserId: (userId: string | null) => {
        set({ currentUserId: userId });
      },

      initializeDefaultNotifications: () => {
        const { notifications } = get();
        
        // Only initialize if no notifications exist
        if (notifications.length === 0) {
          const defaultNotifications: Omit<Notification, 'id' | 'createdAt' | 'read' | 'dismissed'>[] = [
            {
              type: 'announcement',
              title: '📚 New Help Center Launched!',
              message: 'We\'ve launched a comprehensive Help Center with guides, tutorials, and support resources to help you get the most out of Balanze.',
              actionText: 'Explore Help Center',
              actionUrl: '/help',
              icon: '📖',
              priority: 'high',
              targetAudience: 'all',
            },
            {
              type: 'feature',
              title: '🎉 Multi-Currency Support',
              message: 'Track your finances in multiple currencies! Now you can manage accounts in USD, EUR, GBP, and more.',
              actionText: 'Try Multi-Currency',
              actionUrl: '/currency-analytics',
              icon: '💱',
              priority: 'high',
              targetAudience: 'all',
            },
            {
              type: 'feature',
              title: '💝 Enhanced Donation Page',
              message: 'We\'ve completely redesigned the donation page with better tracking, categories, and insights.',
              actionText: 'Explore Donations',
              actionUrl: '/donations',
              icon: '🎁',
              priority: 'medium',
              targetAudience: 'all',
            },
            {
              type: 'feature',
              title: '✨ Daily Motivation Cards',
              message: 'Stay inspired with daily financial wisdom! New motivational quotes appear on your dashboard.',
              actionText: 'View Dashboard',
              actionUrl: '/',
              icon: '💫',
              priority: 'medium',
              targetAudience: 'all',
            },
            {
              type: 'tip',
              title: '💡 Pro Tip: Use Categories',
              message: 'Organize your transactions with categories to get better insights into your spending patterns.',
              actionText: 'Learn More',
              actionUrl: '/transactions',
              icon: '📊',
              priority: 'low',
              targetAudience: 'new',
            },
          ];

          defaultNotifications.forEach((notification) => {
            get().addNotification(notification);
          });
        }
      },

      addHelpCenterNotification: () => {
        const { notifications } = get();
        
        // Check if help center notification already exists
        const helpNotificationExists = notifications.some(
          notification => notification.title.includes('Help Center') && notification.type === 'announcement'
        );
        
        if (!helpNotificationExists) {
          get().addNotification({
            type: 'announcement',
            title: '📚 New Help Center Launched!',
            message: 'We\'ve launched a comprehensive Help Center with guides, tutorials, and support resources to help you get the most out of Balanze.',
            actionText: 'Explore Help Center',
            actionUrl: '/help',
            icon: '📖',
            priority: 'high',
            targetAudience: 'all',
          });
        }
      },
    }),
    {
      name: 'notification-storage',
      partialize: (state) => ({
        notifications: state.notifications,
        unreadCount: state.unreadCount,
        // Don't persist favoriteQuotes anymore - they're now in the database
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Convert string dates back to Date objects after rehydration
          state.notifications = state.notifications.map(notification => ({
            ...notification,
            createdAt: new Date(notification.createdAt)
          }));
          
          // Recalculate unread count to ensure consistency
          state.unreadCount = state.notifications.filter((n) => !n.read && !n.dismissed).length;
          
          // Reset favorite quotes - they'll be loaded from database when user logs in
          state.favoriteQuotes = [];
          state.currentUserId = null;
        }
      },
    }
  )
); 