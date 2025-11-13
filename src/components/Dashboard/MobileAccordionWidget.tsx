import React, { useState, useEffect } from 'react';
import { ChevronDown, Calendar, FileText, TrendingUp, Sparkles } from 'lucide-react';
import { LastWishCountdownWidget } from './LastWishCountdownWidget';
// NotesAndTodosWidget loaded dynamically to reduce initial bundle size
// import { NotesAndTodosWidget } from './NotesAndTodosWidget';
import { MotivationalQuote } from './MotivationalQuote';
import { RecentTransactions } from './RecentTransactions';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface MobileAccordionWidgetProps {
  isDemo?: boolean;
  MockLastWishCountdownWidget?: React.ComponentType;
  MockRecentTransactions?: React.ComponentType;
}

export const MobileAccordionWidget: React.FC<MobileAccordionWidgetProps> = ({ 
  isDemo = false, 
  MockLastWishCountdownWidget,
  MockRecentTransactions 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { profile } = useAuthStore();
  const [NotesAndTodosWidget, setNotesAndTodosWidget] = useState<React.ComponentType | null>(null);

  // Lazy load NotesAndTodosWidget when accordion is expanded
  useEffect(() => {
    if (isExpanded && !NotesAndTodosWidget) {
      import('./NotesAndTodosWidget').then((module) => {
        setNotesAndTodosWidget(() => module.NotesAndTodosWidget);
      }).catch(() => {
        // Silently fail if widget can't be loaded
      });
    }
  }, [isExpanded, NotesAndTodosWidget]);
  
  // Check if user has Premium plan for Last Wish
  const isPremium = profile?.subscription?.plan === 'premium';

  const toggleAccordion = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="space-y-6">
      {/* Recent Transactions - Outside Accordion */}
      <div className="w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 lg:p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-blue-200/50 dark:border-blue-800/50 hover:border-blue-300 dark:hover:border-blue-700 transaction-list-mobile">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Transactions</h2>
          {!isDemo && (
            <Link 
              to="/transactions" 
              className="text-sm font-medium flex items-center space-x-1 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
          {isDemo && (
            <div className="text-sm font-medium flex items-center space-x-1 text-gray-400 cursor-not-allowed">
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          )}
        </div>
        {isDemo && MockRecentTransactions ? (
          <MockRecentTransactions />
        ) : (
          <RecentTransactions />
        )}
      </div>

      {/* Today's Overview Accordion */}
      <div className="mobile-accordion">
        {/* Accordion Header */}
        <div className="mobile-accordion-header" onClick={toggleAccordion}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                Extras
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isDemo || isPremium ? 'Last Wish • ' : ''}Daily Inspiration • Notes
              </p>
            </div>
          </div>
          <ChevronDown 
            className={`mobile-accordion-chevron w-5 h-5 text-gray-500 ${
              isExpanded ? 'rotated' : ''
            }`} 
          />
        </div>

        {/* Accordion Content */}
        <div className={`mobile-accordion-content ${isExpanded ? 'expanded' : 'collapsed'}`}>
          <div className="space-y-0">
            {/* Last Wish Section - Only for Premium users or Demo */}
            {(isDemo || isPremium) && (
              <div className="border-b border-gray-200 dark:border-gray-700">
                <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20">
                  {isDemo && MockLastWishCountdownWidget ? (
                    <MockLastWishCountdownWidget />
                  ) : (
                    <LastWishCountdownWidget />
                  )}
                </div>
              </div>
            )}

            {/* Daily Inspiration Section */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                <MotivationalQuote />
              </div>
            </div>

            {/* Premium Upgrade Prompt for Free Users */}
            {!isDemo && !isPremium && (
              <div className="border-b border-gray-200 dark:border-gray-700">
                <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-yellow-600" />
                    <h4 className="font-semibold text-yellow-900 dark:text-yellow-100">Last Wish Feature</h4>
                  </div>
                  <div className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
                    Set up automatic data sharing for your loved ones with our Last Wish feature.
                  </div>
                  <Link 
                    to="/settings?tab=lw" 
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 text-sm font-medium shadow-sm"
                  >
                    <Sparkles className="w-4 h-4" />
                    Upgrade to Premium
                  </Link>
                </div>
              </div>
            )}

            {/* Notes & Tasks Section */}
            <div>
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                {NotesAndTodosWidget ? <NotesAndTodosWidget /> : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
