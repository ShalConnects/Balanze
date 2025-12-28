import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Dialog } from '@headlessui/react';
import { Plus, Edit2, Trash2, DollarSign, Info, PlusCircle, InfoIcon, Search, ArrowLeft, Wallet, ChevronUp, ChevronDown, CreditCard, Filter, ArrowUpDown, X, Loader2, ArrowLeftRight } from 'lucide-react';
import { isToday, isYesterday, isThisWeek, format, differenceInDays } from 'date-fns';
import { useFinanceStore } from '../../store/useFinanceStore';
import { AccountForm } from './AccountForm';
import { TransactionForm } from '../Transactions/TransactionForm';
import { TransferModal } from '../Transfers/TransferModal';
import { DPSTransferModal } from '../Transfers/DPSTransferModal';
import { Account } from '../../types';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { generateTransactionId, createSuccessMessage } from '../../utils/transactionId';
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';
import { getAccountIcon, getAccountColor } from '../../utils/accountIcons';
import { useAuthStore } from '../../store/authStore';
import { useLoadingContext } from '../../context/LoadingContext';
import { usePlanFeatures } from '../../hooks/usePlanFeatures';
import { AccountCardSkeleton, AccountTableSkeleton, AccountSummaryCardsSkeleton, AccountFiltersSkeleton } from './AccountSkeleton';
import { CurrencyPortfolioSummary } from './CurrencyPortfolioSummary';
import { AccountSummaryCards } from './AccountSummaryCards';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useRecordSelection } from '../../hooks/useRecordSelection';
import { SelectionFilter } from '../common/SelectionFilter';
import { searchService, SEARCH_CONFIGS } from '../../utils/searchService';
import { formatTransactionDescription } from '../../utils/transactionDescriptionFormatter';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { isLendBorrowTransaction } from '../../utils/transactionUtils';
import { formatCurrency } from '../../utils/currency';

// Helper function to get date group label
const getDateGroupLabel = (date: Date): string => {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  if (isThisWeek(date)) return format(date, 'EEEE'); // Day name (Monday, Tuesday, etc.)
  const daysDiff = differenceInDays(new Date(), date);
  if (daysDiff < 7) return format(date, 'EEEE');
  if (daysDiff < 30) return format(date, 'MMM dd');
  return format(date, 'MMM dd, yyyy');
};

// Helper function to group transactions by date
const groupTransactionsByDate = (transactions: any[]) => {
  const groups: Record<string, any[]> = {};
  
  transactions.forEach(transaction => {
    const transactionDate = new Date(transaction.date);
    const groupLabel = getDateGroupLabel(transactionDate);
    
    if (!groups[groupLabel]) {
      groups[groupLabel] = [];
    }
    groups[groupLabel].push(transaction);
  });
  
  // Sort groups by date (most recent first)
  const sortedGroups = Object.entries(groups).sort((a, b) => {
    const dateA = new Date(a[1][0].date);
    const dateB = new Date(b[1][0].date);
    return dateB.getTime() - dateA.getTime();
  });
  
  return sortedGroups;
};

