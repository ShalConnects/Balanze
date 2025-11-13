import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { DollarSign, TrendingUp, TrendingDown, CreditCard, Banknote, ArrowRight, ShoppingCart, Clock, CheckCircle, XCircle, PieChart, LineChart, X } from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useAuthStore } from '../../store/authStore';
import { StatCard } from './StatCard';
import { TransactionChart } from './TransactionChart';
import { RecentTransactions } from './RecentTransactions';
import { AccountsOverview } from './AccountsOverview';
import { ToDoList } from './ToDoList';
import { PurchaseOverviewAlerts } from './PurchaseOverviewAlerts';
import { formatCurrency } from '../../utils/currency';
import { FloatingActionButton } from '../Layout/FloatingActionButton';
import { TransactionForm } from '../Transactions/TransactionForm';
import { AccountForm } from '../Accounts/AccountForm';
import { TransferModal } from '../Transfers/TransferModal';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LendBorrowSingleReminder } from './LendBorrowSingleReminder';
import { LendBorrowSummaryCard } from './LendBorrowSummaryCard';
import { TransferSummaryCard } from './TransferSummaryCard';
import { CurrencyOverviewCard } from './CurrencyOverviewCard';
import { DonationSavingsOverviewCard } from './DonationSavingsOverviewCard';
import { StickyNote } from '../StickyNote';
// NotesAndTodosWidget loaded dynamically to reduce initial bundle size
// import { NotesAndTodosWidget } from './NotesAndTodosWidget';
import { PurchaseForm } from '../Purchases/PurchaseForm';
import { useLoadingContext } from '../../context/LoadingContext';
import { SkeletonCard, SkeletonChart } from '../common/Skeleton';
import { DashboardSkeleton } from './DashboardSkeleton';
import { LastWishCountdownWidget } from './LastWishCountdownWidget';
import { MotivationalQuote } from './MotivationalQuote';
import { MobileAccordionWidget } from './MobileAccordionWidget';
import { getPreference, setPreference } from '../../lib/userPreferences';
import { toast } from 'sonner';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import PullToRefreshDashboard from './PullToRefreshDashboard';
import { supabase } from '../../lib/supabase';


