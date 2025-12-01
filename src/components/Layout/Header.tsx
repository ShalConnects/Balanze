import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { Menu, Bell, Search, Sun, Moon, User, Settings, LogOut, ArrowLeftRight, LifeBuoy, Globe, Heart, Quote, X, BookOpen, Sparkles, RefreshCw, Trophy, Edit3 } from 'lucide-react';
import { format, isToday, isThisWeek } from 'date-fns';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { NotificationDropdown } from './NotificationDropdown';
import { useNotificationsStore } from '../../store/notificationsStore';
import { ProfileEditModal } from './ProfileEditModal';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { GlobalSearchDropdown } from './GlobalSearchDropdown';
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { triggerHapticFeedback } from '../../utils/hapticFeedback';
import { toast } from 'sonner';
import { RetryMechanism } from '../../utils/retryMechanism';
import { useGranularLoading } from '../../utils/loadingStates';
import { useSmartRefresh } from '../../utils/smartRefresh';
import { useAccessibility } from '../../utils/accessibilityEnhancements';

interface HeaderProps {
    onMenuToggle: () => void;
    title: string;
    subtitle?: string | React.ReactNode;
}

const navigation = [
    { name: 'Dashboard', href: '/' },
    { name: 'Transactions', href: '/transactions' },
    { name: 'Accounts', href: '/accounts' },
    { name: 'Reports', href: '/reports' },
    { name: 'Savings', href: '/savings' },
];

const formatTimeAgo = (date: Date | string | null | undefined) => {
  if (!date) return 'Never';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return 'Never';
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  const diffInHours = Math.floor(diffInSeconds / 3600);

  // Recent: "2 hours ago" (if < 24 hours)
  if (diffInHours < 24) {
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    return `${diffInHours}h ago`;
  }

  // Today: "Today at 3:45 PM" (if same day)
  if (isToday(dateObj)) {
    return `Today at ${format(dateObj, 'h:mm a')}`;
  }

  // This week: "Monday at 3:45 PM" (if this week)
  if (isThisWeek(dateObj, { weekStartsOn: 1 })) {
    return `${format(dateObj, 'EEEE')} at ${format(dateObj, 'h:mm a')}`;
  }

  // Older: "Dec 15, 2024" (if older)
  return format(dateObj, 'MMM dd, yyyy');
};

