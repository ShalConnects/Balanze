import React, { useState, useEffect, useCallback } from 'react';
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
import { CurrencyOverviewCard } from './CurrencyOverviewCard';
import { DonationSavingsOverviewCard } from './DonationSavingsOverviewCard';
import { StickyNote } from '../StickyNote';
import { NotesAndTodosWidget } from './NotesAndTodosWidget';
import { PurchaseForm } from '../Purchases/PurchaseForm';
import { useLoadingContext } from '../../context/LoadingContext';
import { SkeletonCard, SkeletonChart } from '../common/Skeleton';
import { DashboardSkeleton } from './DashboardSkeleton';
import { LastWishCountdownWidget } from './LastWishCountdownWidget';
import { MotivationalQuote } from './MotivationalQuote';
import { getPreference, setPreference } from '../../lib/userPreferences';
import { toast } from 'sonner';


interface DashboardProps {
  onViewChange: (view: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onViewChange }) => {
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
  
  // Use local loading state for dashboard instead of global store loading
  // Initialize with true to prevent flash of empty state
  const [dashboardLoading, setDashboardLoading] = useState(true);
  // Track if initial data fetch has completed
  const [initialDataFetched, setInitialDataFetched] = useState(false);
  


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
  
  const { wrapAsync, setLoadingMessage } = useLoadingContext();
  const { user } = useAuthStore();
  
  const stats = getDashboardStats();
  const activeAccounts = getActiveAccounts();
  const transactions = getActiveTransactions();
  const allTransactions = useFinanceStore((state) => state.transactions); // Get all transactions, not just active ones
  
  
  // Debug logging for currency card issue

  const [selectedCurrency, setSelectedCurrency] = useState(stats.byCurrency[0]?.currency || 'USD');
  const [showMultiCurrencyAnalytics, setShowMultiCurrencyAnalytics] = useState(true);
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
          console.error('Error loading user preferences:', error);
          setShowMultiCurrencyAnalytics(true); // Default to showing
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
        console.error('Error saving user preferences:', error);
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

  // Get purchase analytics
  const purchaseAnalytics = useFinanceStore((state) => state.getMultiCurrencyPurchaseAnalytics());
  const purchases = useFinanceStore((state) => state.purchases);
  
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

  // Responsive state detection
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 767);
      setIsTablet(width > 767 && width <= 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Fetch purchases data when dashboard loads
  useEffect(() => {
    const fetchData = async () => {
      try {
        await useFinanceStore.getState().fetchPurchases();
      } catch (error) {
        console.error('Error fetching purchases:', error);
      }
    };
    fetchData();
  }, []);

  // Initial data fetch when dashboard loads
  useEffect(() => {
    const refreshData = async () => {
      try {
        // Wait for user to be authenticated
        if (!user) {
          console.log('User not authenticated yet, skipping data fetch');
          setDashboardLoading(false);
          setInitialDataFetched(true);
          return;
        }

        // Keep loading true while fetching
        setDashboardLoading(true);
        setLoadingMessage('Loading dashboard data...'); // Show loading message for data fetch

        await Promise.all([
          fetchTransactions(),
          fetchAccounts(),
          fetchCategories(),
          fetchPurchaseCategories(),
          fetchDonationSavingRecords()
        ]);

        setDashboardLoading(false);
        setInitialDataFetched(true);
        setLoadingMessage(''); // Clear loading message

      } catch (error) {
        console.error('Error refreshing dashboard data:', error);
        setDashboardLoading(false);
        setInitialDataFetched(true);
        setLoadingMessage(''); // Clear loading message even on error
        // Don't let errors break the dashboard
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
        console.log('Dashboard: Force clearing loading state after timeout');
        setDashboardLoading(false);
      }, 10000); // 10 second timeout
      
      return () => clearTimeout(timeoutId);
    }
  }, [dashboardLoading, user]);

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
  if (dashboardLoading || !initialDataFetched) {
    return (
      <>
        <DashboardSkeleton />
        <FloatingActionButton />
      </>
    );
  }

  return (
    <>
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



          {/* Currency Sections & Donations & Savings - Responsive grid */}
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 gap-4 lg:gap-6">
            {stats.byCurrency.map(({ currency }) => (
              <div key={currency} className="w-full">
                <CurrencyOverviewCard
                  currency={currency}
                  transactions={allTransactions}
                  accounts={rawAccounts}
                  t={t}
                  formatCurrency={formatCurrency}
                />
              </div>
            ))}
            {/* Donations & Savings Overview Card - Place after currency cards */}
            <div className="w-full">
              <DonationSavingsOverviewCard
                t={t}
                formatCurrency={formatCurrency}
              />
            </div>
            
          </div>

          {/* Separator */}
          <div className="border-t border-gray-200 dark:border-gray-700 my-6"></div>

          {/* Purchase Overview & Lend & Borrow Summary Row - Responsive grid */}
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 gap-4 lg:gap-6">
            {/* Purchase Overview */}
            {purchases.length > 0 && (
              <div className="w-full bg-white dark:bg-gray-800 rounded-xl p-4 lg:p-6">
                <div className="flex items-center justify-between mb-4">
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
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 lg:gap-4 mb-6">
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
            {/* Lend & Borrow Summary Card */}
            <div className="w-full">
              <LendBorrowSummaryCard />
            </div>
          </div>

          {/* Motivational Quote */}
          <MotivationalQuote />

          {/* Recent Transactions - Hidden on mobile, shown on desktop */}
          <div className="hidden lg:block w-full bg-white dark:bg-gray-800 rounded-xl p-4 lg:p-6">
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
          <NotesAndTodosWidget />
        </div>

        {/* Mobile Bottom Section - Notes/Todos and Recent Transactions */}
        <div className="lg:hidden space-y-6 dashboard-mobile-container">
          <LastWishCountdownWidget />
          <NotesAndTodosWidget />
          
          {/* Recent Transactions - Mobile version */}
          <div className="w-full bg-white dark:bg-gray-800 rounded-xl p-4 lg:p-6 transaction-list-mobile">
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