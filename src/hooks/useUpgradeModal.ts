import { useCallback } from 'react';
import { usePlanFeatures } from './usePlanFeatures';
import { useFinanceStore } from '../store/useFinanceStore';

export const useUpgradeModal = () => {
  const { usageStats } = usePlanFeatures();
  const { upgradeModal, openUpgradeModal, closeUpgradeModal } = useFinanceStore();

  const handleDatabaseError = useCallback((error: any) => {
    const errorMessage = error?.message || '';

    
    // Check for specific error types
    if (errorMessage.includes('ACCOUNT_LIMIT_EXCEEDED')) {

      // Use the actual limit from the error message (3 for free plan)
      const limit = 3;
      // Get current count from accounts array instead of usageStats
      const { accounts } = useFinanceStore.getState();
      const current = accounts.length;

      
      // Direct call to store function
      const store = useFinanceStore.getState();

      store.openUpgradeModal('limit', undefined, { current, limit, type: 'accounts' });

      
      return true;
    }
    
    if (errorMessage.includes('CURRENCY_LIMIT_EXCEEDED')) {
      const current = usageStats?.currencies.current || 1;
      const limit = usageStats?.currencies.limit || 1;
      openUpgradeModal('limit', undefined, { current, limit, type: 'currencies' });
      return true;
    }
    
    if (errorMessage.includes('MONTHLY_TRANSACTION_LIMIT_EXCEEDED')) {
      const current = usageStats?.current_month_transactions || 0;
      const limit = usageStats?.max_transactions_per_month || 25;
      openUpgradeModal('limit', undefined, { current, limit, type: 'transactions' });
      return true;
    }
    
    if (errorMessage.includes('PURCHASE_LIMIT_EXCEEDED')) {
      const current = usageStats?.purchases?.current || 50;
      const limit = usageStats?.purchases?.limit || 50;
      openUpgradeModal('limit', undefined, { current, limit, type: 'purchases' });
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
    const current = usageStats?.accounts.current || 3;
    const limit = usageStats?.accounts.limit || 3;
    openUpgradeModal('limit', undefined, { current, limit, type: 'accounts' });
  }, [usageStats, openUpgradeModal]);

  const showCurrencyLimitModal = useCallback(() => {
    const current = usageStats?.currencies.current || 1;
    const limit = usageStats?.currencies.limit || 1;
    openUpgradeModal('limit', undefined, { current, limit, type: 'currencies' });
  }, [usageStats, openUpgradeModal]);

  const showTransactionLimitModal = useCallback(() => {
    const current = usageStats?.current_month_transactions || 0;
    const limit = usageStats?.max_transactions_per_month || 25;
    openUpgradeModal('limit', undefined, { current, limit, type: 'transactions' });
  }, [usageStats, openUpgradeModal]);

  const showPurchaseLimitModal = useCallback(() => {
    const current = usageStats?.purchases?.current || 50;
    const limit = usageStats?.purchases?.limit || 50;
    openUpgradeModal('limit', undefined, { current, limit, type: 'purchases' });
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
    showPurchaseLimitModal,
    showFeatureUpgradeModal
  };
}; 

