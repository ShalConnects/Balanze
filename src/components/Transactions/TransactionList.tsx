import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUpRight, ArrowDownRight, Copy, Files, Edit2, Trash2, Plus, Search, Filter, Download, ChevronUp, ChevronDown, TrendingUp, Info, Link, Tag, Repeat, Pause, Play, Settings, Check } from 'lucide-react';
import { Transaction } from '../../types/index';
import { useFinanceStore } from '../../store/useFinanceStore';
import { format } from 'date-fns';
import { TransactionForm } from './TransactionForm';
import { formatCurrency, formatCurrencyCompact, getCurrencySymbol } from '../../utils/currency';
import { formatTransactionId } from '../../utils/transactionId';
import { toast } from 'sonner';
// DatePicker loaded dynamically to reduce initial bundle size
// import DatePicker from 'react-datepicker';
// import 'react-datepicker/dist/react-datepicker.css';
import { LazyDatePicker as DatePicker } from '../common/LazyDatePicker';
import { parseISO } from 'date-fns';
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';
import { Tooltip } from '../common/Tooltip';
// PDF libraries are loaded dynamically via exportUtils (lazy load)
// import jsPDF from 'jspdf';
// import autoTable from 'jspdf-autotable';
import { useAuthStore } from '../../store/authStore';
import { searchService, SEARCH_CONFIGS, highlightMatches } from '../../utils/searchService';

import { useLoadingContext } from '../../context/LoadingContext';
import { useNavigate } from 'react-router-dom';
import { useRecordSelection } from '../../hooks/useRecordSelection';
import { SelectionFilter } from '../common/SelectionFilter';
import { LendBorrowInfoModal } from './LendBorrowInfoModal';
import { useExport } from '../../hooks/useExport';
import { formatTransactionDescription } from '../../utils/transactionDescriptionFormatter';
import { FinancialHealthCard } from './FinancialHealthCard';
import { usePlanFeatures } from '../../hooks/usePlanFeatures';
import { isLendBorrowTransaction } from '../../utils/transactionUtils';

