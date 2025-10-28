import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Filter, Search, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, Handshake, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { LendBorrow, LendBorrowInput } from '../../types/index';
import { LendBorrowForm } from './LendBorrowForm';
import { LendBorrowList } from './LendBorrowList';
import { SettledRecordInfoModal } from './SettledRecordInfoModal';
import { useFinanceStore } from '../../store/useFinanceStore';
import { LendBorrowCardSkeleton, LendBorrowTableSkeleton, LendBorrowSummaryCardsSkeleton, LendBorrowFiltersSkeleton } from './LendBorrowSkeleton';
import { toast } from 'sonner';
import { useLoadingContext } from '../../context/LoadingContext';
import { getPreference, setPreference } from '../../lib/userPreferences';
import { useRecordSelection } from '../../hooks/useRecordSelection';
import { SelectionFilter } from '../common/SelectionFilter';

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

export const LendBorrowView: React.FC = () => {
  const { t } = useTranslation();
  const { user, profile } = useAuthStore();
  
  // Check if Lend & Borrow widget is hidden
  const [isLendBorrowWidgetHidden, setIsLendBorrowWidgetHidden] = useState(() => {
    const saved = localStorage.getItem('showLendBorrowWidget');
    const isHidden = saved !== null ? !JSON.parse(saved) : false;
    console.log('Lend & Borrow widget hidden state:', isHidden, 'saved value:', saved);
    return isHidden;
  });
  const [isRestoringWidget, setIsRestoringWidget] = useState(false);
  
  // Check if user has Premium plan for Lend & Borrow
  const isPremium = profile?.subscription?.plan === 'premium';
  
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const { accounts, lendBorrowRecords, fetchLendBorrowRecords, fetchAccounts, addLendBorrowRecord, loading: storeLoading } = useFinanceStore();
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<LendBorrow | null>(null);
  const [settledRecordInfoModal, setSettledRecordInfoModal] = useState<{
    isOpen: boolean;
    record: LendBorrow | null;
  }>({ isOpen: false, record: null });
  const [selectedCurrency, setSelectedCurrency] = useState<string>('');
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);
  const currencyMenuRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState({
    type: 'all' as 'all' | 'lend' | 'borrow',
    status: 'active' as 'all' | 'active' | 'settled',
    search: '',
    currency: '' as string,
    dateRange: { start: '', end: '' }
  });

  // Mobile filter states
  const [showMobileFilterMenu, setShowMobileFilterMenu] = useState(false);
  const [tempFilters, setTempFilters] = useState({
    type: 'all' as 'all' | 'lend' | 'borrow',
    status: 'active' as 'all' | 'active' | 'settled',
    search: '',
    currency: '' as string,
    dateRange: { start: '', end: '' }
  });
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showPresetDropdown, setShowPresetDropdown] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const typeMenuRef = useRef<HTMLDivElement>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);
  const presetDropdownRef = useRef<HTMLDivElement>(null);
  const { wrapAsync, setLoadingMessage } = useLoadingContext();

  // Record selection functionality
  const {
    selectedRecord,
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


  // Widget visibility state - hybrid approach (localStorage + database)
  const [showLendBorrowWidget, setShowLendBorrowWidget] = useState(() => {
    const saved = localStorage.getItem('showLendBorrowWidget');
    return saved !== null ? JSON.parse(saved) : true;
  });

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
    if (!filters.dateRange.start || !filters.dateRange.end) {
      return 'All Time';
    }
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    if (filters.dateRange.start === todayStr && filters.dateRange.end === todayStr) {
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
    if (filters.dateRange.start === mondayStr && filters.dateRange.end === sundayStr) {
      return 'This Week';
    }
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const firstStr = first.toISOString().slice(0, 10);
    const lastStr = last.toISOString().slice(0, 10);
    if (filters.dateRange.start === firstStr && filters.dateRange.end === lastStr) {
      return 'This Month';
    }
    const firstLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    const firstLastMonthStr = firstLastMonth.toISOString().slice(0, 10);
    const lastLastMonthStr = lastLastMonth.toISOString().slice(0, 10);
    if (filters.dateRange.start === firstLastMonthStr && filters.dateRange.end === lastLastMonthStr) {
      return 'Last Month';
    }
    const firstYear = new Date(today.getFullYear(), 0, 1);
    const lastYear = new Date(today.getFullYear(), 11, 31);
    const firstYearStr = firstYear.toISOString().slice(0, 10);
    const lastYearStr = lastYear.toISOString().slice(0, 10);
    if (filters.dateRange.start === firstYearStr && filters.dateRange.end === lastYearStr) {
      return 'This Year';
    }
    return 'Custom Range';
  };

  const handlePresetRange = (preset: string) => {
    const today = new Date();
    if (preset === 'custom') {
      setShowCustomModal(true);
      setShowPresetDropdown(false);
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
    setFilters(f => ({ ...f, dateRange: { start, end } }));
  };

  // Only show selected_currencies if available, else all
  const allCurrencyOptions = [
    'USD', 'EUR', 'GBP', 'BDT', 'JPY', 'CAD', 'AUD'
  ];
  let availableCurrencies: string[] = [];
  if (profile?.selected_currencies && profile.selected_currencies.length > 0) {
    availableCurrencies = allCurrencyOptions.filter(c => profile.selected_currencies?.includes?.(c));
  } else {
    const accountCurrencies = Array.from(new Set(accounts.map((a: any) => a.currency)));
    availableCurrencies = accountCurrencies.length > 0 ? accountCurrencies : allCurrencyOptions;
  }

  // Set default currency to user's default (first account's currency)
  useEffect(() => {
    if (availableCurrencies.length > 0 && (!selectedCurrency || !availableCurrencies.includes(selectedCurrency))) {
      setSelectedCurrency(availableCurrencies[0]);
    }
  }, [availableCurrencies, selectedCurrency]);

  // Set default currency when accounts are loaded
  useEffect(() => {
    if (accounts.length > 0 && !selectedCurrency) {
      const accountCurrencies = Array.from(new Set(accounts.map((a: any) => a.currency)));
      if (accountCurrencies.length > 0) {
        setSelectedCurrency(accountCurrencies[0]);
      }
    }
  }, [accounts, selectedCurrency]);



  useEffect(() => {
    if (
      availableCurrencies.length > 0 &&
      (!filters.currency || !availableCurrencies.includes(filters.currency))
    ) {
      const defaultCurrency = getDefaultCurrency();
      setFilters(f => ({ ...f, currency: defaultCurrency }));
      setSelectedCurrency(defaultCurrency);
    }
  }, [profile, availableCurrencies, filters.currency]);

  // No default date range - show all records by default

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

    // Update overdue records in batch
    const updates = overdueRecords.map(record => ({
      id: record.id,
      status: 'overdue'
    }));

    try {
      const { error } = await supabase
        .from('lend_borrow')
        .upsert(updates, { onConflict: 'id' });

      if (error) {

        return records;
      }

      // Update local state
      return records.map(record => {
        const overdueRecord = overdueRecords.find(r => r.id === record.id);
        return overdueRecord ? { ...record, status: 'overdue' as const } : record;
      });
    } catch (error) {

      return records;
    }
  };



  // Filter records for the table (status filter included)
  const filteredRecords = React.useMemo(() => {
    // If a record is selected via deep link, prioritize showing only that record
    if (hasSelection && isFromSearch && selectedRecord) {
      return [selectedRecord];
    }

    return lendBorrowRecords.filter(record => {
      if (filters.type !== 'all' && record.type !== filters.type) return false;
      if (filters.status !== 'all' && 
          !(filters.status === 'active' && (record.status === 'active' || record.status === 'overdue')) &&
          !(filters.status === 'settled' && record.status === 'settled')) return false;
      if (filters.search && !record.person_name.toLowerCase().includes(filters.search.toLowerCase()) && 
          !record.notes?.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.currency && record.currency !== filters.currency) return false;
      
      // Date range filtering
      if (filters.dateRange.start && filters.dateRange.end) {
        const recordDate = record.created_at ? new Date(record.created_at) : new Date();
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        endDate.setHours(23, 59, 59, 999); // Include the entire end date
        
        if (recordDate < startDate || recordDate > endDate) return false;
      }
      
      return true;
    });
  }, [lendBorrowRecords, filters, hasSelection, isFromSearch, selectedRecord]);

  // Calculate overdue count directly from filtered records
  const overdueCount = filteredRecords.filter(r => r.status === 'overdue').length;
  
  const currentAnalytics = {
    total_lent: filteredRecords.filter(r => r.type === 'lend').reduce((sum, r) => sum + r.amount, 0),
    total_borrowed: filteredRecords.filter(r => r.type === 'borrow').reduce((sum, r) => sum + r.amount, 0),
    outstanding_lent: filteredRecords.filter(r => r.type === 'lend' && r.status === 'active').reduce((sum, r) => sum + r.amount, 0),
    outstanding_borrowed: filteredRecords.filter(r => r.type === 'borrow' && r.status === 'active').reduce((sum, r) => sum + r.amount, 0),
    overdue_count: overdueCount,
    currency: filters.currency || availableCurrencies[0]
  };

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

  // Add new record
  const handleAddRecord = async (record: LendBorrowInput) => {
    if (!user) {
      return;
    }

    try {
      // Add a small delay to ensure loading animation is visible
      await new Promise(resolve => setTimeout(resolve, 300));

      await addLendBorrowRecord(record);

      // Successfully added record
      setShowForm(false);
      toast.success('Record added successfully!');
    } catch (error) {
      console.error('❌ handleAddRecord error:', error);
      toast.error('Failed to add record. Please try again.');
    }
  };

  // Handle settlement with account selection
  const handleSettle = async (record: LendBorrow, accountId: string) => {
    try {
      // Create settlement transaction
      const settlementTransaction = {
        user_id: user!.id,
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
      await Promise.all([
        fetchLendBorrowRecords(),
        fetchAccounts()
      ]);

      toast.success('Record settled successfully!');
    } catch (error) {
      console.error('Settlement error:', error);
      toast.error('Failed to settle record');
    }
  };

  // Update record
  const handleUpdateRecord = async (id: string, updates: Partial<LendBorrowInput>): Promise<void> => {
    if (!user) return;

    // Convert empty string date fields to null
    const cleanUpdates = {
      ...updates,
      due_date: updates.due_date === "" ? null : updates.due_date,
      partial_return_date: updates.partial_return_date === "" ? null : updates.partial_return_date,
    };

    try {
      // Get the current record to check if we need to update the associated transaction
      const { data: currentRecord, error: fetchError } = await supabase
        .from('lend_borrow')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        console.error('Error fetching current record:', fetchError);
        toast.error('Failed to fetch current record');
        return;
      }


      // Add a small delay to ensure loading animation is visible
      await new Promise(resolve => setTimeout(resolve, 300));

      const { data, error } = await supabase
        .from('lend_borrow')
        .update(cleanUpdates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating record:', error);
        toast.error('Error updating record: ' + error.message);
        throw error;
      }

      if (!data) {
        console.error('No data returned from update');
        toast.error('No data returned from update. Please check your database permissions.');
        return;
      }

      // Update associated transaction if it exists and affect_account_balance is true
      
      if (currentRecord.affect_account_balance && 
          (updates.amount || updates.person_name || updates.type || updates.account_id)) {
        
        // If no transaction_id exists, create one
        let transactionId = currentRecord.transaction_id;
        if (!transactionId) {
          transactionId = `LB${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
          
          // Update the lend/borrow record with the new transaction_id
          const { error: updateTransactionIdError } = await supabase
            .from('lend_borrow')
            .update({ transaction_id: transactionId })
            .eq('id', id)
            .eq('user_id', user.id);
          
          if (updateTransactionIdError) {
            console.error('Error updating transaction_id:', updateTransactionIdError);
            toast.error('Failed to create transaction ID');
            return;
          }
        }
        
        // Get the account information for the transaction
        const selectedAccount = accounts.find(acc => acc.id === (updates.account_id || currentRecord.account_id));
        
        if (!selectedAccount) {
          console.error('Selected account not found');
          toast.error('Selected account not found');
          return;
        }

        // Check if transaction already exists
        const { data: existingTransaction, error: fetchTransactionError } = await supabase
          .from('transactions')
          .select('*')
          .eq('transaction_id', transactionId)
          .eq('user_id', user.id)
          .single();


        // Prepare transaction data
        const transactionData = {
          user_id: user.id,
          account_id: updates.account_id || currentRecord.account_id,
          type: (updates.type || currentRecord.type) === 'lend' ? 'expense' : 'income',
          amount: updates.amount || currentRecord.amount,
          description: `${updates.type || currentRecord.type === 'lend' ? 'Lent to' : 'Borrowed from'} ${updates.person_name || currentRecord.person_name}`,
          category: 'Lend/Borrow',
          date: new Date().toISOString().split('T')[0],
          tags: ['lend_borrow', 'loan'],
          transaction_id: transactionId
        };


        let transactionResult;
        if (existingTransaction) {
          // Update existing transaction
          transactionResult = await supabase
            .from('transactions')
            .update(transactionData)
            .eq('transaction_id', transactionId)
            .eq('user_id', user.id)
            .select();
        } else {
          // Create new transaction
          transactionResult = await supabase
            .from('transactions')
            .insert([transactionData])
            .select();
        }

        if (transactionResult.error) {
          console.error('Error with transaction:', transactionResult.error);
          toast.error('Record updated but failed to update associated transaction');
        } else {
          // Refresh accounts and transactions to show updated data
          await Promise.all([
            fetchAccounts(),
            fetchLendBorrowRecords()
          ]);
        }
      }

      // Successfully updated record
      setEditingRecord(null);
      toast.success('Record updated successfully!');
    } catch (error) {
      console.error('Error in handleUpdateRecord:', error);
      toast.error('Failed to update record. Please try again.');
    }
  };

  // Delete record
  const handleDeleteRecord = async (id: string) => {
    if (!user) return;

    // Wrap the delete process with loading state
    const wrappedDelete = wrapAsync(async () => {
      setLoadingMessage('Deleting record...');
      try {
        // Get the current record to check for associated transaction
        const { data: currentRecord, error: fetchError } = await supabase
          .from('lend_borrow')
          .select('transaction_id, affect_account_balance')
          .eq('id', id)
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
          .eq('id', id)
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
          .eq('id', id)
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
          fetchLendBorrowRecords(),
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

  // Update status
  const handleUpdateStatus = async (id: string, status: LendBorrow['status']) => {
    try {
      await useFinanceStore.getState().updateLendBorrowRecord(id, { status });
      toast.success(`Status updated to ${status}`);
    } catch (error) {

      toast.error('Failed to update status. Please try again.');
    }
  };

  // Show settled record info modal
  const handleShowSettledInfo = (record: LendBorrow) => {
    setSettledRecordInfoModal({ isOpen: true, record });
  };


  // Update loading state when records change
  useEffect(() => {
    setLoading(false);
  }, [lendBorrowRecords]);

  // Update loading state based on store loading and data availability
  useEffect(() => {
    if (storeLoading || !user) {
      setLoading(true);
    } else if (user && accounts.length > 0 && availableCurrencies.length > 0) {
      setLoading(false);
    }
  }, [storeLoading, user, accounts, availableCurrencies]);

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchAccounts();
      fetchLendBorrowRecords();
    }
  }, [user, fetchAccounts, fetchLendBorrowRecords]);

  // Click outside handlers for dropdowns
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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (typeMenuRef.current && !typeMenuRef.current.contains(event.target as Node)) {
        setShowTypeMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
        setShowStatusMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (presetDropdownRef.current && !presetDropdownRef.current.contains(event.target as Node)) {
        setShowPresetDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper to capitalize first letter
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  // Mobile filter functionality
  useEffect(() => {
    if (showMobileFilterMenu) {
      setTempFilters(filters);
    }
  }, [showMobileFilterMenu, filters]);

  const handleCloseModal = () => {
    setTempFilters({
      type: 'all',
      status: 'active',
      search: '',
      currency: '',
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

  // Helper function to get default currency
  const getDefaultCurrency = () => {
    if (profile?.local_currency && availableCurrencies.includes(profile.local_currency)) {
      return profile.local_currency;
    }
    return availableCurrencies[0] || 'USD';
  };

  if (loading) {
    return (
      <div>
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

  if (availableCurrencies.length === 0) {
    return <div className="min-h-[300px] flex items-center justify-center text-xl">No accounts or currencies found. Please add an account first.</div>;
  }

  if (!selectedCurrency) {
    return <div className="min-h-[300px] flex items-center justify-center text-xl">No currency selected or available.</div>;
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
    <div>
      {/* Unified Table View - New Section */}
      <div className="space-y-6">
        <div className="space-y-6">
          {/* Unified Filters and Table */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 pb-[13px] lg:pb-0">
          {/* Filters Section */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start" style={{ marginBottom: 0 }}>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 w-full">
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
                      placeholder="Search lend & borrow…"
                    />
                  </div>
                </div>

                {/* Selection Filter */}
                {hasSelection && selectedRecord && (
                  <SelectionFilter
                    label="Selected"
                    value={selectedRecord.person_name || 'Lend/Borrow Record'}
                    onClear={clearSelection}
                  />
                )}

                {/* Mobile Filter and Add Buttons */}
                <div className="md:hidden flex items-center gap-2">
                  <button
                    onClick={() => setShowMobileFilterMenu(true)}
                    className={`px-2 py-1.5 text-[13px] h-8 w-8 rounded-md transition-colors flex items-center justify-center ${
                      (filters.type !== 'all' || filters.status !== 'all' || filters.currency || filters.dateRange.start || filters.dateRange.end)
                        ? 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                    style={(filters.type !== 'all' || filters.status !== 'all' || filters.currency || filters.dateRange.start || filters.dateRange.end) ? { background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' } : {}}
                    title="Filters"
                  >
                    <Filter className="w-4 h-4" />
                  </button>
                  {isLendBorrowWidgetHidden && (
                    <button
                      onClick={handleShowLendBorrowWidgetFromPage}
                      disabled={isRestoringWidget}
                      className="bg-gray-100 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center text-[13px] min-h-[44px] min-w-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Show Lend & Borrow Widget on Dashboard"
                      aria-label="Show Lend & Borrow Widget on Dashboard"
                    >
                      {isRestoringWidget ? (
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Eye className="w-4 h-4" aria-hidden="true" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => setShowForm(true)}
                    className="bg-gradient-primary text-white px-2 py-1.5 rounded-md hover:bg-gradient-primary-hover transition-colors flex items-center justify-center text-[13px] h-8 w-8"
                    title="Add Lent/Borrow"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="hidden md:block">
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowCurrencyMenu(v => !v);
                        setShowTypeMenu(false);
                        setShowStatusMenu(false);
                      }}
                      className={`px-3 py-1.5 pr-2 text-[13px] h-8 rounded-md transition-colors flex items-center space-x-1.5 ${
                        filters.currency 
                          ? 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                      style={filters.currency ? { background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' } : {}}
                    >
                      <span>{capitalize(filters.currency || getDefaultCurrency())}</span>
                      <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showCurrencyMenu && (
                      <div className="absolute left-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                        {availableCurrencies.map(currency => (
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
                  <div className="relative" ref={typeMenuRef}>
                    <button
                      onClick={() => {
                        setShowTypeMenu(v => !v);
                        setShowCurrencyMenu(false);
                        setShowStatusMenu(false);
                      }}
                      className={`px-3 py-1.5 pr-2 text-[13px] h-8 rounded-md transition-colors flex items-center space-x-1.5 ${
                        filters.type !== 'all' 
                          ? 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                      style={filters.type !== 'all' ? { background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' } : {}}
                    >
                      <span>{filters.type === 'all' ? 'All Types' : (filters.type === 'lend' ? t('lendBorrow.lend') : t('lendBorrow.borrow'))}</span>
                      <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showTypeMenu && (
                      <div className="absolute left-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                        <button
                          onClick={() => { setFilters({ ...filters, type: 'all' }); setShowTypeMenu(false); }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${filters.type === 'all' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : ''}`}
                        >
                          All Types
                        </button>
                        <button
                          onClick={() => { setFilters({ ...filters, type: 'lend' }); setShowTypeMenu(false); }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${filters.type === 'lend' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : ''}`}
                        >
                          {t('lendBorrow.lend')}
                        </button>
                        <button
                          onClick={() => { setFilters({ ...filters, type: 'borrow' }); setShowTypeMenu(false); }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${filters.type === 'borrow' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : ''}`}
                        >
                          {t('lendBorrow.borrow')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="hidden md:block">
                  <div className="relative" ref={statusMenuRef}>
                    <button
                      onClick={() => {
                        setShowStatusMenu(v => !v);
                        setShowCurrencyMenu(false);
                        setShowTypeMenu(false);
                      }}
                      className={`px-3 py-1.5 pr-2 text-[13px] h-8 rounded-md transition-colors flex items-center space-x-1.5 ${
                      filters.status !== 'all' 
                        ? 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                    style={filters.status !== 'all' ? { background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' } : {}}
                    >
                      <span>{filters.status === 'all' ? 'All Status' : capitalize(filters.status)}</span>
                      <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showStatusMenu && (
                      <div className="absolute left-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                        <button
                          onClick={() => { setFilters({ ...filters, status: 'all' }); setShowStatusMenu(false); }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${filters.status === 'all' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : ''}`}
                        >
                          All Status
                        </button>
                        <button
                          onClick={() => { setFilters({ ...filters, status: 'active' }); setShowStatusMenu(false); }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${filters.status === 'active' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : ''}`}
                        >
                          {t('lendBorrow.active')}
                        </button>
                        <button
                          onClick={() => { setFilters({ ...filters, status: 'settled' }); setShowStatusMenu(false); }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${filters.status === 'settled' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : ''}`}
                        >
                          {t('lendBorrow.settled')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Date Range Filter */}
                <div className="hidden md:block">
                  <div className="relative" ref={presetDropdownRef}>
                    <button
                      className={`px-3 py-1.5 pr-2 text-[13px] h-8 rounded-md transition-colors flex items-center space-x-1.5 ${
                        filters.dateRange.start && filters.dateRange.end 
                          ? 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
                      } ${showPresetDropdown ? 'ring-2 ring-blue-500' : ''}`}
                      style={filters.dateRange.start && filters.dateRange.end ? { background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' } : {}}
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

                {/* Clear Filters - Only show cross icon for non-default filters */}
                {(filters.search || filters.type !== 'all' || filters.status !== 'active' || (filters.currency && filters.currency !== getDefaultCurrency()) || (filters.dateRange.start && filters.dateRange.end)) && (
                  <button
                    onClick={() => setFilters({ search: '', type: 'all', status: 'active', currency: '', dateRange: { start: '', end: '' } })}
                    className="text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center"
                    title="Clear all filters"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}

                <div className="ml-auto hidden md:flex items-center gap-2">
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
                    onClick={() => setShowForm(true)}
                    className="bg-gradient-primary text-white px-3 py-1.5 h-8 rounded-md hover:bg-gradient-primary-hover transition-colors flex items-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed text-[13px]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Lent/Borrow</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Cards Grid (above table header) */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 p-3">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 px-2">
              <div className="flex items-center justify-between">
                <div className="text-left">
                                          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Lent</p>
                  <p className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" style={{ fontSize: '1.2rem' }}>
                    {formatCurrency(currentAnalytics.total_lent, currentAnalytics.currency)}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: '11px' }}>
                    {(() => {
                      const uniqueLentTo = new Set(
                        filteredRecords
                          .filter(r => r.type === 'lend' && r.status === 'active')
                          .map(r => r.person_name)
                      ).size;
                      return `To ${uniqueLentTo} people`;
                    })()}
                  </p>
                </div>
                <span className="text-blue-600" style={{ fontSize: '1.2rem' }}>{getCurrencySymbol(currentAnalytics.currency)}</span>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 px-2">
              <div className="flex items-center justify-between">
                <div className="text-left">
                                          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Borrowed</p>
                  <p className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" style={{ fontSize: '1.2rem' }}>
                    {formatCurrency(currentAnalytics.total_borrowed, currentAnalytics.currency)}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: '11px' }}>
                    {(() => {
                      const uniqueBorrowedFrom = new Set(
                        filteredRecords
                          .filter(r => r.type === 'borrow' && r.status === 'active')
                          .map(r => r.person_name)
                      ).size;
                      return `From ${uniqueBorrowedFrom} people`;
                    })()}
                  </p>
                </div>
                <span className="text-blue-600" style={{ fontSize: '1.2rem' }}>{getCurrencySymbol(currentAnalytics.currency)}</span>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 px-2">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Outstanding</p>
                  <p className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" style={{ fontSize: '1.2rem' }}>
                    {formatCurrency(currentAnalytics.outstanding_lent - currentAnalytics.outstanding_borrowed, currentAnalytics.currency)}
                  </p>
                  <p className={`${(() => {
                      const netPosition = currentAnalytics.outstanding_lent - currentAnalytics.outstanding_borrowed;
                      return netPosition >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
                    })()}`} style={{ fontSize: '11px' }}>
                    {(() => {
                      const netPosition = currentAnalytics.outstanding_lent - currentAnalytics.outstanding_borrowed;
                      return netPosition >= 0 ? 'Net Lender' : 'Net Borrower';
                    })()}
                  </p>
                </div>
                <Clock className="text-blue-600" style={{ fontSize: '1.2rem', width: '1.2rem', height: '1.2rem' }} />
              </div>
            </div>
          </div>
          {/* Table Section */}
          <div className="overflow-x-auto lg:rounded-b-xl" style={{ borderBottomLeftRadius: '0.75rem', borderBottomRightRadius: '0.75rem' }}>
            <div className="max-h-[500px] overflow-y-auto">
              <LendBorrowList
                records={filteredRecords}
                loading={loading}
                onEdit={record => setEditingRecord(record)}
                onDelete={handleDeleteRecord}
                onUpdateStatus={handleUpdateStatus}
                onSettle={handleSettle}
                onShowSettledInfo={handleShowSettledInfo}
                selectedId={selectedId}
                isFromSearch={isFromSearch}
                selectedRecordRef={selectedRecordRef}
              />
            </div>
          </div>
        </div>
        </div>
      </div>

      <>
        {/* Form Modal */}
        {showForm && (
          <LendBorrowForm
            onClose={() => setShowForm(false)}
            onSubmit={handleAddRecord}
          />
        )}

        {/* Edit Form Modal */}
        {editingRecord && (
          <LendBorrowForm
            record={editingRecord}
            onClose={() => setEditingRecord(null)}
            onSubmit={async (updates) => {
              try {
                await handleUpdateRecord(editingRecord.id, updates);
              } catch (error) {

              }
            }}
          />
        )}
        {/* Mobile Filter Modal */}
        {showMobileFilterMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999] md:hidden">
          <div 
            className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-[calc(100vw-2rem)] max-w-xs p-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Filters</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setFilters(tempFilters);
                    setShowMobileFilterMenu(false);
                  }}
                  className={`p-1 rounded-full transition-colors ${
                    (tempFilters.type !== 'all' || tempFilters.status !== 'active' || tempFilters.currency || tempFilters.dateRange.start || tempFilters.dateRange.end)
                      ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                      : 'text-gray-400'
                  }`}
                  title="Apply Filters"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <button
                  onClick={handleCloseModal}
                  className="p-1 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Clear All"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Select filters and click ✓ to apply</p>

            {/* Filter Options */}
            <div className="space-y-4">
              {/* Currency Filter */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Currency</h4>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTempFilters({ ...tempFilters, currency: '' });
                    }}
                    className={`rounded-full px-2 py-1 text-xs transition-colors ${
                      tempFilters.currency === ''
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    All Currencies
                  </button>
                  {availableCurrencies.map(currency => (
                    <button
                      key={currency}
                      onClick={(e) => {
                        e.stopPropagation();
                        setTempFilters({ ...tempFilters, currency });
                      }}
                      className={`rounded-full px-2 py-1 text-xs transition-colors ${
                        tempFilters.currency === currency
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {currency}
                    </button>
                  ))}
                </div>
              </div>

              {/* Type Filter */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Type</h4>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTempFilters({ ...tempFilters, type: 'all' });
                    }}
                    className={`rounded-full px-2 py-1 text-xs transition-colors ${
                      tempFilters.type === 'all'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    All Types
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTempFilters({ ...tempFilters, type: 'lend' });
                    }}
                    className={`rounded-full px-2 py-1 text-xs transition-colors ${
                      tempFilters.type === 'lend'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {t('lendBorrow.lend')}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTempFilters({ ...tempFilters, type: 'borrow' });
                    }}
                    className={`rounded-full px-2 py-1 text-xs transition-colors ${
                      tempFilters.type === 'borrow'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {t('lendBorrow.borrow')}
                  </button>
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Status</h4>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTempFilters({ ...tempFilters, status: 'all' });
                    }}
                    className={`rounded-full px-2 py-1 text-xs transition-colors ${
                      tempFilters.status === 'all'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    All Status
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTempFilters({ ...tempFilters, status: 'active' });
                    }}
                    className={`rounded-full px-2 py-1 text-xs transition-colors ${
                      tempFilters.status === 'active'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {t('lendBorrow.active')}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTempFilters({ ...tempFilters, status: 'settled' });
                    }}
                    className={`rounded-full px-2 py-1 text-xs transition-colors ${
                      tempFilters.status === 'settled'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {t('lendBorrow.settled')}
                  </button>
                </div>
              </div>

              {/* Date Range Filter */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Date Range</h4>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTempFilters({ ...tempFilters, dateRange: { start: '', end: '' } });
                    }}
                    className={`rounded-full px-2 py-1 text-xs transition-colors ${
                      !tempFilters.dateRange.start && !tempFilters.dateRange.end
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
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
                    className={`rounded-full px-2 py-1 text-xs transition-colors ${
                      tempFilters.dateRange.start === new Date().toISOString().slice(0, 10) && tempFilters.dateRange.end === new Date().toISOString().slice(0, 10)
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
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
                    className={`rounded-full px-2 py-1 text-xs transition-colors ${
                      tempFilters.dateRange.start === getThisMonthDateRange().start && tempFilters.dateRange.end === getThisMonthDateRange().end
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    This Month
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settled Record Info Modal */}
      <SettledRecordInfoModal
        isOpen={settledRecordInfoModal.isOpen}
        onClose={() => setSettledRecordInfoModal({ isOpen: false, record: null })}
        record={settledRecordInfoModal.record}
      />
      </>
    </div>
  );
}; 

