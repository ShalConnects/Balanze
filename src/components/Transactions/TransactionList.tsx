import React, { useState, useRef, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, Copy, Edit2, Trash2, Plus, Search, Filter, Download, ChevronUp, ChevronDown, TrendingUp } from 'lucide-react';
import { Transaction } from '../../types/index';
import { useFinanceStore } from '../../store/useFinanceStore';
import { format } from 'date-fns';
import { TransactionForm } from './TransactionForm';
import { formatCurrency, getCurrencySymbol } from '../../utils/currency';
import { formatTransactionId } from '../../utils/transactionId';
import { toast } from 'sonner';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { parseISO } from 'date-fns';
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuthStore } from '../../store/authStore';

import { useLoadingContext } from '../../context/LoadingContext';
import { useNavigate } from 'react-router-dom';
import { useRecordSelection } from '../../hooks/useRecordSelection';
import { SelectionFilter } from '../common/SelectionFilter';

export const TransactionList: React.FC<{ 
  transactions: Transaction[];
}> = ({ transactions }) => {
  
  // Record selection functionality
  const {
    selectedRecord,
    selectedId,
    isFromSearch,
    selectedRecordRef,
    clearSelection,
    hasSelection
  } = useRecordSelection({
    records: transactions,
    recordIdField: 'id',
    scrollToRecord: true
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | undefined>();
  const { getActiveAccounts, getActiveTransactions, deleteTransaction, categories, purchaseCategories } = useFinanceStore();
  const accounts = getActiveAccounts();
  const activeTransactions = getActiveTransactions();
  const { profile } = useAuthStore();
  const { wrapAsync, setLoadingMessage } = useLoadingContext();
  const navigate = useNavigate();

  // Mobile filter modal state
  const [showMobileFilterMenu, setShowMobileFilterMenu] = useState(false);
  const [tempFilters, setTempFilters] = useState({
    search: '',
    type: 'all' as 'all' | 'income' | 'expense',
    account: 'all',
    currency: '',
    dateRange: { start: '', end: '' }
  });

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
    dateRange: getThisMonthDateRange()
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
  const currencyMenuRef = useRef<HTMLDivElement>(null); // <-- add ref for click outside
  const accountMenuRef = useRef<HTMLDivElement>(null);
  
  // State for delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

  // Add export menu state and ref
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

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

  // Export handlers
  const handleExportCSV = () => {
    const headers = ['Date', 'Description', 'Category', 'Account', 'Type', 'Amount', 'Tags'];
    const csvData = filteredTransactions.map(transaction => {
      const account = accounts.find(a => a.id === transaction.account_id);
      return [
        new Date(transaction.date).toLocaleDateString(),
        transaction.description,
        transaction.category,
        account?.name || 'Unknown',
        transaction.tags?.includes('transfer') ? 'Transfer' : transaction.type,
        transaction.amount,
        (transaction.tags || []).join('; ')
      ];
    });
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };
  const handleExportPDF = () => {
    const doc = new jsPDF();
    const headers = [['Date', 'Description', 'Category', 'Account', 'Type', 'Amount']];
    const rows = filteredTransactions.map(transaction => {
      const account = accounts.find(a => a.id === transaction.account_id);
      return [
        new Date(transaction.date).toLocaleDateString(),
        transaction.description,
        transaction.category,
        account?.name || 'Unknown',
        transaction.tags?.includes('transfer') ? 'Transfer' : transaction.type,
        transaction.amount
      ];
    });
    autoTable(doc, {
      head: headers,
      body: rows,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185] },
      margin: { top: 20 },
    });
    doc.save(`transactions-${new Date().toISOString().split('T')[0]}.pdf`);
    setShowExportMenu(false);
  };
  const handleExportHTML = () => {
    let html = '<table border="1"><thead><tr>';
    const headers = ['Date', 'Description', 'Category', 'Account', 'Type', 'Amount', 'Tags'];
    html += headers.map(h => `<th>${h}</th>`).join('') + '</tr></thead><tbody>';
    filteredTransactions.forEach(transaction => {
      const account = accounts.find(a => a.id === transaction.account_id);
      html += '<tr>' + [
        new Date(transaction.date).toLocaleDateString(),
        transaction.description,
        transaction.category,
        account?.name || 'Unknown',
        transaction.tags?.includes('transfer') ? 'Transfer' : transaction.type,
        transaction.amount,
        (transaction.tags || []).join('; ')
      ].map(field => `<td>${field}</td>`).join('') + '</tr>';
    });
    html += '</tbody></table>';
    const blob = new Blob([html], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.html`;
    a.click();
    window.URL.revokeObjectURL(url);
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

  const getAccountName = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    return account?.name || 'Unknown Account';
  };

  const handleEdit = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsFormOpen(true);
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
  };

  const handleCopyTransactionId = (transactionId: string) => {
    navigator.clipboard.writeText(transactionId);
    toast.success('Transaction ID copied to clipboard');
  };

  // Filtering
  const filteredTransactions = React.useMemo(() => {
    // If a record is selected via deep link, prioritize showing only that record
    if (hasSelection && isFromSearch && selectedRecord) {
      return [selectedRecord];
    }

    const today = new Date();
    
    const filtered = transactions
      .filter(t => !t.tags?.some(tag => tag.includes('transfer') || tag.includes('dps_transfer') || tag === 'dps_deletion'))
      .filter(t => {
        if (filters.type !== 'all' && t.type !== filters.type) return false;
        if (filters.account !== 'all' && t.account_id !== filters.account) return false;
        if (filters.currency && accounts.find(a => a.id === t.account_id)?.currency !== filters.currency) return false;
        if (
          filters.search &&
          !(
            t.description.toLowerCase().includes(filters.search.toLowerCase()) ||
            (t.transaction_id && t.transaction_id.toLowerCase().includes(filters.search.toLowerCase()))
          )
        ) return false;
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
    
    // Apply sorting
    return sortData(filtered);
  }, [transactions, filters, sortConfig, accounts]);

  // Summary card values should be based on filteredTransactions only
  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const transactionCount = filteredTransactions.length;






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

  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customStart, setCustomStart] = useState(filters.dateRange.start ? filters.dateRange.start.slice(0, 10) : '');
  const [customEnd, setCustomEnd] = useState(filters.dateRange.end ? filters.dateRange.end.slice(0, 10) : '');

  return (
    <div className="space-y-6">
      {/* Unified Filters and Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700" style={{ paddingBottom: '13px' }}>
        {/* Filters Header */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {/* Search Filter */}
            <div>
              <div className="relative">
                <Search className={`absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 ${filters.search ? 'text-blue-500' : 'text-gray-400'}`} />
                <input
                  type="text"
                  value={filters.search}
                  onChange={e => setFilters({ ...filters, search: e.target.value })}
                  className={`w-full pl-8 pr-2 py-1.5 text-[13px] h-8 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 transition-colors ${
                    filters.search 
                      ? 'border-blue-300 dark:border-blue-600' 
                      : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                  }`}
                  style={filters.search ? { background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' } : {}}
                  placeholder="Search transactions…"
                />
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
                  (filters.type !== 'all' || filters.account !== 'all' || filters.currency || filters.dateRange.start || filters.dateRange.end)
                    ? 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                style={(filters.type !== 'all' || filters.account !== 'all' || filters.currency || filters.dateRange.start || filters.dateRange.end) ? { background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' } : {}}
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
                  className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 px-2 py-1.5 h-8 w-8 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
                  aria-label="Export"
                  title="Export"
                >
                  <Download className="w-4 h-4" />
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                    <button
                      onClick={handleExportCSV}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      CSV
                    </button>
                    <button
                      onClick={handleExportPDF}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      PDF
                    </button>
                    <button
                      onClick={handleExportHTML}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
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
            <div className="hidden md:block relative">
              <button
                className={`px-3 py-1.5 pr-2 text-[13px] h-8 rounded-md transition-colors flex items-center space-x-1.5 ${
                  filters.dateRange.start && filters.dateRange.end 
                    ? 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
                } ${showPresetDropdown ? 'ring-2 ring-blue-500' : ''}`}
                style={filters.dateRange.start && filters.dateRange.end ? { background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' } : {}}
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
              {showPresetDropdown && (
                <div ref={presetDropdownRef} className="absolute left-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 min-w-[140px]">
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100" onClick={() => { handlePresetRange('today'); setShowPresetDropdown(false); }}>Today</button>
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100" onClick={() => { handlePresetRange('thisWeek'); setShowPresetDropdown(false); }}>This Week</button>
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100" onClick={() => { handlePresetRange('thisMonth'); setShowPresetDropdown(false); }}>This Month</button>
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100" onClick={() => { handlePresetRange('lastMonth'); setShowPresetDropdown(false); }}>Last Month</button>
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100" onClick={() => { handlePresetRange('thisYear'); setShowPresetDropdown(false); }}>This Year</button>
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100" onClick={() => { handlePresetRange('allTime'); setShowPresetDropdown(false); }}>All Time</button>
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100" onClick={() => { handlePresetRange('custom'); }}>Custom Range…</button>
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
                        className="flex-1 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 border border-blue-700 dark:border-blue-800"
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
            {(filters.search || filters.type !== 'all' || filters.account !== 'all' || (filters.currency && filters.currency !== (profile?.local_currency || 'USD')) || getDateRangeLabel() !== 'This Month') && (
              <button
                onClick={() => setFilters({ search: '', type: 'all', account: 'all', currency: '', dateRange: getThisMonthDateRange() })}
                className="text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center"
                title="Clear all filters"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
            <div className="flex-grow" />
            {/* Action Buttons in filter row */}
            <div className="hidden md:flex items-center gap-2">
              <div className="relative" ref={exportMenuRef}>
                <button
                  onClick={() => setShowExportMenu(v => !v)}
                  className="bg-gray-100 text-gray-700 px-3 py-1.5 h-8 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center"
                  aria-label="Export"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <button
                      onClick={handleExportCSV}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                    >
                      CSV
                    </button>
                    <button
                      onClick={handleExportPDF}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                    >
                      PDF
                    </button>
                    <button
                      onClick={handleExportHTML}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
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
                className="bg-gradient-primary text-white px-3 py-1.5 h-8 rounded-md hover:bg-gradient-primary-hover transition-colors flex items-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed text-[13px]"
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
                <p className="font-bold text-green-600 dark:text-green-400" style={{ fontSize: '1.2rem' }}>
                  {formatCurrency(totalIncome, selectedCurrency)}
                </p>
              </div>
              <span className="text-green-600" style={{ fontSize: '1.2rem' }}>{getCurrencySymbol(selectedCurrency)}</span>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 px-2">
            <div className="flex items-center justify-between">
              <div className="text-left">
                                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Expense</p>
                <p className="font-bold text-red-600 dark:text-red-400" style={{ fontSize: '1.2rem' }}>
                  {formatCurrency(totalExpense, selectedCurrency)}
                </p>
              </div>
              <span className="text-red-600" style={{ fontSize: '1.2rem' }}>{getCurrencySymbol(selectedCurrency)}</span>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 px-2">
            <div className="flex items-center justify-between">
              <div className="text-left">
                                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Transactions</p>
                <p className="font-bold text-blue-600 dark:text-blue-400" style={{ fontSize: '1.2rem' }}>{transactionCount}</p>
              </div>
              <span className="text-blue-600" style={{ fontSize: '1.2rem', width: '1.2rem', height: '1.2rem' }}>#</span>
            </div>
          </div>
        </div>
        {/* Desktop Table View */}
        <div className="lg:block hidden overflow-x-auto">
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
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => handleSort('last_modified')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Modified</span>
                      {getSortIcon('last_modified')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => handleSort('description')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Description</span>
                      {getSortIcon('description')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => handleSort('account')}
                  >
                    <div className="flex items-center justify-center space-x-1">
                      <span>Account</span>
                      {getSortIcon('account')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center justify-center space-x-1">
                      <span>Amount</span>
                      {getSortIcon('amount')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => handleSort('type')}
                  >
                    <div className="flex items-center justify-center space-x-1">
                      <span>Type</span>
                      {getSortIcon('type')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
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
                      <tr 
                        key={transaction.id} 
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
                        <td className="px-6 py-2 text-left">
                          <div className="text-gray-900 dark:text-white" style={{ fontSize: '14px' }}>
                            {transaction.updated_at && transaction.updated_at !== transaction.created_at ? (
                              <>
                                <div>{format(new Date(transaction.updated_at), 'MMM dd, yyyy')}</div>
                                <div className="text-xs text-blue-500 dark:text-blue-400">
                                  {format(new Date(transaction.updated_at), 'h:mm a')} ✏️
                                </div>
                              </>
                            ) : (
                              <div className="text-xs text-gray-400 dark:text-gray-500">Never</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-2">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{transaction.description}</div>
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
                        <td className="px-6 py-2 text-center">
                          <span className="text-sm text-gray-900 dark:text-white">{getAccountName(transaction.account_id)}</span>
                        </td>
                        <td className="px-6 py-2 text-center">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(transaction.amount, selectedCurrency)}</span>
                        </td>
                        <td className="px-6 py-2 text-center">
                          {transaction.type === 'income' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300">
                              <ArrowDownRight className="w-3 h-3" /> Income
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300">
                              <ArrowUpRight className="w-3 h-3" /> Expense
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-2 text-center">
                          <div className="flex justify-center gap-2 items-center">
                            <button
                              onClick={() => handleEdit(transaction)}
                              className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setTransactionToDelete(transaction); setShowDeleteModal(true); }}
                              className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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
                    className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow ${
                      isSelected 
                        ? isFromSearchSelection 
                          ? 'ring-2 ring-blue-500 ring-opacity-50 bg-blue-50 dark:bg-blue-900/20' 
                          : 'ring-2 ring-blue-500 ring-opacity-50'
                        : ''
                    }`}
                  >
                    {/* Card Header - Date and Type Badge */}
                    <div className="flex items-center justify-between p-3 pb-2">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        <div>{format(new Date(transaction.date), 'MMM dd, yyyy')}</div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center">
                          {format(new Date(transaction.created_at), 'h:mm a')}
                          {transaction.updated_at && transaction.updated_at !== transaction.created_at && (
                            <span className="ml-2 text-blue-500" title={`Last modified: ${format(new Date(transaction.updated_at), 'MMM dd, h:mm a')}`}>
                              ✏️
                            </span>
                          )}
                        </div>
                        {transaction.updated_at && transaction.updated_at !== transaction.created_at && (
                          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            Modified: {format(new Date(transaction.updated_at), 'MMM dd, h:mm a')}
                          </div>
                        )}
                      </div>
                      <div>
                        {transaction.type === 'income' ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300">
                            <ArrowDownRight className="w-2.5 h-2.5" /> Income
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300">
                            <ArrowUpRight className="w-2.5 h-2.5" /> Expense
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Body - Description and Amount */}
                    <div className="px-3 pb-2">
                      <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                        {transaction.description}
                      </div>
                      {transaction.transaction_id && (
                        <button
                          onClick={() => handleCopyTransactionId(transaction.transaction_id!)}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors mb-1"
                        >
                          <span className="font-mono">#{formatTransactionId(transaction.transaction_id)}</span>
                          <Copy className="w-2.5 h-2.5" />
                        </button>
                      )}
                      <div className="text-base font-bold text-gray-900 dark:text-white">
                        {formatCurrency(transaction.amount, selectedCurrency)}
                      </div>
                    </div>

                    {/* Card Footer - Account and Actions */}
                    <div className="flex items-center justify-between px-3 pb-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {getAccountName(transaction.account_id)}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(transaction)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { setTransactionToDelete(transaction); setShowDeleteModal(true); }}
                          className="p-1.5 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
                            <span className="ml-2 text-blue-500" title={`Last modified: ${format(new Date(transaction.updated_at), 'MMM dd, h:mm a')}`}>
                              ✏️
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="col-span-6">
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{transaction.description}</div>
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
                          <button
                            onClick={() => handleEdit(transaction)}
                            className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setTransactionToDelete(transaction); setShowDeleteModal(true); }}
                            className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                            title="Delete"
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
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Transaction Form Modal */}
      {isFormOpen && (
        <TransactionForm
          onClose={handleCloseForm}
          transactionToEdit={selectedTransaction}
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
                      (tempFilters.type !== 'all' || tempFilters.account !== 'all' || tempFilters.currency || tempFilters.dateRange.start || tempFilters.dateRange.end)
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
                        dateRange: { start: '', end: '' }
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
          </div>
        </div>
      )}
    </div>
  );
};