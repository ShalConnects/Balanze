import { useState, useEffect, useRef, useCallback } from 'react';
import { CollapsibleCategories } from './CollapsibleCategories';
import { CurrencySettings } from './CurrencySettings';
import { AccountManagement } from './AccountManagement';
import { PlansAndUsage } from './PlansAndUsage';
import { LW } from './LW';
import { PaymentHistory } from './PaymentHistory';
import { AboutSettings } from './AboutSettings';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, Settings as SettingsIcon, Filter, Check, Globe, FolderTree, CreditCard, User, Crown, Receipt, Info } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface TabItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }> | null;
  premium?: boolean;
}

export const Settings: React.FC = () => {
  const { profile } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Check if user has Premium plan for Last Wish
  const isPremium = profile?.subscription?.plan === 'premium';
  
  // Initialize activeTab from URL parameter or default to general
  const getInitialTab = () => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['general', 'categories', 'account-management', 'plans-usage', 'last-wish', 'about'].includes(tabParam)) {
      // If user tries to access Last Wish tab but is not premium, redirect to general
      if (tabParam === 'last-wish' && !isPremium) {
        return 'general';
      }
      return tabParam;
    }
    return 'general';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  
  // Touch gesture handling for mobile swipe navigation
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchEndY = useRef<number>(0);
  const contentRef = useRef<HTMLDivElement>(null);

  // Define tabs array first (needed for handleSwipe)
  const tabs: TabItem[] = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'categories', label: 'Categories', icon: FolderTree },
    { id: 'plans-usage', label: 'Plans & Usage', icon: CreditCard },
    { id: 'payment-history', label: 'Payment', icon: Receipt },
    { id: 'account-management', label: 'Account', icon: User },
    ...(isPremium ? [{ id: 'last-wish', label: 'Last Wish', icon: Crown, premium: true }] : []),
    { id: 'about', label: 'About', icon: Info }
  ];

  // Handle URL parameters for tab selection
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['general', 'categories', 'account-management', 'plans-usage', 'payment-history', 'last-wish', 'about'].includes(tabParam)) {
      // If user tries to access Last Wish tab but is not premium, redirect to general
      if (tabParam === 'last-wish' && !isPremium) {
        setActiveTab('general');
        setSearchParams({ tab: 'general' }, { replace: true });
      } else {
        setActiveTab(tabParam);
      }
    }
  }, [searchParams, isPremium, setSearchParams]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ tab }, { replace: true });
    // Close mobile menu when tab is selected
    setIsMobileMenuOpen(false);
  };

  // Handle swipe gestures for mobile navigation - FIXED for Android
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].screenX;
    touchStartY.current = e.changedTouches[0].screenY;
  }, []);

  const handleSwipe = useCallback(() => {
    const swipeThreshold = 80; // Increased threshold for Android
    const horizontalDistance = touchStartX.current - touchEndX.current;
    const verticalDistance = Math.abs(touchStartY.current - touchEndY.current);
    
    // Only trigger swipe if horizontal movement is significantly greater than vertical
    const isHorizontalSwipe = Math.abs(horizontalDistance) > verticalDistance * 2;
    const isSignificantSwipe = Math.abs(horizontalDistance) > swipeThreshold;
    
    if (isHorizontalSwipe && isSignificantSwipe) {
      const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
      
      if (horizontalDistance > 0 && currentIndex < tabs.length - 1) {
        // Swipe left - next tab
        handleTabChange(tabs[currentIndex + 1].id);
      } else if (horizontalDistance < 0 && currentIndex > 0) {
        // Swipe right - previous tab
        handleTabChange(tabs[currentIndex - 1].id);
      }
    }
  }, [activeTab, tabs]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].screenX;
    touchEndY.current = e.changedTouches[0].screenY;
    handleSwipe();
  }, [handleSwipe]);

  const getActiveTabLabel = () => {
    return tabs.find(tab => tab.id === activeTab)?.label || 'General Settings';
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg dark:shadow-gray-800/50 border border-gray-100 dark:border-gray-800 p-0 pt-0 pb-6 px-1 sm:px-6 lg:px-8 w-full mt-0 max-w-full overflow-hidden">
      {/* Mobile Tab Selector - Enhanced with better mobile UX */}
      <div className="block sm:hidden mb-4 sm:mb-6 pt-3 sm:pt-4">
        <div className="relative">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-full flex items-center justify-between p-3 sm:p-3.5 bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50 dark:from-gray-800 dark:via-gray-750 dark:to-gray-800 text-gray-700 dark:text-gray-100 rounded-xl sm:rounded-2xl border border-blue-200/50 dark:border-gray-600 shadow-md hover:shadow-lg hover:from-blue-100 hover:via-purple-100 hover:to-blue-100 dark:hover:from-gray-700 dark:hover:to-gray-700 transition-all duration-300 text-left"
          >
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              {(() => {
                const activeTabData = tabs.find(tab => tab.id === activeTab);
                const ActiveIcon = activeTabData?.icon;
                return (
                  <div className="p-1.5 sm:p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg sm:rounded-xl shadow-sm flex-shrink-0">
                    {ActiveIcon ? (
                      <ActiveIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                    ) : (
                      <SettingsIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                    )}
                  </div>
                );
              })()}
              <div className="min-w-0 flex-1">
                <span className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm truncate block">
                  {getActiveTabLabel()}
                </span>
                <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Tap to switch sections
                </div>
              </div>
            </div>
            <ChevronDown 
              className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400 transition-transform duration-300 flex-shrink-0 ml-2 ${
                isMobileMenuOpen ? 'rotate-180' : ''
              }`} 
            />
          </button>
          
          {/* Enhanced Mobile Dropdown Menu */}
          {isMobileMenuOpen && (
            <div className="absolute z-50 mt-2 sm:mt-3 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 shadow-2xl rounded-xl sm:rounded-2xl max-h-[70vh] sm:max-h-80 overflow-y-auto backdrop-blur-sm">
              <div className="p-2 sm:p-2.5">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      className={`w-full flex items-center justify-between text-left px-2.5 sm:px-3 py-2.5 sm:py-3 mb-1 sm:mb-1.5 rounded-lg sm:rounded-xl transition-all duration-200 ${
                        isActive 
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-[0.98]' 
                          : 'text-gray-700 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 hover:scale-[0.99]'
                      }`}
                      onClick={() => handleTabChange(tab.id)}
                    >
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        {IconComponent && (
                          <div className={`p-1 sm:p-1.5 rounded-md sm:rounded-lg flex-shrink-0 ${
                            isActive 
                              ? 'bg-white/20' 
                              : 'bg-gray-100 dark:bg-gray-700'
                          }`}>
                            <IconComponent className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                              isActive 
                                ? 'text-white' 
                                : 'text-gray-600 dark:text-gray-300'
                            }`} />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <span className="text-xs sm:text-sm font-medium truncate">{tab.label}</span>
                            {tab.premium && (
                              <span className="px-1 sm:px-1.5 py-0.5 text-[10px] sm:text-xs font-semibold bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full flex-shrink-0">
                                Pro
                              </span>
                            )}
                          </div>
                          {isActive && (
                            <div className="text-[10px] sm:text-xs opacity-90 mt-0.5">Currently viewing</div>
                          )}
                        </div>
                      </div>
                      {isActive && (
                        <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Tab Navigation */}
      <div className="hidden sm:block">
        <nav className="flex space-x-1 sm:space-x-2 mb-6 sm:mb-8 border-b border-gray-200 dark:border-gray-700 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" style={{ paddingTop: '1rem' }}>
          <div className="flex min-w-max">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  className={`group relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-medium rounded-t-xl transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                  onClick={() => handleTabChange(tab.id)}
                >
                  {IconComponent && (
                    <IconComponent className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-all duration-200 flex-shrink-0 ${
                      isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                    }`} />
                  )}
                  <span>{tab.label}</span>
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full" />
                  )}
                  {tab.premium && (
                    <span className="ml-0.5 sm:ml-1 px-1 sm:px-1.5 py-0.5 text-[10px] sm:text-xs font-semibold bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full flex-shrink-0">
                      Pro
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Tab Content - Optimized for Mobile with Swipe Support */}
      <div 
        ref={contentRef}
        className="min-h-[400px] px-1 sm:px-0 touch-pan-y transition-all duration-300"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {activeTab === 'general' && (
          <CurrencySettings />
        )}
        {activeTab === 'categories' && (
          <CollapsibleCategories hideTitle />
        )}
        {activeTab === 'account-management' && (
          <AccountManagement hideTitle />
        )}
        {activeTab === 'plans-usage' && (
          <PlansAndUsage hideTitle />
        )}
        {activeTab === 'payment-history' && (
          <PaymentHistory hideTitle />
        )}
        {activeTab === 'about' && (
          <AboutSettings hideTitle />
        )}
        {activeTab === 'last-wish' && (
          <LW setActiveTab={setActiveTab} />
        )}
      </div>
      
      {/* Mobile Navigation Indicators */}
      <div className="block sm:hidden mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-1 sm:px-2">
          <button
            onClick={() => {
              const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
              if (currentIndex > 0) {
                handleTabChange(tabs[currentIndex - 1].id);
              }
            }}
            disabled={tabs.findIndex(tab => tab.id === activeTab) === 0}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 disabled:opacity-40 disabled:cursor-not-allowed hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden min-[375px]:inline">Previous</span>
          </button>
          
          {/* Dots indicator */}
          <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-50 dark:bg-gray-800 rounded-full">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`rounded-full transition-all duration-300 ${
                  activeTab === tab.id 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 w-5 sm:w-6 h-1.5 sm:h-2 shadow-sm' 
                    : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 w-1.5 sm:w-2 h-1.5 sm:h-2'
                }`}
                aria-label={`Go to ${tab.label}`}
              />
            ))}
          </div>
          
          <button
            onClick={() => {
              const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
              if (currentIndex < tabs.length - 1) {
                handleTabChange(tabs[currentIndex + 1].id);
              }
            }}
            disabled={tabs.findIndex(tab => tab.id === activeTab) === tabs.length - 1}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 disabled:opacity-40 disabled:cursor-not-allowed hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
          >
            <span className="hidden min-[375px]:inline">Next</span>
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        {/* Swipe hint */}
        <div className="text-center mt-3 sm:mt-4">
          <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1 sm:gap-1.5">
            <span className="text-sm sm:text-base">💡</span>
            <span className="hidden min-[375px]:inline">Swipe left or right to navigate between sections</span>
            <span className="min-[375px]:hidden">Swipe to navigate</span>
          </p>
        </div>
      </div>
    </div>
  );
};

