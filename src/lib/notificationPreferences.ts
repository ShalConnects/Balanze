import { supabase } from './supabase';

export interface NotificationPreferences {
  financial: {
    overdue_payments: boolean;
    due_soon_reminders: boolean;
    low_balance_alerts: boolean;
  };
  system: {
    new_features: boolean;
  };
  activity: {
    account_changes: boolean;
  };
  communication: {
    in_app_notifications: boolean;
    email_notifications: boolean;
  };
  frequency: {
    real_time: boolean;        // For normal real-time notifications
    daily_digest: boolean;     // Daily summary
    weekly_summary: boolean;   // Weekly roundup
    monthly_report: boolean;   // Monthly insights
  };
}

const defaultPreferences: NotificationPreferences = {
  financial: {
    overdue_payments: true,
    due_soon_reminders: true,
    low_balance_alerts: true,
  },
  system: {
    new_features: true,
  },
  activity: {
    account_changes: true,
  },
  communication: {
    in_app_notifications: true,
    email_notifications: false,
  },
  frequency: {
    real_time: true,           // Normal notifications on by default
    daily_digest: false,       // Digest off by default
    weekly_summary: false,     // Summary off by default  
    monthly_report: false,     // Reports off by default
  },
};

export class NotificationPreferencesService {
  private static instance: NotificationPreferencesService;

  static getInstance(): NotificationPreferencesService {
    if (!NotificationPreferencesService.instance) {
      NotificationPreferencesService.instance = new NotificationPreferencesService();
    }
    return NotificationPreferencesService.instance;
  }

  async getPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      console.log('Fetching preferences for user:', userId);
      
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('preference_value')
        .eq('user_id', userId)
        .eq('preference_key', 'notification_settings')
        .single();

