// Achievement Service
// This service handles checking and awarding achievements based on user actions

import { supabase } from './supabase';
import { 
  Achievement, 
  UserAchievement, 
  AchievementProgress, 
  AchievementCheckResult, 
  AchievementNotification,
  AchievementAction,
  UserAchievementSummary
} from '../types/achievement';

class AchievementService {
  private static instance: AchievementService;

  public static getInstance(): AchievementService {
    if (!AchievementService.instance) {
      AchievementService.instance = new AchievementService();
    }
    return AchievementService.instance;
  }

  /**
   * Check and award achievements based on user action
   */
  async checkAchievements(
    userId: string, 
    action: AchievementAction, 
    data?: any
  ): Promise<AchievementCheckResult> {
    try {
      // Get all active achievements
      const { data: achievements, error: achievementsError } = await supabase
        .from('achievements')
        .select('*')
        .eq('is_active', true);

      if (achievementsError) {
        console.error('Error fetching achievements:', achievementsError);
        return { earned: [], progress: [], notifications: [] };
      }

      // Get user's current achievements
      const { data: userAchievements, error: userAchievementsError } = await supabase
        .from('user_achievements')
        .select('achievement_id')
        .eq('user_id', userId);

      if (userAchievementsError) {
        console.error('Error fetching user achievements:', userAchievementsError);
        return { earned: [], progress: [], notifications: [] };
      }

      const earnedAchievementIds = new Set(userAchievements?.map(ua => ua.achievement_id) || []);
      const earned: UserAchievement[] = [];
      const progress: AchievementProgress[] = [];
      const notifications: AchievementNotification[] = [];

      // Check each achievement
      for (const achievement of achievements || []) {
        if (earnedAchievementIds.has(achievement.id)) {
          continue; // Already earned
        }

        const checkResult = await this.checkAchievementRequirement(
          userId, 
          achievement, 
          action, 
          data
        );

        if (checkResult.earned) {
          // Award the achievement
          const newAchievement = await this.awardAchievement(userId, achievement.id);
          if (newAchievement) {
            earned.push(newAchievement);
            notifications.push({
              type: 'new_achievement',
              achievement,
              message: `🎉 Congratulations! You earned the "${achievement.name}" badge!`
            });
          }
        } else if (checkResult.progress) {
          // Update progress
          await this.updateAchievementProgress(userId, achievement.id, checkResult.progress);
          progress.push(checkResult.progress);
          
          if (checkResult.progressPercentage > 0) {
            notifications.push({
              type: 'progress_update',
              achievement,
              message: `📈 Progress on "${achievement.name}": ${checkResult.progressPercentage}%`,
              progress: checkResult.progressPercentage,
              total: 100
            });
          }
        }
      }

      return { earned, progress, notifications };
    } catch (error) {
      console.error('Error checking achievements:', error);
      return { earned: [], progress: [], notifications: [] };
    }
  }

  /**
   * Check if a specific achievement requirement is met
   */
  private async checkAchievementRequirement(
    userId: string,
    achievement: Achievement,
    action: AchievementAction,
    data?: any
  ): Promise<{ earned: boolean; progress?: AchievementProgress; progressPercentage?: number }> {
    const requirements = achievement.requirements;
    const requiredAction = requirements.action;

    // Check if this achievement is relevant to the current action
    if (requiredAction !== action) {
      return { earned: false };
    }

    switch (requiredAction) {
      case 'create_account':
        return await this.checkAccountCreation(userId, requirements);
      
      case 'create_transaction':
        return await this.checkTransactionCreation(userId, requirements);
      
      case 'create_category':
        return await this.checkCategoryCreation(userId, requirements);
      
      case 'create_savings_goal':
        return await this.checkSavingsGoalCreation(userId, requirements);
      
      case 'daily_tracking':
        return await this.checkDailyTracking(userId, requirements);
      
      case 'multi_currency':
        return await this.checkMultiCurrency(userId, requirements);
      
      case 'savings_amount':
        return await this.checkSavingsAmount(userId, requirements);
      
      case 'complete_goal':
        return await this.checkGoalCompletion(userId, requirements);
      
      case 'create_lend_record':
        return await this.checkLendRecordCreation(userId, requirements);
      
      case 'create_borrow_record':
        return await this.checkBorrowRecordCreation(userId, requirements);
      
      case 'settle_loan':
        return await this.checkLoanSettlement(userId, requirements);
      
      case 'create_purchase':
        return await this.checkPurchaseCreation(userId, requirements);
      
      case 'upload_attachment':
        return await this.checkAttachmentUpload(userId, requirements);
      
      case 'create_investment':
        return await this.checkInvestmentCreation(userId, requirements);
      
      case 'view_analytics':
        return await this.checkAnalyticsView(userId, requirements);
      
      case 'create_donation':
        return await this.checkDonationCreation(userId, requirements);
      
      case 'donation_total':
        return await this.checkDonationTotal(userId, requirements);
      
      case 'daily_login':
        return await this.checkDailyLogin(userId, requirements);
      
      case 'use_premium_feature':
        return await this.checkPremiumFeatureUsage(userId, requirements);
      
      case 'create_last_wish':
        return await this.checkLastWishCreation(userId, requirements);
      
      default:
        return { earned: false };
    }
  }