interface DashboardProps {
  onViewChange: (view: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onViewChange }) => {
  const { isMobile } = useMobileDetection();
  const { 
    getDashboardStats, 
    getActiveAccounts, 
    getActiveTransactions, 
    showTransactionForm, 
    showAccountForm, 
    showTransferModal, 
    setShowTransactionForm, 
    setShowAccountForm, 
    setShowTransferModal,
    loading: storeLoading,
    showPurchaseForm,
    setShowPurchaseForm,
    purchaseCategories,
    accounts,
    addPurchase
  } = useFinanceStore();
  
  // Subscribe to store data changes to make stats reactive
  const storeAccounts = useFinanceStore((state) => state.accounts);
  const storeTransactions = useFinanceStore((state) => state.transactions);
  
  // Use local loading state for dashboard instead of global store loading
  // Initialize with true to prevent flash of empty state
  const [dashboardLoading, setDashboardLoading] = useState(true);
  // Track if initial data fetch has completed
  const [initialDataFetched, setInitialDataFetched] = useState(false);
  // Track if there was an error during initial load
  const [hasLoadError, setHasLoadError] = useState(false);
  // Track retry attempts
  const [retryCount, setRetryCount] = useState(0);
  // Lazy load NotesAndTodosWidget to reduce initial bundle size
  const [NotesAndTodosWidget, setNotesAndTodosWidget] = useState<React.ComponentType | null>(null);

  // Lazy load NotesAndTodosWidget after initial render
  useEffect(() => {
    if (!NotesAndTodosWidget) {
      // Load after a short delay to prioritize critical content
      const timer = setTimeout(() => {
        import('./NotesAndTodosWidget').then((module) => {
          setNotesAndTodosWidget(() => module.NotesAndTodosWidget);
        }).catch(() => {
          // Silently fail if widget can't be loaded
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [NotesAndTodosWidget]);

  // Memoize store functions to prevent infinite loops
  const fetchTransactions = useCallback(() => {
    useFinanceStore.getState().fetchTransactions();
  }, []);

  const fetchAccounts = useCallback(() => {
    useFinanceStore.getState().fetchAccounts();
  }, []);

  const fetchCategories = useCallback(() => {
    useFinanceStore.getState().fetchCategories();
  }, []);

  const fetchPurchaseCategories = useCallback(() => {
    useFinanceStore.getState().fetchPurchaseCategories();
  }, []);

  const fetchDonationSavingRecords = useCallback(() => {
    useFinanceStore.getState().fetchDonationSavingRecords();
  }, []);

  // Retry function for failed data loads
  const retryDataLoad = useCallback(async () => {
    if (retryCount >= 3) {
      console.warn('Max retry attempts reached, giving up');
      return;
    }
    
    setRetryCount(prev => prev + 1);
    setHasLoadError(false);
    setDashboardLoading(true);
    
    try {
      await Promise.all([
        fetchTransactions(),
        fetchAccounts(),
        fetchCategories(),
        fetchPurchaseCategories(),
        fetchDonationSavingRecords(),
        useFinanceStore.getState().fetchPurchases()
      ]);
      
      setDashboardLoading(false);
      setInitialDataFetched(true);
      setRetryCount(0); // Reset retry count on success
    } catch (error) {
      console.error('Retry failed:', error);
      setDashboardLoading(false);
      setHasLoadError(true);
    }
  }, [retryCount, fetchTransactions, fetchAccounts, fetchCategories, fetchPurchaseCategories, fetchDonationSavingRecords]);

  // Combined refresh handler for PullToRefresh with timeout protection
  const handleRefresh = useCallback(async () => {
    const startTime = Date.now();
    
    let timeoutId: NodeJS.Timeout | null = null;
    
    try {
      // Add 10-second overall timeout
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('Refresh timeout'));
        }, 10000);
      });
      const results = await Promise.race([
        Promise.allSettled([
          fetchTransactions(),
          fetchAccounts(),
          fetchCategories(),
          fetchPurchaseCategories(),
          fetchDonationSavingRecords(),
          useFinanceStore.getState().fetchPurchases()
        ]),
        timeoutPromise
      ]);
      
      // Clear the timeout since we completed successfully
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      return;
      
    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
      
      // Clear timeout on error as well
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      throw error; // Re-throw to let PullToRefresh handle error state
    }
  }, [fetchTransactions, fetchAccounts, fetchCategories, fetchPurchaseCategories, fetchDonationSavingRecords]);
  
  const { wrapAsync, setLoadingMessage } = useLoadingContext();
  const { user, profile } = useAuthStore();
  
  // Check if user is premium
  const isPremium = useMemo(() => {
    return profile?.subscription?.plan !== 'free';
  }, [profile?.subscription?.plan]);
  
  // Check if there are any transfers in transactions
  const hasTransfersInTransactions = useMemo(() => {
    return storeTransactions.some(t => 
      t.tags?.some((tag: string) => tag.includes('transfer'))
    );
  }, [storeTransactions]);
  
  // Check if there are any DPS transfers
  const [hasDpsTransfers, setHasDpsTransfers] = useState(false);
  useEffect(() => {
    if (user?.id) {
      supabase
        .from('dps_transfers')
        .select('id', { count: 'exact', head: true })
        .then(({ count }) => {
          setHasDpsTransfers((count || 0) > 0);
        })
        .catch(() => {
          setHasDpsTransfers(false);
        });
    } else {
      setHasDpsTransfers(false);
    }
  }, [user?.id]);
  
  // Combined check for any transfers (regular or DPS)
  const hasTransfers = hasTransfersInTransactions || hasDpsTransfers;
  
  // Check widget visibility from localStorage (reactive)
  const [showLendBorrowWidget, setShowLendBorrowWidget] = useState(() => {
    const saved = localStorage.getItem('showLendBorrowWidget');
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  const [showTransferWidget, setShowTransferWidget] = useState(() => {
    const saved = localStorage.getItem('showTransferWidget');
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  const [showDonationsSavingsWidget, setShowDonationsSavingsWidget] = useState(() => {
    const saved = localStorage.getItem('showDonationsSavingsWidget');
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  // Listen to localStorage changes for widget visibility
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'showPurchasesWidget' && e.newValue !== null) {
        setShowPurchasesWidget(JSON.parse(e.newValue));
      }
      if (e.key === 'showLendBorrowWidget' && e.newValue !== null) {
        setShowLendBorrowWidget(JSON.parse(e.newValue));
      }
      if (e.key === 'showTransferWidget' && e.newValue !== null) {
        setShowTransferWidget(JSON.parse(e.newValue));
      }
      if (e.key === 'showDonationsSavingsWidget' && e.newValue !== null) {
        setShowDonationsSavingsWidget(JSON.parse(e.newValue));
      }
    };
    
    const handleCustomStorageChange = () => {
      const savedPurchases = localStorage.getItem('showPurchasesWidget');
      if (savedPurchases !== null) {
        setShowPurchasesWidget(JSON.parse(savedPurchases));
      }
      const savedLendBorrow = localStorage.getItem('showLendBorrowWidget');
      if (savedLendBorrow !== null) {
        setShowLendBorrowWidget(JSON.parse(savedLendBorrow));
      }
      const savedTransfer = localStorage.getItem('showTransferWidget');
      if (savedTransfer !== null) {
        setShowTransferWidget(JSON.parse(savedTransfer));
      }
      const savedDonationsSavings = localStorage.getItem('showDonationsSavingsWidget');
      if (savedDonationsSavings !== null) {
        setShowDonationsSavingsWidget(JSON.parse(savedDonationsSavings));
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('showPurchasesWidgetChanged', handleCustomStorageChange);
    window.addEventListener('showLendBorrowWidgetChanged', handleCustomStorageChange);
    window.addEventListener('showTransferWidgetChanged', handleCustomStorageChange);
    window.addEventListener('showDonationsSavingsWidgetChanged', handleCustomStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('showPurchasesWidgetChanged', handleCustomStorageChange);
      window.removeEventListener('showLendBorrowWidgetChanged', handleCustomStorageChange);
      window.removeEventListener('showTransferWidgetChanged', handleCustomStorageChange);
      window.removeEventListener('showDonationsSavingsWidgetChanged', handleCustomStorageChange);
    };
  }, []);
  
  // Check if user has lend_borrow records
  const [hasLendBorrowRecords, setHasLendBorrowRecords] = useState(false);
  useEffect(() => {
    if (isPremium && user?.id) {
      supabase
        .from('lend_borrow')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .then(({ count }) => {
          setHasLendBorrowRecords((count || 0) > 0);
        })
        .catch(() => {
          setHasLendBorrowRecords(false);
        });
    } else {
      setHasLendBorrowRecords(false);
    }
  }, [isPremium, user?.id]);
  
  // Calculate stats reactively when store data changes
  const stats = getDashboardStats();
  const activeAccounts = getActiveAccounts();
  const transactions = getActiveTransactions();
  const allTransactions = storeTransactions; // Use reactive store data
  
  
  
  
  // Debug logging for currency card issue

  const [selectedCurrency, setSelectedCurrency] = useState(stats.byCurrency[0]?.currency || 'USD');
  const [showMultiCurrencyAnalytics, setShowMultiCurrencyAnalytics] = useState(true);
  const [showPurchasesWidget, setShowPurchasesWidget] = useState(true);
  const [isPurchaseWidgetHovered, setIsPurchaseWidgetHovered] = useState(false);
  const [showPurchaseCrossTooltip, setShowPurchaseCrossTooltip] = useState(false);
  const purchaseTooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Load user preferences for multi-currency analytics
  useEffect(() => {
    if (user?.id) {
      const loadPreferences = async () => {
        try {
          const showAnalytics = await getPreference(user.id, 'showMultiCurrencyAnalytics', true);
          setShowMultiCurrencyAnalytics(showAnalytics);
        } catch (error) {
          setShowMultiCurrencyAnalytics(true); // Default to showing
        }
      };
      loadPreferences();
    }
  }, [user?.id]);

  // Load user preferences for purchases widget
  useEffect(() => {
    if (user?.id) {
      const loadPreferences = async () => {
        try {
          const showWidget = await getPreference(user.id, 'showPurchasesWidget', true);
          setShowPurchasesWidget(showWidget);
        } catch (error) {
          setShowPurchasesWidget(true); // Default to showing
        }
      };
      loadPreferences();
    }
  }, [user?.id]);

  // Save Multi-Currency Analytics visibility preference to database
  const handleMultiCurrencyAnalyticsToggle = async (show: boolean) => {
    if (user?.id) {
      try {
        await setPreference(user.id, 'showMultiCurrencyAnalytics', show);
        setShowMultiCurrencyAnalytics(show);
        toast.success('Preference saved!', {
          description: show ? 'Multi-currency analytics will be shown' : 'Multi-currency analytics hidden'
        });
      } catch (error) {
        // Still update local state even if database save fails
        setShowMultiCurrencyAnalytics(show);
        toast.error('Failed to save preference', {
          description: 'Your preference will be saved locally only'
        });
      }
    } else {
      // Fallback to localStorage if no user
      setShowMultiCurrencyAnalytics(show);
      toast.info('Preference saved locally', {
        description: 'Sign in to sync preferences across devices'
      });
    }
  };

  // Handle hover events for purchase widget cross icon (desktop only)
  const handlePurchaseWidgetMouseEnter = () => {
    if (!isMobile) {
      setIsPurchaseWidgetHovered(true);
      setShowPurchaseCrossTooltip(true);
      
      // Clear any existing timeout
      if (purchaseTooltipTimeoutRef.current) {
        clearTimeout(purchaseTooltipTimeoutRef.current);
      }
      
      // Hide tooltip after 1 second
      purchaseTooltipTimeoutRef.current = setTimeout(() => {
        setShowPurchaseCrossTooltip(false);
      }, 1000);
    }
  };

  const handlePurchaseWidgetMouseLeave = () => {
    if (!isMobile) {
      setIsPurchaseWidgetHovered(false);
      setShowPurchaseCrossTooltip(false);
      
      // Clear timeout when mouse leaves
      if (purchaseTooltipTimeoutRef.current) {
        clearTimeout(purchaseTooltipTimeoutRef.current);
        purchaseTooltipTimeoutRef.current = null;
      }
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (purchaseTooltipTimeoutRef.current) {
        clearTimeout(purchaseTooltipTimeoutRef.current);
      }
    };
  }, []);

  // Save Purchases widget visibility preference to database
  const handlePurchasesWidgetToggle = async (show: boolean) => {
    // Update localStorage immediately for instant UI response
    localStorage.setItem('showPurchasesWidget', JSON.stringify(show));
    setShowPurchasesWidget(show);
    window.dispatchEvent(new CustomEvent('showPurchasesWidgetChanged'));
    
    if (user?.id) {
      try {
        await setPreference(user.id, 'showPurchasesWidget', show);
        toast.success('Preference saved!', {
          description: show ? 'Purchases widget will be shown' : 'Purchases widget hidden'
        });
      } catch (error) {
        toast.error('Failed to save preference', {
          description: 'Your preference will be saved locally only'
        });
      }
    } else {
      toast.info('Preference saved locally', {
        description: 'Sign in to sync preferences across devices'
      });
    }
  };

  // Get purchase analytics
  const purchaseAnalytics = useFinanceStore((state) => state.getMultiCurrencyPurchaseAnalytics());
  const purchases = useFinanceStore((state) => state.purchases);
  
  // Check if any widget in the Purchase/LendBorrow/Transfer row will be visible
  const hasAnyWidgetVisible = useMemo(() => {
    const hasPurchase = purchases.length > 0 && showPurchasesWidget;
    const hasLendBorrow = isPremium && hasLendBorrowRecords && showLendBorrowWidget;
    const hasTransfer = hasTransfers && showTransferWidget;
    return hasPurchase || hasLendBorrow || hasTransfer;
  }, [purchases.length, showPurchasesWidget, isPremium, hasLendBorrowRecords, showLendBorrowWidget, hasTransfers, showTransferWidget]);
  
  // Calculate purchase overview stats
  const totalPlannedPurchases = purchases.filter(p => p.status === 'planned').length;
  const totalPurchasedItems = purchases.filter(p => p.status === 'purchased').length;
  const totalCancelledItems = purchases.filter(p => p.status === 'cancelled').length;
  const totalPlannedValue = purchases
    .filter(p => p.status === 'planned')
    .reduce((sum, p) => sum + p.price, 0);
  const recentPurchases = purchases
    .filter(p => p.status === 'purchased')
    .sort((a, b) => new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime())
    .slice(0, 5);


  // Initial data fetch when dashboard loads
  useEffect(() => {
    const refreshData = async () => {
      try {
        // Wait for user to be authenticated
        if (!user) {
          // Keep showing skeleton while waiting for user authentication
          return;
        }

        // Reset error state and start loading
        setHasLoadError(false);
        setDashboardLoading(true);
        setLoadingMessage('Loading dashboard data...');

        await Promise.all([
          fetchTransactions(),
          fetchAccounts(),
          fetchCategories(),
          fetchPurchaseCategories(),
          fetchDonationSavingRecords(),
          useFinanceStore.getState().fetchPurchases()
        ]);

        // Success - hide loading
        setDashboardLoading(false);
        setInitialDataFetched(true);
        setLoadingMessage('');

      } catch (error) {
        console.error('Dashboard data fetch error:', error);
        // Error - still show dashboard but mark as having an error
        setDashboardLoading(false);
        setInitialDataFetched(true);
        setHasLoadError(true);
        setLoadingMessage('');
      }
    };
    
    // Only fetch data when user is authenticated and data hasn't been fetched yet
    if (user && !initialDataFetched) {
      refreshData();
    }
  }, [user, initialDataFetched, setLoadingMessage]);

  // Force loading state to false after a timeout to prevent infinite loading
  useEffect(() => {
    if (dashboardLoading && user) {
      const timeoutId = setTimeout(() => {
        console.warn('Dashboard loading timeout reached, showing dashboard anyway');
        setDashboardLoading(false);
        setInitialDataFetched(true);
        setHasLoadError(true);
        setLoadingMessage('');
      }, 8000); // 8 second timeout (reduced from 10)
      
      return () => clearTimeout(timeoutId);
    }
  }, [dashboardLoading, user]);

  // Listen for global refresh events from header
  useEffect(() => {
    const handleDataRefresh = async () => {
      try {
        await handleRefresh();
      } catch (error) {
        console.error('Error handling global data refresh:', error);
      }
    };

    window.addEventListener('dataRefreshed', handleDataRefresh);
    return () => {
      window.removeEventListener('dataRefreshed', handleDataRefresh);
    };
  }, [handleRefresh]);

  // Auto refresh removed - data will only be fetched on component mount

  // Manual refresh is handled by the Header component's refresh button

  // Calculate total income and expenses
  const totalIncome = transactions
    .filter(t => t.type === 'income' && !t.tags?.some((tag: string) => tag.includes('transfer') || tag.includes('dps_transfer')))
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions
    .filter(t => t.type === 'expense' && !t.tags?.some((tag: string) => tag.includes('transfer') || tag.includes('dps_transfer')))
    .reduce((sum, t) => sum + t.amount, 0);

  // Use the raw accounts array from the store
  const rawAccounts = useFinanceStore((state) => state.accounts);
  
  // Debug logging for accounts and stats

  // Calculate spending breakdown data for pie chart
  const getSpendingBreakdown = () => {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    
    const expenses = transactions.filter(t => 
      t.type === 'expense' && 
      new Date(t.date) >= last30Days &&
      !t.tags?.some(tag => tag.includes('transfer') || tag.includes('dps_transfer'))
    );

    const categoryTotals = expenses.reduce((acc, transaction) => {
      const category = transaction.category || 'Other';
      acc[category] = (acc[category] || 0) + transaction.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value: Math.round(value * 100) / 100
    }));
  };

  // Calculate monthly trends data for line chart
  const getMonthlyTrends = () => {
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return {
        month: date.toLocaleString('default', { month: 'short' }),
        income: 0,
        expenses: 0
      };
    }).reverse();

    transactions.forEach(transaction => {
      const transactionDate = new Date(transaction.date);
      const monthIndex = last6Months.findIndex(m => 
        new Date().getMonth() - (5 - last6Months.indexOf(m)) === transactionDate.getMonth()
      );
      
      if (monthIndex !== -1) {
        if (transaction.type === 'income') {
          last6Months[monthIndex].income += transaction.amount;
        } else if (transaction.type === 'expense') {
          last6Months[monthIndex].expenses += transaction.amount;
        }
      }
    });

    return last6Months;
  };

  const spendingData = getSpendingBreakdown();
  const trendsData = getMonthlyTrends();
  
  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B6B'];

  const [submittingPurchase, setSubmittingPurchase] = React.useState(false);
  const handlePurchaseSubmit = async (data: any) => {
    setSubmittingPurchase(true);
    try {
      await addPurchase(data);
      setShowPurchaseForm(false);
    } finally {
      setSubmittingPurchase(false);
    }
  };

  // Show loading skeleton while data is being fetched or until initial fetch completes
  // Show skeleton if: user is not authenticated, data is loading, or initial fetch hasn't completed
  if (!user || dashboardLoading || !initialDataFetched) {
    return (
      <>
        <DashboardSkeleton />
        {hasLoadError && (
          <div className="fixed bottom-4 right-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg p-4 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="text-red-600 dark:text-red-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  Failed to load dashboard data
                </p>
                <p className="text-xs text-red-600 dark:text-red-400">
                  Retry attempt {retryCount}/3
                </p>
              </div>
              <button
                onClick={retryDataLoad}
                disabled={retryCount >= 3}
                className="text-xs bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-3 py-1 rounded transition-colors"
              >
                {retryCount >= 3 ? 'Max Retries' : 'Retry'}
              </button>
            </div>
          </div>
        )}
        <FloatingActionButton />
      </>
    );
  }

  return (
    <>
      <PullToRefreshDashboard onRefresh={handleRefresh} />
      {/* Main Dashboard Content */}
      <div data-tour="dashboard" className="flex flex-col lg:flex-row gap-6">
        {/* Main Content - Full width on mobile, flex-1 on desktop */}
        <div className="flex-1 space-y-6">

          {/* Multi-Currency Quick Access */}
          {stats.byCurrency.length > 1 && showMultiCurrencyAnalytics && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-700 relative">
              <button
                onClick={() => handleMultiCurrencyAnalyticsToggle(false)}
                className="absolute top-1/2 right-2 transform -translate-y-1/2 p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 transition-colors"
                aria-label="Close Multi-Currency Analytics"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center justify-between pr-8">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                    Multi-Currency Analytics
                  </h3>
                  <p className="text-blue-700 dark:text-blue-300 text-sm">
                    You have {stats.byCurrency.length} currencies. Get detailed insights and comparisons.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/currency-analytics')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <span>View Analytics</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}



          {/* Currency Sections & Donations - Responsive grid */}
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 gap-4 lg:gap-6 items-stretch">
            {stats.byCurrency.length > 0 ? (
              stats.byCurrency.map(({ currency }) => (
                <div key={currency} className="w-full h-full">
                  <CurrencyOverviewCard
                    currency={currency}
                    transactions={allTransactions}
                    accounts={rawAccounts}
                    t={t}
                    formatCurrency={formatCurrency}
                  />
                </div>
              ))
            ) : (
              // Fallback: Show currency cards for all active accounts if stats.byCurrency is empty
              Array.from(new Set(rawAccounts.filter(acc => acc.isActive).map(acc => acc.currency))).map(currency => (
                <div key={currency} className="w-full h-full">
                  <CurrencyOverviewCard
                    currency={currency}
                    transactions={allTransactions}
                    accounts={rawAccounts}
                    t={t}
                    formatCurrency={formatCurrency}
                  />
                </div>
              ))
            )}
            {/* Donations Overview Card - Place after currency cards */}
            {showDonationsSavingsWidget && (
              <div className="w-full h-full">
                <DonationSavingsOverviewCard
                  t={t}
                  formatCurrency={formatCurrency}
                />
              </div>
            )}
            
          </div>


          {/* Purchase Overview & L&B Summary Row - Responsive grid */}
          {hasAnyWidgetVisible && (
            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 gap-4 lg:gap-6">
            {/* Purchase Overview */}
            {purchases.length > 0 && showPurchasesWidget && (
              <div 
                className="w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 lg:p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-blue-200/50 dark:border-blue-800/50 hover:border-blue-300 dark:hover:border-blue-700 relative"
                onMouseEnter={handlePurchaseWidgetMouseEnter}
                onMouseLeave={handlePurchaseWidgetMouseLeave}
              >
                {/* Hide button - hover on desktop, always visible on mobile */}
                {(isPurchaseWidgetHovered || isMobile) && (
                  <button
                    onClick={() => handlePurchasesWidgetToggle(false)}
                    className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors z-10"
                    aria-label="Hide Purchases widget"
                  >
                    <X className="w-4 h-4" />
                    {/* Tooltip - only on desktop */}
                    {showPurchaseCrossTooltip && !isMobile && (
                      <div className="absolute bottom-full right-0 mb-1 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded shadow-lg whitespace-nowrap z-20">
                        Click to hide this widget
                        <div className="absolute -bottom-1 right-2 w-2 h-2 bg-gray-900 dark:bg-gray-100 rotate-45"></div>
                      </div>
                    )}
                  </button>
                )}
                
                <div className="flex items-center justify-between mb-4 pr-8">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Purchases</h2>
                  <Link 
                    to="/purchases" 
                    className="text-sm font-medium flex items-center space-x-1 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                  >
                    <span>View All</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                {/* Purchase Stats Cards - Responsive grid */}
                <div className="grid grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4 mb-6">
                  <StatCard
                    title="Planned Purchases"
                    value={totalPlannedPurchases.toString()}
                    color="yellow"
                  />
                  <StatCard
                    title="Purchased Items"
                    value={totalPurchasedItems.toString()}
                    trend="up"
                    color="red"
                  />
                </div>
              </div>
            )}
            {/* L&B Summary Card */}
            {isPremium && hasLendBorrowRecords && showLendBorrowWidget && (
              <div className="w-full">
                <LendBorrowSummaryCard />
              </div>
            )}
            
            {/* Transfer Summary Card */}
            {hasTransfers && showTransferWidget && (
              <div className="w-full">
                <TransferSummaryCard />
              </div>
            )}
          </div>
          )}

          {/* Motivational Quote - Hidden on mobile, shown on desktop */}
          <div className="hidden lg:block">
            <MotivationalQuote enableExternalLink={true} />
          </div>

          {/* Recent Transactions - Hidden on mobile, shown on desktop */}
          <div className="hidden lg:block w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 lg:p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-blue-200/50 dark:border-blue-800/50 hover:border-blue-300 dark:hover:border-blue-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('dashboard.recentTransactions')}</h2>
              <Link 
                to="/transactions" 
                className="text-sm font-medium flex items-center space-x-1 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
              >
                <span>View All</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <RecentTransactions />
          </div>
        </div>

        {/* Right Sidebar - Hidden on mobile, shown on desktop */}
        <div className="hidden lg:block w-72 space-y-6">
          <LastWishCountdownWidget />
          {NotesAndTodosWidget ? <NotesAndTodosWidget /> : null}
        </div>

        {/* Mobile Bottom Section - Accordion Layout */}
        <div className="lg:hidden dashboard-mobile-container">
          <MobileAccordionWidget />
        </div>

        <FloatingActionButton />
      </div>



      {/* Modals - Consolidated at the end to prevent multiple instances */}
      {/* TransactionForm is handled by FloatingActionButton to prevent conflicts */}

      {showTransferModal && (
        <TransferModal isOpen={showTransferModal} onClose={() => setShowTransferModal(false)} />
      )}

      {showPurchaseForm && (
        <PurchaseForm 
          isOpen={showPurchaseForm} 
          onClose={() => setShowPurchaseForm(false)}
        />
      )}
    </>
  );
};

// Add fade-in animation to global styles (tailwind.config.js or index.css):
// .animate-fadein { animation: fadein 0.8s cubic-bezier(0.4,0,0.2,1) both; }
// @keyframes fadein { from { opacity: 0; transform: translateY(24px);} to { opacity: 1; transform: none; } }