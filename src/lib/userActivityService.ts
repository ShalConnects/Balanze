// User Activity Service
// This service tracks user activities for achievement purposes

import { supabase } from './supabase';

export type ActivityType = 
  | 'login' 
  | 'analytics_view' 
  | 'premium_feature' 
  | 'transaction_created'
  | 'account_created'
  | 'category_created'
  | 'savings_goal_created'
  | 'lend_record_created'
  | 'borrow_record_created'
  | 'donation_created'
  | 'investment_created'
  | 'purchase_created'
  | 'attachment_uploaded'
  | 'loan_settled'
  | 'goal_completed'
  | 'last_wish_created';

class UserActivityService {
  private static instance: UserActivityService;

  public static getInstance(): UserActivityService {
    if (!UserActivityService.instance) {
      UserActivityService.instance = new UserActivityService();
    }
    return UserActivityService.instance;
  }

  /**
   * Track a user activity
   */
  async trackActivity(
    userId: string, 
    activityType: ActivityType, 
    activityData?: any
  ): Promise<void> {
    try {
      await supabase
        .from('user_activity')
        .insert({
          user_id: userId,
          activity_type: activityType,
          activity_data: activityData || {}
        });
    } catch (error) {
      console.error('Error tracking user activity:', error);
    }
  }

  /**
   * Track login activity
   */
  async trackLogin(userId: string): Promise<void> {
    await this.trackActivity(userId, 'login');
  }

  /**
   * Track analytics view
   */
  async trackAnalyticsView(userId: string): Promise<void> {
    await this.trackActivity(userId, 'analytics_view');
  }

  /**
   * Track premium feature usage
   */
  async trackPremiumFeature(userId: string, featureName: string): Promise<void> {
    await this.trackActivity(userId, 'premium_feature', { feature: featureName });
  }

  /**
   * Track transaction creation
   */
  async trackTransactionCreated(userId: string, transactionData?: any): Promise<void> {
    await this.trackActivity(userId, 'transaction_created', transactionData);
  }

  /**
   * Track account creation
   */
  async trackAccountCreated(userId: string, accountData?: any): Promise<void> {
    await this.trackActivity(userId, 'account_created', accountData);
  }

  /**
   * Track category creation
   */
  async trackCategoryCreated(userId: string, categoryData?: any): Promise<void> {
    await this.trackActivity(userId, 'category_created', categoryData);
  }

  /**
   * Track savings goal creation
   */
  async trackSavingsGoalCreated(userId: string, goalData?: any): Promise<void> {
    await this.trackActivity(userId, 'savings_goal_created', goalData);
  }

  /**
   * Track lend record creation
   */
  async trackLendRecordCreated(userId: string, lendData?: any): Promise<void> {
    await this.trackActivity(userId, 'lend_record_created', lendData);
  }

  /**
   * Track borrow record creation
   */
  async trackBorrowRecordCreated(userId: string, borrowData?: any): Promise<void> {
    await this.trackActivity(userId, 'borrow_record_created', borrowData);
  }

  /**
   * Track donation creation
   */
  async trackDonationCreated(userId: string, donationData?: any): Promise<void> {
    await this.trackActivity(userId, 'donation_created', donationData);
  }

  /**
   * Track investment creation
   */
  async trackInvestmentCreated(userId: string, investmentData?: any): Promise<void> {
    await this.trackActivity(userId, 'investment_created', investmentData);
  }

  /**
   * Track purchase creation
   */
  async trackPurchaseCreated(userId: string, purchaseData?: any): Promise<void> {
    await this.trackActivity(userId, 'purchase_created', purchaseData);
  }

  /**
   * Track attachment upload
   */
  async trackAttachmentUploaded(userId: string, attachmentData?: any): Promise<void> {
    await this.trackActivity(userId, 'attachment_uploaded', attachmentData);
  }

  /**
   * Track loan settlement
   */
  async trackLoanSettled(userId: string, settlementData?: any): Promise<void> {
    await this.trackActivity(userId, 'loan_settled', settlementData);
  }

  /**
   * Track goal completion
   */
  async trackGoalCompleted(userId: string, goalData?: any): Promise<void> {
    await this.trackActivity(userId, 'goal_completed', goalData);
  }

  /**
   * Track last wish creation
   */
  async trackLastWishCreated(userId: string, wishData?: any): Promise<void> {
    await this.trackActivity(userId, 'last_wish_created', wishData);
  }
}

export const userActivityService = UserActivityService.getInstance();