  /**
   * Award an achievement to a user
   */
  private async awardAchievement(userId: string, achievementId: string): Promise<UserAchievement | null> {
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .insert({
          user_id: userId,
          achievement_id: achievementId
        })
        .select(`
          *,
          achievement:achievements(*)
        `)
        .single();

      if (error) {
        console.error('Error awarding achievement:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error awarding achievement:', error);
      return null;
    }
  }

  /**
   * Update achievement progress
   */
  private async updateAchievementProgress(
    userId: string, 
    achievementId: string, 
    progressData: AchievementProgress
  ): Promise<void> {
    try {
      await supabase
        .from('achievement_progress')
        .upsert({
          user_id: userId,
          achievement_id: achievementId,
          progress_data: progressData.progress_data,
          last_updated: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error updating achievement progress:', error);
    }
  }

  /**
   * Get user's earned achievements
   */
  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

      if (error) {
        console.error('Error fetching user achievements:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching user achievements:', error);
      return [];
    }
  }

  /**
   * Get user's achievement progress
   */
  async getAchievementProgress(userId: string): Promise<AchievementProgress[]> {
    try {
      const { data, error } = await supabase
        .from('achievement_progress')
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching achievement progress:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching achievement progress:', error);
      return [];
    }
  }

  /**
   * Get user's achievement summary
   */
  async getAchievementSummary(userId: string): Promise<UserAchievementSummary | null> {
    try {
      const { data, error } = await supabase
        .from('user_achievement_summary')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching achievement summary:', error);
        return null;
      }

      // If no data, return a default summary
      if (!data) {
        return {
          user_id: userId,
          total_achievements: 0,
          bronze_badges: 0,
          silver_badges: 0,
          gold_badges: 0,
          diamond_badges: 0,
          rainbow_badges: 0,
          total_points: 0,
          last_achievement_earned: null
        };
      }

      return data;
    } catch (error) {
      console.error('Error fetching achievement summary:', error);
      return null;
    }
  }

  // Individual achievement check methods
  private async checkAccountCreation(userId: string, requirements: any) {
    const { data } = await supabase
      .from('accounts')
      .select('id')
      .eq('user_id', userId);

    const count = data?.length || 0;
    const required = requirements.count || 1;
    
    return {
      earned: count >= required,
      progressPercentage: Math.min((count / required) * 100, 100)
    };
  }

  private async checkTransactionCreation(userId: string, requirements: any) {
    const { data } = await supabase
      .from('transactions')
      .select('id')
      .eq('user_id', userId);

    const count = data?.length || 0;
    const required = requirements.count || 1;
    
    return {
      earned: count >= required,
      progressPercentage: Math.min((count / required) * 100, 100)
    };
  }

  private async checkCategoryCreation(userId: string, requirements: any) {
    const { data } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', userId);

    const count = data?.length || 0;
    const required = requirements.count || 1;
    
    return {
      earned: count >= required,
      progressPercentage: Math.min((count / required) * 100, 100)
    };
  }

