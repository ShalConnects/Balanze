import { supabase } from './supabase';

export interface UserPreferences {
  showMultiCurrencyAnalytics?: boolean;
  showLendBorrowWidget?: boolean;
  showPurchasesWidget?: boolean;
  showDonationsSavingsWidget?: boolean;
  dismissedBanners?: string[];
  theme?: 'light' | 'dark' | 'auto';
  language?: string;
  [key: string]: any;
}

export class UserPreferencesManager {
  private static instance: UserPreferencesManager;
  private cache: Map<string, UserPreferences> = new Map();

  static getInstance(): UserPreferencesManager {
    if (!UserPreferencesManager.instance) {
      UserPreferencesManager.instance = new UserPreferencesManager();
    }
    return UserPreferencesManager.instance;
  }

  /**
   * Get user preferences from database
   */
  async getUserPreferences(userId: string): Promise<UserPreferences> {
    // Check cache first
    if (this.cache.has(userId)) {
      return this.cache.get(userId)!;
    }

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('preference_value')
        .eq('user_id', userId)
        .eq('preference_key', 'ui_preferences')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error fetching user preferences:', error);
        return this.getDefaultPreferences();
      }

      const preferences = data?.preference_value || this.getDefaultPreferences();
      
      // Cache the preferences
      this.cache.set(userId, preferences);
      
      return preferences;
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      return this.getDefaultPreferences();
    }
  }

  /**
   * Update user preferences in database
   */
  async updateUserPreferences(
    userId: string, 
    updates: Partial<UserPreferences>
  ): Promise<void> {
    try {
      // Get current preferences
      const currentPreferences = await this.getUserPreferences(userId);
      
      // Merge with updates
      const newPreferences = { ...currentPreferences, ...updates };

      // Update in database - use proper upsert with conflict resolution
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          preference_key: 'ui_preferences',
          preference_value: newPreferences
        }, {
          onConflict: 'user_id,preference_key'
        });

      if (error) {
        console.error('Error updating user preferences:', error);
        throw error;
      }

      // Update cache
      this.cache.set(userId, newPreferences);
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  }

  /**
   * Get a specific preference value
   */
  async getPreference<T>(
    userId: string, 
    key: keyof UserPreferences, 
    defaultValue: T
  ): Promise<T> {
    const preferences = await this.getUserPreferences(userId);
    return (preferences[key] as T) ?? defaultValue;
  }

  /**
   * Set a specific preference value
   */
  async setPreference<T>(
    userId: string, 
    key: keyof UserPreferences, 
    value: T
  ): Promise<void> {
    await this.updateUserPreferences(userId, { [key]: value });
  }

  /**
   * Check if a banner has been dismissed
   */
  async isBannerDismissed(userId: string, bannerId: string): Promise<boolean> {
    const dismissedBanners = await this.getPreference<string[]>(
      userId, 
      'dismissedBanners', 
      []
    );
    return dismissedBanners.includes(bannerId);
  }

  /**
   * Dismiss a banner
   */
  async dismissBanner(userId: string, bannerId: string): Promise<void> {
    const dismissedBanners = await this.getPreference<string[]>(
      userId, 
      'dismissedBanners', 
      []
    );
    
    if (!dismissedBanners.includes(bannerId)) {
      dismissedBanners.push(bannerId);
      await this.setPreference(userId, 'dismissedBanners', dismissedBanners);
    }
  }

  /**
   * Clear cache for a user (useful for logout)
   */
  clearCache(userId?: string): void {
    if (userId) {
      this.cache.delete(userId);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get default preferences
   */
  private getDefaultPreferences(): UserPreferences {
    return {
      showMultiCurrencyAnalytics: true,
      showLendBorrowWidget: true,
      showPurchasesWidget: true,
      showDonationsSavingsWidget: true,
      dismissedBanners: [],
      theme: 'auto',
      language: 'en'
    };
  }
}

// Export singleton instance
export const userPreferencesManager = UserPreferencesManager.getInstance();

// Convenience functions
export const getUserPreferences = (userId: string) => 
  userPreferencesManager.getUserPreferences(userId);

export const updateUserPreferences = (userId: string, updates: Partial<UserPreferences>) => 
  userPreferencesManager.updateUserPreferences(userId, updates);

export const getPreference = <T>(userId: string, key: keyof UserPreferences, defaultValue: T) => 
  userPreferencesManager.getPreference(userId, key, defaultValue);

export const setPreference = <T>(userId: string, key: keyof UserPreferences, value: T) => 
  userPreferencesManager.setPreference(userId, key, value);

export const isBannerDismissed = (userId: string, bannerId: string) => 
  userPreferencesManager.isBannerDismissed(userId, bannerId);

export const dismissBanner = (userId: string, bannerId: string) => 
  userPreferencesManager.dismissBanner(userId, bannerId); 