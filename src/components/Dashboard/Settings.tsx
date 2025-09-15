import { useState, useEffect, useRef, useCallback } from 'react';
import { CollapsibleCategories } from './CollapsibleCategories';
import { CurrencySettings } from './CurrencySettings';
import { AccountManagement } from './AccountManagement';
import { PlansAndUsage } from './PlansAndUsage';
import { LW } from './LW';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, Settings as SettingsIcon, Filter, Check } from 'lucide-react';

interface TabItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }> | null;
  premium?: boolean;
}

export const Settings: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Initialize activeTab from URL parameter or default to general
  const getInitialTab = () => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['general', 'categories', 'account-management', 'plans-usage', 'lw'].includes(tabParam)) {
      return tabParam;
    }
    return 'general';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  
  // Touch gesture handling for mobile swipe navigation
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const contentRef = useRef<HTMLDivElement>(null);

  // Define tabs array first (needed for handleSwipe)
  const tabs: TabItem[] = [
    { id: 'general', label: 'General', icon: null },
    { id: 'categories', label: 'Categories', icon: null },
    { id: 'account-management', label: 'Account', icon: null },
    { id: 'plans-usage', label: 'Plans & Usage', icon: null },
    { id: 'lw', label: 'Legacy Management', icon: null }
  ];

  // Handle URL parameters for tab selection
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['general', 'categories', 'account-management', 'plans-usage', 'lw'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ tab }, { replace: true });
    // Close mobile menu when tab is selected
    setIsMobileMenuOpen(false);
  };

  // Handle swipe gestures for mobile navigation
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].screenX;
  }, []);

  const handleSwipe = useCallback(() => {
    const swipeThreshold = 50;
    const swipeDistance = touchStartX.current - touchEndX.current;
    
    if (Math.abs(swipeDistance) > swipeThreshold) {
      const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
      
      if (swipeDistance > 0 && currentIndex < tabs.length - 1) {
        // Swipe left - next tab
        handleTabChange(tabs[currentIndex + 1].id);
      } else if (swipeDistance < 0 && currentIndex > 0) {
        // Swipe right - previous tab
        handleTabChange(tabs[currentIndex - 1].id);
      }
    }
  }, [activeTab, tabs]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].screenX;
    handleSwipe();
  }, [handleSwipe]);

  const getActiveTabLabel = () => {
    return tabs.find(tab => tab.id === activeTab)?.label || 'General Settings';
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow dark:shadow-gray-800/50 p-0 pt-0 pb-5 px-1 sm:px-4 lg:px-6 w-full mt-0 max-w-full overflow-hidden">
      {/* Mobile Tab Selector - Enhanced with better mobile UX */}
      <div className="block sm:hidden mb-4 pt-3">
        
        <div className="relative">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-full flex items-center justify-between p-2 sm:p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 text-gray-700 dark:text-gray-100 rounded-xl border border-blue-200 dark:border-gray-600 hover:from-blue-100 hover:to-purple-100 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-200 text-left shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                <Filter className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <span className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm">
                  {getActiveTabLabel()}
                </span>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Tap to switch sections
                </div>
              </div>
            </div>
            <ChevronDown 
              className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                isMobileMenuOpen ? 'rotate-180' : ''
              }`} 
            />
          </button>
          
          {/* Enhanced Mobile Dropdown Menu */}
          {isMobileMenuOpen && (
            <div className="absolute z-50 mt-2 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 shadow-2xl rounded-xl max-h-80 overflow-y-auto">
              <div className="p-2">
                {tabs.map((tab, index) => (
                  <button
                    key={tab.id}
                    className={`w-full flex items-center justify-between text-left px-2 sm:px-3 py-2 sm:py-3 mb-1 rounded-lg transition-all duration-200 ${
                      activeTab === tab.id 
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md transform scale-[0.98]' 
                        : 'text-gray-700 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 hover:scale-[0.99]'
                    }`}
                    onClick={() => handleTabChange(tab.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        activeTab === tab.id 
                          ? 'bg-white/20 text-white' 
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-medium">{tab.label}</span>
                        {activeTab === tab.id && (
                          <div className="text-xs opacity-80 mt-0.5">Currently viewing</div>
                        )}
                      </div>
                    </div>
                    {activeTab === tab.id && (
                      <Check className="w-4 h-4" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Tab Navigation */}
      <div className="hidden sm:block">
        <nav className="flex space-x-1 mb-6 border-b border-gray-200 dark:border-gray-700" style={{ paddingTop: '0.5rem' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent border-b-2 border-blue-600 font-semibold'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              onClick={() => handleTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content - Optimized for Mobile with Swipe Support */}
      <div 
        ref={contentRef}
        className="min-h-[400px] px-1 sm:px-0 touch-pan-y"
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
        {activeTab === 'lw' && (
          <LW setActiveTab={setActiveTab} />
        )}
      </div>
      
      {/* Mobile Navigation Indicators */}
      <div className="block sm:hidden mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-2">
          <button
            onClick={() => {
              const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
              if (currentIndex > 0) {
                handleTabChange(tabs[currentIndex - 1].id);
              }
            }}
            disabled={tabs.findIndex(tab => tab.id === activeTab) === 0}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>
          
          {/* Dots indicator */}
          <div className="flex items-center gap-2">
            {tabs.map((tab, index) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`w-2 h-2 rounded-full transition-all ${
                  activeTab === tab.id 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 w-6' 
                    : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                }`}
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
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          >
            Next
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        {/* Swipe hint */}
        <div className="text-center mt-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            💡 Swipe left or right to navigate between sections
          </p>
        </div>
      </div>
    </div>
  );
};