import { supabase } from './supabase';
import { createNotification, createFinancialNotification } from './notifications';
import { useAuthStore } from '../store/authStore';
import { useFinanceStore } from '../store/useFinanceStore';
import { LendBorrow } from '../types/index';
import { formatCurrency } from '../utils/currency';

interface UrgentItem {
  id: string;
  type: 'lend_borrow' | 'purchase';
  title: string;
  message: string;
  dueDate: string;
  daysUntil: number;
  amount?: number;
  currency?: string;
  personName?: string;
  itemName?: string;
  priority?: 'low' | 'medium' | 'high';
  status: 'overdue' | 'due_soon' | 'upcoming';
  lendBorrowType?: 'lend' | 'borrow'; // Track if it's lend or borrow
}

export class UrgentNotificationService {
  private static instance: UrgentNotificationService;
  private lastCheck: Date = new Date(0);
  private checkInterval: number = 1000 * 60 * 60; // Check every hour

  static getInstance(): UrgentNotificationService {
    if (!UrgentNotificationService.instance) {
      UrgentNotificationService.instance = new UrgentNotificationService();
    }
    return UrgentNotificationService.instance;
  }

  async checkAndCreateUrgentNotifications(userId: string): Promise<void> {
    // Re-enabled urgent notifications service
    
    const now = new Date();
    
    // Only check if enough time has passed since last check
    if (now.getTime() - this.lastCheck.getTime() < this.checkInterval) {
      return;
    }

    this.lastCheck = now;

    try {
      // Clean up duplicate notifications first
      await this.cleanupDuplicateNotifications(userId);
      
      // Clear old urgent notifications that are no longer relevant
      await this.clearOldUrgentNotifications(userId);
      
      // Get urgent items
      const urgentItems = await this.getUrgentItems(userId);
      
      // Create notifications for urgent items
      for (const item of urgentItems) {
        await this.createUrgentNotification(userId, item);
      }
      
    } catch (error) {
      console.error('Error in checkAndCreateUrgentNotifications:', error);
    }
  }

  // Method to manually trigger urgent notification check (for testing)
  async forceCheckUrgentNotifications(userId: string): Promise<void> {
    this.lastCheck = new Date(0); // Reset last check time
    await this.checkAndCreateUrgentNotifications(userId);
  }

  // Method to clear all urgent notifications for a user (for testing)
  async clearAllUrgentNotifications(userId: string): Promise<void> {
    try {
      await supabase
        .from('notifications')
        .update({ deleted: true })
        .eq('user_id', userId)
        .in('type', ['urgent', 'reminder']);
    } catch (error) {

    }
  }