export const TransactionList: React.FC<{ 
  transactions: Transaction[];
  selectedRecord?: any;
  selectedId?: string | null;
  isFromSearch?: boolean;
  hasSelection?: boolean;
  selectedRecordRef?: React.RefObject<HTMLDivElement>;
  clearSelection?: () => void;
}> = ({ 
  transactions, 
  selectedRecord, 
  selectedId, 
  isFromSearch, 
  hasSelection, 
  selectedRecordRef, 
  clearSelection 
}) => {
  
  // Record selection functionality is now passed as props from parent component
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | undefined>();
  const [transactionToDuplicate, setTransactionToDuplicate] = useState<Transaction | undefined>();
  const { getActiveAccounts, getActiveTransactions, deleteTransaction, updateTransaction, fetchTransactions, categories, purchaseCategories } = useFinanceStore();
  const accounts = getActiveAccounts();
  const activeTransactions = getActiveTransactions();
  const { profile } = useAuthStore();
  const { wrapAsync, setLoadingMessage } = useLoadingContext();
  const navigate = useNavigate();
  const { usageStats, isFreePlan, isPremiumPlan } = usePlanFeatures();

  // Mobile filter modal state
  const [showMobileFilterMenu, setShowMobileFilterMenu] = useState(false);
  const [tempFilters, setTempFilters] = useState({
    search: '',
    type: 'all' as 'all' | 'income' | 'expense',
    account: 'all',
    currency: '',
    dateRange: { start: '', end: '' },
    showModifiedOnly: false,
    recentlyModifiedDays: 7,
    showRecurringOnly: false
  });

  // Enhanced search state
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Get this month date range for default
  const getThisMonthDateRange = () => {
    const today = new Date();
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return {
      start: first.toISOString().slice(0, 10),
      end: last.toISOString().slice(0, 10)
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
    
    const firstOfMonthStr = firstOfMonth.toISOString().slice(0, 10);
    const lastOfMonthStr = lastOfMonth.toISOString().slice(0, 10);
    
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

  // Helper function to detect date filter type
  const getDateFilterType = () => {
    if (!filters.dateRange.start || !filters.dateRange.end) {
      return 'allTime';
    }

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    // Check if it's today
    if (filters.dateRange.start === todayStr && filters.dateRange.end === todayStr) {
      return 'today';
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
      return 'week';
    }

    // Check if it's this month
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const firstOfMonthStr = firstOfMonth.toISOString().slice(0, 10);
    const lastOfMonthStr = lastOfMonth.toISOString().slice(0, 10);
    
    if (filters.dateRange.start === firstOfMonthStr && filters.dateRange.end === lastOfMonthStr) {
      return 'month';
    }

    // Check if it's this year
    const firstOfYear = new Date(today.getFullYear(), 0, 1);
    const lastOfYear = new Date(today.getFullYear(), 11, 31);
    
    const firstOfYearStr = firstOfYear.toISOString().slice(0, 10);
    const lastOfYearStr = lastOfYear.toISOString().slice(0, 10);
    
    if (filters.dateRange.start === firstOfYearStr && filters.dateRange.end === lastOfYearStr) {
      return 'year';
    }

    // Custom range
    return 'custom';
  };

  // Helper function to get comparison period based on filter type
  const getComparisonPeriod = (filterType: string) => {
    const today = new Date();
    
    switch (filterType) {
      case 'today':
        return {
          start: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1).toISOString().slice(0, 10),
          end: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1).toISOString().slice(0, 10),
          label: 'yesterday'
        };
      case 'week':
        const day = today.getDay();
        const diffToMonday = (day === 0 ? -6 : 1) - day;
        const monday = new Date(today);
        monday.setDate(today.getDate() + diffToMonday);
        const lastWeekMonday = new Date(monday);
        lastWeekMonday.setDate(monday.getDate() - 7);
        const lastWeekSunday = new Date(lastWeekMonday);
        lastWeekSunday.setDate(lastWeekMonday.getDate() + 6);
        return {
          start: lastWeekMonday.toISOString().slice(0, 10),
          end: lastWeekSunday.toISOString().slice(0, 10),
          label: 'last week'
        };
      case 'month':
        const firstOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        return {
          start: firstOfLastMonth.toISOString().slice(0, 10),
          end: lastOfLastMonth.toISOString().slice(0, 10),
          label: 'last month'
        };
      case 'year':
        const firstOfLastYear = new Date(today.getFullYear() - 1, 0, 1);
        const lastOfLastYear = new Date(today.getFullYear() - 1, 11, 31);
        return {
          start: firstOfLastYear.toISOString().slice(0, 10),
          end: lastOfLastYear.toISOString().slice(0, 10),
          label: 'last year'
        };
      case 'custom':
        // For custom ranges, calculate a similar length period before the current range
        const currentStart = new Date(filters.dateRange.start);
        const currentEnd = new Date(filters.dateRange.end);
        const rangeLength = Math.ceil((currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24));
        const comparisonEnd = new Date(currentStart.getTime() - 1);
        const comparisonStart = new Date(comparisonEnd.getTime() - (rangeLength * 24 * 60 * 60 * 1000));
        return {
          start: comparisonStart.toISOString().slice(0, 10),
          end: comparisonEnd.toISOString().slice(0, 10),
          label: 'previous period'
        };
      default:
        return {
          start: '',
          end: '',
          label: 'previous period'
        };
    }
  };

  // Helper function to calculate dynamic transaction velocity
  const getTransactionVelocity = () => {
    const filterType = getDateFilterType();
    
    // Get transactions in the current period - use filteredTransactions to match what's displayed
    const currentTransactions = filteredTransactions.filter(t => {
      const transactionDate = new Date(t.date);
      const startDate = new Date(filters.dateRange.start);
      const endDate = new Date(filters.dateRange.end);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
    
    if (currentTransactions.length === 0) {
      return { velocity: 0, unit: 'per day', text: 'No transactions' };
    }
    
    const startDate = new Date(filters.dateRange.start);
    const endDate = new Date(filters.dateRange.end);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    switch (filterType) {
      case 'today':
        return {
          velocity: currentTransactions.length,
          unit: 'today',
          text: `${currentTransactions.length} today`
        };
      case 'week':
        const weekVelocity = totalDays > 0 ? currentTransactions.length / totalDays : 0;
        return {
          velocity: weekVelocity,
          unit: 'per day',
          text: `${weekVelocity.toFixed(1)} per day`
        };
      case 'month':
        const monthVelocity = totalDays > 0 ? currentTransactions.length / totalDays : 0;
        return {
          velocity: monthVelocity,
          unit: 'per day',
          text: `${monthVelocity.toFixed(1)} per day`
        };
      case 'year':
        const yearMonths = Math.ceil(totalDays / 30);
        const yearVelocity = yearMonths > 0 ? currentTransactions.length / yearMonths : 0;
        return {
          velocity: yearVelocity,
          unit: 'per month',
          text: `${yearVelocity.toFixed(1)} per month`
        };
      case 'custom':
        // For custom ranges, determine appropriate unit
        if (totalDays <= 7) {
          const dayVelocity = totalDays > 0 ? currentTransactions.length / totalDays : 0;
          return {
            velocity: dayVelocity,
            unit: 'per day',
            text: `${dayVelocity.toFixed(1)} per day`
          };
        } else if (totalDays <= 90) {
          const weekVelocity = totalDays > 0 ? currentTransactions.length / (totalDays / 7) : 0;
          return {
            velocity: weekVelocity,
            unit: 'per week',
            text: `${weekVelocity.toFixed(1)} per week`
          };
        } else {
          const monthVelocity = totalDays > 0 ? currentTransactions.length / (totalDays / 30) : 0;
          return {
            velocity: monthVelocity,
            unit: 'per month',
            text: `${monthVelocity.toFixed(1)} per month`
          };
        }
      default:
        const defaultVelocity = totalDays > 0 ? currentTransactions.length / totalDays : 0;
        return {
          velocity: defaultVelocity,
          unit: 'per day',
          text: `${defaultVelocity.toFixed(1)} per day`
        };
    }
  };

  // Check if categories exist and redirect to settings if needed
  const checkCategoriesAndRedirect = () => {
    const hasIncomeCategories = categories.filter(cat => cat.type === 'income').length > 0;
    const hasExpenseCategories = purchaseCategories.length > 0; // Use purchaseCategories since transaction form now uses them
    
    
    if (!hasIncomeCategories || !hasExpenseCategories) {
      toast.error('Please add categories first before creating transactions', {
        description: 'You need both income and expense categories to create transactions.',
        action: {
          label: 'Go to Settings',
          onClick: () => navigate('/settings?tab=categories')
        }
      });
      return false;
    }
    return true;
  };

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    type: 'all' as 'all' | 'income' | 'expense',
    account: 'all',
    currency: '', // <-- add currency filter
    dateRange: getThisMonthDateRange(),
    showModifiedOnly: false, // New: Show only recently modified transactions
    recentlyModifiedDays: 7, // New: Number of days for "recently modified"
    showRecurringOnly: false // New: Show only recurring transactions
  });
  
  // Add sorting state - default to most recent first
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>({ key: 'date', direction: 'desc' });
  
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showDateMenu, setShowDateMenu] = useState(false);
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false); // <-- add state for currency menu
  const [showModifiedMenu, setShowModifiedMenu] = useState(false); // New: state for recently modified menu
  const currencyMenuRef = useRef<HTMLDivElement>(null); // <-- add ref for click outside
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const modifiedMenuRef = useRef<HTMLDivElement>(null); // New: ref for recently modified menu
  const lastLoggedValuesRef = useRef<string>(''); // Track last logged values to reduce log frequency
  
  // State for delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [showLendBorrowInfo, setShowLendBorrowInfo] = useState(false);
  const [expandedRecurringIds, setExpandedRecurringIds] = useState<Set<string>>(new Set());

  // Column visibility state with localStorage persistence
  // Note: date, description, amount, and actions are always visible
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('transactionTableColumnVisibility');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure only toggleable columns are in state
        return {
          modified: parsed.modified !== undefined ? parsed.modified : true,
          category: parsed.category !== undefined ? parsed.category : false,
          account: parsed.account !== undefined ? parsed.account : true,
          type: parsed.type !== undefined ? parsed.type : true
        };
      } catch {
        // If parsing fails, use defaults
      }
    }
    // Default: all toggleable columns visible except Category (hidden by default)
    return {
      modified: true,
      category: false,
      account: true,
      type: true
    };
  });

  // Save column visibility to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('transactionTableColumnVisibility', JSON.stringify(columnVisibility));
  }, [columnVisibility]);

  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const columnSettingsRef = useRef<HTMLDivElement>(null);

  // Add export menu state and ref
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  
  // Android detection
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isCapacitor = !!(window as any).Capacitor;
  const isAndroidApp = isAndroid && isCapacitor;
  
  // Debug Android detection
  console.log('TransactionList Android Detection:', {
    userAgent: navigator.userAgent,
    isAndroid,
    isCapacitor,
    isAndroidApp
  });
  
  // Android download modal state
  const [showAndroidDownloadModal, setShowAndroidDownloadModal] = useState(false);
  
  // Debug modal state changes
  useEffect(() => {
    console.log('TransactionList Modal State Changed:', showAndroidDownloadModal);
  }, [showAndroidDownloadModal]);

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
  const sortData = (data: Transaction[]) => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.key) {
        case 'date':
          // Sort by created_at, but if updated_at is more recent, use that for priority
          const aLatestTime = a.updated_at ? Math.max(new Date(a.created_at).getTime(), new Date(a.updated_at).getTime()) : new Date(a.created_at).getTime();
          const bLatestTime = b.updated_at ? Math.max(new Date(b.created_at).getTime(), new Date(b.updated_at).getTime()) : new Date(b.created_at).getTime();
          aValue = aLatestTime;
          bValue = bLatestTime;
          break;
        case 'last_modified':
          aValue = new Date(a.updated_at || a.created_at).getTime();
          bValue = new Date(b.updated_at || b.created_at).getTime();
          break;
        case 'description':
          aValue = a.description.toLowerCase();
          bValue = b.description.toLowerCase();
          break;
        case 'category':
          aValue = (a.category || '').toLowerCase();
          bValue = (b.category || '').toLowerCase();
          break;
        case 'account':
          const accountA = accounts.find(acc => acc.id === a.account_id)?.name || '';
          const accountB = accounts.find(acc => acc.id === b.account_id)?.name || '';
          aValue = accountA.toLowerCase();
          bValue = accountB.toLowerCase();
          break;
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'type':
          aValue = a.type.toLowerCase();
          bValue = b.type.toLowerCase();
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


  // Hide export menu on click outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportMenu]);

  // Hide column settings menu on click outside (only when menu is open)
  React.useEffect(() => {
    if (!showColumnSettings) return;
    
    function handleClickOutside(event: MouseEvent) {
      // Only close if clicking outside the menu container
      const target = event.target as Node;
      if (columnSettingsRef.current && !columnSettingsRef.current.contains(target)) {
        setShowColumnSettings(false);
      }
    }
    
    // Add a delay to prevent immediate closing when opening the menu
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside, true);
    }, 150);
    
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, [showColumnSettings]);

  // Add click outside handler for account menu
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setShowAccountMenu(false);
      }
    }
    if (showAccountMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAccountMenu]);

  // Mobile filter modal handlers
  useEffect(() => {
    if (showMobileFilterMenu) {
      setTempFilters(filters);
    }
  }, [showMobileFilterMenu, filters]);

  const handleCloseModal = () => {
    setShowMobileFilterMenu(false);
    setTempFilters(filters); // Reset tempFilters to current filters when closing without applying
  };

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showMobileFilterMenu) {
        handleCloseModal();
      }
    };
    if (showMobileFilterMenu) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showMobileFilterMenu]);

  // Export handlers with loading states
  const handleExportCSV = async () => {
    await exportToCSV();
    setShowExportMenu(false);
  };

  const handleExportPDF = async () => {
    await exportToPDF();
    setShowExportMenu(false);
  };

  const handleExportHTML = async () => {
    await exportToHTML();
    setShowExportMenu(false);
  };

  // Get all unique currencies from accounts
  const accountCurrencies = Array.from(new Set(accounts.map(a => a.currency)));
  // Only show selected_currencies if available, else all from accounts
  const currencyOptions = React.useMemo(() => {
    if (profile?.selected_currencies && profile.selected_currencies.length > 0) {
      return accountCurrencies.filter(c => profile.selected_currencies?.includes?.(c));
    }
    return accountCurrencies;
  }, [profile?.selected_currencies, accountCurrencies]);



  // Always use a valid currency code for formatting
  const selectedCurrency = filters.currency || accountCurrencies[0] || 'USD';

  // Lifetime totals strictly by selected currency (unaffected by filters)
  const lifetimeTotalsByCurrency = useMemo(() => {
    const currencyFiltered = (activeTransactions || []).filter(t => {
      const account = accounts.find(a => a.id === t.account_id);
      return account?.currency === selectedCurrency;
    });
    const totals = currencyFiltered.reduce(
      (acc, t) => {
        if (t.type === 'income') acc.income += t.amount || 0;
        if (t.type === 'expense') acc.expense += t.amount || 0;
        acc.count += 1;
        return acc;
      },
      { income: 0, expense: 0, count: 0 }
    );
    return totals;
  }, [activeTransactions, selectedCurrency, accounts]);

  // Set default currency filter to user's local_currency if available and valid
  React.useEffect(() => {
    if (!filters.currency && profile?.local_currency && accountCurrencies.includes(profile.local_currency)) {
      setFilters(f => ({ ...f, currency: profile.local_currency || '' }));
    }
  }, [profile, accountCurrencies, filters.currency]);

  // Click outside handler for currency menu
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (currencyMenuRef.current && !currencyMenuRef.current.contains(event.target as Node)) {
        setShowCurrencyMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Click outside handler for modified menu
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modifiedMenuRef.current && !modifiedMenuRef.current.contains(event.target as Node)) {
        setShowModifiedMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getAccountName = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    return account?.name || 'Unknown Account';
  };

  // Helper function to get frequency label
  const getFrequencyLabel = (frequency?: string) => {
    if (!frequency) return 'N/A';
    const labels: { [key: string]: string } = {
      daily: 'Daily',
      weekly: 'Weekly',
      biweekly: 'Bi-weekly',
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      yearly: 'Yearly',
      annually: 'Annually',
    };
    return labels[frequency.toLowerCase()] || frequency;
  };

  // Toggle expand/collapse for recurring transaction details
  const toggleRecurringExpand = (transactionId: string) => {
    setExpandedRecurringIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(transactionId)) {
        newSet.delete(transactionId);
      } else {
        newSet.add(transactionId);
      }
      return newSet;
    });
  };

  // Helper function to render expanded recurring details
  const renderExpandedRecurringDetails = (transaction: Transaction) => {
    if (!expandedRecurringIds.has(transaction.id) || (!transaction.is_recurring && !transaction.parent_recurring_id)) {
      return null;
    }

    const isParentRecurring = transaction.is_recurring;
    const parentTransaction = isParentRecurring ? transaction : activeTransactions.find(t => t.id === transaction.parent_recurring_id);
    const displayTransaction = parentTransaction || transaction;
    const childInstances = isParentRecurring ? activeTransactions.filter(t => t.parent_recurring_id === transaction.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [];

    if (!displayTransaction) return null;

    return {
      isParentRecurring,
      parentTransaction,
      displayTransaction,
      childInstances
    };
  };

  const handleEdit = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsFormOpen(true);
  };

  const handleDuplicate = (transaction: Transaction) => {
    setTransactionToDuplicate(transaction);
    setIsFormOpen(true);
  };

  // Handle pause/resume for recurring transactions
  const handleTogglePause = async (transaction: Transaction) => {
    if (!transaction.is_recurring) return;
    
    const wrappedAction = wrapAsync(async () => {
      setLoadingMessage(transaction.is_paused ? 'Resuming recurring transaction...' : 'Pausing recurring transaction...');
      await updateTransaction(transaction.id, {
        is_paused: !transaction.is_paused
      } as any);
      toast.success(`Recurring transaction ${transaction.is_paused ? 'resumed' : 'paused'} successfully`);
      await fetchTransactions();
    });
    await wrappedAction();
  };

  const handleDelete = async (transactionId: string) => {
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) return;
    
    // Wrap the delete process with loading state
    const wrappedDelete = wrapAsync(async () => {
      setLoadingMessage('Deleting transaction...');
    try {
      await deleteTransaction(transaction.id);
      toast.success('Transaction deleted successfully');
    } catch (error) {
      toast.error('Failed to delete transaction');
    }
    });
    
    // Execute the wrapped delete function
    await wrappedDelete();
  };



  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedTransaction(undefined);
    setTransactionToDuplicate(undefined);
  };

  const handleCopyTransactionId = (transactionId: string) => {
    navigator.clipboard.writeText(transactionId);
    toast.success('Transaction ID copied to clipboard');
  };

  // Enhanced search suggestions
  const generateSearchSuggestions = useCallback((searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const suggestions = searchService.getSuggestions(
      transactions,
      searchQuery,
      ['description', 'transaction_id', 'category'],
      5
    );

    setSearchSuggestions(suggestions);
    setShowSuggestions(suggestions.length > 0);
  }, [transactions]);

  // Debounced search with loading state
  useEffect(() => {
    if (filters.search.trim()) {
      setIsSearching(true);
      const timeoutId = setTimeout(() => {
        setIsSearching(false);
        generateSearchSuggestions(filters.search);
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setIsSearching(false);
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  }, [filters.search, generateSearchSuggestions]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSuggestions) {
        const target = event.target as Element;
        if (!target.closest('.transaction-search-suggestions')) {
          setShowSuggestions(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSuggestions]);

  // Enhanced filtering with fuzzy search
  const filteredTransactions = useMemo(() => {
    // If a record is selected via deep link, prioritize showing only that record
    if (hasSelection && isFromSearch && selectedRecord) {
      return [selectedRecord];
    }

    const today = new Date();
    
    // First filter out transfers and apply basic filters
    let filtered = transactions
      .filter(t => !t.tags?.some(tag => tag.includes('transfer') || tag.includes('dps_transfer') || tag === 'dps_deletion'))
      .filter(t => {
        if (filters.type !== 'all' && t.type !== filters.type) return false;
        if (filters.account !== 'all' && t.account_id !== filters.account) return false;
        if (filters.currency && accounts.find(a => a.id === t.account_id)?.currency !== filters.currency) return false;
        if (filters.showRecurringOnly && !t.is_recurring) return false;
        
        // New: Filter by recently modified transactions
        if (filters.showModifiedOnly) {
          if (!t.updated_at || t.updated_at === t.created_at) return false; // Only show transactions that have been modified
          const modifiedDate = new Date(t.updated_at);
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - filters.recentlyModifiedDays);
          if (modifiedDate < cutoffDate) return false;
        }
        
        if (filters.dateRange.start && filters.dateRange.end) {
          const txDate = new Date(t.date);
          const startDate = new Date(filters.dateRange.start);
          const endDate = new Date(filters.dateRange.end);
          
          // For "this month" filter, use the same logic as Dashboard
          if (filters.dateRange.start === new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10) &&
              filters.dateRange.end === new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10)) {
            // This is "this month" filter - use same timezone logic as Dashboard
            const localStartDate = new Date(today.getFullYear(), today.getMonth(), 1);
            const localEndDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            
            // Convert to UTC with timezone offset (same as Dashboard)
            const utcStartDate = new Date(localStartDate.getTime() - (localStartDate.getTimezoneOffset() * 60000));
            const utcEndDate = new Date(localEndDate.getTime() - (localEndDate.getTimezoneOffset() * 60000) + (24 * 60 * 60 * 1000) - 1);
            
            if (txDate < utcStartDate || txDate > utcEndDate) return false;
          } else {
            // For other date ranges, use the original logic
            if (txDate < startDate || txDate > endDate) return false;
          }
        }
        return true;
      });

    // Apply fuzzy search if search term exists
    if (filters.search && filters.search.trim()) {
      const searchResults = searchService.search(
        filtered,
        filters.search,
        'transactions',
        SEARCH_CONFIGS.transactions,
        { limit: 1000 }
      );
      
      // Extract items from search results
      filtered = searchResults.map(result => result.item);
    }
    
    // Apply sorting
    return sortData(filtered);
  }, [transactions, filters, sortConfig, accounts, hasSelection, isFromSearch, selectedRecord]);

  // Export functionality using shared hook
  const { isExporting, exportFormat, exportToCSV, exportToPDF, exportToHTML } = useExport({
    transactions: filteredTransactions,
    accounts,
    filters,
    sortConfig
  });

  // Summary card values should be based on filteredTransactions only (excluding lend/borrow transactions)
  const allLendBorrowInFiltered = filteredTransactions.filter(t => isLendBorrowTransaction(t));
  const lendBorrowIncomeInFiltered = filteredTransactions.filter(t => t.type === 'income' && isLendBorrowTransaction(t));
  const lendBorrowExpenseInFiltered = filteredTransactions.filter(t => t.type === 'expense' && isLendBorrowTransaction(t));
  
  const totalIncome = filteredTransactions.filter(t => t.type === 'income' && !isLendBorrowTransaction(t)).reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filteredTransactions.filter(t => t.type === 'expense' && !isLendBorrowTransaction(t)).reduce((sum, t) => sum + t.amount, 0);
  const transactionCount = filteredTransactions.length;
  
  // Console log for verification - always log when transactions are present
  if (transactions.length > 0) {
    const excludedIncomeAmount = lendBorrowIncomeInFiltered.reduce((sum, t) => sum + t.amount, 0);
    const excludedExpenseAmount = lendBorrowExpenseInFiltered.reduce((sum, t) => sum + t.amount, 0);
    
    // Create a unique key from the values to detect changes
    const logKey = `${transactionCount}-${totalIncome.toFixed(2)}-${totalExpense.toFixed(2)}-${allLendBorrowInFiltered.length}`;
    
    // Only log if values have changed
    if (lastLoggedValuesRef.current !== logKey) {
      lastLoggedValuesRef.current = logKey;
      
      // Log summary first
      console.group('📋 Transaction List - Lend/Borrow Exclusion');
      console.log('Summary:', {
        totalTransactions: transactions.length,
        filteredTransactions: transactionCount,
        excludedLendBorrow: allLendBorrowInFiltered.length
      });
      
      // Log excluded transactions
      if (lendBorrowIncomeInFiltered.length > 0) {
        console.log(`Excluded from Income (${lendBorrowIncomeInFiltered.length} transactions, Total: ${excludedIncomeAmount}):`, 
          lendBorrowIncomeInFiltered.map(t => `${t.description} - ${t.amount}`)
        );
      } else {
        console.log('Excluded from Income: None');
      }
      
      if (lendBorrowExpenseInFiltered.length > 0) {
        console.log(`Excluded from Expense (${lendBorrowExpenseInFiltered.length} transactions, Total: ${excludedExpenseAmount}):`, 
          lendBorrowExpenseInFiltered.map(t => `${t.description} - ${t.amount}`)
        );
      } else {
        console.log('Excluded from Expense: None');
      }
      
      // Log final totals
      console.log('Final Calculated Totals:', {
        income: totalIncome,
        expense: totalExpense,
        net: totalIncome - totalExpense
      });
      console.groupEnd();
    }
  }






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
        start = first.toISOString().slice(0, 10);
        end = last.toISOString().slice(0, 10);
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

  const [showPresetDropdown, setShowPresetDropdown] = useState(false);
  const presetDropdownRef = React.useRef<HTMLDivElement>(null);
  const dateMenuButtonRef = useRef<HTMLDivElement>(null);
  const [presetMenuPos, setPresetMenuPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });

  // Click outside handler for preset dropdown
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (presetDropdownRef.current && !presetDropdownRef.current.contains(event.target as Node)) {
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

  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customStart, setCustomStart] = useState(filters.dateRange.start ? filters.dateRange.start.slice(0, 10) : '');
  const [customEnd, setCustomEnd] = useState(filters.dateRange.end ? filters.dateRange.end.slice(0, 10) : '');

  return (
    <div className="space-y-6">
      {/* Unified Filters and Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 pb-[13px] lg:pb-0">
        {/* Filters Header */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {/* Enhanced Search Filter with Suggestions */}
            <div>
              <div className="relative">
                <Search className={`absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 ${isSearching ? 'animate-pulse text-blue-500' : filters.search ? 'text-blue-500' : 'text-gray-400'}`} />
                <input
                  type="text"
                  value={filters.search}
                  onChange={e => setFilters({ ...filters, search: e.target.value })}
                  onFocus={() => {
                    if (filters.search && searchSuggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  className={`w-full pl-8 pr-2 py-1.5 text-[13px] h-8 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 transition-colors ${
                    filters.search 
                      ? 'border-blue-300 dark:border-blue-600' 
                      : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                  }`}
                  style={filters.search ? { background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' } : {}}
                  placeholder="Search transactions…"
                />
                
                {/* Search Suggestions Dropdown */}
                {false && showSuggestions && searchSuggestions.length > 0 && (
                  <div className="transaction-search-suggestions absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                    {searchSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setFilters({ ...filters, search: suggestion });
                          setShowSuggestions(false);
                          
                          // Track suggestion usage
                          searchService.trackSuggestionUsage(filters.search, suggestion);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                      >
                        <div className="flex items-center gap-2">
                          <Search className="w-3 h-3 text-gray-400" />
                          <span className="truncate">{suggestion}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Selection Filter */}
            {hasSelection && selectedRecord && (
              <SelectionFilter
                label="Selected"
                value={selectedRecord.description || 'Transaction'}
                onClear={clearSelection}
              />
            )}

            {/* Mobile Filter Button */}
            <div className="md:hidden">
              <button
                onClick={() => setShowMobileFilterMenu(v => !v)}
                className={`px-2 py-1.5 text-[13px] h-8 w-8 rounded-md transition-colors flex items-center justify-center ${
                  (filters.type !== 'all' || filters.account !== 'all' || filters.currency || filters.dateRange.start || filters.dateRange.end || filters.showModifiedOnly || filters.showRecurringOnly)
                    ? 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                style={(filters.type !== 'all' || filters.account !== 'all' || filters.currency || filters.dateRange.start || filters.dateRange.end || filters.showModifiedOnly || filters.showRecurringOnly) ? { background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' } : {}}
                title="Filters"
              >
                <Filter className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Download Button */}
            <div className="md:hidden">
              <div className="relative" ref={exportMenuRef}>
                <button
                  onClick={() => setShowExportMenu(v => !v)}
                  disabled={isExporting}
                  className={`bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 px-2 py-1.5 h-8 w-8 rounded-md transition-colors flex items-center justify-center ${
                    isExporting 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  aria-label={isExporting ? 'Export in progress' : 'Export transactions'}
                  title={isExporting ? 'Export in progress...' : 'Export transactions'}
                >
                  {isExporting ? (
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                </button>
                {showExportMenu && !isExporting && (
                  <div 
                    className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50"
                    role="menu"
                    aria-label="Export options"
                  >
                    <button
                      onClick={handleExportCSV}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                      role="menuitem"
                      aria-label="Export as CSV"
                    >
                      CSV
                    </button>
                    <button
                      onClick={handleExportPDF}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                      role="menuitem"
                      aria-label="Export as PDF"
                    >
                      PDF
                    </button>
                    <button
                      onClick={handleExportHTML}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                      role="menuitem"
                      aria-label="Export as HTML"
                    >
                      HTML
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Add Transaction Button */}
            <div className="md:hidden">
              <button
                onClick={() => {
                  
                  if (checkCategoriesAndRedirect()) {
                    setSelectedTransaction(undefined);
                    setIsFormOpen(true);
                  } else {
                  }
                }}
                className="bg-gradient-primary text-white px-2 py-1.5 rounded-md hover:bg-gradient-primary-hover transition-colors flex items-center justify-center text-[13px] h-8 w-8"
                title="Add Transaction"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Currency Filter */}
            <div className="hidden md:block">
              <div className="relative" ref={currencyMenuRef}>
                <button
                  onClick={() => {
                    setShowCurrencyMenu(v => !v);
                    setShowTypeMenu(false);
                    setShowAccountMenu(false);
                    setShowDateMenu(false);
                  }}
                  className={`px-3 py-1.5 pr-2 text-[13px] h-8 rounded-md transition-colors flex items-center space-x-1.5 ${
                    filters.currency 
                      ? 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  style={filters.currency ? { background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' } : {}}
                >
                  <span>{filters.currency === '' ? (currencyOptions[0] || '') : filters.currency}</span>
                  <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showCurrencyMenu && (
                  <div className="absolute left-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                    {currencyOptions.map(currency => (
                      <button
                        key={currency}
                        onClick={() => { setFilters({ ...filters, currency }); setShowCurrencyMenu(false); }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${filters.currency === currency ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : ''}`}
                      >
                        {currency}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="hidden md:block">
            <div className="relative">
              <button
                  onClick={() => {
                    setShowTypeMenu(v => !v);
                    setShowAccountMenu(false);
                    setShowDateMenu(false);
                    setShowCurrencyMenu(false);
                  }}
                  className={`px-3 py-1.5 pr-2 text-[13px] h-8 rounded-md transition-colors flex items-center space-x-1.5 ${
                    filters.type !== 'all' 
                      ? 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  style={filters.type !== 'all' ? { background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' } : {}}
              >
                <span>{filters.type === 'all' ? 'All Types' : filters.type.charAt(0).toUpperCase() + filters.type.slice(1)}</span>
                <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </button>
              {showTypeMenu && (
                  <div className="absolute left-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                    {(['all', 'income', 'expense'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => { setFilters({ ...filters, type: type as 'all' | 'income' | 'expense' }); setShowTypeMenu(false); }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${filters.type === type ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : ''}`}
                    >
                      {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </div>
            </div>

            {/* Recurring Filter Toggle */}
            {isPremiumPlan && (
              <div className="hidden md:block">
                <button
                  type="button"
                  onClick={() => {
                    setFilters({ ...filters, showRecurringOnly: !filters.showRecurringOnly });
                    setShowTypeMenu(false);
                    setShowAccountMenu(false);
                    setShowDateMenu(false);
                    setShowCurrencyMenu(false);
                  }}
                  className={`px-3 py-1.5 text-[13px] h-8 rounded-md transition-colors flex items-center space-x-1.5 ${
                    filters.showRecurringOnly
                      ? 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/40' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  style={filters.showRecurringOnly ? { background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' } : {}}
                  title={filters.showRecurringOnly ? 'Show all transactions' : 'Show only recurring transactions'}
                >
                  <Repeat className={`w-3.5 h-3.5 ${filters.showRecurringOnly ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} />
                  <span>Recurring</span>
                </button>
              </div>
            )}

            <div className="hidden md:block">
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowAccountMenu(v => !v);
                  setShowTypeMenu(false);
                  setShowDateMenu(false);
                  setShowCurrencyMenu(false);
                }}
                className={`px-3 py-1.5 pr-2 text-[13px] h-8 rounded-md transition-colors flex items-center space-x-1.5 w-full ${
                  filters.account !== 'all' 
                    ? 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                style={filters.account !== 'all' ? { background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' } : {}}
              >
                <span>{filters.account === 'all' ? 'All Accounts' : getAccountName(filters.account)}</span>
                <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </button>
              {showAccountMenu && (
                <div className="absolute left-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto min-w-[180px] py-2">
                  <button
                    onClick={() => { setFilters({ ...filters, account: 'all' }); setShowAccountMenu(false); }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${filters.account === 'all' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : ''}`}
                  >
                    All Accounts
                  </button>
                  {accounts.map(account => (
                    <button
                      key={account.id}
                      onClick={() => { setFilters({ ...filters, account: account.id }); setShowAccountMenu(false); }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${filters.account === account.id ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : ''}`}
                    >
                      {account.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            </div>
            {/* Date Preset Dropdown styled as filter button */}
            <div className="hidden md:block relative" ref={dateMenuButtonRef}>
              <button
                className={`px-3 py-1.5 pr-2 text-[13px] h-8 rounded-md transition-colors flex items-center space-x-1.5 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 ${showPresetDropdown ? 'ring-2 ring-blue-500' : ''}`}
                style={{ background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' }}
                onClick={() => {
                  setShowPresetDropdown(v => !v);
                  setShowTypeMenu(false);
                  setShowAccountMenu(false);
                  setShowCurrencyMenu(false);
                }}
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
            </div>
            
            {/* Recently Modified Filter */}
            <div className="hidden md:block relative">
              <button
                className={`px-3 py-1.5 pr-2 text-[13px] h-8 rounded-md transition-colors flex items-center space-x-1.5 ${
                  filters.showModifiedOnly 
                    ? 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
                } ${showModifiedMenu ? 'ring-2 ring-blue-500' : ''}`}
                style={filters.showModifiedOnly ? { background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' } : {}}
                onClick={() => {
                  setShowModifiedMenu(v => !v);
                  setShowTypeMenu(false);
                  setShowAccountMenu(false);
                  setShowCurrencyMenu(false);
                  setShowPresetDropdown(false);
                }}
                type="button"
              >
                <span>{filters.showModifiedOnly ? `Modified (${filters.recentlyModifiedDays}d)` : 'All Transactions'}</span>
                <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showModifiedMenu && (
                <div ref={modifiedMenuRef} className="absolute left-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 min-w-[180px]">
                  <button 
                    className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100" 
                    onClick={() => { 
                      setFilters({ ...filters, showModifiedOnly: false }); 
                      setShowModifiedMenu(false); 
                    }}
                  >
                    All Transactions
                  </button>
                  <button 
                    className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100" 
                    onClick={() => { 
                      setFilters({ ...filters, showModifiedOnly: true, recentlyModifiedDays: 1 }); 
                      setShowModifiedMenu(false); 
                    }}
                  >
                    Modified Today
                  </button>
                  <button 
                    className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100" 
                    onClick={() => { 
                      setFilters({ ...filters, showModifiedOnly: true, recentlyModifiedDays: 3 }); 
                      setShowModifiedMenu(false); 
                    }}
                  >
                    Modified (3 days)
                  </button>
                  <button 
                    className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100" 
                    onClick={() => { 
                      setFilters({ ...filters, showModifiedOnly: true, recentlyModifiedDays: 7 }); 
                      setShowModifiedMenu(false); 
                    }}
                  >
                    Modified (7 days)
                  </button>
                  <button 
                    className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100" 
                    onClick={() => { 
                      setFilters({ ...filters, showModifiedOnly: true, recentlyModifiedDays: 30 }); 
                      setShowModifiedMenu(false); 
                    }}
                  >
                    Modified (30 days)
                  </button>
                </div>
              )}
            </div>
            
            {/* Custom Range Modal */}
            {showCustomModal && (
              <>
                <style>{`
                  .react-datepicker, .react-datepicker * {
                    font-family: 'Manrope', sans-serif !important;
                  }
                `}</style>
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                  <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setShowCustomModal(false)} />
                  <div className="relative bg-white dark:bg-gray-900 rounded-lg p-6 max-w-xs w-full mx-4 shadow-xl flex flex-col items-center border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Select Custom Date Range</h3>
                    <div className="flex flex-col gap-3 w-full">
                      <div className="flex flex-col">
                        <label className="text-xs text-gray-600 dark:text-gray-300 mb-1">Start Date</label>
                        <DatePicker
                          selected={customStart ? new Date(customStart) : null}
                          onChange={date => setCustomStart(date ? date.toISOString().slice(0, 10) : '')}
                          selectsStart
                          startDate={customStart ? new Date(customStart) : null}
                          endDate={customEnd ? new Date(customEnd) : null}
                          maxDate={customEnd ? new Date(customEnd) : undefined}
                          dateFormat="MM/dd/yyyy"
                          className="bg-gray-100 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 px-3 py-2 rounded w-full font-sans border border-gray-200 dark:border-gray-700"
                          placeholderText="Select start date"
                          isClearable
                          showPopperArrow={false}
                          popperPlacement="bottom"
                          autoComplete="off"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-xs text-gray-600 dark:text-gray-300 mb-1">End Date</label>
                        <DatePicker
                          selected={customEnd ? new Date(customEnd) : null}
                          onChange={date => setCustomEnd(date ? date.toISOString().slice(0, 10) : '')}
                          selectsEnd
                          startDate={customStart ? new Date(customStart) : null}
                          endDate={customEnd ? new Date(customEnd) : null}
                          minDate={customStart ? new Date(customStart) : undefined}
                          dateFormat="MM/dd/yyyy"
                          className="bg-gray-100 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 px-3 py-2 rounded w-full font-sans border border-gray-200 dark:border-gray-700"
                          placeholderText="Select end date"
                          isClearable
                          showPopperArrow={false}
                          popperPlacement="bottom"
                          autoComplete="off"
                        />
                      </div>
                      {customStart && customEnd && new Date(customEnd) < new Date(customStart) && (
                        <div className="text-xs text-red-500 mt-1">End date cannot be before start date.</div>
                      )}
                    </div>
                    <div className="flex gap-2 mt-6 w-full">
                      <button
                        className="flex-1 py-2 rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700"
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
            {(filters.search || filters.type !== 'all' || filters.account !== 'all' || (filters.currency && filters.currency !== (profile?.local_currency || 'USD')) || getDateRangeLabel() !== 'This Month' || filters.showModifiedOnly || filters.showRecurringOnly) && (
              <button
                onClick={() => setFilters({ search: '', type: 'all', account: 'all', currency: '', dateRange: getThisMonthDateRange(), showModifiedOnly: false, recentlyModifiedDays: 7, showRecurringOnly: false })}
                className="text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center"
                title="Clear all filters"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
            <div className="flex-grow" />
            {/* Action Buttons in filter row */}
            <div className="flex items-center gap-2">
              <div 
                className="hidden lg:block relative" 
                ref={columnSettingsRef}
              >
                <button
                  onClick={() => setShowColumnSettings(!showColumnSettings)}
                  className={`bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 px-3 py-1.5 h-8 rounded-md transition-colors flex items-center justify-center ${
                    showColumnSettings 
                      ? 'bg-gray-200 dark:bg-gray-700' 
                      : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                  } relative`}
                  aria-label="Column settings"
                  title="Column settings"
                >
                  <Settings className="w-3.5 h-3.5" />
                  {Object.values(columnVisibility).filter(v => v).length < Object.keys(columnVisibility).length && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></span>
                  )}
                </button>
                {showColumnSettings && (
                  <>
                    {/* Invisible bridge to prevent gap issues */}
                    <div className="absolute right-0 top-full w-52 sm:w-56 md:w-60 h-1 pointer-events-none" />
                    <div 
                      className="absolute right-0 top-full mt-0 w-52 sm:w-56 md:w-60 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 flex flex-col max-h-[calc(100vh-200px)]"
                      role="menu"
                      aria-label="Column visibility options"
                      style={{
                        maxWidth: 'min(calc(100vw - 2rem), 240px)'
                      }}
                      onMouseEnter={(e) => {
                        e.stopPropagation();
                      }}
                      onMouseLeave={(e) => {
                        // Don't close on mouse leave - only close on click outside
                        e.stopPropagation();
                      }}
                    >
                    <div className="px-3 py-2.5 text-xs font-semibold text-gradient-primary uppercase border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex-shrink-0">
                      Show Columns
                    </div>
                    <div className="py-1 overflow-y-auto flex-1 min-h-0">
                      {Object.entries(columnVisibility).map(([key, visible]) => {
                        const label = key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ')
                        return (
                          <label
                            key={key}
                            className={`flex items-center px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm cursor-pointer transition-colors duration-150 touch-manipulation ${
                              visible 
                                ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30' 
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                            role="menuitemcheckbox"
                            aria-checked={visible}
                          >
                            <div className="relative mr-2 sm:mr-3 flex-shrink-0">
                              <input
                                type="checkbox"
                                checked={visible}
                                onChange={(e) => {
                                  setColumnVisibility(prev => ({
                                    ...prev,
                                    [key]: e.target.checked
                                  }))
                                }}
                                className="sr-only"
                              />
                              <div className={`w-4 h-4 rounded border-2 transition-all duration-150 flex items-center justify-center ${
                                visible 
                                  ? 'border-transparent bg-gradient-primary' 
                                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                              }`}>
                                {visible && (
                                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                )}
                              </div>
                            </div>
                            <span className={`text-xs sm:text-sm flex-1 min-w-0 ${visible ? 'text-gray-900 dark:text-gray-100 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>{label}</span>
                          </label>
                        )
                      })}
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700 px-2 py-2 flex gap-1 flex-shrink-0 bg-white dark:bg-gray-800">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const allVisible = Object.fromEntries(
                            Object.keys(columnVisibility).map(key => [key, true])
                          )
                          setColumnVisibility(allVisible)
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="flex-1 px-2 sm:px-3 py-1.5 text-xs font-medium text-gradient-primary hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-all duration-150 touch-manipulation"
                      >
                        Show All
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const allHidden = Object.fromEntries(
                            Object.keys(columnVisibility).map(key => [key, false])
                          )
                          setColumnVisibility(allHidden)
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="flex-1 px-2 sm:px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors touch-manipulation"
                      >
                        Hide All
                      </button>
                    </div>
                  </div>
                  </>
                )}
              </div>
              <div className="hidden md:block relative" ref={exportMenuRef}>
                <button
                  onClick={() => {
                    if (isExporting) return; // Prevent execution when exporting
                    
                    console.log('TransactionList Export Button Clicked:', {
                      isAndroidApp,
                      showAndroidDownloadModal
                    });
                    if (isAndroidApp) {
                      console.log('Setting Android modal to true');
                      setShowAndroidDownloadModal(true);
                    } else {
                      setShowExportMenu(v => !v);
                    }
                  }}
                  disabled={isExporting}
                  className={`bg-gray-100 text-gray-700 px-3 py-1.5 h-8 rounded-md transition-colors flex items-center justify-center ${
                    isExporting 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:bg-gray-200'
                  }`}
                  aria-label={isExporting ? 'Export in progress' : 'Export transactions'}
                  title={isExporting ? 'Export in progress...' : 'Export transactions'}
                >
                  {isExporting ? (
                    <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                </button>
                {showExportMenu && !isExporting && !isAndroidApp && (
                  <div 
                    className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
                    role="menu"
                    aria-label="Export options"
                  >
                    <button
                      onClick={handleExportCSV}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                      role="menuitem"
                      aria-label="Export as CSV"
                    >
                      CSV
                    </button>
                    <button
                      onClick={handleExportPDF}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                      role="menuitem"
                      aria-label="Export as PDF"
                    >
                      PDF
                    </button>
                    <button
                      onClick={handleExportHTML}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                      role="menuitem"
                      aria-label="Export as HTML"
                    >
                      HTML
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  if (checkCategoriesAndRedirect()) {
                    setIsFormOpen(true);
                  }
                }}
                className="hidden md:flex bg-gradient-primary text-white px-3 py-1.5 h-8 rounded-md hover:bg-gradient-primary-hover transition-colors items-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed text-[13px]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Transaction</span>
              </button>
            </div>
          </div>
        </div>
        {/* Summary Cards - moved inside table container */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 p-3">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 px-2">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Income</p>
                <p className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" style={{ fontSize: '1.2rem' }}>
                  {formatCurrency(totalIncome, selectedCurrency)}
                </p>
                <p className={`${(() => {
                    const filterType = getDateFilterType();
                    const comparisonPeriod = getComparisonPeriod(filterType);
                    
                    // Calculate current period income
                    const currentIncome = transactions.filter(t => {
                      const transactionDate = new Date(t.date);
                      const startDate = new Date(filters.dateRange.start);
                      const endDate = new Date(filters.dateRange.end);
                      return t.type === 'income' && 
                             transactionDate >= startDate && 
                             transactionDate <= endDate;
                    }).reduce((sum, t) => sum + t.amount, 0);
                    
                    // Calculate comparison period income
                    const comparisonIncome = transactions.filter(t => {
                      const transactionDate = new Date(t.date);
                      const compStartDate = new Date(comparisonPeriod.start);
                      const compEndDate = new Date(comparisonPeriod.end);
                      return t.type === 'income' && 
                             transactionDate >= compStartDate && 
                             transactionDate <= compEndDate;
                    }).reduce((sum, t) => sum + t.amount, 0);
                    
                    if (comparisonIncome === 0) return 'text-gray-500 dark:text-gray-400';
                    
                    const growthRate = Math.round(((currentIncome - comparisonIncome) / comparisonIncome) * 100);
                    return growthRate > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
                  })()}`} style={{ fontSize: '11px' }}>
                  {(() => {
                    const filterType = getDateFilterType();
                    const comparisonPeriod = getComparisonPeriod(filterType);
                    
                    // Calculate current period income
                    const currentIncome = transactions.filter(t => {
                      const transactionDate = new Date(t.date);
                      const startDate = new Date(filters.dateRange.start);
                      const endDate = new Date(filters.dateRange.end);
                      return t.type === 'income' && 
                             transactionDate >= startDate && 
                             transactionDate <= endDate;
                    }).reduce((sum, t) => sum + t.amount, 0);
                    
                    // Calculate comparison period income
                    const comparisonIncome = transactions.filter(t => {
                      const transactionDate = new Date(t.date);
                      const compStartDate = new Date(comparisonPeriod.start);
                      const compEndDate = new Date(comparisonPeriod.end);
                      return t.type === 'income' && 
                             transactionDate >= compStartDate && 
                             transactionDate <= compEndDate;
                    }).reduce((sum, t) => sum + t.amount, 0);
                    
                    if (comparisonIncome === 0) return 'No previous data';
                    
                    const growthRate = Math.round(((currentIncome - comparisonIncome) / comparisonIncome) * 100);
                    
                    return `${growthRate > 0 ? 'Earning more' : 'Earning less'} (${Math.abs(growthRate)}% ${growthRate > 0 ? 'increase' : 'decrease'})`;
                  })()}
                </p>
              </div>
              <span className="text-blue-600" style={{ fontSize: '1.2rem' }}>{getCurrencySymbol(selectedCurrency)}</span>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 px-2">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Expense</p>
                <p className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" style={{ fontSize: '1.2rem' }}>
                  {formatCurrency(totalExpense, selectedCurrency)}
                </p>
                <p className={`${(() => {
                    const filterType = getDateFilterType();
                    const comparisonPeriod = getComparisonPeriod(filterType);
                    
                    // Calculate current period expense
                    const currentExpense = transactions.filter(t => {
                      const transactionDate = new Date(t.date);
                      const startDate = new Date(filters.dateRange.start);
                      const endDate = new Date(filters.dateRange.end);
                      return t.type === 'expense' && 
                             transactionDate >= startDate && 
                             transactionDate <= endDate;
                    }).reduce((sum, t) => sum + t.amount, 0);
                    
                    // Calculate comparison period expense
                    const comparisonExpense = transactions.filter(t => {
                      const transactionDate = new Date(t.date);
                      const compStartDate = new Date(comparisonPeriod.start);
                      const compEndDate = new Date(comparisonPeriod.end);
                      return t.type === 'expense' && 
                             transactionDate >= compStartDate && 
                             transactionDate <= compEndDate;
                    }).reduce((sum, t) => sum + t.amount, 0);
                    
                    if (comparisonExpense === 0) return 'text-gray-500 dark:text-gray-400';
                    
                    const changeRate = Math.round(((currentExpense - comparisonExpense) / comparisonExpense) * 100);
                    return changeRate > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400';
                  })()}`} style={{ fontSize: '11px' }}>
                  {(() => {
                    const filterType = getDateFilterType();
                    const comparisonPeriod = getComparisonPeriod(filterType);
                    
                    // Calculate current period expense
                    const currentExpense = transactions.filter(t => {
                      const transactionDate = new Date(t.date);
                      const startDate = new Date(filters.dateRange.start);
                      const endDate = new Date(filters.dateRange.end);
                      return t.type === 'expense' && 
                             transactionDate >= startDate && 
                             transactionDate <= endDate;
                    }).reduce((sum, t) => sum + t.amount, 0);
                    
                    // Calculate comparison period expense
                    const comparisonExpense = transactions.filter(t => {
                      const transactionDate = new Date(t.date);
                      const compStartDate = new Date(comparisonPeriod.start);
                      const compEndDate = new Date(comparisonPeriod.end);
                      return t.type === 'expense' && 
                             transactionDate >= compStartDate && 
                             transactionDate <= compEndDate;
                    }).reduce((sum, t) => sum + t.amount, 0);
                    
                    if (comparisonExpense === 0) return 'No previous data';
                    
                    const changeRate = Math.round(((currentExpense - comparisonExpense) / comparisonExpense) * 100);
                    
                    return `${changeRate > 0 ? 'Spending more' : 'Spending less'} (${Math.abs(changeRate)}% ${changeRate > 0 ? 'increase' : 'decrease'})`;
                  })()}
                </p>
              </div>
              <span className="text-blue-600" style={{ fontSize: '1.2rem' }}>{getCurrencySymbol(selectedCurrency)}</span>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 px-2">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Transactions</p>
                <p className="font-bold text-blue-600 dark:text-blue-400" style={{ fontSize: '1.2rem' }}>{transactionCount}</p>
                <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: '11px' }}>
                  {(() => {
                    const velocityData = getTransactionVelocity();
                    return velocityData.text;
                  })()}
                </p>
              </div>
              <span className="text-blue-600" style={{ fontSize: '1.2rem', width: '1.2rem', height: '1.2rem' }}>#</span>
            </div>
          </div>
          <FinancialHealthCard 
            transactions={filteredTransactions} 
            selectedCurrency={selectedCurrency} 
          />
          {!isPremiumPlan && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 px-2">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Monthly Limit</p>
                  <p className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" style={{ fontSize: '1.2rem' }}>
                    {(() => {
                      if (isPremiumPlan) return '∞';
                      if (usageStats && 'current_month_transactions' in usageStats) {
                        const current = (usageStats as any).current_month_transactions || 0;
                        const limit = (usageStats as any).max_transactions_per_month || 25;
                        return `${current}/${limit}`;
                      }
                      // Fallback for free users
                      const currentMonthTransactions = filteredTransactions.filter(t => {
                        const transactionDate = new Date(t.date);
                        const currentMonth = new Date();
                        return transactionDate.getMonth() === currentMonth.getMonth() && 
                               transactionDate.getFullYear() === currentMonth.getFullYear();
                      }).length;
                      return `${currentMonthTransactions}/25`;
                    })()}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: '11px' }}>
                    {isPremiumPlan ? 'Unlimited transactions' : 'Free plan limit'}
                  </p>
                </div>
                <svg className="text-blue-600" style={{ fontSize: '1.2rem', width: '1.2rem', height: '1.2rem' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2l4 -4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
            </div>
          )}
        </div>
        {/* Desktop Table View */}
        <div className="lg:block hidden overflow-x-auto lg:rounded-b-xl" style={{ borderBottomLeftRadius: '0.75rem', borderBottomRightRadius: '0.75rem' }}>
          <div className="max-h-[500px] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900 text-[14px]">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Date</span>
                      {getSortIcon('date')}
                    </div>
                  </th>
                  {columnVisibility.modified && (
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => handleSort('last_modified')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Modified</span>
                        {getSortIcon('last_modified')}
                      </div>
                    </th>
                  )}
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => handleSort('description')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Description</span>
                      {getSortIcon('description')}
                    </div>
                  </th>
                  {columnVisibility.category && (
                    <th 
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => handleSort('category')}
                    >
                      <div className="flex items-center justify-center space-x-1">
                        <span>Category</span>
                        {getSortIcon('category')}
                      </div>
                    </th>
                  )}
                  {columnVisibility.account && (
                    <th 
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => handleSort('account')}
                    >
                      <div className="flex items-center justify-center space-x-1">
                        <span>Account</span>
                        {getSortIcon('account')}
                      </div>
                    </th>
                  )}
                  <th 
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center justify-center space-x-1">
                      <span>Amount</span>
                      {getSortIcon('amount')}
                    </div>
                  </th>
                  {columnVisibility.type && (
                    <th 
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => handleSort('type')}
                    >
                      <div className="flex items-center justify-center space-x-1">
                        <span>Type</span>
                        {getSortIcon('type')}
                      </div>
                    </th>
                  )}
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={4 + Object.values(columnVisibility).filter(v => v).length} className="py-16 text-center">
                      <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                        <TrendingUp className="w-12 h-12 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No transaction records found</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                        Start tracking your income and expenses by adding your first transaction
                      </p>
                    </td>
                  </tr>
                ) : (
              filteredTransactions.map((transaction) => {
                const account = accounts.find(a => a.id === transaction.account_id);
                const currency = account?.currency || 'USD';
                const isSelected = selectedId === transaction.id;
                const isFromSearchSelection = isFromSearch && isSelected;
                
                    
                    return (
                      <React.Fragment key={transaction.id}>
                      <tr 
                        id={`transaction-${transaction.transaction_id || transaction.id}`}
                        ref={isSelected ? selectedRecordRef : null}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${
                          isSelected 
                            ? isFromSearchSelection 
                              ? 'ring-2 ring-blue-500 ring-opacity-50 bg-blue-50 dark:bg-blue-900/20' 
                              : 'ring-2 ring-blue-500 ring-opacity-50'
                            : ''
                        }`}
                      >
                        <td className="px-6 py-2 text-left">
                          <div className="text-gray-900 dark:text-white" style={{ fontSize: '14px' }}>
                            <div>{format(new Date(transaction.date), 'MMM dd, yyyy')}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {format(new Date(transaction.created_at), 'h:mm a')}
                            </div>
                          </div>
                        </td>
                        {columnVisibility.modified && (
                          <td className="px-6 py-2 text-left">
                            <div className="text-gray-900 dark:text-white" style={{ fontSize: '14px' }}>
                              {transaction.updated_at && transaction.updated_at !== transaction.created_at ? (
                                <>
                                  <div>{format(new Date(transaction.updated_at), 'MMM dd, yyyy')}</div>
                                  <div className="text-xs text-gradient-primary flex items-center gap-1">
                                    {format(new Date(transaction.updated_at), 'h:mm a')}
                                    <Edit2 
                                      className="w-3 h-3" 
                                      style={{
                                        background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text'
                                      }}
                                    />
                                  </div>
                                </>
                              ) : (
                                <div className="text-xs text-gray-400 dark:text-gray-500">Never</div>
                              )}
                            </div>
                          </td>
                        )}
                        <td className="px-6 py-2">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{formatTransactionDescription(transaction.description)}</div>
                            {transaction.transaction_id && (
                              <button
                                onClick={() => handleCopyTransactionId(transaction.transaction_id!)}
                                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors mt-1"
                              >
                                <span className="font-mono">#{formatTransactionId(transaction.transaction_id)}</span>
                                <Copy className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </td>
                        {columnVisibility.category && (
                          <td className="px-6 py-2 text-center">
                            {transaction.category ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700">
                                {transaction.category}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
                            )}
                          </td>
                        )}
                        {columnVisibility.account && (
                          <td className="px-6 py-2 text-center">
                            <span className="text-sm text-gray-900 dark:text-white">{getAccountName(transaction.account_id)}</span>
                          </td>
                        )}
                        <td className="px-6 py-2 text-center">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(transaction.amount, selectedCurrency)}</span>
                        </td>
                        {columnVisibility.type && (
                          <td className="px-6 py-2 text-center">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              {transaction.type === 'income' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300">
                                  <ArrowDownRight className="w-3 h-3" /> Income
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300">
                                  <ArrowUpRight className="w-3 h-3" /> Expense
                                </span>
                              )}
                            </div>
                          </td>
                        )}
                        <td className="px-6 py-2 text-center">
                          <div className="flex justify-center gap-2 items-center">
                             {isLendBorrowTransaction(transaction) ? (
                               <Tooltip content="Lend & Borrow transaction info" placement="top">
                                 <button
                                   onClick={() => setShowLendBorrowInfo(true)}
                                   className="text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                 >
                                   <Info className="w-4 h-4" />
                                 </button>
                               </Tooltip>
                             ) : (
                               <>
                                 {(transaction.is_recurring || transaction.parent_recurring_id) && (
                                   <Tooltip content={expandedRecurringIds.has(transaction.id) ? 'Collapse recurring details' : 'Expand recurring details'} placement="top">
                                     <button
                                       onClick={(e) => {
                                         e.stopPropagation();
                                         toggleRecurringExpand(transaction.id);
                                       }}
                                       className="text-gray-500 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors"
                                     >
                                       <Repeat className="w-4 h-4" />
                                     </button>
                                   </Tooltip>
                                 )}
                                 {transaction.is_recurring && (
                                   <Tooltip content={transaction.is_paused ? 'Resume recurring transaction' : 'Pause recurring transaction'} placement="top">
                                   <button
                                     onClick={() => handleTogglePause(transaction)}
                                     className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                   >
                                     {transaction.is_paused ? (
                                       <Play className="w-4 h-4" />
                                     ) : (
                                       <Pause className="w-4 h-4" />
                                     )}
                                   </button>
                                   </Tooltip>
                                 )}
                                 {!transaction.is_recurring && (
                                   <Tooltip content="Duplicate" placement="top">
                                     <button
                                       onClick={() => handleDuplicate(transaction)}
                                       className="text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                                     >
                                       <Files className="w-4 h-4" />
                                     </button>
                                   </Tooltip>
                                 )}
                                 <Tooltip content="Edit" placement="top">
                                   <button
                                     onClick={() => handleEdit(transaction)}
                                     className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                                   >
                                     <Edit2 className="w-4 h-4" />
                                   </button>
                                 </Tooltip>
                                 {transaction.tags?.includes('purchase') && (
                                   <Tooltip content="Linked to Purchase" placement="top">
                                     <div
                                       className="text-gray-500 dark:text-gray-400"
                                     >
                                       <Link className="w-4 h-4" />
                                     </div>
                                   </Tooltip>
                                 )}
                                 <Tooltip content="Delete" placement="top">
                                   <button
                                     onClick={() => {
                                       setTransactionToDelete(transaction);
                                       setShowDeleteModal(true);
                                     }}
                                     className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                   >
                                     <Trash2 className="w-4 h-4" />
                                   </button>
                                 </Tooltip>
                               </>
                             )}
                          </div>
                        </td>
                      </tr>
                      {/* Expanded Recurring Details Row */}
                      {(() => {
                        const details = renderExpandedRecurringDetails(transaction);
                        if (!details) return null;

                        const { isParentRecurring, parentTransaction, displayTransaction, childInstances } = details;

                        return (
                          <tr className="bg-gray-50 dark:bg-gray-800/50">
                            <td colSpan={4 + Object.values(columnVisibility).filter(v => v).length} className="px-6 py-4">
                              <div className="space-y-4">
                                {/* Recurring Schedule Details */}
                                {isParentRecurring && (
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Frequency</p>
                                      <p className="text-sm text-gray-900 dark:text-white">{getFrequencyLabel(displayTransaction.recurring_frequency)}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Next Occurrence</p>
                                      <p className="text-sm text-gray-900 dark:text-white">
                                        {displayTransaction.next_occurrence_date
                                          ? format(new Date(displayTransaction.next_occurrence_date), 'MMM dd, yyyy')
                                          : 'N/A'}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Status</p>
                                      <p className={`text-sm font-medium ${displayTransaction.is_paused ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`}>
                                        {displayTransaction.is_paused ? 'Paused' : 'Active'}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">End Date</p>
                                      <p className="text-sm text-gray-900 dark:text-white">
                                        {displayTransaction.recurring_end_date
                                          ? format(new Date(displayTransaction.recurring_end_date), 'MMM dd, yyyy')
                                          : 'No end date'}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Occurrence Count</p>
                                      <p className="text-sm text-gray-900 dark:text-white">
                                        {displayTransaction.occurrence_count || 0} {displayTransaction.occurrence_count === 1 ? 'time' : 'times'}
                                      </p>
                                    </div>
                                  </div>
                                )}
                                {!isParentRecurring && parentTransaction && (
                                  <div className="border-l-4 border-blue-500 pl-4">
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Parent Recurring Transaction</p>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                      <div>
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Frequency</p>
                                        <p className="text-sm text-gray-900 dark:text-white">{getFrequencyLabel(parentTransaction.recurring_frequency)}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Next Occurrence</p>
                                        <p className="text-sm text-gray-900 dark:text-white">
                                          {parentTransaction.next_occurrence_date
                                            ? format(new Date(parentTransaction.next_occurrence_date), 'MMM dd, yyyy')
                                            : 'N/A'}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Status</p>
                                        <p className={`text-sm font-medium ${parentTransaction.is_paused ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`}>
                                          {parentTransaction.is_paused ? 'Paused' : 'Active'}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Occurrence Count</p>
                                        <p className="text-sm text-gray-900 dark:text-white">
                                          {parentTransaction.occurrence_count || 0} {parentTransaction.occurrence_count === 1 ? 'time' : 'times'}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {/* Generated Instances List */}
                                {isParentRecurring && childInstances.length > 0 && (
                                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Generated Instances ({childInstances.length})</p>
                                    <div className="max-h-48 overflow-y-auto space-y-2">
                                      {childInstances.map((instance) => (
                                        <div key={instance.id} className="bg-white dark:bg-gray-700/50 rounded p-2 flex items-center justify-between text-sm">
                                          <span className="text-gray-900 dark:text-white">
                                            {format(new Date(instance.date), 'MMM dd, yyyy')}
                                          </span>
                                          <span className="text-gray-600 dark:text-gray-300">
                                            {formatCurrency(instance.amount, selectedCurrency)}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })()}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden max-h-[500px] overflow-y-auto">
          <div className="space-y-4 px-2.5">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-16">
                <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <TrendingUp className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No transaction records found</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                  Start tracking your income and expenses by adding your first transaction
                </p>
              </div>
            ) : (
              filteredTransactions.map((transaction) => {
                const account = accounts.find(a => a.id === transaction.account_id);
                const currency = account?.currency || 'USD';
                const isSelected = selectedId === transaction.transaction_id;
                const isFromSearchSelection = isFromSearch && isSelected;
                const isTransfer = transaction.tags?.some((tag: string) => tag.includes('transfer') || tag.includes('dps_transfer'));
                const isRecurring = transaction.is_recurring || transaction.parent_recurring_id;
                return (
                  <div 
                    key={transaction.id} 
                    id={`transaction-${transaction.transaction_id || transaction.id}`}
                    ref={isSelected ? selectedRecordRef : null}
                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Card Header - Date, Type Badge, and Indicators */}
                    <div className="flex items-center justify-between p-3 pb-2">
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex-1">
                        <div className="font-medium flex items-center gap-1.5">
                          <span>{format(new Date(transaction.date), 'MMM dd, yyyy')}</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500 font-normal">
                            {format(new Date(transaction.created_at), 'h:mm a')}
                          </span>
                        </div>
                        {transaction.updated_at && transaction.updated_at !== transaction.created_at && (
                          <div className="text-xs text-gradient-primary mt-1 flex items-center gap-1">
                            <Edit2 
                              className="w-3 h-3" 
                              style={{
                                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text'
                              }}
                            />
                            <span>{format(new Date(transaction.updated_at), 'MMM dd, h:mm a')}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <div>
                          {transaction.type === 'income' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300">
                              <ArrowDownRight className="w-3 h-3" /> Income
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300">
                              <ArrowUpRight className="w-3 h-3" /> Expense
                            </span>
                          )}
                        </div>
                        {/* Transfer Indicator */}
                        {isTransfer && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300">
                            <ArrowUpRight className="w-2.5 h-2.5" /> Transfer
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Body - Two Column Layout: Description + Transaction ID (Left) | Amount + Category (Right) */}
                    <div className="px-3 pb-2">
                      {/* Description and Amount on Same Row */}
                      <div className="flex items-center justify-between gap-3" style={{ marginTop: '0px', marginBottom: '10px' }}>
                        <div className="text-sm font-medium text-gray-900 dark:text-white flex-1 min-w-0">
                          {formatTransactionDescription(transaction.description)}
                        </div>
                        <div className={`text-sm font-bold flex-shrink-0 ${
                          transaction.type === 'income' 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}
                          {formatCurrency(transaction.amount, selectedCurrency)}
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        {/* Left Column: Transaction ID */}
                        <div className="flex-1 min-w-0">
                          {transaction.transaction_id && (
                            <button
                              onClick={() => handleCopyTransactionId(transaction.transaction_id!)}
                              className="flex items-center gap-1.5 text-xs font-mono text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded"
                              title="Click to copy Transaction ID"
                            >
                              <span>#{formatTransactionId(transaction.transaction_id)}</span>
                              <Copy className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        {/* Right Column: Category */}
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          {transaction.category && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700">
                              {transaction.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Additional Indicators - Below Two Column Layout */}
                    <div className="px-3 pb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Tags Display */}
                        {transaction.tags && transaction.tags.length > 0 && (() => {
                          const displayTags = transaction.tags.filter((tag: string) => 
                            !tag.includes('transfer') && 
                            !tag.includes('dps_transfer') && 
                            tag !== 'dps_deletion' && 
                            tag !== 'lend_borrow'
                          );
                          return displayTags.length > 0 ? (
                            <>
                              {displayTags.map((tag: string, index: number) => (
                                <span 
                                  key={index} 
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                                >
                                  <Tag className="w-2.5 h-2.5" />
                                  {tag}
                                </span>
                              ))}
                            </>
                          ) : null;
                        })()}
                      </div>
                    </div>

                    {/* Card Footer - Account and Actions */}
                    <div className="flex items-center justify-between px-3 pb-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                      <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                        {getAccountName(transaction.account_id)}
                      </div>
                      <div className="flex gap-1">
                         {isLendBorrowTransaction(transaction) ? (
                           <Tooltip content="Lend & Borrow transaction info" placement="top">
                             <button
                               onClick={() => setShowLendBorrowInfo(true)}
                               className="p-1.5 text-gray-500 dark:text-gray-400 rounded-md transition-colors hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900/20"
                             >
                               <Info className="w-3.5 h-3.5" />
                             </button>
                           </Tooltip>
                         ) : (
                           <>
                               {(transaction.is_recurring || transaction.parent_recurring_id) && (
                                 <Tooltip content={expandedRecurringIds.has(transaction.id) ? 'Collapse recurring details' : 'Expand recurring details'} placement="top">
                                   <button
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       toggleRecurringExpand(transaction.id);
                                     }}
                                     className="p-1.5 text-gray-500 dark:text-gray-400 rounded-md transition-colors hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                                   >
                                     <Repeat className="w-3.5 h-3.5" />
                                   </button>
                                 </Tooltip>
                               )}
                               {transaction.is_recurring && (
                                 <Tooltip content={transaction.is_paused ? 'Resume recurring transaction' : 'Pause recurring transaction'} placement="top">
                                   <button
                                     onClick={() => handleTogglePause(transaction)}
                                     className="p-1.5 text-gray-500 dark:text-gray-400 rounded-md transition-colors hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                   >
                                     {transaction.is_paused ? (
                                       <Play className="w-3.5 h-3.5" />
                                     ) : (
                                       <Pause className="w-3.5 h-3.5" />
                                     )}
                                   </button>
                                 </Tooltip>
                               )}
                               {!transaction.is_recurring && (
                                 <Tooltip content="Duplicate" placement="top">
                                   <button
                                     onClick={() => handleDuplicate(transaction)}
                                     className="p-1.5 text-gray-500 dark:text-gray-400 rounded-md transition-colors hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                                   >
                                     <Files className="w-3.5 h-3.5" />
                                   </button>
                                 </Tooltip>
                               )}
                               <Tooltip content="Edit" placement="top">
                                 <button
                                   onClick={() => handleEdit(transaction)}
                                   className="p-1.5 text-gray-500 dark:text-gray-400 rounded-md transition-colors hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                 >
                                   <Edit2 className="w-3.5 h-3.5" />
                                 </button>
                               </Tooltip>
                             {transaction.tags?.includes('purchase') && (
                               <Tooltip content="Linked to Purchase" placement="top">
                                 <div
                                   className="p-1.5 text-gray-500 dark:text-gray-400"
                                 >
                                   <Link className="w-3.5 h-3.5" />
                                 </div>
                               </Tooltip>
                             )}
                             <Tooltip content="Delete" placement="top">
                               <button
                                 onClick={() => {
                                   setTransactionToDelete(transaction);
                                   setShowDeleteModal(true);
                                 }}
                                 className="p-1.5 text-gray-500 dark:text-gray-400 rounded-md transition-colors hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                               >
                                 <Trash2 className="w-3.5 h-3.5" />
                               </button>
                             </Tooltip>
                           </>
                         )}
                      </div>
                    </div>

                    {/* Expanded Recurring Details */}
                    {expandedRecurringIds.has(transaction.id) && (transaction.is_recurring || transaction.parent_recurring_id) && (() => {
                      const isParentRecurring = transaction.is_recurring;
                      const parentTransaction = isParentRecurring ? transaction : activeTransactions.find(t => t.id === transaction.parent_recurring_id);
                      const displayTransaction = parentTransaction || transaction;
                      const childInstances = isParentRecurring ? activeTransactions.filter(t => t.parent_recurring_id === transaction.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [];

                      if (!displayTransaction) return null;

                      return (
                        <div className="px-3 pb-3 border-t border-gray-200 dark:border-gray-700 pt-3 space-y-3">
                          {/* Recurring Schedule Details */}
                          {isParentRecurring && (
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Frequency</p>
                                <p className="text-sm text-gray-900 dark:text-white">{getFrequencyLabel(displayTransaction.recurring_frequency)}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Next Occurrence</p>
                                <p className="text-sm text-gray-900 dark:text-white">
                                  {displayTransaction.next_occurrence_date
                                    ? format(new Date(displayTransaction.next_occurrence_date), 'MMM dd, yyyy')
                                    : 'N/A'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Status</p>
                                <p className={`text-sm font-medium ${displayTransaction.is_paused ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`}>
                                  {displayTransaction.is_paused ? 'Paused' : 'Active'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">End Date</p>
                                <p className="text-sm text-gray-900 dark:text-white">
                                  {displayTransaction.recurring_end_date
                                    ? format(new Date(displayTransaction.recurring_end_date), 'MMM dd, yyyy')
                                    : 'No end date'}
                                </p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Occurrence Count</p>
                                <p className="text-sm text-gray-900 dark:text-white">
                                  {displayTransaction.occurrence_count || 0} {displayTransaction.occurrence_count === 1 ? 'time' : 'times'}
                                </p>
                              </div>
                            </div>
                          )}
                          {!isParentRecurring && parentTransaction && (
                            <div className="border-l-4 border-blue-500 pl-3">
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Parent Recurring Transaction</p>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Frequency</p>
                                  <p className="text-sm text-gray-900 dark:text-white">{getFrequencyLabel(parentTransaction.recurring_frequency)}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Next Occurrence</p>
                                  <p className="text-sm text-gray-900 dark:text-white">
                                    {parentTransaction.next_occurrence_date
                                      ? format(new Date(parentTransaction.next_occurrence_date), 'MMM dd, yyyy')
                                      : 'N/A'}
                                  </p>
                                </div>
                                <div className="col-span-2">
                                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Status</p>
                                  <p className={`text-sm font-medium ${parentTransaction.is_paused ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`}>
                                    {parentTransaction.is_paused ? 'Paused' : 'Active'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          {/* Generated Instances List */}
                          {isParentRecurring && childInstances.length > 0 && (
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Generated Instances ({childInstances.length})</p>
                              <div className="max-h-32 overflow-y-auto space-y-1.5">
                                {childInstances.map((instance) => (
                                  <div key={instance.id} className="bg-gray-50 dark:bg-gray-700/50 rounded p-2 flex items-center justify-between text-xs">
                                    <span className="text-gray-900 dark:text-white">
                                      {format(new Date(instance.date), 'MMM dd, yyyy')}
                                    </span>
                                    <span className="text-gray-600 dark:text-gray-300">
                                      {formatCurrency(instance.amount, selectedCurrency)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Tablet Stacked Table View */}
        <div className="hidden lg:block xl:hidden max-h-[500px] overflow-y-auto">
          <div className="space-y-4 px-2.5">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-16">
                <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <TrendingUp className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No transaction records found</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                  Start tracking your income and expenses by adding your first transaction
                </p>
              </div>
            ) : (
              filteredTransactions.map((transaction) => {
                const account = accounts.find(a => a.id === transaction.account_id);
                const currency = account?.currency || 'USD';
                const isSelected = selectedId === transaction.transaction_id;
                const isFromSearchSelection = isFromSearch && isSelected;
                return (
                  <div 
                    key={transaction.id} 
                    id={`transaction-${transaction.transaction_id || transaction.id}`}
                    ref={isSelected ? selectedRecordRef : null}
                    className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow ${
                      isSelected 
                        ? isFromSearchSelection 
                          ? 'ring-2 ring-blue-500 ring-opacity-50 bg-blue-50 dark:bg-blue-900/20' 
                          : 'ring-2 ring-blue-500 ring-opacity-50'
                        : ''
                    }`}
                  >
                    {/* Primary Row - Date, Description, Amount, Actions */}
                    <div className="grid grid-cols-12 gap-2 items-center mb-3">
                      <div className="col-span-3">
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</div>
                        <div className="text-sm text-gray-900 dark:text-white">{format(new Date(transaction.date), 'MMM dd, yyyy')}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                          {format(new Date(transaction.created_at), 'h:mm a')}
                          {transaction.updated_at && transaction.updated_at !== transaction.created_at && (
                            <span className="ml-2 text-gradient-primary flex items-center" title={`Last modified: ${format(new Date(transaction.updated_at), 'MMM dd, h:mm a')}`}>
                              <Edit2 
                                className="w-3 h-3" 
                                style={{
                                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                                  WebkitBackgroundClip: 'text',
                                  WebkitTextFillColor: 'transparent',
                                  backgroundClip: 'text'
                                }}
                              />
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="col-span-6">
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{formatTransactionDescription(transaction.description)}</div>
                        {transaction.transaction_id && (
                          <button
                            onClick={() => handleCopyTransactionId(transaction.transaction_id!)}
                            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors mt-1"
                          >
                            <span className="font-mono">#{formatTransactionId(transaction.transaction_id)}</span>
                            <Copy className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <div className="col-span-2">
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(transaction.amount, selectedCurrency)}</div>
                      </div>
                      <div className="col-span-1">
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</div>
                          <div className="flex gap-2 items-center">
                            {transaction.is_recurring && (
                              <button
                                onClick={() => handleTogglePause(transaction)}
                                className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                                title={transaction.is_paused ? 'Resume recurring transaction' : 'Pause recurring transaction'}
                              >
                                {transaction.is_paused ? (
                                  <Play className="w-4 h-4" />
                                ) : (
                                  <Pause className="w-4 h-4" />
                                )}
                              </button>
                            )}
                            {!isLendBorrowTransaction(transaction) && !transaction.is_recurring && (
                              <button
                                onClick={() => handleDuplicate(transaction)}
                                className="text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                                title="Duplicate transaction"
                              >
                                <Files className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => !isLendBorrowTransaction(transaction) && handleEdit(transaction)}
                              className={`text-gray-500 dark:text-gray-400 ${
                                isLendBorrowTransaction(transaction)
                                  ? 'cursor-not-allowed opacity-50'
                                  : 'hover:text-blue-600 dark:hover:text-blue-400'
                              }`}
                              title={isLendBorrowTransaction(transaction) ? "This transaction is managed by the Lend & Borrow page. Please make changes there instead." : "Edit"}
                              disabled={isLendBorrowTransaction(transaction)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          {transaction.tags?.includes('purchase') && (
                            <div
                              className="text-gray-500 dark:text-gray-400"
                              title="Linked to Purchase"
                            >
                              <Link className="w-4 h-4" />
                            </div>
                          )}
                          <button
                            onClick={() => {
                              if (!isLendBorrowTransaction(transaction)) {
                                setTransactionToDelete(transaction);
                                setShowDeleteModal(true);
                              }
                            }}
                            className={`text-gray-500 dark:text-gray-400 ${
                              isLendBorrowTransaction(transaction)
                                ? 'cursor-not-allowed opacity-50'
                                : 'hover:text-red-600 dark:hover:text-red-400'
                            }`}
                            title={isLendBorrowTransaction(transaction) ? "This transaction is managed by the Lend & Borrow page. Please make changes there instead." : "Delete"}
                            disabled={isLendBorrowTransaction(transaction)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Secondary Row - Account, Type */}
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-6">
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Account</div>
                        <div className="text-sm text-gray-900 dark:text-white">{getAccountName(transaction.account_id)}</div>
                      </div>
                      <div className="col-span-6">
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</div>
                        <div>
                          {transaction.type === 'income' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300">
                              <ArrowDownRight className="w-3 h-3" /> Income
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300">
                              <ArrowUpRight className="w-3 h-3" /> Expense
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Recurring Details */}
                    {expandedRecurringIds.has(transaction.id) && (transaction.is_recurring || transaction.parent_recurring_id) && (() => {
                      const isParentRecurring = transaction.is_recurring;
                      const parentTransaction = isParentRecurring ? transaction : activeTransactions.find(t => t.id === transaction.parent_recurring_id);
                      const displayTransaction = parentTransaction || transaction;
                      const childInstances = isParentRecurring ? activeTransactions.filter(t => t.parent_recurring_id === transaction.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [];

                      if (!displayTransaction) return null;

                      return (
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-3 space-y-3">
                          {/* Recurring Schedule Details */}
                          {isParentRecurring && (
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Frequency</p>
                                <p className="text-sm text-gray-900 dark:text-white">{getFrequencyLabel(displayTransaction.recurring_frequency)}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Next Occurrence</p>
                                <p className="text-sm text-gray-900 dark:text-white">
                                  {displayTransaction.next_occurrence_date
                                    ? format(new Date(displayTransaction.next_occurrence_date), 'MMM dd, yyyy')
                                    : 'N/A'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Status</p>
                                <p className={`text-sm font-medium ${displayTransaction.is_paused ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`}>
                                  {displayTransaction.is_paused ? 'Paused' : 'Active'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">End Date</p>
                                <p className="text-sm text-gray-900 dark:text-white">
                                  {displayTransaction.recurring_end_date
                                    ? format(new Date(displayTransaction.recurring_end_date), 'MMM dd, yyyy')
                                    : 'No end date'}
                                </p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Occurrence Count</p>
                                <p className="text-sm text-gray-900 dark:text-white">
                                  {displayTransaction.occurrence_count || 0} {displayTransaction.occurrence_count === 1 ? 'time' : 'times'}
                                </p>
                              </div>
                            </div>
                          )}
                          {!isParentRecurring && parentTransaction && (
                            <div className="border-l-4 border-blue-500 pl-3">
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Parent Recurring Transaction</p>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Frequency</p>
                                  <p className="text-sm text-gray-900 dark:text-white">{getFrequencyLabel(parentTransaction.recurring_frequency)}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Next Occurrence</p>
                                  <p className="text-sm text-gray-900 dark:text-white">
                                    {parentTransaction.next_occurrence_date
                                      ? format(new Date(parentTransaction.next_occurrence_date), 'MMM dd, yyyy')
                                      : 'N/A'}
                                  </p>
                                </div>
                                <div className="col-span-2">
                                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Status</p>
                                  <p className={`text-sm font-medium ${parentTransaction.is_paused ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`}>
                                    {parentTransaction.is_paused ? 'Paused' : 'Active'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          {/* Generated Instances List */}
                          {isParentRecurring && childInstances.length > 0 && (
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Generated Instances ({childInstances.length})</p>
                              <div className="max-h-32 overflow-y-auto space-y-1.5">
                                {childInstances.map((instance) => (
                                  <div key={instance.id} className="bg-gray-50 dark:bg-gray-700/50 rounded p-2 flex items-center justify-between text-xs">
                                    <span className="text-gray-900 dark:text-white">
                                      {format(new Date(instance.date), 'MMM dd, yyyy')}
                                    </span>
                                    <span className="text-gray-600 dark:text-gray-300">
                                      {formatCurrency(instance.amount, selectedCurrency)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
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
            {/* Total Income */}
            <div className="flex items-center gap-2 pr-4 border-r border-gray-200 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">Income:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatCurrencyCompact(lifetimeTotalsByCurrency.income, selectedCurrency)}
              </span>
            </div>

            {/* Total Expense */}
            <div className="flex items-center gap-2 px-4 border-r border-gray-200 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">Expense:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatCurrencyCompact(lifetimeTotalsByCurrency.expense, selectedCurrency)}
              </span>
            </div>

            {/* Total Transactions */}
            <div className="flex items-center gap-2 pl-4">
              <span className="text-gray-600 dark:text-gray-400">Transactions:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {lifetimeTotalsByCurrency.count}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Summary Section - Regular section at bottom */}
        <div className="lg:hidden mt-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm" style={{ margin: '10px', marginBottom: '0px' }}>
          <div className="p-4 space-y-3">
            <div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">All Time Summary</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Income</span>
                <span className="font-semibold text-gray-900 dark:text-white">{formatCurrencyCompact(lifetimeTotalsByCurrency.income, selectedCurrency)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Expense</span>
                <span className="font-semibold text-gray-900 dark:text-white">{formatCurrencyCompact(lifetimeTotalsByCurrency.expense, selectedCurrency)}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Transactions</span>
                <span className="font-semibold text-gray-900 dark:text-white">{lifetimeTotalsByCurrency.count}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Form Modal */}
      {isFormOpen && (
        <TransactionForm
          onClose={handleCloseForm}
          transactionToEdit={selectedTransaction}
          duplicateFrom={transactionToDuplicate}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal && !!transactionToDelete}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={async () => {
          if (transactionToDelete) await handleDelete(transactionToDelete.id);
          setShowDeleteModal(false);
        }}
        title="Delete Transaction"
        message={`Are you sure you want to delete ${transactionToDelete?.description}? This will update the account balance and cannot be undone.`}
        recordDetails={
          <>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium text-red-800">Transaction Details:</span>
            </div>
            <div className="text-sm text-red-700 space-y-1">
              <div><span className="font-medium">Description:</span> {transactionToDelete?.description}</div>
              <div><span className="font-medium">Amount:</span> {formatCurrency(transactionToDelete?.amount || 0, selectedCurrency)}</div>
              <div><span className="font-medium">Type:</span> {transactionToDelete?.type}</div>
              <div><span className="font-medium">Account:</span> {transactionToDelete ? getAccountName(transactionToDelete.account_id) : ''}</div>
            </div>
          </>
        }
        confirmLabel="Delete Transaction"
        cancelLabel="Cancel"
      />

      {/* Lend & Borrow Info Modal */}
      <LendBorrowInfoModal
        isOpen={showLendBorrowInfo}
        onClose={() => setShowLendBorrowInfo(false)}
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
                    onClick={() => {
                      setFilters(tempFilters);
                      setShowMobileFilterMenu(false);
                    }}
                    className={`p-1 transition-colors ${
                      (tempFilters.type !== 'all' || tempFilters.account !== 'all' || tempFilters.currency || tempFilters.dateRange.start || tempFilters.dateRange.end || tempFilters.showModifiedOnly || tempFilters.showRecurringOnly)
                        ? 'text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                    title="Apply Filters"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      setFilters({
                        search: '',
                        type: 'all',
                        account: 'all',
                        currency: '',
                        dateRange: { start: '', end: '' },
                        showModifiedOnly: false,
                        recentlyModifiedDays: 7,
                        showRecurringOnly: false
                      });
                      setShowMobileFilterMenu(false);
                    }}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1"
                    title="Clear All Filters"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Type Filter */}
            <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Type</div>
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); setTempFilters({ ...tempFilters, type: 'all' }); }}
                  className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                    tempFilters.type === 'all'
                      ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200'
                      : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setTempFilters({ ...tempFilters, type: 'income' }); }}
                  className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                    tempFilters.type === 'income'
                      ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200'
                      : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  Income
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setTempFilters({ ...tempFilters, type: 'expense' }); }}
                  className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                    tempFilters.type === 'expense'
                      ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200'
                      : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  Expense
                </button>
              </div>
            </div>

            {/* Recurring Filter - Mobile */}
            {isPremiumPlan && (
              <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Recurring</div>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); setTempFilters({ ...tempFilters, showRecurringOnly: false }); }}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors flex items-center gap-1 ${
                      !tempFilters.showRecurringOnly
                        ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200'
                        : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setTempFilters({ ...tempFilters, showRecurringOnly: true }); }}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors flex items-center gap-1 ${
                      tempFilters.showRecurringOnly
                        ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200'
                        : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Repeat className="w-3 h-3" />
                    Recurring Only
                  </button>
                </div>
              </div>
            )}

            {/* Account Filter */}
            <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Account</div>
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); setTempFilters({ ...tempFilters, account: 'all' }); }}
                  className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                    tempFilters.account === 'all'
                      ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200'
                      : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  All
                </button>
                {accounts.map(account => (
                  <button
                    key={account.id}
                    onClick={(e) => { e.stopPropagation(); setTempFilters({ ...tempFilters, account: account.id }); }}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                      tempFilters.account === account.id
                        ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200'
                        : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {account.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Currency Filter */}
            <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Currency</div>
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); setTempFilters({ ...tempFilters, currency: '' }); }}
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
                    onClick={(e) => { e.stopPropagation(); setTempFilters({ ...tempFilters, currency }); }}
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

            {/* Date Range Filter */}
            <div className="px-3 py-2">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Date Range</div>
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); setTempFilters({ ...tempFilters, dateRange: { start: '', end: '' } }); }}
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
                    const today = new Date();
                    const todayStr = today.toISOString().slice(0, 10);
                    setTempFilters({ ...tempFilters, dateRange: { start: todayStr, end: todayStr } }); 
                  }}
                  className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                    tempFilters.dateRange.start && tempFilters.dateRange.end && tempFilters.dateRange.start === tempFilters.dateRange.end
                      ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200'
                      : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    const today = new Date();
                    const day = today.getDay();
                    const diffToMonday = (day === 0 ? -6 : 1) - day;
                    const monday = new Date(today);
                    monday.setDate(today.getDate() + diffToMonday);
                    const sunday = new Date(monday);
                    sunday.setDate(monday.getDate() + 6);
                    setTempFilters({ 
                      ...tempFilters, 
                      dateRange: { 
                        start: monday.toISOString().slice(0, 10), 
                        end: sunday.toISOString().slice(0, 10) 
                      } 
                    }); 
                  }}
                  className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                    tempFilters.dateRange.start && tempFilters.dateRange.end && 
                    (() => {
                      const today = new Date();
                      const day = today.getDay();
                      const diffToMonday = (day === 0 ? -6 : 1) - day;
                      const monday = new Date(today);
                      monday.setDate(today.getDate() + diffToMonday);
                      const sunday = new Date(monday);
                      sunday.setDate(monday.getDate() + 6);
                      return tempFilters.dateRange.start === monday.toISOString().slice(0, 10) && 
                             tempFilters.dateRange.end === sunday.toISOString().slice(0, 10);
                    })()
                      ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200'
                      : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  This Week
                </button>
                <button
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    const today = new Date();
                    const first = new Date(today.getFullYear(), today.getMonth(), 1);
                    const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                    setTempFilters({ 
                      ...tempFilters, 
                      dateRange: { 
                        start: first.toISOString().slice(0, 10), 
                        end: last.toISOString().slice(0, 10) 
                      } 
                    }); 
                  }}
                  className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                    tempFilters.dateRange.start && tempFilters.dateRange.end && 
                    (() => {
                      const today = new Date();
                      const first = new Date(today.getFullYear(), today.getMonth(), 1);
                      const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                      return tempFilters.dateRange.start === first.toISOString().slice(0, 10) && 
                             tempFilters.dateRange.end === last.toISOString().slice(0, 10);
                    })()
                      ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200'
                      : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  This Month
                </button>
              </div>
            </div>

            {/* Recently Modified Filter */}
            <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Recently Modified</div>
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); setTempFilters({ ...tempFilters, showModifiedOnly: false }); }}
                  className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                    !tempFilters.showModifiedOnly
                      ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200'
                      : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setTempFilters({ ...tempFilters, showModifiedOnly: true, recentlyModifiedDays: 1 }); }}
                  className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                    tempFilters.showModifiedOnly && tempFilters.recentlyModifiedDays === 1
                      ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200'
                      : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setTempFilters({ ...tempFilters, showModifiedOnly: true, recentlyModifiedDays: 3 }); }}
                  className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                    tempFilters.showModifiedOnly && tempFilters.recentlyModifiedDays === 3
                      ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200'
                      : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  3 Days
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setTempFilters({ ...tempFilters, showModifiedOnly: true, recentlyModifiedDays: 7 }); }}
                  className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                    tempFilters.showModifiedOnly && tempFilters.recentlyModifiedDays === 7
                      ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200'
                      : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  7 Days
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setTempFilters({ ...tempFilters, showModifiedOnly: true, recentlyModifiedDays: 30 }); }}
                  className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                    tempFilters.showModifiedOnly && tempFilters.recentlyModifiedDays === 30
                      ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200'
                      : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  30 Days
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Android Download Modal */}
      {showAndroidDownloadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center">
                  <Download className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Download Not Available
                </h3>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  File downloads are not supported in the Android app due to security restrictions.
                </p>
                
                <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    💡 Alternative Solutions:
                  </h4>
                  <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                    <li>• Open Balanze in your web browser</li>
                    <li>• Use the web version for downloads</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex">
                <button
                  onClick={() => setShowAndroidDownloadModal(false)}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};