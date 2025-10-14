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
      // Clear old urgent notifications that are no longer relevant
      await this.clearOldUrgentNotifications(userId);
      
      // Get urgent items
      const urgentItems = await this.getUrgentItems(userId);
      
      // Create notifications for urgent items
      for (const item of urgentItems) {
        await this.createUrgentNotification(userId, item);
      }
      
    } catch (error) {

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

  private async clearOldUrgentNotifications(userId: string): Promise<void> {
    try {
      // Get all lend/borrow records that are no longer active or overdue
      const { data: inactiveLendBorrow, error: lbError } = await supabase
        .from('lend_borrow')
        .select('id')
        .eq('user_id', userId)
        .not('status', 'eq', 'active')
        .not('status', 'eq', 'overdue');

      if (lbError) {

      }

      // Get all purchases that are no longer planned
      const { data: completedPurchases, error: pError } = await supabase
        .from('purchases')
        .select('id')
        .eq('user_id', userId)
        .not('status', 'eq', 'planned');

      if (pError) {

      }

      // Clear notifications for inactive items
      const inactiveIds = [
        ...(inactiveLendBorrow || []).map(item => `lend_borrow_${item.id}`),
        ...(completedPurchases || []).map(item => `purchase_${item.id}`)
      ];

      if (inactiveIds.length > 0) {
        for (const id of inactiveIds) {
          await supabase
            .from('notifications')
            .update({ deleted: true })
            .eq('user_id', userId)
            .eq('type', 'urgent');
        }
      }
    } catch (error) {

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
    // Create a unique identifier for this urgent item
    const uniqueIdentifier = `${item.type}_${item.id}`;
    
    // Check if any notification (read or unread, not deleted) already exists for this specific item
    const { data: existingNotifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .is('deleted', false);

    if (error) {

      return;
    }

    // Find if any notification contains the unique identifier in the body
    const alreadyExists = (existingNotifications || []).some((n) => n.title === title && n.body === body);
    if (alreadyExists) {
      // Don't create duplicate notifications - one already exists
      return;
    }

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

    // Create the notification directly in the database
    await createNotification(
      userId,
      title,
      notificationType,
      body,
      true, // isUrgent
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

