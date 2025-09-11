import { useCallback } from 'react';
import { usePlanFeatures } from './usePlanFeatures';
import { useFinanceStore } from '../store/useFinanceStore';

export const useUpgradeModal = () => {
  const { usageStats } = usePlanFeatures();
  const { upgradeModal, openUpgradeModal, closeUpgradeModal } = useFinanceStore();

  const handleDatabaseError = useCallback((error: any) => {
    const errorMessage = error?.message || '';
    console.log('🔍 handleDatabaseError called with:', errorMessage);
    
    // Check for specific error types
    if (errorMessage.includes('ACCOUNT_LIMIT_EXCEEDED')) {
      console.log('✅ ACCOUNT_LIMIT_EXCEEDED detected, opening modal');
      // Use the actual limit from the error message (5 for free plan)
      const limit = 5;
      // Get current count from accounts array instead of usageStats
      const { accounts } = useFinanceStore.getState();
      const current = accounts.length;
      console.log('📊 Current accounts:', current, 'Limit:', limit);
      
      // Direct call to store function
      const store = useFinanceStore.getState();
      console.log('🔧 Calling store.openUpgradeModal directly');
      store.openUpgradeModal('limit', undefined, { current, limit, type: 'accounts' });
      console.log('🔧 Store call completed');
      
      return true;
    }
    
    if (errorMessage.includes('CURRENCY_LIMIT_EXCEEDED')) {
      const current = usageStats?.currencies.current || 1;
      const limit = usageStats?.currencies.limit || 1;
      openUpgradeModal('limit', undefined, { current, limit, type: 'currencies' });
      return true;
    }
    
    if (errorMessage.includes('TRANSACTION_LIMIT_EXCEEDED')) {
      const current = usageStats?.transactions.current || 100;
      const limit = usageStats?.transactions.limit || 100;
      openUpgradeModal('limit', undefined, { current, limit, type: 'transactions' });
      return true;
    }
    
    if (errorMessage.includes('FEATURE_NOT_AVAILABLE')) {
      // Extract feature name from error message
      let feature = 'Premium feature';
      if (errorMessage.includes('Custom categories')) {
        feature = 'Custom Categories';
      } else if (errorMessage.includes('Lend & Borrow')) {
        feature = 'Lend & Borrow Tracking';
      } else if (errorMessage.includes('Last Wish')) {
        feature = 'Last Wish - Digital Time Capsule';
      }
      openUpgradeModal('feature', feature);
      return true;
    }
    
    return false; // Not a plan-related error
  }, [usageStats, openUpgradeModal]);

  // Convenience methods for common scenarios
  const showAccountLimitModal = useCallback(() => {
    const current = usageStats?.accounts.current || 5;
    const limit = usageStats?.accounts.limit || 5;
    openUpgradeModal('limit', undefined, { current, limit, type: 'accounts' });
  }, [usageStats, openUpgradeModal]);

  const showCurrencyLimitModal = useCallback(() => {
    const current = usageStats?.currencies.current || 1;
    const limit = usageStats?.currencies.limit || 1;
    openUpgradeModal('limit', undefined, { current, limit, type: 'currencies' });
  }, [usageStats, openUpgradeModal]);

  const showTransactionLimitModal = useCallback(() => {
    const current = usageStats?.transactions.current || 100;
    const limit = usageStats?.transactions.limit || 100;
    openUpgradeModal('limit', undefined, { current, limit, type: 'transactions' });
  }, [usageStats, openUpgradeModal]);

  const showFeatureUpgradeModal = useCallback((feature: string) => {
    openUpgradeModal('feature', feature);
  }, [openUpgradeModal]);

  return {
    // Modal state from store
    modalState: upgradeModal,
    openModal: openUpgradeModal,
    closeModal: closeUpgradeModal,
    
    // Error handling
    handleDatabaseError,
    showAccountLimitModal,
    showCurrencyLimitModal,
    showTransactionLimitModal,
    showFeatureUpgradeModal
  };
}; 