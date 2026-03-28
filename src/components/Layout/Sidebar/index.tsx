import React, { useEffect } from 'react';
import { HelpCircle, X, Sparkles, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../../../store/themeStore';
import { useMobileDetection } from '../../../hooks/useMobileDetection';
import { triggerHapticFeedback } from '../../../utils/hapticFeedback';
import { SIDEBAR_NAV } from './navigation';
import { SidebarNavItem } from './SidebarNavItem';
import { useSidebarSwipe } from './useSidebarSwipe';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  currentView: string;
  onViewChange: (view: string) => void;
}

const px = (expanded: boolean) => expanded ? 'px-4' : 'px-2';
const py = 'py-4';

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, currentView, onViewChange }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isSidebarCollapsed, toggleSidebar } = useThemeStore();
  const { profile } = useAuthStore();
  const { isMobile } = useMobileDetection();

  const effectiveCollapsed = isMobile ? true : isSidebarCollapsed;
  const showExpanded = (!isMobile && !effectiveCollapsed) || (isMobile && isOpen);
  const isDemoPage = location.pathname.includes('/dashboard-demo');

  const touchHandlers = useSidebarSwipe(isMobile, isOpen, onToggle);

  useEffect(() => {
    if (isMobile && isOpen) document.body.classList.add('sidebar-open');
    else document.body.classList.remove('sidebar-open');
    return () => document.body.classList.remove('sidebar-open');
  }, [isMobile, isOpen]);

  const handleToggle = () => { triggerHapticFeedback('light'); onToggle(); };
  const handleUpgrade = () => { triggerHapticFeedback('light'); navigate('/settings?tab=plans-usage'); };
  const handleHelp = () => !isDemoPage && navigate('/help');

  return (
    <>
      {isOpen && (
        <div
          className="sidebar-backdrop md:hidden"
          onClick={handleToggle}
          {...touchHandlers}
        />
      )}
      <div
        className={`sidebar-mobile ${isOpen ? 'sidebar-mobile-open' : 'sidebar-mobile-closed'} md:sidebar-desktop
          ${isMobile ? (isOpen ? 'w-64' : 'w-16') : (effectiveCollapsed ? 'w-16' : 'w-52')} sidebar-scroll`}
        {...touchHandlers}
      >
        <div className="flex flex-col h-full">
          <div className={`flex items-center justify-between border-b border-gray-200 dark:border-gray-700 ${px(showExpanded)} ${py}`}>
            {showExpanded ? (
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
            <button onClick={handleToggle} className="md:hidden touch-button rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-active">
              <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {isMobile && isOpen && profile?.subscription?.plan === 'free' && (
            <div className={`${px(showExpanded)} pb-3`}>
              <button
                onClick={handleUpgrade}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-sm hover:shadow-md touch-button touch-active min-h-[44px]"
                title="Upgrade to Premium"
              >
                <Sparkles className="w-4 h-4 flex-shrink-0" />
                <span>Upgrade to Premium</span>
              </button>
            </div>
          )}

          <nav data-tour="navigation" className={`flex-1 space-y-2 pl-2 ${showExpanded ? 'pr-4' : 'pr-2'}`} style={{ paddingTop: '10px' }}>
            {SIDEBAR_NAV.map((item) => (
              <SidebarNavItem
                key={item.id}
                item={item}
                isActive={currentView === item.id}
                showLabel={showExpanded}
                isDemoPage={isDemoPage}
                onNavigate={onViewChange}
                t={t}
              />
            ))}
          </nav>

          <div className={`border-t border-gray-200 dark:border-gray-700 ${px(showExpanded)} ${py}`}>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleHelp}
                className={`flex-1 flex items-center py-2 mt-2 rounded-lg transition-colors ${showExpanded ? 'px-3 space-x-3' : 'px-2 justify-center'}
                  ${isDemoPage ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'}`}
                title={isDemoPage ? 'Demo mode - feature disabled' : 'Help & Support'}
                disabled={isDemoPage}
              >
                <HelpCircle className="w-4 h-4" />
                {showExpanded && <span className="text-[13px]">Help & Support</span>}
              </button>
              {!isMobile && (
                <button
                  onClick={toggleSidebar}
                  className={`rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors mt-2 ${
                    effectiveCollapsed ? 'p-2 bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-blue-900/20 hover:from-blue-100 hover:via-purple-100 hover:to-blue-100 dark:hover:from-blue-800/30 dark:hover:via-purple-800/30 dark:hover:to-blue-800/30 shadow-sm' : 'p-1'
                  }`}
                  title={effectiveCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  {effectiveCollapsed ? <ChevronsRight className="w-5 h-5 text-gradient-primary" /> : <ChevronsLeft className="w-4 h-4 text-gray-500 dark:text-gray-400" />}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
