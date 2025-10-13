import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Plus, Edit2, Trash2, DollarSign, Info, PlusCircle, InfoIcon, Search, ArrowLeft, Wallet, ChevronUp, ChevronDown, CreditCard, Filter } from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { AccountForm } from './AccountForm';
import { TransactionForm } from '../Transactions/TransactionForm';
import { Account } from '../../types';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { generateTransactionId, createSuccessMessage } from '../../utils/transactionId';
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';
import { getAccountIcon, getAccountColor } from '../../utils/accountIcons';
import { useAuthStore } from '../../store/authStore';
import { useLoadingContext } from '../../context/LoadingContext';
import { AccountCardSkeleton, AccountTableSkeleton, AccountSummaryCardsSkeleton, AccountFiltersSkeleton } from './AccountSkeleton';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useRecordSelection } from '../../hooks/useRecordSelection';
import { SelectionFilter } from '../common/SelectionFilter';

export const AccountsView: React.FC = () => {
  const { accounts, deleteAccount, getTransactionsByAccount, transactions, loading, error, updateAccount, updateAccountPosition, fetchAccounts, showTransactionForm, setShowTransactionForm, categories, purchaseCategories } = useFinanceStore();
  const { wrapAsync, setLoadingMessage } = useLoadingContext();
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [hoveredDpsAccount, setHoveredDpsAccount] = useState<string | null>(null);
  const [dpsTransfers, setDpsTransfers] = useState<any[]>([]);

  // Memoize fetchAccounts to prevent infinite loops
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
    records: accounts,
    recordIdField: 'id',
    scrollToRecord: true
  });

  // New state for unified table view
  const [tableFilters, setTableFilters] = useState({
    search: '',
    currency: '',
    type: 'all',
    status: 'active' // 'active' or 'all'
  });
  
  // Add sorting state
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showMobileFilterMenu, setShowMobileFilterMenu] = useState(false);
  
  // Re-arrange mode state
  const [isRearrangeMode, setIsRearrangeMode] = useState(false);
  
  // Temporary filter state for mobile modal
  const [tempFilters, setTempFilters] = useState(tableFilters);

  // Refs for dropdown menus
  const currencyMenuRef = useRef<HTMLDivElement>(null);
  const typeMenuRef = useRef<HTMLDivElement>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);
  const mobileFilterMenuRef = useRef<HTMLDivElement>(null);

  // State for row expansion
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Add new state for cardCurrency
  const [cardCurrency, setCardCurrency] = useState<string>('');

  // Add separate state and ref for the top card currency filter
  const [showCardCurrencyMenu, setShowCardCurrencyMenu] = useState(false);
  const cardCurrencyMenuRef = useRef<HTMLDivElement>(null);

  // Add state for delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
  const [showDpsDeleteModal, setShowDpsDeleteModal] = useState(false);
  const [dpsDeleteContext, setDpsDeleteContext] = useState<{ mainAccount: Account, dpsAccount: Account } | null>(null);
  
  // Add state for transaction modal filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

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
  const sortData = (data: Account[]) => {
    if (!sortConfig) {
      // When no sort is active, respect manual position order
      return [...data].sort((a, b) => {
        // First sort by position (lower numbers first)
        if (a.position !== b.position) {
          return (a.position || 0) - (b.position || 0);
        }
        // If positions are equal, fall back to created_at (newest first)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    }

    return [...data].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.key) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'type':
          aValue = a.type.toLowerCase();
          bValue = b.type.toLowerCase();
          break;
        case 'currency':
          aValue = a.currency.toLowerCase();
          bValue = b.currency.toLowerCase();
          break;
        case 'balance':
          aValue = a.calculated_balance;
          bValue = b.calculated_balance;
          break;
        case 'transactions':
          const aTransactions = transactions.filter(t => t.account_id === a.id).length;
          const bTransactions = transactions.filter(t => t.account_id === b.id).length;
          aValue = aTransactions;
          bValue = bTransactions;
          break;
        case 'dps':
          aValue = a.has_dps ? 1 : 0;
          bValue = b.has_dps ? 1 : 0;
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

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === 'BDT') {
      return `৳${amount.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  // Export transactions to CSV
  const exportToCSV = () => {
    if (!selectedAccount) return;
    
    const accountTransactions = transactions
      .filter(t => t.account_id === selectedAccount.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Calculate running balances
    const sortedForBalance = [...accountTransactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const balanceMap = new Map();
    let runningBalance = Number(selectedAccount.initial_balance);
    
    sortedForBalance.forEach((tx) => {
      if (tx.type === 'income') {
        runningBalance += tx.amount;
      } else {
        runningBalance -= tx.amount;
      }
      balanceMap.set(tx.id, runningBalance);
    });
    
    // Create CSV content
    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount', 'Balance'];
    const csvContent = [
      headers.join(','),
      ...accountTransactions.map(t => [
        new Date(t.date).toLocaleDateString(),
        `"${t.description}"`,
        `"${t.category}"`,
        t.type,
        t.type === 'income' ? t.amount : -t.amount,
        balanceMap.get(t.id) || 0
      ].join(','))
    ].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedAccount.name}_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const handleAddTransaction = (accountId: string) => {
    if (checkCategoriesAndRedirect()) {
      setSelectedAccountId(accountId);
      setShowTransactionForm(true);
    }
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setShowAccountForm(true);
  };

  const handleCloseAccountForm = () => {
    setEditingAccount(null);
    setShowAccountForm(false);
  };

  const handleDeleteAccount = (account: Account) => {
    setAccountToDelete(account);
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = wrapAsync(async () => {
    if (accountToDelete) {
      setLoadingMessage('Deleting account...'); // Show loading message for account deletion
      const transactionId = generateTransactionId();
      await deleteAccount(accountToDelete.id, transactionId);
      // Toast notification is already handled in the finance store deleteAccount function
      setShowDeleteModal(false);
      setAccountToDelete(null);
    }
  });

  const totalBalance = accounts.reduce((sum, account) => sum + account.calculated_balance, 0);

  // Debug DPS accounts - removed for production

  // Group accounts by currency
  const accountsByCurrency = useMemo(() => {
    return accounts
      .filter(account => {
        // Filter out DPS savings accounts (accounts that are linked to other accounts)
        const isDpsSavingsAccount = accounts.some(otherAccount => 
          otherAccount.dps_savings_account_id === account.id
        );
        return !isDpsSavingsAccount;
      })
      .reduce((groups, account) => {
        const currency = account.currency;
        if (!groups[currency]) {
          groups[currency] = [];
        }
        groups[currency].push(account);
        return groups;
      }, {} as Record<string, Account[]>);
  }, [accounts]);

  // Accordion state for currency sections
  const currencyKeys = Object.keys(accountsByCurrency);
  const defaultOpenCurrency = currencyKeys[0];
  const [openCurrency, setOpenCurrency] = useState<string>(defaultOpenCurrency);

  const { profile } = useAuthStore();

  useEffect(() => {
    // Fetch DPS transfers for the current user
    const fetchDpsTransfers = async () => {
      const { data, error } = await supabase
        .from('dps_transfers')
        .select('*');
      if (!error) setDpsTransfers(data || []);
    };
    fetchDpsTransfers();
  }, []);

  useEffect(() => {
    if (user) {
      fetchAccountsCallback();
    }
  }, [user, fetchAccountsCallback]);

  // Get all unique currencies from accounts
  const accountCurrencies = Array.from(new Set(accounts.map(a => a.currency)));
  // Only show selected_currencies if available, else all from accounts
  const currencyOptions = useMemo(() => {
    if (profile?.selected_currencies && profile.selected_currencies.length > 0) {
      return accountCurrencies.filter(c => profile.selected_currencies?.includes?.(c));
    }
    return accountCurrencies;
  }, [profile?.selected_currencies, accountCurrencies]);
  const accountTypes = Array.from(new Set(accounts.map(a => a.type)));



  // Filter accounts (for cards and table)
  const filteredAccounts = useMemo(() => {
    // If a record is selected via deep link, prioritize showing only that record
    if (hasSelection && isFromSearch && selectedRecord) {
      return [selectedRecord];
    }

    return accounts.filter(account => {
      const matchesSearch = account.name.toLowerCase().includes(tableFilters.search.toLowerCase()) ||
                           account.description?.toLowerCase().includes(tableFilters.search.toLowerCase());
      const matchesCurrency = tableFilters.currency === '' || account.currency === tableFilters.currency;
      const matchesType = tableFilters.type === 'all' || account.type === tableFilters.type;
      const matchesStatus = tableFilters.status === 'all' || (tableFilters.status === 'active' && account.isActive);
      
      return matchesSearch && matchesCurrency && matchesType && matchesStatus;
    });
  }, [accounts, tableFilters, hasSelection, isFromSearch, selectedRecord]);

  // Sort filtered accounts for table display only
  const filteredAccountsForTable = useMemo(() => {
    return sortData(filteredAccounts);
  }, [filteredAccounts, sortConfig, transactions]);

  // Click outside handlers for dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (currencyMenuRef.current && !currencyMenuRef.current.contains(event.target as Node)) {
        setShowCurrencyMenu(false);
      }
      // Removed mobile filter menu click outside handler - modal should only close via explicit actions
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // Row expansion handlers
  const toggleRowExpansion = (accountId: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(accountId)) {
      newExpandedRows.delete(accountId);
    } else {
      newExpandedRows.add(accountId);
    }
    setExpandedRows(newExpandedRows);
  };

  const isRowExpanded = (accountId: string) => expandedRows.has(accountId);

  // DPS management handlers
  const handleToggleDPS = async (account: Account) => {
    if (account.has_dps) {
      // Disable DPS
      const confirmDisable = window.confirm('Are you sure you want to disable DPS for this account?');
      if (confirmDisable) {
        await updateAccount(account.id, {
          has_dps: false,
          dps_type: null,
          dps_amount_type: null,
          dps_fixed_amount: null,
          dps_savings_account_id: null
        });
      }
    } else {
      // Enable DPS - open account form in edit mode
      setEditingAccount(account);
      setShowAccountForm(true);
    }
  };

  const handleManageDPS = (account: Account) => {
    setEditingAccount(account);
    setShowAccountForm(true);
  };

  // New DPS delete handler with balance transfer
  const handleDeleteDPSWithTransfer = async (mainAccount: Account, dpsAccount: Account) => {
    setDpsDeleteContext({ mainAccount, dpsAccount });
    setShowDpsDeleteModal(true);
  };

  const handleReorderAccounts = async (draggedId: string, targetId: string) => {
    try {
      const draggedIndex = accounts.findIndex(acc => acc.id === draggedId);
      const targetIndex = accounts.findIndex(acc => acc.id === targetId);
      
      if (draggedIndex === -1 || targetIndex === -1) return;
      
      // Calculate new position for the dragged account
      const newPosition = targetIndex + 1; // Position after the target
      
      await updateAccountPosition(draggedId, newPosition);
    } catch (error) {
      console.error('Failed to reorder accounts:', error);
    }
  };

  const confirmDeleteDPS = async (moveToMainAccount: boolean) => {
    if (!dpsDeleteContext) return;
    
    const { mainAccount, dpsAccount } = dpsDeleteContext;
    const dpsBalance = dpsAccount.calculated_balance;
    
    try {
      if (moveToMainAccount) {
        // Move DPS balance to main account by creating an income transaction
        await updateAccount(mainAccount.id, {
          dps_savings_account_id: null,
          has_dps: false,
          dps_type: null,
          dps_amount_type: null,
          dps_fixed_amount: null
        });
        await deleteAccount(dpsAccount.id);
        // Add income transaction to main account
        await useFinanceStore.getState().addTransaction({
          account_id: mainAccount.id,
          amount: dpsBalance,
          type: 'income',
          description: 'DPS balance returned on DPS account deletion',
          category: 'DPS',
          date: new Date().toISOString(),
          user_id: mainAccount.user_id,
          tags: ['dps_deletion'],
        });
        toast.success('DPS account deleted and balance moved to Cash Wallet');
      } else {
        // Find cash account for the same currency
        let cashAccount = accounts.find(a => a.type === 'cash' && a.currency === dpsAccount.currency);
        if (!cashAccount) {
          // Create a new cash account for this currency
          const newAccountName = 'Cash Wallet';
          const { user_id } = dpsAccount;
          const newAccount = {
            name: newAccountName,
            type: 'cash' as const,
            currency: dpsAccount.currency,
            initial_balance: 0,
            calculated_balance: 0,
            isActive: true,
            user_id,
            updated_at: new Date().toISOString(),
          };
          // Assume addAccount returns the created account with id
          const created = await useFinanceStore.getState().addAccount(newAccount);
          // Refetch accounts to get the new one
          await useFinanceStore.getState().fetchAccounts();
          cashAccount = useFinanceStore.getState().accounts.find(a => a.type === 'cash' && a.currency === dpsAccount.currency);
          toast.success(`New Cash Wallet created for ${dpsAccount.currency}`);
        }
        if (cashAccount) {
          // Do NOT update initial_balance. Only add income transaction to cash account
          await useFinanceStore.getState().addTransaction({
            account_id: cashAccount.id,
            amount: dpsBalance,
            type: 'income',
            description: `DPS balance transferred from ${dpsAccount.name}`,
            category: 'DPS',
            date: new Date().toISOString(),
            user_id: cashAccount.user_id,
            tags: ['dps_deletion'],
          });
        }
        // Delete DPS account and update main account
        await updateAccount(mainAccount.id, {
          dps_savings_account_id: null,
          has_dps: false,
          dps_type: null,
          dps_amount_type: null,
          dps_fixed_amount: null
        });
        await deleteAccount(dpsAccount.id);
        toast.success('DPS account deleted and balance moved to Cash Wallet');
      }
    } catch (error) {
      console.error('Error deleting DPS:', error);
      toast.error('Failed to delete DPS account');
    }
    
    setShowDpsDeleteModal(false);
    setDpsDeleteContext(null);
  };

  // Set default cardCurrency to first available currency
  useEffect(() => {
    if (accountCurrencies.length > 0 && (!cardCurrency || !accountCurrencies.includes(cardCurrency))) {
      setCardCurrency(accountCurrencies[0]);
    }
  }, [accountCurrencies, cardCurrency]);

  // Add click outside handler for card currency menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (cardCurrencyMenuRef.current && !cardCurrencyMenuRef.current.contains(event.target as Node)) {
        setShowCardCurrencyMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync tempFilters with tableFilters when modal opens
  useEffect(() => {
    if (showMobileFilterMenu) {
      setTempFilters(tableFilters);
    }
  }, [showMobileFilterMenu, tableFilters]);

  // Handle closing modal without applying filters
  const handleCloseModal = () => {
    setShowMobileFilterMenu(false);
    // Reset tempFilters to current tableFilters when closing without applying
    setTempFilters(tableFilters);
  };

  // Handle escape key to close modal
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

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Smooth skeleton for accounts page */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700" style={{ paddingBottom: '13px' }}>
          {/* Filters skeleton */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <AccountFiltersSkeleton />
          </div>
          
          {/* Summary cards skeleton */}
          <div className="p-4">
            <AccountSummaryCardsSkeleton />
          </div>
          
          {/* Responsive skeleton - Desktop table, Mobile cards */}
          <div className="hidden md:block p-4">
            <AccountTableSkeleton rows={6} />
          </div>
          <div className="md:hidden">
            <AccountCardSkeleton count={4} />
          </div>
        </div>
      </div>
    );
  }
  if (error) {
    return <div className="min-h-[300px] flex items-center justify-center text-red-600 text-xl">{error}</div>;
  }

  return (
    <div>
      {/* Header */}
      {/* Only keep the header at the top-level layout, remove this one from the body */}



      {/* Unified Table View - New Section */}
      <div className="space-y-6">

        {/* Unified Filters and Table */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700" style={{ paddingBottom: '13px' }}>
          {/* Filters Section */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1" style={{ marginBottom: 0 }}>
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
                      placeholder="Search accounts..."
                    />
                  </div>
                </div>

                {/* Selection Filter */}
                {hasSelection && selectedRecord && (
                  <SelectionFilter
                    label="Selected"
                    value={selectedRecord.name || 'Account'}
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

                {/* Mobile Add Account Button */}
                <div className="md:hidden">
                  <button
                    onClick={() => {
                      setEditingAccount(null);
                      setShowAccountForm(true);
                    }}
                    className="bg-gradient-primary text-white px-2 py-1.5 rounded-md hover:bg-gradient-primary-hover transition-colors flex items-center justify-center text-[13px] h-8 w-8"
                    title="Add Account"
                    aria-label="Add Account"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>


                {/* Mobile Clear Filters Button */}
                <div className="md:hidden">
                  {(tableFilters.search || tableFilters.currency || tableFilters.type !== 'all' || tableFilters.status !== 'active') && (
                    <button
                      onClick={() => setTableFilters({ search: '', currency: '', type: 'all', status: 'active' })}
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
                      <span>{tableFilters.currency === '' ? 'All Currencies' : tableFilters.currency}</span>
                      <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showCurrencyMenu && (
                      <div className="absolute left-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                        <button
                          onClick={() => { setTableFilters({ ...tableFilters, currency: '' }); setShowCurrencyMenu(false); }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${tableFilters.currency === '' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' : ''}`}
                        >
                          All Currencies
                        </button>
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
                      <span>{tableFilters.type === 'all' ? 'All Types' : tableFilters.type.charAt(0).toUpperCase() + tableFilters.type.slice(1)}</span>
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
                        {accountTypes.map(type => (
                          <button
                            key={type}
                            onClick={() => { setTableFilters({ ...tableFilters, type }); setShowTypeMenu(false); }}
                            className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${tableFilters.type === type ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' : ''}`}
                          >
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Filter */}
                <div className="relative" ref={statusMenuRef}>
                  <button
                    onClick={() => setShowStatusMenu(v => !v)}
                    className={`px-3 py-1.5 pr-2 text-[13px] h-8 rounded-md transition-colors flex items-center space-x-1.5 ${
                      tableFilters.status !== 'active' 
                        ? 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                    style={tableFilters.status !== 'active' ? { background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' } : {}}
                  >
                                          <span>{tableFilters.status === 'active' ? 'Active Only' : 'All Accounts'}</span>
                      <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                  </button>
                  {showStatusMenu && (
                    <div className="absolute left-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                      <button
                        onClick={() => { setTableFilters({ ...tableFilters, status: 'active' }); setShowStatusMenu(false); }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${tableFilters.status === 'active' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' : ''}`}
                      >
                        Active Only
                      </button>
                      <button
                        onClick={() => { setTableFilters({ ...tableFilters, status: 'all' }); setShowStatusMenu(false); }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${tableFilters.status === 'all' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' : ''}`}
                      >
                        All Accounts
                      </button>
                    </div>
                  )}
                </div>

                {/* Clear Filters */}
                {(tableFilters.search || tableFilters.currency || tableFilters.type !== 'all' || tableFilters.status !== 'active') && (
                  <button
                    onClick={() => setTableFilters({ search: '', currency: '', type: 'all', status: 'active' })}
                    className="text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center"
                    title="Clear all filters"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              
              <div className="flex-grow" />
              {/* Action Buttons in filter row */}
              <div className="hidden md:flex items-center gap-2">
                <button
                  data-tour="add-account"
                  onClick={() => {
                    setEditingAccount(null);
                    setShowAccountForm(true);
                  }}
                  className="bg-gradient-primary text-white px-3 py-1.5 h-8 rounded-md hover:bg-gradient-primary-hover transition-colors flex items-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed text-[13px]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Account</span>
                </button>
                
                <button
                  onClick={() => setIsRearrangeMode(!isRearrangeMode)}
                  className={`hidden md:flex px-3 py-1.5 h-8 rounded-md transition-colors items-center space-x-1.5 text-[13px] ${
                    isRearrangeMode 
                      ? 'bg-gradient-primary text-white hover:bg-gradient-primary-hover' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                  title={isRearrangeMode ? 'Exit Re-arrange Mode' : 'Re-arrange Accounts'}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                  </svg>
                  <span>{isRearrangeMode ? 'Done' : 'Re-arrange'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Summary Cards - Now dynamic and after filters */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 p-3">
            {(() => {
              const filteredTransactions = transactions.filter(t => filteredAccounts.some(a => a.id === t.account_id));
              // Use the first account's currency or fallback
              const currency = filteredAccounts[0]?.currency || 'USD';
              const currencySymbol = {
                USD: '$', BDT: '৳', EUR: '€', GBP: '£', JPY: '¥', ALL: 'L', INR: '₹', CAD: '$', AUD: '$'
              }[currency] || currency;
              return (
                <>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 px-2">
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Active Accounts</p>
                        <p className="font-bold text-green-600 dark:text-green-400" style={{ fontSize: '1.2rem' }}>{filteredAccounts.filter(a => a.isActive).length}</p>
                      </div>
                      <span className="text-green-600" style={{ fontSize: '1.2rem' }}>{currencySymbol}</span>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 px-2">
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Transactions</p>
                        <p className="font-bold text-blue-600 dark:text-blue-400" style={{ fontSize: '1.2rem' }}>{filteredTransactions.length}</p>
                      </div>
                      <span className="text-blue-600" style={{ fontSize: '1.2rem' }}>{currencySymbol}</span>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 px-2">
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">DPS Accounts</p>
                        <p className="font-bold text-purple-600 dark:text-purple-400" style={{ fontSize: '1.2rem' }}>{filteredAccounts.filter(a => a.has_dps).length}</p>
                      </div>
                      <svg className="text-purple-600" style={{ fontSize: '1.2rem', width: '1.2rem', height: '1.2rem' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2l4 -4" /></svg>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>

                                        {/* Table Section */}
          <div className="overflow-x-auto">
            {/* Desktop Table View */}
            <div className="hidden lg:block max-h-[500px] overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900 text-[14px]">
                <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Account Name</span>
                      {getSortIcon('name')}
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
                    onClick={() => handleSort('currency')}
                  >
                    <div className="flex items-center justify-center space-x-1">
                      <span>Currency</span>
                      {getSortIcon('currency')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => handleSort('balance')}
                  >
                    <div className="flex items-center justify-center space-x-1">
                      <span>Balance</span>
                      {getSortIcon('balance')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => handleSort('transactions')}
                  >
                    <div className="flex items-center justify-center space-x-1">
                      <span>Transactions</span>
                      {getSortIcon('transactions')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => handleSort('dps')}
                  >
                    <div className="flex items-center justify-center space-x-1">
                      <span>DPS</span>
                      {getSortIcon('dps')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAccountsForTable.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                        <CreditCard className="w-12 h-12 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No account records found</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                        Start tracking your financial accounts by adding your first account
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredAccountsForTable.map((account) => {
                    const accountTransactions = transactions
                      .filter(t => t.account_id === account.id)
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                    const incomeTransactions = accountTransactions.filter(t => t.type === 'income');
                    const expenseTransactions = accountTransactions.filter(t => t.type === 'expense');
                    
                    // Calculate total saved and donated
                    let totalSaved = 0;
                    let totalDonated = 0;
                    incomeTransactions.forEach(t => {
                      const income = t.amount;
                      if (t.category === 'Savings') {
                        totalSaved += income;
                      } else if (t.category === 'Donation') {
                        totalDonated += income;
                      }
                    });
                    
                    // Get DPS savings account
                    const dpsSavingsAccount = accounts.find(a => a.id === account.dps_savings_account_id);
                    
                    // Check if this account is a DPS savings account (linked to another account)
                    const isDpsSavingsAccount = accounts.some(otherAccount => 
                      otherAccount.dps_savings_account_id === account.id
                    );
                    
                    const isSelected = selectedId === account.id;
                    const isFromSearchSelection = isFromSearch && isSelected;
                    
                    return (
                      <React.Fragment key={account.id}>
                        <tr 
                          id={`account-${account.id}`}
                          ref={isSelected ? selectedRecordRef : null}
                          className={`hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${
                            isSelected 
                              ? isFromSearchSelection 
                                ? 'ring-2 ring-blue-500 ring-opacity-50 bg-blue-50 dark:bg-blue-900/20' 
                                : 'ring-2 ring-blue-500 ring-opacity-50'
                              : ''
                          }`} 
                          draggable={isRearrangeMode}
                          onDragStart={isRearrangeMode ? (e) => {
                            e.dataTransfer.effectAllowed = 'move';
                            e.dataTransfer.setData('text/html', account.id);
                          } : undefined}
                          onDragOver={isRearrangeMode ? (e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move';
                          } : undefined}
                          onDrop={isRearrangeMode ? async (e) => {
                            e.preventDefault();
                            const draggedId = e.dataTransfer.getData('text/html');
                            if (draggedId && draggedId !== account.id) {
                              await handleReorderAccounts(draggedId, account.id);
                            }
                          } : undefined}
                          onClick={() => toggleRowExpansion(account.id)}
                        >
                          <td className="px-6 py-[0.7rem]">
                            <div className="flex items-center">
                              {isRearrangeMode && (
                                <div 
                                  className="mr-2 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                  </svg>
                                </div>
                              )}
                              <div className="flex-1">
                                <div 
                                  className="text-sm font-medium text-gray-900 dark:text-white relative group"
                                >
                                  {account.name.charAt(0).toUpperCase() + account.name.slice(1)}
                                  {account.description && (
                                    <div className="absolute left-0 bottom-full mb-2 w-64 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 shadow-xl border border-gray-700">
                                      {account.description}
                                      <div className="absolute bottom-0 left-4 transform translate-y-1/2 w-2 h-2 bg-gray-800 rotate-45 border-r border-b border-gray-700"></div>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="ml-2">
                                <svg 
                                  className={`w-4 h-4 text-gray-400 transition-transform ${isRowExpanded(account.id) ? 'rotate-90' : ''}`} 
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-[0.7rem]">
                            <span className={`inline-flex items-center justify-center text-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAccountColor(account.type)}`}>
                              {account.type === 'cash' ? 'Cash' : account.type.charAt(0).toUpperCase() + account.type.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-[0.7rem] text-center">
                            <span className="text-sm text-gray-900 dark:text-white">{account.currency}</span>
                          </td>
                          <td className="px-6 py-[0.7rem] text-center">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {formatCurrency(account.calculated_balance, account.currency)}
                            </span>
                          </td>
                          <td className="px-6 py-[0.7rem] text-center">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {accountTransactions.length}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {incomeTransactions.length} income, {expenseTransactions.length} expense
                            </div>
                          </td>
                          <td className="px-6 py-[0.7rem] text-center">
                            <div className="flex flex-col items-center gap-1">
                              {account.has_dps ? (
                                <>
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200">
                                    Active
                                  </span>
                                  {dpsSavingsAccount && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      {formatCurrency(dpsSavingsAccount.calculated_balance, dpsSavingsAccount.currency)}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-[0.7rem] text-center">
                            <div className="flex justify-center gap-2 items-center" onClick={(e) => e.stopPropagation()}>
                              {/* Action buttons: Only hide toggle and delete for cash and DPS savings accounts. Show info, edit, and add transaction for cash accounts. */}
                              {(!isDpsSavingsAccount && account.type !== 'cash') && (
                                <button
                                  onClick={async () => {
                                    await updateAccount(account.id, { isActive: !account.isActive });
                                  }}
                                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 ${account.isActive ? 'bg-green-600' : 'bg-gray-300'}`}
                                  title={account.isActive ? 'Deactivate Account' : 'Activate Account'}
                                >
                                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 ${account.isActive ? 'translate-x-5' : 'translate-x-1'}`} />
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setSelectedAccount(account);
                                  setModalOpen(true);
                                }}
                                className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                                title="More Info"
                              >
                                <InfoIcon className="w-4 h-4" />
                              </button>
                              {!isDpsSavingsAccount && (
                                <button
                                  onClick={() => handleEditAccount(account)}
                                  data-tour="edit-account"
                                  className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                                  title="Edit"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              )}
                              {!isDpsSavingsAccount && (
                                <button
                                  onClick={() => handleAddTransaction(account.id)}
                                  data-tour="add-transaction"
                                  className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                                  title="Add Transaction"
                                >
                                  <PlusCircle className="w-4 h-4" />
                                </button>
                              )}
                              {(account.type !== 'cash' && !isDpsSavingsAccount) && (
                                <button
                                  onClick={() => handleDeleteAccount(account)}
                                  className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        
                        {/* Expanded Row Content */}
                        {isRowExpanded(account.id) && (
                          <tr className="bg-gray-50 dark:bg-gray-800">
                            <td colSpan={7} className="px-6 py-[0.7rem]">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Account Details */}
                                <div className="space-y-2">
                                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Account Details</h4>
                                  <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                                    <div>
                                      <span className="font-medium">Initial Balance:</span> {formatCurrency(Number(account.initial_balance), account.currency)}
                                    </div>
                                    {accounts.some(a => a.dps_savings_account_id === account.id) && (
                                      <div>
                                        <span className="font-medium">DPS Balance:</span> {
                                          (() => {
                                            const incoming = dpsTransfers
                                              .filter(t => t.to_account_id === account.id)
                                              .reduce((sum, t) => sum + (t.amount || 0), 0);
                                            return formatCurrency(incoming, account.currency);
                                          })()
                                        }
                                      </div>
                                    )}
                                    {!accounts.some(a => a.dps_savings_account_id === account.id) && (
                                      <>
                                        <div><span className="font-medium">Total Saved:</span> {formatCurrency(totalSaved, account.currency)}</div>
                                        <div><span className="font-medium">Total Donated:</span> {formatCurrency(totalDonated, account.currency)}</div>
                                      </>
                                    )}
                                    <div><span className="font-medium">Last Transaction:</span> {accountTransactions.length > 0 ? new Date(accountTransactions[accountTransactions.length - 1].date).toLocaleDateString() : 'None'}</div>
                                  </div>
                                </div>

                                {/* DPS Information */}
                                <div className="space-y-2">
                                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">DPS Settings</h4>
                                  {account.has_dps ? (
                                    <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                                      <div><span className="font-medium">Type:</span> {account.dps_type}</div>
                                      <div><span className="font-medium">Amount Type:</span> {account.dps_amount_type}</div>
                                      {account.dps_fixed_amount && (
                                        <div><span className="font-medium">Fixed Amount:</span> {formatCurrency(account.dps_fixed_amount, account.currency)}</div>
                                      )}
                                      {dpsSavingsAccount && (
                                        <div><span className="font-medium">Savings Account:</span> {dpsSavingsAccount.name}</div>
                                      )}
                                      <div className="pt-2 flex gap-2">
                                        <button
                                          onClick={() => handleManageDPS(account)}
                                          className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
                                        >
                                          Manage DPS
                                        </button>
                                        <button
                                          onClick={() => handleDeleteDPSWithTransfer(account, dpsSavingsAccount || account)}
                                          className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
                                        >
                                          Delete DPS
                                        </button>
                                      </div>
                                    </div>
                                  ) : isDpsSavingsAccount ? (
                                    <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                                      {(() => {
                                        // Find the main account that created this DPS account
                                        const mainAccount = accounts.find(a => a.dps_savings_account_id === account.id);
                                        if (mainAccount) {
                                          return (
                                            <>
                                              <div><span className="font-medium">DPS Type:</span> {mainAccount.dps_type === 'monthly' ? 'Monthly' : 'Flexible'}</div>
                                              <div><span className="font-medium">Linked to:</span> {mainAccount.name}</div>
                                            </>
                                          );
                                        }
                                        return <div>DPS Savings Account</div>;
                                      })()}
                                    </div>
                                  ) : (
                                    <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                                      <div>No DPS configured</div>
                                      <div className="pt-2">
                                        <button
                                          onClick={() => handleToggleDPS(account)}
                                          className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
                                        >
                                          Enable DPS
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Recent History */}
                                <div className="space-y-2">
                                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Recent History</h4>
                                  <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                                    {accountTransactions.slice(0, 3).map((transaction, index) => (
                                      <div key={transaction.id} className="flex justify-between items-center">
                                        <div className="flex-1 min-w-0">
                                          <div className="truncate">
                                            {(transaction.description || 'No description').length > 20 
                                              ? (transaction.description || 'No description').substring(0, 20) + '...'
                                              : (transaction.description || 'No description')
                                            }
                                          </div>
                                        </div>
                                        <div className={`font-medium ml-2 ${transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount, account.currency)}
                                        </div>
                                      </div>
                                    ))}
                                    {accountTransactions.length === 0 && (
                                      <div className="text-gray-400 italic">No transactions yet</div>
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



            {/* Mobile/Tablet Stacked Table View */}
            <div className="lg:hidden max-h-[500px] overflow-y-auto">
              <div className="space-y-4 px-2.5">
                {filteredAccountsForTable.length === 0 ? (
                  <div className="py-16 text-center">
                    <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                      <CreditCard className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No account records found</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                      Start tracking your financial accounts by adding your first account
                    </p>
                  </div>
                ) : (
                  filteredAccountsForTable.map((account) => {
                    const accountTransactions = transactions
                      .filter(t => t.account_id === account.id)
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                    const incomeTransactions = accountTransactions.filter(t => t.type === 'income');
                    const expenseTransactions = accountTransactions.filter(t => t.type === 'expense');
                    
                    // Calculate total saved and donated
                    let totalSaved = 0;
                    let totalDonated = 0;
                    incomeTransactions.forEach(t => {
                      const income = t.amount;
                      if (t.category === 'Savings') {
                        totalSaved += income;
                      } else if (t.category === 'Donation') {
                        totalDonated += income;
                      }
                    });
                    
                    // Get DPS savings account
                    const dpsSavingsAccount = accounts.find(a => a.id === account.dps_savings_account_id);
                    
                    // Check if this account is a DPS savings account (linked to another account)
                    const isDpsSavingsAccount = accounts.some(otherAccount => 
                      otherAccount.dps_savings_account_id === account.id
                    );
                    
                    return (
                      <div key={account.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        {/* Stacked Table Row */}
                        <div 
                          className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          onClick={() => toggleRowExpansion(account.id)}
                        >
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {/* Account Name */}
                            <div className="col-span-2 md:col-span-1">
                              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Account Name</div>
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {account.name.charAt(0).toUpperCase() + account.name.slice(1)}
                                </div>
                                <svg 
                                  className={`w-4 h-4 text-gray-400 transition-transform ${isRowExpanded(account.id) ? 'rotate-90' : ''}`} 
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </div>

                            {/* Type */}
                            <div>
                              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Type</div>
                              <div>
                                <span className={`inline-flex items-center justify-center text-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAccountColor(account.type)}`}>
                                  {account.type === 'cash' ? 'Cash' : account.type.charAt(0).toUpperCase() + account.type.slice(1)}
                                </span>
                              </div>
                            </div>

                            {/* Balance */}
                            <div>
                              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Balance</div>
                              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                {formatCurrency(account.calculated_balance, account.currency)}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="col-span-2 md:col-span-1">
                              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Actions</div>
                              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                {(!isDpsSavingsAccount && account.type !== 'cash') && (
                                  <button
                                    onClick={async () => {
                                      await updateAccount(account.id, { isActive: !account.isActive });
                                    }}
                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 ${account.isActive ? 'bg-green-600' : 'bg-gray-300'}`}
                                    title={account.isActive ? 'Deactivate Account' : 'Activate Account'}
                                  >
                                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 ${account.isActive ? 'translate-x-5' : 'translate-x-1'}`} />
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setSelectedAccount(account);
                                    setModalOpen(true);
                                  }}
                                  className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                                  title="More Info"
                                >
                                  <InfoIcon className="w-4 h-4" />
                                </button>
                                {!isDpsSavingsAccount && (
                                  <button
                                    onClick={() => handleEditAccount(account)}
                                    className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                                    title="Edit Account"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                )}
                                {!isDpsSavingsAccount && (
                                  <button
                                    onClick={() => handleAddTransaction(account.id)}
                                    className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                                    title="Add Transaction"
                                  >
                                    <PlusCircle className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Additional Info Row */}
                          <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <div>
                              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Currency</div>
                              <div className="text-sm text-gray-900 dark:text-white">{account.currency}</div>
                            </div>
                            <div>
                              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Transactions</div>
                              <div className="text-sm text-gray-900 dark:text-white">
                                {accountTransactions.length}
                                <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                                  ({incomeTransactions.length} income, {expenseTransactions.length} expense)
                                </span>
                              </div>
                            </div>
                            <div>
                              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">DPS</div>
                              <div>
                                {account.has_dps ? (
                                  <div className="flex flex-col gap-1">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 w-fit">
                                      Active
                                    </span>
                                    {dpsSavingsAccount && (
                                      <span className="text-xs text-gray-500 dark:text-gray-400 break-words">
                                        {formatCurrency(dpsSavingsAccount.calculated_balance, dpsSavingsAccount.currency)}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Content */}
                        {isRowExpanded(account.id) && (
                          <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {/* Account Details */}
                              <div className="space-y-2">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Account Details</h4>
                                <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                                  <div>
                                    <span className="font-medium">Initial Balance:</span> {formatCurrency(Number(account.initial_balance), account.currency)}
                                  </div>
                                  {accounts.some(a => a.dps_savings_account_id === account.id) && (
                                    <div>
                                      <span className="font-medium">DPS Balance:</span> {
                                        (() => {
                                          const incoming = dpsTransfers
                                            .filter(t => t.to_account_id === account.id)
                                            .reduce((sum, t) => sum + (t.amount || 0), 0);
                                          return formatCurrency(Number(account.initial_balance) + incoming, account.currency);
                                        })()
                                      }
                                    </div>
                                  )}
                                  {!accounts.some(a => a.dps_savings_account_id === account.id) && (
                                    <>
                                      <div><span className="font-medium">Total Saved:</span> {formatCurrency(totalSaved, account.currency)}</div>
                                      <div><span className="font-medium">Total Donated:</span> {formatCurrency(totalDonated, account.currency)}</div>
                                    </>
                                  )}
                                  <div><span className="font-medium">Last Transaction:</span> {accountTransactions.length > 0 ? new Date(accountTransactions[accountTransactions.length - 1].date).toLocaleDateString() : 'None'}</div>
                                </div>
                              </div>

                              {/* DPS Information */}
                              <div className="space-y-2">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white">DPS Settings</h4>
                                {account.has_dps ? (
                                  <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                                    <div><span className="font-medium">Type:</span> {account.dps_type}</div>
                                    <div><span className="font-medium">Amount Type:</span> {account.dps_amount_type}</div>
                                    {account.dps_fixed_amount && (
                                      <div><span className="font-medium">Fixed Amount:</span> {formatCurrency(account.dps_fixed_amount, account.currency)}</div>
                                    )}
                                    {dpsSavingsAccount && (
                                      <div><span className="font-medium">Savings Account:</span> {dpsSavingsAccount.name}</div>
                                    )}
                                    <div className="pt-2 flex gap-2">
                                      <button
                                        onClick={() => handleManageDPS(account)}
                                        className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
                                      >
                                        Manage DPS
                                      </button>
                                      <button
                                        onClick={() => handleDeleteDPSWithTransfer(account, dpsSavingsAccount || account)}
                                        className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
                                      >
                                        Delete DPS
                                      </button>
                                    </div>
                                  </div>
                                ) : isDpsSavingsAccount ? (
                                  <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                                    {(() => {
                                      // Find the main account that created this DPS account
                                      const mainAccount = accounts.find(a => a.dps_savings_account_id === account.id);
                                      if (mainAccount) {
                                        return (
                                          <>
                                            <div><span className="font-medium">DPS Type:</span> {mainAccount.dps_type === 'monthly' ? 'Monthly' : 'Flexible'}</div>
                                            <div><span className="font-medium">Linked to:</span> {mainAccount.name}</div>
                                          </>
                                        );
                                      }
                                      return <div>DPS Savings Account</div>;
                                    })()}
                                  </div>
                                ) : (
                                  <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                                    <div>No DPS configured</div>
                                    <div className="pt-2">
                                      <button
                                        onClick={() => handleToggleDPS(account)}
                                        className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
                                      >
                                        Enable DPS
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Recent History */}
                              <div className="space-y-2">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Recent History</h4>
                                <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                                  {accountTransactions.slice(0, 3).map((transaction, index) => (
                                    <div key={transaction.id} className="flex justify-between items-center">
                                      <div className="flex-1 min-w-0">
                                        <div className="truncate">
                                          {(transaction.description || 'No description').length > 20 
                                            ? (transaction.description || 'No description').substring(0, 20) + '...'
                                            : (transaction.description || 'No description')
                                          }
                                        </div>
                                      </div>
                                      <div className={`font-medium ml-2 ${transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount, account.currency)}
                                      </div>
                                    </div>
                                  ))}
                                  {accountTransactions.length === 0 && (
                                    <div className="text-gray-400 italic">No transactions yet</div>
                                  )}
                                </div>
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
        </div>
      </div>

      {accounts.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No account records found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
            Start tracking your financial accounts by adding your first account
          </p>
          <button
            onClick={() => setShowAccountForm(true)}
            className="bg-gradient-primary text-white px-6 py-2 rounded-lg hover:bg-gradient-primary-hover transition-colors"
          >
            Add Your First Account
          </button>
        </div>
      )}

      {/* Account Form Modal */}
      <AccountForm
        isOpen={showAccountForm}
        onClose={handleCloseAccountForm}
        account={editingAccount || undefined}
      />

      {/* Transaction Form Modal */}
      {showTransactionForm && (
        <TransactionForm
          accountId={selectedAccountId}
          onClose={() => {
            setShowTransactionForm(false);
            setSelectedAccountId('');
          }}
        />
      )}

      {/* Delete Account Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal && !!accountToDelete}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteAccount}
        title="Delete Account"
        message={`Are you sure you want to delete ${accountToDelete?.name}? This will remove all associated transactions and cannot be undone.`}
        recordDetails={
          <>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium text-red-800">Account Details:</span>
            </div>
            <div className="text-sm text-red-700 space-y-1">
              <div><span className="font-medium">Name:</span> {accountToDelete?.name}</div>
              <div><span className="font-medium">Type:</span> {accountToDelete?.type}</div>
              <div><span className="font-medium">Balance:</span> {formatCurrency(accountToDelete?.calculated_balance || 0, accountToDelete?.currency || 'USD')}</div>
          </div>
          </>
        }
        confirmLabel="Delete Account"
        cancelLabel="Cancel"
      />

      {/* DPS Delete Confirmation Modal */}
      {showDpsDeleteModal && dpsDeleteContext && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setShowDpsDeleteModal(false)} />
          <div className="relative bg-white rounded-lg p-4 max-w-sm w-full mx-2 shadow-xl">
            {/* Header */}
            <div className="text-center mb-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">Delete DPS Account</h3>
              <p className="text-gray-600 text-xs">Choose where to transfer your remaining balance</p>
            </div>

            {/* Balance Display */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded p-3 mb-4 text-center">
              <div className="text-xl font-bold text-blue-700 mb-0.5">
                {formatCurrency(dpsDeleteContext.dpsAccount.calculated_balance, dpsDeleteContext.dpsAccount.currency)}
              </div>
              <div className="text-xs text-blue-600">Available Balance</div>
            </div>

            {/* Action Cards */}
            <div className="space-y-2 mb-3">
              <button
                onClick={() => confirmDeleteDPS(true)}
                className="w-full p-2 border border-blue-200 rounded hover:border-blue-400 hover:bg-blue-50 transition-all duration-150 group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center">
                    <ArrowLeft className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-gray-900 text-sm">Move to Main Account</div>
                    <div className="text-xs text-gray-600">Transfer balance back to your primary account</div>
                  </div>
                  <div className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Recommended</div>
                </div>
              </button>

              <div className="flex items-center justify-center">
                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-[10px] font-semibold text-gray-500">or</span>
                </div>
              </div>

              <button
                onClick={() => confirmDeleteDPS(false)}
                className="w-full p-2 border border-green-200 rounded hover:border-green-400 hover:bg-green-50 transition-all duration-150 group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-gray-900 text-sm">Move to Cash Wallet</div>
                    <div className="text-xs text-gray-600">Create or use existing cash wallet</div>
                  </div>
                  <div className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Auto-create</div>
                </div>
              </button>
            </div>

            {/* Cancel Button */}
            <button
              onClick={() => setShowDpsDeleteModal(false)}
              className="w-full py-2 text-gray-500 hover:text-gray-700 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {modalOpen && selectedAccount && (
        <>
          {/* Mobile Full Screen Modal */}
          <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setModalOpen(false)} />
            <div className="relative bg-white w-full h-full flex flex-col overflow-hidden">
              {/* Mobile Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
                <h2 className="text-lg font-semibold text-gray-900">Account Details</h2>
                <button 
                  className="text-gray-500 hover:text-gray-700 p-1" 
                  onClick={() => setModalOpen(false)}
                >
                  ✕
                </button>
              </div>
              
              {/* Mobile Scrollable Content */}
              <div className="flex-1 overflow-y-auto overscroll-contain -webkit-overflow-scrolling-touch" style={{ height: 'calc(100vh - 60px)' }}>
                <div className="p-4 space-y-4">
                  {/* Mobile Transactions Section */}
                  <div>
                    <h3 className="text-base font-bold mb-3">Transactions</h3>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="max-h-96 overflow-y-auto overscroll-contain -webkit-overflow-scrolling-touch">
                        <table className="w-full border-collapse">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                              <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {(() => {
                              const accountTransactions = transactions
                                .filter(t => t.account_id === selectedAccount.id)
                                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

                              if (accountTransactions.length === 0) {
                                return (
                                  <tr>
                                    <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                                      No transactions found
                                    </td>
                                  </tr>
                                );
                              }

                              return accountTransactions.map((t) => (
                                <tr key={t.id} className="hover:bg-gray-50">
                                  <td className="px-2 py-2 text-xs text-gray-900">
                                    {new Date(t.date).toLocaleDateString()}
                                  </td>
                                  <td className="px-2 py-2 text-xs">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                      t.type === 'income' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                      {t.type}
                                    </span>
                                  </td>
                                  <td className="px-2 py-2 text-xs text-right font-medium">
                                    <span className={t.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, selectedAccount.currency)}
                                    </span>
                                  </td>
                                </tr>
                              ));
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Account Info Section */}
                  <div>
                    <h3 className="text-base font-bold mb-3">Account Info</h3>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="space-y-2 text-sm">
                        <div><b>Name:</b> {selectedAccount.name.charAt(0).toUpperCase() + selectedAccount.name.slice(1)}</div>
                        <div><b>Type:</b> <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getAccountColor(selectedAccount.type)} ml-1`}>
                          {selectedAccount.type === 'cash' ? 'Cash Wallet' : selectedAccount.type.charAt(0).toUpperCase() + selectedAccount.type.slice(1)}
                        </span></div>
                        <div><b>Initial Balance:</b> {formatCurrency(Number(selectedAccount.initial_balance), selectedAccount.currency)}</div>
                        <div><b>Currency:</b> {selectedAccount.currency}</div>
                        <div><b>Description:</b> {selectedAccount.description || 'N/A'}</div>
                        <div><b>Transactions:</b> {transactions.filter(t => t.account_id === selectedAccount.id).length}</div>
                        <div><b>Total Saved:</b> {formatCurrency(0, selectedAccount.currency)}</div>
                        <div><b>Total Donated:</b> {formatCurrency(0, selectedAccount.currency)}</div>
                        <div><b>Donation Preference:</b> None</div>
                        
                        {/* Current Balance Section */}
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="text-sm font-semibold text-blue-900 mb-1">Current Balance</div>
                          <div className="text-lg font-bold text-blue-600">
                            {formatCurrency(selectedAccount.calculated_balance || 0, selectedAccount.currency)}
                          </div>
                        </div>
                        
                        {/* Print Statement Button */}
                        <div className="mt-4">
                          <button 
                            onClick={() => window.print()}
                            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            Print Statement
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Modal */}
          <div className="hidden lg:flex fixed inset-0 z-50 items-start justify-center p-4 pt-16">
            <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setModalOpen(false)} />
            <div className="relative bg-white w-full max-w-6xl rounded-lg shadow-2xl flex flex-col overflow-hidden" style={{ maxHeight: 'calc(100vh - 8rem)' }}>
            {/* Close Button - Absolute positioned */}
            <button 
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 p-1 z-10" 
              onClick={() => setModalOpen(false)}
            >
              ✕
            </button>

              {/* Main Content: Transactions and Account Info - Full height scrollable container */}
              <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 p-3 sm:p-4 pt-8 pb-6 flex-1 min-h-0" style={{ maxHeight: 'calc(100vh - 12rem)', overflow: 'hidden' }}>
              {/* Left: Transactions List (100% on mobile, 80% on desktop) - Scrollable */}
              <div className="w-full lg:w-4/5 flex flex-col min-h-0">
                <h3 className="text-sm sm:text-base font-bold mb-2">Transactions</h3>
                <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden">
                  <div className="h-full overflow-y-auto overscroll-contain -webkit-overflow-scrolling-touch">
                    <table className="w-full border-collapse">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-1 sm:px-2 py-1 sm:py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-1 sm:px-2 py-1 sm:py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                            Description
                          </th>
                          <th className="px-1 sm:px-2 py-1 sm:py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                            Category
                          </th>
                          <th className="px-1 sm:px-2 py-1 sm:py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-1 sm:px-2 py-1 sm:py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-1 sm:px-2 py-1 sm:py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                            Balance
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {(() => {
                          const accountTransactions = transactions
                            .filter(t => t.account_id === selectedAccount.id)
                            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); // Sort by created_at, newest first

                          if (accountTransactions.length === 0) {
                            return (
                              <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                  No transactions found
                                </td>
                              </tr>
                            );
                          }

                          // Calculate running balances correctly (chronological order for balance calculation)
                          const sortedForBalance = [...accountTransactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                          const balanceMap = new Map();
                          let runningBalance = Number(selectedAccount.initial_balance);
                          
                          sortedForBalance.forEach((tx) => {
                            if (tx.type === 'income') {
                              runningBalance += tx.amount;
                            } else {
                              runningBalance -= tx.amount;
                            }
                            balanceMap.set(tx.id, runningBalance);
                          });

                          return accountTransactions.map((t) => (
                            <tr key={t.id} className="hover:bg-gray-50">
                              <td className="px-1 sm:px-2 py-1 sm:py-2 text-xs text-gray-900">
                                {new Date(t.date).toLocaleDateString()}
                              </td>
                              <td className="px-1 sm:px-2 py-1 sm:py-2 text-xs font-medium text-gray-900 hidden sm:table-cell">
                                {t.description}
                              </td>
                              <td className="px-1 sm:px-2 py-1 sm:py-2 text-xs text-gray-500 hidden md:table-cell">
                                {t.category}
                              </td>
                              <td className="px-1 sm:px-2 py-1 sm:py-2 text-xs">
                                <span className={`inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full ${
                                  t.type === 'income' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {t.type}
                                </span>
                              </td>
                              <td className="px-1 sm:px-2 py-1 sm:py-2 text-xs text-right font-medium">
                                <span className={t.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                                  {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, selectedAccount.currency)}
                                </span>
                              </td>
                              <td className="px-1 sm:px-2 py-1 sm:py-2 text-xs text-right text-blue-600 font-medium hidden lg:table-cell">
                                {formatCurrency(balanceMap.get(t.id) || 0, selectedAccount.currency)}
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right: Account Info (100% on mobile, 20% on desktop) - Scrollable on mobile */}
              <div className="w-full lg:w-1/5 flex flex-col mt-3 lg:mt-0">
                <h3 className="text-sm sm:text-base font-bold mb-2">Account Info</h3>
                <div className="flex-1 p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-200 overflow-y-auto overscroll-contain -webkit-overflow-scrolling-touch">
                  <div className="space-y-1.5 sm:space-y-2 text-xs">
                    <div><b>Name:</b> {selectedAccount.name.charAt(0).toUpperCase() + selectedAccount.name.slice(1)}</div>
                    <div><b>Type:</b> <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getAccountColor(selectedAccount.type)} ml-1`}>
                      {selectedAccount.type === 'cash' ? 'Cash Wallet' : selectedAccount.type.charAt(0).toUpperCase() + selectedAccount.type.slice(1)}
                    </span></div>
                    <div><b>Initial Balance:</b> {formatCurrency(Number(selectedAccount.initial_balance), selectedAccount.currency)}</div>
                    <div><b>Currency:</b> {selectedAccount.currency}</div>
                    <div><b>Description:</b> {selectedAccount.description || 'N/A'}</div>
                    <div><b>Transactions:</b> {transactions.filter(t => t.account_id === selectedAccount.id).length}</div>
                    <div><b>Total Saved:</b> {formatCurrency(0, selectedAccount.currency)}</div>
                    <div><b>Total Donated:</b> {formatCurrency(0, selectedAccount.currency)}</div>
                    <div><b>Donation Preference:</b> None</div>
                    
                    {/* Current Balance Section */}
                    <div className="mt-3 sm:mt-4 p-2 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-xs font-semibold text-blue-900 mb-1">Current Balance</div>
                      <div className="text-sm sm:text-base font-bold text-blue-600">
                        {formatCurrency(selectedAccount.calculated_balance || 0, selectedAccount.currency)}
                      </div>
                    </div>
                    
                    {/* Print Statement Button */}
                    <div className="mt-2 sm:mt-3">
                      <button 
                        onClick={() => window.print()}
                        className="w-full px-2 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs"
                      >
                        Print Statement
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </>
      )}

      {/* Mobile Filter Modal */}
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
                      setTableFilters({ search: '', currency: '', type: 'all', status: 'active' });
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
                {accountTypes.map(type => (
                  <button
                    key={type}
                    onClick={(e) => {
                      e.stopPropagation();
                      setTempFilters({ ...tempFilters, type });
                    }}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                      tempFilters.type === type 
                        ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200' 
                        : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Status Filter */}
            <div className="px-3 py-2">
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
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};