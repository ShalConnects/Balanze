import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Trash2,
  Eye,
  Image,
  FileText,
  File,
  X,
  AlertTriangle,
  Edit2,
  ChevronUp,
  ChevronDown,
  Link,
  ShoppingBag,
} from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Purchase } from '../../types';
import { usePlanFeatures } from '../../hooks/usePlanFeatures';
import { format } from 'date-fns';
import { getPreference, setPreference } from '../../lib/userPreferences';
import { toast } from 'sonner';
import { formatCurrencyCompact } from '../../utils/currency';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { PurchaseAttachment } from '../../types';
// DatePicker loaded dynamically to reduce initial bundle size
// import DatePicker from 'react-datepicker';
// import 'react-datepicker/dist/react-datepicker.css';
import { LazyDayPicker as DatePicker } from '../common/LazyDayPicker';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useLoadingContext } from '../../context/LoadingContext';
import { useRecordSelection } from '../../hooks/useRecordSelection';
import { useSelectionSearchSync } from '../../hooks/useSelectionSearchSync';
import { sanitizeHtml } from '../../lib/sanitize';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { getProfilePreferredCurrency, syncCurrencyFilter } from '../../utils/usePreferredCurrency';
import { normalizeSearchText, includesNormalized } from '../../utils/searchText';

import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';
import { Tooltip } from '../common/Tooltip';
import { PurchaseCardSkeleton, PurchaseTableSkeleton, PurchaseSummaryCardsSkeleton, PurchaseFiltersSkeleton } from './PurchaseSkeleton';

const currencySymbols: Record<string, string> = {
  USD: '$',
  BDT: '৳',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  ALL: 'L', // Albanian Lek
  INR: '₹',
  CAD: '$',
  AUD: '$',
  // Add more as needed
};
const getCurrencySymbol = (currency: string) => currencySymbols[currency] || currency;

