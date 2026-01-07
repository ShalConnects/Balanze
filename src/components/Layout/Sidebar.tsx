import React, { useState, useRef, useEffect } from 'react';
import { 
  Home, 
  CreditCard, 
  TrendingUp, 
  PieChart, 
  Settings, 
  HelpCircle,
  X,
  ShoppingBag,
  BarChart3,
  Handshake,
  ChevronsLeft,
  ChevronsRight,
  Wallet,
  Trophy,
  Users,
  FileText,
  ChevronDown,
  ChevronRight,
  Sprout,
  Sparkles
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../../store/themeStore';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { triggerHapticFeedback } from '../../utils/hapticFeedback';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  currentView: string;
  onViewChange: (view: string) => void;
}

const navigation = [
  { name: 'navigation.dashboard', id: 'dashboard', icon: Home },
  { name: 'navigation.accounts', id: 'accounts', icon: CreditCard },
  { name: 'navigation.transactions', id: 'transactions', icon: TrendingUp },
  { name: 'navigation.purchases', id: 'purchases', icon: ShoppingBag },
  { name: 'navigation.lendBorrow', id: 'lent-borrow', icon: Handshake },
  // { name: 'navigation.investments', id: 'investments', icon: Wallet },
  // { name: 'navigation.simpleInvestments', id: 'simple-investments', icon: TrendingUp },
  { 
    name: 'navigation.clients', 
    id: 'clients', 
    icon: Users,
    isNew: true
  },
  { name: 'navigation.habits', id: 'habits', icon: Sprout, isNew: true },
  { name: 'navigation.analytics', id: 'analytics', icon: PieChart },
  { name: 'navigation.settings', id: 'settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, currentView, onViewChange }) => {
  const { t } = useTranslation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['clients'])); // Clients expanded by default
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userSectionRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{top: number, left: number, direction: 'down' | 'up'} | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { isSidebarCollapsed, toggleSidebar, isDarkMode } = useThemeStore();
  const { profile } = useAuthStore();
  
  // Check if we're on a demo page
  const isDemoPage = location.pathname.includes('/dashboard-demo');
  
  const { isMobile, isVerySmall } = useMobileDetection();
  
  // Android detection
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isCapacitor = !!(window as any).Capacitor;
  const isAndroidApp = isAndroid && isCapacitor;
  
  // Swipe-to-close functionality
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchEndY, setTouchEndY] = useState<number | null>(null);
  
  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;
  
  // Force collapse on mobile - always collapsed on mobile
  const effectiveCollapsed = isMobile ? true : isSidebarCollapsed;

  // Helper to get initials
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    return parts.length === 1
      ? parts[0][0].toUpperCase()
      : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Open dropdown and set position/direction
  const handleUserClick = () => {
    setDropdownOpen((v) => !v);
    if (userSectionRef.current) {
      const rect = userSectionRef.current.getBoundingClientRect();
      const dropdownHeight = 192; // estimate: 4 options * 48px each
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
        // Show above
        setDropdownPos({ top: rect.top - dropdownHeight - 4, left: rect.left, direction: 'up' });
      } else {
        // Show below
        setDropdownPos({ top: rect.bottom + 4, left: rect.left, direction: 'down' });
      }
    }
  };

  // Close dropdown on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        userSectionRef.current &&
        !userSectionRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  // Swipe-to-close functionality - only for horizontal swipes
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setTouchStartY(e.targetTouches[0].clientY);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
    setTouchEndY(e.targetTouches[0].clientY);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd || !touchStartY || !touchEndY) return;
    
    const horizontalDistance = touchStart - touchEnd;
    const verticalDistance = Math.abs(touchStartY - touchEndY);
    const isLeftSwipe = horizontalDistance > minSwipeDistance;
    const isHorizontalSwipe = Math.abs(horizontalDistance) > verticalDistance;
    
    // Only trigger sidebar close for horizontal left swipes, not vertical scrolls
    if (isLeftSwipe && isHorizontalSwipe && isMobile && isOpen) {
      triggerHapticFeedback('light');
      onToggle();
    }
  };

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.classList.add('sidebar-open');
    } else {
      document.body.classList.remove('sidebar-open');
    }

    return () => {
      document.body.classList.remove('sidebar-open');
    };
  }, [isMobile, isOpen]);

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="sidebar-backdrop md:hidden"
          onClick={() => {
            triggerHapticFeedback('light');
            onToggle();
          }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        />
      )}
      
      {/* Sidebar */}
      <div 
        className={`
          sidebar-mobile
          ${isOpen ? 'sidebar-mobile-open' : 'sidebar-mobile-closed'} 
          md:sidebar-desktop
          ${isMobile ? (isOpen ? 'w-64' : 'w-16') : (effectiveCollapsed ? 'w-16' : 'w-52')}
          sidebar-scroll
        `}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={`flex items-center justify-between border-b border-gray-200 dark:border-gray-700 ${
            isMobile ? (isOpen ? 'px-6 py-4' : 'p-2') : (effectiveCollapsed ? 'px-2 py-4' : 'px-6 py-4')
          }`}>
            {(!isMobile && !effectiveCollapsed) || (isMobile && isOpen) ? (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">B</span>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Balanze</span>
              </div>
            ) : (
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto">
                <span className="text-white font-bold text-lg">B</span>
              </div>
            )}
            <button 
              onClick={() => {
                triggerHapticFeedback('light');
                onToggle();
              }}
              className="md:hidden touch-button rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-active"
            >
              <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
          
          {/* Upgrade Button for Free Users - Mobile only */}
          {isMobile && isOpen && profile?.subscription?.plan === 'free' && (
            <div className={`px-4 pb-3 ${
              isMobile ? (isOpen ? 'px-4' : 'px-2') : (effectiveCollapsed ? 'px-2' : 'px-4')
            }`}>
              <button
                onClick={() => {
                  triggerHapticFeedback('light');
                  navigate('/settings?tab=plans-usage');
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-sm hover:shadow-md touch-button touch-active min-h-[44px]"
                title="Upgrade to Premium"
              >
                <Sparkles className="w-4 h-4 flex-shrink-0" />
                <span>Upgrade to Premium</span>
              </button>
            </div>
          )}
          
          {/* Navigation */}
          <nav 
            data-tour="navigation"
            className={`flex-1 space-y-2 pl-2 ${
              isMobile ? (isOpen ? 'pr-4' : 'pr-2') : (effectiveCollapsed ? 'pr-2' : 'pr-4')
            }`}
            style={{ paddingTop: '10px' }}
          >
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id || (item.subItems && item.subItems.some(sub => sub.id === currentView));
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isExpanded = expandedItems.has(item.id);
              const showSubItems = hasSubItems && isExpanded && ((!isMobile && !effectiveCollapsed) || (isMobile && isOpen));
              
              return (
                <div key={item.id}>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Only disable navigation for demo pages
                      if (isDemoPage) {
                        return;
                      }
                      if (hasSubItems) {
                        // Toggle expansion
                        setExpandedItems(prev => {
                          const newSet = new Set(prev);
                          if (newSet.has(item.id)) {
                            newSet.delete(item.id);
                          } else {
                            newSet.add(item.id);
                          }
                          return newSet;
                        });
                        // Also navigate to the main item
                        onViewChange(item.id);
                      } else {
                        onViewChange(item.id);
                      }
                    }}
                    data-tour={item.id === 'accounts' ? 'accounts-nav' : undefined}
                    className={`
                      w-full flex items-center rounded-lg sidebar-nav-item
                      ${isMobile ? (isOpen ? 'px-4 py-3 space-x-3' : 'px-2 py-3 justify-center') : (effectiveCollapsed ? 'px-2 py-3 justify-center' : 'px-4 py-3 space-x-3')}
                      ${isMobile ? 'sidebar-nav-mobile' : ''}
                      ${isActive 
                        ? 'sidebar-active-simple font-semibold' 
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-50 hover:via-blue-50/30 hover:to-gray-50 dark:hover:from-gray-700/50 dark:hover:via-blue-900/10 dark:hover:to-gray-700/50 hover:text-gray-900 dark:hover:text-white'
                      }
                      touch-active
                    `}
                    title={isMobile || effectiveCollapsed ? t(item.name) : undefined}
                  >
                    <Icon 
                      className={`w-5 h-5 ${isActive ? 'text-gradient-primary' : 'text-gray-400 dark:text-gray-500'}`}
                      style={isActive ? {
                        background: isDarkMode 
                          ? 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)'
                          : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      } : {}}
                    />
                    {(!isMobile && !effectiveCollapsed) || (isMobile && isOpen) ? (
                      <>
                        <span className={`${isActive ? 'text-gradient-primary' : ''} text-[14px] font-bold flex-1 text-left`}>{t(item.name)}</span>
                        {item.isNew && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                            New
                          </span>
                        )}
                        {hasSubItems && (
                          isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          )
                        )}
                      </>
                    ) : null}
                  </button>
                  
                  {/* Sub-items */}
                  {showSubItems && item.subItems && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.subItems.map((subItem) => {
                        const SubIcon = subItem.icon;
                        const isSubActive = currentView === subItem.id;
                        return (
                          <button
                            key={subItem.id}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (isDemoPage) return;
                              onViewChange(subItem.id);
                            }}
                            className={`
                              w-full flex items-center rounded-lg sidebar-nav-item
                              px-4 py-2 space-x-3
                              ${isSubActive 
                                ? 'sidebar-active-simple font-semibold' 
                                : 'text-gray-500 dark:text-gray-400 hover:bg-gradient-to-r hover:from-gray-50 hover:via-blue-50/30 hover:to-gray-50 dark:hover:from-gray-700/50 dark:hover:via-blue-900/10 dark:hover:to-gray-700/50 hover:text-gray-700 dark:hover:text-gray-300'
                              }
                              touch-active
                            `}
                          >
                            <SubIcon 
                              className={`w-4 h-4 ${isSubActive ? 'text-gradient-primary' : 'text-gray-400 dark:text-gray-500'}`}
                              style={isSubActive ? {
                                background: isDarkMode 
                                  ? 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)'
                                  : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text'
                              } : {}}
                            />
                            <span className={`${isSubActive ? 'text-gradient-primary' : ''} text-[13px] font-medium`}>{t(subItem.name)}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
          
          {/* User section */}
          <div className={`border-t border-gray-200 dark:border-gray-700 ${
            isMobile ? (isOpen ? 'px-4 py-4' : 'p-2') : (effectiveCollapsed ? 'px-2 py-4' : 'px-4 py-4')
          }`}>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  if (isDemoPage) {
                    return; // Disable for demo pages
                  }
                  navigate('/help');
                }}
                className={`flex-1 flex items-center px-3 py-2 mt-2 rounded-lg transition-colors ${
                  isDemoPage 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                } ${
                  isMobile ? (isOpen ? 'space-x-3' : 'justify-center px-2') : (effectiveCollapsed ? 'justify-center px-2' : 'space-x-3')
                }`}
                title={isDemoPage ? "Demo mode - feature disabled" : "Help & Support"}
                disabled={isDemoPage}
              >
                <HelpCircle className="w-4 h-4" />
                {(!isMobile && !effectiveCollapsed) || (isMobile && isOpen) ? (
                  <span className="text-[13px]">Help & Support</span>
                ) : null}
              </button>
              {/* Only show toggle button on desktop (>767px) */}
              {!isMobile && (
                <button 
                  onClick={toggleSidebar}
                  className={`rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors mt-2 ${
                    effectiveCollapsed 
                      ? 'p-2 bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-blue-900/20 hover:from-blue-100 hover:via-purple-100 hover:to-blue-100 dark:hover:from-blue-800/30 dark:hover:via-purple-800/30 dark:hover:to-blue-800/30 shadow-sm' 
                      : 'p-1'
                  }`}
                  title={effectiveCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  {effectiveCollapsed ? (
                    <ChevronsRight className="w-5 h-5 text-gradient-primary" />
                  ) : (
                    <ChevronsLeft className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

