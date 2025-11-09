import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { Plus, Edit2, Trash2, DollarSign, Info, PlusCircle, InfoIcon, Search, ArrowLeft, Wallet, ChevronUp, ChevronDown, CreditCard, Filter, ArrowUpDown, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, Handshake, Eye, X, Pen } from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { LendBorrowForm } from './LendBorrowForm';
import { LendBorrowMobileView } from './LendBorrowMobileView';
import { SettlementModal } from './SettlementModal';
import { SettledRecordInfoModal } from './SettledRecordInfoModal';
import { LendBorrow } from '../../types';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { generateTransactionId, createSuccessMessage } from '../../utils/transactionId';
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';
import { useAuthStore } from '../../store/authStore';
import { useLoadingContext } from '../../context/LoadingContext';
import { LendBorrowCardSkeleton, LendBorrowTableSkeleton, LendBorrowSummaryCardsSkeleton, LendBorrowFiltersSkeleton } from './LendBorrowSkeleton';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useRecordSelection } from '../../hooks/useRecordSelection';
import { SelectionFilter } from '../common/SelectionFilter';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { useTranslation } from 'react-i18next';
import { getPreference, setPreference } from '../../lib/userPreferences';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const currencySymbols: Record<string, string> = {
  USD: '$',
  BDT: '৳',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  ALL: 'L',
  INR: '₹',
  CAD: '$',
  AUD: '$',
};

const getCurrencySymbol = (currency: string) => currencySymbols[currency] || currency;