  private async checkSavingsGoalCreation(userId: string, requirements: any) {
    const { data } = await supabase
      .from('savings_goals')
      .select('id')
      .eq('user_id', userId);

    const count = data?.length || 0;
    const required = requirements.count || 1;
    
    return {
      earned: count >= required,
      progressPercentage: Math.min((count / required) * 100, 100)
    };
  }

  private async checkDailyTracking(userId: string, requirements: any) {
    // Check for consecutive days of activity
    const { data } = await supabase
      .from('transactions')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!data || data.length === 0) {
      return { earned: false, progressPercentage: 0 };
    }

    // Calculate consecutive days
    const requiredStreak = requirements.streak || 7;
    let currentStreak = 0;
    let lastDate: Date | null = null;

    for (const transaction of data) {
      const transactionDate = new Date(transaction.created_at);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - transactionDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (lastDate === null) {
        lastDate = transactionDate;
        currentStreak = 1;
      } else {
        const prevDate = new Date(lastDate);
        const currentDate = new Date(transactionDate);
        const dayDiff = Math.floor((prevDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (dayDiff === 1) {
          currentStreak++;
        } else if (dayDiff > 1) {
          break;
        }
      }
    }

    return {
      earned: currentStreak >= requiredStreak,
      progressPercentage: Math.min((currentStreak / requiredStreak) * 100, 100)
    };
  }

  private async checkMultiCurrency(userId: string, requirements: any) {
    const { data } = await supabase
      .from('accounts')
      .select('currency')
      .eq('user_id', userId);

    const uniqueCurrencies = new Set(data?.map(acc => acc.currency) || []);
    const required = requirements.currencies || 2;
    
    return {
      earned: uniqueCurrencies.size >= required,
      progressPercentage: Math.min((uniqueCurrencies.size / required) * 100, 100)
    };
  }

  private async checkSavingsAmount(userId: string, requirements: any) {
    const { data } = await supabase
      .from('savings_goals')
      .select('current_amount')
      .eq('user_id', userId);

    const totalSaved = data?.reduce((sum, goal) => sum + (goal.current_amount || 0), 0) || 0;
    const required = requirements.amount || 100;
    
    return {
      earned: totalSaved >= required,
      progressPercentage: Math.min((totalSaved / required) * 100, 100)
    };
  }

  private async checkGoalCompletion(userId: string, requirements: any) {
    const { data } = await supabase
      .from('savings_goals')
      .select('id, target_amount, current_amount')
      .eq('user_id', userId);

    const completedGoals = data?.filter(goal => 
      goal.current_amount >= goal.target_amount
    ).length || 0;
    const required = requirements.count || 1;
    
    return {
      earned: completedGoals >= required,
      progressPercentage: Math.min((completedGoals / required) * 100, 100)
    };
  }

  private async checkLendRecordCreation(userId: string, requirements: any) {
    const { data } = await supabase
      .from('lend_borrow')
      .select('id')
      .eq('user_id', userId)
      .eq('type', 'lend');

    const count = data?.length || 0;
    const required = requirements.count || 1;
    
    return {
      earned: count >= required,
      progressPercentage: Math.min((count / required) * 100, 100)
    };
  }

  private async checkBorrowRecordCreation(userId: string, requirements: any) {
    const { data } = await supabase
      .from('lend_borrow')
      .select('id')
      .eq('user_id', userId)
      .eq('type', 'borrow');

    const count = data?.length || 0;
    const required = requirements.count || 1;
    
    return {
      earned: count >= required,
      progressPercentage: Math.min((count / required) * 100, 100)
    };
  }

  private async checkLoanSettlement(userId: string, requirements: any) {
    const { data } = await supabase
      .from('lend_borrow')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'settled');

    const count = data?.length || 0;
    const required = requirements.count || 1;
    
    return {
      earned: count >= required,
      progressPercentage: Math.min((count / required) * 100, 100)
    };
  }

  private async checkPurchaseCreation(userId: string, requirements: any) {
    const { data } = await supabase
      .from('purchases')
      .select('id')
      .eq('user_id', userId);

    const count = data?.length || 0;
    const required = requirements.count || 1;
    
    return {
      earned: count >= required,
      progressPercentage: Math.min((count / required) * 100, 100)
    };
  }

