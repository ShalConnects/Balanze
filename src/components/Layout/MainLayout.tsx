import React, { useState, useEffect, useSyncExternalStore, ReactNode, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { PomodoroTimerBar } from './PomodoroTimerBar';
import { useThemeStore } from '../../store/themeStore';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { useMobileSidebar } from '../../context/MobileSidebarContext';
import { FloatingActionButton } from './FloatingActionButton';
import { isInvestmentsBondsTab } from '../../lib/investmentsNav';
import { ExpenseNoteLoadingCaption } from '../Transactions/expenseNoteCompactUi';
import {
  getShoppingListLoading,
  subscribeShoppingListLoading,
} from '../../utils/shoppingListLoading';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Start closed on mobile
  const location = useLocation();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState(location.pathname.split('/')[2] || 'dashboard');
  const { isSidebarCollapsed } = useThemeStore();
  const shoppingListLoading = useSyncExternalStore(
    subscribeShoppingListLoading,
    getShoppingListLoading,
    () => false
  );
  
  const { isMobile, isVerySmall } = useMobileDetection();
  const { setIsMobileSidebarOpen } = useMobileSidebar();
  
  // Lazy load TodosWidget globally for modal access
  const [TodosWidget, setTodosWidget] = useState<React.ComponentType | null>(null);
  
  useEffect(() => {
    if (!TodosWidget) {
      let isMounted = true;
      const timer = setTimeout(() => {
        import('../Dashboard/TodosWidget')
          .then((module) => {
            if (isMounted && module?.TodosWidget) {
              setTodosWidget(() => module.TodosWidget);
            }
          })
          .catch((error) => {
            if (isMounted) {
              console.error('Failed to load TodosWidget:', error);
            }
          });
      }, 500);
      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    }
  }, [TodosWidget]);
  
  // Force collapse on mobile - always collapsed on mobile
  const effectiveCollapsed = isMobile ? true : isSidebarCollapsed;
  
  // Track if this is the initial load to prevent closing sidebar on mount
  const isInitialLoad = useRef(true);
  const previousPathname = useRef(location.pathname);

  // Sync route with currentView and close mobile sidebar on navigation
  useEffect(() => {
    const pathParts = location.pathname.split('/');
    
    // Now the path will be directly like /accounts, /transactions, etc.
    let view = 'dashboard';
    if (pathParts[1] && pathParts[1] !== '') {
      view = pathParts[1];
    }
    setCurrentView(view);
  }, [location]);

  // Close mobile sidebar on navigation
  useEffect(() => {
    
    // Skip on initial load
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      previousPathname.current = location.pathname;
      return;
    }
    
    // Close sidebar if pathname changed and we're on mobile
    if (previousPathname.current !== location.pathname && isMobile) {
      setIsSidebarOpen(false);
      setIsMobileSidebarOpen(false);
    }
    
    // Update previous pathname
    previousPathname.current = location.pathname;
  }, [location.pathname, isMobile, setIsMobileSidebarOpen]);

  // Scroll to top on route change
  useEffect(() => {
    const mainContent = document.querySelector('main');
    if (mainContent) {
      mainContent.scrollTop = 0;
    }
  }, [location.pathname]);

  // Update route when currentView changes
  const handleViewChange = (view: string) => {
    
    // When we're inside the Dashboard component, the path will be /accounts
    // instead of /dashboard/accounts
    if (view === 'dashboard') {
      navigate('/');
    } else {
      navigate(`/${view}`);
    }
  };

  const investmentsTab = currentView === 'investments'
    ? new URLSearchParams(location.search).get('tab')
    : null;

  const getTitle = () => {
    switch (currentView) {
      case 'dashboard': return 'Dashboard';
      case 'accounts': return 'Accounts';
      case 'transactions': return 'Transactions';
      case 'shopping-list': return 'Shopping List';
      case 'transfers': return 'Transfer History';
      case 'analytics': return 'Analytics';
      case 'purchases': return 'Purchases';
      case 'purchase-categories': return 'Purchase Categories';
      case 'lent-borrow': return 'Lent & Borrow';
      case 'investments': return isInvestmentsBondsTab(investmentsTab) ? 'Bonds' : 'Investments';
      case 'clients': return 'Clients';
      case 'habits': return 'Habit Garden';
      case 'orders': return 'Orders';
      case 'invoices': return 'Invoices';
      case 'achievements': return 'Achievements';
      case 'last-wish': return 'Last Wish';
      case 'settings': return 'Settings';
      case 'about': return 'About';
      case 'donations': return 'Donations';
      case 'zakah': return 'Zakah';
      case 'favorite-quotes': return 'Favorite Quotes';
      case 'history': return 'Activity History';
      case 'learning': return 'Learning Courses';
      case 'personal-growth': return 'Personal Growth';
      case 'notes': return 'Notes Diary';
      default: return 'Dashboard';
    }
  };


  // Prevent background scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobile && isSidebarOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isMobile, isSidebarOpen]);

  // Ensure mobile sidebar context flag is in sync with local sidebar state
  // This prevents floating buttons from staying hidden due to a stale open flag
  useEffect(() => {
    if (!isSidebarOpen) {
      setIsMobileSidebarOpen(false);
    }
  }, [isSidebarOpen, setIsMobileSidebarOpen]);

  return (
    <>
      <div className="h-screen bg-gray-50 dark:bg-gray-900 flex overflow-hidden relative z-0">
        {/* Sidebar for desktop only */}
        {!isMobile && (
          <aside className={`fixed inset-y-0 left-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-30 transition-all duration-300 ease-in-out ${
            effectiveCollapsed ? 'w-16' : 'w-52'
          }`}>
            <Sidebar 
              isOpen={true} 
              onToggle={() => {}} // No toggle on desktop
              currentView={currentView}
              onViewChange={handleViewChange}
            />
          </aside>
        )}
        {/* Main content */}
        <div className={`flex-1 min-w-0 flex flex-col transition-all duration-300 ease-in-out ${
          !isMobile ? (effectiveCollapsed ? 'ml-16' : 'ml-52') : ''
        }`}>
          <Header 
            onMenuToggle={() => {
              setIsSidebarOpen(true);
              setIsMobileSidebarOpen(true);
            }} 
            title={getTitle()}
            subtitle={currentView === 'zakah' ? 'Estimate your Zakat from your wealth and optional additions' : currentView === 'donations' ? 'See the donations amount you gave from your income' : (
                currentView === 'accounts'
                  ? 'Manage your financial accounts'
                  : currentView === 'transactions'
                    ? 'Track and manage all your financial transactions'
                    : currentView === 'shopping-list'
                      ? (
                        <ExpenseNoteLoadingCaption active={shoppingListLoading}>
                          Track what to buy and manage items from your transaction notes
                        </ExpenseNoteLoadingCaption>
                      )
                      : currentView === 'transfers'
                      ? 'Track and manage all your money transfers between accounts'
                      : currentView === 'purchases'
                        ? 'Track and manage all your purchases.'
                        : currentView === 'lent-borrow'
                          ? 'Track and manage all your lending and borrowing activities'
                          : currentView === 'investments'
                            ? (isInvestmentsBondsTab(investmentsTab)
                              ? 'Track your Bangladesh 100 BDT prize bonds and check draw results'
                              : 'Track business investment contracts and profit updates')
                          : currentView === 'clients'
                            ? 'Manage your clients and track their information'
                            : currentView === 'habits'
                              ? 'Gamify your daily habits and build consistency'
                              : currentView === 'history'
                                ? 'Track all your financial activities and changes'
                                : currentView === 'favorite-quotes'
                                  ? 'Manage your favorite motivational quotes and inspiration'
                                  : currentView === 'achievements'
                                    ? 'Unlock badges and track your financial journey progress'
                                    : currentView === 'learning'
                                      ? 'Track your learning progress by organizing courses into modules'
                                      : currentView === 'personal-growth'
                                        ? 'Grow personally through habits, notes, learning, quotes, and achievements'
                                        : currentView === 'notes'
                                          ? 'Write and browse your day-to-day notes'
                                        : currentView === 'analytics'
                                          ? 'Analyze your financial data with insights and trends'
                                          : currentView === 'last-wish'
                                            ? 'Configure check-ins, recipients, and what to include if delivery is triggered'
                                          : currentView === 'settings'
                                            ? 'Manage your account preferences and application settings'
                                            : undefined
            )}
          />
          <main className={`flex-1 w-full min-w-0 p-1 sm:p-2 lg:p-4 overflow-y-auto bg-gray-50 dark:bg-gray-900 max-w-full pb-safe-bottom ${isMobile ? 'browser-bottom-nav-spacing' : ''}`}>
            {children}
          </main>
        </div>
      </div>
      
      {/* Pomodoro Timer Bottom Bar */}
      <PomodoroTimerBar />
      
      {/* TodosWidget - Always mounted globally for modal access (widget UI hidden - only modal functionality) */}
      {TodosWidget && <TodosWidget isAccordionExpanded={false} onAccordionToggle={() => {}} showWidgetUI={false} />}
      
      <FloatingActionButton />
      {/* Mobile sidebar overlay rendered outside the main flex container */}
      {isMobile && isSidebarOpen && (
        <div className="fixed inset-0 z-[99999] flex">
          <aside className="w-16 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
            <Sidebar 
              isOpen={isSidebarOpen} 
              onToggle={() => {
                setIsSidebarOpen(false);
                setIsMobileSidebarOpen(false);
              }}
              currentView={currentView}
              onViewChange={handleViewChange}
            />
          </aside>
          <div className="flex-1 h-full bg-black bg-opacity-50" onClick={() => {
            setIsSidebarOpen(false);
            setIsMobileSidebarOpen(false);
          }} />
        </div>
      )}
    </>
  );
}; 