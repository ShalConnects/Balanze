// Achievement Integration Component
// Integrates achievement checking with existing user actions

import React, { useEffect } from 'react';
import { useAchievementStore } from '../../store/achievementStore';
import { useAuthStore } from '../../store/authStore';
import { AchievementNotification } from './AchievementNotification';
import { AchievementAction } from '../../types/achievement';
import { supabase } from '../../lib/supabase';

interface AchievementIntegrationProps {
  children: React.ReactNode;
}

export const AchievementIntegration: React.FC<AchievementIntegrationProps> = ({ children }) => {
  const { 
    showAchievementNotification, 
    currentNotification, 
    setShowAchievementNotification,
    markAchievementAsViewed 
  } = useAchievementStore();
  
  const { user } = useAuthStore();

  // Initialize achievement data when user logs in
  useEffect(() => {
    if (user) {
      const { fetchUserAchievements, fetchAchievementProgress, fetchAchievementSummary } = useAchievementStore.getState();
      fetchUserAchievements(user.id);
      fetchAchievementProgress(user.id);
      fetchAchievementSummary(user.id);
    }
  }, [user]);

  const handleCloseNotification = () => {
    setShowAchievementNotification(false);
    if (currentNotification) {
      markAchievementAsViewed(currentNotification.achievement.id);
    }
  };

  return (
    <>
      {children}
      
      {/* Achievement Notification */}
      {showAchievementNotification && currentNotification && (
        <AchievementNotification
          notification={currentNotification}
          onClose={handleCloseNotification}
          autoClose={true}
          duration={5000}
        />
      )}
    </>
  );
};

// Hook for triggering achievement checks
export const useAchievementTrigger = () => {
  const { checkAndAwardAchievements } = useAchievementStore();

  const triggerAchievementCheck = (action: AchievementAction, data?: any) => {
    checkAndAwardAchievements(action, data);
  };

  return { triggerAchievementCheck };
};

// Achievement triggers for common actions
export const achievementTriggers = {
  // Account actions
  onAccountCreated: (data: any) => {
    const { triggerAchievementCheck } = useAchievementTrigger();
    triggerAchievementCheck('create_account', data);
  },

  // Transaction actions
  onTransactionCreated: (data: any) => {
    const { triggerAchievementCheck } = useAchievementTrigger();
    triggerAchievementCheck('create_transaction', data);
  },

  // Category actions
  onCategoryCreated: (data: any) => {
    const { triggerAchievementCheck } = useAchievementTrigger();
    triggerAchievementCheck('create_category', data);
  },

  // Savings goal actions
  onSavingsGoalCreated: (data: any) => {
    const { triggerAchievementCheck } = useAchievementTrigger();
    triggerAchievementCheck('create_savings_goal', data);
  },

  onSavingsGoalCompleted: (data: any) => {
    const { triggerAchievementCheck } = useAchievementTrigger();
    triggerAchievementCheck('complete_goal', data);
  },

  // Lend & Borrow actions
  onLendRecordCreated: (data: any) => {
    const { triggerAchievementCheck } = useAchievementTrigger();
    triggerAchievementCheck('create_lend_record', data);
  },

  onBorrowRecordCreated: (data: any) => {
    const { triggerAchievementCheck } = useAchievementTrigger();
    triggerAchievementCheck('create_borrow_record', data);
  },

  onLoanSettled: (data: any) => {
    const { triggerAchievementCheck } = useAchievementTrigger();
    triggerAchievementCheck('settle_loan', data);
  },

  // Purchase actions
  onPurchaseCreated: (data: any) => {
    const { triggerAchievementCheck } = useAchievementTrigger();
    triggerAchievementCheck('create_purchase', data);
  },

  onAttachmentUploaded: (data: any) => {
    const { triggerAchievementCheck } = useAchievementTrigger();
    triggerAchievementCheck('upload_attachment', data);
  },

  // Investment actions
  onInvestmentCreated: (data: any) => {
    const { triggerAchievementCheck } = useAchievementTrigger();
    triggerAchievementCheck('create_investment', data);
  },

  // Analytics actions
  onAnalyticsViewed: (data: any) => {
    const { triggerAchievementCheck } = useAchievementTrigger();
    triggerAchievementCheck('view_analytics', data);
  },

  // Donation actions
  onDonationCreated: (data: any) => {
    const { triggerAchievementCheck } = useAchievementTrigger();
    triggerAchievementCheck('create_donation', data);
  },

  // Premium feature actions
  onPremiumFeatureUsed: (data: any) => {
    const { triggerAchievementCheck } = useAchievementTrigger();
    triggerAchievementCheck('use_premium_feature', data);
  },

  onLastWishCreated: (data: any) => {
    const { triggerAchievementCheck } = useAchievementTrigger();
    triggerAchievementCheck('create_last_wish', data);
  },

  // Daily actions
  onDailyLogin: (data: any) => {
    const { triggerAchievementCheck } = useAchievementTrigger();
    triggerAchievementCheck('daily_login', data);
  },

  onDailyTracking: (data: any) => {
    const { triggerAchievementCheck } = useAchievementTrigger();
    triggerAchievementCheck('daily_tracking', data);
  }
};
