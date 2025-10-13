import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { useFinanceStore } from '../../store/useFinanceStore';
import { supabase } from '../../lib/supabase';
import { usePlanFeatures } from '../../hooks/usePlanFeatures';
import { 
  Users, 
  Globe, 
  BarChart3, 
  ShoppingBag,
  CheckCircle,
  XCircle,
  AlertTriangle
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
  purchases: {
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

  const getUsageDisplay = (type: 'accounts' | 'currencies' | 'transactions' | 'purchases') => {
    // Handle monthly usage stats structure for transactions
    if (type === 'transactions' && usageStats && 'current_month_transactions' in usageStats) {
      const current = (usageStats as any).current_month_transactions || 0;
      const limitNum = (usageStats as any).max_transactions_per_month || -1;
      const percentage = (usageStats as any).percentage_used || 0;
      return {
        current,
        limit: limitNum === -1 ? '∞' : String(limitNum),
        percentage
      };
    }
    
    // Handle other types with combined stats structure
    const stats: any = usageStats ? (usageStats as any)[type] : null;
    const current = typeof stats?.current === 'number' ? stats.current : 0;
    const limitNum = typeof stats?.limit === 'number' ? stats.limit : -1;
    const percentage = typeof stats?.percentage === 'number' ? stats.percentage : 0;
    return {
      current,
      limit: limitNum === -1 ? '∞' : String(limitNum),
      percentage
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

  const getRecommendationMessage = (type: 'accounts' | 'currencies' | 'transactions' | 'purchases') => {
    const stats = getUsageDisplay(type);
    const percentage = stats.percentage;
    
    if (percentage >= 100) {
      if (type === 'transactions') {
        return `You've reached your monthly transaction limit. Consider upgrading for unlimited transactions.`;
      }
      return `You've reached your ${type} limit. Consider upgrading for unlimited ${type}.`;
    } else if (percentage >= 80) {
      if (type === 'transactions') {
        return `You're using ${stats.current}/${stats.limit} transactions this month. Consider upgrading soon.`;
      }
      return `You're using ${stats.current}/${stats.limit} ${type}. Consider upgrading soon.`;
    } else {
      if (type === 'transactions') {
        return `You have plenty of transaction capacity remaining this month.`;
      }
      return `You have plenty of ${type} capacity remaining.`;
    }
  };

  const getRecommendationIcon = (type: 'accounts' | 'currencies' | 'transactions' | 'purchases') => {
    const stats = getUsageDisplay(type);
    const percentage = stats.percentage;
    
    if (percentage >= 100) {
      return <XCircle className="w-4 h-4 text-red-500" />;
    } else if (percentage >= 80) {
      return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    } else {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Usage Cards with Sliding Progress Bars */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Accounts Usage Card */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              {getRecommendationIcon('accounts')}
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Account Limit</h4>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              {getRecommendationMessage('accounts')}
            </p>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {getUsageDisplay('accounts').current}/{getUsageDisplay('accounts').limit}
                </span>
              </div>
              {getUsageDisplay('accounts').limit !== '∞' && (
                <div className={`flex items-center gap-1 ${getUsageColor(getUsageDisplay('accounts').percentage)}`}>
                  {getUsageIcon(getUsageDisplay('accounts').percentage)}
                  <span className="text-xs font-medium">{Math.round(getUsageDisplay('accounts').percentage)}%</span>
                </div>
              )}
            </div>
            {/* Sliding Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full transition-all duration-1000 ease-out shadow-lg"
                style={{ 
                  width: `${Math.min(getUsageDisplay('accounts').percentage, 100)}%`,
                  boxShadow: '0 0 10px rgba(251, 191, 36, 0.3)'
                }}
              />
            </div>
          </div>

          {/* Currencies Usage Card */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              {getRecommendationIcon('currencies')}
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Currency Limit</h4>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              {getRecommendationMessage('currencies')}
            </p>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {getUsageDisplay('currencies').current}/{getUsageDisplay('currencies').limit}
                </span>
              </div>
              {getUsageDisplay('currencies').limit !== '∞' && (
                <div className={`flex items-center gap-1 ${getUsageColor(getUsageDisplay('currencies').percentage)}`}>
                  {getUsageIcon(getUsageDisplay('currencies').percentage)}
                  <span className="text-xs font-medium">{Math.round(getUsageDisplay('currencies').percentage)}%</span>
                </div>
              )}
            </div>
            {/* Sliding Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-red-400 to-red-500 rounded-full transition-all duration-1000 ease-out shadow-lg"
                style={{ 
                  width: `${Math.min(getUsageDisplay('currencies').percentage, 100)}%`,
                  boxShadow: '0 0 10px rgba(239, 68, 68, 0.3)'
                }}
              />
            </div>
          </div>

          {/* Transactions Usage Card */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              {getRecommendationIcon('transactions')}
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                Transactions {isFreePlan && <span className="text-xs text-gray-500">(per month)</span>}
              </h4>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              {getRecommendationMessage('transactions')}
              {isFreePlan && usageStats && 'reset_date' in usageStats && (
                <span className="block mt-1 text-gray-500">
                  Resets on {(usageStats as any).reset_date}
                </span>
              )}
            </p>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {getUsageDisplay('transactions').current}/{getUsageDisplay('transactions').limit}
                </span>
              </div>
              {getUsageDisplay('transactions').limit !== '∞' && (
                <div className={`flex items-center gap-1 ${getUsageColor(getUsageDisplay('transactions').percentage)}`}>
                  {getUsageIcon(getUsageDisplay('transactions').percentage)}
                  <span className="text-xs font-medium">{Math.round(getUsageDisplay('transactions').percentage)}%</span>
                </div>
              )}
            </div>
            {/* Sliding Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-1000 ease-out shadow-lg"
                style={{ 
                  width: `${Math.min(getUsageDisplay('transactions').percentage, 100)}%`,
                  boxShadow: '0 0 10px rgba(34, 197, 94, 0.3)'
                }}
              />
            </div>
          </div>

          {/* Purchases Usage Card */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              {getRecommendationIcon('purchases')}
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Purchases</h4>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              {getRecommendationMessage('purchases')}
            </p>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {getUsageDisplay('purchases').current}/{getUsageDisplay('purchases').limit}
                </span>
              </div>
              {getUsageDisplay('purchases').limit !== '∞' && (
                <div className={`flex items-center gap-1 ${getUsageColor(getUsageDisplay('purchases').percentage)}`}>
                  {getUsageIcon(getUsageDisplay('purchases').percentage)}
                  <span className="text-xs font-medium">{Math.round(getUsageDisplay('purchases').percentage)}%</span>
                </div>
              )}
            </div>
            {/* Sliding Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all duration-1000 ease-out shadow-lg"
                style={{ 
                  width: `${Math.min(getUsageDisplay('purchases').percentage, 100)}%`,
                  boxShadow: '0 0 10px rgba(59, 130, 246, 0.3)'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 