export const LendBorrowTableView: React.FC = () => {
  const { t } = useTranslation();
  const { lendBorrowRecords, deleteLendBorrowRecord, loading, error, updateLendBorrowRecord, fetchLendBorrowRecords, addLendBorrowRecord, accounts, fetchAccounts } = useFinanceStore();
  const { wrapAsync, setLoadingMessage } = useLoadingContext();
  const { user, profile } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showLendBorrowForm, setShowLendBorrowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<LendBorrow | null>(null);
  const [selectedRecordId, setSelectedRecordId] = useState<string>('');
  const [selectedRecord, setSelectedRecord] = useState<LendBorrow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [settlementModalOpen, setSettlementModalOpen] = useState(false);
  const [recordToSettle, setRecordToSettle] = useState<LendBorrow | null>(null);
  const [settledRecordInfoModal, setSettledRecordInfoModal] = useState<{
    isOpen: boolean;
    record: LendBorrow | null;
  }>({ isOpen: false, record: null });
  const [deleteConfirmationModal, setDeleteConfirmationModal] = useState<{
    isOpen: boolean;
    record: LendBorrow | null;
  }>({ isOpen: false, record: null });
  
  // Check if user has Premium plan for Lend & Borrow
  const isPremium = profile?.subscription?.plan === 'premium';
  
  // Widget visibility state - hybrid approach (localStorage + database)
  const [showLendBorrowWidget, setShowLendBorrowWidget] = useState(() => {
    const saved = localStorage.getItem('showLendBorrowWidget');
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  // Check if Lend & Borrow widget is hidden
  const [isLendBorrowWidgetHidden, setIsLendBorrowWidgetHidden] = useState(() => {
    const saved = localStorage.getItem('showLendBorrowWidget');
    const isHidden = saved !== null ? !JSON.parse(saved) : false;
    return isHidden;
  });
  const [isRestoringWidget, setIsRestoringWidget] = useState(false);
  
  // Android detection
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isCapacitor = !!(window as any).Capacitor;
  const isAndroidApp = isAndroid && isCapacitor;
  
  // Android download modal state
  const [showAndroidDownloadModal, setShowAndroidDownloadModal] = useState(false);

  // Memoize fetchLendBorrowRecords to prevent infinite loops
  const fetchLendBorrowRecordsCallback = useCallback(() => {
    useFinanceStore.getState().fetchLendBorrowRecords();
  }, []);

  // Record selection functionality
  const {
    selectedRecord: selectedRecordFromHook,
    selectedId,
    isFromSearch,
    selectedRecordRef,
    clearSelection,
    hasSelection
  } = useRecordSelection({
    records: lendBorrowRecords,
    recordIdField: 'id',
    scrollToRecord: true
  });

  // New state for unified table view
  const [tableFilters, setTableFilters] = useState({
    search: '',
    currency: profile?.local_currency || '',
    type: 'all',
    status: 'active', // 'active' or 'all'
    dateRange: { start: '', end: '' }
  });

  // Enhanced search state
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  // Add sorting state
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showMobileFilterMenu, setShowMobileFilterMenu] = useState(false);
  const [showPresetDropdown, setShowPresetDropdown] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customStart, setCustomStart] = useState(tableFilters.dateRange.start ? tableFilters.dateRange.start.slice(0, 10) : '');
  const [customEnd, setCustomEnd] = useState(tableFilters.dateRange.end ? tableFilters.dateRange.end.slice(0, 10) : '');
  
  // Temporary filter state for mobile modal
  const [tempFilters, setTempFilters] = useState(tableFilters);

  // Refs for dropdown menus
  const currencyMenuRef = useRef<HTMLDivElement>(null);
  const typeMenuRef = useRef<HTMLDivElement>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);
  const mobileFilterMenuRef = useRef<HTMLDivElement>(null);
  const presetDropdownRef = useRef<HTMLDivElement>(null);

  // State for row expansion
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  // State for mobile record expansion
  const [expandedMobileRecords, setExpandedMobileRecords] = useState<Set<string>>(new Set());

  const { isMobile } = useMobileDetection();

  // Load data on component mount
  useEffect(() => {
    if (user) {
      fetchLendBorrowRecordsCallback();
      fetchAccounts();
    }
  }, [user, fetchLendBorrowRecordsCallback, fetchAccounts]);

  // Check and update overdue status for records
  const updateOverdueStatus = async (records: LendBorrow[]) => {
    if (!user) return records;
    
    const today = new Date();
    const overdueRecords = records.filter(record => 
      record.status === 'active' && 
      record.due_date && 
      new Date(record.due_date) < today
    );

    if (overdueRecords.length === 0) return records;


    // Update overdue records individually to avoid RLS issues with upsert
    try {
      for (const record of overdueRecords) {
        const { error } = await supabase
          .from('lend_borrow')
          .update({ status: 'overdue' })
          .eq('id', record.id)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error updating overdue status for record:', record.id, error);
          continue;
        }
      }

      // Update local state
      return records.map(record => {
        const overdueRecord = overdueRecords.find(r => r.id === record.id);
        return overdueRecord ? { ...record, status: 'overdue' as const } : record;
      });
    } catch (error) {
      console.error('Error updating overdue status:', error);
      return records;
    }
  };

  // Update overdue status when records change
  useEffect(() => {
    if (lendBorrowRecords.length > 0) {
      updateOverdueStatus(lendBorrowRecords);
    }
  }, [lendBorrowRecords]);

  // Load user preferences for Lend & Borrow widget visibility
  useEffect(() => {
    if (user?.id) {
      const loadPreferences = async () => {
        try {
          const showWidget = await getPreference(user.id, 'showLendBorrowWidget', true);
          setShowLendBorrowWidget(showWidget);
          localStorage.setItem('showLendBorrowWidget', JSON.stringify(showWidget));
        } catch (error) {
          // Keep current localStorage value if database fails
        }
      };
      loadPreferences();
    }
  }, [user?.id]);

  // Show Lend & Borrow widget on dashboard
  const handleShowLendBorrowWidget = useCallback(async () => {
    // Update localStorage immediately for instant UI response
    localStorage.setItem('showLendBorrowWidget', JSON.stringify(true));
    setShowLendBorrowWidget(true);
    
    // Save to database if user is authenticated
    if (user?.id) {
      try {
        await setPreference(user.id, 'showLendBorrowWidget', true);
        toast.success('Lend & Borrow widget will be shown on dashboard!', {
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
  }, [user?.id, setShowLendBorrowWidget]);

  // Function to restore Lend & Borrow widget to dashboard
  const handleShowLendBorrowWidgetFromPage = useCallback(async () => {
    console.log('Restoring Lend & Borrow widget to dashboard');
    setIsRestoringWidget(true);
    
    try {
      // Use the existing function that has proper database sync
      await handleShowLendBorrowWidget();
      
      // Update local state
      setIsLendBorrowWidgetHidden(false);
      
      console.log('Lend & Borrow widget restored, new state:', false);
    } finally {
      setIsRestoringWidget(false);
    }
  }, [handleShowLendBorrowWidget]);

  // Handle record selection from URL params
  useEffect(() => {
    const recordId = searchParams.get('record');
    if (recordId && lendBorrowRecords.length > 0) {
      const record = lendBorrowRecords.find(r => r.id === recordId);
      if (record) {
        setSelectedRecord(record);
        setSelectedRecordId(recordId);
        setModalOpen(true);
        // Scroll to the record
        setTimeout(() => {
          const element = document.getElementById(`record-${recordId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    }
  }, [searchParams, lendBorrowRecords]);

  // Handle deep linking for record selection
  const handleRecordSelection = (recordId: string) => {
    setSearchParams({ record: recordId });
    setSelectedRecordId(recordId);
    const record = lendBorrowRecords.find(r => r.id === recordId);
    if (record) {
      setSelectedRecord(record);
      setModalOpen(true);
    }
  };

  // Click outside handlers for dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (currencyMenuRef.current && !currencyMenuRef.current.contains(event.target as Node)) {
        setShowCurrencyMenu(false);
      }
      if (typeMenuRef.current && !typeMenuRef.current.contains(event.target as Node)) {
        setShowTypeMenu(false);
      }
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
        setShowStatusMenu(false);
      }
      // Removed mobile filter menu click outside handler - modal should only close via explicit actions
      if (presetDropdownRef.current && !presetDropdownRef.current.contains(event.target as Node)) {
        setShowPresetDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Date filter functions
  const getThisMonthDateRange = () => {
    const today = new Date();
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return {
      start: first.toISOString().slice(0, 10),
      end: last.toISOString().slice(0, 10)
    };
  };

  const getDateRangeLabel = () => {
    if (!tableFilters.dateRange.start || !tableFilters.dateRange.end) {
      return 'All Time';
    }
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    if (tableFilters.dateRange.start === todayStr && tableFilters.dateRange.end === todayStr) {
      return 'Today';
    }
    const day = today.getDay();
    const diffToMonday = (day === 0 ? -6 : 1) - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const mondayStr = monday.toISOString().slice(0, 10);
    const sundayStr = sunday.toISOString().slice(0, 10);
    if (tableFilters.dateRange.start === mondayStr && tableFilters.dateRange.end === sundayStr) {
      return 'This Week';
    }
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const firstStr = first.toISOString().slice(0, 10);
    const lastStr = last.toISOString().slice(0, 10);
    if (tableFilters.dateRange.start === firstStr && tableFilters.dateRange.end === lastStr) {
      return 'This Month';
    }
    const firstLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    const firstLastMonthStr = firstLastMonth.toISOString().slice(0, 10);
    const lastLastMonthStr = lastLastMonth.toISOString().slice(0, 10);
    if (tableFilters.dateRange.start === firstLastMonthStr && tableFilters.dateRange.end === lastLastMonthStr) {
      return 'Last Month';
    }
    const firstYear = new Date(today.getFullYear(), 0, 1);
    const lastYear = new Date(today.getFullYear(), 11, 31);
    const firstYearStr = firstYear.toISOString().slice(0, 10);
    const lastYearStr = lastYear.toISOString().slice(0, 10);
    if (tableFilters.dateRange.start === firstYearStr && tableFilters.dateRange.end === lastYearStr) {
      return 'This Year';
    }
    return 'Custom Range';
  };

  const handlePresetRange = (preset: string) => {
    const today = new Date();
    if (preset === 'custom') {
      setShowPresetDropdown(false);
      setShowCustomModal(true);
      setCustomStart(tableFilters.dateRange.start ? tableFilters.dateRange.start.slice(0, 10) : '');
      setCustomEnd(tableFilters.dateRange.end ? tableFilters.dateRange.end.slice(0, 10) : '');
      return;
    }
    setShowCustomModal(false);
    setShowPresetDropdown(false);
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
    setTableFilters(f => ({ ...f, dateRange: { start, end } }));
  };

  // Filter and sort records
  const filteredRecords = useMemo(() => {
    let filtered = lendBorrowRecords.filter(record => {
      const matchesSearch = !tableFilters.search || 
        record.person_name.toLowerCase().includes(tableFilters.search.toLowerCase());
      
      const matchesCurrency = !tableFilters.currency || record.currency === tableFilters.currency;
      
      const matchesType = tableFilters.type === 'all' || record.type === tableFilters.type;
      
      const matchesStatus = tableFilters.status === 'all' || 
        (tableFilters.status === 'active' && (record.status === 'active' || record.status === 'overdue')) ||
        (tableFilters.status === 'settled' && record.status === 'settled');
      
      // Date range filtering
      const matchesDateRange = !tableFilters.dateRange.start || !tableFilters.dateRange.end || 
        (() => {
          const recordDate = record.created_at ? new Date(record.created_at) : new Date();
          const startDate = new Date(tableFilters.dateRange.start);
          const endDate = new Date(tableFilters.dateRange.end);
          endDate.setHours(23, 59, 59, 999); // Include the entire end date
          return recordDate >= startDate && recordDate <= endDate;
        })();
      
      return matchesSearch && matchesCurrency && matchesType && matchesStatus && matchesDateRange;
    });

    // Apply sorting
    if (sortConfig) {
      filtered.sort((a, b) => {
        let aValue: any = a[sortConfig.key as keyof LendBorrow];
        let bValue: any = b[sortConfig.key as keyof LendBorrow];
        
        if (sortConfig.key === 'amount') {
          aValue = Number(aValue);
          bValue = Number(bValue);
        } else if (sortConfig.key === 'date') {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        } else if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [lendBorrowRecords, tableFilters, sortConfig]);

  // Handle sorting
  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (key: string) => {
    if (sortConfig?.key !== key) return <ChevronUp className="w-4 h-4 text-gray-400" />;
    return sortConfig.direction === 'asc' ? 
      <ChevronUp className="w-4 h-4 text-blue-600" /> : 
      <ChevronDown className="w-4 h-4 text-blue-600" />;
  };

  // Toggle row expansion
  const toggleRowExpansion = (recordId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(recordId)) {
        newSet.delete(recordId);
      } else {
        newSet.add(recordId);
      }
      return newSet;
    });
  };

  const isRowExpanded = (recordId: string) => expandedRows.has(recordId);
  
  // Mobile record expansion functions
  const toggleMobileRecordExpansion = (recordId: string) => {
    setExpandedMobileRecords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(recordId)) {
        newSet.delete(recordId);
      } else {
        newSet.add(recordId);
      }
      return newSet;
    });
  };

  const isMobileRecordExpanded = (recordId: string) => expandedMobileRecords.has(recordId);

  // Handle record actions
  const handleEditRecord = (record: LendBorrow) => {
    setEditingRecord(record);
    setShowLendBorrowForm(true);
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!user) return;

    // Wrap the delete process with loading state
    const wrappedDelete = wrapAsync(async () => {
      setLoadingMessage('Deleting record...');
      try {
        // Get the current record to check for associated transaction
        const { data: currentRecord, error: fetchError } = await supabase
          .from('lend_borrow')
          .select('transaction_id, affect_account_balance')
          .eq('id', recordId)
          .eq('user_id', user.id)
          .single();

        if (fetchError) {
          console.error('Error fetching record for deletion:', fetchError);
          toast.error('Failed to fetch record for deletion');
          return;
        }

        // Step 1: Delete associated transaction FIRST if it exists
        if (currentRecord.transaction_id && currentRecord.affect_account_balance) {
          const { error: transactionError } = await supabase
            .from('transactions')
            .delete()
            .eq('transaction_id', currentRecord.transaction_id)
            .eq('user_id', user.id);

          if (transactionError) {
            console.error('Error deleting associated transaction:', transactionError);
            toast.error('Failed to delete associated transaction');
            return;
          }
        }

        // Step 2: Disable account balance effects to prevent triggers
        const { error: disableError } = await supabase
          .from('lend_borrow')
          .update({ affect_account_balance: false })
          .eq('id', recordId)
          .eq('user_id', user.id);

        if (disableError) {
          console.error('Error disabling account balance effects:', disableError);
          toast.error('Failed to prepare record for deletion');
          return;
        }

        // Step 3: Delete the lend/borrow record
        const { error } = await supabase
          .from('lend_borrow')
          .delete()
          .eq('id', recordId)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error deleting record:', error);
          toast.error('Error deleting record: ' + error.message);
          throw error;
        }

        // Successfully deleted record
        toast.success('Record and associated transaction deleted successfully!');
        
        // Refresh data to show updated list
        await Promise.all([
          fetchLendBorrowRecordsCallback(),
          fetchAccounts()
        ]);
      } catch (error) {
        console.error('Error in handleDeleteRecord:', error);
        toast.error('Failed to delete record. Please try again.');
      }
    });
    
    // Execute the wrapped delete function
    await wrappedDelete();
  };

  const handleShowInfo = (record: LendBorrow) => {
    setSelectedRecord(record);
    setSelectedRecordId(record.id);
    setModalOpen(true);
  };

  // Handle settlement with account selection
  const handleSettle = async (record: LendBorrow, accountId: string) => {
    if (!user) return;
    
    try {
      // Create settlement transaction
      const settlementTransaction = {
        user_id: user.id,
        account_id: accountId,
        type: record.type === 'lend' ? 'income' : 'expense', // Lend settlement = income, borrow settlement = expense
        amount: record.amount,
        description: record.type === 'lend' 
          ? `Repayment from ${record.person_name}` 
          : `Repayment to ${record.person_name}`,
        category: 'Lend/Borrow',
        date: new Date().toISOString().split('T')[0],
        tags: ['lend_borrow', 'settlement'],
        transaction_id: `LB${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`
      };

      // Insert settlement transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert([settlementTransaction]);

      if (transactionError) {
        console.error('Settlement transaction error:', transactionError);
        toast.error('Failed to create settlement transaction');
        return;
      }

      // Update record status to settled
      const { error: updateError } = await supabase
        .from('lend_borrow')
        .update({ status: 'settled' })
        .eq('id', record.id);

      if (updateError) {
        console.error('Update record error:', updateError);
        toast.error('Failed to update record status');
        return;
      }

      // Refresh data
      await fetchLendBorrowRecordsCallback();

      toast.success('Record settled successfully!');
    } catch (error) {
      console.error('Settlement error:', error);
      toast.error('Failed to settle record');
    }
  };

  // Handle settlement modal
  const handleOpenSettlementModal = (record: LendBorrow) => {
    setRecordToSettle(record);
    setSettlementModalOpen(true);
  };

  const handleCloseSettlementModal = () => {
    setSettlementModalOpen(false);
    setRecordToSettle(null);
  };

  // Handle delete confirmation modal
  const handleOpenDeleteConfirmation = (recordId: string) => {
    const record = lendBorrowRecords.find(r => r.id === recordId);
    setDeleteConfirmationModal({ isOpen: true, record: record || null });
  };

  const handleCloseDeleteConfirmation = () => {
    setDeleteConfirmationModal({ isOpen: false, record: null });
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmationModal.record) {
      await handleDeleteRecord(deleteConfirmationModal.record.id);
      handleCloseDeleteConfirmation();
    }
  };

  const handleSettlementSubmit = async (accountId: string) => {
    if (recordToSettle) {
      await handleSettle(recordToSettle, accountId);
      handleCloseSettlementModal();
    }
  };

  // Check if a record can be deleted
  const canDeleteRecord = (record: LendBorrow) => {
    // Settled records cannot be deleted
    if (record.status === 'settled') {
      return false;
    }
    
    // Account-linked records cannot be deleted
    if (record.account_id) {
      return false;
    }
    
    return true;
  };

  // Format currency
  const formatCurrency = (amount: number, currency: string) => {
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${amount.toLocaleString()}`;
  };

  // Get record type color
  const getRecordTypeColor = (type: string) => {
    switch (type) {
      case 'lend':
        return 'bg-green-100 text-green-800';
      case 'borrow':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get record status color
  const getRecordStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'settled':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get currency options from accounts (like transactions page)
  const accountCurrencies = Array.from(new Set(accounts.map(a => a.currency)));
  const currencyOptions = React.useMemo(() => {
    if (profile?.selected_currencies && profile.selected_currencies.length > 0) {
      return accountCurrencies.filter(c => profile.selected_currencies?.includes?.(c));
    }
    return accountCurrencies;
  }, [profile?.selected_currencies, accountCurrencies]);

  // Set default currency when component loads
  useEffect(() => {
    if (currencyOptions.length > 0 && !tableFilters.currency) {
      const defaultCurrency = profile?.local_currency || currencyOptions[0];
      setTableFilters(prev => ({ ...prev, currency: defaultCurrency }));
    }
  }, [currencyOptions, profile?.local_currency]);

  // Update currency when profile changes
  useEffect(() => {
    if (profile?.local_currency && !tableFilters.currency) {
      setTableFilters(prev => ({ ...prev, currency: profile.local_currency || '' }));
    }
  }, [profile?.local_currency]);

  // Sync tempFilters with tableFilters when mobile filter modal opens
  useEffect(() => {
    if (showMobileFilterMenu) {
      setTempFilters(tableFilters);
    }
  }, [showMobileFilterMenu, tableFilters]);

  // Advanced analytics calculations
  const currentAnalytics = useMemo(() => {
    const activeRecords = filteredRecords.filter(r => r.status === 'active');
    const settledRecords = filteredRecords.filter(r => r.status === 'settled');
    const overdueRecords = filteredRecords.filter(r => r.status === 'overdue');
    const lendRecords = filteredRecords.filter(r => r.type === 'lend');
    const borrowRecords = filteredRecords.filter(r => r.type === 'borrow');
    
    // Calculate overdue records (active records past due date)
    const now = new Date();
    const actuallyOverdueRecords = activeRecords.filter(record => {
      const dueDate = record.due_date ? new Date(record.due_date) : null;
      return dueDate && dueDate < now;
    });
    
    // Calculate total amounts
    const totalLentAmount = lendRecords.reduce((sum, record) => sum + record.amount, 0);
    const totalBorrowedAmount = borrowRecords.reduce((sum, record) => sum + record.amount, 0);
    const outstandingLentAmount = activeRecords.filter(r => r.type === 'lend').reduce((sum, r) => sum + r.amount, 0);
    const outstandingBorrowedAmount = activeRecords.filter(r => r.type === 'borrow').reduce((sum, r) => sum + r.amount, 0);
    const totalOverdueAmount = actuallyOverdueRecords.reduce((sum, record) => sum + record.amount, 0);
    
    // Get currency from first record or default to USD
    const currency = filteredRecords[0]?.currency || 'USD';
    
    return {
      total_lent: totalLentAmount,
      total_borrowed: totalBorrowedAmount,
      outstanding_lent: outstandingLentAmount,
      outstanding_borrowed: outstandingBorrowedAmount,
      overdue_count: actuallyOverdueRecords.length,
      overdue_amount: totalOverdueAmount,
      currency: currency
    };
  }, [filteredRecords]);

  // Lifetime totals strictly by selected currency (unaffected by other filters)
  const lifetimeTotalsByCurrency = useMemo(() => {
    const currencyFiltered = (lendBorrowRecords || []).filter(record => record.currency === tableFilters.currency);
    const totals = currencyFiltered.reduce(
      (acc, record) => {
        if (record.type === 'lend') acc.lent += record.amount || 0;
        if (record.type === 'borrow') acc.borrowed += record.amount || 0;
        acc.count += 1;
        return acc;
      },
      { lent: 0, borrowed: 0, count: 0 }
    );
    return totals;
  }, [lendBorrowRecords, tableFilters.currency]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="space-y-6 animate-fade-in">
          <div className="space-y-6">
            {/* Enhanced skeleton for lend & borrow page */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 pb-[13px] lg:pb-0 relative overflow-hidden">
              {/* Shimmer effect for the entire container */}
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
              
              {/* Filters skeleton */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 relative z-10">
                <LendBorrowFiltersSkeleton />
              </div>
              
              {/* Summary cards skeleton */}
              <div className="p-4 relative z-10">
                <LendBorrowSummaryCardsSkeleton />
              </div>
              
              {/* Responsive skeleton - Desktop table, Mobile cards */}
              <div className="hidden md:block p-4 relative z-10">
                <LendBorrowTableSkeleton rows={6} />
              </div>
              <div className="md:hidden relative z-10">
                <LendBorrowCardSkeleton count={4} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show upgrade prompt for free users
  if (!isPremium) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Handshake className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Lent & Borrow Tracking
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Track loans and borrowings with detailed analytics. This feature is available for Premium users only.
          </p>
          <button
            onClick={() => window.location.href = '/settings?tab=plans-usage'}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors"
          >
            Upgrade to Premium
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Main Content Container - Following AccountsView Structure */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 pb-[13px] lg:pb-0">
        {/* Filter Section - Exact copy from AccountsView */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap md:flex-nowrap items-center w-full" style={{ marginBottom: 0 }}>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {/* Search Input */}
              <div>
                <div className="relative">
                  <Search className={`absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 ${tableFilters.search ? 'text-blue-500' : 'text-gray-400'}`} />
                  <input
                    type="text"
                    value={tableFilters.search}
                    onChange={(e) => setTableFilters({ ...tableFilters, search: e.target.value })}
                    className={`w-full pl-8 pr-2 py-1.5 text-[13px] h-8 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 transition-colors ${
                      tableFilters.search 
                        ? 'border-blue-300 dark:border-blue-600' 
                        : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                    }`}
                    style={tableFilters.search ? { background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' } : {}}
                    placeholder="Search records..."
                  />
                </div>
              </div>

              {/* Selection Filter */}
              {hasSelection && selectedRecord && (
                <SelectionFilter
                  label="Selected"
                  value={selectedRecord.person_name || 'Record'}
                  onClear={clearSelection}
                />
              )}

              {/* Mobile Filter Button */}
              <div className="md:hidden">
                <div className="relative" ref={mobileFilterMenuRef}>
                  <button
                    onClick={() => setShowMobileFilterMenu(v => !v)}
                    className={`px-2 py-1.5 text-[13px] h-8 w-8 rounded-md transition-colors flex items-center justify-center ${
                      (tableFilters.currency || tableFilters.type !== 'all' || tableFilters.status !== 'active')
                        ? 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                    style={(tableFilters.currency || tableFilters.type !== 'all' || tableFilters.status !== 'active') ? { background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' } : {}}
                    title="Filters"
                  >
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Mobile Widget Restore Button */}
              {isLendBorrowWidgetHidden && (
                <div className="md:hidden">
                  <button
                    onClick={handleShowLendBorrowWidgetFromPage}
                    disabled={isRestoringWidget}
                    className="px-2 py-1.5 text-[13px] h-8 w-8 rounded-md transition-colors flex items-center justify-center text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' }}
                    title="Show Lend & Borrow Widget on Dashboard"
                    aria-label="Show Lend & Borrow Widget on Dashboard"
                  >
                    {isRestoringWidget ? (
                      <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Eye className="w-4 h-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              )}

              {/* Mobile Add Record Button */}
              <div className="md:hidden">
                <button
                  onClick={() => {
                    setEditingRecord(null);
                    setShowLendBorrowForm(true);
                  }}
                  className="bg-gradient-primary text-white px-2 py-1.5 rounded-md hover:bg-gradient-primary-hover transition-colors flex items-center justify-center text-[13px] h-8 w-8"
                  title="Add Record"
                  aria-label="Add Record"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Mobile Clear Filters Button */}
              <div className="md:hidden">
                {(tableFilters.search || (tableFilters.currency && tableFilters.currency !== (profile?.local_currency || currencyOptions[0] || '')) || tableFilters.type !== 'all' || tableFilters.status !== 'active' || (tableFilters.dateRange.start && tableFilters.dateRange.end)) && (
                  <button
                    onClick={() => setTableFilters({ search: '', currency: profile?.local_currency || currencyOptions[0] || '', type: 'all', status: 'active', dateRange: { start: '', end: '' } })}
                    className="text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center"
                    title="Clear all filters"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Desktop Filters */}
              <div className="hidden md:flex items-center gap-x-2">
                {/* Currency Filter */}
                <div>
                  <div className="relative" ref={currencyMenuRef}>
                    <button
                      onClick={() => setShowCurrencyMenu(v => !v)}
                      className={`px-3 py-1.5 pr-2 text-[13px] h-8 rounded-md transition-colors flex items-center space-x-1.5 ${
                        tableFilters.currency 
                          ? 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                      style={tableFilters.currency ? { background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' } : {}}
                    >
                      <span>{tableFilters.currency || profile?.local_currency || 'Select Currency'}</span>
                      <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showCurrencyMenu && (
                      <div className="absolute left-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                        {currencyOptions.map(currency => (
                          <button
                            key={currency}
                            onClick={() => { setTableFilters({ ...tableFilters, currency }); setShowCurrencyMenu(false); }}
                            className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${tableFilters.currency === currency ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' : ''}`}
                          >
                            {currency}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Type Filter */}
                <div>
                  <div className="relative" ref={typeMenuRef}>
                    <button
                      onClick={() => setShowTypeMenu(v => !v)}
                      className={`px-3 py-1.5 pr-2 text-[13px] h-8 rounded-md transition-colors flex items-center space-x-1.5 ${
                        tableFilters.type !== 'all' 
                          ? 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                      style={tableFilters.type !== 'all' ? { background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' } : {}}
                    >
                      <span>{tableFilters.type === 'all' ? 'All Types' : tableFilters.type === 'lend' ? 'Lend' : 'Borrow'}</span>
                      <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showTypeMenu && (
                      <div className="absolute left-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                        <button
                          onClick={() => { setTableFilters({ ...tableFilters, type: 'all' }); setShowTypeMenu(false); }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${tableFilters.type === 'all' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' : ''}`}
                        >
                          All Types
                        </button>
                        <button
                          onClick={() => { setTableFilters({ ...tableFilters, type: 'lend' }); setShowTypeMenu(false); }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${tableFilters.type === 'lend' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' : ''}`}
                        >
                          Lend
                        </button>
                        <button
                          onClick={() => { setTableFilters({ ...tableFilters, type: 'borrow' }); setShowTypeMenu(false); }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${tableFilters.type === 'borrow' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' : ''}`}
                        >
                          Borrow
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Filter */}
                <div className="relative" ref={statusMenuRef}>
                  <button
                    onClick={() => setShowStatusMenu(v => !v)}
                    className={`px-3 py-1.5 pr-2 text-[13px] h-8 rounded-md transition-colors flex items-center space-x-1.5 ${
                      tableFilters.status === 'active' 
                        ? 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                    style={tableFilters.status === 'active' ? { background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' } : {}}
                  >
                    <span>{tableFilters.status === 'all' ? 'All Status' : tableFilters.status === 'active' ? 'Active' : tableFilters.status === 'settled' ? 'Settled' : 'Overdue'}</span>
                    <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showStatusMenu && (
                    <div className="absolute left-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                      <button
                        onClick={() => { setTableFilters({ ...tableFilters, status: 'all' }); setShowStatusMenu(false); }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${tableFilters.status === 'all' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' : ''}`}
                      >
                        All Status
                      </button>
                      <button
                        onClick={() => { setTableFilters({ ...tableFilters, status: 'active' }); setShowStatusMenu(false); }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${tableFilters.status === 'active' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' : ''}`}
                      >
                        Active
                      </button>
                      <button
                        onClick={() => { setTableFilters({ ...tableFilters, status: 'settled' }); setShowStatusMenu(false); }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${tableFilters.status === 'settled' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' : ''}`}
                      >
                        Settled
                      </button>
                    </div>
                  )}
                </div>

                {/* Date Range Filter */}
                <div>
                  <div className="relative" ref={presetDropdownRef}>
                    <button
                      className={`px-3 py-1.5 pr-2 text-[13px] h-8 rounded-md transition-colors flex items-center space-x-1.5 ${
                        tableFilters.dateRange.start && tableFilters.dateRange.end 
                          ? 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
                      } ${showPresetDropdown ? 'ring-2 ring-blue-500' : ''}`}
                      style={tableFilters.dateRange.start && tableFilters.dateRange.end ? { background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' } : {}}
                      onClick={() => setShowPresetDropdown(v => !v)}
                      type="button"
                    >
                      <span>{getDateRangeLabel()}</span>
                      <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showPresetDropdown && (
                      <div className="absolute left-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 min-w-[140px]">
                        <button
                          onClick={() => handlePresetRange('today')}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                        >
                          Today
                        </button>
                        <button
                          onClick={() => handlePresetRange('thisWeek')}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                        >
                          This Week
                        </button>
                        <button
                          onClick={() => handlePresetRange('thisMonth')}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                        >
                          This Month
                        </button>
                        <button
                          onClick={() => handlePresetRange('lastMonth')}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                        >
                          Last Month
                        </button>
                        <button
                          onClick={() => handlePresetRange('thisYear')}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                        >
                          This Year
                        </button>
                        <button
                          onClick={() => handlePresetRange('allTime')}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                        >
                          All Time
                        </button>
                        <div className="border-t border-gray-200 dark:border-gray-700">
                          <button
                            onClick={() => handlePresetRange('custom')}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                          >
                            Custom Range
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
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
                              onChange={date => setCustomStart(date ? date.toISOString().slice(0, 10) : '')}
                              selectsStart
                              startDate={customStart ? new Date(customStart) : null}
                              endDate={customEnd ? new Date(customEnd) : null}
                              maxDate={customEnd ? new Date(customEnd) : undefined}
                              dateFormat="MM/dd/yyyy"
                              className="bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded w-full font-sans text-gray-900 dark:text-gray-100"
                              placeholderText="Select start date"
                              isClearable
                              showPopperArrow={false}
                              popperPlacement="bottom"
                              autoComplete="off"
                            />
                          </div>
                          <div className="flex flex-col">
                            <label className="text-xs text-gray-600 dark:text-gray-400 mb-1">End Date</label>
                            <DatePicker
                              selected={customEnd ? new Date(customEnd) : null}
                              onChange={date => setCustomEnd(date ? date.toISOString().slice(0, 10) : '')}
                              selectsEnd
                              startDate={customStart ? new Date(customStart) : null}
                              endDate={customEnd ? new Date(customEnd) : null}
                              minDate={customStart ? new Date(customStart) : undefined}
                              dateFormat="MM/dd/yyyy"
                              className="bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded w-full font-sans text-gray-900 dark:text-gray-100"
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
                            className="flex-1 py-2 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-100"
                            onClick={() => setShowCustomModal(false)}
                          >
                            Cancel
                          </button>
                          <button
                            className="flex-1 py-2 rounded bg-gradient-primary hover:bg-gradient-primary-hover text-white disabled:opacity-50"
                            disabled={!!(customStart && customEnd && new Date(customEnd) < new Date(customStart))}
                            onClick={() => {
                              setTableFilters(f => ({ ...f, dateRange: {
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

                {/* Clear Filters */}
                {(tableFilters.search || (tableFilters.currency && tableFilters.currency !== (profile?.local_currency || currencyOptions[0] || '')) || tableFilters.type !== 'all' || tableFilters.status !== 'active' || (tableFilters.dateRange.start && tableFilters.dateRange.end)) && (
                  <button
                    onClick={() => setTableFilters({ search: '', currency: profile?.local_currency || currencyOptions[0] || '', type: 'all', status: 'active', dateRange: { start: '', end: '' } })}
                    className="text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center"
                    title="Clear all filters"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex-grow"></div>
            <div className="hidden md:flex items-center gap-2">
              {isLendBorrowWidgetHidden && (
                  <button
                    onClick={handleShowLendBorrowWidgetFromPage}
                    disabled={isRestoringWidget}
                    className="bg-gray-100 text-gray-700 px-3 py-1.5 h-8 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Show Lend & Borrow Widget on Dashboard"
                    aria-label="Show Lend & Borrow Widget on Dashboard"
                  >
                    {isRestoringWidget ? (
                      <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                  </button>
                )}
                <button
                  data-tour="add-record"
                  onClick={() => {
                    setEditingRecord(null);
                    setShowLendBorrowForm(true);
                  }}
                  className="bg-gradient-primary text-white px-3 py-1.5 h-8 rounded-md hover:bg-gradient-primary-hover transition-colors flex items-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed text-[13px]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Record</span>
                </button>
            </div>
          </div>
        </div>

        {/* Summary Cards - Following AccountsView Pattern */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 p-3">
          {(() => {
            const activeRecords = filteredRecords.filter(r => r.status === 'active');
            const settledRecords = filteredRecords.filter(r => r.status === 'settled');
            const overdueRecords = filteredRecords.filter(r => r.status === 'overdue');
            const lendRecords = filteredRecords.filter(r => r.type === 'lend');
            const borrowRecords = filteredRecords.filter(r => r.type === 'borrow');
            
            // Calculate overdue records (active records past due date)
            const now = new Date();
            const actuallyOverdueRecords = activeRecords.filter(record => {
              const dueDate = record.due_date ? new Date(record.due_date) : null;
              return dueDate && dueDate < now;
            });
            
            // Calculate total amounts
            const totalLentAmount = lendRecords.reduce((sum, record) => sum + record.amount, 0);
            const totalBorrowedAmount = borrowRecords.reduce((sum, record) => sum + record.amount, 0);
            const totalOverdueAmount = actuallyOverdueRecords.reduce((sum, record) => sum + record.amount, 0);
            
            // Get currency from first record or default to USD
            const currency = filteredRecords[0]?.currency || 'USD';
            const currencySymbol = {
              USD: '$', BDT: '৳', EUR: '€', GBP: '£', JPY: '¥', ALL: 'L', INR: '₹', CAD: '$', AUD: '$'
            }[currency] || currency;
            
            // Format amounts
            const formatAmount = (amount: number) => `${currencySymbol}${amount.toLocaleString()}`;
            
            // Calculate type breakdown
            const typeBreakdown = filteredRecords.reduce((acc, record) => {
              acc[record.type] = (acc[record.type] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);
            
            const typeInsight = Object.entries(typeBreakdown)
              .map(([type, count]) => `${count} ${type}`)
              .join(', ');
            
            // Calculate status breakdown
            const statusBreakdown = filteredRecords.reduce((acc, record) => {
              acc[record.status] = (acc[record.status] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);
            
            const statusInsight = Object.entries(statusBreakdown)
              .map(([status, count]) => `${count} ${status}`)
              .join(', ');
            
            return (
              <>
                {/* <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 px-2">
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Active Records</p>
                      <p className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" style={{ fontSize: '1.2rem' }}>{activeRecords.length}</p>
                      <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: '11px' }}>
                        {typeInsight || 'No records'}
                      </p>
                    </div>
                    <Handshake className="text-blue-600 w-5 h-5" />
                  </div>
                </div> */}
                
                {/* <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 px-2">
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Settled</p>
                      <p className="font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent" style={{ fontSize: '1.2rem' }}>{settledRecords.length}</p>
                      <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: '11px' }}>
                        {Math.round((settledRecords.length / filteredRecords.length) * 100) || 0}% completion rate
                      </p>
                    </div>
                    <CheckCircle className="text-green-600 w-5 h-5" />
                  </div>
                </div> */}
                
                {/* <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 px-2">
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Overdue</p>
                      <p className="font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent" style={{ fontSize: '1.2rem' }}>{actuallyOverdueRecords.length}</p>
                      <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: '11px' }}>
                        {actuallyOverdueRecords.length > 0 ? `${formatAmount(totalOverdueAmount)} overdue` : 'All up to date'}
                      </p>
                    </div>
                    <AlertTriangle className="text-red-600 w-5 h-5" />
                  </div>
                </div> */}
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 px-2">
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Lent</p>
                      <p className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" style={{ fontSize: '1.2rem' }}>{formatAmount(totalLentAmount)}</p>
                      <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: '11px' }}>
                        To {lendRecords.length} people
                      </p>
                    </div>
                    <span className="text-blue-600" style={{ fontSize: '1.2rem' }}>{getCurrencySymbol(tableFilters.currency)}</span>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 px-2">
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Borrowed</p>
                      <p className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" style={{ fontSize: '1.2rem' }}>{formatAmount(totalBorrowedAmount)}</p>
                      <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: '11px' }}>
                        From {borrowRecords.length} people
                      </p>
                    </div>
                    <span className="text-blue-600" style={{ fontSize: '1.2rem' }}>{getCurrencySymbol(tableFilters.currency)}</span>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 px-2">
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Outstanding</p>
                      <p className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" style={{ fontSize: '1.2rem' }}>{formatAmount(totalLentAmount - totalBorrowedAmount)}</p>
                      <p className={`${totalLentAmount > totalBorrowedAmount ? 'text-green-600 dark:text-green-400' : totalBorrowedAmount > totalLentAmount ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`} style={{ fontSize: '11px' }}>
                        {totalLentAmount > totalBorrowedAmount ? 'Net Lender' : totalBorrowedAmount > totalLentAmount ? 'Net Borrower' : 'Balanced'}
                      </p>
                    </div>
                    <Clock className="text-blue-600" style={{ fontSize: '1.2rem', width: '1.2rem', height: '1.2rem' }} />
                  </div>
                </div>
              </>
            );
          })()}
        </div>

        {/* Table Section - Following AccountsView Pattern */}
        <div className="overflow-x-auto lg:rounded-b-xl" style={{ borderBottomLeftRadius: '0.75rem', borderBottomRightRadius: '0.75rem' }}>
          {/* Desktop Table View */}
          <div className="hidden lg:block max-h-[500px] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900 text-[14px]">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => handleSort('person_name')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Person</span>
                      {getSortIcon('person_name')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => handleSort('type')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Type</span>
                      {getSortIcon('type')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center justify-center space-x-1">
                      <span>Amount</span>
                      {getSortIcon('amount')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center justify-center space-x-1">
                      <span>Status</span>
                      {getSortIcon('status')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => handleSort('due_date')}
                  >
                    <div className="flex items-center justify-center space-x-1">
                      <span>Due Date</span>
                      {getSortIcon('due_date')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                        <Handshake className="w-12 h-12 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No records found</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                        Start tracking your lending and borrowing by adding your first record
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => {
                    const now = new Date();
                    const dueDate = record.due_date ? new Date(record.due_date) : null;
                    const daysDiff = dueDate ? Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;
                    const isOverdue = record.status === 'active' && daysDiff < 0;
                    
                    const isSelected = selectedId === record.id;
                    const isFromSearchSelection = isFromSearch && isSelected;
                    
                    return (
                      <React.Fragment key={record.id}>
                        <tr 
                          id={`record-${record.id}`}
                          ref={isSelected ? selectedRecordRef : null}
                          className={`hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${
                            isSelected 
                              ? isFromSearchSelection 
                                ? 'ring-2 ring-blue-500 ring-opacity-50 bg-blue-50 dark:bg-blue-900/20' 
                                : 'ring-2 ring-blue-500 ring-opacity-50'
                              : ''
                          }`} 
                          onClick={() => toggleRowExpansion(record.id)}
                        >
                          <td className="px-6 py-[0.5rem]">
                            <div className="flex items-center">
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {record.person_name}
                                </div>
                              </div>
                              <div className="ml-2">
                                <svg 
                                  className={`w-4 h-4 text-gray-400 transition-transform ${isRowExpanded(record.id) ? 'rotate-90' : ''}`} 
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-[0.5rem]">
                            <span className={`inline-flex items-center justify-center text-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRecordTypeColor(record.type)}`}>
                              {record.type === 'lend' ? 'Lend' : 'Borrow'}
                            </span>
                          </td>
                          <td className="px-6 py-[0.5rem] text-center">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {formatCurrency(record.amount, record.currency)}
                            </span>
                          </td>
                          <td className="px-6 py-[0.5rem] text-center">
                            <span className={`inline-flex items-center justify-center text-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              isOverdue ? 'bg-red-100 text-red-800' : getRecordStatusColor(record.status)
                            }`}>
                              {isOverdue ? 'Overdue' : record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-[0.5rem] text-center">
                            <div className="text-sm text-gray-900 dark:text-white font-medium">
                              {new Date(record.due_date).toLocaleDateString()}
                            </div>
                            {record.due_date && (
                              <div className={`text-xs font-medium mt-1 ${
                                record.status === 'settled' 
                                  ? 'text-green-600 dark:text-green-400' 
                                  : daysDiff < 0 
                                    ? 'text-red-600 dark:text-red-400' 
                                    : daysDiff <= 7 
                                      ? 'text-orange-600 dark:text-orange-400' 
                                      : 'text-blue-600 dark:text-blue-400'
                              }`}>
                                {record.status === 'settled' 
                                  ? 'Settled' 
                                  : daysDiff < 0 
                                    ? `${Math.abs(daysDiff)} days overdue` 
                                    : daysDiff === 0 
                                      ? 'Due today' 
                                      : daysDiff <= 7 
                                        ? `${daysDiff} days left` 
                                        : `${daysDiff} days left`}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-[0.5rem] text-center">
                            <div className="flex items-center justify-center space-x-1">
                              {/* Info/Edit button based on record status */}
                              {record.status === 'settled' ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSettledRecordInfoModal({ isOpen: true, record });
                                  }}
                                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                  title="Settled record info"
                                >
                                  <Info className="w-4 h-4" />
                                </button>
                              ) : (record.account_id && record.affect_account_balance) ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSettledRecordInfoModal({ isOpen: true, record });
                                  }}
                                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                  title="Account-linked record info"
                                >
                                  <Info className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditRecord(record);
                                  }}
                                  className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                                  title="Edit"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              )}
                              
                              {/* Settlement button for active and overdue records */}
                              {(record.status === 'active' || record.status === 'overdue') && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenSettlementModal(record);
                                  }}
                                  className="p-1 text-gray-400 hover:text-purple-600 transition-colors"
                                  title="Settle"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}
                              
                              {/* Delete button - only show if record can be deleted */}
                              {canDeleteRecord(record) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenDeleteConfirmation(record.id);
                                  }}
                                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        
                        {/* Expanded Row Content */}
                        {isRowExpanded(record.id) && (
                          <tr>
                            <td colSpan={6} className="px-6 py-4 bg-gray-50 dark:bg-gray-800">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* Record Details */}
                                <div className="space-y-2">
                                  <h4 className="font-semibold text-gray-900 dark:text-white">Record Details</h4>
                                  <div className="space-y-1 text-sm" style={{ fontSize: '12px' }}>
                                    <div style={{ marginTop: 0 }}><span className="font-medium">Type:</span> 
                                      <span className={`ml-1 inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getRecordTypeColor(record.type)}`}>
                                        {record.type === 'lend' ? 'Lend' : 'Borrow'}
                                      </span>
                                    </div>
                                    <div style={{ marginTop: 0 }}><span className="font-medium">Amount:</span> {formatCurrency(record.amount, record.currency)}</div>
                                    <div style={{ marginTop: 0 }}><span className="font-medium">Currency:</span> {record.currency}</div>
                                    <div style={{ marginTop: 0 }}><span className="font-medium">Date:</span> {record.created_at ? (isNaN(new Date(record.created_at).getTime()) ? 'No date' : format(new Date(record.created_at), 'MMM dd, yyyy')) : 'No date'}</div>
                                    <div style={{ marginTop: 0 }}><span className="font-medium">Due Date:</span> {record.due_date ? (isNaN(new Date(record.due_date).getTime()) ? 'No date' : format(new Date(record.due_date), 'MMM dd, yyyy')) : 'No date'}</div>
                                  </div>
                                </div>

                                {/* Status Information */}
                                <div className="space-y-2">
                                  <h4 className="font-semibold text-gray-900 dark:text-white">Status Information</h4>
                                  <div className="space-y-1 text-sm" style={{ fontSize: '12px' }}>
                                    <div style={{ marginTop: 0 }}><span className="font-medium">Status:</span> 
                                      <span className={`ml-1 inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                        isOverdue ? 'bg-red-100 text-red-800' : getRecordStatusColor(record.status)
                                      }`}>
                                        {isOverdue ? 'Overdue' : record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                                      </span>
                                    </div>
                                    {record.due_date && record.status !== 'settled' && (
                                      <div style={{ marginTop: 0 }} className={`font-medium ${
                                        daysDiff < 0 
                                          ? 'text-red-600 dark:text-red-400' 
                                          : daysDiff <= 7 
                                            ? 'text-orange-600 dark:text-orange-400' 
                                            : 'text-blue-600 dark:text-blue-400'
                                      }`}>
                                        {daysDiff < 0 ? `${Math.abs(daysDiff)} days overdue` : 
                                         daysDiff > 0 ? `${daysDiff} days left` : 
                                         'Due today'}
                                      </div>
                                    )}
                                    {record.partial_return_amount > 0 && (
                                      <div style={{ marginTop: 0 }}><span className="font-medium">Partial Return:</span> {formatCurrency(record.partial_return_amount, record.currency)}</div>
                                    )}
                                    {record.partial_return_date && !isNaN(new Date(record.partial_return_date).getTime()) && (
                                      <div style={{ marginTop: 0 }}><span className="font-medium">Partial Return Date:</span> {new Date(record.partial_return_date).toLocaleDateString()}</div>
                                    )}
                                  </div>
                                </div>

                                {/* Account Information */}
                                <div className="space-y-2">
                                  <h4 className="font-semibold text-gray-900 dark:text-white">Account Information</h4>
                                  <div className="space-y-1 text-sm" style={{ fontSize: '12px' }}>
                                    {record.affect_account_balance && record.account_id ? (
                                      <>
                                        {(() => {
                                          const account = accounts.find(acc => acc.id === record.account_id);
                                          return account ? (
                                            <>
                                              <div style={{ marginTop: 0 }}><span className="font-medium">Account:</span> {account.name}</div>
                                              <div style={{ marginTop: 0 }}><span className="font-medium">Balance:</span> {formatCurrency(account.calculated_balance || 0, account.currency)}</div>
                                            </>
                                          ) : (
                                            <div style={{ marginTop: 0 }} className="text-gray-500 dark:text-gray-400">Account not found</div>
                                          );
                                        })()}
                                      </>
                                    ) : (
                                      <div style={{ marginTop: 0 }} className="text-gray-500 dark:text-gray-400">Record Only</div>
                                    )}
                                  </div>
                                </div>

                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile/Tablet Stacked Table View */}
        <div className="lg:hidden max-h-[500px] overflow-y-auto">
          <div className="space-y-4 px-2.5">
            {filteredRecords.length === 0 ? (
              <div className="py-16 text-center">
                <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <Handshake className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No records found</h3>
                <p className="text-gray-500 dark:text-gray-400">Start tracking your lending and borrowing by adding your first record</p>
              </div>
            ) : (
              filteredRecords.map((record) => (
                <div
                  key={record.id}
                  id={`record-${record.id}`}
                  ref={selectedId === record.id ? selectedRecordRef : null}
                  className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-all duration-200 ${
                    selectedId === record.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  {/* Card Header - Person Name and Type Badge */}
                  <div className="flex items-center justify-between p-3 pb-2">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{record.person_name}</div>
                    </div>
                    <div>
                      <span className={`inline-flex items-center justify-center text-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        record.type === 'lend' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {record.type === 'lend' ? 'Lend' : 'Borrow'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Card Body - Amount and Status */}
                  <div className="px-3 pb-2">
                    <div className="text-base font-bold text-gray-900 dark:text-white mb-1">
                      {formatCurrency(record.amount, record.currency)}
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        record.status === 'active' 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                          : record.status === 'settled'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                      {record.status === 'active' && record.due_date && (
                        <span className="text-xs text-orange-600">
                          {(() => {
                            const dueDate = record.due_date ? new Date(record.due_date) : null;
                            const today = new Date();
                            const diffTime = dueDate ? dueDate.getTime() - today.getTime() : 0;
                            const diffDays = dueDate ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 0;
                            if (diffDays < 0) {
                              return `${Math.abs(diffDays)} days overdue`;
                            } else if (diffDays === 0) {
                              return 'Due today';
                            } else {
                              return `${diffDays} days left`;
                            }
                          })()}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Card Footer - Due Date and Actions */}
                  <div className="flex items-center justify-between px-3 pb-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {record.due_date && (
                        <div>Due: {new Date(record.due_date).toLocaleDateString()}</div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {/* Info/Edit button based on record status */}
                      {record.status === 'settled' ? (
                        <button
                          onClick={() => setSettledRecordInfoModal({ isOpen: true, record })}
                          className="p-1.5 text-gray-500 dark:text-gray-400 rounded-md transition-colors hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900/20"
                          title="Settled record info"
                        >
                          <Info className="w-3.5 h-3.5" />
                        </button>
                      ) : (record.account_id && record.affect_account_balance) ? (
                        <button
                          onClick={() => setSettledRecordInfoModal({ isOpen: true, record })}
                          className="p-1.5 text-gray-500 dark:text-gray-400 rounded-md transition-colors hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900/20"
                          title="Account-linked record info"
                        >
                          <Info className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEditRecord(record)}
                          className="p-1.5 text-gray-500 dark:text-gray-400 rounded-md transition-colors hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900/20"
                          title="Edit"
                        >
                          <Pen className="w-3.5 h-3.5" />
                        </button>
                      )}
                      
                      {/* Settlement button for active and overdue records */}
                      {(record.status === 'active' || record.status === 'overdue') && (
                        <button
                          onClick={() => handleOpenSettlementModal(record)}
                          className="p-1.5 text-gray-500 dark:text-gray-400 rounded-md transition-colors hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900/20"
                          title="Settle"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      
                      {/* Delete button - only show if record can be deleted */}
                      {canDeleteRecord(record) && (
                        <button
                          onClick={() => handleOpenDeleteConfirmation(record.id)}
                          className="p-1.5 text-gray-500 dark:text-gray-400 rounded-md transition-colors hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => toggleMobileRecordExpansion(record.id)}
                        className="p-1.5 text-gray-500 dark:text-gray-400 rounded-md transition-colors hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900/20"
                        title="View details"
                      >
                        <svg 
                          className={`w-3.5 h-3.5 transition-transform ${isMobileRecordExpanded(record.id) ? 'rotate-90' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m9 18 6-6-6-6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {/* Expandable Content */}
                  {isMobileRecordExpanded(record.id) && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      {/* Record Details */}
                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white">Record Details</h4>
                        <div className="space-y-1 text-sm" style={{ fontSize: '12px' }}>
                          <div style={{ marginTop: 0 }}><span className="font-medium">Type:</span> {record.type === 'lend' ? 'Lend' : 'Borrow'}</div>
                          <div style={{ marginTop: 0 }}><span className="font-medium">Amount:</span> {formatCurrency(record.amount, record.currency)}</div>
                          <div style={{ marginTop: 0 }}><span className="font-medium">Currency:</span> {record.currency}</div>
                          <div style={{ marginTop: 0 }}><span className="font-medium">Date:</span> {record.created_at ? (isNaN(new Date(record.created_at).getTime()) ? 'No date' : new Date(record.created_at).toLocaleDateString()) : 'No date'}</div>
                          <div style={{ marginTop: 0 }}><span className="font-medium">Due Date:</span> {record.due_date ? (isNaN(new Date(record.due_date).getTime()) ? 'No date' : new Date(record.due_date).toLocaleDateString()) : 'No date'}</div>
                        </div>
                      </div>

                      {/* Account Information */}
                      <div className="space-y-2 mt-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white">Account Information</h4>
                        <div className="space-y-1 text-sm" style={{ fontSize: '12px' }}>
                          {record.affect_account_balance && record.account_id ? (
                            <>
                              {(() => {
                                const account = accounts.find(acc => acc.id === record.account_id);
                                return account ? (
                                  <>
                                    <div style={{ marginTop: 0 }}><span className="font-medium">Account:</span> {account.name}</div>
                                    <div style={{ marginTop: 0 }}><span className="font-medium">Balance:</span> {formatCurrency(account.calculated_balance || 0, account.currency)}</div>
                                  </>
                                ) : (
                                  <div style={{ marginTop: 0 }} className="text-gray-500 dark:text-gray-400">Account not found</div>
                                );
                              })()}
                            </>
                          ) : (
                            <div style={{ marginTop: 0 }} className="text-gray-500 dark:text-gray-400">Record Only</div>
                          )}
                        </div>
                      </div>

                      {/* Status Information */}
                      <div className="space-y-2 mt-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white">Status Information</h4>
                        <div className="space-y-1 text-sm" style={{ fontSize: '12px' }}>
                          <div style={{ marginTop: 0 }}><span className="font-medium">Status:</span> {record.status.charAt(0).toUpperCase() + record.status.slice(1)}</div>
                          {record.status === 'active' && record.due_date && (
                            <div style={{ marginTop: 0 }}>
                              <span className="font-medium">Days Remaining:</span> 
                              {(() => {
                                const dueDate = record.due_date ? new Date(record.due_date) : null;
                                const today = new Date();
                                const diffTime = dueDate ? dueDate.getTime() - today.getTime() : 0;
                                const diffDays = dueDate ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 0;
                                if (diffDays < 0) {
                                  return ` ${Math.abs(diffDays)} days overdue`;
                                } else if (diffDays === 0) {
                                  return ' Due today';
                                } else {
                                  return ` ${diffDays} days remaining`;
                                }
                              })()}
                            </div>
                          )}
                          {record.partial_return_amount > 0 && !isNaN(new Date(record.partial_return_date || '').getTime()) && (
                            <>
                              <div style={{ marginTop: 0 }}><span className="font-medium">Partial Return:</span> {formatCurrency(record.partial_return_amount, record.currency)}</div>
                              <div style={{ marginTop: 0 }}><span className="font-medium">Partial Return Date:</span> {record.partial_return_date ? new Date(record.partial_return_date).toLocaleDateString() : 'No date'}</div>
                              <div style={{ marginTop: 0 }}><span className="font-medium">Remaining Amount:</span> {formatCurrency(record.amount - record.partial_return_amount, record.currency)}</div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Forms and Modals */}
        {showLendBorrowForm && (
          <LendBorrowForm
            isOpen={showLendBorrowForm}
            onClose={() => {
              setShowLendBorrowForm(false);
              setEditingRecord(null);
            }}
            record={editingRecord || undefined}
            onSubmit={async (recordData) => {
              try {
                if (editingRecord) {
                  // Update existing record
                  await updateLendBorrowRecord(editingRecord.id, recordData as Partial<LendBorrow>);
                  toast.success('Record updated successfully!');
                } else {
                  // Add new record
                  await addLendBorrowRecord(recordData);
                  toast.success('Record added successfully!');
                }
                setShowLendBorrowForm(false);
                setEditingRecord(null);
              } catch (error) {
                console.error('Error saving record:', error);
                toast.error('Failed to save record. Please try again.');
              }
            }}
          />
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmationModal.isOpen && deleteConfirmationModal.record && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Delete Record
                  </h3>
                  <button
                    onClick={handleCloseDeleteConfirmation}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="mb-4">
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Are you sure you want to delete <strong>{deleteConfirmationModal.record.person_name}</strong>? This will update the account balance and cannot be undone.
                  </p>
                  
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Record Details:</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Person:</span>
                        <span className="text-gray-900 dark:text-white">{deleteConfirmationModal.record.person_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                        <span className="text-gray-900 dark:text-white">{formatCurrency(deleteConfirmationModal.record.amount, deleteConfirmationModal.record.currency)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Type:</span>
                        <span className="text-gray-900 dark:text-white">{deleteConfirmationModal.record.type === 'lend' ? 'Lend' : 'Borrow'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Status:</span>
                        <span className="text-gray-900 dark:text-white">{deleteConfirmationModal.record.status.charAt(0).toUpperCase() + deleteConfirmationModal.record.status.slice(1)}</span>
                      </div>
                      {deleteConfirmationModal.record.account_id && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Account:</span>
                          <span className="text-gray-900 dark:text-white">
                            {accounts.find(acc => acc.id === deleteConfirmationModal.record?.account_id)?.name || 'Unknown Account'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleCloseDeleteConfirmation}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                  >
                    Delete Record
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settlement Modal */}
        {settlementModalOpen && recordToSettle && (
          <SettlementModal
            record={recordToSettle}
            onClose={handleCloseSettlementModal}
            onSettle={handleSettlementSubmit}
            onRecordUpdated={fetchLendBorrowRecordsCallback}
          />
        )}

        {/* Settled Record Info Modal */}
        <SettledRecordInfoModal
          isOpen={settledRecordInfoModal.isOpen}
          onClose={() => setSettledRecordInfoModal({ isOpen: false, record: null })}
          record={settledRecordInfoModal.record}
        />

        {/* Mobile Filter Modal - Following AccountsView Pattern */}
        {showMobileFilterMenu && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black bg-opacity-50">
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
                        setTableFilters(tempFilters);
                        setShowMobileFilterMenu(false);
                      }}
                      className={`p-1 transition-colors ${
                        (tempFilters.currency || tempFilters.type !== 'all' || tempFilters.status !== 'active')
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
                        setTableFilters({ search: '', currency: '', type: 'all', status: 'active', dateRange: { start: '', end: '' } });
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
              
              {/* Type Filter */}
              <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Type</div>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTempFilters({ ...tempFilters, type: 'all' });
                    }}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                      tempFilters.type === 'all' 
                        ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200' 
                        : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTempFilters({ ...tempFilters, type: 'lend' });
                    }}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                      tempFilters.type === 'lend' 
                        ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200' 
                        : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    Lend
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTempFilters({ ...tempFilters, type: 'borrow' });
                    }}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                      tempFilters.type === 'borrow' 
                        ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200' 
                        : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    Borrow
                  </button>
                </div>
              </div>
              
              {/* Status Filter */}
              <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Status</div>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTempFilters({ ...tempFilters, status: 'active' });
                    }}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                      tempFilters.status === 'active' 
                        ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200' 
                        : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    Active
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTempFilters({ ...tempFilters, status: 'all' });
                    }}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                      tempFilters.status === 'all' 
                        ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200' 
                        : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTempFilters({ ...tempFilters, status: 'settled' });
                    }}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                      tempFilters.status === 'settled' 
                        ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200' 
                        : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    Settled
                  </button>
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

        {/* Summary Bar - Sticky on desktop, regular section on mobile */}
        <div className="hidden lg:block sticky bottom-0 left-0 right-0 z-30 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg" style={{ borderBottomLeftRadius: '0.75rem', borderBottomRightRadius: '0.75rem' }}>
          <div className="px-4 py-3">
            <div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">All Time Summary</span>
            </div>
            <div className="flex items-center text-sm">
              <div className="flex items-center gap-2 pr-4 border-r border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Lent:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(lifetimeTotalsByCurrency.lent, tableFilters.currency)}</span>
              </div>
              <div className="flex items-center gap-2 px-4 border-r border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Borrowed:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(lifetimeTotalsByCurrency.borrowed, tableFilters.currency)}</span>
              </div>
              <div className="flex items-center gap-2 pl-4">
                <span className="text-gray-600 dark:text-gray-400">Records:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{lifetimeTotalsByCurrency.count}</span>
              </div>
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
                <span className="text-gray-600 dark:text-gray-400">Lent</span>
                <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(lifetimeTotalsByCurrency.lent, tableFilters.currency)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Borrowed</span>
                <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(lifetimeTotalsByCurrency.borrowed, tableFilters.currency)}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Records</span>
                <span className="font-semibold text-gray-900 dark:text-white">{lifetimeTotalsByCurrency.count}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};