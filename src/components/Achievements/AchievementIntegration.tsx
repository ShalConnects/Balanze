// Achievement Integration Component
// Integrates achievement checking with existing user actions

import React, { useEffect } from 'react';
import { useAchievementStore } from '../../store/achievementStore';
import { useAuthStore } from '../../store/authStore';
import { AchievementNotification } from './AchievementNotification';
import { AchievementAction } from '../../types/achievement';

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

/** Call from anywhere (non-React callbacks, stores) — uses zustand getState, not hooks. */
export const triggerAchievementCheck = (action: AchievementAction, data?: unknown) => {
  useAchievementStore.getState().checkAndAwardAchievements(action, data);
};

/** React components that need the same API can use this thin wrapper. */
export const useAchievementTrigger = () => ({ triggerAchievementCheck });

export const achievementTriggers = {
  onAccountCreated: (data: unknown) => triggerAchievementCheck('create_account', data),
  onTransactionCreated: (data: unknown) => triggerAchievementCheck('create_transaction', data),
  onCategoryCreated: (data: unknown) => triggerAchievementCheck('create_category', data),
  onSavingsGoalCreated: (data: unknown) => triggerAchievementCheck('create_savings_goal', data),
  onSavingsGoalCompleted: (data: unknown) => triggerAchievementCheck('complete_goal', data),
  onLendRecordCreated: (data: unknown) => triggerAchievementCheck('create_lend_record', data),
  onBorrowRecordCreated: (data: unknown) => triggerAchievementCheck('create_borrow_record', data),
  onLoanSettled: (data: unknown) => triggerAchievementCheck('settle_loan', data),
  onPurchaseCreated: (data: unknown) => triggerAchievementCheck('create_purchase', data),
  onAttachmentUploaded: (data: unknown) => triggerAchievementCheck('upload_attachment', data),
  onInvestmentCreated: (data: unknown) => triggerAchievementCheck('create_investment', data),
  onAnalyticsViewed: (data: unknown) => triggerAchievementCheck('view_analytics', data),
  onDonationCreated: (data: unknown) => triggerAchievementCheck('create_donation', data),
  onPremiumFeatureUsed: (data: unknown) => triggerAchievementCheck('use_premium_feature', data),
  onLastWishCreated: (data: unknown) => triggerAchievementCheck('create_last_wish', data),
  onDailyLogin: (data: unknown) => triggerAchievementCheck('daily_login', data),
  onDailyTracking: (data: unknown) => triggerAchievementCheck('daily_tracking', data)
};
