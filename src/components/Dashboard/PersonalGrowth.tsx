import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, Check, Sparkles, Sprout, BookOpen, Heart, Trophy } from 'lucide-react';
import { HabitGarden } from '../Habits/HabitGarden';
import { CoursesList } from '../Learning/CoursesList';
import { FavoriteQuotes } from '../../pages/FavoriteQuotes';
import Achievements from '../../pages/Achievements';

interface TabItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }> | null;
}

export const PersonalGrowth: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Initialize activeTab from URL parameter or default to habits
  const getInitialTab = () => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['habits', 'learning', 'favorite-quotes', 'achievements'].includes(tabParam)) {
      return tabParam;
    }
    return 'habits';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  // Touch gesture handling for mobile swipe navigation
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchEndY = useRef<number>(0);
  const contentRef = useRef<HTMLDivElement>(null);

  // Define tabs array (must be before callbacks that use it)
  const tabs: TabItem[] = [
    { id: 'habits', label: 'Habits', icon: Sprout },
    { id: 'learning', label: 'Learning', icon: BookOpen },
    { id: 'favorite-quotes', label: 'Favorite Quotes', icon: Heart },
    { id: 'achievements', label: 'Achievements', icon: Trophy }
  ];

  // Handle URL parameters for tab selection
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['habits', 'learning', 'favorite-quotes', 'achievements'].includes(tabParam)) {
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
    return tabs.find(tab => tab.id === activeTab)?.label || 'Personal Growth';
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg dark:shadow-gray-800/50 border border-gray-100 dark:border-gray-800 p-0 pt-0 pb-6 px-4 w-full mt-0 max-w-full overflow-hidden">
      {/* Mobile Tab Selector - Enhanced with better mobile UX */}
      <div className="block sm:hidden mb-4 pt-3 sm:pt-4">
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
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
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
        <nav className="flex space-x-1 sm:space-x-2 mb-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" style={{ paddingTop: '1rem' }}>
          <div className="flex min-w-max">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  className={`group relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm font-medium rounded-t-xl transition-all duration-200 whitespace-nowrap ${
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
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Tab Content - Optimized for Mobile with Swipe Support */}
      <div 
        ref={contentRef}
        className="min-h-[400px] px-0 touch-pan-y transition-all duration-300"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {activeTab === 'habits' && (
          <HabitGarden />
        )}
        {activeTab === 'learning' && (
          <CoursesList />
        )}
        {activeTab === 'favorite-quotes' && (
          <FavoriteQuotes />
        )}
        {activeTab === 'achievements' && (
          <Achievements />
        )}
      </div>
      
      {/* Mobile Navigation Indicators */}
      <div className="block sm:hidden mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-2 sm:px-3">
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
