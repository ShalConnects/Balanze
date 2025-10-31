import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Plus, ArrowRight, Search, ChevronUp, ChevronDown, Filter, Copy } from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { format } from 'date-fns';
import { formatCurrency } from '../../utils/currency';
import { formatTimeUTC } from '../../utils/timezoneUtils';
import { supabase } from '../../lib/supabase';
import { formatTransactionId } from '../../utils/transactionId';
import { toast } from 'sonner';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useRecordSelection } from '../../hooks/useRecordSelection';
import { SelectionFilter } from '../common/SelectionFilter';
import { searchService } from '../../utils/searchService';
import { TransferModal } from './TransferModal';
import { DPSTransferModal } from './DPSTransferModal';
import { Dialog } from '@headlessui/react';
import { TransferSummaryCards } from './TransferSummaryCards';
import { TransferFilters } from './TransferFilters';
import { TransferTable } from './TransferTable';
import { TransferMobileView } from './TransferMobileView';

// Move calculateRunningBalance outside of the component to avoid hooks issues
function calculateRunningBalance(accountId: string, upToDate: string, accounts: any[], allTransactions: any[]) {
  const account = accounts.find(a => a.id === accountId);
  if (!account) return 0;
  let runningBalance = Number(account.initial_balance);
  const accountTransactions = allTransactions
    .filter(t => t.account_id === accountId && new Date(t.date) <= new Date(upToDate))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  for (const tx of accountTransactions) {
    if (tx.type === 'income') runningBalance += tx.amount;
    else runningBalance -= tx.amount;
  }
  return runningBalance;
}