// Add this helper function if not present
function formatFileSize(bytes: number) {
  if (!bytes) return '';
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

// Helper function to determine tooltip text based on notes and attachments
const getTooltipText = (hasNotes: boolean, hasAttachments: boolean): string => {
  if (hasNotes && hasAttachments) {
    return 'Has both notes and attachments';
  } else if (hasNotes) {
    return 'Has note';
  } else if (hasAttachments) {
    return 'Has attachment';
  }
  return '';
};

// Helper function to determine if eye icon should be shown
const shouldShowEyeIcon = (hasNotes: boolean, hasAttachments: boolean): boolean => {
  return hasNotes || hasAttachments;
};

/** Same as ClientList note/eye when client has a note; purchase eye only renders with notes or attachments. */
const purchaseNoteEyeButtonClassName =
  'p-2 rounded-lg transition-colors text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20';

export const PurchaseTracker: React.FC = () => {
  const {
    purchases,
    purchaseCategories,
    loading,
    error,
    fetchPurchases,
    deletePurchase,
    getMultiCurrencyPurchaseAnalytics,
    accounts,
    fetchAccounts,
    deleteTransaction,
    transactions,
  } = useFinanceStore();
  const { user, profile } = useAuthStore();
  const { wrapAsync, setLoadingMessage } = useLoadingContext();
  const { usageStats, isPremiumPlan } = usePlanFeatures();
  const { isMobile } = useMobileDetection();
  const { setShowPurchaseForm } = useFinanceStore();
  const navigate = useNavigate();

  // Widget visibility state - hybrid approach (localStorage + database)
  const [, setShowPurchasesWidget] = useState(() => {
    const saved = localStorage.getItem('showPurchasesWidget');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Check if purchases widget is hidden
  const [isPurchasesWidgetHidden, setIsPurchasesWidgetHidden] = useState(() => {
    const saved = localStorage.getItem('showPurchasesWidget');
    return saved !== null ? !JSON.parse(saved) : false;
  });
  const [isRestoringWidget, setIsRestoringWidget] = useState(false);

  // Listen for widget visibility changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'showPurchasesWidget' && e.newValue !== null) {
        setIsPurchasesWidgetHidden(!JSON.parse(e.newValue));
      }
    };
    
    const handleCustomStorageChange = () => {
      const saved = localStorage.getItem('showPurchasesWidget');
      if (saved !== null) {
        setIsPurchasesWidgetHidden(!JSON.parse(saved));
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('showPurchasesWidgetChanged', handleCustomStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('showPurchasesWidgetChanged', handleCustomStorageChange);
    };
  }, []);

  // Memoize fetch functions to prevent infinite loops
  const fetchPurchasesCallback = useCallback(() => {
    useFinanceStore.getState().fetchPurchases();
  }, []);

  const fetchPurchaseCategoriesCallback = useCallback(() => {
    useFinanceStore.getState().fetchPurchaseCategories();
  }, []);

  const fetchAccountsCallback = useCallback(() => {
    useFinanceStore.getState().fetchAccounts();
  }, []);

  // Record selection functionality
  const {
    selectedRecord,
    selectedId,
    isFromSearch,
    selectedRecordRef,
    clearSelection,
    hasSelection
  } = useRecordSelection({
    records: purchases,
    recordIdField: 'id',
    scrollToRecord: true
  });



  // Debug logging for purchases data - removed for production


  // Fetch data when component mounts
  useEffect(() => {
    if (user) {
      fetchPurchasesCallback();
      fetchPurchaseCategoriesCallback();
      fetchAccountsCallback();
    }
  }, [user, fetchPurchasesCallback, fetchPurchaseCategoriesCallback, fetchAccountsCallback]);

  // Load user preferences for Purchases widget visibility
  useEffect(() => {
    if (user?.id) {
      const loadPreferences = async () => {
        try {
          const showWidget = await getPreference(user.id, 'showPurchasesWidget', true);
          setShowPurchasesWidget(showWidget);
          localStorage.setItem('showPurchasesWidget', JSON.stringify(showWidget));
        } catch (error: unknown) {

          // Keep current localStorage value if database fails
        }
      };
      loadPreferences();
    }
  }, [user?.id]);

  // Show Purchases widget on dashboard
  const handleShowPurchasesWidget = useCallback(async () => {
    // Update localStorage immediately for instant UI response
    localStorage.setItem('showPurchasesWidget', JSON.stringify(true));
    setShowPurchasesWidget(true);
    setIsPurchasesWidgetHidden(false);
    window.dispatchEvent(new CustomEvent('showPurchasesWidgetChanged'));
    
    // Save to database if user is authenticated
    if (user?.id) {
      try {
        await setPreference(user.id, 'showPurchasesWidget', true);
        toast.success('Purchases widget will be shown on dashboard!', {
          description: 'You can hide it again from the dashboard'
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
  }, [user?.id, setShowPurchasesWidget]);

  // Function to restore purchases widget to dashboard
  const handleShowPurchasesWidgetFromPage = useCallback(async () => {
    setIsRestoringWidget(true);
    
    try {
      // Use the existing function that has proper database sync
      await handleShowPurchasesWidget();
      
      // Update local state
      setIsPurchasesWidgetHidden(false);
    } finally {
      setIsRestoringWidget(false);
    }
  }, [handleShowPurchasesWidget]);

  // Fetch attachment counts for all purchases
  useEffect(() => {
    const fetchAttachmentCounts = async () => {
      if (purchases.length === 0) return;
      
      try {
        const purchaseIds = purchases.map(p => p.id);
        const { data: attachmentCounts, error } = await supabase
          .from('purchase_attachments')
          .select('purchase_id')
          .in('purchase_id', purchaseIds);
        
        if (!error && attachmentCounts) {
          const counts: Record<string, number> = {};
          attachmentCounts.forEach(att => {
            counts[att.purchase_id] = (counts[att.purchase_id] || 0) + 1;
          });
          setPurchaseAttachmentCounts(counts);
        }
      } catch (err) {

      }
    };

    fetchAttachmentCounts();
  }, [purchases]);

  // Check if categories exist and redirect to settings if needed
  const checkCategoriesAndRedirect = () => {
    const hasExpenseCategories = purchaseCategories.length > 0;
    
    if (!hasExpenseCategories) {
      toast.error('Please add expense categories first before creating purchases', {
        description: 'You need expense categories to create purchases.',
        action: {
          label: 'Go to Settings',
          onClick: () => navigate('/settings?tab=categories')
        }
      });
      return false;
    }
    return true;
  };

  const [selectedCurrency, setSelectedCurrency] = useState<string>('');
  
  // Helper to format dates as YYYY-MM-DD in local timezone (avoid UTC conversion issues)
  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // Initialize date range for "This Month" by default
  const getThisMonthDateRange = () => {
    const today = new Date();
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    return {
      start: formatLocalDate(first),
      end: formatLocalDate(last)
    };
  };

  // Function to get readable date range label
  const getDateRangeLabel = () => {
    if (!filters.dateRange.start || !filters.dateRange.end) {
      return 'All Time';
    }

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    // Check if it's today
    if (filters.dateRange.start === todayStr && filters.dateRange.end === todayStr) {
      return 'Today';
    }

    // Check if it's this week
    const day = today.getDay();
    const diffToMonday = (day === 0 ? -6 : 1) - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const mondayStr = monday.toISOString().slice(0, 10);
    const sundayStr = sunday.toISOString().slice(0, 10);
    
    if (filters.dateRange.start === mondayStr && filters.dateRange.end === sundayStr) {
      return 'This Week';
    }

    // Check if it's this month
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const firstOfMonthStr = formatLocalDate(firstOfMonth);
    const lastOfMonthStr = formatLocalDate(lastOfMonth);
    
    if (filters.dateRange.start === firstOfMonthStr && filters.dateRange.end === lastOfMonthStr) {
      return 'This Month';
    }

    // Check if it's last month
    const firstOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    
    const firstOfLastMonthStr = firstOfLastMonth.toISOString().slice(0, 10);
    const lastOfLastMonthStr = lastOfLastMonth.toISOString().slice(0, 10);
    
    if (filters.dateRange.start === firstOfLastMonthStr && filters.dateRange.end === lastOfLastMonthStr) {
      return 'Last Month';
    }

    // Check if it's this year
    const firstOfYear = new Date(today.getFullYear(), 0, 1);
    const lastOfYear = new Date(today.getFullYear(), 11, 31);
    
    const firstOfYearStr = firstOfYear.toISOString().slice(0, 10);
    const lastOfYearStr = lastOfYear.toISOString().slice(0, 10);
    
    if (filters.dateRange.start === firstOfYearStr && filters.dateRange.end === lastOfYearStr) {
      return 'This Year';
    }

    // If none match, show custom range
    return 'Custom Range';
  };

  // Filters - Load from localStorage or use defaults
  const [filters, setFilters] = useState(() => {
    const saved = localStorage.getItem('purchaseFilters');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Validate and merge with defaults to ensure all fields exist
        return {
          search: parsed.search || '',
          category: parsed.category || 'all',
          priority: parsed.priority || 'all',
          currency: parsed.currency || '',
          status: parsed.status || 'all',
          dateRange: parsed.dateRange && parsed.dateRange.start !== undefined && parsed.dateRange.end !== undefined
            ? parsed.dateRange
            : getThisMonthDateRange()
        };
      } catch {
        // If parsing fails, use defaults
      }
    }
    return {
      search: '',
      category: 'all',
      priority: 'all' as 'all' | 'low' | 'medium' | 'high',
      currency: '' as string,
      status: 'all' as 'all' | 'planned' | 'purchased' | 'cancelled',
      dateRange: getThisMonthDateRange()
    };
  });

  // Save filters to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('purchaseFilters', JSON.stringify(filters));
  }, [filters]);

  // Mobile filter states
  const [showMobileFilterMenu, setShowMobileFilterMenu] = useState(false);
  const [tempFilters, setTempFilters] = useState({
    search: '',
    category: 'all',
    priority: 'all' as 'all' | 'low' | 'medium' | 'high',
    currency: '' as string,
    status: 'all' as 'all' | 'planned' | 'purchased' | 'cancelled',
    dateRange: { start: '', end: '' }
  });

  // Add sorting state
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  useSelectionSearchSync({
    hasSelection,
    isFromSearch,
    selectedId,
    selectedRecord,
    searchValue: filters.search,
    onSearchChange: (value) => setFilters(prev => ({ ...prev, search: value })),
    clearSelection,
    getSelectedSearchValue: (record) => record.item_name,
  });

  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedPurchaseForModal, setSelectedPurchaseForModal] = useState<Purchase | null>(null);
  const [modalAttachments, setModalAttachments] = useState<PurchaseAttachment[]>([]);
  const [viewingFile, setViewingFile] = useState<PurchaseAttachment | null>(null);
  const [imageZoom, setImageZoom] = useState(100);
  const [purchaseAttachmentCounts, setPurchaseAttachmentCounts] = useState<Record<string, number>>({});

  const openPurchaseDetails = async (purchase: Purchase) => {
    setSelectedPurchaseForModal(purchase);
    setShowNotesModal(true);
    try {
      const { data, error } = await supabase.from('purchase_attachments').select('*').eq('purchase_id', purchase.id);
      setModalAttachments(!error && data ? data : []);
    } catch {
      setModalAttachments([]);
    }
  };

  // Selected purchase parameter handling
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedPurchaseId = searchParams.get('selected');
  const selectedPurchaseRef = useRef<HTMLDivElement>(null);

  // Scroll to selected purchase when component mounts
  useEffect(() => {
    if (selectedPurchaseId && selectedPurchaseRef.current) {
      setTimeout(() => {
        selectedPurchaseRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        // Remove the selected parameter after scrolling
        setSearchParams(prev => {
          const newParams = new URLSearchParams(prev);
          newParams.delete('selected');
          return newParams;
        });
      }, 500);
    }
  }, [selectedPurchaseId, setSearchParams]);

  // Get multi-currency analytics
  const multiCurrencyAnalytics = getMultiCurrencyPurchaseAnalytics();
  
  // Get all unique currencies from accounts
  const accountCurrencies = Array.from(new Set(accounts.map(a => a.currency)));
  // Only show selected_currencies if available, else all from accounts
  const currencyOptions = useMemo(() => {
    if (profile?.selected_currencies && profile.selected_currencies.length > 0) {
      return accountCurrencies.filter(c => profile.selected_currencies?.includes?.(c));
    }
    return accountCurrencies;
  }, [profile?.selected_currencies, accountCurrencies]);
  const availableCurrencies = (currencyOptions.length > 0
    ? currencyOptions
    : multiCurrencyAnalytics.byCurrency.map((analytics) => analytics.currency).filter((c): c is string => Boolean(c)));



  useEffect(() => {
    const next = syncCurrencyFilter(filters.currency || selectedCurrency, availableCurrencies, getProfilePreferredCurrency(profile), {
      fallbackCurrency: profile?.selected_currencies?.[0],
    });
    if (!next) return;
    if (next !== filters.currency) setFilters(f => ({ ...f, currency: next }));
    if (next !== selectedCurrency) setSelectedCurrency(next);
  }, [availableCurrencies, filters.currency, selectedCurrency, profile]);

  // Mobile filter functionality
  useEffect(() => {
    if (showMobileFilterMenu) {
      setTempFilters(filters);
    }
  }, [showMobileFilterMenu, filters]);

  const handleCloseModal = () => {
    setTempFilters({
      search: '',
      category: 'all',
      priority: 'all',
      currency: '',
      status: 'all',
      dateRange: { start: '', end: '' }
    });
    setShowMobileFilterMenu(false);
  };

  // Handle Escape key to close mobile filter modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showMobileFilterMenu) {
        handleCloseModal();
      }
    };

    if (showMobileFilterMenu) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showMobileFilterMenu]);
  


  // Filter purchases
  const filteredPurchases = useMemo(() => {
    const normalizedSearch = normalizeSearchText(filters.search);
    return purchases.filter(purchase => {
      const matchesSearch = !normalizedSearch ||
        includesNormalized(purchase.item_name, normalizedSearch) ||
        includesNormalized(purchase.notes, normalizedSearch);
      const matchesCategory = filters.category === 'all' || purchase.category === filters.category;
      const matchesPriority = filters.priority === 'all' || purchase.priority === filters.priority;
      const matchesCurrency = filters.currency === '' || purchase.currency === filters.currency;
      const matchesStatus = filters.status === 'all' || purchase.status === filters.status;
      
      let matchesDate = true;
      // Skip date filtering if status is 'planned' (show all time for planned purchases)
      if (filters.status !== 'planned' && filters.dateRange.start && filters.dateRange.end) {
        // Compare date strings directly to avoid timezone conversion issues
        // purchase.purchase_date is in YYYY-MM-DD format, same as filters.dateRange.start/end
        const purchaseDateStr = purchase.purchase_date.slice(0, 10); // Ensure we only use date part
        const isAfterStart = purchaseDateStr >= filters.dateRange.start;
        const isBeforeEnd = purchaseDateStr <= filters.dateRange.end;
        matchesDate = isAfterStart && isBeforeEnd;
        
      }

      return matchesSearch && matchesCategory && matchesPriority && matchesCurrency && matchesStatus && matchesDate;
    });
  }, [purchases, filters]);

  // For analytics cards, use the table filter currency (calculate early for useMemo hooks)
  const analyticsCurrency = filters.currency || profile?.local_currency || profile?.selected_currencies?.[0] || '';
  
  // Calculate total planned amount and overdue planned amount (must be before any early returns)
  const totalPlannedAmount = useMemo(() => {
    const plannedPurchases = filteredPurchases.filter(p => p.status === 'planned' && p.currency === analyticsCurrency);
    return plannedPurchases.reduce((sum, p) => sum + Number(p.price), 0);
  }, [filteredPurchases, analyticsCurrency]);
  
  const overduePlannedAmount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overduePlanned = filteredPurchases.filter(p => 
      p.status === 'planned' && 
      p.currency === analyticsCurrency &&
      new Date(p.purchase_date) < today
    );
    return overduePlanned.reduce((sum, p) => sum + Number(p.price), 0);
  }, [filteredPurchases, analyticsCurrency]);

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === 'BDT') {
      return `৳${amount.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (!currency) return amount.toString();
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
      }).format(amount);
    } catch {
      return amount.toString();
    }
  };

  const getStatusBadge = (status: Purchase['status']) => {
    const config = {
      planned: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      purchased: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle }
    };
    const { color, icon: Icon } = config[status];
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getPriorityBadge = (priority: Purchase['priority']) => {
    const config = {
      low: { color: 'bg-gray-100 text-gray-800' },
      medium: { color: 'bg-blue-100 text-blue-800' },
      high: { color: 'bg-red-100 text-red-800' }
    };
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config[priority].color}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  };

  // For custom currency dropdown
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);
  const currencyMenuRef = useRef<HTMLDivElement>(null);
  // Hide currency menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (currencyMenuRef.current && !currencyMenuRef.current.contains(event.target as Node)) {
        setShowCurrencyMenu(false);
      }
    }
    if (showCurrencyMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCurrencyMenu]);

  // Custom dropdown states for filter bar
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [showFilterCurrencyMenu, setShowFilterCurrencyMenu] = useState(false);
  const categoryMenuRef = useRef<HTMLDivElement>(null);
  const priorityMenuRef = useRef<HTMLDivElement>(null);
  const filterCurrencyMenuRef = useRef<HTMLDivElement>(null);
  const categoryMenuPortalRef = useRef<HTMLDivElement>(null);
  const priorityMenuPortalRef = useRef<HTMLDivElement>(null);
  const filterCurrencyMenuPortalRef = useRef<HTMLDivElement>(null);

  // Portal menu positions
  const [filterCurrencyMenuPos, setFilterCurrencyMenuPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });
  const [categoryMenuPos, setCategoryMenuPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });
  const [priorityMenuPos, setPriorityMenuPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });

  // Hide filter dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      // Check category menu - close if click is outside both button container and portaled dropdown
      if (showCategoryMenu) {
        const inButton = categoryMenuRef.current?.contains(target);
        const inPortal = categoryMenuPortalRef.current?.contains(target);
        if (!inButton && !inPortal) {
          setShowCategoryMenu(false);
        }
      }
      // Check priority menu - close if click is outside both button container and portaled dropdown
      if (showPriorityMenu) {
        const inButton = priorityMenuRef.current?.contains(target);
        const inPortal = priorityMenuPortalRef.current?.contains(target);
        if (!inButton && !inPortal) {
          setShowPriorityMenu(false);
        }
      }
      // Check currency menu - close if click is outside both button container and portaled dropdown
      if (showFilterCurrencyMenu) {
        const inButton = filterCurrencyMenuRef.current?.contains(target);
        const inPortal = filterCurrencyMenuPortalRef.current?.contains(target);
        if (!inButton && !inPortal) {
          setShowFilterCurrencyMenu(false);
        }
      }
    }
    if (showCategoryMenu || showPriorityMenu || showFilterCurrencyMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCategoryMenu, showPriorityMenu, showFilterCurrencyMenu]);

  // Calculate positions for portaled menus
  useEffect(() => {
    if (showFilterCurrencyMenu && filterCurrencyMenuRef.current) {
      const rect = filterCurrencyMenuRef.current.getBoundingClientRect();
      setFilterCurrencyMenuPos({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width });
    }
  }, [showFilterCurrencyMenu]);

  useEffect(() => {
    if (showCategoryMenu && categoryMenuRef.current) {
      const rect = categoryMenuRef.current.getBoundingClientRect();
      setCategoryMenuPos({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width });
    }
  }, [showCategoryMenu]);

  useEffect(() => {
    if (showPriorityMenu && priorityMenuRef.current) {
      const rect = priorityMenuRef.current.getBoundingClientRect();
      setPriorityMenuPos({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width });
    }
  }, [showPriorityMenu]);

  // State for delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [purchaseToDelete, setPurchaseToDelete] = useState<Purchase | null>(null);

  const getFileIcon = (fileType: string) => {
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(fileType)) {
      return <Image className="w-4 h-4" />;
    } else if (fileType === 'pdf') {
      return <FileText className="w-4 h-4" />;
    } else if (['doc', 'docx', 'txt', 'rtf', 'odt'].includes(fileType)) {
      return <FileText className="w-4 h-4" />;
    } else if (['xls', 'xlsx', 'csv', 'ods'].includes(fileType)) {
      return <FileText className="w-4 h-4" />;
    } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(fileType)) {
      return <File className="w-4 h-4" />;
    } else {
      return <File className="w-4 h-4" />;
    }
  };

  // Handle attachment download
  const handleDownloadAttachment = async (filePath: string, fileName: string) => {
    try {
      // Check if we're in a Capacitor app (Android/iOS)
      const isCapacitor = !!(window as any).Capacitor;
      
      if (isCapacitor) {
        // For Android/iOS apps, use system browser for downloads
        try {
          // Check if Capacitor Browser is available in the global scope
          const capacitorBrowser = (window as any).Capacitor?.Plugins?.Browser;
          
          if (capacitorBrowser && typeof capacitorBrowser.open === 'function') {
            // Use Capacitor Browser plugin to open in system browser
            await capacitorBrowser.open({ url: filePath });
            toast.success('File opened in browser for download');
          } else {
            // For Android WebView, open in system browser using window.open
            const newWindow = window.open(filePath, '_blank', 'noopener,noreferrer');
            if (newWindow) {
              toast.info('File opened in browser. You can download it from there.');
            } else {
              // For Android WebView, try multiple approaches
              try {
                // Method 1: Try to fetch and create blob (works better in Android WebView)
                const response = await fetch(filePath, {
                  method: 'GET',
                  mode: 'cors',
                  credentials: 'omit'
                });
                
                if (response.ok) {
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = fileName;
                  link.style.display = 'none';
                  document.body.appendChild(link);
                  link.click();
                  
                  // Clean up
                  document.body.removeChild(link);
                  window.URL.revokeObjectURL(url);
                  
                  toast.success('Download completed!');
                } else {
                  throw new Error('Failed to fetch file');
                }
              } catch (fetchError) {
                // Fetch method failed, trying direct link - removed for production
                
                // Method 2: Direct link approach
                const link = document.createElement('a');
                link.href = filePath;
                link.download = fileName;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.style.display = 'none';
                document.body.appendChild(link);
                
                // Try to trigger the download
                link.click();
                
                // Clean up
                setTimeout(() => {
                  document.body.removeChild(link);
                }, 100);
                
                toast.info('Download initiated. Check your Downloads folder or browser downloads.');
              }
            }
          }
        } catch (capacitorError) {
          // Capacitor download failed, trying fallback - removed for production
          
          // Fallback: Open in system browser
          const newWindow = window.open(filePath, '_blank', 'noopener,noreferrer');
          if (newWindow) {
            toast.info('File opened in browser. You can download it from there.');
          } else {
            throw new Error('Unable to open file. Please check your app settings.');
          }
        }
      } else {
        // For regular browsers, use the standard download method
        try {
          // First try: Direct download link (works for same-origin files)
          const link = document.createElement('a');
          link.href = filePath;
          link.download = fileName;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          toast.success('Download started!');
        } catch (directError) {
          // Direct download failed, trying fetch method - removed for production
          
          // Second try: Fetch and blob method (for CORS-enabled files)
          const response = await fetch(filePath, {
            method: 'GET',
            mode: 'cors',
            credentials: 'omit'
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          
          // Clean up
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          toast.success('Download completed!');
        }
      }
    } catch (error) {

      toast.error(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please try opening the file in a new tab.`);
    }
  };

  // Add at the top, after useState:
  const plannedCountAll = purchases.filter(p => p.status === 'planned').length;