  private async cleanupDuplicateNotifications(userId: string): Promise<void> {
    try {
      // Get all urgent notifications for this user
      const urgencyPrefixes = ['🚨 URGENT:', '⚠️ DUE SOON:', '📅 UPCOMING:'];
      
      for (const prefix of urgencyPrefixes) {
        const { data: notifications, error } = await supabase
          .from('notifications')
          .select('id, title, created_at, is_read')
          .eq('user_id', userId)
          .like('title', `${prefix}%`)
          .is('deleted', false)
          .order('created_at', { ascending: false });

        if (error) {
          console.error(`Error fetching ${prefix} notifications:`, error);
          continue;
        }

        if (!notifications || notifications.length <= 1) {
          continue; // No duplicates
        }

        // Group by title to find duplicates
        const titleGroups = new Map<string, typeof notifications>();
        notifications.forEach(notif => {
          if (!titleGroups.has(notif.title)) {
            titleGroups.set(notif.title, []);
          }
          titleGroups.get(notif.title)!.push(notif);
        });

        // For each title group with duplicates, keep only the most recent unread one
        for (const [title, group] of titleGroups) {
          if (group.length <= 1) continue;

          // Sort by: unread first, then by created_at desc
          group.sort((a, b) => {
            if (a.is_read !== b.is_read) {
              return a.is_read ? 1 : -1; // Unread first
            }
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          });

          // Keep the first one (most recent unread, or most recent if all read)
          const toKeep = group[0];
          const toDelete = group.slice(1);

          if (toDelete.length > 0) {
            const idsToDelete = toDelete.map(n => n.id);
            await supabase
              .from('notifications')
              .update({ deleted: true })
              .in('id', idsToDelete);
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up duplicate notifications:', error);
    }
  }

  private async clearOldUrgentNotifications(userId: string): Promise<void> {
    try {
      // Get all lend/borrow records that are no longer active or overdue
      const { data: inactiveLendBorrow, error: lbError } = await supabase
        .from('lend_borrow')
        .select('id, person_name, type')
        .eq('user_id', userId)
        .not('status', 'in', '(active,overdue)');

      if (lbError) {
        console.error('Error fetching inactive lend/borrow records:', lbError);
        return;
      }

      // Get all purchases that are no longer planned
      // Use .neq() instead of .not() for better compatibility
      const { data: completedPurchases, error: pError } = await supabase
        .from('purchases')
        .select('id, title')
        .eq('user_id', userId)
        .neq('status', 'planned');

      if (pError) {
        console.error('Error fetching completed purchases:', pError);
        // Continue even if purchases query fails
      }

      // Build notification titles that should be deleted
      const titlesToDelete: string[] = [];
      
      if (inactiveLendBorrow && inactiveLendBorrow.length > 0) {
        inactiveLendBorrow.forEach(record => {
          const baseTitle = `${record.person_name} ${record.type === 'lend' ? 'owes you' : 'you owe'}`;
          titlesToDelete.push(`🚨 URGENT: ${baseTitle}`);
          titlesToDelete.push(`⚠️ DUE SOON: ${baseTitle}`);
          titlesToDelete.push(`📅 UPCOMING: ${baseTitle}`);
        });
      }

      if (completedPurchases && completedPurchases.length > 0) {
        completedPurchases.forEach(purchase => {
          const baseTitle = `Planned purchase: ${purchase.title}`;
          titlesToDelete.push(`🚨 URGENT: ${baseTitle}`);
          titlesToDelete.push(`⚠️ DUE SOON: ${baseTitle}`);
          titlesToDelete.push(`📅 UPCOMING: ${baseTitle}`);
        });
      }

      // Delete notifications matching these titles (in smaller batches to avoid URL length issues)
      if (titlesToDelete.length > 0) {
        // Use smaller batch size (50) to prevent URL length issues with long titles
        const batchSize = 50;
        for (let i = 0; i < titlesToDelete.length; i += batchSize) {
          const batch = titlesToDelete.slice(i, i + batchSize);
          try {
            await supabase
              .from('notifications')
              .update({ deleted: true })
              .eq('user_id', userId)
              .in('title', batch);
          } catch (error) {
            // If batch fails (e.g., URL too long), try individual deletes for this batch
            console.warn('Batch delete failed, trying individual deletes:', error);
            for (const title of batch) {
              try {
                await supabase
                  .from('notifications')
                  .update({ deleted: true })
                  .eq('user_id', userId)
                  .eq('title', title);
              } catch (individualError) {
                console.error('Failed to delete notification:', title, individualError);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error clearing old urgent notifications:', error);
    }
  }

  private async getUrgentItems(userId: string): Promise<UrgentItem[]> {
    const urgentItems: UrgentItem[] = [];

    try {
      // First, update overdue status for all active records
      await this.updateOverdueStatus(userId);
      
      // Get overdue and due soon lend/borrow records
      const { data: lendBorrowRecords, error: lbError } = await supabase
        .from('lend_borrow')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['active', 'overdue']);

      if (lbError) {

      } else if (lendBorrowRecords) {
        for (const record of lendBorrowRecords) {
          const dueDate = new Date(record.due_date);
          const now = new Date();
          const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          let status: 'overdue' | 'due_soon' | 'upcoming' = 'upcoming';
          if (daysUntil < 0) {
            status = 'overdue';
          } else if (daysUntil <= 3) {
            status = 'due_soon';
          } else if (daysUntil <= 7) {
            status = 'upcoming';
          }

          // Only include items that are overdue, due soon, or upcoming
          if (status === 'overdue' || status === 'due_soon' || status === 'upcoming') {
            urgentItems.push({
              id: record.id,
              type: 'lend_borrow',
              title: `${record.person_name} ${record.type === 'lend' ? 'owes you' : 'you owe'}`,
              message: `${record.type === 'lend' ? 'You lent' : 'You borrowed'} ${formatCurrency(record.amount, record.currency)}`,
              dueDate: record.due_date,
              daysUntil,
              amount: record.amount,
              currency: record.currency,
              personName: record.person_name,
              priority: status === 'overdue' ? 'high' : status === 'due_soon' ? 'medium' : 'low',
              status,
              lendBorrowType: record.type
            });
          }
        }
      }

      // Get planned purchases that are due soon - TEMPORARILY DISABLED DUE TO DB ISSUES
      // const { data: plannedPurchases, error: pError } = await supabase
      //   .from('purchases')
      //   .select('*')
      //   .eq('user_id', userId)
      //   .eq('status', 'planned')
      //   .not('planned_date', 'is', null);
      
      const plannedPurchases = [];
      const pError = null;

      if (pError) {

      } else if (plannedPurchases) {
        for (const purchase of plannedPurchases) {
          const dueDate = new Date(purchase.planned_date);
          const now = new Date();
          const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          let status: 'overdue' | 'due_soon' | 'upcoming' = 'upcoming';
          if (daysUntil < 0) {
            status = 'overdue';
          } else if (daysUntil <= 3) {
            status = 'due_soon';
          } else if (daysUntil <= 7) {
            status = 'upcoming';
          }

          // Only include items that are overdue, due soon, or upcoming
          if (status === 'overdue' || status === 'due_soon' || status === 'upcoming') {
            urgentItems.push({
              id: purchase.id,
              type: 'purchase',
              title: `Planned purchase: ${purchase.title}`,
              message: `Planned to buy ${purchase.title} for ${formatCurrency(purchase.price, purchase.currency)}`,
              dueDate: purchase.planned_date,
              daysUntil,
              amount: purchase.price,
              currency: purchase.currency,
              itemName: purchase.title,
              priority: status === 'overdue' ? 'high' : status === 'due_soon' ? 'medium' : 'low',
              status
            });
          }
        }
      }
    } catch (error) {

    }

    // Sort by priority and days until due
    urgentItems.sort((a, b) => {
      const priorityOrder = { overdue: 0, due_soon: 1, upcoming: 2 };
      if (priorityOrder[a.status] !== priorityOrder[b.status]) {
        return priorityOrder[a.status] - priorityOrder[b.status];
      }
      return a.daysUntil - b.daysUntil;
    });

    return urgentItems;
  }

  private async createUrgentNotification(userId: string, item: UrgentItem): Promise<void> {
    // Determine notification type and prefix first
    let notificationType: 'warning' | 'error' | 'info' = 'info';
    let urgencyPrefix = '';
    let category: 'overdue' | 'due_soon' | 'upcoming' = 'upcoming';

    if (item.status === 'overdue') {
      notificationType = 'error';
      urgencyPrefix = '🚨 URGENT: ';
      category = 'overdue';
    } else if (item.status === 'due_soon') {
      notificationType = 'warning';
      urgencyPrefix = '⚠️ DUE SOON: ';
      category = 'due_soon';
    } else {
      notificationType = 'info';
      urgencyPrefix = '📅 UPCOMING: ';
      category = 'upcoming';
    }

    const title = `${urgencyPrefix}${item.title}`;
    const body = `${item.message} - ${this.getTimeDescription(item.daysUntil)}`;
    
    // Add unique identifier to body for tracking (doesn't affect duplicate detection)
    const bodyWithId = `${body} [ID:${item.type}_${item.id}]`;

    // Check if a notification with the same title already exists (not deleted)
    // Title is stable (person name + type), body changes daily so we check by title only
    const { data: existingNotifications, error } = await supabase
      .from('notifications')
      .select('id, is_read, created_at')
      .eq('user_id', userId)
      .eq('title', title)
      .is('deleted', false)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error checking for existing notifications:', error);
      return;
    }

    // If notification exists, handle it based on read status
    if (existingNotifications && existingNotifications.length > 0) {
      const existing = existingNotifications[0];
      
      // If notification is already read, don't recreate it - user has acknowledged it
      // Only update unread notifications to reflect current status
      if (existing.is_read) {
        // Notification was read - user has acknowledged it, don't recreate
        return;
      }
      
      // Notification exists and is unread - update it to reflect current status
      // (days overdue may have changed, or status may have changed from due_soon to overdue)
      await supabase
        .from('notifications')
        .update({ 
          body: bodyWithId,
          type: notificationType
          // Keep is_read as false (don't change read status)
        })
        .eq('id', existing.id);
      return;
    }

    // Create new notification if none exists
    await createNotification(
      userId,
      title,
      notificationType,
      bodyWithId,
      true, // shouldShowToast
      category
    );
  }

  private getTimeDescription(daysUntil: number): string {
    if (daysUntil < 0) {
      return `${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? 's' : ''} overdue`;
    } else if (daysUntil === 0) {
      return 'Due today';
    } else if (daysUntil === 1) {
      return 'Due tomorrow';
    } else {
      return `Due in ${daysUntil} days`;
    }
  }

  private async updateOverdueStatus(userId: string): Promise<void> {
    try {
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      
      // Find all active records that are overdue
      const { data: overdueRecords, error: fetchError } = await supabase
        .from('lend_borrow')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .lt('due_date', todayString);

      if (fetchError) {

        return;
      }

      if (overdueRecords && overdueRecords.length > 0) {
        // Update all overdue records to 'overdue' status
        const updates = overdueRecords.map(record => ({
          id: record.id,
          status: 'overdue'
        }));

        const { error: updateError } = await supabase
          .from('lend_borrow')
          .upsert(updates, { onConflict: 'id' });

        if (updateError) {

        } else {
        }
      }
    } catch (error) {

    }
  }
}

// Export singleton instance
export const urgentNotificationService = UrgentNotificationService.getInstance();

