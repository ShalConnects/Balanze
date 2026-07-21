import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useAuthStore } from '../../store/authStore';
import { RecentTransactions } from './RecentTransactions';
import { formatCurrency } from '../../utils/currency';
import { TransferModal } from '../Transfers/TransferModal';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatAppMonthShort } from '../../utils/timezoneUtils';
import { LendBorrowSummaryCard } from './LendBorrowSummaryCard';
import { TransferSummaryCard } from './TransferSummaryCard';
import { CurrencyOverviewCard } from './CurrencyOverviewCard';
import { DonationSavingsOverviewCard } from './DonationSavingsOverviewCard';
import { ClientsOverviewCard } from './ClientsOverviewCard';
import { LearningSummaryCard } from './LearningSummaryCard';
import { InvestmentSummaryCard } from './InvestmentSummaryCard';
import { PrizeBondSummaryCard } from './PrizeBondSummaryCard';
import { PurchaseOverviewCard } from './PurchaseOverviewCard';
import { TaskRemindersWidget, useHasTaskRemindersContent } from './TaskRemindersWidget';
import { useClientStore } from '../../store/useClientStore';
import { useCourseStore } from '../../store/useCourseStore';
// NotesWidget and TodosWidget loaded dynamically to reduce initial bundle size
// import { NotesWidget } from './NotesWidget';
// import { TodosWidget } from './TodosWidget';
import { PurchaseForm } from '../Purchases/PurchaseForm';
import { useLoadingContext } from '../../context/LoadingContext';
import { DashboardSkeleton } from './DashboardSkeleton';
import { LastWishCountdownWidget } from './LastWishCountdownWidget';
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
import { DashboardFilterBar } from './DashboardFilterBar';
import { toast } from 'sonner';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { usePersistedToggle, MAIN_WIDGET_PREF_KEYS, MainWidgetId } from '../../hooks/usePersistedToggle';
import { useDashboardEntityFlags } from '../../hooks/useDashboardEntityFlags';
import PullToRefreshDashboard from './PullToRefreshDashboard';
import { countsTowardIncomeExpenseSummaries } from '../../utils/transactionUtils';
import { UpgradeBanner } from '../common/UpgradeBanner';
import { Purchase } from '../../types';
import { getProfilePreferredCurrency, syncCurrencyFilter } from '../../utils/usePreferredCurrency';
import { getDailyInspirationQuote, inferDailyInspirationCategory } from '../../utils/dailyInspiration';
import { useNotificationStore } from '../../store/notificationStore';