export const AccountsView: React.FC = () => {
  const { accounts, deleteAccount, getTransactionsByAccount, transactions, loading, error, updateAccount, updateAccountPosition, fetchAccounts, showTransactionForm, setShowTransactionForm, categories, purchaseCategories } = useFinanceStore();
  const { wrapAsync, setLoadingMessage } = useLoadingContext();
  const { user } = useAuthStore();
  const { isPremiumPlan } = usePlanFeatures();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [hoveredDpsAccount, setHoveredDpsAccount] = useState<string | null>(null);
  const [dpsTransfers, setDpsTransfers] = useState<any[]>([]);
  
  // Transfer modal states
  const [showTransferTypeModal, setShowTransferTypeModal] = useState(false);
  const [showCurrencyTransferModal, setShowCurrencyTransferModal] = useState(false);
  const [showDpsTransferModal, setShowDpsTransferModal] = useState(false);
  const [showInBetweenTransferModal, setShowInBetweenTransferModal] = useState(false);
  
  // Android detection
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isCapacitor = !!(window as any).Capacitor;
  const isAndroidApp = isAndroid && isCapacitor;
  
  // Android download modal state
  const [showAndroidDownloadModal, setShowAndroidDownloadModal] = useState(false);

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

  // New state for unified table view - Load from localStorage or use defaults
  const [tableFilters, setTableFilters] = useState(() => {
    const saved = localStorage.getItem('accountFilters');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Validate and merge with defaults to ensure all fields exist
        return {
          search: parsed.search || '',
          currency: parsed.currency || '',
          type: parsed.type || 'all',
          status: parsed.status || 'active'
        };
      } catch {
        // If parsing fails, use defaults
      }
    }
    return {
      search: '',
      currency: '',
      type: 'all',
      status: 'active' // 'active' or 'all'
    };
  });

  // Save filters to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('accountFilters', JSON.stringify(tableFilters));
  }, [tableFilters]);

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
  const [dpsDeleteContext, setDpsDeleteContext] = useState<{ 
    mainAccountId: string, 
    dpsAccountId: string,
    dpsBalance: number,
    dpsCurrency: string
  } | null>(null);
  const [isDeletingDPS, setIsDeletingDPS] = useState(false);
  const [dpsDeleteError, setDpsDeleteError] = useState<string | null>(null);
  
  // Add state for transaction modal filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Statement export state
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [statementDateRange, setStatementDateRange] = useState({
    start: '',
    end: ''
  });
  
  // Initialize date range to last 30 days
  useEffect(() => {
    if (showStatementModal && !statementDateRange.start && !statementDateRange.end) {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);
      setStatementDateRange({
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      });
    }
  }, [showStatementModal, statementDateRange.start, statementDateRange.end]);
  
  // Print function with date range
  const handlePrint = (startDate?: string, endDate?: string) => {
    if (!selectedAccount) return;
    
    // Create a print-friendly version
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print statement');
      return;
    }
    
    // Filter transactions
    let accountTransactions = transactions.filter(t => t.account_id === selectedAccount.id);
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      accountTransactions = accountTransactions.filter(t => {
        const txDate = new Date(t.date);
        return txDate >= start && txDate <= end;
      });
    }
    
    // Sort transactions
    accountTransactions = accountTransactions.sort((a, b) => {
      const aLatestTime = a.updated_at ? Math.max(new Date(a.created_at).getTime(), new Date(a.updated_at).getTime()) : new Date(a.created_at).getTime();
      const bLatestTime = b.updated_at ? Math.max(new Date(b.created_at).getTime(), new Date(b.updated_at).getTime()) : new Date(b.created_at).getTime();
      return bLatestTime - aLatestTime;
    });
    
    // Calculate summary
    const income = accountTransactions.filter(t => t.type === 'income' && !isLendBorrowTransaction(t)).reduce((sum, t) => sum + t.amount, 0);
    const expenses = accountTransactions.filter(t => t.type === 'expense' && !isLendBorrowTransaction(t)).reduce((sum, t) => sum + t.amount, 0);
    const net = income - expenses;
    
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    const periodText = start && end 
      ? `${format(start, 'MMM dd, yyyy')} - ${format(end, 'MMM dd, yyyy')}`
      : 'All Transactions';
    
    const groupedTransactions = groupTransactionsByDate(accountTransactions);
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Account Statement - ${selectedAccount.name}</title>
          <style>
            @media print {
              @page { margin: 1cm; }
              body { margin: 0; }
            }
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              color: #000;
            }
            .header {
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            .header h1 {
              margin: 0 0 10px 0;
              font-size: 24px;
            }
            .account-info {
              margin-bottom: 20px;
            }
            .summary {
              background: #f5f5f5;
              padding: 15px;
              margin-bottom: 20px;
              border-radius: 5px;
            }
            .summary h2 {
              margin-top: 0;
              font-size: 16px;
            }
            .date-group {
              margin-bottom: 20px;
            }
            .date-group-header {
              font-weight: bold;
              font-size: 14px;
              margin: 15px 0 10px 0;
              padding: 5px;
              background: #e5e5e5;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
            }
            th {
              background: #4a5568;
              color: white;
              padding: 8px;
              text-align: left;
              font-size: 11px;
            }
            td {
              padding: 6px 8px;
              border-bottom: 1px solid #ddd;
              font-size: 10px;
            }
            tr:nth-child(even) {
              background: #f9f9f9;
            }
            .footer {
              margin-top: 30px;
              padding-top: 10px;
              border-top: 1px solid #ddd;
              font-size: 10px;
              color: #666;
            }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Account Statement</h1>
            <div class="account-info">
              <p><strong>Account:</strong> ${selectedAccount.name}</p>
              <p><strong>Type:</strong> ${selectedAccount.type.charAt(0).toUpperCase() + selectedAccount.type.slice(1)}</p>
              <p><strong>Currency:</strong> ${selectedAccount.currency}</p>
              <p><strong>Period:</strong> ${periodText}</p>
              <p><strong>Generated:</strong> ${format(new Date(), 'MMM dd, yyyy h:mm a')}</p>
            </div>
          </div>
          
          <div class="summary">
            <h2>Summary</h2>
            <p><strong>Total Income:</strong> ${formatCurrency(income, selectedAccount.currency)}</p>
            <p><strong>Total Expenses:</strong> ${formatCurrency(expenses, selectedAccount.currency)}</p>
            <p><strong>Net Amount:</strong> ${formatCurrency(net, selectedAccount.currency)}</p>
            <p><strong>Current Balance:</strong> ${formatCurrency(selectedAccount.calculated_balance || 0, selectedAccount.currency)}</p>
          </div>
          
          <h2>Transactions</h2>
          ${groupedTransactions.map(([groupLabel, groupTransactions]) => `
            <div class="date-group">
              <div class="date-group-header">${groupLabel}</div>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Type</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${groupTransactions.map(t => `
                    <tr>
                      <td>${format(new Date(t.date), 'MMM dd, yyyy')}</td>
                      <td>${formatTransactionDescription(t.description)}</td>
                      <td>${t.category || 'N/A'}</td>
                      <td>${t.type}</td>
                      <td>${formatCurrency(t.amount, selectedAccount.currency)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `).join('')}
          
          <div class="footer">
            <p>Generated by Balanze on ${format(new Date(), 'MMM dd, yyyy h:mm a')}</p>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

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
        const aPos = a.position ?? 0;
        const bPos = b.position ?? 0;
        if (aPos !== bPos) {
          return aPos - bPos;
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
  // Show currencies based on profile.selected_currencies (from Settings currency selector)
  // If selected_currencies is empty/null, show all currencies that have accounts
  const currencyOptions = useMemo(() => {
    if (profile?.selected_currencies && profile.selected_currencies.length > 0) {
      // Only show currencies that are selected in Settings
      return accountCurrencies.filter(c => profile.selected_currencies?.includes?.(c));
    }
    // If no selection in Settings, show all currencies with accounts
    return accountCurrencies;
  }, [profile?.selected_currencies, accountCurrencies]);
  const accountTypes = Array.from(new Set(accounts.map(a => a.type)));



  // Enhanced search suggestions
  const generateSearchSuggestions = useCallback((searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const suggestions = searchService.getSuggestions(
      accounts,
      searchQuery,
      ['name', 'description', 'type'],
      5
    );

    setSearchSuggestions(suggestions);
    setShowSuggestions(suggestions.length > 0);
  }, [accounts]);

  // Debounced search with loading state
  useEffect(() => {
    if (tableFilters.search.trim()) {
      setIsSearching(true);
      const timeoutId = setTimeout(() => {
        setIsSearching(false);
        generateSearchSuggestions(tableFilters.search);
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setIsSearching(false);
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  }, [tableFilters.search, generateSearchSuggestions]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSuggestions) {
        const target = event.target as Element;
        if (!target.closest('.account-search-suggestions')) {
          setShowSuggestions(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSuggestions]);

  // Enhanced filtering with fuzzy search
  const filteredAccounts = useMemo(() => {
    // If a record is selected via deep link, prioritize showing only that record
    if (hasSelection && isFromSearch && selectedRecord) {
      return [selectedRecord];
    }

    // First apply basic filters
    let filtered = accounts.filter(account => {
      // Filter out DPS savings accounts (accounts that are linked to other accounts)
      const isDpsSavingsAccount = accounts.some(otherAccount => 
        otherAccount.dps_savings_account_id === account.id
      );
      if (isDpsSavingsAccount) {
        return false; // Hide DPS savings accounts from main list
      }
      
      // Exclude accounts with currencies that are NOT in profile.selected_currencies (if set)
      // This respects the currency selection/deselection from Settings page
      if (profile?.selected_currencies && profile.selected_currencies.length > 0) {
        if (!profile.selected_currencies.includes(account.currency)) {
          return false; // Hide accounts with deselected currencies
        }
      }
      
      const matchesCurrency = tableFilters.currency === '' || account.currency === tableFilters.currency;
      const matchesType = tableFilters.type === 'all' || account.type === tableFilters.type;
      const matchesStatus = tableFilters.status === 'all' || (tableFilters.status === 'active' && account.isActive);
      
      return matchesCurrency && matchesType && matchesStatus;
    });

    // Apply fuzzy search if search term exists
    if (tableFilters.search && tableFilters.search.trim()) {
      const searchResults = searchService.search(
        filtered,
        tableFilters.search,
        'accounts',
        SEARCH_CONFIGS.accounts,
        { limit: 1000 }
      );
      
      // Extract items from search results
      filtered = searchResults.map(result => result.item);
    }

    return filtered;
  }, [accounts, tableFilters, hasSelection, isFromSearch, selectedRecord, profile?.selected_currencies]);

  // Sort filtered accounts for table display only
  const filteredAccountsForTable = useMemo(() => {
    return sortData(filteredAccounts);
  }, [filteredAccounts, sortConfig, sortData]);

  // Group accounts by currency when showing all currencies
  const groupedAccountsByCurrency = useMemo(() => {
    // Only group when currency filter is empty (showing all currencies)
    if (tableFilters.currency !== '') {
      return null; // Return null to indicate no grouping needed
    }

    const grouped: Record<string, Account[]> = {};
    filteredAccountsForTable.forEach(account => {
      if (!grouped[account.currency]) {
        grouped[account.currency] = [];
      }
      grouped[account.currency].push(account);
    });

    // Sort currencies alphabetically
    const sortedCurrencies = Object.keys(grouped).sort();
    
    return sortedCurrencies.map(currency => ({
      currency,
      accounts: grouped[currency]
    }));
  }, [filteredAccountsForTable, tableFilters.currency]);

  // Track component renders
  useEffect(() => {
    // Component render tracking removed
  });

  // Track modal state changes
  useEffect(() => {
    // Modal state tracking removed
  }, [showDpsDeleteModal, dpsDeleteContext, isDeletingDPS, dpsDeleteError]);

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
  // Handle transfer type selection
  const handleSelectTransferType = useCallback((type: 'currency' | 'dps' | 'inbetween') => {
    setShowTransferTypeModal(false);
    if (type === 'currency') {
      setShowCurrencyTransferModal(true);
    } else if (type === 'dps') {
      setShowDpsTransferModal(true);
    } else if (type === 'inbetween') {
      setShowInBetweenTransferModal(true);
    }
  }, []);

  // Refresh accounts after transfer
  const handleTransferClose = useCallback(async (type: 'currency' | 'dps' | 'inbetween') => {
    if (type === 'currency') {
      setShowCurrencyTransferModal(false);
    } else if (type === 'dps') {
      setShowDpsTransferModal(false);
    } else if (type === 'inbetween') {
      setShowInBetweenTransferModal(false);
    }
    // Refresh accounts to update balances
    await fetchAccounts();
  }, [fetchAccounts]);

  const handleDeleteDPSWithTransfer = async (mainAccount: Account, dpsAccount: Account) => {
    // Set context first
    setDpsDeleteContext({ 
      mainAccountId: mainAccount.id, 
      dpsAccountId: dpsAccount.id,
      dpsBalance: dpsAccount.calculated_balance,
      dpsCurrency: dpsAccount.currency
    });
    setDpsDeleteError(null);
    setIsDeletingDPS(false);
    
    // Set modal visible last to ensure context is ready
    setShowDpsDeleteModal(true);
  };

  const handleMoveAccountUp = async (accountId: string) => {
    try {
      const currentIndex = filteredAccountsForTable.findIndex(acc => acc.id === accountId);
      if (currentIndex <= 0) return; // Already at top
      
      const targetIndex = currentIndex - 1;
      const targetAccount = filteredAccountsForTable[targetIndex];
      
      // Update both positions simultaneously to avoid race conditions
      await Promise.all([
        updateAccountPosition(accountId, targetIndex),
        updateAccountPosition(targetAccount.id, currentIndex)
      ]);
    } catch (error) {
      // Optionally show user feedback
    }
  };

  const handleMoveAccountDown = async (accountId: string) => {
    try {
      const currentIndex = filteredAccountsForTable.findIndex(acc => acc.id === accountId);
      if (currentIndex >= filteredAccountsForTable.length - 1) return; // Already at bottom
      
      const targetIndex = currentIndex + 1;
      const targetAccount = filteredAccountsForTable[targetIndex];
      
      // Update both positions simultaneously to avoid race conditions
      await Promise.all([
        updateAccountPosition(accountId, targetIndex),
        updateAccountPosition(targetAccount.id, currentIndex)
      ]);
    } catch (error) {
      // Optionally show user feedback
    }
  };

  const confirmDeleteDPS = useCallback(async (moveToMainAccount: boolean) => {
    if (!dpsDeleteContext || isDeletingDPS) {
      return;
    }
    
    // Look up accounts from IDs to get current data
    const mainAccount = accounts.find(a => a.id === dpsDeleteContext.mainAccountId);
    const dpsAccount = accounts.find(a => a.id === dpsDeleteContext.dpsAccountId);
    
    if (!mainAccount) {
      setDpsDeleteError('Main account not found');
      return;
    }
    
    // Use stored values from context (captured when modal opened) to prevent issues during deletion
    const dpsBalance = dpsDeleteContext.dpsBalance;
    const dpsCurrency = dpsDeleteContext.dpsCurrency;
    const mainAccountUserId = mainAccount.user_id;
    const dpsAccountUserId = dpsAccount?.user_id || mainAccountUserId;
    const dpsAccountName = dpsAccount?.name || 'DPS Account';
    
    setIsDeletingDPS(true);
    setDpsDeleteError(null);
    const transactionId = generateTransactionId('account_delete');
    
    try {
      if (moveToMainAccount) {
        // Batch all operations: update account, delete account, add transaction
        // Note: updateAccount and deleteAccount will call fetchAccounts internally,
        // but we'll call it once more at the end to ensure consistency
        await Promise.all([
          (async () => {
            await updateAccount(mainAccount.id, {
              dps_savings_account_id: null,
              has_dps: false,
              dps_type: null,
              dps_amount_type: null,
              dps_fixed_amount: null
            });
          })(),
          (async () => {
            await deleteAccount(dpsAccount.id, transactionId);
          })()
        ]);
        
        // Add income transaction to main account
        await useFinanceStore.getState().addTransaction({
          account_id: mainAccount.id,
          amount: dpsBalance,
          type: 'income',
          description: 'DPS balance returned on DPS account deletion',
          category: 'DPS',
          date: new Date().toISOString(),
          user_id: mainAccountUserId,
          tags: ['dps_deletion'],
        });
        
        // Final fetch to ensure all data is synced
        await fetchAccounts();
        
        toast.success('DPS account deleted and balance moved to Cash Wallet');
        setShowDpsDeleteModal(false);
        setDpsDeleteContext(null);
      } else {
        // Find cash account for the same currency (before any operations)
        let cashAccount = accounts.find(a => a.type === 'cash' && a.currency === dpsCurrency);
        let cashAccountId: string | null = null;
        let cashAccountUserId: string | null = null;
        
        if (!cashAccount) {
          // Create a new cash account for this currency
          const newAccountName = 'Cash Wallet';
          const newAccount = {
            name: newAccountName,
            type: 'cash' as const,
            currency: dpsCurrency,
            initial_balance: 0,
            calculated_balance: 0,
            isActive: true,
            user_id: dpsAccountUserId,
            updated_at: new Date().toISOString(),
          };
          const created = await useFinanceStore.getState().addAccount(newAccount);
          cashAccountId = created?.id || null;
          cashAccountUserId = dpsAccountUserId;
          toast.success(`New Cash Wallet created for ${dpsCurrency}`);
        } else {
          cashAccountId = cashAccount.id;
          cashAccountUserId = cashAccount.user_id;
        }
        
        // Batch all operations: update main account, delete DPS account
        await Promise.all([
          (async () => {
            await updateAccount(mainAccount.id, {
              dps_savings_account_id: null,
              has_dps: false,
              dps_type: null,
              dps_amount_type: null,
              dps_fixed_amount: null
            });
          })(),
          (async () => {
            await deleteAccount(dpsAccount.id, transactionId);
          })()
        ]);
        
        // Add income transaction to cash account if we have the ID
        if (cashAccountId && cashAccountUserId) {
          await useFinanceStore.getState().addTransaction({
            account_id: cashAccountId,
            amount: dpsBalance,
            type: 'income',
            description: `DPS balance transferred from ${dpsAccountName}`,
            category: 'DPS',
            date: new Date().toISOString(),
            user_id: cashAccountUserId,
            tags: ['dps_deletion'],
          });
        }
        
        // Final fetch to ensure all data is synced
        await fetchAccounts();
        
        toast.success('DPS account deleted and balance moved to Cash Wallet');
        setShowDpsDeleteModal(false);
        setDpsDeleteContext(null);
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to delete DPS account';
      setDpsDeleteError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsDeletingDPS(false);
    }
  }, [dpsDeleteContext, isDeletingDPS, accounts, updateAccount, deleteAccount, fetchAccounts]);

  // Memoize the modal content with Portal to prevent unnecessary recreations
  // The Portal is created inside useMemo so it's only recreated when dependencies change
  // NOTE: This must be defined AFTER confirmDeleteDPS to avoid hoisting issues
  const dpsDeleteModalContent = useMemo(() => {
    if (!showDpsDeleteModal || !dpsDeleteContext) {
      return null;
    }
    
    // Check if main account is a cash account - if so, hide cash wallet option
    const mainAccount = accounts.find(a => a.id === dpsDeleteContext.mainAccountId);
    const dpsAccount = accounts.find(a => a.id === dpsDeleteContext.dpsAccountId);
    const isMainAccountCash = mainAccount?.type === 'cash';
    const showCashWalletOption = !isMainAccountCash;
    
    // Get transaction info for DPS account
    const dpsTransactions = dpsAccount ? getTransactionsByAccount(dpsAccount.id) : [];
    const transactionCount = dpsTransactions.length;
    const lastTransaction = dpsTransactions.length > 0 
      ? dpsTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
      : null;
    const lastTransactionDate = lastTransaction ? new Date(lastTransaction.date) : null;
    
    // Find existing cash account for cash wallet option
    const existingCashAccount = showCashWalletOption && dpsAccount
      ? accounts.find(a => a.type === 'cash' && a.currency === dpsDeleteContext.dpsCurrency)
      : null;
    
    const modalJSX = (
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4" onClick={isDeletingDPS ? undefined : () => setShowDpsDeleteModal(false)}>
        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-2xl w-full max-w-sm sm:max-w-2xl mx-auto max-h-[95vh] sm:max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 rounded-t-lg sm:rounded-t-xl p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Delete DPS Account</h3>
              <button
                onClick={() => setShowDpsDeleteModal(false)}
                disabled={isDeletingDPS}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg p-1.5 sm:p-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {/* Error Message */}
            {dpsDeleteError && (
              <div className="mb-4 p-3 sm:p-2 text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-xs sm:text-sm">
                {dpsDeleteError}
              </div>
            )}

            {/* Two Column Layout: Account Info | Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4">
              {/* Left Column: Account Info */}
              <div className="space-y-4">
                {/* Balance Display Card */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">Available Balance</div>
                  <div className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(dpsDeleteContext.dpsBalance, dpsDeleteContext.dpsCurrency)}
                  </div>
                </div>

                {/* DPS Details Card */}
                {dpsAccount && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">DPS Details</div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Account:</span>
                        <span className="text-gray-900 dark:text-white font-medium text-right">{dpsAccount.name}</span>
                      </div>
                      {dpsAccount.dps_type && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">Type:</span>
                          <span className="text-gray-900 dark:text-white font-medium">{dpsAccount.dps_type === 'monthly' ? 'Monthly' : 'Flexible'}</span>
                        </div>
                      )}
                      {mainAccount && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">Linked to:</span>
                          <span className="text-gray-900 dark:text-white font-medium text-right truncate ml-2">{mainAccount.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Transaction Info Card */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">Transaction History</div>
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Transactions:</span>
                      <span className="text-gray-900 dark:text-white font-medium">{transactionCount}</span>
                    </div>
                    {lastTransactionDate && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Last transaction:</span>
                        <span className="text-gray-900 dark:text-white font-medium">{format(lastTransactionDate, 'MMM dd, yyyy')}</span>
                      </div>
                    )}
                    {!lastTransactionDate && (
                      <div className="text-xs text-gray-500 dark:text-gray-500">No transactions yet</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Action Buttons */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4">Transfer Balance To</div>
                <div className="space-y-3">
                  <button
                    onClick={() => confirmDeleteDPS(true)}
                    disabled={isDeletingDPS}
                    className="w-full min-h-[56px] sm:min-h-[60px] p-4 sm:p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 active:bg-blue-100 dark:active:bg-blue-900/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-left"
                  >
                    <div className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">Move to Main Account</div>
                    {mainAccount && (
                      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5">{mainAccount.name}</div>
                    )}
                    {!mainAccount && (
                      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Transfer to your primary account</div>
                    )}
                  </button>

                  {showCashWalletOption && (
                    <button
                      onClick={() => confirmDeleteDPS(false)}
                      disabled={isDeletingDPS}
                      className="w-full min-h-[56px] sm:min-h-[60px] p-4 sm:p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-green-500 dark:hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 active:bg-green-100 dark:active:bg-green-900/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-left"
                    >
                      <div className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">Move to Cash Wallet</div>
                      {existingCashAccount ? (
                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5">{existingCashAccount.name}</div>
                      ) : (
                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Will create new cash wallet</div>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Loading Indicator */}
            {isDeletingDPS && (
              <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-3 sm:p-4 mb-4 border border-blue-200 dark:border-blue-800">
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-blue-600 dark:text-purple-400" />
                <span className="text-xs sm:text-sm font-medium text-gradient-primary">Processing deletion...</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-row gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowDpsDeleteModal(false)}
                disabled={isDeletingDPS}
                className="px-5 sm:px-4 py-2.5 sm:py-2 min-h-[44px] sm:min-h-auto text-white bg-gradient-primary hover:bg-gradient-primary-hover rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base font-medium shadow-md hover:shadow-lg active:scale-95"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
    
    // Create Portal inside useMemo so it's only recreated when dependencies change
    const portal = createPortal(modalJSX, document.body);
    return portal;
  }, [showDpsDeleteModal, dpsDeleteContext, isDeletingDPS, dpsDeleteError, confirmDeleteDPS, accounts, getTransactionsByAccount]);

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
  }, [showMobileFilterMenu, handleCloseModal]);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Enhanced skeleton for accounts page */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 pb-[13px] lg:pb-0 relative overflow-hidden">
          {/* Shimmer effect for the entire container */}
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
          
          {/* Filters skeleton */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 relative z-10">
            <AccountFiltersSkeleton />
          </div>
          
          {/* Summary cards skeleton */}
          <div className="p-4 relative z-10">
            <AccountSummaryCardsSkeleton />
          </div>
          
          {/* Responsive skeleton - Desktop table, Mobile cards */}
          <div className="hidden md:block p-4 relative z-10">
            <AccountTableSkeleton rows={6} />
          </div>
          <div className="md:hidden relative z-10">
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

        {/* Currency Portfolio Summary - Commented out for now */}
        {/* <CurrencyPortfolioSummary
          accounts={accounts}
          transactions={transactions}
          userProfile={profile}
        /> */}


        {/* Unified Filters and Table */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 pb-[13px] lg:pb-0">
          {/* Filters Section */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1" style={{ marginBottom: 0 }}>
                <div>
                  <div className="relative">
                    <Search className={`absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 ${isSearching ? 'animate-pulse text-blue-500' : tableFilters.search ? 'text-blue-500' : 'text-gray-400'}`} />
                    <input
                      type="text"
                      value={tableFilters.search}
                      onChange={(e) => setTableFilters({ ...tableFilters, search: e.target.value })}
                      onFocus={() => {
                        if (tableFilters.search && searchSuggestions.length > 0) {
                          setShowSuggestions(true);
                        }
                      }}
                      className={`w-full pl-8 pr-2 py-1.5 text-[13px] h-8 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 transition-colors ${
                        tableFilters.search 
                          ? 'border-blue-300 dark:border-blue-600' 
                          : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                      }`}
                      style={tableFilters.search ? { background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' } : {}}
                      placeholder="Search accounts..."
                    />
                    
                    {/* Search Suggestions Dropdown */}
                    {false && showSuggestions && searchSuggestions.length > 0 && (
                      <div className="account-search-suggestions absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                        {searchSuggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setTableFilters({ ...tableFilters, search: suggestion });
                              setShowSuggestions(false);
                              
                              // Track suggestion usage
                              searchService.trackSuggestionUsage(tableFilters.search, suggestion);
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
                  onClick={() => setIsRearrangeMode(!isRearrangeMode)}
                  className={`hidden md:flex px-3 py-1.5 h-8 rounded-md transition-colors items-center text-[13px] ${
                    isRearrangeMode 
                      ? 'bg-gradient-primary text-white hover:bg-gradient-primary-hover' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                  title={isRearrangeMode ? 'Exit Re-arrange Mode' : 'Re-arrange Accounts'}
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
                
                <button
                  onClick={() => setShowTransferTypeModal(true)}
                  className="bg-purple-600 text-white px-2 py-1.5 h-8 w-8 rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center"
                  title="Transfer"
                  aria-label="Transfer"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                </button>
                
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
              </div>
            </div>
          </div>

          {/* Summary Cards - Now dynamic and after filters */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-3">
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
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{tableFilters.status === 'all' ? 'All Accounts' : 'Active Accounts'}</p>
                        <p className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" style={{ fontSize: '1.2rem' }}>{tableFilters.status === 'all' ? filteredAccounts.length : filteredAccounts.filter(a => a.isActive).length}</p>
                        <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: '11px' }}>
                          {(() => {
                            const accountsToShow = tableFilters.status === 'all' ? filteredAccounts : filteredAccounts.filter(a => a.isActive);
                            const accountTypes = accountsToShow.reduce((acc, account) => {
                              acc[account.type] = (acc[account.type] || 0) + 1;
                              return acc;
                            }, {} as Record<string, number>);
                            const typeBreakdown = Object.entries(accountTypes)
                              .map(([type, count]) => `${count} ${type}`)
                              .join(', ');
                            if (tableFilters.status === 'all') {
                              const activeCount = filteredAccounts.filter(a => a.isActive).length;
                              const inactiveCount = filteredAccounts.length - activeCount;
                              if (inactiveCount > 0) {
                                return `${activeCount} active, ${inactiveCount} inactive`;
                              }
                              return typeBreakdown || 'No accounts';
                            }
                            return typeBreakdown || 'No active accounts';
                          })()}
                        </p>
                      </div>
                      <svg className="text-blue-600" style={{ fontSize: '1.2rem', width: '1.2rem', height: '1.2rem' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 px-2">
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Transactions</p>
                        <p className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" style={{ fontSize: '1.2rem' }}>{filteredTransactions.length}</p>
                        <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: '11px' }}>
                          {(() => {
                            const transactionBreakdown = filteredTransactions.reduce((acc, transaction) => {
                              acc[transaction.type] = (acc[transaction.type] || 0) + 1;
                              return acc;
                            }, {} as Record<string, number>);
                            const breakdown = Object.entries(transactionBreakdown)
                              .map(([type, count]) => `${count} ${type}`)
                              .join(', ');
                            return breakdown || 'No transactions';
                          })()}
                        </p>
                      </div>
                      <span className="text-blue-600" style={{ fontSize: '1.2rem' }}>#</span>
                    </div>
                  </div>
                  {filteredAccounts.filter(a => a.has_dps).length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 px-2">
                      <div className="flex items-center justify-between">
                        <div className="text-left">
                          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">DPS Accounts</p>
                          <p className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" style={{ fontSize: '1.2rem' }}>{filteredAccounts.filter(a => a.has_dps).length}</p>
                          <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: '11px' }}>
                            {(() => {
                              const dpsAccounts = filteredAccounts.filter(a => a.has_dps);
                              const dpsTypeBreakdown = dpsAccounts.reduce((acc, account) => {
                                const dpsType = account.dps_type || 'flexible';
                                acc[dpsType] = (acc[dpsType] || 0) + 1;
                                return acc;
                              }, {} as Record<string, number>);
                              const breakdown = Object.entries(dpsTypeBreakdown)
                                .map(([type, count]) => `${count} ${type}`)
                                .join(', ');
                              return breakdown || 'No DPS accounts';
                            })()}
                          </p>
                        </div>
                        <svg className="text-blue-600" style={{ fontSize: '1.2rem', width: '1.2rem', height: '1.2rem' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2l4 -4m5.618 -4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176 -1.332 9 -6.03 9 -11.622 0 -1.042 -.133 -2.052 -.382 -3.016z" /></svg>
                      </div>
                    </div>
                  )}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 px-2">
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Currencies</p>
                        <p className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" style={{ fontSize: '1.2rem' }}>
                          {(() => {
                            const currencies = [...new Set(filteredAccounts.map(account => account.currency))];
                            return currencies.length;
                          })()}
                        </p>
                        <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: '11px' }}>
                          {(() => {
                            const currencies = [...new Set(filteredAccounts.map(account => account.currency))];
                            return currencies.length > 1 ? currencies.join(', ') : currencies[0] || 'No currencies';
                          })()}
                        </p>
                      </div>
                      <svg className="text-blue-600" style={{ fontSize: '1.2rem', width: '1.2rem', height: '1.2rem' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" /></svg>
                    </div>
                  </div>
                  {!isPremiumPlan && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 px-2">
                      <div className="flex items-center justify-between">
                        <div className="text-left">
                          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Account Limit</p>
                          <p className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" style={{ fontSize: '1.2rem' }}>
                            {filteredAccounts.length}/3
                          </p>
                          <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: '11px' }}>
                            Free plan limit
                          </p>
                        </div>
                        <svg className="text-blue-600" style={{ fontSize: '1.2rem', width: '1.2rem', height: '1.2rem' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2l4 -4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>

                                        {/* Table Section */}
          <div className="overflow-x-auto lg:rounded-b-xl" style={{ borderBottomLeftRadius: '0.75rem', borderBottomRightRadius: '0.75rem' }}>
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
                ) : groupedAccountsByCurrency ? (
                  // Grouped by currency view
                  groupedAccountsByCurrency.map(({ currency, accounts: currencyAccounts }) => {
                    // Calculate total balance for this currency
                    const currencyTotal = currencyAccounts.reduce((sum, acc) => sum + acc.calculated_balance, 0);
                    
                    return (
                      <React.Fragment key={currency}>
                        {/* Currency Header Row */}
                        <tr className="bg-gray-100 dark:bg-gray-800/70 border-t-2 border-gray-300 dark:border-gray-600">
                          <td colSpan={7} className="px-6 py-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">{currency}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  ({currencyAccounts.length} {currencyAccounts.length === 1 ? 'account' : 'accounts'})
                                </span>
                              </div>
                              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                Total: {formatCurrency(currencyTotal, currency)}
                              </div>
                            </div>
                          </td>
                        </tr>
                        {/* Accounts for this currency */}
                        {currencyAccounts.map((account) => {
                    const accountTransactions = transactions
                      .filter(t => t.account_id === account.id)
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                    const incomeTransactions = accountTransactions.filter(t => t.type === 'income' && !isLendBorrowTransaction(t));
                    const expenseTransactions = accountTransactions.filter(t => t.type === 'expense' && !isLendBorrowTransaction(t));
                    
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
                          onClick={() => toggleRowExpansion(account.id)}
                        >
                          <td className="px-6 py-[0.7rem]">
                            <div className="flex items-center">
                              {isRearrangeMode && (
                                <div className="mr-2 flex flex-col space-y-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMoveAccountUp(account.id);
                                    }}
                                    disabled={filteredAccountsForTable.indexOf(account) === 0}
                                    className={`p-1 rounded transition-colors ${
                                      filteredAccountsForTable.indexOf(account) === 0 
                                        ? 'text-gray-300 cursor-not-allowed' 
                                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700'
                                    }`}
                                    title="Move up"
                                  >
                                    <ChevronUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMoveAccountDown(account.id);
                                    }}
                                    disabled={filteredAccountsForTable.indexOf(account) === filteredAccountsForTable.length - 1}
                                    className={`p-1 rounded transition-colors ${
                                      filteredAccountsForTable.indexOf(account) === filteredAccountsForTable.length - 1 
                                        ? 'text-gray-300 cursor-not-allowed' 
                                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700'
                                    }`}
                                    title="Move down"
                                  >
                                    <ChevronDown className="w-3 h-3" />
                                  </button>
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
                              {/* Action buttons: Only hide delete for cash and DPS savings accounts. Show info, edit, add transaction, and toggle for cash accounts. */}
                              {!isDpsSavingsAccount && (
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
                                          className="text-xs bg-gradient-primary text-white px-3 py-1.5 rounded-lg hover:bg-gradient-primary-hover transition-colors"
                                        >
                                          Manage DPS
                                        </button>
                                        <button
                                          onClick={() => handleDeleteDPSWithTransfer(account, dpsSavingsAccount || account)}
                                          className="text-xs border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
                                          onClick={() => handleManageDPS(account)}
                                          className="text-xs bg-gradient-primary text-white px-3 py-1.5 rounded-lg hover:bg-gradient-primary-hover transition-colors"
                                        >
                                          Setup DPS
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Recent Activity */}
                                <div className="space-y-2">
                                  <h4 className="text-sm font-medium text-gray-900">Recent Activity</h4>
                                  <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                                    {accountTransactions.slice(0, 3).map((transaction, index) => (
                                      <div key={transaction.id} className="flex justify-between items-center">
                                        <div className="flex-1 min-w-0">
                                          <div className="truncate">
                                            {(() => {
                                              const formattedDesc = formatTransactionDescription(transaction.description || 'No description');
                                              return formattedDesc.length > 20 
                                                ? formattedDesc.substring(0, 20) + '...'
                                                : formattedDesc;
                                            })()}
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
                              
                              {/* DPS Savings Account Section */}
                              {account.has_dps && dpsSavingsAccount && (
                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                  <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                                      <div className="space-y-2 sm:space-y-3">
                                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                                          <div className="font-medium text-gray-900 dark:text-white mb-1">Account Name</div>
                                          <div className="break-words">{dpsSavingsAccount.name}</div>
                                        </div>
                                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                                          <div className="font-medium text-gray-900 dark:text-white mb-1">Balance</div>
                                          <div className="text-base sm:text-lg font-semibold text-green-600 dark:text-green-400 break-words">
                                            {formatCurrency(dpsSavingsAccount.calculated_balance, dpsSavingsAccount.currency)}
                                          </div>
                                        </div>
                                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                                          <div className="font-medium text-gray-900 dark:text-white mb-1">Type</div>
                                          <div className="capitalize">{dpsSavingsAccount.type}</div>
                                        </div>
                                      </div>
                                      <div className="space-y-2 sm:space-y-3">
                                        {(() => {
                                          const dpsAccountTransactions = transactions
                                            .filter(t => t.account_id === dpsSavingsAccount.id)
                                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                            .slice(0, 3);
                                          return (
                                            <>
                                              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                                                <div className="font-medium text-gray-900 dark:text-white mb-1 sm:mb-2">Recent Transactions</div>
                                                {dpsAccountTransactions.length > 0 ? (
                                                  <div className="space-y-1.5 sm:space-y-2">
                                                    {dpsAccountTransactions.map((transaction) => (
                                                      <div key={transaction.id} className="flex justify-between items-start sm:items-center gap-2 text-xs">
                                                        <div className="flex-1 min-w-0 truncate">
                                                          <span className="block sm:hidden">
                                                            {formatTransactionDescription(transaction.description || 'No description').substring(0, 20)}
                                                            {formatTransactionDescription(transaction.description || 'No description').length > 20 && '...'}
                                                          </span>
                                                          <span className="hidden sm:block">
                                                            {formatTransactionDescription(transaction.description || 'No description').substring(0, 25)}
                                                            {formatTransactionDescription(transaction.description || 'No description').length > 25 && '...'}
                                                          </span>
                                                        </div>
                                                        <div className={`font-medium shrink-0 ${transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount, dpsSavingsAccount.currency)}
                                                        </div>
                                                      </div>
                                                    ))}
                                                  </div>
                                                ) : (
                                                  <div className="text-gray-400 italic text-xs sm:text-sm">No transactions yet</div>
                                                )}
                                              </div>
                                            </>
                                          );
                                        })()}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                        })}
                      </React.Fragment>
                    );
                  })
                ) : (
                  // Non-grouped view (when a specific currency is selected)
                  filteredAccountsForTable.map((account) => {
                    const accountTransactions = transactions
                      .filter(t => t.account_id === account.id)
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                    const incomeTransactions = accountTransactions.filter(t => t.type === 'income' && !isLendBorrowTransaction(t));
                    const expenseTransactions = accountTransactions.filter(t => t.type === 'expense' && !isLendBorrowTransaction(t));
                    
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
                          onClick={() => toggleRowExpansion(account.id)}
                        >
                          <td className="px-6 py-[0.7rem]">
                            <div className="flex items-center">
                              {isRearrangeMode && (
                                <div className="mr-2 flex flex-col space-y-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMoveAccountUp(account.id);
                                    }}
                                    disabled={filteredAccountsForTable.indexOf(account) === 0}
                                    className={`p-1 rounded transition-colors ${
                                      filteredAccountsForTable.indexOf(account) === 0 
                                        ? 'text-gray-300 cursor-not-allowed' 
                                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700'
                                    }`}
                                    title="Move up"
                                  >
                                    <ChevronUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMoveAccountDown(account.id);
                                    }}
                                    disabled={filteredAccountsForTable.indexOf(account) === filteredAccountsForTable.length - 1}
                                    className={`p-1 rounded transition-colors ${
                                      filteredAccountsForTable.indexOf(account) === filteredAccountsForTable.length - 1 
                                        ? 'text-gray-300 cursor-not-allowed' 
                                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700'
                                    }`}
                                    title="Move down"
                                  >
                                    <ChevronDown className="w-3 h-3" />
                                  </button>
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
                              {!isDpsSavingsAccount && (
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
                                          className="text-xs bg-gradient-primary text-white px-3 py-1.5 rounded-lg hover:bg-gradient-primary-hover transition-colors"
                                        >
                                          Manage DPS
                                        </button>
                                        <button
                                          onClick={() => handleDeleteDPSWithTransfer(account, dpsSavingsAccount || account)}
                                          className="text-xs border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
                                          onClick={() => handleManageDPS(account)}
                                          className="text-xs bg-gradient-primary text-white px-3 py-1.5 rounded-lg hover:bg-gradient-primary-hover transition-colors"
                                        >
                                          Setup DPS
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Recent Activity */}
                                <div className="space-y-2">
                                  <h4 className="text-sm font-medium text-gray-900">Recent Activity</h4>
                                  <div className="text-xs text-gray-600 space-y-1">
                                    {accountTransactions.slice(0, 3).map((transaction) => (
                                      <div key={transaction.id} className="flex justify-between">
                                        <span className="truncate">{formatTransactionDescription(transaction.description)}</span>
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
                              
                              {/* DPS Savings Account Section */}
                              {account.has_dps && dpsSavingsAccount && (
                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                  <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                                      <div className="space-y-2 sm:space-y-3">
                                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                                          <div className="font-medium text-gray-900 dark:text-white mb-1">Account Name</div>
                                          <div className="break-words">{dpsSavingsAccount.name}</div>
                                        </div>
                                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                                          <div className="font-medium text-gray-900 dark:text-white mb-1">Balance</div>
                                          <div className="text-base sm:text-lg font-semibold text-green-600 dark:text-green-400 break-words">
                                            {formatCurrency(dpsSavingsAccount.calculated_balance, dpsSavingsAccount.currency)}
                                          </div>
                                        </div>
                                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                                          <div className="font-medium text-gray-900 dark:text-white mb-1">Type</div>
                                          <div className="capitalize">{dpsSavingsAccount.type}</div>
                                        </div>
                                      </div>
                                      <div className="space-y-2 sm:space-y-3">
                                        {(() => {
                                          const dpsAccountTransactions = transactions
                                            .filter(t => t.account_id === dpsSavingsAccount.id)
                                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                            .slice(0, 3);
                                          return (
                                            <>
                                              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                                                <div className="font-medium text-gray-900 dark:text-white mb-1 sm:mb-2">Recent Transactions</div>
                                                {dpsAccountTransactions.length > 0 ? (
                                                  <div className="space-y-1.5 sm:space-y-2">
                                                    {dpsAccountTransactions.map((transaction) => (
                                                      <div key={transaction.id} className="flex justify-between items-start sm:items-center gap-2 text-xs">
                                                        <div className="flex-1 min-w-0 truncate">
                                                          <span className="block sm:hidden">
                                                            {formatTransactionDescription(transaction.description)}
                                                          </span>
                                                          <span className="hidden sm:block">
                                                            {formatTransactionDescription(transaction.description)}
                                                          </span>
                                                        </div>
                                                        <div className={`font-medium flex-shrink-0 ${transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount, dpsSavingsAccount.currency)}
                                                        </div>
                                                      </div>
                                                    ))}
                                                  </div>
                                                ) : (
                                                  <div className="text-gray-400 italic text-xs sm:text-sm">No transactions yet</div>
                                                )}
                                              </div>
                                            </>
                                          );
                                        })()}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
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
                ) : groupedAccountsByCurrency ? (
                  // Grouped by currency view
                  groupedAccountsByCurrency.map(({ currency, accounts: currencyAccounts }) => {
                    // Calculate total balance for this currency
                    const currencyTotal = currencyAccounts.reduce((sum, acc) => sum + acc.calculated_balance, 0);
                    
                    return (
                      <React.Fragment key={currency}>
                        {/* Currency Header Card */}
                        <div className="bg-gray-100 dark:bg-gray-800/70 border-2 border-gray-300 dark:border-gray-600 rounded-lg p-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">{currency}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                ({currencyAccounts.length} {currencyAccounts.length === 1 ? 'account' : 'accounts'})
                              </span>
                            </div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white text-right flex-shrink-0">
                              Total: {formatCurrency(currencyTotal, currency)}
                            </div>
                          </div>
                        </div>
                        {/* Accounts for this currency */}
                        {currencyAccounts.map((account) => {
                    const accountTransactions = transactions
                      .filter(t => t.account_id === account.id)
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                    const incomeTransactions = accountTransactions.filter(t => t.type === 'income' && !isLendBorrowTransaction(t));
                    const expenseTransactions = accountTransactions.filter(t => t.type === 'expense' && !isLendBorrowTransaction(t));
                    
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
                      <div key={account.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden relative">
                        {/* DPS Active Badge - Top Right Corner */}
                        {account.has_dps && (
                          <div className="absolute top-2 right-2 z-10">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200">
                              DPS Active
                            </span>
                          </div>
                        )}
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
                                {!isDpsSavingsAccount && (
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
                                {!isDpsSavingsAccount && account.type !== 'cash' && (
                                  <button
                                    onClick={() => handleDeleteAccount(account)}
                                    className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                    title="Delete Account"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Additional Info Row */}
                          <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
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
                                        className="text-xs bg-gradient-primary text-white px-3 py-1.5 rounded-lg hover:bg-gradient-primary-hover transition-colors"
                                      >
                                        Manage DPS
                                      </button>
                                      <button
                                        onClick={() => handleDeleteDPSWithTransfer(account, dpsSavingsAccount || account)}
                                        className="text-xs border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
                                        onClick={() => handleManageDPS(account)}
                                        className="text-xs bg-gradient-primary text-white px-3 py-1.5 rounded-lg hover:bg-gradient-primary-hover transition-colors"
                                      >
                                        Setup DPS
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>

                                {/* Recent Activity */}
                                <div className="space-y-2">
                                  <h4 className="text-sm font-medium text-gray-900">Recent Activity</h4>
                                  <div className="text-xs text-gray-600 space-y-1">
                                    {accountTransactions.slice(0, 3).map((transaction) => (
                                      <div key={transaction.id} className="flex justify-between">
                                        <span className="truncate">{formatTransactionDescription(transaction.description)}</span>
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

                            {/* DPS Savings Account Card - Nested Display */}
                            {account.has_dps && dpsSavingsAccount && (
                              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4 shadow-sm">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <div className="space-y-2 sm:space-y-3">
                                      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                                        <div className="font-medium text-gray-900 dark:text-white mb-1">Account Name</div>
                                        <div className="break-words">{dpsSavingsAccount.name}</div>
                                      </div>
                                      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                                        <div className="font-medium text-gray-900 dark:text-white mb-1">Balance</div>
                                        <div className="text-base sm:text-lg font-semibold text-green-600 dark:text-green-400 break-words">
                                          {formatCurrency(dpsSavingsAccount.calculated_balance, dpsSavingsAccount.currency)}
                                        </div>
                                      </div>
                                      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                                        <div className="font-medium text-gray-900 dark:text-white mb-1">Type</div>
                                        <div className="capitalize">{dpsSavingsAccount.type}</div>
                                      </div>
                                    </div>
                                    <div className="space-y-2 sm:space-y-3">
                                      {(() => {
                                        const dpsAccountTransactions = transactions
                                          .filter(t => t.account_id === dpsSavingsAccount.id)
                                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                          .slice(0, 3);
                                        return (
                                          <>
                                            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                                              <div className="font-medium text-gray-900 dark:text-white mb-1 sm:mb-2">Recent Transactions</div>
                                              {dpsAccountTransactions.length > 0 ? (
                                                <div className="space-y-1.5 sm:space-y-2">
                                                  {dpsAccountTransactions.map((transaction) => (
                                                    <div key={transaction.id} className="flex justify-between items-start sm:items-center gap-2 text-xs">
                                                      <div className="flex-1 min-w-0 truncate">
                                                        <span className="block sm:hidden">
                                                          {formatTransactionDescription(transaction.description || 'No description').substring(0, 20)}
                                                          {formatTransactionDescription(transaction.description || 'No description').length > 20 && '...'}
                                                        </span>
                                                        <span className="hidden sm:block">
                                                          {formatTransactionDescription(transaction.description || 'No description').substring(0, 25)}
                                                          {formatTransactionDescription(transaction.description || 'No description').length > 25 && '...'}
                                                        </span>
                                                      </div>
                                                      <div className={`font-medium shrink-0 ${transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount, dpsSavingsAccount.currency)}
                                                      </div>
                                                    </div>
                                                  ))}
                                                </div>
                                              ) : (
                                                <div className="text-gray-400 italic text-xs sm:text-sm">No transactions yet</div>
                                              )}
                                            </div>
                                          </>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                        })}
                      </React.Fragment>
                    );
                  })
                ) : (
                  // Non-grouped view (when a specific currency is selected)
                  filteredAccountsForTable.map((account) => {
                    const accountTransactions = transactions
                      .filter(t => t.account_id === account.id)
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                    const incomeTransactions = accountTransactions.filter(t => t.type === 'income' && !isLendBorrowTransaction(t));
                    const expenseTransactions = accountTransactions.filter(t => t.type === 'expense' && !isLendBorrowTransaction(t));
                    
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
                      <div key={account.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden relative">
                        {/* DPS Active Badge - Top Right Corner */}
                        {account.has_dps && (
                          <div className="absolute top-2 right-2 z-10">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200">
                              DPS Active
                            </span>
                          </div>
                        )}
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
                                {!isDpsSavingsAccount && (
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
                                {!isDpsSavingsAccount && account.type !== 'cash' && (
                                  <button
                                    onClick={() => handleDeleteAccount(account)}
                                    className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                    title="Delete Account"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Additional Info Row */}
                          <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
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
                                        className="text-xs bg-gradient-primary text-white px-3 py-1.5 rounded-lg hover:bg-gradient-primary-hover transition-colors"
                                      >
                                        Manage DPS
                                      </button>
                                      <button
                                        onClick={() => handleDeleteDPSWithTransfer(account, dpsSavingsAccount || account)}
                                        className="text-xs border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
                                        onClick={() => handleManageDPS(account)}
                                        className="text-xs bg-gradient-primary text-white px-3 py-1.5 rounded-lg hover:bg-gradient-primary-hover transition-colors"
                                      >
                                        Setup DPS
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Recent Activity */}
                              <div className="space-y-2">
                                <h4 className="text-sm font-medium text-gray-900">Recent Activity</h4>
                                <div className="text-xs text-gray-600 space-y-1">
                                  {accountTransactions.slice(0, 3).map((transaction) => (
                                    <div key={transaction.id} className="flex justify-between">
                                      <span className="truncate">{formatTransactionDescription(transaction.description)}</span>
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
                            
                            {/* DPS Savings Account Section */}
                            {account.has_dps && dpsSavingsAccount && (
                              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4 shadow-sm">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <div className="space-y-2 sm:space-y-3">
                                      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                                        <div className="font-medium text-gray-900 dark:text-white mb-1">Account Name</div>
                                        <div className="break-words">{dpsSavingsAccount.name}</div>
                                      </div>
                                      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                                        <div className="font-medium text-gray-900 dark:text-white mb-1">Balance</div>
                                        <div className="text-base sm:text-lg font-semibold text-green-600 dark:text-green-400 break-words">
                                          {formatCurrency(dpsSavingsAccount.calculated_balance, dpsSavingsAccount.currency)}
                                        </div>
                                      </div>
                                      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                                        <div className="font-medium text-gray-900 dark:text-white mb-1">Type</div>
                                        <div className="capitalize">{dpsSavingsAccount.type}</div>
                                      </div>
                                    </div>
                                    <div className="space-y-2 sm:space-y-3">
                                      {(() => {
                                        const dpsAccountTransactions = transactions
                                          .filter(t => t.account_id === dpsSavingsAccount.id)
                                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                          .slice(0, 3);
                                        return (
                                          <>
                                            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                                              <div className="font-medium text-gray-900 dark:text-white mb-1 sm:mb-2">Recent Transactions</div>
                                              {dpsAccountTransactions.length > 0 ? (
                                                <div className="space-y-1.5 sm:space-y-2">
                                                  {dpsAccountTransactions.map((transaction) => (
                                                    <div key={transaction.id} className="flex justify-between items-start sm:items-center gap-2 text-xs">
                                                      <div className="flex-1 min-w-0 truncate">
                                                        <span className="block sm:hidden">
                                                          {formatTransactionDescription(transaction.description || 'No description').substring(0, 20)}
                                                          {formatTransactionDescription(transaction.description || 'No description').length > 20 && '...'}
                                                        </span>
                                                        <span className="hidden sm:block">
                                                          {formatTransactionDescription(transaction.description || 'No description').substring(0, 25)}
                                                          {formatTransactionDescription(transaction.description || 'No description').length > 25 && '...'}
                                                        </span>
                                                      </div>
                                                      <div className={`font-medium shrink-0 ${transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount, dpsSavingsAccount.currency)}
                                                      </div>
                                                    </div>
                                                  ))}
                                                </div>
                                              ) : (
                                                <div className="text-gray-400 italic text-xs sm:text-sm">No transactions yet</div>
                                              )}
                                            </div>
                                          </>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
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
      {dpsDeleteModalContent}

      {modalOpen && selectedAccount && (
        <>
          {/* Mobile Full Screen Modal */}
          <div className="fixed inset-0 z-50 lg:hidden account-modal-mobile">
          <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setModalOpen(false)} />
            <div className="relative bg-white w-full h-full flex flex-col overflow-hidden" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
              {/* Sticky Mobile Header with Balance */}
              <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
                <div className="flex items-center justify-between p-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold text-gray-900 truncate">{selectedAccount.name}</h2>
                    <div className="text-sm font-bold text-blue-600 mt-1">
                      {formatCurrency(selectedAccount.calculated_balance || 0, selectedAccount.currency)}
                    </div>
                  </div>
                  <button 
                    className="text-gray-500 hover:text-gray-700 p-2 ml-2 flex-shrink-0" 
                    onClick={() => setModalOpen(false)}
                    aria-label="Close modal"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              {/* Mobile Scrollable Content */}
              <div className="flex-1 overflow-y-auto overscroll-contain -webkit-overflow-scrolling-touch account-modal-content" style={{ height: 'calc(100dvh - 80px - env(safe-area-inset-top, 0px))' }}>
                <div className="p-4 space-y-4">
                  {/* Mobile Transactions Section */}
                  <div>
                    <h3 className="text-base font-bold mb-3">Transactions</h3>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="max-h-96 overflow-y-auto overscroll-contain -webkit-overflow-scrolling-touch">
                        {(() => {
                          const accountTransactions = transactions
                            .filter(t => t.account_id === selectedAccount.id)
                            .sort((a, b) => {
                              const aLatestTime = a.updated_at ? Math.max(new Date(a.created_at).getTime(), new Date(a.updated_at).getTime()) : new Date(a.created_at).getTime();
                              const bLatestTime = b.updated_at ? Math.max(new Date(b.created_at).getTime(), new Date(b.updated_at).getTime()) : new Date(b.created_at).getTime();
                              return bLatestTime - aLatestTime;
                            });

                          if (accountTransactions.length === 0) {
                            return (
                              <div className="px-4 py-8 text-center text-gray-500">
                                No transactions found
                              </div>
                            );
                          }

                          const groupedTransactions = groupTransactionsByDate(accountTransactions);

                          return (
                            <div className="divide-y divide-gray-200">
                              {groupedTransactions.map(([groupLabel, groupTransactions]) => (
                                <div key={groupLabel} className="bg-white">
                                  <div className="sticky top-0 bg-gray-50 px-3 py-2 border-b border-gray-200">
                                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">{groupLabel}</h4>
                                  </div>
                                  <table className="w-full border-collapse">
                                    <tbody className="bg-white divide-y divide-gray-100">
                                      {groupTransactions.map((t) => (
                                        <tr key={t.id} className="hover:bg-gray-50">
                                          <td className="px-3 py-2 text-xs text-gray-900 w-1/3">
                                            {formatTransactionDescription(t.description)}
                                          </td>
                                          <td className="px-3 py-2 text-xs">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                              t.type === 'income' 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-red-100 text-red-800'
                                            }`}>
                                              {t.type}
                                            </span>
                                          </td>
                                          <td className="px-3 py-2 text-xs text-right font-medium">
                                            <span className={t.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                                              {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, selectedAccount.currency)}
                                            </span>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
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
                            onClick={() => {
                              if (isAndroidApp) {
                                setShowAndroidDownloadModal(true);
                              } else {
                                setShowStatementModal(true);
                              }
                            }}
                            className="w-full px-4 py-3 bg-gradient-primary text-white rounded-lg hover:bg-gradient-primary-hover transition-colors text-sm font-medium"
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
                      <tbody className="bg-white divide-y divide-gray-200">
                        {(() => {
                          const accountTransactions = transactions
                            .filter(t => t.account_id === selectedAccount.id)
                            .sort((a, b) => {
                              const aLatestTime = a.updated_at ? Math.max(new Date(a.created_at).getTime(), new Date(a.updated_at).getTime()) : new Date(a.created_at).getTime();
                              const bLatestTime = b.updated_at ? Math.max(new Date(b.created_at).getTime(), new Date(b.updated_at).getTime()) : new Date(b.created_at).getTime();
                              return bLatestTime - aLatestTime;
                            });

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

                          const groupedTransactions = groupTransactionsByDate(accountTransactions);

                          return groupedTransactions.map(([groupLabel, groupTransactions]) => (
                            <React.Fragment key={groupLabel}>
                              <tr className="bg-gray-50 sticky top-0 z-10">
                                <td colSpan={6} className="px-3 py-2 border-b border-gray-200">
                                  <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">{groupLabel}</h4>
                                </td>
                              </tr>
                              {groupTransactions.map((t) => (
                                <tr key={t.id} className="hover:bg-gray-50">
                                  <td className="px-1 sm:px-2 py-1 sm:py-2 text-xs text-gray-900">
                                    {new Date(t.date).toLocaleDateString()}
                                  </td>
                                  <td className="px-1 sm:px-2 py-1 sm:py-2 text-xs font-medium text-gray-900 hidden sm:table-cell">
                                    {formatTransactionDescription(t.description)}
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
                              ))}
                            </React.Fragment>
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
                        onClick={() => {
                          if (isAndroidApp) {
                            setShowAndroidDownloadModal(true);
                          } else {
                            setShowStatementModal(true);
                          }
                        }}
                        className="w-full px-2 py-1.5 bg-gradient-primary text-white rounded-lg hover:bg-gradient-primary-hover transition-colors text-xs"
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
                    onClick={(e) => {
                      e.stopPropagation();
                      setTableFilters(tempFilters);
                      setShowMobileFilterMenu(false);
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                    }}
                    className={`p-2 transition-colors touch-manipulation ${
                      (tempFilters.currency || tempFilters.type !== 'all' || tempFilters.status !== 'active')
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
                      setTableFilters({ search: '', currency: '', type: 'all', status: 'active' });
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

      {/* Statement Export Modal */}
      {showStatementModal && selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Export Statement</h2>
              <button
                onClick={() => setShowStatementModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Account
                </label>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedAccount.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{selectedAccount.currency}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date Range (Optional)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={statementDateRange.start}
                      onChange={(e) => setStatementDateRange({ ...statementDateRange, start: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">End Date</label>
                    <input
                      type="date"
                      value={statementDateRange.end}
                      onChange={(e) => setStatementDateRange({ ...statementDateRange, end: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Leave empty for all transactions
                </p>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    handlePrint(
                      statementDateRange.start || undefined,
                      statementDateRange.end || undefined
                    );
                    setShowStatementModal(false);
                  }}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-medium transition-all shadow-lg hover:shadow-xl"
                >
                  Print Statement
                </button>
                <button
                  onClick={() => setShowStatementModal(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium transition-colors"
                >
                  Cancel
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
                onClick={() => handleSelectTransferType('currency')}
                className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors text-left"
              >
                <div className="font-medium">Currency Transfer</div>
                <div className="text-sm opacity-90">Transfer between any accounts with exchange rates</div>
              </button>
              <button
                onClick={() => handleSelectTransferType('dps')}
                className="bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors text-left"
              >
                <div className="font-medium">DPS Transfer</div>
                <div className="text-sm opacity-90">Automatic savings transfers from DPS accounts</div>
              </button>
              <button
                onClick={() => handleSelectTransferType('inbetween')}
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
          onClose={() => handleTransferClose('currency')} 
          mode="currency" 
        />
      )}
      {showDpsTransferModal && (
        <DPSTransferModal 
          isOpen={showDpsTransferModal} 
          onClose={() => handleTransferClose('dps')} 
        />
      )}
      {showInBetweenTransferModal && (
        <TransferModal 
          isOpen={showInBetweenTransferModal} 
          onClose={() => handleTransferClose('inbetween')} 
          mode="inbetween" 
        />
      )}
    </div>
  );
};