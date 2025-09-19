import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { useFinanceStore } from '../../store/useFinanceStore';
import { supabase } from '../../lib/supabase';
import { usePlanFeatures } from '../../hooks/usePlanFeatures';
import { 
  Users, 
  Globe, 
  BarChart3, 
  CheckCircle,
  XCircle
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
      {/* Usage Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Your Usage
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Accounts Usage */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-xs font-medium text-gray-900 dark:text-white">Accounts</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {getUsageDisplay('accounts').current}/{getUsageDisplay('accounts').limit}
                </p>
              </div>
            </div>
            {getUsageDisplay('accounts').limit !== '∞' && (
              <div className={`flex items-center gap-1 ${getUsageColor(getUsageDisplay('accounts').percentage)}`}>
                {getUsageIcon(getUsageDisplay('accounts').percentage)}
                <span className="text-xs font-medium">{Math.round(getUsageDisplay('accounts').percentage)}%</span>
              </div>
            )}
          </div>

          {/* Currencies Usage */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-xs font-medium text-gray-900 dark:text-white">Currencies</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {getUsageDisplay('currencies').current}/{getUsageDisplay('currencies').limit}
                </p>
              </div>
            </div>
            {getUsageDisplay('currencies').limit !== '∞' && (
              <div className={`flex items-center gap-1 ${getUsageColor(getUsageDisplay('currencies').percentage)}`}>
                {getUsageIcon(getUsageDisplay('currencies').percentage)}
                <span className="text-xs font-medium">{Math.round(getUsageDisplay('currencies').percentage)}%</span>
              </div>
            )}
          </div>

          {/* Transactions Usage */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-xs font-medium text-gray-900 dark:text-white">Transactions</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {getUsageDisplay('transactions').current}/{getUsageDisplay('transactions').limit}
                </p>
              </div>
            </div>
            {getUsageDisplay('transactions').limit !== '∞' && (
              <div className={`flex items-center gap-1 ${getUsageColor(getUsageDisplay('transactions').percentage)}`}>
                {getUsageIcon(getUsageDisplay('transactions').percentage)}
                <span className="text-xs font-medium">{Math.round(getUsageDisplay('transactions').percentage)}%</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}; 