import { supabase } from './supabase';

export interface NotificationPreferences {
  financial: {
    overdue_payments: boolean;
    due_soon_reminders: boolean;
    upcoming_deadlines: boolean;
    low_balance_alerts: boolean;
    budget_exceeded: boolean;
    large_transactions: boolean;
  };
  system: {
    new_features: boolean;
    system_updates: boolean;
    tips_guidance: boolean;
    security_alerts: boolean;
  };
  activity: {
    transaction_confirmations: boolean;
    account_changes: boolean;
    category_updates: boolean;
    backup_reminders: boolean;
  };
  communication: {
    in_app_notifications: boolean;
    email_notifications: boolean;
    push_notifications: boolean;
    quiet_hours_enabled: boolean;
    quiet_hours_start: string;
    quiet_hours_end: string;
  };
  frequency: {
    real_time: boolean;
    daily_digest: boolean;
    weekly_summary: boolean;
  };
}

const defaultPreferences: NotificationPreferences = {
  financial: {
    overdue_payments: true,
    due_soon_reminders: true,
    upcoming_deadlines: true,
    low_balance_alerts: true,
    budget_exceeded: true,
    large_transactions: true,
  },
  system: {
    new_features: true,
    system_updates: true,
    tips_guidance: true,
    security_alerts: true,
  },
  activity: {
    transaction_confirmations: true,
    account_changes: true,
    category_updates: false,
    backup_reminders: true,
  },
  communication: {
    in_app_notifications: true,
    email_notifications: false,
    push_notifications: false,
    quiet_hours_enabled: false,
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00',
  },
  frequency: {
    real_time: true,
    daily_digest: false,
    weekly_summary: false,
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
      console.log('Saving preferences for user:', userId, preferences);
      
      // Check if user is authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Session error:', sessionError);
        return false;
      }
      
      if (!session) {
        console.error('No active session. User must be logged in to save preferences.');
        return false;
      }
      
      if (session.user.id !== userId) {
        console.error('User ID mismatch. Session user:', session.user.id, 'Requested user:', userId);
        return false;
      }
      
      // Try to save preferences with proper upsert configuration
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          preference_key: 'notification_settings',
          preference_value: preferences,
        }, {
          onConflict: 'user_id,preference_key'
        });

      if (error) {
        console.error('Error saving notification preferences:', error);
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

      console.log('Preferences saved successfully');
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

  shouldSendNotification(
    preferences: NotificationPreferences,
    category: keyof NotificationPreferences,
    key: string
  ): boolean {
    const categoryPrefs = preferences[category] as any;
    return categoryPrefs && categoryPrefs[key] === true;
  }

  isInQuietHours(preferences: NotificationPreferences): boolean {
    if (!preferences.communication.quiet_hours_enabled) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const startTime = this.timeToMinutes(preferences.communication.quiet_hours_start);
    const endTime = this.timeToMinutes(preferences.communication.quiet_hours_end);

    if (startTime <= endTime) {
      // Same day quiet hours (e.g., 22:00 to 08:00 next day)
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Overnight quiet hours (e.g., 22:00 to 08:00 next day)
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  private timeToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }
}

export const notificationPreferencesService = NotificationPreferencesService.getInstance();
