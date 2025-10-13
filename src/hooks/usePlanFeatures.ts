import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { useState, useEffect } from 'react';

interface PlanFeatures {
  max_accounts: number;
  max_transactions: number;
  max_currencies: number;
  max_purchases: number;
  analytics: boolean;
  priority_support: boolean;
  export_data: boolean;
  custom_categories: boolean;
  lend_borrow: boolean;
  last_wish: boolean;
  advanced_charts: boolean;
  advanced_reporting: boolean;
}

interface UsageStats {
  accounts: {
    current: number;
    limit: number;
    percentage: number;
  };
  currencies: {
    current: number;
    limit: number;
    percentage: number;
  };
  transactions: {
    current: number;
    limit: number;
    percentage: number;
  };
  purchases: {
    current: number;
    limit: number;
    percentage: number;
  };
}

export const usePlanFeatures = () => {
  const { user, profile } = useAuthStore();
  const [features, setFeatures] = useState<PlanFeatures | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  const currentPlan = profile?.subscription?.plan || 'free';
  const isFreePlan = currentPlan === 'free';
  const isPremiumPlan = currentPlan === 'premium';

  useEffect(() => {
    if (user) {
      loadPlanFeatures();
      loadUsageStats();
    }
  }, [user, profile]);

  const loadPlanFeatures = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_user_plan_features', { user_uuid: user?.id });

      if (error) throw error;
      setFeatures(data);
    } catch (error) {
      console.error('Error loading plan features:', error);
      // Set default free features
      setFeatures({
        max_accounts: 3,
        max_transactions_per_month: 25,
        max_currencies: 1,
        max_purchases: 50,
        analytics: false,
        priority_support: false,
        export_data: false,
        custom_categories: false,
        lend_borrow: false,
        last_wish: false,
        advanced_charts: false,
        advanced_reporting: false,
      });
    }
  };

  const loadUsageStats = async () => {
    try {
      // Get monthly transaction stats
      const { data: monthlyStats, error: monthlyError } = await supabase
        .rpc('get_monthly_usage_stats', { user_uuid: user?.id });

      if (monthlyError) throw monthlyError;

      // Get other usage stats (accounts, currencies, purchases)
      const { data: otherStats, error: otherError } = await supabase
        .rpc('get_user_usage_stats', { user_uuid: user?.id });

      if (otherError) throw otherError;

      // Combine the stats
      const combinedStats = {
        ...otherStats,
        // Override transactions with monthly data
        current_month_transactions: monthlyStats?.current_month_transactions || 0,
        max_transactions_per_month: monthlyStats?.max_transactions_per_month || 25,
        percentage_used: monthlyStats?.percentage_used || 0,
        transactions_remaining: monthlyStats?.transactions_remaining || 25,
        days_remaining_in_month: monthlyStats?.days_remaining_in_month || 30,
        reset_date: monthlyStats?.reset_date
      };

      setUsageStats(combinedStats);
    } catch (error) {
      console.error('Error loading usage stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasFeature = (featureName: keyof PlanFeatures): boolean => {
    if (!features) return false;
    return features[featureName] === true;
  };

  const canCreateAccount = (): boolean => {
    if (!usageStats) return true;
    return usageStats.accounts.limit === -1 || usageStats.accounts.current < usageStats.accounts.limit;
  };

  const canAddCurrency = (currency: string): boolean => {
    if (!usageStats) return true;
    if (usageStats.currencies.limit === -1) return true;
    
    // Check if currency already exists
    // This would need to be implemented with actual currency data
    return usageStats.currencies.current < usageStats.currencies.limit;
  };

  const canCreateTransaction = (): boolean => {
    if (!usageStats) return true;
    return usageStats.transactions.limit === -1 || usageStats.transactions.current < usageStats.transactions.limit;
  };

  const canCreatePurchase = (): boolean => {
    if (!usageStats) return true;
    return usageStats.purchases.limit === -1 || usageStats.purchases.current < usageStats.purchases.limit;
  };

  const isNearLimit = (type: 'accounts' | 'currencies' | 'transactions' | 'purchases'): boolean => {
    if (!usageStats) return false;
    const stats = usageStats[type];
    return stats.percentage >= 80 && stats.percentage < 100;
  };

  const isAtLimit = (type: 'accounts' | 'currencies' | 'transactions' | 'purchases'): boolean => {
    if (!usageStats) return false;
    const stats = usageStats[type];
    return stats.percentage >= 100;
  };

  const getUpgradeMessage = (feature: string): string => {
    const messages: Record<string, string> = {
      custom_categories: 'Custom categories are a Premium feature. Upgrade to create unlimited custom categories.',
      lend_borrow: 'Lend & Borrow tracking is a Premium feature. Upgrade to track your loans and borrowings.',
      last_wish: 'Last Wish - Digital Time Capsule is a Premium feature. Upgrade to secure your digital legacy.',
      export_data: 'Data export is a Premium feature. Upgrade to export your data in CSV, Excel, or PDF formats.',
      advanced_analytics: 'Advanced analytics are a Premium feature. Upgrade for detailed insights and forecasting.',
      unlimited_accounts: 'You\'ve reached your account limit. Upgrade to Premium for unlimited accounts.',
      unlimited_currencies: 'You\'ve reached your currency limit. Upgrade to Premium for unlimited currencies.',
      unlimited_transactions: 'You\'ve reached your monthly transaction limit. Upgrade to Premium for unlimited transactions.',
      unlimited_purchases: 'You\'ve reached your purchase limit. Upgrade to Premium for unlimited purchases.',
    };
    return messages[feature] || 'This feature requires a Premium plan.';
  };

  return {
    // Plan info
    currentPlan,
    isFreePlan,
    isPremiumPlan,
    
    // Features
    features,
    hasFeature,
    
    // Usage
    usageStats,
    loading,
    canCreateAccount,
    canAddCurrency,
    canCreateTransaction,
    canCreatePurchase,
    isNearLimit,
    isAtLimit,
    
    // Utilities
    getUpgradeMessage,
    loadUsageStats, // Allow manual refresh
  };
}; 