import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { DollarSign, TrendingUp, TrendingDown, CreditCard, Banknote, ArrowRight, ShoppingCart, Clock, CheckCircle, XCircle, PieChart, LineChart, X, Info } from 'lucide-react';
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
import { ClientsOverviewCard } from './ClientsOverviewCard';
import { LearningSummaryCard } from './LearningSummaryCard';
import { ClientTasksWidget } from './ClientTasksWidget';
import { ClientsSummaryWidget } from './ClientsSummaryWidget';
import { TaskRemindersWidget } from './TaskRemindersWidget';
import { useClientStore } from '../../store/useClientStore';
import { useCourseStore } from '../../store/useCourseStore';
import { StickyNote } from '../StickyNote';
// NotesWidget and TodosWidget loaded dynamically to reduce initial bundle size
// import { NotesWidget } from './NotesWidget';
// import { TodosWidget } from './TodosWidget';
import { PurchaseForm } from '../Purchases/PurchaseForm';
import { CustomDropdown } from '../Purchases/CustomDropdown';
import { useLoadingContext } from '../../context/LoadingContext';
import { SkeletonCard, SkeletonChart } from '../common/Skeleton';
import { DashboardSkeleton } from './DashboardSkeleton';
import { LastWishCountdownWidget } from './LastWishCountdownWidget';
import { MotivationalQuote } from './MotivationalQuote';
import { MobileAccordionWidget } from './MobileAccordionWidget';
import { HabitGardenWidget } from '../Habits/HabitGardenWidget';
import { LearningWidget } from '../Learning/LearningWidget';
import { WidgetSection } from './WidgetSection';
import { getPreference, setPreference } from '../../lib/userPreferences';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DraggableWidget } from './DraggableWidget';
import { AccordionWidget } from './AccordionWidget';
import { WidgetSettingsPanel, WidgetConfig, MainDashboardWidget } from './WidgetSettingsPanel';
import { Settings } from 'lucide-react';
import { toast } from 'sonner';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import PullToRefreshDashboard from './PullToRefreshDashboard';
import { supabase } from '../../lib/supabase';
import { isLendBorrowTransaction } from '../../utils/transactionUtils';
import { UpgradeBanner } from '../common/UpgradeBanner';
import { Purchase } from '../../types';

// Constants moved outside component to prevent recreation on every render
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B6B'];

const getDefaultWidgets = (): WidgetConfig[] => [
  { id: 'task-reminders', name: 'Task Reminders', visible: true, order: 0 },
  { id: 'last-wish', name: 'Last Wish', visible: true, order: 1 },
  { id: 'habit-garden', name: 'Habit Garden', visible: true, order: 2 },
  { id: 'learning', name: 'Learning', visible: true, order: 3 },
  { id: 'notes', name: 'Notes', visible: true, order: 4 },
  { id: 'todos', name: 'Todos', visible: true, order: 5 },
];

// Validate widget config structure - moved outside component for better performance
const isValidWidgetConfig = (config: unknown): config is WidgetConfig[] => {
  if (!Array.isArray(config)) return false;
  return config.every(widget => 
    typeof widget === 'object' &&
    widget !== null &&
    typeof (widget as WidgetConfig).id === 'string' &&
    typeof (widget as WidgetConfig).name === 'string' &&
    typeof (widget as WidgetConfig).visible === 'boolean' &&
    typeof (widget as WidgetConfig).order === 'number'
  );
};

// Migrate widget config to include new widgets
const migrateWidgetConfig = (config: WidgetConfig[]): WidgetConfig[] => {
  const defaultWidgets = getDefaultWidgets();
  const configMap = new Map(config.map(w => [w.id, w]));
  const migrated: WidgetConfig[] = [];
  
  // Handle migration from 'notes-todos' to separate 'notes' and 'todos' widgets
  const hasOldNotesTodos = configMap.has('notes-todos');
  if (hasOldNotesTodos) {
    const oldWidget = configMap.get('notes-todos')!;
    // Migrate visibility and order from old combined widget to new separate widgets
    if (!configMap.has('notes')) {
      configMap.set('notes', { id: 'notes', name: 'Notes', visible: oldWidget.visible, order: oldWidget.order });
    }
    if (!configMap.has('todos')) {
      configMap.set('todos', { id: 'todos', name: 'Todos', visible: oldWidget.visible, order: oldWidget.order + 0.5 });
    }
    // Remove old combined widget
    configMap.delete('notes-todos');
  }
  
  // Add all default widgets, preserving existing configs or adding new ones
  defaultWidgets.forEach(defaultWidget => {
    if (configMap.has(defaultWidget.id)) {
      // Keep existing widget config
      migrated.push(configMap.get(defaultWidget.id)!);
    } else {
      // Add new widget with default settings
      migrated.push(defaultWidget);
    }
  });
  
  // Sort by order
  migrated.sort((a, b) => a.order - b.order);
  
  // Reassign order numbers to ensure they're sequential
  return migrated.map((widget, index) => ({
    ...widget,
    order: index,
  }));
};

