import React, { useState, useEffect } from 'react';
import { X, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface UpgradeBannerProps {
  className?: string;
}

export const UpgradeBanner: React.FC<UpgradeBannerProps> = ({ className = '' }) => {
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if user is on free plan
  const isFreeUser = profile?.subscription?.plan === 'free';

  // Check localStorage for dismissed state
  useEffect(() => {
    if (isFreeUser) {
      const dismissed = localStorage.getItem('upgradeBannerDismissed');
      setIsDismissed(dismissed === 'true');
    }
  }, [isFreeUser]);

  // Don't show if user is premium or banner is dismissed
  if (!isFreeUser || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    localStorage.setItem('upgradeBannerDismissed', 'true');
    setIsDismissed(true);
  };

  const handleUpgrade = () => {
    navigate('/settings?tab=plans-usage');
  };

  return (
    <div className={`bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-blue-900/20 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-200/50 dark:border-blue-800/50 shadow-sm relative ${className}`}>
      <button
        onClick={handleDismiss}
        className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 p-1 sm:p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 touch-manipulation min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center"
        aria-label="Dismiss upgrade banner"
      >
        <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </button>
      
      <div className="flex items-start gap-2 sm:gap-3 pr-7 sm:pr-8">
        <div className="p-1.5 sm:p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex-shrink-0">
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-0.5 sm:mb-1">
            Unlock Premium Features
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-2 sm:mb-3 leading-relaxed">
            Get unlimited accounts, currencies, transactions, and access to advanced features like Lend & Borrow tracking.
          </p>
          <button
            onClick={handleUpgrade}
            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-sm hover:shadow-md w-full sm:w-auto touch-manipulation min-h-[44px] sm:min-h-0"
          >
            <span>Upgrade to Premium</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
};

