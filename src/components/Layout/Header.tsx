import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { Menu, Bell, Search, Sun, Moon, User, Settings, LogOut, ArrowLeftRight, LifeBuoy, Globe, Heart, Quote, X, BookOpen, Sparkles } from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { NotificationDropdown } from './NotificationDropdown';
import { useNotificationStore } from '../../store/notificationStore';
import { ProfileEditModal } from './ProfileEditModal';
import { useNavigate, Link } from 'react-router-dom';
import { GlobalSearchDropdown } from './GlobalSearchDropdown';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { triggerHapticFeedback } from '../../utils/hapticFeedback';
import { toast } from 'sonner';

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

export const Header: React.FC<HeaderProps> = ({ onMenuToggle, title, subtitle }) => {
  const { setGlobalSearchTerm, globalSearchTerm } = useFinanceStore();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const { user, profile, signOut, isLoading } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const { i18n, t } = useTranslation();
  const { isMobile } = useMobileDetection();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const [showHelpBanner, setShowHelpBanner] = useState(true);
  const navigate = useNavigate();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileBtnRef = useRef<HTMLButtonElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const languageBtnRef = useRef<HTMLButtonElement>(null);
  const languageMenuRef = useRef<HTMLDivElement>(null);

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

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
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
      {showHelpBanner && (
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

      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4">
        <div className="flex items-center justify-between">
          {/* Left Section - Menu Button & Title */}
          <div className="flex items-center min-w-0 flex-1">
            <button
              onClick={() => {
                triggerHapticFeedback('light');
                onMenuToggle();
              }}
              className="md:hidden touch-button rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-active p-1.5 mr-2 sm:mr-3"
            >
              <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300" />
            </button>
            
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white truncate">
                {title}
              </h1>
              {subtitle && (
                <div className="text-gray-600 text-xs sm:text-sm lg:text-base mt-0.5 hidden sm:block truncate">
                  {subtitle}
                </div>
              )}
            </div>
          </div>
          
          {/* Right Section - Actions */}
          <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3 ml-2 sm:ml-4">
            {/* Desktop Search */}
            <div className="hidden md:block relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('search')}
                  className="w-64 pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
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
              className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={t('search')}
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300" />
            </button>
            
            {/* Theme Toggle & Notifications */}
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={toggleTheme}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
                title={isDarkMode ? t('switchToLightMode') : t('switchToDarkMode')}
              >
                {isDarkMode ? (
                  <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-300" />
                ) : (
                  <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-300" />
                )}
              </button>
              
              <div className="relative">
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
            <div className="relative">
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
                    src={supabase.storage.from('avatars').getPublicUrl(profile.profilePicture + '?t=' + Date.now()).data.publicUrl}
                    alt={profile.fullName}
                    className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full object-cover"
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
                <div ref={userMenuRef} className="absolute right-0 mt-2 w-48 sm:w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl py-2 z-50 border border-gray-200 dark:border-gray-700">
                  <div className="px-3 sm:px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{profile?.fullName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                    <p className="text-xs text-gray-400 mt-1">{t('defaultCurrency')}: {profile?.local_currency || 'USD'}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowProfileModal(true);
                      setShowUserMenu(false);
                    }}
                    className="w-full px-3 sm:px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  >
                    <User className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{t('editProfile')}</span>
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
                className="flex-1 bg-transparent text-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border-none outline-none"
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
    </>
  );
};