interface DashboardProps {
  onViewChange?: (view: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onViewChange: _onViewChange }) => {
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
    showPurchaseForm,
    setShowPurchaseForm,
    accounts,
    addPurchase
  } = useFinanceStore();
  
  // Subscribe to store data changes to make stats reactive
  const storeAccounts = useFinanceStore((state) => state.accounts);
  const storeTransactions = useFinanceStore((state) => state.transactions);
  const donationSavingRecords = useFinanceStore((state) => state.donationSavingRecords);
  
  // Use local loading state for dashboard instead of global store loading
  // Initialize with true to prevent flash of empty state
  const [dashboardLoading, setDashboardLoading] = useState(true);
  // Track if initial data fetch has completed
  const [initialDataFetched, setInitialDataFetched] = useState(false);
  // Track if there was an error during initial load
  const [hasLoadError, setHasLoadError] = useState(false);
  // Track retry attempts
  const [retryCount, setRetryCount] = useState(0);
  // Lazy load NotesWidget and TodosWidget to reduce initial bundle size
  const [NotesWidget, setNotesWidget] = useState<React.ComponentType | null>(null);
  const [TodosWidget, setTodosWidget] = useState<React.ComponentType | null>(null);

  // Memoize widget config loading to prevent unnecessary localStorage reads with validation
  const loadWidgetConfig = useCallback((): WidgetConfig[] => {
    const saved = localStorage.getItem('dashboard-widget-config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (isValidWidgetConfig(parsed)) {
          // Migrate to include any new widgets
          return migrateWidgetConfig(parsed);
        } else {
          console.warn('Invalid widget config structure, using defaults');
          return getDefaultWidgets();
        }
      } catch (error) {
        console.error('Error parsing widget config:', error);
        return getDefaultWidgets();
      }
    }
    return getDefaultWidgets();
  }, []);

  const [widgetConfig, setWidgetConfig] = useState<WidgetConfig[]>(() => loadWidgetConfig());
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  
  // Main dashboard widget order
  const [mainDashboardWidgetOrder, setMainDashboardWidgetOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('mainDashboardWidgetOrder');
    return saved ? JSON.parse(saved) : ['donations', 'purchases', 'lend-borrow', 'transfers', 'clients', 'learning'];
  });

  // Accordion state for right sidebar widgets
  const [accordionState, setAccordionState] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('rightSidebarAccordionState');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {};
      }
    }
    // Default: all expanded
    return {
      'task-reminders': true,
      'last-wish': true,
      'habit-garden': true,
      'learning': true,
      'notes-todos': true,
    };
  });

  // Save accordion state to localStorage
  useEffect(() => {
    localStorage.setItem('rightSidebarAccordionState', JSON.stringify(accordionState));
  }, [accordionState]);

  // Toggle accordion for a specific widget
  const handleAccordionToggle = useCallback((widgetId: string) => {
    setAccordionState(prev => ({
      ...prev,
      [widgetId]: !prev[widgetId],
    }));
  }, []);

  // Save widget config to localStorage
  useEffect(() => {
    localStorage.setItem('dashboard-widget-config', JSON.stringify(widgetConfig));
  }, [widgetConfig]);

  // Save main dashboard widget order to localStorage
  useEffect(() => {
    localStorage.setItem('mainDashboardWidgetOrder', JSON.stringify(mainDashboardWidgetOrder));
  }, [mainDashboardWidgetOrder]);

  // Drag and drop sensors - optimized for both touch and mouse
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before activating drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = widgetConfig.findIndex(w => w.id === active.id);
    const newIndex = widgetConfig.findIndex(w => w.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newConfig = arrayMove(widgetConfig, oldIndex, newIndex).map((w, index) => ({
        ...w,
        order: index,
      }));
      setWidgetConfig(newConfig);
    }
  }, [widgetConfig]);

  const handleWidgetUpdate = useCallback((updatedWidgets: WidgetConfig[]) => {
    setWidgetConfig(updatedWidgets);
  }, []);

  // Handle Task Reminders widget toggle
  const handleTaskRemindersWidgetToggle = useCallback((show: boolean) => {
    setWidgetConfig(prev => 
      prev.map(w => w.id === 'task-reminders' ? { ...w, visible: show } : w)
    );
  }, []);

  const handleResetWidgets = useCallback(() => {
    setWidgetConfig(getDefaultWidgets());
  }, []);

  // Handle main dashboard widget order update
  const handleMainDashboardWidgetUpdate = useCallback((updatedWidgets: MainDashboardWidget[]) => {
    const newOrder = updatedWidgets.map(w => w.id);
    setMainDashboardWidgetOrder(newOrder);
  }, []);

  // Get visible widgets sorted by order - memoized for performance
  const visibleWidgets = useMemo(() => 
    widgetConfig
      .filter(w => w.visible)
      .sort((a, b) => a.order - b.order),
    [widgetConfig]
  );

  // Lazy load NotesWidget and TodosWidget after initial render - with improved error handling
  useEffect(() => {
    if (!NotesWidget) {
      let isMounted = true;
      // Load after a short delay to prioritize critical content
      const timer = setTimeout(() => {
        import('./NotesWidget')
          .then((module) => {
            if (isMounted && module?.NotesWidget) {
              setNotesWidget(() => module.NotesWidget);
            }
          })
          .catch((error) => {
            if (isMounted) {
              console.error('Failed to load NotesWidget:', error);
              // Widget will remain null, which is handled gracefully in render
            }
          });
      }, 500);
      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    }
  }, [NotesWidget]);

  useEffect(() => {
    if (!TodosWidget) {
      let isMounted = true;
      // Load after a short delay to prioritize critical content
      const timer = setTimeout(() => {
        import('./TodosWidget')
          .then((module) => {
            if (isMounted && module?.TodosWidget) {
              setTodosWidget(() => module.TodosWidget);
            }
          })
          .catch((error) => {
            if (isMounted) {
              console.error('Failed to load TodosWidget:', error);
              // Widget will remain null, which is handled gracefully in render
            }
          });
      }, 500);
      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    }
  }, [TodosWidget]);

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

  // Retry function for failed data loads - with consistent error handling
  const retryDataLoad = useCallback(async () => {
    if (retryCount >= MAX_RETRY_ATTEMPTS) {
      toast.error('Maximum retry attempts reached', {
        description: 'Please refresh the page or contact support if the problem persists.'
      });
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
      toast.success('Dashboard data loaded successfully');
    } catch (error) {
      console.error('Error retrying data load:', error);
      setDashboardLoading(false);
      setHasLoadError(true);
      
      // Show user-friendly error message
      if (retryCount < MAX_RETRY_ATTEMPTS - 1) {
        toast.error('Failed to load data', {
          description: `Retrying... (${retryCount + 1}/${MAX_RETRY_ATTEMPTS})`
        });
      }
    }
  }, [retryCount, fetchTransactions, fetchAccounts, fetchCategories, fetchPurchaseCategories, fetchDonationSavingRecords]);

  // Combined refresh handler for PullToRefresh with timeout protection and consistent error handling
  const handleRefresh = useCallback(async () => {
    const abortController = new AbortController();
    let timeoutId: NodeJS.Timeout | null = null;
    
    try {
      // Add timeout protection
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          abortController.abort();
          reject(new Error('Refresh timeout'));
        }, REFRESH_TIMEOUT);
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
      
      // Check for any failed promises
      if (Array.isArray(results)) {
        const failures = results.filter(r => r.status === 'rejected');
        if (failures.length > 0) {
          console.error('Some data failed to refresh:', failures);
          // Don't throw - allow partial success
        }
      }
      
    } catch (error) {
      // Clear timeout on error as well
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Only throw if not aborted (abort is expected behavior)
      if (!abortController.signal.aborted) {
        console.error('Error refreshing dashboard:', error);
        throw error; // Re-throw to let PullToRefresh handle error state
      }
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
  
  // Check if there are any DPS transfers - with caching to prevent unnecessary queries
  const [hasDpsTransfers, setHasDpsTransfers] = useState(false);
  const dpsTransfersCacheRef = useRef<{ userId: string | undefined; hasTransfers: boolean } | null>(null);
  
  useEffect(() => {
    if (!user?.id) {
      setHasDpsTransfers(false);
      dpsTransfersCacheRef.current = null;
      return;
    }
    
    // Use cached value if available and user hasn't changed
    if (dpsTransfersCacheRef.current?.userId === user.id) {
      setHasDpsTransfers(dpsTransfersCacheRef.current.hasTransfers);
      return;
    }
    
    let isMounted = true;
    const abortController = new AbortController();
    
    supabase
      .from('dps_transfers')
      .select('id', { count: 'exact', head: true })
      .then(({ count, error }) => {
        if (!isMounted || abortController.signal.aborted) return;
        
        if (error) {
          console.error('Error checking DPS transfers:', error);
          setHasDpsTransfers(false);
          dpsTransfersCacheRef.current = { userId: user.id, hasTransfers: false };
        } else {
          const hasTransfers = (count || 0) > 0;
          setHasDpsTransfers(hasTransfers);
          dpsTransfersCacheRef.current = { userId: user.id, hasTransfers };
        }
      })
      .catch((error) => {
        if (!isMounted || abortController.signal.aborted) return;
        console.error('Error checking DPS transfers:', error);
        setHasDpsTransfers(false);
        dpsTransfersCacheRef.current = { userId: user.id, hasTransfers: false };
      });
    
    return () => {
      isMounted = false;
      abortController.abort();
    };
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
  
  const [showClientsWidget, setShowClientsWidget] = useState(() => {
    const saved = localStorage.getItem('showClientsWidget');
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  const [showLearningWidget, setShowLearningWidget] = useState(() => {
    const saved = localStorage.getItem('showLearningWidget');
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  // Get clients from store
  const clients = useClientStore((state) => state.clients);
  const fetchClients = useClientStore((state) => state.fetchClients);
  
  // Get courses from store
  const courses = useCourseStore((state) => state.courses);
  
  // Listen to localStorage changes for widget visibility - with error handling
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (!e.newValue) return;
      
      try {
        if (e.key === 'showPurchasesWidget') {
          setShowPurchasesWidget(JSON.parse(e.newValue));
        } else if (e.key === 'showLendBorrowWidget') {
          setShowLendBorrowWidget(JSON.parse(e.newValue));
        } else if (e.key === 'showTransferWidget') {
          setShowTransferWidget(JSON.parse(e.newValue));
        } else if (e.key === 'showDonationsSavingsWidget') {
          setShowDonationsSavingsWidget(JSON.parse(e.newValue));
        } else if (e.key === 'showClientsWidget') {
          setShowClientsWidget(JSON.parse(e.newValue));
        } else if (e.key === 'showLearningWidget') {
          setShowLearningWidget(JSON.parse(e.newValue));
        }
      } catch (error) {
        console.error(`Error parsing localStorage value for ${e.key}:`, error);
        // Keep current state on parse error
      }
    };
    
    const handleCustomStorageChange = () => {
      try {
        const savedPurchases = localStorage.getItem('showPurchasesWidget');
        if (savedPurchases !== null) {
          setShowPurchasesWidget(JSON.parse(savedPurchases));
        }
      } catch (error) {
        console.error('Error parsing showPurchasesWidget from localStorage:', error);
      }
      
      try {
        const savedLendBorrow = localStorage.getItem('showLendBorrowWidget');
        if (savedLendBorrow !== null) {
          setShowLendBorrowWidget(JSON.parse(savedLendBorrow));
        }
      } catch (error) {
        console.error('Error parsing showLendBorrowWidget from localStorage:', error);
      }
      
      try {
        const savedTransfer = localStorage.getItem('showTransferWidget');
        if (savedTransfer !== null) {
          setShowTransferWidget(JSON.parse(savedTransfer));
        }
      } catch (error) {
        console.error('Error parsing showTransferWidget from localStorage:', error);
      }
      
      try {
        const savedDonationsSavings = localStorage.getItem('showDonationsSavingsWidget');
        if (savedDonationsSavings !== null) {
          setShowDonationsSavingsWidget(JSON.parse(savedDonationsSavings));
        }
      } catch (error) {
        console.error('Error parsing showDonationsSavingsWidget from localStorage:', error);
      }
      
      try {
        const savedClients = localStorage.getItem('showClientsWidget');
        if (savedClients !== null) {
          setShowClientsWidget(JSON.parse(savedClients));
        }
      } catch (error) {
        console.error('Error parsing showClientsWidget from localStorage:', error);
      }
      
      try {
        const savedLearning = localStorage.getItem('showLearningWidget');
        if (savedLearning !== null) {
          setShowLearningWidget(JSON.parse(savedLearning));
        }
      } catch (error) {
        console.error('Error parsing showLearningWidget from localStorage:', error);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('showPurchasesWidgetChanged', handleCustomStorageChange);
    window.addEventListener('showLendBorrowWidgetChanged', handleCustomStorageChange);
    window.addEventListener('showTransferWidgetChanged', handleCustomStorageChange);
    window.addEventListener('showDonationsSavingsWidgetChanged', handleCustomStorageChange);
    window.addEventListener('showClientsWidgetChanged', handleCustomStorageChange);
    window.addEventListener('showLearningWidgetChanged', handleCustomStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('showPurchasesWidgetChanged', handleCustomStorageChange);
      window.removeEventListener('showLendBorrowWidgetChanged', handleCustomStorageChange);
      window.removeEventListener('showTransferWidgetChanged', handleCustomStorageChange);
      window.removeEventListener('showDonationsSavingsWidgetChanged', handleCustomStorageChange);
      window.removeEventListener('showClientsWidgetChanged', handleCustomStorageChange);
      window.removeEventListener('showLearningWidgetChanged', handleCustomStorageChange);
    };
  }, []);
  
  // Check if user has lend_borrow records - with caching to prevent unnecessary queries
  const [hasLendBorrowRecords, setHasLendBorrowRecords] = useState(false);
  const lendBorrowCacheRef = useRef<{ userId: string | undefined; isPremium: boolean; hasRecords: boolean } | null>(null);
  
  useEffect(() => {
    if (!isPremium || !user?.id) {
      setHasLendBorrowRecords(false);
      lendBorrowCacheRef.current = null;
      return;
    }
    
    // Use cached value if available and conditions haven't changed
    if (lendBorrowCacheRef.current?.userId === user.id && 
        lendBorrowCacheRef.current?.isPremium === isPremium) {
      setHasLendBorrowRecords(lendBorrowCacheRef.current.hasRecords);
      return;
    }
    
    let isMounted = true;
    const abortController = new AbortController();
    
    supabase
      .from('lend_borrow')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .then(({ count, error }) => {
        if (!isMounted || abortController.signal.aborted) return;
        
        if (error) {
          console.error('Error checking lend_borrow records:', error);
          setHasLendBorrowRecords(false);
          lendBorrowCacheRef.current = { userId: user.id, isPremium, hasRecords: false };
        } else {
          const hasRecords = (count || 0) > 0;
          setHasLendBorrowRecords(hasRecords);
          lendBorrowCacheRef.current = { userId: user.id, isPremium, hasRecords };
        }
      })
      .catch((error) => {
        if (!isMounted || abortController.signal.aborted) return;
        console.error('Error checking lend_borrow records:', error);
        setHasLendBorrowRecords(false);
        lendBorrowCacheRef.current = { userId: user.id, isPremium, hasRecords: false };
      });
    
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [isPremium, user?.id]);
  
  // Calculate stats reactively when store data changes
  const stats = getDashboardStats();
  const activeAccounts = getActiveAccounts();
  const transactions = getActiveTransactions();
  const allTransactions = storeTransactions; // Use reactive store data
  
  const [showMultiCurrencyAnalytics, setShowMultiCurrencyAnalytics] = useState(true);
  const [showPurchasesWidget, setShowPurchasesWidget] = useState(true);
  const [isPurchaseWidgetHovered, setIsPurchaseWidgetHovered] = useState(false);
  const [showPurchaseCrossTooltip, setShowPurchaseCrossTooltip] = useState(false);
  const [showPurchaseInfoTooltip, setShowPurchaseInfoTooltip] = useState(false);
  const [showPurchaseInfoMobileModal, setShowPurchaseInfoMobileModal] = useState(false);
  const [dashboardCurrencyFilter, setDashboardCurrencyFilter] = useState('');
  const purchaseTooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Load user preferences - consolidated into single effect for better performance
  useEffect(() => {
    if (!user?.id) return;
    
    let isMounted = true;
    const abortController = new AbortController();
    
    const loadPreferences = async () => {
      try {
        // Load all preferences in parallel
        const [showAnalytics, showWidget] = await Promise.all([
          getPreference(user.id, 'showMultiCurrencyAnalytics', true),
          getPreference(user.id, 'showPurchasesWidget', true)
        ]);
        
        if (!isMounted || abortController.signal.aborted) return;
        
        setShowMultiCurrencyAnalytics(showAnalytics);
        setShowPurchasesWidget(showWidget);
      } catch (error) {
        if (!isMounted || abortController.signal.aborted) return;
        // Default to showing on error
        console.error('Error loading user preferences:', error);
        setShowMultiCurrencyAnalytics(true);
        setShowPurchasesWidget(true);
      }
    };
    
    loadPreferences();
    
    return () => {
      isMounted = false;
      abortController.abort();
    };
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
    // Immediate UI update (optimistic update)
    setShowPurchasesWidget(show);
    localStorage.setItem('showPurchasesWidget', JSON.stringify(show));
    window.dispatchEvent(new CustomEvent('showPurchasesWidgetChanged'));
    
    // Save to database asynchronously (non-blocking)
    if (user?.id) {
      setPreference(user.id, 'showPurchasesWidget', show).catch(() => {
        // Silent fail - already saved locally
      });
    }
  };

  // Toggle handlers for other widgets - Optimized for immediate UI response
  const handleDonationsWidgetToggle = async (show: boolean) => {
    // Immediate UI update (optimistic update)
    setShowDonationsSavingsWidget(show);
    localStorage.setItem('showDonationsSavingsWidget', JSON.stringify(show));
    window.dispatchEvent(new CustomEvent('showDonationsSavingsWidgetChanged'));
    
    // Save to database asynchronously (non-blocking)
    if (user?.id) {
      setPreference(user.id, 'showDonationsSavingsWidget', show).catch(() => {
        // Silent fail - already saved locally
        });
    }
  };

  const handleLendBorrowWidgetToggle = async (show: boolean) => {
    // Immediate UI update (optimistic update)
    setShowLendBorrowWidget(show);
    localStorage.setItem('showLendBorrowWidget', JSON.stringify(show));
    window.dispatchEvent(new CustomEvent('showLendBorrowWidgetChanged'));
    
    // Save to database asynchronously (non-blocking)
    if (user?.id) {
      setPreference(user.id, 'showLendBorrowWidget', show).catch(() => {
        // Silent fail - already saved locally
        });
      }
  };

  const handleTransferWidgetToggle = async (show: boolean) => {
    // Immediate UI update (optimistic update)
    setShowTransferWidget(show);
    localStorage.setItem('showTransferWidget', JSON.stringify(show));
    window.dispatchEvent(new CustomEvent('showTransferWidgetChanged'));
    
    // Save to database asynchronously (non-blocking)
    if (user?.id) {
      setPreference(user.id, 'showTransferWidget', show).catch(() => {
        // Silent fail - already saved locally
      });
    }
  };

  // Handle Clients widget toggle
  const handleClientsWidgetToggle = async (show: boolean) => {
    setShowClientsWidget(show);
    localStorage.setItem('showClientsWidget', JSON.stringify(show));
    window.dispatchEvent(new CustomEvent('showClientsWidgetChanged'));
    
    if (user?.id) {
      setPreference(user.id, 'showClientsWidget', show).catch(() => {
        // Silent fail - already saved locally
      });
    }
  };

  // Handle Learning widget toggle
  const handleLearningWidgetToggle = async (show: boolean) => {
    setShowLearningWidget(show);
    localStorage.setItem('showLearningWidget', JSON.stringify(show));
    window.dispatchEvent(new CustomEvent('showLearningWidgetChanged'));
    
    if (user?.id) {
      setPreference(user.id, 'showLearningWidget', show).catch(() => {
        // Silent fail - already saved locally
      });
    }
  };

  // Handle main dashboard widget toggle from modal
  const handleMainDashboardWidgetToggle = (id: string, visible: boolean) => {
    switch (id) {
      case 'donations':
        handleDonationsWidgetToggle(visible);
        break;
      case 'purchases':
        handlePurchasesWidgetToggle(visible);
        break;
      case 'lend-borrow':
        handleLendBorrowWidgetToggle(visible);
        break;
      case 'transfers':
        handleTransferWidgetToggle(visible);
        break;
      case 'clients':
        handleClientsWidgetToggle(visible);
        break;
      case 'learning':
        handleLearningWidgetToggle(visible);
        break;
      default:
        break;
    }
  };

  // Fetch clients on mount - with error handling
  useEffect(() => {
    let isMounted = true;
    const loadClients = async () => {
      try {
        await fetchClients();
      } catch (error) {
        if (isMounted) {
          console.error('Error fetching clients:', error);
        }
      }
    };
    loadClients();
    return () => {
      isMounted = false;
    };
  }, [fetchClients]);

  const purchases = useFinanceStore((state) => state.purchases);
  
  // Get all available currencies from all sources (accounts, purchases, etc.)
  const allAvailableCurrencies = useMemo(() => {
    const currencies = new Set<string>();
    // From accounts
    accounts.forEach(a => {
      if (a.currency) currencies.add(a.currency);
    });
    // From purchases
    purchases.forEach(p => {
      if (p.currency) currencies.add(p.currency);
    });
    return Array.from(currencies).sort();
  }, [accounts, purchases]);

  // Filter currencies based on profile.selected_currencies
  const filteredDashboardCurrencies = useMemo(() => {
    if (profile?.selected_currencies && profile.selected_currencies.length > 0) {
      return allAvailableCurrencies.filter(c => profile.selected_currencies?.includes?.(c));
    }
    return allAvailableCurrencies;
  }, [profile?.selected_currencies, allAvailableCurrencies]);

  // Set default currency filter for dashboard
  useEffect(() => {
    if (!dashboardCurrencyFilter && filteredDashboardCurrencies.length > 0) {
      // First try to use profile's local currency
      if (profile?.local_currency && filteredDashboardCurrencies.includes(profile.local_currency)) {
        setDashboardCurrencyFilter(profile.local_currency);
      } else if (filteredDashboardCurrencies.length > 0) {
        setDashboardCurrencyFilter(filteredDashboardCurrencies[0]);
      }
    }
  }, [dashboardCurrencyFilter, filteredDashboardCurrencies, profile?.local_currency]);

  // Filter purchases by selected currency
  const filteredPurchases = useMemo(() => {
    if (!dashboardCurrencyFilter) return purchases;
    return purchases.filter(p => (p.currency || 'USD') === dashboardCurrencyFilter);
  }, [purchases, dashboardCurrencyFilter]);
  
  // Calculate widget availability
  const widgetAvailability = useMemo(() => {
    const hasDpsAccounts = storeAccounts.some(a => a.has_dps && a.currency === dashboardCurrencyFilter);
    const hasDonationRecords = donationSavingRecords?.some(record => {
      if (!record.transaction_id) {
        const currencyMatch = record.note?.match(/\(?Currency:\s*([A-Z]{3})\)?/);
        const manualCurrency = currencyMatch ? currencyMatch[1] : 'USD';
        return manualCurrency === dashboardCurrencyFilter;
      }
      const transaction = storeTransactions.find(t => t.id === record.transaction_id);
      const account = transaction ? storeAccounts.find(a => a.id === transaction.account_id) : undefined;
      return account && account.currency === dashboardCurrencyFilter;
    });
    return {
      hasDonations: hasDpsAccounts || hasDonationRecords,
      hasPurchases: purchases.length > 0,
      hasLendBorrow: isPremium && hasLendBorrowRecords,
      hasTransfersCard: hasTransfers,
      hasClientsCard: clients.length > 0,
      hasLearning: courses.length > 0,
    };
  }, [storeAccounts, donationSavingRecords, dashboardCurrencyFilter, storeTransactions, purchases, isPremium, hasLendBorrowRecords, hasTransfers, clients.length, courses.length]);
  
  // Check if any widget in the Purchase/LendBorrow/Transfer row will be visible
  const hasAnyWidgetVisible = useMemo(() => {
    const hasPurchase = purchases.length > 0 && showPurchasesWidget;
    const hasLendBorrow = isPremium && hasLendBorrowRecords && showLendBorrowWidget;
    const hasTransfer = hasTransfers && showTransferWidget;
    return hasPurchase || hasLendBorrow || hasTransfer;
  }, [purchases.length, showPurchasesWidget, isPremium, hasLendBorrowRecords, showLendBorrowWidget, hasTransfers, showTransferWidget]);
  
  // Calculate purchase overview stats (filtered by currency) - memoized for performance
  const purchaseStats = useMemo(() => {
    const planned = filteredPurchases.filter(p => p.status === 'planned');
    const purchased = filteredPurchases.filter(p => p.status === 'purchased');
    const cancelled = filteredPurchases.filter(p => p.status === 'cancelled');
    
    const totalPlannedPurchases = planned.length;
    const totalPurchasedItems = purchased.length;
    const totalCancelledItems = cancelled.length;
    const totalPlannedValue = planned.reduce((sum, p) => sum + p.price, 0);
    const totalPurchasedValue = purchased.reduce((sum, p) => sum + p.price, 0);
    
    const recentPurchases = purchased
      .filter(p => p.purchase_date)
      .sort((a, b) => {
        const dateA = a.purchase_date ? new Date(a.purchase_date).getTime() : 0;
        const dateB = b.purchase_date ? new Date(b.purchase_date).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 5);
    
    const recentPlannedPurchases = planned
      .filter(p => p.purchase_date)
      .sort((a, b) => {
        const dateA = a.purchase_date ? new Date(a.purchase_date).getTime() : 0;
        const dateB = b.purchase_date ? new Date(b.purchase_date).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 5);
    
    return {
      totalPlannedPurchases,
      totalPurchasedItems,
      totalCancelledItems,
      totalPlannedValue,
      totalPurchasedValue,
      recentPurchases,
      recentPlannedPurchases
    };
  }, [filteredPurchases]);
  
  const {
    totalPlannedPurchases,
    totalPurchasedItems,
    totalCancelledItems,
    totalPlannedValue,
    totalPurchasedValue,
    recentPurchases,
    recentPlannedPurchases
  } = purchaseStats;


  // Initial data fetch when dashboard loads
  useEffect(() => {
    // Only fetch data when user is authenticated and data hasn't been fetched yet
    if (!user || initialDataFetched) {
      return;
    }
    
    let isMounted = true;
    const abortController = new AbortController();
    
    const refreshData = async () => {
      try {
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

        // Success - hide loading (only if not aborted)
        if (isMounted && !abortController.signal.aborted) {
          setDashboardLoading(false);
          setInitialDataFetched(true);
          setLoadingMessage('');
        }

      } catch (error) {
        // Error - still show dashboard but mark as having an error (only if not aborted)
        if (isMounted && !abortController.signal.aborted) {
          setDashboardLoading(false);
          setInitialDataFetched(true);
          setHasLoadError(true);
          setLoadingMessage('');
        }
      }
    };
    
    refreshData();
    
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [user, initialDataFetched, fetchTransactions, fetchAccounts, fetchCategories, fetchPurchaseCategories, fetchDonationSavingRecords]); // Include all dependencies

  // Force loading state to false after a timeout to prevent infinite loading
  useEffect(() => {
    if (dashboardLoading && user) {
      const timeoutId = setTimeout(() => {
        setDashboardLoading(false);
        setInitialDataFetched(true);
        setHasLoadError(true);
        setLoadingMessage('');
      }, DASHBOARD_LOADING_TIMEOUT);
      
      return () => clearTimeout(timeoutId);
    }
  }, [dashboardLoading, user, setLoadingMessage]);

  // Listen for global refresh events from header - with consistent error handling
  useEffect(() => {
    const handleDataRefresh = async () => {
      try {
        await handleRefresh();
      } catch (error) {
        // Error is already logged in handleRefresh, just prevent unhandled rejection
        console.error('Error in global refresh handler:', error);
      }
    };

    window.addEventListener('dataRefreshed', handleDataRefresh);
    return () => {
      window.removeEventListener('dataRefreshed', handleDataRefresh);
    };
  }, [handleRefresh]);

  // Auto refresh removed - data will only be fetched on component mount

  // Manual refresh is handled by the Header component's refresh button

  // Calculate total income and expenses (excluding transfers and lend/borrow transactions) - memoized
  const { totalIncome, totalExpenses } = useMemo(() => {
    const income = transactions
      .filter(t => t.type === 'income' && 
        !t.tags?.some((tag: string) => tag.includes('transfer') || tag.includes('dps_transfer')) &&
        !isLendBorrowTransaction(t)
      )
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = transactions
      .filter(t => t.type === 'expense' && 
        !t.tags?.some((tag: string) => tag.includes('transfer') || tag.includes('dps_transfer')) &&
        !isLendBorrowTransaction(t)
      )
      .reduce((sum, t) => sum + t.amount, 0);
    
    return { totalIncome: income, totalExpenses: expenses };
  }, [transactions]);

  // Use the raw accounts array from the store
  const rawAccounts = useFinanceStore((state) => state.accounts);
  
  // Debug logging for accounts and stats

  // Constants for timeouts and thresholds
  const DASHBOARD_LOADING_TIMEOUT = 8000; // 8 seconds
  const REFRESH_TIMEOUT = 10000; // 10 seconds
  const MAX_RETRY_ATTEMPTS = 3;
  const SPENDING_ANALYSIS_DAYS = 30;
  const TRENDS_ANALYSIS_MONTHS = 6;

  // Calculate spending breakdown data for pie chart - memoized
  const spendingData = useMemo(() => {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - SPENDING_ANALYSIS_DAYS);
    
    const expenses = transactions.filter(t => 
      t.type === 'expense' && 
      new Date(t.date) >= last30Days &&
      !t.tags?.some(tag => tag.includes('transfer') || tag.includes('dps_transfer')) &&
      !isLendBorrowTransaction(t)
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
  }, [transactions]);

  // Calculate monthly trends data for line chart - memoized
  const trendsData = useMemo(() => {
    const last6Months = Array.from({ length: TRENDS_ANALYSIS_MONTHS }, (_, i) => {
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
        new Date().getMonth() - (TRENDS_ANALYSIS_MONTHS - 1 - last6Months.indexOf(m)) === transactionDate.getMonth()
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
  }, [transactions]);
  
  const [submittingPurchase, setSubmittingPurchase] = React.useState(false);
  const handlePurchaseSubmit = async (data: Omit<Purchase, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    setSubmittingPurchase(true);
    try {
      await addPurchase(data);
      setShowPurchaseForm(false);
      toast.success('Purchase added successfully');
    } catch (error) {
      console.error('Error adding purchase:', error);
      toast.error('Failed to add purchase', {
        description: error instanceof Error ? error.message : 'Please try again'
      });
      // Don't close form on error so user can retry
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
                  Retry attempt {retryCount}/{MAX_RETRY_ATTEMPTS}
                </p>
              </div>
              <button
                onClick={retryDataLoad}
                disabled={retryCount >= MAX_RETRY_ATTEMPTS}
                className="text-xs bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-3 py-1 rounded transition-colors"
                aria-label="Retry loading dashboard data"
              >
                {retryCount >= MAX_RETRY_ATTEMPTS ? 'Max Retries' : 'Retry'}
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
        <div className="flex-1 space-y-4 sm:space-y-6">

          {/* Upgrade Banner for Free Users */}
          <UpgradeBanner />

          {/* Multi-Currency Quick Access */}
          {stats.byCurrency.length > 1 && showMultiCurrencyAnalytics && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-700 relative">
              <button
                onClick={() => handleMultiCurrencyAnalyticsToggle(false)}
                className="absolute top-2 right-2 sm:top-1/2 sm:right-2 sm:transform sm:-translate-y-1/2 p-1.5 sm:p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 transition-colors min-h-[44px] sm:min-h-0 min-w-[44px] sm:min-w-0"
                aria-label="Close Multi-Currency Analytics"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 pr-10 sm:pr-8">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-blue-900 dark:text-blue-100">
                    Multi-Currency Analytics
                  </h3>
                  <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 mt-1">
                    You have {stats.byCurrency.length} currencies. Get detailed insights and comparisons.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/analytics')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 sm:py-2 rounded-lg transition-colors flex items-center justify-center space-x-2 w-full sm:w-auto min-h-[44px] sm:min-h-0 text-sm sm:text-base"
                >
                  <span>View Analytics</span>
                  <ArrowRight className="w-4 h-4 flex-shrink-0" />
                </button>
              </div>
            </div>
          )}

          {/* Client Tasks Widget - Full Width Row */}
          {/* <ClientTasksWidget /> */}

          {/* Currency Sections & Donations - Responsive grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 items-start auto-rows-fr">
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
          </div>

          {/* Shared Currency Filter & Card Visibility - After Currency Cards */}
          {(() => {
            const { hasDonations, hasPurchases, hasLendBorrow, hasTransfersCard, hasClientsCard, hasLearning } = widgetAvailability;
            const hasAnyCards = hasDonations || hasPurchases || hasLendBorrow || hasTransfersCard || hasClientsCard || hasLearning;
            const hasMultipleCurrencies = filteredDashboardCurrencies.length > 1;
            
            // Always show section for widgets button (and currency filter if needed)
            
            return (
              <div className="flex flex-row items-center justify-between gap-2 sm:gap-3 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-lg p-2 sm:p-2.5 border border-blue-200/50 dark:border-blue-800/50 shadow-sm mt-4 sm:mt-6">
                {/* Left side: Currency Filter */}
                {hasMultipleCurrencies && (
                  <div className="flex items-center gap-2 flex-1 md:flex-initial">
                    <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap flex-shrink-0">Currency:</span>
                    <CustomDropdown
                      options={filteredDashboardCurrencies.map(currency => ({ value: currency, label: currency }))}
                      value={dashboardCurrencyFilter}
                      onChange={setDashboardCurrencyFilter}
                      fullWidth={false}
                      className="bg-white dark:bg-gray-700 border border-blue-300 dark:border-blue-600 text-gray-700 dark:text-gray-200 text-xs sm:text-sm h-8 min-h-0 hover:bg-blue-50 dark:hover:bg-blue-900/30 focus:ring-2 focus:ring-blue-500 focus:outline-none rounded-md px-2 sm:px-3 py-1 w-auto min-w-[80px] sm:min-w-[100px]"
                      dropdownMenuClassName="!bg-white dark:!bg-gray-800 !border-gray-200 dark:!border-gray-600 !shadow-lg"
                    />
                  </div>
                )}
                
                {/* Right side: Widgets Button */}
                <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ml-auto">
                  {/* Widgets Button - Opens modal with all widgets */}
                  <button
                    type="button"
                    onClick={() => setShowSettingsPanel(true)}
                    className="bg-white dark:bg-gray-700 border border-blue-300 dark:border-blue-600 text-gray-700 dark:text-gray-200 text-xs sm:text-sm h-8 min-h-0 hover:bg-blue-50 dark:hover:bg-blue-900/30 focus:ring-2 focus:ring-blue-500 focus:outline-none rounded-md px-2 sm:px-3 py-1 items-center gap-1.5 sm:gap-2 flex"
                    title="Customize widgets"
                  >
                    <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <span className="text-xs font-medium text-gray-900 dark:text-white whitespace-nowrap">Widgets</span>
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Donations, Purchase, L&B, Transfer - Responsive grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 items-start auto-rows-fr">
            {/* Donations Overview Card - Place after currency cards */}
            {showDonationsSavingsWidget && (
              <div className="w-full h-full animate-fadeIn">
                <DonationSavingsOverviewCard
                  t={t}
                  formatCurrency={formatCurrency}
                  filterCurrency={dashboardCurrencyFilter}
                />
              </div>
            )}
            
            {/* Purchase Overview */}
            {purchases.length > 0 && showPurchasesWidget && (
              <div 
                className="w-full h-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 border border-blue-200/50 dark:border-blue-800/50 hover:border-blue-300 dark:hover:border-blue-700 relative flex flex-col animate-fadeIn"
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
                
                <div className="flex items-center justify-between mb-2 pr-8">
                  <div className="flex items-center gap-2 flex-1">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Purchases</h2>
                    <div className="relative flex items-center">
                      <button
                        type="button"
                        className="ml-1 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 focus:outline-none transition-all duration-200 hover:scale-110 active:scale-95"
                        onMouseEnter={() => !isMobile && setShowPurchaseInfoTooltip(true)}
                        onMouseLeave={() => !isMobile && setShowPurchaseInfoTooltip(false)}
                        onFocus={() => !isMobile && setShowPurchaseInfoTooltip(true)}
                        onBlur={() => !isMobile && setShowPurchaseInfoTooltip(false)}
                        onClick={() => {
                          if (isMobile) {
                            setShowPurchaseInfoMobileModal(true);
                          } else {
                            setShowPurchaseInfoTooltip(v => !v);
                          }
                        }}
                        tabIndex={0}
                        aria-label="Show purchases info"
                      >
                        <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200" />
                      </button>
                      {showPurchaseInfoTooltip && !isMobile && (
                        <div className="absolute left-1/2 top-full z-40 mt-2 w-72 sm:w-80 md:w-96 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl p-3 sm:p-4 text-xs text-gray-700 dark:text-gray-200 animate-fadein">
                          <div className="space-y-2 sm:space-y-3">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-2 sm:gap-3">
                              {/* Planned Purchases */}
                              <div className="min-w-0">
                                <div className="font-semibold text-[11px] sm:text-xs text-gray-900 dark:text-gray-100 mb-0.5 truncate">Planned ({totalPlannedPurchases}):</div>
                                {totalPlannedPurchases > 0 ? (
                                  <div className="font-medium text-[11px] sm:text-xs bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent break-words">
                                    {formatCurrency(totalPlannedValue, dashboardCurrencyFilter || 'USD')}
                                  </div>
                                ) : (
                                  <div className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-500">No planned purchases</div>
                                )}
                              </div>

                              {/* Purchased Items */}
                              <div className="min-w-0">
                                <div className="font-semibold text-[11px] sm:text-xs text-gray-900 dark:text-gray-100 mb-0.5 truncate">Purchased ({totalPurchasedItems}):</div>
                                {totalPurchasedItems > 0 ? (
                                  <div className="font-medium text-[11px] sm:text-xs bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent break-words">
                                    {formatCurrency(totalPurchasedValue, dashboardCurrencyFilter || 'USD')}
                                  </div>
                                ) : (
                                  <div className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-500">No purchases yet</div>
                                )}
                              </div>
                            </div>

                            {/* Recent Purchases */}
                            {recentPurchases.length > 0 && (
                              <>
                                <div className="border-t border-gray-200 dark:border-gray-700 mt-2"></div>
                                <div>
                                  <div className="mb-1">
                                    <div className="font-semibold text-gray-900 dark:text-gray-100 text-[10px] sm:text-[11px]">Recent Purchases</div>
                                  </div>
                                  <ul className="space-y-0.5 max-h-32 sm:max-h-40 overflow-y-auto">
                                    {recentPurchases.map((purchase) => (
                                      <li key={purchase.id} className="flex items-center justify-between rounded hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors py-0.5">
                                        <span className="truncate flex-1 text-[10px] sm:text-[11px] text-gray-700 dark:text-gray-300 min-w-0" title={purchase.item_name}>{purchase.item_name}</span>
                                        <span className="ml-2 tabular-nums font-medium text-[10px] sm:text-[11px] text-gray-900 dark:text-gray-100 flex-shrink-0">
                                          {formatCurrency(purchase.price, purchase.currency)}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                  <Link 
                    to="/purchases" 
                    className="text-sm font-medium flex items-center space-x-1 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                  >
                    <span>View All</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  </div>
                </div>
                {/* Purchase Stats Cards - Responsive grid */}
                <div className="grid grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-0 flex-1">
                  <StatCard
                    title="Planned"
                    value={totalPlannedPurchases.toString()}
                    color="yellow"
                  />
                  <StatCard
                    title="Purchased"
                    value={totalPurchasedItems.toString()}
                    trend="up"
                    color="red"
                  />
                </div>
              </div>
            )}

            {/* Mobile Modal for Purchases Info */}
            {showPurchaseInfoMobileModal && isMobile && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="fixed inset-0 bg-black/50" onClick={() => setShowPurchaseInfoMobileModal(false)} />
                <div className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg p-3 sm:p-4 w-[90vw] sm:w-80 md:w-96 max-w-md animate-fadein">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-gray-100">Purchases Info</div>
                    <button
                      onClick={() => setShowPurchaseInfoMobileModal(false)}
                      className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-manipulation"
                      aria-label="Close modal"
                    >
                      <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      {/* Planned Purchases */}
                      <div className="min-w-0">
                                    <div className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-gray-100 mb-1 truncate">Planned ({totalPlannedPurchases}):</div>
                                    {totalPlannedPurchases > 0 ? (
                                      <div className="font-medium text-xs sm:text-sm bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent break-words">
                                        {formatCurrency(totalPlannedValue, dashboardCurrencyFilter || 'USD')}
                                      </div>
                                    ) : (
                                      <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-500">No planned purchases</div>
                                    )}
                                  </div>

                                  {/* Purchased Items */}
                                  <div className="min-w-0">
                                    <div className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-gray-100 mb-1 truncate">Purchased ({totalPurchasedItems}):</div>
                                    {totalPurchasedItems > 0 ? (
                                      <div className="font-medium text-xs sm:text-sm bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent break-words">
                                        {formatCurrency(totalPurchasedValue, dashboardCurrencyFilter || 'USD')}
                                      </div>
                        ) : (
                          <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-500">No purchases yet</div>
                        )}
                      </div>
                    </div>

                    {/* Recent Purchases */}
                    {recentPurchases.length > 0 && (
                      <>
                        <div className="border-t border-gray-200 dark:border-gray-700 mt-3"></div>
                        <div>
                          <div className="mb-1">
                            <div className="font-semibold text-[10px] sm:text-xs text-gray-900 dark:text-gray-100">Recent Purchases</div>
                          </div>
                          <ul className="space-y-1 max-h-32 sm:max-h-40 overflow-y-auto">
                            {recentPurchases.map((purchase) => (
                              <li key={purchase.id} className="flex items-center justify-between rounded hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors py-0.5">
                                <span className="truncate flex-1 text-[10px] sm:text-xs text-gray-700 dark:text-gray-300 min-w-0" title={purchase.item_name}>{purchase.item_name}</span>
                                <span className="ml-2 tabular-nums font-medium text-[10px] sm:text-xs text-gray-900 dark:text-gray-100 flex-shrink-0">
                                  {formatCurrency(purchase.price, purchase.currency)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* L&B Summary Card */}
            {isPremium && hasLendBorrowRecords && showLendBorrowWidget && (
              <div className="w-full h-full animate-fadeIn">
                <LendBorrowSummaryCard filterCurrency={dashboardCurrencyFilter} />
              </div>
            )}
            
            {/* Transfer Summary Card */}
            {hasTransfers && showTransferWidget && (
              <div className="w-full h-full animate-fadeIn">
                <TransferSummaryCard filterCurrency={dashboardCurrencyFilter} />
              </div>
            )}
            
            {/* Clients Overview Card */}
            {clients.length > 0 && showClientsWidget && (
              <div className="w-full h-full animate-fadeIn">
                <ClientsOverviewCard filterCurrency={dashboardCurrencyFilter} />
              </div>
            )}
            
            {/* Learning Summary Card */}
            <div className="w-full h-full animate-fadeIn">
              <LearningSummaryCard />
            </div>
            
          </div>

          {/* Motivational Quote - Hidden on mobile, shown on desktop */}
          <div className="hidden lg:block">
            <MotivationalQuote enableExternalLink={true} />
          </div>

          {/* Recent Transactions - Hidden on mobile, shown on desktop */}
          <div className="hidden lg:block w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-xl p-3 sm:p-4 lg:p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-blue-200/50 dark:border-blue-800/50 hover:border-blue-300 dark:hover:border-blue-700">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
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
          {/* Widgets with Drag & Drop */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={visibleWidgets.map(w => w.id)}
              strategy={verticalListSortingStrategy}
            >
              <WidgetSection>
                {visibleWidgets.map((config) => {
                if (config.id === 'task-reminders') {
                  return (
                    <DraggableWidget key={config.id} id={config.id}>
                      <AccordionWidget
                        id={config.id}
                        isExpanded={accordionState[config.id] ?? true}
                      >
                        <TaskRemindersWidget 
                          onHide={() => handleTaskRemindersWidgetToggle(false)}
                          isAccordionExpanded={accordionState[config.id] ?? true}
                          onAccordionToggle={() => handleAccordionToggle(config.id)}
                        />
                      </AccordionWidget>
                    </DraggableWidget>
                  );
                }
                if (config.id === 'last-wish') {
                  return (
                    <DraggableWidget key={config.id} id={config.id}>
                      <AccordionWidget
                        id={config.id}
                        isExpanded={accordionState[config.id] ?? true}
                      >
                        <LastWishCountdownWidget 
                          isAccordionExpanded={accordionState[config.id] ?? true}
                          onAccordionToggle={() => handleAccordionToggle(config.id)}
                        />
                      </AccordionWidget>
                    </DraggableWidget>
                  );
                }
                if (config.id === 'habit-garden') {
                  return (
                    <DraggableWidget key={config.id} id={config.id}>
                      <AccordionWidget
                        id={config.id}
                        isExpanded={accordionState[config.id] ?? true}
                      >
                        <HabitGardenWidget 
                          isAccordionExpanded={accordionState[config.id] ?? true}
                          onAccordionToggle={() => handleAccordionToggle(config.id)}
                        />
                      </AccordionWidget>
                    </DraggableWidget>
                  );
                }
                if (config.id === 'learning') {
                  return (
                    <DraggableWidget key={config.id} id={config.id}>
                      <AccordionWidget
                        id={config.id}
                        isExpanded={accordionState[config.id] ?? true}
                      >
                        <LearningWidget 
                          isAccordionExpanded={accordionState[config.id] ?? true}
                          onAccordionToggle={() => handleAccordionToggle(config.id)}
                        />
                      </AccordionWidget>
                    </DraggableWidget>
                  );
                }
                if (config.id === 'notes' && NotesWidget) {
                  return (
                    <DraggableWidget key={config.id} id={config.id}>
                      <AccordionWidget
                        id={config.id}
                        isExpanded={accordionState[config.id] ?? true}
                      >
                        <NotesWidget 
                          isAccordionExpanded={accordionState[config.id] ?? true}
                          onAccordionToggle={() => handleAccordionToggle(config.id)}
                        />
                      </AccordionWidget>
                    </DraggableWidget>
                  );
                }
                if (config.id === 'todos' && TodosWidget) {
                  return (
                    <DraggableWidget key={config.id} id={config.id}>
                      <AccordionWidget
                        id={config.id}
                        isExpanded={accordionState[config.id] ?? true}
                      >
                        <TodosWidget 
                          isAccordionExpanded={accordionState[config.id] ?? true}
                          onAccordionToggle={() => handleAccordionToggle(config.id)}
                        />
                      </AccordionWidget>
                    </DraggableWidget>
                  );
                }
                return null;
              })}
              </WidgetSection>
            </SortableContext>
          </DndContext>

          {/* Settings Panel */}
          <WidgetSettingsPanel
            isOpen={showSettingsPanel}
            onClose={() => setShowSettingsPanel(false)}
            widgets={widgetConfig}
            onUpdate={handleWidgetUpdate}
            onReset={handleResetWidgets}
            mainDashboardWidgets={(() => {
              const { hasDonations, hasPurchases, hasLendBorrow, hasTransfersCard, hasClientsCard, hasLearning } = widgetAvailability;
              const widgetsMap: Record<string, MainDashboardWidget> = {};
              
              if (hasDonations) {
                widgetsMap['donations'] = {
                  id: 'donations',
                  name: 'Donations',
                  visible: showDonationsSavingsWidget,
                  available: true,
                  order: 0,
                };
              }
              if (hasPurchases) {
                widgetsMap['purchases'] = {
                  id: 'purchases',
                  name: 'Purchases',
                  visible: showPurchasesWidget,
                  available: true,
                  order: 0,
                };
              }
              if (hasLendBorrow) {
                widgetsMap['lend-borrow'] = {
                  id: 'lend-borrow',
                  name: 'L&B',
                  visible: showLendBorrowWidget,
                  available: true,
                  order: 0,
                };
              }
              if (hasTransfersCard) {
                widgetsMap['transfers'] = {
                  id: 'transfers',
                  name: 'Transfers',
                  visible: showTransferWidget,
                  available: true,
                  order: 0,
                };
              }
              if (hasClientsCard) {
                widgetsMap['clients'] = {
                  id: 'clients',
                  name: 'Clients',
                  visible: showClientsWidget,
                  available: true,
                  order: 0,
                };
              }
              if (hasLearning) {
                widgetsMap['learning'] = {
                  id: 'learning',
                  name: 'Learning',
                  visible: showLearningWidget,
                  available: true,
                  order: 0,
                };
              }
              
              // Apply saved order
              const widgets: MainDashboardWidget[] = [];
              const usedIds = new Set<string>();
              
              // First, add widgets in saved order
              mainDashboardWidgetOrder.forEach((id, index) => {
                if (widgetsMap[id] && !usedIds.has(id)) {
                  widgets.push({
                    ...widgetsMap[id],
                    order: index,
                  });
                  usedIds.add(id);
                }
              });
              
              // Then add any new widgets that aren't in the saved order
              Object.values(widgetsMap).forEach((widget) => {
                if (!usedIds.has(widget.id)) {
                  widgets.push({
                    ...widget,
                    order: widgets.length,
                  });
                }
              });
              
              return widgets.sort((a, b) => a.order - b.order);
            })()}
            onMainDashboardWidgetToggle={handleMainDashboardWidgetToggle}
            onMainDashboardWidgetUpdate={handleMainDashboardWidgetUpdate}
          />
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