// --- Date Filter UI: Match Transactions Page ---
  const [showPresetDropdown, setShowPresetDropdown] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customStart, setCustomStart] = useState(filters.dateRange.start ? filters.dateRange.start.slice(0, 10) : '');
  const [customEnd, setCustomEnd] = useState(filters.dateRange.end ? filters.dateRange.end.slice(0, 10) : '');
  const presetDropdownRef = useRef<HTMLDivElement>(null);
  const dateMenuButtonRef = useRef<HTMLDivElement>(null);
  const [presetMenuPos, setPresetMenuPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });

  // Click outside handler for preset dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const inButton = dateMenuButtonRef.current?.contains(target);
      const inPortal = presetDropdownRef.current?.contains(target);
      if (showPresetDropdown && !inButton && !inPortal) {
        setShowPresetDropdown(false);
      }
    }
    if (showPresetDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPresetDropdown]);

  useEffect(() => {
    if (showPresetDropdown && dateMenuButtonRef.current) {
      const rect = dateMenuButtonRef.current.getBoundingClientRect();
      setPresetMenuPos({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width });
    }
  }, [showPresetDropdown]);

  // Preset date range handler
  const handlePresetRange = (preset: string) => {
    const today = new Date();
    if (preset === 'custom') {
      setShowPresetDropdown(false);
      setShowCustomModal(true);
      setCustomStart(filters.dateRange.start ? filters.dateRange.start.slice(0, 10) : '');
      setCustomEnd(filters.dateRange.end ? filters.dateRange.end.slice(0, 10) : '');
      return;
    }
    setShowCustomModal(false);
    let start = '', end = '';
    switch (preset) {
      case 'today':
        start = today.toISOString().slice(0, 10);
        end = today.toISOString().slice(0, 10);
        break;
      case 'thisWeek': {
        const day = today.getDay();
        const diffToMonday = (day === 0 ? -6 : 1) - day;
        const monday = new Date(today);
        monday.setDate(today.getDate() + diffToMonday);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        start = monday.toISOString().slice(0, 10);
        end = sunday.toISOString().slice(0, 10);
        break;
      }
      case 'thisMonth': {
        const first = new Date(today.getFullYear(), today.getMonth(), 1);
        const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        start = formatLocalDate(first);
        end = formatLocalDate(last);
        break;
      }
      case 'lastMonth': {
        const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const last = new Date(today.getFullYear(), today.getMonth(), 0);
        start = first.toISOString().slice(0, 10);
        end = last.toISOString().slice(0, 10);
        break;
      }
      case 'thisYear': {
        const first = new Date(today.getFullYear(), 0, 1);
        const last = new Date(today.getFullYear(), 11, 31);
        start = first.toISOString().slice(0, 10);
        end = last.toISOString().slice(0, 10);
        break;
      }
      case 'allTime':
        start = '';
        end = '';
        break;
      default:
        break;
    }
    setFilters(f => ({ ...f, dateRange: { start, end } }));
  };

  if (!selectedCurrency) {
    return <div className="min-h-[300px] flex items-center justify-center text-xl">No currency selected or available.</div>;
  }

  if (availableCurrencies.length === 0) {
    return <div className="min-h-[300px] flex items-center justify-center text-xl">No accounts or currencies found. Please add an account first.</div>;
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Enhanced skeleton for purchases page */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 pb-[13px] lg:pb-0 relative overflow-hidden">
          {/* Shimmer effect for the entire container */}
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
          
          {/* Filters skeleton */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 relative z-10">
            <PurchaseFiltersSkeleton />
          </div>
          
          {/* Summary cards skeleton */}
          <div className="p-4 relative z-10">
            <PurchaseSummaryCardsSkeleton />
          </div>
          
          {/* Responsive skeleton - Desktop table, Mobile cards */}
          <div className="hidden md:block p-4 relative z-10">
            <PurchaseTableSkeleton rows={6} />
          </div>
          <div className="md:hidden relative z-10">
            <PurchaseCardSkeleton count={4} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="min-h-[300px] flex items-center justify-center text-red-600 text-xl">{error}</div>;
  }


  // Financial totals for top summary card (affected by table filters)
  const summaryTotalSpent = filteredPurchases.reduce((sum, p) => sum + (p.status === 'purchased' ? Number(p.price) : 0), 0);
  
  // Currency-scoped lifetime analytics (unaffected by other table filters)
  const currencyFilteredPurchases = analyticsCurrency ? purchases.filter(p => p.currency === analyticsCurrency) : purchases;
  const lifetimeTotalSpent = currencyFilteredPurchases.reduce((sum, p) => sum + (p.status === 'purchased' ? Number(p.price) : 0), 0);
  const monthlySpent = currencyFilteredPurchases.filter(p => p.status === 'purchased').length > 0
    ? lifetimeTotalSpent / Math.max(1, Math.ceil((new Date().getTime() - Math.min(...currencyFilteredPurchases.filter(p => p.status === 'purchased').map(p => new Date(p.purchase_date).getTime()))) / (1000 * 60 * 60 * 24 * 30)))
    : 0;
  
  // Filtered counts for display (affected by filters)
  const purchasedCount = filteredPurchases.filter(p => p.status === 'purchased').length;
  
  // Total count (affected by currency filter)
  const lifetimeTotalCount = currencyFilteredPurchases.length;

  // Sorting function
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Get sort icon
  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ChevronUp className="w-4 h-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-blue-600" />
      : <ChevronDown className="w-4 h-4 text-blue-600" />;
  };

  // Sort function
  const sortData = (data: Purchase[]) => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.key) {
        case 'item_name':
          aValue = a.item_name.toLowerCase();
          bValue = b.item_name.toLowerCase();
          break;
        case 'category':
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
          break;
        case 'price':
          aValue = Number(a.price);
          bValue = Number(b.price);
          break;
        case 'status':
          aValue = a.status.toLowerCase();
          bValue = b.status.toLowerCase();
          break;
        case 'priority':
          const priorityOrder = { low: 1, medium: 2, high: 3 };
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder];
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder];
          break;
        case 'date':
          aValue = new Date(a.purchase_date).getTime();
          bValue = new Date(b.purchase_date).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  return (
    <div className="space-y-6">

      {/* Unified Filters and Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden pb-[13px] lg:pb-0">
        {/* Filters Header */}
        <div className="p-2 sm:p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap items-center gap-2">

          <div>
            <div className="relative">
                              <Search className={`absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 ${filters.search ? 'text-blue-500' : 'text-gray-400'}`} />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className={`w-full pl-8 pr-2 py-1.5 text-[13px] h-8 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 transition-colors ${
                  filters.search 
                    ? 'border-blue-300 dark:border-blue-600' 
                    : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                }`}
                style={filters.search ? { background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' } : {}}
                placeholder="Search purchases…"
              />
            </div>
          </div>

          {/* Mobile Filter and Add Purchase Buttons */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setShowMobileFilterMenu(true)}
              className={`px-2 py-1.5 text-[13px] h-8 w-8 rounded-md transition-colors flex items-center justify-center ${
                (filters.category !== 'all' || filters.priority !== 'all' || filters.currency || filters.dateRange.start || filters.dateRange.end)
                  ? 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              style={(filters.category !== 'all' || filters.priority !== 'all' || filters.currency || filters.dateRange.start || filters.dateRange.end) ? { background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' } : {}}
              title="Filters"
            >
              <Filter className="w-4 h-4" />
            </button>
            {isPurchasesWidgetHidden && (
              <button
                onClick={handleShowPurchasesWidgetFromPage}
                disabled={isRestoringWidget}
                className="px-2 py-1.5 text-[13px] h-8 w-8 rounded-md transition-colors flex items-center justify-center text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' }}
                title="Show Purchases Widget on Dashboard"
                aria-label="Show Purchases Widget on Dashboard"
              >
                {isRestoringWidget ? (
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Eye className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            )}
            <button
              onClick={() => {
                // Purchase form button clicked - removed for production
                if (checkCategoriesAndRedirect()) {
                  setShowPurchaseForm(true);
                }
              }}
              className="bg-gradient-primary text-white px-2 py-1.5 rounded-md hover:bg-gradient-primary-hover transition-colors flex items-center justify-center text-[13px] h-8 w-8"
              
              title="Add Purchase"
              aria-label="Add Purchase"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="hidden md:block">
              <div className="relative" ref={filterCurrencyMenuRef}>
                <button
                  onClick={() => setShowFilterCurrencyMenu(v => !v)}
                  className={`px-3 py-1.5 pr-2 text-[13px] h-8 rounded-md transition-colors flex items-center space-x-1.5 ${
                    filters.currency 
                      ? 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  style={filters.currency ? { background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' } : {}}
                >
                  <span>{filters.currency || currencyOptions[0]}</span>
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </button>
                {showFilterCurrencyMenu && createPortal(
                  <div ref={filterCurrencyMenuPortalRef} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-[100] max-h-48 overflow-y-auto"
                       style={{ position: 'absolute', top: filterCurrencyMenuPos.top + 8, left: filterCurrencyMenuPos.left, width: filterCurrencyMenuPos.width }}>
                    {currencyOptions.map(currency => (
                      <button
                        key={currency}
                        onClick={() => { setFilters({ ...filters, currency }); setShowFilterCurrencyMenu(false); }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${filters.currency === currency ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : ''}`}
                      >
                        {currency}
                      </button>
                    ))}
                  </div>, document.body
                )}
          </div>
          </div>



          <div className="hidden md:block">
              <div className="relative" ref={categoryMenuRef}>
                <button
                  onClick={() => setShowCategoryMenu(v => !v)}
                  className={`px-3 py-1.5 pr-2 text-[13px] h-8 rounded-md transition-colors flex items-center space-x-1.5 ${
                    filters.category !== 'all' 
                      ? 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  style={filters.category !== 'all' ? { background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' } : {}}
                >
                  <span>{filters.category === 'all' ? 'All Categories' : filters.category}</span>
                  <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </button>
                {showCategoryMenu && createPortal(
                  <div ref={categoryMenuPortalRef} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-[100] max-h-48 overflow-y-auto"
                       style={{ position: 'absolute', top: categoryMenuPos.top + 8, left: categoryMenuPos.left, width: categoryMenuPos.width }}>
                    <button
                      onClick={() => { setFilters({ ...filters, category: 'all' }); setShowCategoryMenu(false); }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${filters.category === 'all' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : ''}`}
                    >
                      All Categories
                    </button>
            {purchaseCategories.map(category => (
                      <button
                        key={category.id}
                        onClick={() => { setFilters({ ...filters, category: category.category_name }); setShowCategoryMenu(false); }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${filters.category === category.category_name ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : ''}`}
                      >
                {category.category_name}
                      </button>
            ))}
                  </div>, document.body
                )}
              </div>
          </div>

          <div className="hidden md:block">
              <div className="relative" ref={priorityMenuRef}>
                <button
                  onClick={() => setShowPriorityMenu(v => !v)}
                  className={`px-3 py-1.5 pr-2 text-[13px] h-8 rounded-md transition-colors flex items-center space-x-1.5 ${
                    filters.priority !== 'all' 
                      ? 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  style={filters.priority !== 'all' ? { background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' } : {}}
                >
                  <span>{filters.priority === 'all' ? 'All Priorities' : filters.priority.charAt(0).toUpperCase() + filters.priority.slice(1)}</span>
                  <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </button>
                {showPriorityMenu && createPortal(
                  <div ref={priorityMenuPortalRef} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-[100]"
                       style={{ position: 'absolute', top: priorityMenuPos.top + 8, left: priorityMenuPos.left, width: priorityMenuPos.width }}>
                    {(['all', 'low', 'medium', 'high'] as const).map(priority => (
                      <button
                        key={priority}
                        onClick={() => { setFilters({ ...filters, priority: priority as 'all' | 'low' | 'medium' | 'high' }); setShowPriorityMenu(false); }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${(filters.priority as string) === priority ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : ''}`}
                      >
                        {priority === 'all' ? 'All Priorities' : priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </button>
                    ))}
                  </div>, document.body
                )}
              </div>
          </div>
            {/* Date Filter Dropdown and Modal (matches Transactions page) */}
            <div className="relative hidden md:block" ref={dateMenuButtonRef}>
              <button
                className={`px-3 py-1.5 pr-2 text-[13px] h-8 rounded-md transition-colors flex items-center space-x-1.5 ${
                  'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                } ${showPresetDropdown ? 'ring-2 ring-blue-500' : ''}`}
                style={{ background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' }}
                onClick={() => setShowPresetDropdown(v => !v)}
                type="button"
              >
                <span>{getDateRangeLabel()}</span>
                <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showPresetDropdown && createPortal(
                <div ref={presetDropdownRef} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-[100] min-w-[140px]"
                     style={{ position: 'absolute', top: presetMenuPos.top + 8, left: presetMenuPos.left, width: presetMenuPos.width }}>
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100" onClick={() => { handlePresetRange('today'); setShowPresetDropdown(false); }}>Today</button>
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100" onClick={() => { handlePresetRange('thisWeek'); setShowPresetDropdown(false); }}>This Week</button>
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100" onClick={() => { handlePresetRange('thisMonth'); setShowPresetDropdown(false); }}>This Month</button>
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100" onClick={() => { handlePresetRange('lastMonth'); setShowPresetDropdown(false); }}>Last Month</button>
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100" onClick={() => { handlePresetRange('thisYear'); setShowPresetDropdown(false); }}>This Year</button>
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100" onClick={() => { handlePresetRange('allTime'); setShowPresetDropdown(false); }}>All Time</button>
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100" onClick={() => { handlePresetRange('custom'); }}>Custom Range…</button>
                </div>, document.body
              )}
              {/* Custom Range Modal */}
              {showCustomModal && (
                <>
                  <style>{`
                    .react-datepicker, .react-datepicker * {
                      font-family: 'Manrope', sans-serif !important;
                    }
                  `}</style>
                  <div className="fixed inset-0 z-[100] flex items-center justify-center">
                    <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setShowCustomModal(false)} />
                    <div className="relative bg-white dark:bg-gray-800 rounded-lg p-6 max-w-xs w-full mx-4 shadow-xl flex flex-col items-center">
                      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Select Custom Date Range</h3>
                      <div className="flex flex-col gap-3 w-full">
                        <div className="flex flex-col">
                          <label className="text-xs text-gray-600 dark:text-gray-400 mb-1">Start Date</label>
                          <DatePicker
                            selected={customStart ? new Date(customStart) : null}
                            onChange={(date: Date | null) => setCustomStart(date ? date.toISOString().slice(0, 10) : '')}
                            maxDate={customEnd ? new Date(customEnd) : undefined}
                            dateFormat="MM/dd/yyyy"
                            className="bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded w-full font-sans text-gray-900 dark:text-gray-100"
                            placeholderText="Select start date"
                            isClearable
                            autoComplete="off"
                          />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-xs text-gray-600 dark:text-gray-400 mb-1">End Date</label>
                          <DatePicker
                            selected={customEnd ? new Date(customEnd) : null}
                            onChange={(date: Date | null) => setCustomEnd(date ? date.toISOString().slice(0, 10) : '')}
                            minDate={customStart ? new Date(customStart) : undefined}
                            dateFormat="MM/dd/yyyy"
                            className="bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded w-full font-sans text-gray-900 dark:text-gray-100"
                            placeholderText="Select end date"
                            isClearable
                            autoComplete="off"
                          />
                        </div>
                        {customStart && customEnd && new Date(customEnd) < new Date(customStart) && (
                          <div className="text-xs text-red-500 mt-1">End date cannot be before start date.</div>
                        )}
                      </div>
                      <div className="flex gap-2 mt-6 w-full">
                        <button
                          className="flex-1 py-2 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-100"
                          onClick={() => setShowCustomModal(false)}
                        >
                          Cancel
                        </button>
                        <button
                          className="flex-1 py-2 rounded bg-gradient-primary hover:bg-gradient-primary-hover text-white disabled:opacity-50"
                          disabled={!!(customStart && customEnd && new Date(customEnd) < new Date(customStart))}
                          onClick={() => {
                            setFilters(f => ({ ...f, dateRange: {
                              start: customStart ? new Date(customStart).toISOString() : '',
                              end: customEnd ? new Date(customEnd).toISOString() : ''
                            }}));
                            setShowCustomModal(false);
                          }}
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {(filters.search || filters.category !== 'all' || filters.priority !== 'all' || (filters.currency && filters.currency !== (profile?.local_currency || profile?.selected_currencies?.[0])) || getDateRangeLabel() !== 'This Month') && (
              <button
                onClick={() => setFilters({ search: '', category: 'all', priority: 'all', currency: '', status: 'all', dateRange: getThisMonthDateRange() })}
                className="text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center"
                title="Clear all filters"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}

            {/* Add Purchase Button moved here */}
            <div className="hidden md:flex items-center gap-2 ml-auto">
              {isPurchasesWidgetHidden && (
                <button
                  onClick={handleShowPurchasesWidgetFromPage}
                  disabled={isRestoringWidget}
                  className="bg-gray-100 text-gray-700 px-3 py-1.5 h-8 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Show Purchases Widget on Dashboard"
                  aria-label="Show Purchases Widget on Dashboard"
                >
                  {isRestoringWidget ? (
                    <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                </button>
              )}
              {/* Desktop Add Purchase Button */}
              <button
                onClick={() => {
                  // Purchase form button clicked - removed for production
                  if (checkCategoriesAndRedirect()) {
                    setShowPurchaseForm(true);
                  }
                }}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-primary text-white rounded-md hover:bg-gradient-primary-hover transition-colors whitespace-nowrap h-8 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-[13px]"
                
                title="Add Purchase"
                aria-label="Add Purchase"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Purchase</span>
              </button>


            </div>
          </div>
        </div>
        {/* Analytics Cards Grid - moved inside table container */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 p-2 sm:p-3">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 px-2">
            <div className="flex items-center justify-between">
              <div className="text-left">
                                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Spent</p>
                <p className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" style={{ fontSize: '1.2rem' }}>
                  {formatCurrency(summaryTotalSpent, analyticsCurrency)}
                </p>
                <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: '11px' }}>
                  {(() => {
                    const avgSpent = purchasedCount > 0 ? summaryTotalSpent / purchasedCount : 0;
                    return `Avg ${formatCurrency(avgSpent, analyticsCurrency)} per purchase`;
                  })()}
                </p>
              </div>
              <span className="text-blue-600" style={{ fontSize: '1.2rem' }}>
                {getCurrencySymbol(analyticsCurrency)}
              </span>
            </div>
          </div>
          <div 
            onClick={() => {
              setFilters(prev => ({
                ...prev,
                status: prev.status === 'purchased' ? 'all' : 'purchased'
              }));
            }}
            className={`relative bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 px-2 cursor-pointer transition-all ${
              filters.status === 'purchased' 
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {filters.status === 'purchased' && (
              <span className="absolute top-1 right-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-600 text-white">
                Active
              </span>
            )}
            <div className="flex items-center justify-between">
              <div className="text-left">
                                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Purchased</p>
                <p className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" style={{ fontSize: '1.2rem' }}>{purchasedCount}</p>
                <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: '11px' }}>
                  {(() => {
                    const totalPurchases = purchasedCount + plannedCountAll;
                    const completionRate = totalPurchases > 0 ? Math.round((purchasedCount / totalPurchases) * 100) : 0;
                    return `Completion Rate: ${completionRate}%`;
                  })()}
                </p>
              </div>
              <CheckCircle className="text-blue-600" style={{ fontSize: '1.2rem', width: '1.2rem', height: '1.2rem' }} />
            </div>
          </div>
          <div 
            onClick={() => {
              setFilters(prev => ({
                ...prev,
                status: prev.status === 'planned' ? 'all' : 'planned'
              }));
            }}
            className={`relative bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 px-2 cursor-pointer transition-all ${
              filters.status === 'planned' 
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {filters.status === 'planned' && (
              <span className="absolute top-1 right-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-600 text-white">
                Active
              </span>
            )}
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Planned</p>
                <p className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" style={{ fontSize: '1.2rem' }}>{plannedCountAll}</p>
                <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: '11px' }}>
                  {(() => {
                    const today = new Date();
                    const overdueCount = filteredPurchases.filter(p => 
                      p.status === 'planned' && 
                      new Date(p.purchase_date) < today
                    ).length;
                    return `Overdue: ${overdueCount} item${overdueCount !== 1 ? 's' : ''}`;
                  })()}
                </p>
              </div>
              <Clock className="text-blue-600" style={{ fontSize: '1.2rem', width: '1.2rem', height: '1.2rem' }} />
            </div>
          </div>
          {!isPremiumPlan && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 px-2">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Purchase Limit</p>
                  <p className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" style={{ fontSize: '1.2rem' }}>
                    {(() => {
                      if (isPremiumPlan) return '∞';
                      if (usageStats && 'purchases' in usageStats) {
                        const current = (usageStats as any).purchases?.current || 0;
                        let limit = (usageStats as any).purchases?.limit;
                        // If limit is -1 (unlimited) or invalid, default to 50 for free users
                        if (!limit || limit === -1 || limit < 0) {
                          limit = 50;
                        }
                        return `${current}/${limit}`;
                      }
                      // Fallback for free users
                      return `${purchases.length}/50`;
                    })()}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: '11px' }}>
                    {isPremiumPlan ? 'Unlimited purchases' : 'Free plan limit'}
                  </p>
                </div>
                <svg className="text-blue-600" style={{ fontSize: '1.2rem', width: '1.2rem', height: '1.2rem' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2l4 -4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
            </div>
          )}
          
          {totalPlannedAmount > 0 && (
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-md border border-orange-200 dark:border-orange-800 py-1.5 px-2">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="text-xs font-medium text-orange-700 dark:text-orange-300">Total Planned Amount</p>
                  <p className="font-bold text-orange-600 dark:text-orange-400" style={{ fontSize: '1.2rem' }}>
                    {formatCurrency(totalPlannedAmount, analyticsCurrency)}
                  </p>
                  <p className="text-orange-600 dark:text-orange-400" style={{ fontSize: '11px' }}>
                    From planned purchases
                  </p>
                </div>
                <span className="text-orange-600 dark:text-orange-400" style={{ fontSize: '1.2rem' }}>{getCurrencySymbol(analyticsCurrency)}</span>
              </div>
            </div>
          )}
          
          {overduePlannedAmount > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800 py-1.5 px-2">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="text-xs font-medium text-red-700 dark:text-red-300">Overdue Planned Amount</p>
                  <p className="font-bold text-red-600 dark:text-red-400" style={{ fontSize: '1.2rem' }}>
                    {formatCurrency(overduePlannedAmount, analyticsCurrency)}
                  </p>
                  <p className="text-red-600 dark:text-red-400" style={{ fontSize: '11px' }}>
                    From overdue planned purchases
                  </p>
                </div>
                <span className="text-red-600 dark:text-red-400" style={{ fontSize: '1.2rem' }}>{getCurrencySymbol(analyticsCurrency)}</span>
              </div>
            </div>
          )}
        </div>
        {/* Desktop Table View */}
        <div className="xl:block hidden overflow-x-auto lg:rounded-b-xl" style={{ borderBottomLeftRadius: '0.75rem', borderBottomRightRadius: '0.75rem' }}>
          <div className="max-h-[500px] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900 text-[14px]">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => handleSort('item_name')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Item Name</span>
                    {getSortIcon('item_name')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => handleSort('category')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Category</span>
                    {getSortIcon('category')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => handleSort('price')}
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>Price</span>
                    {getSortIcon('price')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>Status</span>
                    {getSortIcon('status')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => handleSort('priority')}
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>Priority</span>
                    {getSortIcon('priority')}
                  </div>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                      <ShoppingBag className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No purchase records found</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                      Start tracking your purchases and shopping lists by adding your first item
                    </p>
                  </td>
                </tr>
              ) : (
                sortData(filteredPurchases).map((purchase) => {
                  const isSelected = selectedId === purchase.id;
                  const isFromSearchSelection = isFromSearch && isSelected;
                  
                  return (
                    <tr 
                      key={purchase.id} 
                      id={`purchase-${purchase.id}`}
                      ref={isSelected ? selectedRecordRef : null}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${
                        isSelected 
                          ? isFromSearchSelection 
                            ? 'ring-2 ring-blue-500 ring-opacity-50 bg-blue-50 dark:bg-blue-900/20' 
                            : 'ring-2 ring-blue-500 ring-opacity-50'
                          : ''
                      }`}
                    >
                      <td className="px-6 py-2">
                        <div className="flex items-center">
                          <div className="flex-1">
                            <div 
                              className="text-sm font-medium text-gray-900 dark:text-white"
                            >
                              {purchase.item_name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {format(new Date(purchase.purchase_date), 'MMM dd, yyyy')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-2 text-left">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor: purchaseCategories.find(c => c.category_name === purchase.category)?.category_color || '#6B7280'
                            }}
                          />
                          <span className="text-sm text-gray-900 dark:text-white">{purchase.category}</span>
                        </div>
                      </td>
                      <td className="px-6 py-2 text-center text-gray-900 dark:text-gray-100">
                        {formatCurrency(purchase.price, purchase.currency ?? 'USD')}
                      </td>
                      <td className="px-6 py-2 text-center">
                        {getStatusBadge(purchase.status)}
                      </td>
                      <td className="px-6 py-2 text-center">
                        {getPriorityBadge(purchase.priority)}
                      </td>
                      <td className="px-6 py-2 text-center">
                        <div className="flex justify-center gap-2 items-center">
                          {(() => {
                            const hasNotes = Boolean(purchase.notes && purchase.notes.trim().length > 0);
                            const hasAttachments = Boolean(purchaseAttachmentCounts[purchase.id] > 0);
                            const shouldShow = shouldShowEyeIcon(hasNotes, hasAttachments);
                            const tooltipText = getTooltipText(hasNotes, hasAttachments);
                            
                            if (!shouldShow) return null;
                            
                            return (
                              <Tooltip content={tooltipText} placement="top">
                                <button
                                  onClick={() => openPurchaseDetails(purchase)}
                                  className={purchaseNoteEyeButtonClassName}
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </Tooltip>
                            );
                          })()}
                          <Tooltip content="Edit" placement="top">
                            <button
                              onClick={() => setShowPurchaseForm(true, purchase)}
                              className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </Tooltip>
                          {purchase.transaction_id && (
                            <Tooltip content="Linked to Transaction" placement="top">
                              <div
                                className="text-gray-500 dark:text-gray-400"
                              >
                                <Link className="w-4 h-4" />
                              </div>
                            </Tooltip>
                          )}
                          <Tooltip content="Delete" placement="top">
                            <button
                              onClick={() => { setPurchaseToDelete(purchase); setShowDeleteModal(true); }}
                              className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
                      </table>
            </div>
          </div>

        {/* Mobile Card View */}
        <div className="lg:hidden max-h-[500px] overflow-y-auto">
          <div className="space-y-3 sm:space-y-4 px-2 sm:px-3">
            {filteredPurchases.length === 0 ? (
              <div className="text-center py-16">
                <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <ShoppingBag className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No purchase records found</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                  Start tracking your purchases and shopping lists by adding your first item
                </p>
              </div>
            ) : (
              sortData(filteredPurchases).map((purchase) => {
                const isSelected = selectedPurchaseId === purchase.id;
                return (
                  <div 
                    key={purchase.id} 
                    id={`purchase-${purchase.id}`}
                    className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow ${isSelected ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
                  >
                    {/* Card Header - Item Name and Date */}
                    <div className="flex items-center justify-between p-3 sm:p-4 pb-2">
                      <div className="flex-1">
                        <div className="text-base font-medium text-gray-900 dark:text-white mb-1">
                          {purchase.item_name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(purchase.purchase_date), 'MMM dd, yyyy')}
                        </div>
                      </div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatCurrency(purchase.price, purchase.currency ?? 'USD')}
                      </div>
                    </div>

                    {/* Card Body - Category and Status */}
                    <div className="px-4 pb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: purchaseCategories.find(c => c.category_name === purchase.category)?.category_color || '#6B7280'
                          }}
                        />
                        <span className="text-sm text-gray-900 dark:text-white">{purchase.category}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(purchase.status)}
                        {getPriorityBadge(purchase.priority)}
                      </div>
                    </div>

                    {/* Card Footer - Actions */}
                    <div className="flex items-center justify-between px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                      {(() => {
                        const hasNotes = Boolean(purchase.notes && purchase.notes.trim().length > 0);
                        const hasAttachments = Boolean(purchaseAttachmentCounts[purchase.id] > 0);
                        const shouldShow = shouldShowEyeIcon(hasNotes, hasAttachments);
                        const tooltipText = getTooltipText(hasNotes, hasAttachments);
                        
                        return (
                          <>
                            {shouldShow && (
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                {tooltipText}
                              </div>
                            )}
                            <div className="flex gap-2">
                              {shouldShow && (
                                <Tooltip content={tooltipText} placement="top">
                                  <button
                                    onClick={() => openPurchaseDetails(purchase)}
                                    className={purchaseNoteEyeButtonClassName}
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                </Tooltip>
                              )}
                          <Tooltip content="Edit" placement="top">
                            <button
                              onClick={() => setShowPurchaseForm(true, purchase)}
                              className="p-1.5 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </Tooltip>
                        {purchase.transaction_id && (
                          <Tooltip content="Linked to Transaction" placement="top">
                            <div
                              className="p-1.5 text-gray-500 dark:text-gray-400"
                            >
                              <Link className="w-3.5 h-3.5" />
                            </div>
                          </Tooltip>
                        )}
                        <Tooltip content="Delete" placement="top">
                          <button
                            onClick={() => { setPurchaseToDelete(purchase); setShowDeleteModal(true); }}
                            className="p-1.5 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Tablet Stacked Table View */}
        <div className="hidden lg:block xl:hidden max-h-[500px] overflow-y-auto">
          <div className="space-y-4 px-2.5">
            {filteredPurchases.length === 0 ? (
              <div className="text-center py-16">
                <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <ShoppingBag className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No purchase records found</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                  Start tracking your purchases and shopping lists by adding your first purchase
                </p>
              </div>
            ) : (
              filteredPurchases.map((purchase) => {
                const isSelected = selectedId === purchase.id;
                const isFromSearchSelection = isFromSearch && isSelected;
                
                
                return (
                  <div
                    key={purchase.id}
                    id={`purchase-${purchase.id}`}
                    ref={isSelected ? selectedRecordRef : null}
                    className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow ${
                      isSelected 
                        ? isFromSearchSelection 
                          ? 'ring-2 ring-blue-500 ring-opacity-50 bg-blue-50 dark:bg-blue-900/20' 
                          : 'ring-2 ring-blue-500 ring-opacity-50'
                        : ''
                    }`}
                  >
                    {/* Row 1: Item Name, Date, Price, Actions */}
                    <div className="grid grid-cols-12 gap-2 sm:gap-3 p-2 sm:p-3 border-b border-gray-100 dark:border-gray-800">
                      <div className="col-span-12 sm:col-span-5 md:col-span-4">
                        <div className="font-medium text-sm sm:text-base text-gray-900 dark:text-white truncate">
                          {purchase.item_name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {format(new Date(purchase.purchase_date), 'MMM dd, yyyy')}
                        </div>
                      </div>
                      <div className="col-span-6 sm:col-span-3 md:col-span-3">
                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-medium">
                          {formatCurrency(purchase.price, purchase.currency ?? 'USD')}
                        </div>
                      </div>
                      <div className="col-span-4 sm:col-span-2 md:col-span-3">
                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 capitalize">
                          {purchase.status}
                        </div>
                      </div>
                      <div className="col-span-2 sm:col-span-2 flex items-center justify-end gap-0.5 sm:gap-1">
                        {(() => {
                          const hasNotes = Boolean(purchase.notes && purchase.notes.trim().length > 0);
                          const hasAttachments = Boolean(purchaseAttachmentCounts[purchase.id] > 0);
                          const shouldShow = shouldShowEyeIcon(hasNotes, hasAttachments);
                          const tooltipText = getTooltipText(hasNotes, hasAttachments);
                          
                          if (!shouldShow) return null;
                          
                          return (
                            <Tooltip content={tooltipText} placement="top">
                              <button
                                onClick={() => openPurchaseDetails(purchase)}
                                className={purchaseNoteEyeButtonClassName}
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </Tooltip>
                          );
                        })()}
                        <Tooltip content="Edit purchase" placement="top">
                          <button
                            onClick={() => setShowPurchaseForm(true, purchase)}
                            className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </Tooltip>
                        {purchase.transaction_id && (
                          <Tooltip content="Linked to Transaction" placement="top">
                            <div
                              className="text-gray-500 dark:text-gray-400"
                            >
                              <Link className="w-4 h-4" />
                            </div>
                          </Tooltip>
                        )}
                        <Tooltip content="Delete purchase" placement="top">
                          <button
                            onClick={() => { setPurchaseToDelete(purchase); setShowDeleteModal(true); }}
                            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                    
                    {/* Row 2: Category, Account, Notes */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 p-2 sm:p-3">
                      <div className="col-span-1 sm:col-span-4">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Category</div>
                        <div className="text-sm text-gray-900 dark:text-white truncate">
                          {purchase.category || 'Uncategorized'}
                        </div>
                      </div>
                      <div className="col-span-1 sm:col-span-4">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Priority</div>
                        <div className="text-sm text-gray-900 dark:text-white">
                          {purchase.priority.charAt(0).toUpperCase() + purchase.priority.slice(1)}
                        </div>
                      </div>
                      <div className="col-span-1 sm:col-span-4">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Notes</div>
                        <div className="text-sm text-gray-900 dark:text-white max-h-20 overflow-hidden">
                          {purchase.notes ? (
                            <div className="ql-editor" dangerouslySetInnerHTML={{ __html: sanitizeHtml(purchase.notes) }} />
                          ) : (
                            '-'
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Summary Bar - Integrated with table */}
        <div className="lg:block hidden bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-3" style={{ borderBottomLeftRadius: '0.75rem', borderBottomRightRadius: '0.75rem' }}>
          <div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">All Time Summary</span>
          </div>
          <div className="flex items-center text-sm">
            {/* Total Spent */}
            <div className="flex items-center gap-2 pr-4 border-r border-gray-200 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">Total Spent:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatCurrencyCompact(lifetimeTotalSpent, analyticsCurrency)}
              </span>
            </div>

            {/* Monthly Spent */}
            <div className="flex items-center gap-2 px-4 border-r border-gray-200 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">Monthly Spent:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatCurrencyCompact(monthlySpent, analyticsCurrency)}
              </span>
            </div>

            {/* Total Purchases */}
            <div className="flex items-center gap-2 pl-4">
              <span className="text-gray-600 dark:text-gray-400">Purchases:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {lifetimeTotalCount}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Summary Section - Regular section at bottom */}
        <div className="lg:hidden mt-4 sm:mt-6 mx-2 sm:mx-0 mb-0 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="p-3 sm:p-4 space-y-3">
            <div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">All Time Summary</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Spent</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatCurrencyCompact(lifetimeTotalSpent, analyticsCurrency)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Monthly Spent</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatCurrencyCompact(monthlySpent, analyticsCurrency)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Total</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {lifetimeTotalCount} Purchases
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Combined Purchase Details & File Viewer Modal */}
      {showNotesModal && selectedPurchaseForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-40" onClick={() => { setShowNotesModal(false); setSelectedPurchaseForModal(null); setModalAttachments([]); setViewingFile(null); setImageZoom(100); }} />
          <div className={`relative bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 ease-out ${
            viewingFile 
              ? 'w-[80vw] h-[80vh] animate-in zoom-in-95' 
              : 'p-6 max-w-[35rem] w-full animate-in zoom-in-95'
          }`}>
            {/* Cross icon at top right */}
            <button
              onClick={() => { setShowNotesModal(false); setSelectedPurchaseForModal(null); setModalAttachments([]); setViewingFile(null); setImageZoom(100); }}
              className="absolute top-3 right-3 text-gray-400 hover:text-red-500 dark:hover:text-red-400 focus:outline-none z-20"
              aria-label="Close"
              type="button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            {!viewingFile ? (
              /* Purchase Details View */
              <div className="animate-in fade-in duration-300">
                <h2 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">Purchase Details</h2>
                {selectedPurchaseForModal.notes && selectedPurchaseForModal.notes.trim().length > 0 && (
                  <div className="mb-4 whitespace-pre-line text-gray-800 dark:text-gray-200 text-sm max-h-40 overflow-y-auto">
                    <strong>Notes:</strong>
                    <div className="ql-editor dark:text-gray-200" dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedPurchaseForModal.notes) }} />
                  </div>
                )}
                {modalAttachments.length > 0 &&
                  <div className="mb-4">
                    <strong className="text-gray-900 dark:text-gray-100">Attachments:</strong>
                    <div className="grid grid-cols-1 gap-3">
                      {modalAttachments.map((att, idx) => (
                        <div
                          key={att.id || idx}
                          className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
                        >
                          {/* Thumbnail or Icon */}
                          {att.mime_type?.startsWith('image/') ? (
                            <a href={att.file_path} target="_blank" rel="noopener noreferrer">
                              <img src={att.file_path} alt={att.file_name} className="w-12 h-12 object-cover rounded border border-gray-200 dark:border-gray-600" />
                            </a>
                          ) : (
                            <div className="w-12 h-12 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded">
                              {getFileIcon(att.file_type)}
                            </div>
                          )}

                          {/* File Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate" title={att.file_name}>
                              {att.file_name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{att.mime_type || att.file_type}{att.file_size ? ` • ${formatFileSize(att.file_size)}` : ''}</p>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            <button 
                              onClick={() => setViewingFile(att)}
                              className="text-gray-500 hover:text-blue-600 dark:hover:text-blue-400" 
                              title="View"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => handleDownloadAttachment(att.file_path, att.file_name)}
                              className="text-gray-500 hover:text-blue-600 dark:hover:text-blue-400" 
                              title="Download"
                            >
                              <Download className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                }
              </div>
            ) : (
              /* File Viewer View */
              <div className="h-full flex flex-col animate-in fade-in duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  {/* Left side - Back button */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setViewingFile(null)}
                      className="text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 focus:outline-none p-1"
                      aria-label="Back to attachments"
                      type="button"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                    </button>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                      {viewingFile.file_name}
                    </h3>
                  </div>
                  
                  {/* Right side - Empty for now */}
                  <div></div>
                </div>
                
                {/* File Content */}
                <div className="p-4 h-[calc(80vh-120px)] overflow-auto bg-gray-100 dark:bg-gray-800">
                  {viewingFile.mime_type?.startsWith('image/') ? (
                    <div className="flex justify-center overflow-auto">
                      <img 
                        src={viewingFile.file_path} 
                        alt={viewingFile.file_name}
                        className="max-w-full object-contain rounded-lg shadow-lg transition-transform duration-200"
                        style={{ transform: `scale(${imageZoom / 100})` }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <div class="flex flex-col items-center justify-center p-8 text-center">
                                <div class="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                                  <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                  </svg>
                                </div>
                                <p class="text-gray-500 dark:text-gray-400">Unable to load image</p>
                                <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">The image may be corrupted or the file path is invalid</p>
                              </div>
                            `;
                          }
                        }}
                      />
                    </div>
                  ) : viewingFile.file_type === 'pdf' || viewingFile.mime_type === 'application/pdf' ? (
                    <div className="w-full h-[calc(80vh-160px)] bg-white dark:bg-gray-700 rounded-lg overflow-auto">
                      {/* PDF Fallback - Show custom message instead of iframe */}
                      <div className="flex flex-col items-center justify-center p-8 text-center h-full">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                          </svg>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 mb-2">PDF Preview Not Available</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
                          PDFs cannot be displayed inline due to browser security restrictions
                        </p>
                        <div className="flex gap-3">
                          <a 
                            href={viewingFile.file_path} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                            </svg>
                            Open in New Tab
                          </a>
                          <button 
                            onClick={() => handleDownloadAttachment(viewingFile.file_path, viewingFile.file_name)}
                            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                            Download
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-gray-900 rounded-lg">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                        {getFileIcon(viewingFile.file_type)}
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 mb-2">Preview not available for this file type</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
                        {viewingFile.file_name} ({formatFileSize(viewingFile.file_size || 0)})
                      </p>
                      <div className="flex gap-3">
                        <a 
                          href={viewingFile.file_path} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          Open in New Tab
                        </a>
                        <button 
                          onClick={() => handleDownloadAttachment(viewingFile.file_path, viewingFile.file_name)}
                          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Zoom Controls - Bottom Center */}
                {(viewingFile.mime_type?.startsWith('image/') || viewingFile.file_type === 'pdf' || viewingFile.mime_type === 'application/pdf') && (
                  <div className="flex justify-center items-center p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setImageZoom(Math.max(25, imageZoom - 25))}
                        className="px-3 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                        title="Zoom Out"
                      >
                        -
                      </button>
                      <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[4rem] text-center font-medium">
                        {imageZoom}%
                      </span>
                      <button
                        onClick={() => setImageZoom(Math.min(300, imageZoom + 25))}
                        className="px-3 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                        title="Zoom In"
                      >
                        +
                      </button>
                      <button
                        onClick={() => setImageZoom(100)}
                        className="px-3 py-2 text-sm bg-blue-200 dark:bg-blue-700 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-300 dark:hover:bg-blue-600"
                        title="Reset Zoom"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal && !!purchaseToDelete}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={async () => {
          setShowDeleteModal(false);
          if (purchaseToDelete) {
            // Wrap the single delete process with loading state
            const wrappedDelete = wrapAsync(async () => {
              setLoadingMessage('Deleting purchase...');
              try {
                if (purchaseToDelete.transaction_id) {
                  const linkedTransaction = transactions.find(t => t.transaction_id === purchaseToDelete.transaction_id);
                  if (linkedTransaction) {
                    await deleteTransaction(linkedTransaction.id);
                  }
                }
                await deletePurchase(purchaseToDelete.id);
                toast.success('Purchase deleted successfully!');
              } catch (err) {
                toast.error('Failed to delete purchase. Please try again.');
              }
              setPurchaseToDelete(null);
            });
            
            // Execute the wrapped delete function
            await wrappedDelete();
          }
        }}
        title="Delete Purchase"
        message={`Are you sure you want to delete ${purchaseToDelete?.item_name}? This will also remove the linked transaction and update the account balance.`}
        recordDetails={
          <>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="font-medium text-red-800">Purchase Details:</span>
            </div>
            <div className="text-sm text-red-700 space-y-1">
              <div><span className="font-medium">Item:</span> {purchaseToDelete?.item_name}</div>
              <div><span className="font-medium">Price:</span> {purchaseToDelete ? formatCurrency(purchaseToDelete.price, purchaseToDelete.currency ?? 'USD') : ''}</div>
              <div><span className="font-medium">Account:</span> {purchaseToDelete?.account_id ? accounts.find(a => a.id === purchaseToDelete.account_id)?.name || 'N/A' : 'N/A'}</div>
          </div>
          </>
        }
        confirmLabel="Delete Purchase"
        cancelLabel="Cancel"
      />

      {/* Mobile Filter Modal */}
      {showMobileFilterMenu && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black bg-opacity-50" onClick={() => setShowMobileFilterMenu(false)}>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl w-full max-w-xs overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header with Check and Cross */}
            <div className="bg-white dark:bg-gray-900 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Filters</span>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Select filters and click ✓ to apply</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFilters(tempFilters);
                      setShowMobileFilterMenu(false);
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                    }}
                    className={`p-2 transition-colors touch-manipulation ${
                      (tempFilters.category !== 'all' || tempFilters.priority !== 'all' || tempFilters.currency || tempFilters.dateRange.start || tempFilters.dateRange.end)
                        ? 'text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 active:opacity-70'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 active:opacity-70'
                    }`}
                    style={{ touchAction: 'manipulation' }}
                    title="Apply Filters"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFilters({ search: '', category: 'all', priority: 'all', currency: '', status: 'all', dateRange: { start: '', end: '' } });
                      setShowMobileFilterMenu(false);
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                    }}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-2 transition-colors touch-manipulation active:opacity-70"
                    style={{ touchAction: 'manipulation' }}
                    title="Clear All Filters"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            {/* Currency Filter */}
            <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Currency</div>
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setTempFilters({ ...tempFilters, currency: '' });
                  }}
                  className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                    tempFilters.currency === '' 
                      ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200' 
                      : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  All
                </button>
                {currencyOptions.map(currency => (
                  <button
                    key={currency}
                    onClick={(e) => {
                      e.stopPropagation();
                      setTempFilters({ ...tempFilters, currency });
                    }}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                      tempFilters.currency === currency 
                        ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200' 
                        : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {currency}
                  </button>
                ))}
                </div>
              </div>

            {/* Category Filter */}
            <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Category</div>
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setTempFilters({ ...tempFilters, category: 'all' });
                  }}
                  className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                    tempFilters.category === 'all' 
                      ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200' 
                      : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  All
                </button>
                {purchaseCategories.map(category => (
                  <button
                    key={category.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setTempFilters({ ...tempFilters, category: category.category_name });
                    }}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                      tempFilters.category === category.category_name 
                        ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200' 
                        : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {category.category_name}
                  </button>
                ))}
                </div>
              </div>

            {/* Priority Filter */}
            <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Priority</div>
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setTempFilters({ ...tempFilters, priority: 'all' });
                  }}
                  className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                    tempFilters.priority === 'all' 
                      ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200' 
                      : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  All
                </button>
                {(['low', 'medium', 'high'] as const).map(priority => (
                  <button
                    key={priority}
                    onClick={(e) => {
                      e.stopPropagation();
                      setTempFilters({ ...tempFilters, priority });
                    }}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                      tempFilters.priority === priority 
                        ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200' 
                        : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </button>
                ))}
                </div>
              </div>

            {/* Date Range Filter */}
            <div className="px-3 py-2">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Date Range</div>
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setTempFilters({ ...tempFilters, dateRange: { start: '', end: '' } });
                  }}
                  className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                    !tempFilters.dateRange.start && !tempFilters.dateRange.end 
                      ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200' 
                      : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const today = new Date().toISOString().slice(0, 10);
                    setTempFilters({ ...tempFilters, dateRange: { start: today, end: today } });
                  }}
                  className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                    tempFilters.dateRange.start === new Date().toISOString().slice(0, 10) && tempFilters.dateRange.end === new Date().toISOString().slice(0, 10) 
                      ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200' 
                      : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const { start, end } = getThisMonthDateRange();
                    setTempFilters({ ...tempFilters, dateRange: { start, end } });
                  }}
                  className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                    tempFilters.dateRange.start === getThisMonthDateRange().start && tempFilters.dateRange.end === getThisMonthDateRange().end 
                      ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200' 
                      : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  This Month
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

