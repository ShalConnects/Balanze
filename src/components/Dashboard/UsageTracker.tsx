import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useFinanceStore } from '../../store/useFinanceStore';
import { supabase } from '../../lib/supabase';
import { usePlanFeatures } from '../../hooks/usePlanFeatures';
import { 
  Users, 
  Globe, 
  BarChart3, 
  AlertTriangle, 
  ArrowUpRight, 
  CheckCircle,
  XCircle,
  TrendingUp
} from 'lucide-react';

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
}

export const UsageTracker: React.FC = () => {
  const { user, profile } = useAuthStore();
  const { accounts } = useFinanceStore();
  const { 
    usageStats, 
    loading, 
    isFreePlan, 
    isPremiumPlan, 
    isAtLimit, 
    isNearLimit,
    loadUsageStats 
  } = usePlanFeatures();
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  useEffect(() => {
    if (user && accounts) {
      // Check if any limits are exceeded
      const isOverLimit = isAtLimit('accounts') || isAtLimit('currencies') || isAtLimit('transactions');
      setShowUpgradePrompt(isOverLimit && isFreePlan);
    }
  }, [user, accounts, isAtLimit, isFreePlan]);

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600 dark:text-red-400';
    if (percentage >= 75) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getUsageIcon = (percentage: number) => {
    if (percentage >= 90) return <XCircle className="w-4 h-4" />;
    if (percentage >= 75) return <AlertTriangle className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  const getUsageDisplay = (type: 'accounts' | 'currencies' | 'transactions') => {
    if (!usageStats) return { current: 0, limit: '∞', percentage: 0 };
    const stats = usageStats[type];
    return {
      current: stats.current,
      limit: stats.limit === -1 ? '∞' : stats.limit.toString(),
      percentage: stats.percentage
    };
  };

  if (!isFreePlan) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
            Premium Plan Active
          </h3>
        </div>
        <p className="text-sm text-green-700 dark:text-green-300">
          You have unlimited access to all features. No usage limits to worry about!
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!usageStats) return null;

  return (
    <div className="space-y-4">
      {/* Upgrade Prompt */}
      {showUpgradePrompt && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
              You've reached your Free plan limits!
            </h3>
          </div>
          <p className="text-sm text-red-700 dark:text-red-300 mb-3">
            Upgrade to Premium to unlock unlimited accounts, currencies, and transactions.
          </p>
          <button 
            onClick={() => window.location.href = '/settings?tab=plans'}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg text-sm font-medium hover:from-red-700 hover:to-orange-700 transition-all"
          >
            <TrendingUp className="w-4 h-4" />
            Upgrade Now
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Usage Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Your Usage
        </h3>
        
        <div className="space-y-4">
          {/* Accounts Usage */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Accounts</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {getUsageDisplay('accounts').current} / {getUsageDisplay('accounts').limit}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getUsageDisplay('accounts').limit !== '∞' && (
                <div className={`flex items-center gap-1 ${getUsageColor(getUsageDisplay('accounts').percentage)}`}>
                  {getUsageIcon(getUsageDisplay('accounts').percentage)}
                  <span className="text-sm font-medium">{Math.round(getUsageDisplay('accounts').percentage)}%</span>
                </div>
              )}
            </div>
          </div>

          {/* Currencies Usage */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Currencies</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {getUsageDisplay('currencies').current} / {getUsageDisplay('currencies').limit}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getUsageDisplay('currencies').limit !== '∞' && (
                <div className={`flex items-center gap-1 ${getUsageColor(getUsageDisplay('currencies').percentage)}`}>
                  {getUsageIcon(getUsageDisplay('currencies').percentage)}
                  <span className="text-sm font-medium">{Math.round(getUsageDisplay('currencies').percentage)}%</span>
                </div>
              )}
            </div>
          </div>

          {/* Transactions Usage */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Transactions</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {getUsageDisplay('transactions').current} / {getUsageDisplay('transactions').limit}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getUsageDisplay('transactions').limit !== '∞' && (
                <div className={`flex items-center gap-1 ${getUsageColor(getUsageDisplay('transactions').percentage)}`}>
                  {getUsageIcon(getUsageDisplay('transactions').percentage)}
                  <span className="text-sm font-medium">{Math.round(getUsageDisplay('transactions').percentage)}%</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upgrade CTA */}
        {!showUpgradePrompt && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button 
              onClick={() => window.location.href = '/settings?tab=plans'}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              <TrendingUp className="w-4 h-4" />
              Upgrade to Premium
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}; 