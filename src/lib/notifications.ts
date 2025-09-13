import { supabase } from './supabase';
import { toast } from 'sonner';
import type { NotificationType } from '../types/index';
import { notificationPreferencesService } from './notificationPreferences';

// Enhanced notification types
export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

// Toast configuration
const toastConfig = {
  success: {
    duration: 4000,
    style: {
      background: '#10B981',
      color: 'white',
      border: '1px solid #059669'
    }
  },
  error: {
    duration: 6000,
    style: {
      background: '#EF4444',
      color: 'white',
      border: '1px solid #DC2626'
    }
  },
  warning: {
    duration: 5000,
    style: {
      background: '#F59E0B',
      color: 'white',
      border: '1px solid #D97706'
    }
  },
  info: {
    duration: 4000,
    style: {
      background: '#3B82F6',
      color: 'white',
      border: '1px solid #2563EB'
    }
  },
  loading: {
    duration: Infinity,
    style: {
      background: '#6B7280',
      color: 'white',
      border: '1px solid #4B5563'
    }
  }
};

// Enhanced toast functions with better styling
export const showToast = {
  success: (message: string, options?: { description?: string; action?: { label: string; onClick: () => void } }) => {
    toast.success(message, {
      ...toastConfig.success,
      description: options?.description,
      action: options?.action
    });
  },

  error: (message: string, options?: { description?: string; action?: { label: string; onClick: () => void } }) => {
    toast.error(message, {
      ...toastConfig.error,
      description: options?.description,
      action: options?.action
    });
  },

  warning: (message: string, options?: { description?: string; action?: { label: string; onClick: () => void } }) => {
    toast.warning(message, {
      ...toastConfig.warning,
      description: options?.description,
      action: options?.action
    });
  },

  info: (message: string, options?: { description?: string; action?: { label: string; onClick: () => void } }) => {
    toast.info(message, {
      ...toastConfig.info,
      description: options?.description,
      action: options?.action
    });
  },

  loading: (message: string, options?: { description?: string }) => {
    return toast.loading(message, {
      ...toastConfig.loading,
      description: options?.description
    });
  }
};

// Enhanced notification creation with user preferences integration
export async function createNotification(
  userId: string,
  title: string,
  type: NotificationType = 'info',
  body?: string,
  shouldShowToast: boolean = true,
  notificationCategory?: string // New parameter to specify notification category
) {
  try {
    // Check user preferences before creating notification
    if (notificationCategory) {
      const shouldSend = await notificationPreferencesService.shouldSendNotification(userId, notificationCategory);
      if (!shouldSend) {
        console.log(`Notification blocked by user preferences for category: ${notificationCategory}`);
        return { success: true, blocked: true };
      }
    }

    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      title,
      type,
      body
    });

    if (error) {
      console.error('Error creating notification:', error);
      throw error;
    }

    // Show toast notification if requested and user preferences allow
    if (shouldShowToast) {
      const toastType = type as ToastType;
      showToast[toastType](title, { description: body });
    }

    return { success: true };
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

// Smart notification system with preferences integration
export class SmartNotificationManager {
  private static instance: SmartNotificationManager;
  private notificationQueue: Array<{
    id: string;
    userId: string;
    title: string;
    type: NotificationType;
    body?: string;
    category?: string;
    timestamp: Date;
  }> = [];

  static getInstance(): SmartNotificationManager {
    if (!SmartNotificationManager.instance) {
      SmartNotificationManager.instance = new SmartNotificationManager();
    }
    return SmartNotificationManager.instance;
  }

  async queueNotification(
    userId: string,
    title: string,
    type: NotificationType = 'info',
    body?: string,
    category?: string
  ) {
    const notification = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      title,
      type,
      body,
      category,
      timestamp: new Date()
    };

    this.notificationQueue.push(notification);
    await this.processQueue();
  }

  private async processQueue() {
    const frequency = await this.getNotificationFrequency();
    
    if (frequency === 'real_time') {
      await this.processNotificationsImmediately();
    } else if (frequency === 'daily_digest') {
      await this.scheduleDailyDigest();
    } else if (frequency === 'weekly_summary') {
      await this.scheduleWeeklySummary();
    }
  }

  private async processNotificationsImmediately() {
    const notifications = [...this.notificationQueue];
    this.notificationQueue = [];

    for (const notification of notifications) {
      await createNotification(
        notification.userId,
        notification.title,
        notification.type,
        notification.body,
        true,
        notification.category
      );
    }
  }

  private async scheduleDailyDigest() {
    // Implementation for daily digest
    // This would batch notifications and send them once per day
    console.log('Daily digest scheduling not yet implemented');
  }

  private async scheduleWeeklySummary() {
    // Implementation for weekly summary
    // This would batch notifications and send them once per week
    console.log('Weekly summary scheduling not yet implemented');
  }

  private async getNotificationFrequency(): Promise<string> {
    // This would get the frequency from the first user in the queue
    // In a real implementation, you'd need to handle multiple users
    if (this.notificationQueue.length > 0) {
      try {
        const preferences = await notificationPreferencesService.getPreferences(this.notificationQueue[0].userId);
        if (preferences.frequency.real_time) return 'real_time';
        if (preferences.frequency.daily_digest) return 'daily_digest';
        if (preferences.frequency.weekly_summary) return 'weekly_summary';
      } catch (error) {
        console.warn('Could not get notification frequency, defaulting to real_time:', error);
      }
    }
    return 'real_time';
  }

  // Method to create specific types of notifications with proper categories
  async createFinancialNotification(
    userId: string,
    title: string,
    type: NotificationType,
    body?: string,
    category: 'overdue' | 'due_soon' | 'upcoming' | 'low_balance' | 'budget_exceeded' | 'large_transaction' = 'overdue'
  ) {
    await this.queueNotification(userId, title, type, body, category);
  }

  async createSystemNotification(
    userId: string,
    title: string,
    type: NotificationType,
    body?: string,
    category: 'new_feature' | 'system_update' | 'tip' | 'security' = 'system_update'
  ) {
    await this.queueNotification(userId, title, type, body, category);
  }

  async createActivityNotification(
    userId: string,
    title: string,
    type: NotificationType,
    body?: string,
    category: 'transaction_confirmation' | 'account_change' | 'category_update' | 'backup_reminder' = 'transaction_confirmation'
  ) {
    await this.queueNotification(userId, title, type, body, category);
  }
}

// Export singleton instance
export const smartNotificationManager = SmartNotificationManager.getInstance();

// Convenience functions for common notification types
export const createFinancialNotification = smartNotificationManager.createFinancialNotification.bind(smartNotificationManager);
export const createSystemNotification = smartNotificationManager.createSystemNotification.bind(smartNotificationManager);
export const createActivityNotification = smartNotificationManager.createActivityNotification.bind(smartNotificationManager);
