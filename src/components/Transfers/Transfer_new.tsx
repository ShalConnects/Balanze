import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Search, ChevronUp, ChevronDown, Filter, TrendingUp, ArrowRight, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { formatTimeUTC } from '../../utils/timezoneUtils';
import { useFinanceStore } from '../../store/useFinanceStore';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
// import { generateTransactionId, createSuccessMessage } from '../../utils/transactionId';
import { useAuthStore } from '../../store/authStore';
import { TransferModal } from './TransferModal';
import { DPSTransferModal } from './DPSTransferModal';
import { Dialog } from '@headlessui/react';
import { useRecordSelection } from '../../hooks/useRecordSelection';
import { SelectionFilter } from '../common/SelectionFilter';
// import { useTranslation } from 'react-i18next';
import { getPreference, setPreference } from '../../lib/userPreferences';
import { TransferFiltersSkeleton, TransferSummaryCardSkeleton, TransferTableSkeleton, TransferMobileCardSkeleton } from './TransfersSkeleton';

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

export const Transfer_new: React.FC = () => {
  const { accounts, fetchAccounts } = useFinanceStore();
  const { user, profile } = useAuthStore();
  
   // Transfer data state
   const [transfers, setTransfers] = useState<any[]>([]);
   const [dpsTransfers, setDpsTransfers] = useState<any[]>([]);
   const [allTransactions, setAllTransactions] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
  
  
  // Transfers are available for all users
  
  // Widget visibility state - hybrid approach (localStorage + database)
  const [showTransferWidget, setShowTransferWidget] = useState(() => {
    const saved = localStorage.getItem('showTransferWidget');
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  // Check if Transfer widget is hidden
  const [isTransferWidgetHidden, setIsTransferWidgetHidden] = useState(() => {
    const saved = localStorage.getItem('showTransferWidget');
    const isHidden = saved !== null ? !JSON.parse(saved) : false;
    return isHidden;
  });
  const [isRestoringTransferWidget, setIsRestoringTransferWidget] = useState(false);

  // Record selection functionality
  const {
    selectedId,
    isFromSearch,
    selectedRecordRef,
    clearSelection,
    hasSelection
  } = useRecordSelection({
    records: transfers,
    recordIdField: 'id',
    scrollToRecord: true
  });

   // Table filters state - exactly like LendBorrowTableView
   const [tableFilters, setTableFilters] = useState({
     search: '',
     type: 'all',
     dateRange: '1month'
   });

   // Temporary filter state for mobile modal
   const [tempFilters, setTempFilters] = useState(tableFilters);

  // Sorting state
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

   // Dropdown menu states
   const [showTypeMenu, setShowTypeMenu] = useState(false);
   const [showPresetDropdown, setShowPresetDropdown] = useState(false);
   const [showMobileFilterMenu, setShowMobileFilterMenu] = useState(false);
   const [showTransferTypeModal, setShowTransferTypeModal] = useState(false);
   const [showCurrencyTransferModal, setShowCurrencyTransferModal] = useState(false);
   const [showDpsTransferModal, setShowDpsTransferModal] = useState(false);
   const [showInBetweenTransferModal, setShowInBetweenTransferModal] = useState(false);

   // Row expansion state
   const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

   // Refs for click outside detection
   const typeMenuRef = useRef<HTMLDivElement>(null);
   const presetDropdownRef = useRef<HTMLDivElement>(null);
   const mobileFilterMenuRef = useRef<HTMLDivElement>(null);


  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await fetchAccounts(); // Load accounts first
        await fetchTransferHistory(); // Then load transfer history
      } catch (error) {
        console.error('Error loading transfer data:', error);
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Force loading state to false after a timeout to prevent infinite loading
  useEffect(() => {
    if (loading) {
      const timeoutId = setTimeout(() => {
        setLoading(false);
      }, 10000); // 10 second timeout
      
      return () => clearTimeout(timeoutId);
    }
  }, [loading]);

  // Sync tempFilters with tableFilters when mobile filter modal opens
  useEffect(() => {
    if (showMobileFilterMenu) {
      setTempFilters(tableFilters);
    }
  }, [showMobileFilterMenu, tableFilters]);

  // Load widget preferences on mount
  useEffect(() => {
    if (user) {
      const loadPreferences = async () => {
        try {
          const showWidget = await getPreference(user.id, 'showTransferWidget', true);
          setShowTransferWidget(showWidget);
          localStorage.setItem('showTransferWidget', JSON.stringify(showWidget));
        } catch (error) {
          // Keep current localStorage value if database fails
        }
      };
      loadPreferences();
    }
  }, [user]);

  // Handle hiding Transfer widget
  const handleHideTransferWidget = async () => {
    if (!user) return;
    
    // Update localStorage immediately for instant UI response
    localStorage.setItem('showTransferWidget', JSON.stringify(false));
    setShowTransferWidget(false);
    setIsTransferWidgetHidden(true);
    
    // Save to database if user is authenticated
    try {
      await setPreference(user.id, 'showTransferWidget', false);
      toast.success('Transfer widget hidden from dashboard', {
        description: 'You can restore it from the Transfer page'
      });
    } catch (error) {
      toast.error('Failed to save preference', {
        description: 'Widget hidden locally but may reappear on refresh'
      });
    }
  };

  // Handle showing Transfer widget
  const handleShowTransferWidget = async () => {
    if (!user) return;
    
    // Update localStorage immediately for instant UI response
    localStorage.setItem('showTransferWidget', JSON.stringify(true));
    setShowTransferWidget(true);
    setIsTransferWidgetHidden(false);
    
    // Save to database if user is authenticated
    try {
      await setPreference(user.id, 'showTransferWidget', true);
      toast.success('Transfer widget restored to dashboard!', {
        description: 'You can hide it again from the dashboard'
      });
    } catch (error) {
      toast.error('Failed to save preference', {
        description: 'Widget restored locally but may not persist'
      });
    }
  };

  // Handle restoring Transfer widget from the page
  const handleRestoreTransferWidgetFromPage = async () => {
    console.log('Restoring Transfer widget to dashboard');
    setIsRestoringTransferWidget(true);
    
    try {
      // Use the existing function that has proper database sync
      await handleShowTransferWidget();
      
      // Update local state
      setIsTransferWidgetHidden(false);
      setShowTransferWidget(true);
    } catch (error) {
      console.error('Error restoring Transfer widget:', error);
      toast.error('Failed to restore widget', {
        description: 'Please try again or refresh the page'
      });
    } finally {
      setIsRestoringTransferWidget(false);
    }
  };

   const fetchTransferHistory = async () => {
     try {
       // Don't set loading here as it's already set in the useEffect
       // setLoading(true);

      // Fetch regular transfers with limit to reduce egress
      const { data: transferData, error: transferError } = await supabase
        .from('transactions')
        .select('*, account:accounts(name, currency)')
        .contains('tags', ['transfer'])
        .order('date', { ascending: false })
        .limit(500);

      if (transferError) throw transferError;

      // Fetch DPS transfers with account details (with limit)
      const { data: dpsData, error: dpsError } = await supabase
        .from('dps_transfers')
        .select(`
          *,
          from_account:accounts!from_account_id(name, currency),
          to_account:accounts!to_account_id(name, currency)
        `)
        .order('date', { ascending: false })
        .limit(500);

       if (dpsError) throw dpsError;

       // Fetch only recent transactions for balance calculation
       // Limit to last 1000 transactions to reduce egress usage
       const { data: allTx, error: allTxError } = await supabase
         .from('transactions')
         .select('id, account_id, amount, date, type, tags')
         .order('date', { ascending: true })
         .limit(1000);
       if (allTxError) throw allTxError;

       
       setTransfers(transferData || []);
       setDpsTransfers(dpsData || []);
       setAllTransactions(allTx || []);
     } catch (error) {
       console.error('Error fetching transfers:', error);
       toast.error('Failed to fetch transfers');
    } finally {
      setLoading(false);
    }
  };

  // Group transfer transactions by transferId (tags[1])
  function groupTransfersByTransferId(transfers: any[]) {
    const grouped: Record<string, any[]> = {};
    for (const t of transfers) {
      const transferId = t.tags?.[1];
      if (!transferId) continue;
      if (!grouped[transferId]) grouped[transferId] = [];
      grouped[transferId].push(t);
    }
    return grouped;
  }

  // Combine grouped transfers into single display records
  function getCombinedTransfers(transfers: any[], accounts: any[]) {
    const grouped = groupTransfersByTransferId(transfers);
    const combined: any[] = [];
    
    for (const group of Object.values(grouped)) {
      if (group.length < 2) continue; // skip incomplete pairs
      const expense = group.find((t: any) => t.type === 'expense');
      const income = group.find((t: any) => t.type === 'income');
      if (!expense || !income) continue;
      
      const fromAccount = accounts.find(a => a.id === expense.account_id);
      const toAccount = accounts.find(a => a.id === income.account_id);
      
      if (!fromAccount || !toAccount) continue;
      
      const exchangeRate = income.amount / expense.amount;
      combined.push({
        id: expense.id + '_' + income.id,
        date: expense.date,
        created_at: expense.created_at,
        fromAccount,
        toAccount,
        fromAmount: expense.amount,
        toAmount: income.amount,
        fromCurrency: fromAccount?.currency,
        toCurrency: toAccount?.currency,
        note: expense.note || income.note || expense.description || income.description,
        exchangeRate,
        type: fromAccount?.currency === toAccount?.currency ? 'inbetween' : 'currency',
        // Historical balance data
        fromBalanceAfter: expense.balance_after_transfer,
        toBalanceAfter: income.balance_after_transfer,
        transferTime: expense.transfer_time || expense.date
      });
    }
    
    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // Prepare unified transfer list
  const combinedTransfers = useMemo(() => {
    return getCombinedTransfers(transfers, accounts);
  }, [transfers, accounts]);

  // Prepare DPS transfers
  const processedDpsTransfers = useMemo(() => {
    return dpsTransfers.map(t => ({ 
      ...t, 
      type: 'dps',
      // Map the account fields to match the expected structure
      fromAccount: t.from_account,
      toAccount: t.to_account,
      fromAmount: t.amount,
      toAmount: t.amount,
      fromCurrency: t.from_account?.currency,
      toCurrency: t.to_account?.currency,
      // For DPS transfers, we need to get balance data from the transaction records
      fromBalanceAfter: null, // Will be calculated from transaction records
      toBalanceAfter: null,   // Will be calculated from transaction records
      transferTime: t.date
    }));
  }, [dpsTransfers]);

   // All transfers combined
   const allTransfers = useMemo(() => {
     return [
       ...combinedTransfers,
       ...processedDpsTransfers
     ];
   }, [combinedTransfers, processedDpsTransfers]);

   // Calculate running balances for accounts
   const calculateAccountBalance = (accountId: string, upToDate: string) => {
     const account = accounts.find(a => a.id === accountId);
     if (!account) return 0;
     
     let balance = Number(account.initial_balance || 0);
     const accountTransactions = allTransactions
       .filter(tx => tx.account_id === accountId && new Date(tx.date) <= new Date(upToDate))
       .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
     
     for (const tx of accountTransactions) {
       if (tx.type === 'income') {
         balance += tx.amount;
       } else if (tx.type === 'expense') {
         balance -= tx.amount;
       }
     }
     return balance;
   };

   // Get historical balance for transfer display (prefer stored, fallback to calculated)
   const getTransferBalance = (transfer: any, accountId: string, isFromAccount: boolean) => {
     // For regular transfers, use stored balance if available
     if (transfer.type !== 'dps') {
       const storedBalance = isFromAccount ? transfer.fromBalanceAfter : transfer.toBalanceAfter;
       if (storedBalance !== null && storedBalance !== undefined) {
         return storedBalance;
       }
     }
     
     // Fallback to calculated balance
     return calculateAccountBalance(accountId, transfer.date);
   };

  // Filtered and sorted transfers
  const filteredTransfers = useMemo(() => {
    let filtered = allTransfers;

     // Search filter
     if (tableFilters.search) {
       const searchLower = tableFilters.search.toLowerCase();
       filtered = filtered.filter(transfer =>
         transfer.fromAccount?.name?.toLowerCase().includes(searchLower) ||
         transfer.toAccount?.name?.toLowerCase().includes(searchLower) ||
         transfer.fromAmount?.toString().includes(searchLower)
       );
     }

     // Type filter
     if (tableFilters.type !== 'all') {
       filtered = filtered.filter(transfer => transfer.type === tableFilters.type);
     }

     // Date range filter
     if (tableFilters.dateRange !== 'all') {
       const today = new Date();
       let startDate: Date;
       
       switch (tableFilters.dateRange) {
         case '1month':
           startDate = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
           break;
         case '3months':
           startDate = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
           break;
         case '6months':
           startDate = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate());
           break;
         case '1year':
           startDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
           break;
         default:
           startDate = new Date(0); // Show all
       }
       
       filtered = filtered.filter(transfer => {
         const transferDate = new Date(transfer.date);
         return transferDate >= startDate;
       });
     }

    // Sorting
    if (sortConfig) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [transfers, tableFilters, sortConfig]);



  // Click outside handlers for dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (typeMenuRef.current && !typeMenuRef.current.contains(event.target as Node)) {
        setShowTypeMenu(false);
      }
      if (presetDropdownRef.current && !presetDropdownRef.current.contains(event.target as Node)) {
        setShowPresetDropdown(false);
      }
      // Removed mobile filter menu click outside handler - modal should only close via explicit actions
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  // Handle sorting
  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

   // Get sort icon for table headers
  const getSortIcon = (key: string) => {
    if (sortConfig?.key !== key) {
      return <ChevronUp className="w-4 h-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-blue-600" />
      : <ChevronDown className="w-4 h-4 text-blue-600" />;
  };

   // Row expansion functions
   const toggleRowExpansion = (transferId: string) => {
     setExpandedRows(prev => {
       const newSet = new Set(prev);
       if (newSet.has(transferId)) {
         newSet.delete(transferId);
       } else {
         newSet.add(transferId);
       }
       return newSet;
     });
   };

   const isRowExpanded = (transferId: string) => {
     return expandedRows.has(transferId);
   };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 pb-[13px] lg:pb-0 relative overflow-hidden">
          {/* Shimmer effect */}
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
          
          {/* Filters skeleton */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 relative z-10">
            <TransferFiltersSkeleton />
          </div>
          
          {/* Summary cards skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 p-3 relative z-10">
            <TransferSummaryCardSkeleton />
          </div>
          
          {/* Desktop table skeleton */}
          <div className="hidden lg:block max-h-[500px] overflow-y-auto relative z-10" style={{ minHeight: '200px' }}>
            <TransferTableSkeleton rows={6} />
          </div>
          
          {/* Mobile card skeleton */}
          <div className="lg:hidden max-h-[500px] overflow-y-auto relative z-10">
            <div className="px-2.5 py-4">
              <TransferMobileCardSkeleton count={4} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Main Content Container - Following LendBorrowTableView Structure */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 pb-[13px] lg:pb-0">
        {/* Filter Section - Enhanced Mobile Responsiveness */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap md:flex-nowrap items-center w-full" style={{ marginBottom: 0 }}>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 w-full md:w-auto">
              {/* Search Input - Enhanced Mobile */}
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
                    placeholder="Search transfers..."
                  />
                </div>
              </div>

               {/* Selection Filter */}
               {hasSelection && (
                 <SelectionFilter
                   label="Selected"
                   value="Transfer"
                   onClear={clearSelection}
                 />
               )}

               {/* Mobile Action Buttons - Enhanced Layout */}
               <div className="flex items-center gap-1 md:hidden">
                 {/* Mobile Widget Restore Button */}
                 {isTransferWidgetHidden && (
                   <div className="md:hidden">
                     <button
                       onClick={handleRestoreTransferWidgetFromPage}
                       disabled={isRestoringTransferWidget}
                       className="px-2 py-1.5 text-[13px] h-8 w-8 rounded-md transition-colors flex items-center justify-center text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                       title="Show Transfer Widget on Dashboard"
                     >
                       {isRestoringTransferWidget ? (
                         <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                       ) : (
                         <Eye className="w-4 h-4" aria-hidden="true" />
                       )}
                     </button>
                   </div>
                 )}

                 {/* Mobile Filter Button */}
                 <div className="relative" ref={mobileFilterMenuRef}>
                   <button
                     onClick={() => setShowMobileFilterMenu(v => !v)}
                     className={`px-1.5 py-1.5 text-[13px] h-8 w-8 rounded-md transition-colors flex items-center justify-center ${
                       (tableFilters.type !== 'all' || tableFilters.dateRange !== 'all')
                         ? 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                         : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
                     }`}
                     style={(tableFilters.type !== 'all' || tableFilters.dateRange !== 'all') ? { background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' } : {}}
                     title="Filters"
                   >
                     <Filter className="w-3.5 h-3.5" />
                   </button>
                 </div>

                 {/* Mobile Add Transfer Button */}
                 <button
                   onClick={() => setShowTransferTypeModal(true)}
                   className="bg-gradient-primary text-white px-1.5 py-1.5 rounded-md hover:bg-gradient-primary-hover transition-colors flex items-center justify-center text-[13px] h-8 w-8"
                   title="Add Transfer"
                   aria-label="Add Transfer"
                 >
                   <Plus className="w-3.5 h-3.5" />
                 </button>

                 {/* Mobile Clear Filters Button */}
                 {(tableFilters.search || tableFilters.type !== 'all' || tableFilters.dateRange !== 'all') && (
                   <button
                     onClick={() => setTableFilters({ search: '', type: 'all', dateRange: 'all' })}
                     className="text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center h-8 w-8"
                     title="Clear all filters"
                   >
                     <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                     </svg>
                   </button>
                 )}
               </div>

               {/* Desktop Filters */}
               <div className="hidden md:flex items-center gap-x-2">
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
                      <span>{tableFilters.type === 'all' ? 'All Types' : tableFilters.type === 'currency' ? 'Currency' : tableFilters.type === 'dps' ? 'DPS' : 'In-Account'}</span>
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
                          onClick={() => { setTableFilters({ ...tableFilters, type: 'currency' }); setShowTypeMenu(false); }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${tableFilters.type === 'currency' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' : ''}`}
                        >
                          Currency
                        </button>
                        <button
                          onClick={() => { setTableFilters({ ...tableFilters, type: 'dps' }); setShowTypeMenu(false); }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${tableFilters.type === 'dps' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' : ''}`}
                        >
                          DPS
                        </button>
                        <button
                          onClick={() => { setTableFilters({ ...tableFilters, type: 'inbetween' }); setShowTypeMenu(false); }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${tableFilters.type === 'inbetween' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' : ''}`}
                        >
                          In-Account
                        </button>
                      </div>
                    )}
                  </div>
                 </div>

                 {/* Date Range Filter */}
                <div>
                  <div className="relative" ref={presetDropdownRef}>
                    <button
                      className={`px-3 py-1.5 pr-2 text-[13px] h-8 rounded-md transition-colors flex items-center space-x-1.5 ${
                        tableFilters.dateRange === '1month'
                          ? 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
                      } ${showPresetDropdown ? 'ring-2 ring-blue-500' : ''}`}
                      style={tableFilters.dateRange === '1month' ? { background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' } : {}}
                      onClick={() => setShowPresetDropdown(v => !v)}
                      type="button"
                    >
                      <span>{tableFilters.dateRange === 'all' ? 'All Time' : 
                             tableFilters.dateRange === '1month' ? '1 Month' :
                             tableFilters.dateRange === '3months' ? '3 Months' :
                             tableFilters.dateRange === '6months' ? '6 Months' :
                             tableFilters.dateRange === '1year' ? '1 Year' : '1 Month'}</span>
                      <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showPresetDropdown && (
                      <div className="absolute left-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 min-w-[120px] max-w-[200px]">
                        <button
                          onClick={() => { setTableFilters({ ...tableFilters, dateRange: '1month' }); setShowPresetDropdown(false); }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${tableFilters.dateRange === '1month' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' : ''}`}
                        >
                          1 Month
                        </button>
                        <button
                          onClick={() => { setTableFilters({ ...tableFilters, dateRange: '3months' }); setShowPresetDropdown(false); }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${tableFilters.dateRange === '3months' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' : ''}`}
                        >
                          3 Months
                        </button>
                        <button
                          onClick={() => { setTableFilters({ ...tableFilters, dateRange: '6months' }); setShowPresetDropdown(false); }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${tableFilters.dateRange === '6months' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' : ''}`}
                        >
                          6 Months
                        </button>
                        <button
                          onClick={() => { setTableFilters({ ...tableFilters, dateRange: '1year' }); setShowPresetDropdown(false); }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${tableFilters.dateRange === '1year' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' : ''}`}
                        >
                          1 Year
                        </button>
                        <button
                          onClick={() => { setTableFilters({ ...tableFilters, dateRange: 'all' }); setShowPresetDropdown(false); }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${tableFilters.dateRange === 'all' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' : ''}`}
                        >
                          All Time
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Clear Filters */}
                {(tableFilters.search || tableFilters.type !== 'all' || tableFilters.dateRange !== '1month') && (
                  <button
                    onClick={() => setTableFilters({ search: '', type: 'all', dateRange: '1month' })}
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
              {isTransferWidgetHidden && (
                <button
                  onClick={handleRestoreTransferWidgetFromPage}
                  disabled={isRestoringTransferWidget}
                  className="bg-gray-100 text-gray-700 px-3 py-1.5 h-8 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Show Transfer Widget on Dashboard"
                >
                  {isRestoringTransferWidget ? (
                    <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                </button>
              )}
              <button
                onClick={() => setShowTransferTypeModal(true)}
                className="bg-gradient-primary text-white px-3 py-1.5 h-8 rounded-md hover:bg-gradient-primary-hover transition-colors flex items-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed text-[13px]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Transfer</span>
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards - Enhanced Responsive Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 p-3">
          {(() => {
            const totalTransfers = filteredTransfers.length;
            
            // Calculate transfer types breakdown
            const typeBreakdown = filteredTransfers.reduce((acc, transfer) => {
              const type = transfer.type || 'other';
              acc[type] = (acc[type] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);
            
            const typeInsight = Object.entries(typeBreakdown)
              .map(([type, count]) => `${count} ${type}`)
              .join(', ');
            
            return (
              <>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 px-2">
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Transfers</p>
                      <p className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" style={{ fontSize: '1.2rem' }}>{totalTransfers}</p>
                      <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: '11px' }}>
                        {typeInsight || 'No transfers'}
                      </p>
                    </div>
                    <ArrowRight className="text-blue-600 w-5 h-5" />
                  </div>
                </div>
                
              </>
            );
          })()}
        </div>

        {/* Table Section - Enhanced Responsive Design */}
        <div className="overflow-x-auto lg:rounded-b-xl" style={{ borderBottomLeftRadius: '0.75rem', borderBottomRightRadius: '0.75rem' }}>
          {/* Desktop Table View - Enhanced Responsive */}
          <div className="hidden lg:block max-h-[500px] overflow-y-auto" data-desktop-table="true" style={{ minHeight: '200px' }}>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900 text-[14px]">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                <tr>
                   <th 
                     className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                     onClick={() => handleSort('date')}
                   >
                     <div className="flex items-center space-x-1">
                       <span>Date</span>
                       {getSortIcon('date')}
                     </div>
                   </th>
                   <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                   </th>
                   <th 
                     className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                     onClick={() => handleSort('type')}
                   >
                     <div className="flex items-center justify-center space-x-1">
                       <span>Type</span>
                       {getSortIcon('type')}
                     </div>
                   </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => handleSort('from_account')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>From Account</span>
                      {getSortIcon('from_account')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => handleSort('to_account')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>To Account</span>
                      {getSortIcon('to_account')}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTransfers.length === 0 ? (
                  <tr>
                     <td colSpan={5} className="py-16 text-center">
                      <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                        <ArrowRight className="w-12 h-12 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No transfers found</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                        Start tracking your transfers by adding your first transfer
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredTransfers.map((transfer) => {
                    const isSelected = selectedId === transfer.id;
                    const isFromSearchSelection = isFromSearch && isSelected;
                    
                    return (
                      <React.Fragment key={transfer.id}>
                         <tr 
                           id={`transfer-${transfer.id}`}
                           ref={isSelected ? selectedRecordRef : null}
                           className={`hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${
                             isSelected 
                               ? isFromSearchSelection 
                                 ? 'ring-2 ring-blue-500 ring-opacity-50 bg-blue-50 dark:bg-blue-900/20' 
                                 : 'ring-2 ring-blue-500 ring-opacity-50'
                               : ''
                           }`} 
                           style={{ paddingTop: '1.2rem', paddingBottom: '1.2rem' }}
                           onClick={() => toggleRowExpansion(transfer.id)}
                         >
                           <td className="px-6" style={{ paddingTop: '1.2rem', paddingBottom: '1.2rem' }}>
                             <div className="text-sm text-gray-900 dark:text-white">
                               {new Date(transfer.date).toLocaleDateString()}
                             </div>
                           </td>
                           <td className="px-6 text-center" style={{ paddingTop: '1.2rem', paddingBottom: '1.2rem' }}>
                             <svg 
                               className={`w-4 h-4 text-gray-400 transition-transform ${isRowExpanded(transfer.id) ? 'rotate-90' : ''}`} 
                               fill="none" 
                               stroke="currentColor" 
                               strokeWidth="2" 
                               viewBox="0 0 24 24"
                             >
                               <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                             </svg>
                           </td>
                          <td className="px-6 text-center" style={{ paddingTop: '1.2rem', paddingBottom: '1.2rem' }}>
                            <span className={`inline-flex items-center justify-center text-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                              transfer.type === 'currency' 
                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                                : transfer.type === 'dps'
                                ? 'bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 text-blue-700 dark:text-blue-300'
                                : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                            }`}>
                              {transfer.type === 'currency' ? 'Currency' : 
                               transfer.type === 'dps' ? 'DPS' : 'In-Account'}
                            </span>
                          </td>
                          <td className="px-6" style={{ paddingTop: '1.2rem', paddingBottom: '1.2rem' }}>
                            <div className="text-sm text-gray-900 dark:text-white">
                              {transfer.fromAccount?.name || 'Unknown Account'}
                            </div>
                          </td>
                          <td className="px-6" style={{ paddingTop: '1.2rem', paddingBottom: '1.2rem' }}>
                            <div className="text-sm text-gray-900 dark:text-white">
                              {transfer.toAccount?.name || 'Unknown Account'}
                            </div>
                          </td>
                         </tr>
                         {/* Expanded Row Content */}
                         {isRowExpanded(transfer.id) && (
                           <tr>
                             <td colSpan={5} className="px-6 py-4 bg-gray-50 dark:bg-gray-800">
                               <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-2 sm:p-3 transition-all duration-200 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 bg-white dark:bg-gray-800">
                                 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                   <div className="flex items-center gap-2 flex-wrap">
                                     <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                                       transfer.type === 'currency' 
                                         ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                                         : transfer.type === 'dps'
                                         ? 'bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 text-blue-700 dark:text-blue-300'
                                         : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                     }`}>
                                       {transfer.type === 'currency' ? 'Currency' : 
                                        transfer.type === 'dps' ? 'DPS' : 'In-Account'}
                                     </span>
                                     <span className="text-xs text-gray-500 dark:text-gray-400">
                                       {new Date(transfer.transferTime || transfer.date).toLocaleDateString('en-US', { 
                                         month: 'short', 
                                         day: 'numeric' 
                                       })} • {formatTimeUTC(transfer.created_at || transfer.transferTime || transfer.date, 'h:mm a')}
                                     </span>
                                   </div>
                                 </div>
                                 {/* Two-Column Layout for From/To Accounts */}
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                   {/* From Account */}
                                   <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                                     <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                       From: {transfer.fromAccount?.name || 'Unknown'}
                                     </div>
                                     <div className="space-y-1">
                                       <div className="text-xs text-gray-600 dark:text-gray-400">
                                         Balance After Transfer: {getCurrencySymbol(transfer.fromCurrency || 'USD')}{getTransferBalance(transfer, transfer.fromAccount?.id, true).toLocaleString()}
                                       </div>
                                       <div className="text-lg font-bold text-red-600 dark:text-red-400">
                                         Amount: -{getCurrencySymbol(transfer.fromCurrency || 'USD')}{transfer.fromAmount?.toLocaleString() || '0'}
                                       </div>
                                     </div>
                                   </div>

                                   {/* To Account */}
                                   <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                                     <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                       To: {transfer.toAccount?.name || 'Unknown'}
                                     </div>
                                     <div className="space-y-1">
                                       <div className="text-xs text-gray-600 dark:text-gray-400">
                                         Balance After Transfer: {getCurrencySymbol(transfer.toCurrency || 'USD')}{getTransferBalance(transfer, transfer.toAccount?.id, false).toLocaleString()}
                                       </div>
                                       <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                         Amount: +{getCurrencySymbol(transfer.toCurrency || 'USD')}{transfer.toAmount?.toLocaleString() || '0'}
                                       </div>
                                     </div>
                                   </div>
                                 </div>

                                 {/* Exchange Rate for Currency Transfers */}
                                 {transfer.type === 'currency' && (
                                   <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                     <div className="text-sm font-semibold text-blue-900 dark:text-blue-300">
                                       Exchange Rate ({transfer.exchangeRate?.toFixed(2) || '1.00'}): {getCurrencySymbol(transfer.fromCurrency || 'USD')}{transfer.fromAmount?.toLocaleString() || '0'} → {getCurrencySymbol(transfer.toCurrency || 'USD')}{transfer.toAmount?.toLocaleString() || '0'}
                                     </div>
                                   </div>
                                 )}
                                 <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                                   <div className="text-xs text-gray-600 dark:text-gray-400">
                                     {transfer.note || 'Transfer'}
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

        {/* Mobile/Tablet Stacked Table View - Enhanced Responsive */}
        <div className="lg:hidden max-h-[500px] overflow-y-auto" data-mobile-view="true">
          <div className="space-y-4 px-2.5">
            {filteredTransfers.length === 0 ? (
              <div className="py-16 text-center">
                <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <ArrowRight className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No transfers found</h3>
                <p className="text-gray-500 dark:text-gray-400">Start tracking your transfers by adding your first transfer</p>
              </div>
            ) : (
              filteredTransfers.map((transfer) => {
                const isSelected = selectedId === transfer.id;
                const isFromSearchSelection = isFromSearch && isSelected;
                
                return (
                  <div
                    key={transfer.id}
                    id={`transfer-${transfer.id}`}
                    ref={isSelected ? selectedRecordRef : null}
                    className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4 shadow-sm hover:shadow-md transition-all duration-200 ${
                      isSelected 
                        ? isFromSearchSelection 
                          ? 'ring-2 ring-blue-500 ring-opacity-50 bg-blue-50 dark:bg-blue-900/20' 
                          : 'ring-2 ring-blue-500'
                        : ''
                    }`}
                     onClick={() => toggleRowExpansion(transfer.id)}
                  >
                     {/* Mobile Header - Enhanced Layout */}
                     <div className="flex items-center justify-between mb-3 gap-1">
                       <div className="flex items-center space-x-1 flex-1 min-w-0">
                         <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                           {new Date(transfer.date).toLocaleDateString()}
                         </div>
                         <svg 
                           className={`w-3 h-3 text-gray-400 transition-transform flex-shrink-0 ${isRowExpanded(transfer.id) ? 'rotate-90' : ''}`} 
                           fill="none" 
                           stroke="currentColor" 
                           strokeWidth="2" 
                           viewBox="0 0 24 24"
                         >
                           <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                         </svg>
                       </div>
                       <div className="flex-shrink-0">
                         <span className={`inline-flex items-center justify-center text-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                           transfer.type === 'currency' 
                             ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                             : transfer.type === 'dps'
                             ? 'bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 text-blue-700 dark:text-blue-300'
                             : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                         }`}>
                           {transfer.type === 'currency' ? 'Currency' : 
                            transfer.type === 'dps' ? 'DPS' : 'In-Account'}
                         </span>
                       </div>
                     </div>
                    
                    {/* Mobile Transfer Info - Responsive Layout */}
                    <div className="space-y-2 mb-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          <span className="font-medium">From:</span> {transfer.fromAccount?.name || 'Unknown Account'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          <span className="font-medium">To:</span> {transfer.toAccount?.name || 'Unknown Account'}
                        </div>
                      </div>
                      
                      {/* Amount Display - Mobile Optimized */}
                      <div className="flex items-center justify-between gap-1">
                        <div className="text-sm font-semibold text-red-600 dark:text-red-400 truncate min-w-0">
                          -{getCurrencySymbol(transfer.fromCurrency || 'USD')}{transfer.fromAmount?.toLocaleString() || '0'}
                        </div>
                        <div className="text-sm font-semibold text-green-600 dark:text-green-400 truncate min-w-0">
                          +{getCurrencySymbol(transfer.toCurrency || 'USD')}{transfer.toAmount?.toLocaleString() || '0'}
                        </div>
                      </div>
                    </div>
                    
                    {/* Mobile Expanded Content */}
                    {isRowExpanded(transfer.id) && (
                      <div className="mt-3 border border-gray-200 dark:border-gray-600 rounded-lg p-2 sm:p-3 transition-all duration-200 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 bg-white dark:bg-gray-800">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                              transfer.type === 'currency' 
                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                                : transfer.type === 'dps'
                                ? 'bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 text-blue-700 dark:text-blue-300'
                                : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                            }`}>
                              {transfer.type === 'currency' ? 'Currency' : 
                               transfer.type === 'dps' ? 'DPS' : 'In-Account'}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(transfer.transferTime || transfer.date).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric' 
                              })} • {formatTimeUTC(transfer.created_at || transfer.transferTime || transfer.date, 'h:mm a')}
                            </span>
                          </div>
                        </div>
                        {/* Two-Column Layout for From/To Accounts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                          {/* From Account */}
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                            <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                              From: {transfer.fromAccount?.name || 'Unknown'}
                            </div>
                            <div className="space-y-1">
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                Balance After Transfer: {getCurrencySymbol(transfer.fromCurrency || 'USD')}{getTransferBalance(transfer, transfer.fromAccount?.id, true).toLocaleString()}
                              </div>
                              <div className="text-lg font-bold text-red-600 dark:text-red-400">
                                Amount: -{getCurrencySymbol(transfer.fromCurrency || 'USD')}{transfer.fromAmount?.toLocaleString() || '0'}
                              </div>
                            </div>
                          </div>

                          {/* To Account */}
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                            <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                              To: {transfer.toAccount?.name || 'Unknown'}
                            </div>
                            <div className="space-y-1">
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                Balance After Transfer: {getCurrencySymbol(transfer.toCurrency || 'USD')}{getTransferBalance(transfer, transfer.toAccount?.id, false).toLocaleString()}
                              </div>
                              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                Amount: +{getCurrencySymbol(transfer.toCurrency || 'USD')}{transfer.toAmount?.toLocaleString() || '0'}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Exchange Rate for Currency Transfers */}
                        {transfer.type === 'currency' && (
                          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div className="text-sm font-semibold text-blue-900 dark:text-blue-300">
                              Exchange Rate ({transfer.exchangeRate?.toFixed(2) || '1.00'}): {getCurrencySymbol(transfer.fromCurrency || 'USD')}{transfer.fromAmount?.toLocaleString() || '0'} → {getCurrencySymbol(transfer.toCurrency || 'USD')}{transfer.toAmount?.toLocaleString() || '0'}
                            </div>
                          </div>
                        )}
                        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {transfer.note || 'Transfer'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Modal - Following LendBorrowTableView Pattern */}
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
                      (tempFilters.type !== 'all' || tempFilters.dateRange !== '1month')
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
                      setTableFilters({ search: '', type: 'all', dateRange: '1month' });
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
                  All Types
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setTempFilters({ ...tempFilters, type: 'inbetween' });
                  }}
                  className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                    tempFilters.type === 'inbetween' 
                      ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200' 
                      : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  In-Account
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setTempFilters({ ...tempFilters, type: 'dps' });
                  }}
                  className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                    tempFilters.type === 'dps' 
                      ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200' 
                      : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  DPS
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setTempFilters({ ...tempFilters, type: 'currency' });
                  }}
                  className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                    tempFilters.type === 'currency' 
                      ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200' 
                      : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  Currency
                </button>
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="px-3 py-2">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Time Period</div>
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setTempFilters({ ...tempFilters, dateRange: '1month' });
                  }}
                  className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                    tempFilters.dateRange === '1month' 
                      ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200' 
                      : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  1 Month
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setTempFilters({ ...tempFilters, dateRange: '3months' });
                  }}
                  className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                    tempFilters.dateRange === '3months' 
                      ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200' 
                      : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  3 Months
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setTempFilters({ ...tempFilters, dateRange: '6months' });
                  }}
                  className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                    tempFilters.dateRange === '6months' 
                      ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200' 
                      : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  6 Months
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setTempFilters({ ...tempFilters, dateRange: '1year' });
                  }}
                  className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                    tempFilters.dateRange === '1year' 
                      ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200' 
                      : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  1 Year
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setTempFilters({ ...tempFilters, dateRange: 'all' });
                  }}
                  className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                    tempFilters.dateRange === 'all' 
                      ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200' 
                      : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Type Selection Modal */}
      <Dialog open={showTransferTypeModal} onClose={() => setShowTransferTypeModal(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-xs rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl">
            <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Select Transfer Type
            </Dialog.Title>
            <div className="flex flex-col gap-4">
              <button
                onClick={() => { setShowTransferTypeModal(false); setShowCurrencyTransferModal(true); }}
                className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors text-left"
              >
                <div className="font-medium">Currency Transfer</div>
                <div className="text-sm opacity-90">Transfer between any accounts with exchange rates</div>
              </button>
              <button
                onClick={() => { setShowTransferTypeModal(false); setShowDpsTransferModal(true); }}
                className="bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors text-left"
              >
                <div className="font-medium">DPS Transfer</div>
                <div className="text-sm opacity-90">Automatic savings transfers from DPS accounts</div>
              </button>
              <button
                onClick={() => { setShowTransferTypeModal(false); setShowInBetweenTransferModal(true); }}
                className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-left"
              >
                <div className="font-medium">In-between Transfer</div>
                <div className="text-sm opacity-90">Transfer between accounts within the same currency</div>
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Transfer Modals */}
      {showCurrencyTransferModal && (
        <TransferModal 
          isOpen={showCurrencyTransferModal} 
          onClose={async () => {
            setShowCurrencyTransferModal(false);
            // Refresh both accounts and transfer history after modal closes
            await fetchAccounts();
            await fetchTransferHistory();
          }} 
          mode="currency" 
        />
      )}
      {showDpsTransferModal && (
        <DPSTransferModal 
          isOpen={showDpsTransferModal} 
          onClose={async () => {
            setShowDpsTransferModal(false);
            // Refresh both accounts and transfer history after modal closes
            await fetchAccounts();
            await fetchTransferHistory();
          }} 
        />
      )}
      {showInBetweenTransferModal && (
        <TransferModal 
          isOpen={showInBetweenTransferModal} 
          onClose={async () => {
            setShowInBetweenTransferModal(false);
            // Refresh both accounts and transfer history after modal closes
            await fetchAccounts();
            await fetchTransferHistory();
          }} 
          mode="inbetween" 
        />
      )}

    </div>
  );
};