export const Header: React.FC<HeaderProps> = ({ onMenuToggle, title, subtitle }) => {
    const { setGlobalSearchTerm, globalSearchTerm, fetchTransactions, fetchAccounts, fetchCategories, fetchPurchaseCategories, fetchDonationSavingRecords, fetchPurchases } = useFinanceStore();
    const { isDarkMode, toggleTheme } = useThemeStore();
    const { user, profile, signOut, isLoading } = useAuthStore();
    const { unreadCount } = useNotificationsStore();
    const { i18n, t } = useTranslation();
    const { isMobile } = useMobileDetection();
    const location = useLocation();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showLanguageMenu, setShowLanguageMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showSearchOverlay, setShowSearchOverlay] = useState(false);
    const [showHelpBanner, setShowHelpBanner] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const navigate = useNavigate();
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const profileBtnRef = useRef<HTMLButtonElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const languageBtnRef = useRef<HTMLButtonElement>(null);
    const languageMenuRef = useRef<HTMLDivElement>(null);
    
    const refreshLock = useRef(false);
    
    const { loadingState, initialize, startStep, completeStep, failStep, complete } = useGranularLoading();
    
    const { 
        analytics, 
        recommendations, 
        recordRefreshAttempt, 
        recordRefreshSuccess, 
        recordRefreshError,
        isDataStale,
        getFormattedTimeSinceLastRefresh 
    } = useSmartRefresh();
    
    const { 
        announceRefresh, 
        getRefreshButtonProps, 
        getProgressDescription,
        getHighContrastStyles,
        getFocusStyles 
    } = useAccessibility();

    const handleRefresh = async () => {
        if (refreshLock.current || isRefreshing) {
            console.log('🔄 Refresh already in progress, skipping...');
            return;
        }
        
        console.log('🚀 Starting refresh process...');
        const startTime = Date.now();
        refreshLock.current = true;
        setIsRefreshing(true);
        triggerHapticFeedback('medium');
        
        recordRefreshAttempt();
        announceRefresh('Refresh started', 'assertive');
        
        initialize([
            { id: 'transactions', name: 'Fetching transactions' },
            { id: 'accounts', name: 'Fetching accounts' },
            { id: 'categories', name: 'Fetching categories' },
            { id: 'purchase-categories', name: 'Fetching purchase categories' },
            { id: 'donation-saving', name: 'Fetching donation & saving records' },
            { id: 'purchases', name: 'Fetching purchases' }
        ]);
        
        try {
            // Add overall timeout to prevent infinite refreshing
            const overallTimeout = setTimeout(() => {
                console.log('⏰ Overall refresh timeout reached (15 seconds)');
                refreshLock.current = false;
                setIsRefreshing(false);
                complete();
                toast.error('Refresh timed out - please try again');
            }, 15000); // 15 second overall timeout
            
            const refreshFunctions = [
                { fn: () => fetchTransactions(), id: 'transactions' },
                { fn: () => fetchAccounts(), id: 'accounts' },
                { fn: () => fetchCategories(), id: 'categories' },
                { fn: () => fetchPurchaseCategories(), id: 'purchase-categories' },
                { fn: () => fetchDonationSavingRecords(), id: 'donation-saving' },
                { fn: () => fetchPurchases(), id: 'purchases' }
            ];
            
            // Start all steps immediately
            console.log('📋 Starting all refresh steps...');
            refreshFunctions.forEach(({ id }) => {
                console.log(`🔄 Starting step: ${id}`);
                startStep(id);
            });
            
            // Execute all functions in parallel with timeout protection
            console.log('⚡ Executing all functions in parallel...');
            const results = await Promise.allSettled(
                refreshFunctions.map(async ({ fn, id }) => {
                    const functionStartTime = Date.now();
                    console.log(`🚀 Starting function: ${id}`);
                    
                    try {
                        // Add 8-second timeout per function
                        const timeoutPromise = new Promise((_, reject) => {
                            setTimeout(() => {
                                console.log(`⏰ Timeout for function: ${id}`);
                                reject(new Error('Function timeout'));
                            }, 8000);
                        });
                        
                        const result = await Promise.race([
                            RetryMechanism.execute(fn, {
                                maxRetries: 1, // Reduced from 2 to 1
                                baseDelay: 200, // Reduced from 1000ms to 200ms
                                maxDelay: 2000, // Reduced max delay
                                retryCondition: (error) => {
                                    return !error.response || error.response.status >= 500;
                                }
                            }),
                            timeoutPromise
                        ]);
                        
                        const functionDuration = Date.now() - functionStartTime;
                        console.log(`✅ Function ${id} completed in ${functionDuration}ms`);
                        
                        if (result.success) {
                            completeStep(id);
                            announceRefresh(`Completed: ${id}`, 'polite');
                            return { success: true, id };
                        } else {
                            console.log(`❌ Function ${id} failed:`, result.error);
                            failStep(id, result.error?.message || 'Unknown error');
                            announceRefresh(`Failed: ${id} - ${result.error?.message || 'Unknown error'}`, 'assertive');
                            return { success: false, id, error: result.error };
                        }
                    } catch (error) {
                        const functionDuration = Date.now() - functionStartTime;
                        console.log(`💥 Function ${id} threw error after ${functionDuration}ms:`, error);
                        failStep(id, error?.message || 'Unknown error');
                        announceRefresh(`Failed: ${id} - ${error?.message || 'Unknown error'}`, 'assertive');
                        return { success: false, id, error };
                    }
                })
            );
            
            const totalDuration = Date.now() - startTime;
            console.log(`🎉 All refresh functions completed in ${totalDuration}ms`);
            console.log('📊 Results:', results);
            
            window.dispatchEvent(new CustomEvent('dataRefreshed'));
            complete();
            
            const duration = Date.now() - (loadingState.startTime || 0);
            recordRefreshSuccess(duration);
            announceRefresh('Data refreshed successfully', 'assertive');
            
            toast.success('Data refreshed successfully');
            triggerHapticFeedback('success');
        } catch (error) {
            const totalDuration = Date.now() - startTime;
            console.log(`💥 Refresh failed after ${totalDuration}ms:`, error);
            complete();
            
            recordRefreshError(error instanceof Error ? error.message : 'Unknown error');
            announceRefresh('Failed to refresh data', 'assertive');
            
            toast.error('Failed to refresh data');
            triggerHapticFeedback('error');
        } finally {
            // Clear the overall timeout
            if (typeof overallTimeout !== 'undefined') {
                clearTimeout(overallTimeout);
            }
            setIsRefreshing(false);
            refreshLock.current = false;
            console.log('🏁 Refresh process finished');
        }
    };

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'bn', name: 'বাংলা', flag: '🇧🇩' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
  ];

  // Check if user has seen the help banner
  useEffect(() => {
    const hasSeenHelpBanner = localStorage.getItem('help-banner-dismissed');
    if (hasSeenHelpBanner) {
      setShowHelpBanner(false);
    }
  }, [navigate]);

  // Dismiss help banner
  const dismissHelpBanner = () => {
    setShowHelpBanner(false);
    localStorage.setItem('help-banner-dismissed', 'true');
  };

  // Click outside to close user menu and language menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Close user menu
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node) &&
        profileBtnRef.current &&
        !profileBtnRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
      
      // Close language menu
      if (
        languageMenuRef.current &&
        !languageMenuRef.current.contains(event.target as Node) &&
        languageBtnRef.current &&
        !languageBtnRef.current.contains(event.target as Node)
      ) {
        setShowLanguageMenu(false);
      }
    }
    if (showUserMenu || showLanguageMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu, showLanguageMenu]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        // Check if click is inside the dropdown
        if (dropdownRef.current && dropdownRef.current.contains(event.target as Node)) {
          return; // Don't close if clicking inside dropdown
        }
        setIsSearchFocused(false);
        setGlobalSearchTerm('');
      }
    }
    if (isSearchFocused) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSearchFocused, setGlobalSearchTerm]);

  // Handle escape key to close search overlay
  useEffect(() => {
    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && showSearchOverlay) {
        setShowSearchOverlay(false);
        setIsSearchFocused(false);
      }
    }
    
    if (showSearchOverlay) {
      document.addEventListener('keydown', handleEscapeKey);
    }
    
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [showSearchOverlay]);

  // Update profile menu position on scroll/resize
  useEffect(() => {
    if (!showUserMenu || !userMenuRef.current || !profileBtnRef.current) return;
    
    const updatePosition = () => {
      if (!userMenuRef.current || !profileBtnRef.current) return;
      const rect = profileBtnRef.current.getBoundingClientRect();
      userMenuRef.current.style.top = `${rect.bottom + 8}px`;
      userMenuRef.current.style.right = `${window.innerWidth - rect.right}px`;
    };
    
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [showUserMenu]);


  // Focus search input when overlay opens
  useEffect(() => {
    if (showSearchOverlay && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
        setIsSearchFocused(true);
      }, 100);
    }
  }, [showSearchOverlay]);

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    setShowLanguageMenu(false);
  };

  const getCurrentLanguage = () => {
    return languages.find(lang => lang.code === i18n.language) || languages[0];
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      // Error handling
    }
  };

  const handleSearchClick = () => {
    setShowSearchOverlay(true);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  };

  const handleCloseSearch = () => {
    setShowSearchOverlay(false);
    setIsSearchFocused(false);
    setGlobalSearchTerm('');
  };

  return (
    <>
      {/* Help Center Notification Banner */}
      {showHelpBanner && location.pathname !== '/dashboard-demo-only' && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 relative">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 animate-pulse" />
                <span className="font-semibold">New!</span>
              </div>
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4" />
                <span className="text-sm sm:text-base">
                  We've launched a comprehensive Help Center with guides, tutorials, and support resources!
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigate('/help')}
                className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
              >
                <span>Explore</span>
                <LifeBuoy className="w-4 h-4" />
              </button>
              <button
                onClick={dismissHelpBanner}
                className="text-white/80 hover:text-white p-1 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 w-full max-w-full overflow-hidden box-border relative z-50">
        <div className="flex items-center justify-between w-full max-w-full min-w-0 box-border">
          {/* Left Section - Menu Button & Title */}
          <div className="flex items-center min-w-0 flex-1 box-border">
            <button
              onClick={() => {
                triggerHapticFeedback('light');
                onMenuToggle();
              }}
              className="md:hidden touch-button rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-active p-1.5 mr-1 sm:mr-3 flex-shrink-0"
            >
              <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300" />
            </button>
            
            <div className="min-w-0 flex-1 overflow-hidden">
              <h1 className="font-bold text-gray-900 dark:text-white truncate" style={{ fontSize: '21px', lineHeight: '1.2' }}>
                {title}
              </h1>
              {subtitle && (
                <div className="text-gray-600 dark:text-gray-400 mt-0.5 hidden sm:block truncate" style={{ fontSize: '13px', lineHeight: '1.3' }}>
                  {subtitle}
                </div>
              )}
            </div>
          </div>
          
          {/* Right Section - Actions */}
          <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2 lg:gap-3 ml-1 sm:ml-2 md:ml-4 min-w-0 flex-shrink-0 box-border">
            {/* Desktop Search */}
            <div className="hidden md:block relative flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('search')}
                  className="w-48 lg:w-64 pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm max-w-full"
                  value={globalSearchTerm}
                  onChange={e => setGlobalSearchTerm(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  ref={searchInputRef}
                />
              </div>
              <GlobalSearchDropdown 
                isFocused={isSearchFocused} 
                inputRef={searchInputRef} 
                dropdownRef={dropdownRef}
                onClose={() => setIsSearchFocused(false)}
              />
            </div>
            
            {/* Mobile/Tablet Search Button */}
            <button
              onClick={handleSearchClick}
              className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
              title={t('search')}
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300" />
            </button>
            
            {/* Theme Toggle & Notifications */}
            <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2 flex-shrink-0">
              {/* Enhanced Refresh Button with Progress and Accessibility */}
              <div className="relative">
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className={`p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all flex items-center justify-center ${isRefreshing ? 'cursor-not-allowed opacity-50' : ''} focus:outline-none`}
                  title={
                    loadingState.isActive 
                      ? `Refreshing... ${loadingState.overallProgress}%` 
                      : isDataStale() 
                        ? `Refresh data (Last updated: ${getFormattedTimeSinceLastRefresh()})`
                        : "Refresh data"
                  }
                  {...getRefreshButtonProps(isRefreshing, loadingState.overallProgress)}
                  style={{
                    ...getHighContrastStyles()
                  }}
                >
                  <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-300 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
                
                {/* Progress indicator */}
                {loadingState.isActive && (
                  <div className="absolute -bottom-1 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-300 ease-out"
                      style={{ width: `${loadingState.overallProgress}%` }}
                      role="progressbar"
                      aria-valuenow={loadingState.overallProgress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={getProgressDescription(loadingState.overallProgress, loadingState.currentStep)}
                    />
                  </div>
                )}
                
                
                {/* Progress description for screen readers */}
                {loadingState.isActive && (
                  <div id="refresh-progress-description" className="sr-only">
                    {getProgressDescription(loadingState.overallProgress, loadingState.currentStep)}
                  </div>
                )}
              </div>

              <button
                onClick={toggleTheme}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center flex-shrink-0"
                title={isDarkMode ? t('switchToLightMode') : t('switchToDarkMode')}
              >
                {isDarkMode ? (
                  <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-300" />
                ) : (
                  <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-300" />
                )}
              </button>
              
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative flex items-center justify-center p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title={t('notifications')}
                >
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-300" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-1 py-0.5 rounded-full min-w-[16px] h-4 flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
            
            {/* User Menu */}
            <div className="relative flex-shrink-0">
              <button
                ref={profileBtnRef}
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full bg-blue-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all hover:bg-blue-700"
                title={profile?.fullName || 'User Profile'}
              >
                {isLoading ? (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full bg-blue-600 flex items-center justify-center">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : profile?.profilePicture ? (
                  <img
                    src={supabase.storage.from('avatars').getPublicUrl(profile.profilePicture).data.publicUrl}
                    alt={profile.fullName}
                    className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-xs sm:text-sm md:text-lg font-bold">
                    {profile?.fullName
                      ? profile.fullName.trim().split(' ').map((n: string, i: number, arr: string[]) => i === 0 || i === arr.length - 1 ? n[0].toUpperCase() : '').join('')
                      : 'U'}
                  </span>
                )}
              </button>

              {showUserMenu && (
                <div 
                  ref={userMenuRef} 
                  className="fixed bg-white dark:bg-gray-800 rounded-lg shadow-xl py-2 z-[100] border border-gray-200 dark:border-gray-700"
                  style={{
                    top: profileBtnRef.current ? `${profileBtnRef.current.getBoundingClientRect().bottom + 8}px` : '64px',
                    right: profileBtnRef.current ? `${window.innerWidth - profileBtnRef.current.getBoundingClientRect().right}px` : '16px',
                    width: '192px', // w-48 = 12rem = 192px
                  }}
                >
                  <div className="px-3 sm:px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{profile?.fullName}</p>
                      <button
                        onClick={() => {
                          setShowProfileModal(true);
                          setShowUserMenu(false);
                        }}
                        className="flex-shrink-0 p-0.5 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        title={t('editProfile')}
                        aria-label={t('editProfile')}
                      >
                        <Edit3 className="w-[14px] h-[14px]" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                    <p className="text-xs text-gray-400 mt-1">Last login: {formatTimeAgo(user?.last_sign_in_at)}</p>
                  </div>

                  <button
                    onClick={() => {
                      navigate('/achievements');
                      setShowUserMenu(false);
                    }}
                    className="w-full px-3 sm:px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  >
                    <Trophy className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">Achievements</span>
                  </button>

                  <button
                    onClick={() => {
                      navigate('/history');
                      setShowUserMenu(false);
                    }}
                    className="w-full px-3 sm:px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  >
                    <LifeBuoy className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{t('history')}</span>
                  </button>
                  <button
                    onClick={() => {
                      navigate('/transfers');
                      setShowUserMenu(false);
                    }}
                    className="w-full px-3 sm:px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  >
                    <ArrowLeftRight className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{t('transfers')}</span>
                  </button>
                  <button
                    onClick={() => {
                      navigate('/donations');
                      setShowUserMenu(false);
                    }}
                    className="w-full px-3 sm:px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  >
                    <Heart className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">Donations</span>
                  </button>
                  <button
                    onClick={() => {
                      navigate('/favorite-quotes');
                      setShowUserMenu(false);
                    }}
                    className="w-full px-3 sm:px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  >
                    <Quote className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">Favorite Quotes</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full px-3 sm:px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  >
                    <LogOut className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{t('logout')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile Edit Modal */}
        <ProfileEditModal
          open={showProfileModal}
          onClose={() => setShowProfileModal(false)}
        />

        {/* Notification Dropdown */}
        <NotificationDropdown
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
        />
      </header>

      {/* Search Overlay - Only for screens under 768px */}
      {showSearchOverlay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20 sm:pt-32">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl mx-4 sm:mx-8">
            <div className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <Search className="w-5 h-5 text-gray-400 dark:text-gray-300 mr-3" />
              <input
                type="text"
                placeholder={t('search')}
                className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border-none outline-none"
                value={globalSearchTerm}
                onChange={e => setGlobalSearchTerm(e.target.value)}
                ref={searchInputRef}
              />
              <button
                onClick={handleCloseSearch}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ml-2"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-300" />
              </button>
            </div>
            <GlobalSearchDropdown 
              isFocused={isSearchFocused} 
              inputRef={searchInputRef} 
              dropdownRef={dropdownRef}
              onClose={() => setIsSearchFocused(false)}
              isOverlay={true}
            />
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
        title="Confirm Logout"
        message="Are you sure you want to logout? You will need to sign in again to access your account."
        recordDetails={
          <div className="text-sm text-gray-700 dark:text-gray-300">
            <p>You will be signed out of your account and redirected to the login page.</p>
          </div>
        }
        confirmLabel="Logout"
        cancelLabel="Cancel"
      />
    </>
  );
};

