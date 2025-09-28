import { supabase } from './supabase';
import type { NotificationType } from '../types/index';
import { notificationPreferencesService } from './notificationPreferences';
import { showToast } from './toast';

// Enhanced notification types
export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

// Enhanced notification creation with user preferences integration
export async function createNotification(
  userId: string,
  title: string,
  type: NotificationType = 'info',
  body?: string,
  shouldShowToast: boolean = true,
  notificationCategory?: string, // New parameter to specify notification category
  ignoreCriticalQuietHours: boolean = false // For critical alerts that bypass quiet hours
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
      if (toastType === 'success') {
        showToast.success(title);
      } else if (toastType === 'error') {
        showToast.error(title);
      } else if (toastType === 'warning') {
        showToast.warning(title);
      } else if (toastType === 'info') {
        showToast.info(title);
      } else if (toastType === 'loading') {
        showToast.loading(title);
      }
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
    } else if (frequency === 'monthly_report') {
      await this.scheduleMonthlyReport();
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
        notification.category,
        ignoreCriticalQuietHours
      );
    }
  }

  private async scheduleDailyDigest() {
    // Group notifications by user
    const notificationsByUser = new Map<string, typeof this.notificationQueue>();
    
    for (const notification of this.notificationQueue) {
      if (!notificationsByUser.has(notification.userId)) {
        notificationsByUser.set(notification.userId, []);
      }
      notificationsByUser.get(notification.userId)!.push(notification);
    }

    // Clear the queue
    this.notificationQueue = [];

    // Schedule digest for each user (in a real implementation, this would use a job scheduler)
    for (const [userId, notifications] of notificationsByUser) {
      await this.createDailyDigestNotification(userId, notifications);
    }
  }

  private async scheduleWeeklySummary() {
    // Group notifications by user
    const notificationsByUser = new Map<string, typeof this.notificationQueue>();
    
    for (const notification of this.notificationQueue) {
      if (!notificationsByUser.has(notification.userId)) {
        notificationsByUser.set(notification.userId, []);
      }
      notificationsByUser.get(notification.userId)!.push(notification);
    }

    // Clear the queue
    this.notificationQueue = [];

    // Schedule summary for each user (in a real implementation, this would use a job scheduler)
    for (const [userId, notifications] of notificationsByUser) {
      await this.createWeeklySummaryNotification(userId, notifications);
    }
  }

  private async createDailyDigestNotification(userId: string, notifications: typeof this.notificationQueue) {
    if (notifications.length === 0) return;

    const categoryCounts = this.categorizeNotifications(notifications);
    const title = `Daily Digest: ${notifications.length} notification${notifications.length > 1 ? 's' : ''}`;
    
    let body = 'Summary of today\'s activities:\n';
    if (categoryCounts.financial > 0) body += `💰 ${categoryCounts.financial} financial alert${categoryCounts.financial > 1 ? 's' : ''}\n`;
    if (categoryCounts.system > 0) body += `⚙️ ${categoryCounts.system} system update${categoryCounts.system > 1 ? 's' : ''}\n`;
    if (categoryCounts.activity > 0) body += `📊 ${categoryCounts.activity} activity notification${categoryCounts.activity > 1 ? 's' : ''}\n`;

    await createNotification(userId, title, 'info', body, true);
  }

  private async createWeeklySummaryNotification(userId: string, notifications: typeof this.notificationQueue) {
    if (notifications.length === 0) return;

    const categoryCounts = this.categorizeNotifications(notifications);
    const title = `Weekly Summary: ${notifications.length} notification${notifications.length > 1 ? 's' : ''}`;
    
    let body = 'Summary of this week\'s activities:\n';
    if (categoryCounts.financial > 0) body += `💰 ${categoryCounts.financial} financial alert${categoryCounts.financial > 1 ? 's' : ''}\n`;
    if (categoryCounts.system > 0) body += `⚙️ ${categoryCounts.system} system update${categoryCounts.system > 1 ? 's' : ''}\n`;
    if (categoryCounts.activity > 0) body += `📊 ${categoryCounts.activity} activity notification${categoryCounts.activity > 1 ? 's' : ''}\n`;

    await createNotification(userId, title, 'info', body, true);
  }

  private async scheduleMonthlyReport() {
    // Group notifications by user
    const notificationsByUser = new Map<string, typeof this.notificationQueue>();
    
    for (const notification of this.notificationQueue) {
      if (!notificationsByUser.has(notification.userId)) {
        notificationsByUser.set(notification.userId, []);
      }
      notificationsByUser.get(notification.userId)!.push(notification);
    }

    // Clear the queue
    this.notificationQueue = [];

    // Schedule monthly report for each user
    for (const [userId, notifications] of notificationsByUser) {
      await this.createMonthlyReportNotification(userId, notifications);
    }
  }

  private async createMonthlyReportNotification(userId: string, notifications: typeof this.notificationQueue) {
    if (notifications.length === 0) return;

    const categoryCounts = this.categorizeNotifications(notifications);
    const title = `Monthly Report: ${notifications.length} notification${notifications.length > 1 ? 's' : ''}`;
    
    let body = 'Monthly financial activity summary:\n';
    if (categoryCounts.financial > 0) body += `💰 ${categoryCounts.financial} financial alert${categoryCounts.financial > 1 ? 's' : ''}\n`;
    if (categoryCounts.system > 0) body += `⚙️ ${categoryCounts.system} system update${categoryCounts.system > 1 ? 's' : ''}\n`;
    if (categoryCounts.activity > 0) body += `📊 ${categoryCounts.activity} activity notification${categoryCounts.activity > 1 ? 's' : ''}\n`;
    body += '\nView your detailed financial report in the app.';

    await createNotification(userId, title, 'info', body, true);
  }

  private categorizeNotifications(notifications: typeof this.notificationQueue): { financial: number; system: number; activity: number } {
    const counts = { financial: 0, system: 0, activity: 0 };
    
    for (const notification of notifications) {
      if (!notification.category) continue;
      
      const financialCategories = ['overdue', 'due_soon', 'low_balance'];
      const systemCategories = ['new_feature'];
      const activityCategories = ['account_change'];
      
      if (financialCategories.includes(notification.category)) {
        counts.financial++;
      } else if (systemCategories.includes(notification.category)) {
        counts.system++;
      } else if (activityCategories.includes(notification.category)) {
        counts.activity++;
      }
    }
    
    return counts;
  }

  private async getNotificationFrequency(): Promise<string> {
    // This would get the frequency from the first user in the queue
    // In a real implementation, you'd need to handle multiple users
    if (this.notificationQueue.length > 0) {
      try {
        const preferences = await notificationPreferencesService.getPreferences(this.notificationQueue[0].userId);
        // Priority order: real_time > daily > weekly > monthly
        if (preferences.frequency.real_time) return 'real_time';
        if (preferences.frequency.daily_digest) return 'daily_digest';
        if (preferences.frequency.weekly_summary) return 'weekly_summary';
        if (preferences.frequency.monthly_report) return 'monthly_report';
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
    category: 'overdue' | 'due_soon' | 'low_balance' = 'overdue'
  ) {
    await this.queueNotification(userId, title, type, body, category);
  }

  async createSystemNotification(
    userId: string,
    title: string,
    type: NotificationType,
    body?: string,
    category: 'new_feature' = 'new_feature'
  ) {
    await this.queueNotification(userId, title, type, body, category);
  }

  async createActivityNotification(
    userId: string,
    title: string,
    type: NotificationType,
    body?: string,
    category: 'account_change' = 'account_change'
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