export const TransfersTableView: React.FC = () => {
  const { accounts } = useFinanceStore();
  const [transfers, setTransfers] = useState<any[]>([]);
  const [dpsTransfers, setDpsTransfers] = useState<any[]>([]);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Transfer modal states
  const [showTransferTypeModal, setShowTransferTypeModal] = useState(false);
  const [showCurrencyTransferModal, setShowCurrencyTransferModal] = useState(false);
  const [showDpsTransferModal, setShowDpsTransferModal] = useState(false);
  const [showInBetweenTransferModal, setShowInBetweenTransferModal] = useState(false);

  // Record selection functionality
  const {
    selectedRecord,
    isFromSearch,
    clearSelection,
    hasSelection
  } = useRecordSelection({
    records: transfers,
    recordIdField: 'id',
    scrollToRecord: true
  });

  // Table filters state - exactly like AccountsView
  const [tableFilters, setTableFilters] = useState({
    search: '',
    type: 'all',
    dateRange: '1month'
  });

  // Sorting state
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  // Dropdown menu states
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showDateMenu, setShowDateMenu] = useState(false);
  const [showMobileFilterMenu, setShowMobileFilterMenu] = useState(false);
  const dateMenuButtonRef = useRef<HTMLDivElement>(null);
  const dateMenuRef = useRef<HTMLDivElement>(null);
  const [dateMenuPos, setDateMenuPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });

  // Row expansion state
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Load data on component mount
  useEffect(() => {
    fetchTransferHistory();
  }, []);

  // Position the date menu when opened
  useEffect(() => {
    if (showDateMenu && dateMenuButtonRef.current) {
      const rect = dateMenuButtonRef.current.getBoundingClientRect();
      setDateMenuPos({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width });
    }
  }, [showDateMenu]);

  // Force loading state to false after a timeout to prevent infinite loading
  useEffect(() => {
    if (loading) {
      const timeoutId = setTimeout(() => {
        setLoading(false);
      }, 10000); // 10 second timeout
      
      return () => clearTimeout(timeoutId);
    }
  }, [loading]);

  const fetchTransferHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch regular transfers
      const { data: transferData, error: transferError } = await supabase
        .from('transactions')
        .select('*, account:accounts(name, currency)')
        .contains('tags', ['transfer'])
        .order('date', { ascending: false });

      if (transferError) throw transferError;

      // Fetch DPS transfers with account details
      const { data: dpsData, error: dpsError } = await supabase
        .from('dps_transfers')
        .select(`
          *,
          from_account:accounts!from_account_id(name, currency),
          to_account:accounts!to_account_id(name, currency)
        `)
        .order('date', { ascending: false });

      if (dpsError) throw dpsError;

      // Fetch all transactions for before/after balance calculation
      const { data: allTx, error: allTxError } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: true });
      if (allTxError) throw allTxError;

      setTransfers(transferData || []);
      setDpsTransfers(dpsData || []);
      setAllTransactions(allTx || []);
    } catch (err: any) {
      setError(err.message);
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
        type: fromAccount?.currency === toAccount?.currency ? 'inbetween' : 'currency'
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
    return dpsTransfers.map(t => ({ ...t, type: 'dps' }));
  }, [dpsTransfers]);

  // All transfers combined
  const allTransfers = useMemo(() => {
    return [
      ...combinedTransfers,
      ...processedDpsTransfers
    ];
  }, [combinedTransfers, processedDpsTransfers]);

  // Filter transfers based on search and filters
  const filteredTransfers = useMemo(() => {
    let filtered = allTransfers;

    // Apply search filter
    if (tableFilters.search && tableFilters.search.trim()) {
      const searchResults = searchService.search(
        filtered,
        tableFilters.search,
        'transfers',
        { 
          threshold: 0.3,
          keys: [
            { name: 'fromAccount.name', weight: 0.3 },
            { name: 'toAccount.name', weight: 0.3 },
            { name: 'note', weight: 0.2 },
            { name: 'type', weight: 0.2 }
          ]
        },
        { limit: 1000 }
      );
      filtered = searchResults.map(result => result.item);
    }

    // Apply type filter
    if (tableFilters.type !== 'all') {
      filtered = filtered.filter(transfer => transfer.type === tableFilters.type);
    }

    // Apply date filter
    if (tableFilters.dateRange !== 'all') {
      const now = new Date();
      let cutoffDate: Date;
      
      switch (tableFilters.dateRange) {
        case '1month':
          cutoffDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          break;
        case '3months':
          cutoffDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
          break;
        case '6months':
          cutoffDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
          break;
        case '1year':
          cutoffDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          break;
        default:
          cutoffDate = new Date(0); // Show all
      }
      
      filtered = filtered.filter(transfer => new Date(transfer.date) >= cutoffDate);
    }

    return filtered;
  }, [allTransfers, tableFilters]);

  // Sort function
  const sortData = (data: any[]) => {
    if (!sortConfig) {
      return data;
    }

    return [...data].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.key) {
        case 'date':
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        case 'fromAccount':
          aValue = (a.fromAccount?.name || a.from_account?.name || '').toLowerCase();
          bValue = (b.fromAccount?.name || b.from_account?.name || '').toLowerCase();
          break;
        case 'toAccount':
          aValue = (a.toAccount?.name || a.to_account?.name || '').toLowerCase();
          bValue = (b.toAccount?.name || b.to_account?.name || '').toLowerCase();
          break;
        case 'amount':
          aValue = a.fromAmount || a.amount || 0;
          bValue = b.fromAmount || b.amount || 0;
          break;
        case 'type':
          aValue = (a.type || '').toLowerCase();
          bValue = (b.type || '').toLowerCase();
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

  // Sort filtered transfers
  const sortedTransfers = useMemo(() => {
    return sortData(filteredTransfers);
  }, [filteredTransfers, sortConfig]);

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

  const handleCopyTransactionId = (transactionId: string) => {
    navigator.clipboard.writeText(transactionId);
    toast.success('Transaction ID copied to clipboard');
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
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <div className="text-xl text-red-600 dark:text-red-400">Error: {error}</div>
      </div>
    );
  }

  // Get unique transfer types for filters
  const transferTypes = Array.from(new Set(allTransfers.map(t => t.type).filter(Boolean))) as string[];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transfers</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your account transfers</p>
        </div>
      </div>

      {/* Unified Table View - exactly like AccountsView */}
      <div className="space-y-6">
        {/* Unified Filters and Table */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 pb-[13px] lg:pb-0">
          {/* Filters Section - exactly like AccountsView */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1" style={{ marginBottom: 0 }}>
              {/* Mobile Search */}
              <div className="flex-1 md:flex-none">
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
              {hasSelection && selectedRecord && (
                <SelectionFilter
                  label="Selected"
                  value={selectedRecord.fromAccount?.name || 'Transfer'}
                  onClear={clearSelection}
                />
              )}

              {/* Mobile Filter Button */}
              <div className="md:hidden">
                <button
                  onClick={() => setShowMobileFilterMenu(v => !v)}
                  className={`px-2 py-1.5 text-[13px] h-8 w-8 rounded-md transition-colors flex items-center justify-center ${
                    (tableFilters.type !== 'all' || tableFilters.dateRange !== '1month')
                      ? 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  style={(tableFilters.type !== 'all' || tableFilters.dateRange !== '1month') ? { background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' } : {}}
                  title="Filters"
                >
                  <Filter className="w-4 h-4" />
                </button>
              </div>

              {/* Mobile Add Transfer Button */}
              <div className="md:hidden">
                <button
                  onClick={() => setShowTransferTypeModal(true)}
                  className="bg-gradient-primary text-white px-2 py-1.5 rounded-md hover:bg-gradient-primary-hover transition-colors flex items-center justify-center text-[13px] h-8 w-8"
                  title="Add Transfer"
                  aria-label="Add Transfer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Mobile Clear Filters Button */}
              <div className="md:hidden">
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

              {/* Desktop Filters */}
              <div className="hidden md:flex items-center gap-x-2">
                {/* Type Filter */}
                <div>
                  <div className="relative">
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
                        {transferTypes.map(type => (
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

                {/* Date Filter */}
                <div>
                  <div className="relative" ref={dateMenuButtonRef}>
                     <button
                       onClick={() => setShowDateMenu(v => !v)}
                       className={`px-3 py-1.5 pr-2 text-[13px] h-8 rounded-md transition-colors flex items-center space-x-1.5 ${
                         tableFilters.dateRange !== 'all' 
                           ? 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                           : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
                       }`}
                       style={tableFilters.dateRange !== 'all' ? { background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' } : {}}
                    >
                      <span>{tableFilters.dateRange === 'all' ? 'All Time' : 
                             tableFilters.dateRange === '1month' ? '1 Month' :
                             tableFilters.dateRange === '3months' ? '3 Months' :
                             tableFilters.dateRange === '6months' ? '6 Months' :
                             tableFilters.dateRange === '1year' ? '1 Year' : 'All Time'}</span>
                      <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showDateMenu && createPortal(
                      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-[100] max-h-48 overflow-y-auto" ref={dateMenuRef} style={{ position: 'absolute', top: dateMenuPos.top + 8, left: dateMenuPos.left, width: dateMenuPos.width }}>
                        <button
                          onClick={() => { setTableFilters({ ...tableFilters, dateRange: 'all' }); setShowDateMenu(false); }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${tableFilters.dateRange === 'all' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' : ''}`}
                        >
                          All Time
                        </button>
                        <button
                          onClick={() => { setTableFilters({ ...tableFilters, dateRange: '1month' }); setShowDateMenu(false); }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${tableFilters.dateRange === '1month' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' : ''}`}
                        >
                          1 Month
                        </button>
                        <button
                          onClick={() => { setTableFilters({ ...tableFilters, dateRange: '3months' }); setShowDateMenu(false); }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${tableFilters.dateRange === '3months' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' : ''}`}
                        >
                          3 Months
                        </button>
                        <button
                          onClick={() => { setTableFilters({ ...tableFilters, dateRange: '6months' }); setShowDateMenu(false); }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${tableFilters.dateRange === '6months' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' : ''}`}
                        >
                          6 Months
                        </button>
                        <button
                          onClick={() => { setTableFilters({ ...tableFilters, dateRange: '1year' }); setShowDateMenu(false); }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${tableFilters.dateRange === '1year' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' : ''}`}
                        >
                          1 Year
                        </button>
                      </div>, document.body
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
              
              <div className="flex-grow" />
              {/* Action Buttons in filter row */}
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={() => setShowTransferTypeModal(true)}
                  className="bg-gradient-primary text-white px-3 py-1.5 h-8 rounded-md hover:bg-gradient-primary-hover transition-colors flex items-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed text-[13px]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Transfer</span>
                </button>
              </div>
            </div>
          </div>

          {/* Summary Cards - Now dynamic and after filters */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 p-3">
            {(() => {
              const currencyTransfers = sortedTransfers.filter(t => t.type === 'currency');
              const dpsTransfers = sortedTransfers.filter(t => t.type === 'dps');
              const inAccountTransfers = sortedTransfers.filter(t => t.type === 'inbetween');
              
              // Use the first transfer's currency or fallback
              const currency = sortedTransfers[0]?.fromCurrency || 'USD';
              const currencySymbol = {
                USD: '$', BDT: '৳', EUR: '€', GBP: '£', JPY: '¥', ALL: 'L', INR: '₹', CAD: '$', AUD: '$'
              }[currency] || currency;
              
              return (
                <>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 px-2">
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Transfers</p>
                        <p className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" style={{ fontSize: '1.2rem' }}>{sortedTransfers.length}</p>
                        <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: '11px' }}>
                          {(() => {
                            const typeBreakdown = [
                              `${currencyTransfers.length} currency`,
                              `${dpsTransfers.length} dps`,
                              `${inAccountTransfers.length} in-account`
                            ].join(', ');
                            return typeBreakdown || 'No transfers';
                          })()}
                        </p>
                      </div>
                      <svg className="text-blue-600" style={{ fontSize: '1.2rem', width: '1.2rem', height: '1.2rem' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" /></svg>
                    </div>
                  </div>
                  
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
                      onClick={() => handleSort('date')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Date</span>
                        {getSortIcon('date')}
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
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => handleSort('fromAccount')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>From Account</span>
                        {getSortIcon('fromAccount')}
                      </div>
                    </th>
                     <th 
                       className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                       onClick={() => handleSort('toAccount')}
                     >
                       <div className="flex items-center space-x-1">
                         <span>To Account</span>
                         {getSortIcon('toAccount')}
                       </div>
                     </th>
                  </tr>
                </thead>
                 <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                   {sortedTransfers.map((transfer, idx) => {
                     const fromAccount = transfer.fromAccount || transfer.from_account;
                     const toAccount = transfer.toAccount || transfer.to_account;
                     const amount = transfer.fromAmount || transfer.amount;
                     const currency = transfer.fromCurrency || fromAccount?.currency;
                     const transferId = transfer.id || `transfer-${idx}`;

                     return (
                       <React.Fragment key={transferId}>
                         <tr 
                           className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                           onClick={() => toggleRowExpansion(transferId)}
                         >
                           <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                             <div className="flex items-center space-x-2">
                               <svg 
                                 className={`w-4 h-4 text-gray-400 transition-transform ${isRowExpanded(transferId) ? 'rotate-90' : ''}`} 
                                 fill="none" 
                                 stroke="currentColor" 
                                 strokeWidth="2" 
                                 viewBox="0 0 24 24"
                               >
                                 <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                               </svg>
                               <div>
                                 <div className="font-medium">
                                   {format(new Date(transfer.date), 'MMM d, yyyy')}
                                 </div>
                                 <div className="text-gray-500 dark:text-gray-400">
                                   {formatTimeUTC(transfer.created_at, 'h:mm a')}
                                 </div>
                               </div>
                             </div>
                           </td>
                           <td className="px-6 py-4 text-sm">
                             <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                               transfer.type === 'currency' 
                                 ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                                 : transfer.type === 'dps'
                                 ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                                 : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                             }`}>
                               {transfer.type === 'currency' ? 'Currency' : 
                                transfer.type === 'dps' ? 'DPS' : 'In-Account'}
                             </span>
                           </td>
                           <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                             <div className="font-medium">{fromAccount?.name}</div>
                             <div className="text-gray-500 dark:text-gray-400">{fromAccount?.currency}</div>
                           </td>
                           <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                             <div className="font-medium">{toAccount?.name}</div>
                             <div className="text-gray-500 dark:text-gray-400">{toAccount?.currency}</div>
                           </td>
                         </tr>
                         {isRowExpanded(transferId) && (
                           <tr>
                             <td colSpan={4} className="px-6 py-4 bg-gray-50 dark:bg-gray-800">
                               <div className="space-y-4">
                                 {/* Transfer Details */}
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                   {/* From Account Details */}
                                   <div className="space-y-2">
                                     <h4 className="text-sm font-medium text-gray-900 dark:text-white">From Account</h4>
                                     <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                       <div className="flex justify-between items-center">
                                         <div>
                                           <div className="font-medium text-gray-900 dark:text-white">{fromAccount?.name}</div>
                                           <div className="text-sm text-gray-500 dark:text-gray-400">Balance: {formatCurrency(calculateRunningBalance(fromAccount?.id, transfer.date, accounts, allTransactions), fromAccount?.currency)}</div>
                                         </div>
                                         <div className="text-right">
                                           <div className="font-bold text-red-600 dark:text-red-400">
                                             -{formatCurrency(amount, currency)}
                                           </div>
                                           <div className="text-xs text-gray-500 dark:text-gray-400">Debit</div>
                                         </div>
                                       </div>
                                     </div>
                                   </div>

                                   {/* To Account Details */}
                                   <div className="space-y-2">
                                     <h4 className="text-sm font-medium text-gray-900 dark:text-white">To Account</h4>
                                     <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                       <div className="flex justify-between items-center">
                                         <div>
                                           <div className="font-medium text-gray-900 dark:text-white">{toAccount?.name}</div>
                                           <div className="text-sm text-gray-500 dark:text-gray-400">Balance: {formatCurrency(calculateRunningBalance(toAccount?.id, transfer.date, accounts, allTransactions), toAccount?.currency)}</div>
                                         </div>
                                         <div className="text-right">
                                           <div className="font-bold text-green-600 dark:text-green-400">
                                             +{formatCurrency(transfer.toAmount || amount, transfer.toCurrency || toAccount?.currency)}
                                           </div>
                                           <div className="text-xs text-gray-500 dark:text-gray-400">Credit</div>
                                         </div>
                                       </div>
                                     </div>
                                   </div>
                                 </div>

                                 {/* Exchange Rate */}
                                 {transfer.exchangeRate && transfer.exchangeRate !== 1 && (
                                   <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
                                     <div className="text-sm font-medium text-blue-900 dark:text-blue-100">Exchange Rate</div>
                                     <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                       1 {fromAccount?.currency} = {transfer.exchangeRate.toFixed(4)} {toAccount?.currency}
                                     </div>
                                   </div>
                                 )}

                                 {/* Transfer Note */}
                                 {transfer.note && (
                                   <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                     <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">Note</div>
                                     <div className="text-sm text-gray-600 dark:text-gray-300">{transfer.note}</div>
                                   </div>
                                 )}
                               </div>
                             </td>
                           </tr>
                         )}
                       </React.Fragment>
                     );
                   })}
                 </tbody>
              </table>
            </div>

            {/* Tablet Table View */}
            <div className="hidden md:block lg:hidden overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900 text-[14px]">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th 
                      className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => handleSort('date')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Date</span>
                        {getSortIcon('date')}
                      </div>
                    </th>
                    <th 
                      className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => handleSort('type')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Type</span>
                        {getSortIcon('type')}
                      </div>
                    </th>
                     <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                       Transfer
                     </th>
                  </tr>
                </thead>
                 <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                   {sortedTransfers.map((transfer, idx) => {
                     const fromAccount = transfer.fromAccount || transfer.from_account;
                     const toAccount = transfer.toAccount || transfer.to_account;
                     const amount = transfer.fromAmount || transfer.amount;
                     const currency = transfer.fromCurrency || fromAccount?.currency;
                     const transferId = transfer.id || `transfer-${idx}`;

                     return (
                       <React.Fragment key={transferId}>
                         <tr 
                           className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                           onClick={() => toggleRowExpansion(transferId)}
                         >
                           <td className="px-3 py-3 text-sm text-gray-900 dark:text-white">
                             <div className="flex items-center space-x-2">
                               <svg 
                                 className={`w-4 h-4 text-gray-400 transition-transform ${isRowExpanded(transferId) ? 'rotate-90' : ''}`} 
                                 fill="none" 
                                 stroke="currentColor" 
                                 strokeWidth="2" 
                                 viewBox="0 0 24 24"
                               >
                                 <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                               </svg>
                               <div>
                                 <div className="font-medium">
                                   {format(new Date(transfer.date), 'MMM d')}
                                 </div>
                                 <div className="text-gray-500 dark:text-gray-400">
                                   {formatTimeUTC(transfer.created_at, 'h:mm a')}
                                 </div>
                               </div>
                             </div>
                           </td>
                           <td className="px-3 py-3 text-sm">
                             <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                               transfer.type === 'currency' 
                                 ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                                 : transfer.type === 'dps'
                                 ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                                 : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                             }`}>
                               {transfer.type === 'currency' ? 'Currency' : 
                                transfer.type === 'dps' ? 'DPS' : 'In-Account'}
                             </span>
                           </td>
                           <td className="px-3 py-3 text-sm text-center">
                             <div className="space-y-1">
                               <div className="font-medium text-gray-900 dark:text-white">
                                 {fromAccount?.name} → {toAccount?.name}
                               </div>
                             </div>
                           </td>
                         </tr>
                         {isRowExpanded(transferId) && (
                           <tr>
                             <td colSpan={3} className="px-3 py-4 bg-gray-50 dark:bg-gray-800">
                               <div className="space-y-4">
                                 {/* Transfer Details */}
                                 <div className="space-y-3">
                                   {/* From Account Details */}
                                   <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                     <div className="flex justify-between items-center">
                                       <div>
                                         <div className="font-medium text-gray-900 dark:text-white">{fromAccount?.name}</div>
                                         <div className="text-sm text-gray-500 dark:text-gray-400">Balance: {formatCurrency(calculateRunningBalance(fromAccount?.id, transfer.date, accounts, allTransactions), fromAccount?.currency)}</div>
                                       </div>
                                       <div className="text-right">
                                         <div className="font-bold text-red-600 dark:text-red-400">
                                           -{formatCurrency(amount, currency)}
                                         </div>
                                         <div className="text-xs text-gray-500 dark:text-gray-400">Debit</div>
                                       </div>
                                     </div>
                                   </div>

                                   {/* To Account Details */}
                                   <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                     <div className="flex justify-between items-center">
                                       <div>
                                         <div className="font-medium text-gray-900 dark:text-white">{toAccount?.name}</div>
                                         <div className="text-sm text-gray-500 dark:text-gray-400">Balance: {formatCurrency(calculateRunningBalance(toAccount?.id, transfer.date, accounts, allTransactions), toAccount?.currency)}</div>
                                       </div>
                                       <div className="text-right">
                                         <div className="font-bold text-green-600 dark:text-green-400">
                                           +{formatCurrency(transfer.toAmount || amount, transfer.toCurrency || toAccount?.currency)}
                                         </div>
                                         <div className="text-xs text-gray-500 dark:text-gray-400">Credit</div>
                                       </div>
                                     </div>
                                   </div>
                                 </div>

                                 {/* Exchange Rate */}
                                 {transfer.exchangeRate && transfer.exchangeRate !== 1 && (
                                   <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
                                     <div className="text-sm font-medium text-blue-900 dark:text-blue-100">Exchange Rate</div>
                                     <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                       1 {fromAccount?.currency} = {transfer.exchangeRate.toFixed(4)} {toAccount?.currency}
                                     </div>
                                   </div>
                                 )}

                                 {/* Transfer Note */}
                                 {transfer.note && (
                                   <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                     <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">Note</div>
                                     <div className="text-sm text-gray-600 dark:text-gray-300">{transfer.note}</div>
                                   </div>
                                 )}
                               </div>
                             </td>
                           </tr>
                         )}
                       </React.Fragment>
                     );
                   })}
                 </tbody>
              </table>
            </div>

            {/* Mobile/Tablet Stacked Table View */}
            <div className="lg:hidden max-h-[500px] overflow-y-auto">
              <div className="space-y-4 px-2.5">
                {sortedTransfers.length === 0 ? (
                  <div className="py-16 text-center">
                    <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                      <ArrowRight className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No transfer records found</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                      Start tracking your transfers by creating your first transfer
                    </p>
                  </div>
                ) : (
                   sortedTransfers.map((transfer, idx) => {
                     const fromAccount = transfer.fromAccount || transfer.from_account;
                     const toAccount = transfer.toAccount || transfer.to_account;
                     const amount = transfer.fromAmount || transfer.amount;
                     const currency = transfer.fromCurrency || fromAccount?.currency;
                     const transferId = transfer.id || `transfer-${idx}`;

                     return (
                       <div key={transferId} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                         {/* Stacked Table Row */}
                         <div 
                           className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                           onClick={() => toggleRowExpansion(transferId)}
                         >
                           <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                             {/* Date */}
                             <div>
                               <div className="flex items-center space-x-2">
                                 <svg 
                                   className={`w-4 h-4 text-gray-400 transition-transform ${isRowExpanded(transferId) ? 'rotate-90' : ''}`} 
                                   fill="none" 
                                   stroke="currentColor" 
                                   strokeWidth="2" 
                                   viewBox="0 0 24 24"
                                 >
                                   <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                 </svg>
                                 <div>
                                   <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Date</div>
                                   <div className="text-sm font-medium text-gray-900 dark:text-white">
                                     {format(new Date(transfer.date), 'MMM d, yyyy')}
                                   </div>
                                   <div className="text-xs text-gray-500 dark:text-gray-400">
                                     {formatTimeUTC(transfer.created_at, 'h:mm a')}
                                   </div>
                                 </div>
                               </div>
                             </div>

                             {/* Type */}
                             <div>
                               <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Type</div>
                               <div>
                                 <span className={`inline-flex items-center justify-center text-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                   transfer.type === 'currency' 
                                     ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                                     : transfer.type === 'dps'
                                     ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                                     : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                 }`}>
                                   {transfer.type === 'currency' ? 'Currency' : 
                                    transfer.type === 'dps' ? 'DPS' : 'In-Account'}
                                 </span>
                               </div>
                             </div>
                           </div>
                         </div>

                         {/* Expanded Details */}
                         {isRowExpanded(transferId) && (
                           <div className="px-4 pb-4 bg-gray-50 dark:bg-gray-800">
                             <div className="space-y-4">
                               {/* Transfer Details */}
                               <div className="space-y-3">
                                 {/* From Account Details */}
                                 <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                   <div className="flex justify-between items-center">
                                     <div>
                                       <div className="font-medium text-gray-900 dark:text-white">{fromAccount?.name}</div>
                                       <div className="text-sm text-gray-500 dark:text-gray-400">Balance: {formatCurrency(calculateRunningBalance(fromAccount?.id, transfer.date, accounts, allTransactions), fromAccount?.currency)}</div>
                                     </div>
                                     <div className="text-right">
                                       <div className="font-bold text-red-600 dark:text-red-400">
                                         -{formatCurrency(amount, currency)}
                                       </div>
                                       <div className="text-xs text-gray-500 dark:text-gray-400">Debit</div>
                                     </div>
                                   </div>
                                 </div>

                                 {/* To Account Details */}
                                 <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                   <div className="flex justify-between items-center">
                                     <div>
                                       <div className="font-medium text-gray-900 dark:text-white">{toAccount?.name}</div>
                                       <div className="text-sm text-gray-500 dark:text-gray-400">Balance: {formatCurrency(calculateRunningBalance(toAccount?.id, transfer.date, accounts, allTransactions), toAccount?.currency)}</div>
                                     </div>
                                     <div className="text-right">
                                       <div className="font-bold text-green-600 dark:text-green-400">
                                         +{formatCurrency(transfer.toAmount || amount, transfer.toCurrency || toAccount?.currency)}
                                       </div>
                                       <div className="text-xs text-gray-500 dark:text-gray-400">Credit</div>
                                     </div>
                                   </div>
                                 </div>
                               </div>

                               {/* Exchange Rate */}
                               {transfer.exchangeRate && transfer.exchangeRate !== 1 && (
                                 <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
                                   <div className="text-sm font-medium text-blue-900 dark:text-blue-100">Exchange Rate</div>
                                   <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                     1 {fromAccount?.currency} = {transfer.exchangeRate.toFixed(4)} {toAccount?.currency}
                                   </div>
                                 </div>
                               )}

                               {/* Transfer Note */}
                               {transfer.note && (
                                 <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                   <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">Note</div>
                                   <div className="text-sm text-gray-600 dark:text-gray-300">{transfer.note}</div>
                                 </div>
                               )}
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

          {/* Empty State for Filtered Results */}
          {sortedTransfers.length === 0 && allTransfers.length > 0 && (
            <div className="text-center py-8">
              <Search className="w-8 h-8 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No transfers found
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Try adjusting your search terms or filters
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Transfer Type Selection Modal */}
      <Dialog open={showTransferTypeModal} onClose={() => setShowTransferTypeModal(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-xs rounded-lg bg-white dark:bg-gray-900 p-6 shadow-xl">
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
        <TransferModal isOpen={showCurrencyTransferModal} onClose={() => setShowCurrencyTransferModal(false)} mode="currency" />
      )}
      {showDpsTransferModal && (
        <DPSTransferModal isOpen={showDpsTransferModal} onClose={() => setShowDpsTransferModal(false)} />
      )}
      {showInBetweenTransferModal && (
        <TransferModal isOpen={showInBetweenTransferModal} onClose={() => setShowInBetweenTransferModal(false)} mode="inbetween" />
      )}
    </div>
  );
};