      console.log('Fetch result:', { data, error });

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - create default preferences
          console.log('No preferences found, creating defaults');
          await this.savePreferences(userId, defaultPreferences);
          return defaultPreferences;
        } else if (error.code === '42P01') {
          // Table doesn't exist
          console.error('Table notification_preferences does not exist');
          return defaultPreferences;
        } else {
          console.error('Error fetching notification preferences:', error);
          return defaultPreferences;
        }
      }

      if (!data) {
        // Create default preferences if none exist
        await this.savePreferences(userId, defaultPreferences);
        return defaultPreferences;
      }

      return { ...defaultPreferences, ...data.preference_value };
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      return defaultPreferences;
    }
  }

  async savePreferences(userId: string, preferences: NotificationPreferences): Promise<boolean> {
    try {
      console.log('💾 [NotificationPreferencesService] Saving preferences for user:', userId);
      console.log('💾 [NotificationPreferencesService] Preferences to save:', preferences);
      
      // Check if user is authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('🔐 [NotificationPreferencesService] Session check:', { session: !!session, error: sessionError });
      
      if (sessionError) {
        console.error('❌ [NotificationPreferencesService] Session error:', sessionError);
        return false;
      }
      
      if (!session) {
        console.error('❌ [NotificationPreferencesService] No active session. User must be logged in to save preferences.');
        return false;
      }
      
      if (session.user.id !== userId) {
        console.error('❌ [NotificationPreferencesService] User ID mismatch. Session user:', session.user.id, 'Requested user:', userId);
        return false;
      }
      
      // Try to save preferences with proper upsert configuration
      console.log('💾 [NotificationPreferencesService] Attempting database upsert...');
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          preference_key: 'notification_settings',
          preference_value: preferences,
        }, {
          onConflict: 'user_id,preference_key'
        });

      console.log('💾 [NotificationPreferencesService] Database upsert result:', { error });

      if (error) {
        console.error('❌ [NotificationPreferencesService] Error saving notification preferences:', error);
        if (error.code === '42P01') {
          console.error('Table notification_preferences does not exist. Please run the database migration.');
        } else if (error.code === '42501') {
          console.error('Row Level Security policy violation. User may not be properly authenticated.');
          // Try to refresh the session and retry once
          console.log('Attempting to refresh session and retry...');
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            console.error('Failed to refresh session:', refreshError);
            return false;
          }
          
          // Retry the save operation
          const { error: retryError } = await supabase
            .from('notification_preferences')
            .upsert({
              user_id: userId,
              preference_key: 'notification_settings',
              preference_value: preferences,
            }, {
              onConflict: 'user_id,preference_key'
            });
          
          if (retryError) {
            console.error('Retry failed:', retryError);
            return false;
          }
          
          console.log('Preferences saved successfully after session refresh');
          return true;
        } else if (error.code === '409' || error.code === '23505') {
          console.error('Conflict error - trying alternative approach with explicit update');
          // Try to update existing record first, then insert if not found
          const { error: updateError } = await supabase
            .from('notification_preferences')
            .update({
              preference_value: preferences,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .eq('preference_key', 'notification_settings');
          
          if (updateError && updateError.code !== 'PGRST116') {
            // If update failed and it's not "no rows found", try insert
            const { error: insertError } = await supabase
              .from('notification_preferences')
              .insert({
                user_id: userId,
                preference_key: 'notification_settings',
                preference_value: preferences,
              });
            
            if (insertError) {
              console.error('Both update and insert failed:', insertError);
              return false;
            }
          }
          
          console.log('Preferences saved successfully using alternative approach');
          return true;
        }
        return false;
      }

      console.log('✅ [NotificationPreferencesService] Preferences saved successfully');
      return true;
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      return false;
    }
  }

  async updatePreference(
    userId: string,
    category: keyof NotificationPreferences,
    key: string,
    value: boolean | string
  ): Promise<boolean> {
    try {
      const currentPreferences = await this.getPreferences(userId);
      const updatedPreferences = {
        ...currentPreferences,
        [category]: {
          ...currentPreferences[category],
          [key]: value,
        },
      };

      return await this.savePreferences(userId, updatedPreferences);
    } catch (error) {
      console.error('Error updating notification preference:', error);
      return false;
    }
  }

  // Overloaded method to accept userId and fetch preferences
  async shouldSendNotification(userId: string, notificationCategory: string, ignoreCriticalQuietHours?: boolean): Promise<boolean>;
  shouldSendNotification(
    preferences: NotificationPreferences,
    category: keyof NotificationPreferences,
    key: string
  ): boolean;
  async shouldSendNotification(
    userIdOrPreferences: string | NotificationPreferences,
    categoryOrKey: string | keyof NotificationPreferences,
    key?: string
  ): Promise<boolean> {
    // If first parameter is string (userId), fetch preferences and determine category/key
    if (typeof userIdOrPreferences === 'string') {
      const userId = userIdOrPreferences;
      const notificationCategory = categoryOrKey as string;
      
      try {
        const preferences = await this.getPreferences(userId);
        
        // Map notification categories to preference structure
        const categoryMapping = this.mapNotificationCategoryToPreference(notificationCategory);
        if (!categoryMapping) {
          console.warn(`Unknown notification category: ${notificationCategory}`);
          return true; // Default to allowing unknown categories
        }
        
        const { category, key: prefKey } = categoryMapping;
        const categoryPrefs = preferences[category] as any;
        return categoryPrefs && categoryPrefs[prefKey] === true;
      } catch (error) {
        console.error('Error checking notification preferences:', error);
        return true; // Default to allowing notifications on error
      }
    } else {
      // Original method signature
      const preferences = userIdOrPreferences;
      const category = categoryOrKey as keyof NotificationPreferences;
      const prefKey = key as string;
      
      const categoryPrefs = preferences[category] as any;
      return categoryPrefs && categoryPrefs[prefKey] === true;
    }
  }

  private mapNotificationCategoryToPreference(notificationCategory: string): { category: keyof NotificationPreferences; key: string } | null {
    const mapping: Record<string, { category: keyof NotificationPreferences; key: string }> = {
      // Financial notifications
      'overdue': { category: 'financial', key: 'overdue_payments' },
      'due_soon': { category: 'financial', key: 'due_soon_reminders' },
      'low_balance': { category: 'financial', key: 'low_balance_alerts' },
      
      // System notifications
      'new_feature': { category: 'system', key: 'new_features' },
      
      // Activity notifications
      'account_change': { category: 'activity', key: 'account_changes' },
    };
    
    return mapping[notificationCategory] || null;
  }

}

export const notificationPreferencesService = NotificationPreferencesService.getInstance();