  private async checkAttachmentUpload(userId: string, requirements: any) {
    const { data } = await supabase
      .from('purchase_attachments')
      .select('id')
      .eq('user_id', userId);

    const count = data?.length || 0;
    const required = requirements.count || 1;
    
    return {
      earned: count >= required,
      progressPercentage: Math.min((count / required) * 100, 100)
    };
  }

  private async checkInvestmentCreation(userId: string, requirements: any) {
    const { data } = await supabase
      .from('investment_assets')
      .select('id')
      .eq('user_id', userId);

    const count = data?.length || 0;
    const required = requirements.count || 1;
    
    return {
      earned: count >= required,
      progressPercentage: Math.min((count / required) * 100, 100)
    };
  }

  private async checkAnalyticsView(userId: string, requirements: any) {
    // Check analytics view count from user activity tracking
    const { data } = await supabase
      .from('user_activity')
      .select('id')
      .eq('user_id', userId)
      .eq('activity_type', 'analytics_view');

    const count = data?.length || 0;
    const required = requirements.count || 1;
    
    return {
      earned: count >= required,
      progressPercentage: Math.min((count / required) * 100, 100)
    };
  }

  private async checkDonationCreation(userId: string, requirements: any) {
    const { data } = await supabase
      .from('donation_saving_records')
      .select('id')
      .eq('user_id', userId)
      .eq('type', 'donation');

    const count = data?.length || 0;
    const required = requirements.count || 1;
    
    return {
      earned: count >= required,
      progressPercentage: Math.min((count / required) * 100, 100)
    };
  }

  private async checkDonationTotal(userId: string, requirements: any) {
    const { data } = await supabase
      .from('donation_saving_records')
      .select('amount')
      .eq('user_id', userId)
      .eq('type', 'donation');

    const totalDonated = data?.reduce((sum, record) => sum + (record.amount || 0), 0) || 0;
    const required = requirements.amount || 500;
    
    return {
      earned: totalDonated >= required,
      progressPercentage: Math.min((totalDonated / required) * 100, 100)
    };
  }

  private async checkDailyLogin(userId: string, requirements: any) {
    // Check for consecutive days of login activity
    const { data } = await supabase
      .from('user_activity')
      .select('created_at')
      .eq('user_id', userId)
      .eq('activity_type', 'login')
      .order('created_at', { ascending: false });

    if (!data || data.length === 0) {
      return { earned: false, progressPercentage: 0 };
    }

    // Calculate consecutive days
    const requiredStreak = requirements.streak || 7;
    let currentStreak = 0;
    let lastDate: Date | null = null;

    for (const activity of data) {
      const activityDate = new Date(activity.created_at);
      
      if (lastDate === null) {
        lastDate = activityDate;
        currentStreak = 1;
      } else {
        const prevDate = new Date(lastDate);
        const currentDate = new Date(activityDate);
        const dayDiff = Math.floor((prevDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (dayDiff === 1) {
          currentStreak++;
        } else if (dayDiff > 1) {
          break;
        }
      }
    }

    return {
      earned: currentStreak >= requiredStreak,
      progressPercentage: Math.min((currentStreak / requiredStreak) * 100, 100)
    };
  }

  private async checkPremiumFeatureUsage(userId: string, requirements: any) {
    // Check premium feature usage from user activity tracking
    const { data } = await supabase
      .from('user_activity')
      .select('id')
      .eq('user_id', userId)
      .eq('activity_type', 'premium_feature');

    const count = data?.length || 0;
    const required = requirements.count || 1;
    
    return {
      earned: count >= required,
      progressPercentage: Math.min((count / required) * 100, 100)
    };
  }

  private async checkLastWishCreation(userId: string, requirements: any) {
    const { data } = await supabase
      .from('last_wish_settings')
      .select('id')
      .eq('user_id', userId);

    const count = data?.length || 0;
    const required = requirements.count || 1;
    
    return {
      earned: count >= required,
      progressPercentage: Math.min((count / required) * 100, 100)
    };
  }
}

export const achievementService = AchievementService.getInstance();
