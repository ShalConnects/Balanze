import React from 'react';
import { AlertTriangle, ArrowUpRight, Star, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UpgradePromptProps {
  type: 'limit' | 'feature' | 'usage';
  feature?: string;
  message?: string;
  showUpgradeButton?: boolean;
  className?: string;
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  type,
  feature,
  message,
  showUpgradeButton = true,
  className = '',
}) => {
  const navigate = useNavigate();

  const getPromptContent = () => {
    switch (type) {
      case 'limit':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />,
          title: 'Limit Reached',
          message: message || 'You\'ve reached your Free plan limit. Upgrade to Premium for unlimited access.',
          bgColor: 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
          textColor: 'text-red-800 dark:text-red-200',
        };
      
      case 'feature':
        return {
          icon: <Star className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
          title: 'Premium Feature',
          message: message || `${feature} is a Premium feature. Upgrade to unlock this and more.`,
          bgColor: 'bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20',
          borderColor: 'border-purple-200 dark:border-purple-800',
          textColor: 'text-purple-800 dark:text-purple-200',
        };
      
      case 'usage':
        return {
          icon: <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />,
          title: 'Getting Close',
          message: message || 'You\'re approaching your Free plan limits. Consider upgrading to Premium.',
          bgColor: 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
          textColor: 'text-yellow-800 dark:text-yellow-200',
        };
      
      default:
        return {
          icon: <Star className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
          title: 'Upgrade Available',
          message: message || 'Upgrade to Premium for more features and unlimited access.',
          bgColor: 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          textColor: 'text-blue-800 dark:text-blue-200',
        };
    }
  };

  const content = getPromptContent();

  const handleUpgrade = () => {
    navigate('/settings?tab=plans-usage');
  };

  return (
    <div className={`${content.bgColor} ${content.borderColor} border rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        {content.icon}
        <div className="flex-1">
          <h4 className={`text-sm font-semibold ${content.textColor} mb-1`}>
            {content.title}
          </h4>
          <p className={`text-sm ${content.textColor.replace('800', '700').replace('200', '300')} mb-3`}>
            {content.message}
          </p>
          {showUpgradeButton && (
            <button
              onClick={handleUpgrade}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md text-xs font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              <Star className="w-3 h-3" />
              Upgrade to Premium
              <ArrowUpRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Specialized upgrade prompts for common scenarios
export const AccountLimitPrompt: React.FC<{ current: number; limit: number }> = ({ current, limit }) => (
  <UpgradePrompt
    type="limit"
    feature="accounts"
    message={`You have ${current}/${limit} accounts. Upgrade to Premium for unlimited accounts.`}
  />
);

export const CurrencyLimitPrompt: React.FC<{ current: number; limit: number }> = ({ current, limit }) => (
  <UpgradePrompt
    type="limit"
    feature="currencies"
    message={`You have ${current}/${limit} currencies. Upgrade to Premium for unlimited currencies.`}
  />
);

export const TransactionLimitPrompt: React.FC<{ current: number; limit: number }> = ({ current, limit }) => (
  <UpgradePrompt
    type="limit"
    feature="transactions"
    message={`You have ${current}/${limit} transactions. Upgrade to Premium for unlimited transactions.`}
  />
);

export const FeatureUpgradePrompt: React.FC<{ feature: string; message?: string }> = ({ feature, message }) => (
  <UpgradePrompt
    type="feature"
    feature={feature}
    message={message}
  />
);

export const UsageWarningPrompt: React.FC<{ type: string; percentage: number }> = ({ type, percentage }) => (
  <UpgradePrompt
    type="usage"
    message={`You're using ${percentage}% of your ${type} limit. Consider upgrading to Premium.`}
  />
); 