// Constants moved outside component to prevent recreation on every render
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B6B'];
const DASHBOARD_LOADING_TIMEOUT = 8000;
const REFRESH_TIMEOUT = 10000;
const MAX_RETRY_ATTEMPTS = 3;
const SPENDING_ANALYSIS_DAYS = 30;
const TRENDS_ANALYSIS_MONTHS = 6;

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
  // Use Map to deduplicate by widget ID (if config has duplicates, only last one is kept)
  const configMap = new Map(config.map(w => [w.id, w]));
  const migrated: WidgetConfig[] = [];
  const addedIds = new Set<string>(); // Track added IDs to prevent duplicates
  
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
    // Ensure we never add duplicate widget IDs
    if (!addedIds.has(defaultWidget.id)) {
      if (configMap.has(defaultWidget.id)) {
        // Keep existing widget config
        migrated.push(configMap.get(defaultWidget.id)!);
      } else {
        // Add new widget with default settings
        migrated.push(defaultWidget);
      }
      addedIds.add(defaultWidget.id);
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

const DEFAULT_MAIN_DASHBOARD_WIDGET_ORDER = [
  'investments',
  'prize-bonds',
  'donations',
  'purchases',
  'lend-borrow',
  'transfers',
  'clients',
  'learning',
] as const;

const MAIN_DASHBOARD_WIDGET_ID_SET = new Set<string>(DEFAULT_MAIN_DASHBOARD_WIDGET_ORDER);

/** Ensures investments precedes donations; fills missing ids; drops unknown ids. */
function normalizeMainDashboardWidgetOrder(raw: unknown): string[] {
  if (!Array.isArray(raw) || !raw.every((x): x is string => typeof x === 'string')) {
    return [...DEFAULT_MAIN_DASHBOARD_WIDGET_ORDER];
  }
  const ids = [...new Set(raw.filter((id) => MAIN_DASHBOARD_WIDGET_ID_SET.has(id)))];
  DEFAULT_MAIN_DASHBOARD_WIDGET_ORDER.forEach((id) => {
    if (!ids.includes(id)) ids.push(id);
  });
  const iInv = ids.indexOf('investments');
  const iDon = ids.indexOf('donations');
  if (iDon !== -1 && iInv !== -1 && iInv > iDon) {
    ids.splice(iInv, 1);
    ids.splice(iDon, 0, 'investments');
  }
  return ids;
}

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
  type DashboardWidgetProps = {
    isAccordionExpanded?: boolean;
    onAccordionToggle?: () => void;
  };
  const [NotesWidget, setNotesWidget] = useState<React.ComponentType<DashboardWidgetProps> | null>(null);
  const [TodosWidget, setTodosWidget] = useState<React.ComponentType<DashboardWidgetProps> | null>(null);

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
    if (!saved) return normalizeMainDashboardWidgetOrder(null);
    try {
      return normalizeMainDashboardWidgetOrder(JSON.parse(saved));
    } catch {
      return normalizeMainDashboardWidgetOrder(null);
    }
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

  const hasTaskReminders = useHasTaskRemindersContent();

  // Get visible widgets sorted by order - memoized for performance
  // Filter out premium-only widgets for free users and unloaded widgets
  const visibleWidgets = useMemo(() => {
    const filtered = widgetConfig
      .filter(w => {
        // Filter by visibility
        if (!w.visible) return false;
        
        // Filter out last-wish widget for free users
        if (w.id === 'last-wish' && !isPremium) return false;

        // No active client tasks — skip shell so DnD does not leave empty space
        if (w.id === 'task-reminders' && !hasTaskReminders) return false;
        
        // Filter out notes/todos widgets if not loaded
        if (w.id === 'notes' && !NotesWidget) return false;
        if (w.id === 'todos' && !TodosWidget) return false;
        
        return true;
      })
      .sort((a, b) => a.order - b.order);
    
    // Deduplicate by widget ID (keep first occurrence)
    const seen = new Set<string>();
    return filtered.filter(w => {
      if (seen.has(w.id)) {
        return false;
      }
      seen.add(w.id);
      return true;
    });
  },
    [widgetConfig, isPremium, hasTaskReminders, NotesWidget, TodosWidget]
  );
  
  // Check if there are any transfers in transactions
  const hasTransfersInTransactions = useMemo(() => {
    return storeTransactions.some(t => 
      t.tags?.some((tag: string) => tag.includes('transfer'))
    );
  }, [storeTransactions]);

  const [dashboardCurrencyFilter, setDashboardCurrencyFilter] = useState('');
  const [dashboardTimeFilter, setDashboardTimeFilter] = useState<'1m' | '3m' | '6m' | '1y' | 'all'>('all');

  const {
    hasDpsTransfers,
    hasLendBorrowRecords,
    hasInvestmentContracts: hasInvestmentContractsInCurrency,
    hasPrizeBonds,
  } = useDashboardEntityFlags(user?.id, isPremium, dashboardCurrencyFilter);

  const hasTransfers = hasTransfersInTransactions || hasDpsTransfers;

  const [showLendBorrowWidget, setShowLendBorrowWidget] = usePersistedToggle('showLendBorrowWidget', true, user?.id);
  const [showTransferWidget, setShowTransferWidget] = usePersistedToggle('showTransferWidget', true, user?.id);
  const [showDonationsSavingsWidget, setShowDonationsSavingsWidget] = usePersistedToggle('showDonationsSavingsWidget', true, user?.id);
  const [showClientsWidget, setShowClientsWidget] = usePersistedToggle('showClientsWidget', true, user?.id);
  const [showLearningWidget, setShowLearningWidget] = usePersistedToggle('showLearningWidget', true, user?.id);
  const [showInvestmentsWidget, setShowInvestmentsWidget] = usePersistedToggle('showInvestmentsWidget', true, user?.id);
  const [showPrizeBondsWidget, setShowPrizeBondsWidget] = usePersistedToggle('showPrizeBondsWidget', true, user?.id);
  const [showPurchasesWidget, setShowPurchasesWidget] = usePersistedToggle('showPurchasesWidget', true, user?.id, { syncFromDb: true });

  // Get clients from store
  const clients = useClientStore((state) => state.clients);
  const fetchClients = useClientStore((state) => state.fetchClients);
  
  // Get courses from store
  const courses = useCourseStore((state) => state.courses);
  
  // Calculate stats reactively when store data changes
  const stats = useMemo(() => getDashboardStats(), [storeAccounts, storeTransactions, getDashboardStats]);
  const activeAccounts = useMemo(() => getActiveAccounts(), [storeAccounts, getActiveAccounts]);
  const transactions = useMemo(() => getActiveTransactions(), [storeAccounts, storeTransactions, getActiveTransactions]);
  const allTransactions = storeTransactions;
  
  const [showMultiCurrencyAnalytics, setShowMultiCurrencyAnalytics] = useState(true);
  const [barQuote, setBarQuote] = useState({ q: '', a: '' });
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user: authUser } = useAuthStore();
  const {
    addFavoriteQuote,
    removeFavoriteQuoteByContent,
    isQuoteFavorited,
    loadFavoriteQuotes,
    setCurrentUserId
  } = useNotificationStore();

  useEffect(() => {
    if (authUser?.id) {
      setCurrentUserId(authUser.id);
      void loadFavoriteQuotes(authUser.id);
    } else {
      setCurrentUserId(null);
    }
  }, [authUser?.id, loadFavoriteQuotes, setCurrentUserId]);

  const refreshBarQuote = useCallback(async () => {
    setBarQuote(await getDailyInspirationQuote());
  }, []);

  useEffect(() => {
    void refreshBarQuote();
    const interval = setInterval(() => {
      void refreshBarQuote();
    }, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshBarQuote]);

  const isBarQuoteFavorited = isQuoteFavorited(barQuote.q, barQuote.a);

  // Load multi-currency analytics preference
  useEffect(() => {
    if (!user?.id) return;
    let isMounted = true;
    getPreference(user.id, 'showMultiCurrencyAnalytics', true)
      .then((showAnalytics) => {
        if (isMounted) setShowMultiCurrencyAnalytics(showAnalytics);
      })
      .catch(() => {
        if (isMounted) setShowMultiCurrencyAnalytics(true);
      });
    return () => {
      isMounted = false;
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
        setShowMultiCurrencyAnalytics(show);
        toast.error('Failed to save preference', {
          description: 'Your preference will be saved locally only'
        });
      }
    } else {
      setShowMultiCurrencyAnalytics(show);
      toast.info('Preference saved locally', {
        description: 'Sign in to sync preferences across devices'
      });
    }
  };

  const handleMainDashboardWidgetToggle = (id: string, visible: boolean) => {
    const key = MAIN_WIDGET_PREF_KEYS[id as MainWidgetId];
    if (!key) return;
    const setters: Record<string, (v: boolean) => void> = {
      showDonationsSavingsWidget: setShowDonationsSavingsWidget,
      showPurchasesWidget: setShowPurchasesWidget,
      showLendBorrowWidget: setShowLendBorrowWidget,
      showTransferWidget: setShowTransferWidget,
      showClientsWidget: setShowClientsWidget,
      showLearningWidget: setShowLearningWidget,
      showInvestmentsWidget: setShowInvestmentsWidget,
      showPrizeBondsWidget: setShowPrizeBondsWidget,
    };
    setters[key]?.(visible);
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

  useEffect(() => {
    const next = syncCurrencyFilter(dashboardCurrencyFilter, filteredDashboardCurrencies, getProfilePreferredCurrency(profile));
    if (next && next !== dashboardCurrencyFilter) setDashboardCurrencyFilter(next);
  }, [dashboardCurrencyFilter, filteredDashboardCurrencies, profile]);

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
      hasInvestments: hasInvestmentContractsInCurrency,
      hasPrizeBonds,
    };
  }, [storeAccounts, donationSavingRecords, dashboardCurrencyFilter, storeTransactions, purchases, isPremium, hasLendBorrowRecords, hasTransfers, clients.length, courses.length, hasInvestmentContractsInCurrency, hasPrizeBonds]);
  
  // Check if any widget in the Purchase/LendBorrow/Transfer row will be visible
  const hasAnyWidgetVisible = useMemo(() => {
    const hasPurchase = purchases.length > 0 && showPurchasesWidget;
    const hasLendBorrow = isPremium && hasLendBorrowRecords && showLendBorrowWidget;
    const hasTransfer = hasTransfers && showTransferWidget;
    return hasPurchase || hasLendBorrow || hasTransfer;
  }, [purchases.length, showPurchasesWidget, isPremium, hasLendBorrowRecords, showLendBorrowWidget, hasTransfers, showTransferWidget]);
  

  // Dynamic widget filtering - filters out hidden/unavailable widgets for dynamic positioning
  const visibleMainDashboardWidgets = useMemo(() => {
    const widgets: Array<{ id: string; render: () => React.ReactNode }> = [];
    const { hasDonations, hasLearning } = widgetAvailability;

    if (widgetAvailability.hasInvestments && showInvestmentsWidget) {
      widgets.push({
        id: 'investments',
        render: () => (
          <div className="w-full h-full animate-fadeIn" key="investments">
            <InvestmentSummaryCard filterCurrency={dashboardCurrencyFilter} />
          </div>
        )
      });
    }

    if (widgetAvailability.hasPrizeBonds && showPrizeBondsWidget) {
      widgets.push({
        id: 'prize-bonds',
        render: () => (
          <div className="w-full h-full animate-fadeIn" key="prize-bonds">
            <PrizeBondSummaryCard filterCurrency={dashboardCurrencyFilter} />
          </div>
        )
      });
    }

    if (showDonationsSavingsWidget && hasDonations) {
      widgets.push({
        id: 'donations',
        render: () => (
          <div className="w-full h-full animate-fadeIn" key="donations">
            <DonationSavingsOverviewCard
              t={t}
              formatCurrency={formatCurrency}
              filterCurrency={dashboardCurrencyFilter}
              timeFilter={dashboardTimeFilter}
            />
          </div>
        )
      });
    }

    // Purchase Overview
    if (purchases.length > 0 && showPurchasesWidget) {
      widgets.push({
        id: 'purchases',
        render: () => (
          <div className="w-full h-full animate-fadeIn" key="purchases">
            <PurchaseOverviewCard filterCurrency={dashboardCurrencyFilter} timeFilter={dashboardTimeFilter} />
          </div>
        )
      });
    }

    // L&B Summary Card
    if (isPremium && hasLendBorrowRecords && showLendBorrowWidget) {
      widgets.push({
        id: 'lend-borrow',
        render: () => (
          <div className="w-full h-full animate-fadeIn" key="lend-borrow">
            <LendBorrowSummaryCard filterCurrency={dashboardCurrencyFilter} />
          </div>
        )
      });
    }

    // Transfer Summary Card
    if (hasTransfers && showTransferWidget) {
      widgets.push({
        id: 'transfers',
        render: () => (
          <div className="w-full h-full animate-fadeIn" key="transfers">
            <TransferSummaryCard filterCurrency={dashboardCurrencyFilter} />
          </div>
        )
      });
    }

    // Clients Overview Card
    if (clients.length > 0 && showClientsWidget) {
      widgets.push({
        id: 'clients',
        render: () => (
          <div className="w-full h-full animate-fadeIn" key="clients">
            <ClientsOverviewCard filterCurrency={dashboardCurrencyFilter} timeFilter={dashboardTimeFilter} />
          </div>
        )
      });
    }

    // Learning Summary Card
    if (hasLearning && showLearningWidget) {
      widgets.push({
        id: 'learning',
        render: () => (
          <div className="w-full h-full animate-fadeIn" key="learning">
            <LearningSummaryCard />
          </div>
        )
      });
    }

    const orderRank = (id: string) => {
      const i = mainDashboardWidgetOrder.indexOf(id);
      return i === -1 ? 999 : i;
    };
    widgets.sort((a, b) => orderRank(a.id) - orderRank(b.id));
    return widgets;
  }, [
    // Only include dependencies that affect widget visibility
    showDonationsSavingsWidget,
    widgetAvailability,
    purchases.length,
    showPurchasesWidget,
    isPremium,
    hasLendBorrowRecords,
    showLendBorrowWidget,
    hasTransfers,
    showTransferWidget,
    clients.length,
    showClientsWidget,
    showLearningWidget,
    showInvestmentsWidget,
    showPrizeBondsWidget,
    mainDashboardWidgetOrder,
    dashboardCurrencyFilter,
    dashboardTimeFilter, // Added: time filter affects widget data
    // t and formatCurrency are stable functions, but included for completeness
    t,
    formatCurrency
    // Removed hover/tooltip deps — they don't affect visibility
  ]);


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
        // Don't set hasLoadError — in-flight fetch may still succeed
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
        countsTowardIncomeExpenseSummaries(t)
      )
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = transactions
      .filter(t => t.type === 'expense' && 
        !t.tags?.some((tag: string) => tag.includes('transfer') || tag.includes('dps_transfer')) &&
        countsTowardIncomeExpenseSummaries(t)
      )
      .reduce((sum, t) => sum + t.amount, 0);
    
    return { totalIncome: income, totalExpenses: expenses };
  }, [transactions]);

  // Use the raw accounts array from the store
  const rawAccounts = useFinanceStore((state) => state.accounts);
  
  // Debug logging for accounts and stats

  // Calculate spending breakdown data for pie chart - memoized
  const spendingData = useMemo(() => {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - SPENDING_ANALYSIS_DAYS);
    
    const expenses = transactions.filter(t => 
      t.type === 'expense' && 
      new Date(t.date) >= last30Days &&
      !t.tags?.some(tag => tag.includes('transfer') || tag.includes('dps_transfer')) &&
      countsTowardIncomeExpenseSummaries(t)
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
        month: formatAppMonthShort(date),
        income: 0,
        expenses: 0
      };
    }).reverse();

    transactions.forEach(transaction => {
      if (transaction.tags?.some((tag: string) => tag.includes('transfer') || tag.includes('dps_transfer'))) return;
      if (!countsTowardIncomeExpenseSummaries(transaction)) return;
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
      </>
    );
  }

  return (
    <>
      <PullToRefreshDashboard onRefresh={handleRefresh} />
      {/* Main Dashboard Content */}
      <div data-tour="dashboard" className="flex min-w-0 flex-col lg:flex-row gap-6">
        {/* Main Content - Full width on mobile, flex-1 on desktop */}
        <div className="flex-1 min-w-0 dashboard-main-stack">

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
          <div className="dashboard-section-grid">
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

          {/* Shared Currency Filter & Card Visibility - Compact chips */}
          <div className="mt-4 sm:mt-6">
            <DashboardFilterBar
              filterCurrency={dashboardCurrencyFilter}
              onCurrencyChange={setDashboardCurrencyFilter}
              timeFilter={dashboardTimeFilter}
              onTimeFilterChange={setDashboardTimeFilter}
              currencies={filteredDashboardCurrencies}
              inspirationText={`"${barQuote.q}" — ${barQuote.a}`}
              isInspirationFavorited={isBarQuoteFavorited}
              onRefreshInspiration={() => { void refreshBarQuote(); }}
              onToggleInspirationFavorite={async () => {
                if (isBarQuoteFavorited) {
                  await removeFavoriteQuoteByContent(barQuote.q, barQuote.a);
                } else {
                  await addFavoriteQuote({
                    quote: barQuote.q,
                    author: barQuote.a,
                    category: inferDailyInspirationCategory(barQuote.q)
                  });
                }
              }}
              onOpenFavoriteQuotes={() => navigate('/personal-growth?tab=favorite-quotes')}
              onOpenWidgets={() => setShowSettingsPanel(true)}
            />
          </div>

          {/* Donations, Purchase, L&B, Transfer - Responsive grid */}
          {/* Dynamic widget rendering - widgets automatically fill available spaces */}
          <div className="dashboard-section-grid">
            {visibleMainDashboardWidgets.map((widget) => widget.render())}
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
              
              if (widgetAvailability.hasInvestments) {
                widgetsMap['investments'] = {
                  id: 'investments',
                  name: 'Investments',
                  visible: showInvestmentsWidget,
                  available: true,
                  order: 0,
                };
              }
              if (widgetAvailability.hasPrizeBonds) {
                widgetsMap['prize-bonds'] = {
                  id: 'prize-bonds',
                  name: 'Prize bonds',
                  visible: showPrizeBondsWidget,
                  available: true,
                  order: 0,
                };
              }
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
          <MobileAccordionWidget widgetConfig={widgetConfig} hasTaskReminders={hasTaskReminders} />
        </div>
      </div>

      {/* Modals - Consolidated at the end to prevent multiple instances */}
      {/* TransactionForm is opened from MainLayout FloatingActionButton */}

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