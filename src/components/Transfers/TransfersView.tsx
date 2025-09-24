import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { format } from 'date-fns';
import { ArrowRight, Plus, Search, Copy, ChevronDown, Filter } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { supabase } from '../../lib/supabase';
import { TransferModal } from './TransferModal';
import { formatTransactionId } from '../../utils/transactionId';
import { toast } from 'sonner';
import { Dialog } from '@headlessui/react';
import { DPSTransferModal } from './DPSTransferModal';
import { useSearchParams } from 'react-router-dom';

const TABS = [
  { key: 'all', label: 'All Transfers' },
  { key: 'currency', label: 'Currency Conversion' },
  { key: 'dps', label: 'DPS Transfer' },
  { key: 'inbetween', label: 'In-account Transfer' },
];

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

export const TransfersView: React.FC = () => {
  const { accounts } = useFinanceStore();
  const [transfers, setTransfers] = useState<any[]>([]);
  const [dpsTransfers, setDpsTransfers] = useState<any[]>([]);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('all');
  const [showTransferTypeModal, setShowTransferTypeModal] = useState(false);
  const [showCurrencyTransferModal, setShowCurrencyTransferModal] = useState(false);
  const [showDpsTransferModal, setShowDpsTransferModal] = useState(false);
  const [showInBetweenTransferModal, setShowInBetweenTransferModal] = useState(false);
  
  // New state for improvements
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Selected transfer parameter handling
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedTransferId = searchParams.get('selected');
  const selectedTransferRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Scroll to selected transfer when component mounts
  useEffect(() => {
    if (selectedTransferId && selectedTransferRef.current) {
      setTimeout(() => {
        selectedTransferRef.current?.scrollIntoView({ 
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
  }, [selectedTransferId, setSearchParams]);

  useEffect(() => {
    fetchTransferHistory();
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

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
        .order('date', { ascending: true }); // ascending for before/after logic
      if (allTxError) throw allTxError;

      // Debug: Log what data we're getting
      console.log('=== TRANSFER DATA DEBUG ===');
      console.log('Regular transfers:', transferData?.slice(0, 2));
      console.log('DPS transfers:', dpsData?.slice(0, 2));
      console.log('Sample transfer date field:', transferData?.[0]?.date);
      console.log('Sample transfer created_at field:', transferData?.[0]?.created_at);
      
      setTransfers(transferData || []);
      setDpsTransfers(dpsData || []);
      setAllTransactions(allTx || []);
    } catch (err: any) {
      console.error('Error fetching transfer history:', err);
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
    
    // Debug: Log the first few transfers
    console.log('=== COMBINED TRANSFERS DEBUG ===');
    console.log('First few transfers:', transfers.slice(0, 3));
    
    for (const group of Object.values(grouped)) {
      if (group.length < 2) continue; // skip incomplete pairs
      const expense = group.find((t: any) => t.type === 'expense');
      const income = group.find((t: any) => t.type === 'income');
      if (!expense || !income) continue;
      
      // Debug: Log expense transaction details
      console.log('Expense transaction:', {
        id: expense.id,
        date: expense.date,
        created_at: expense.created_at,
        type: expense.type
      });
      
      const fromAccount = accounts.find(a => a.id === expense.account_id);
      const toAccount = accounts.find(a => a.id === income.account_id);
      const exchangeRate = income.amount / expense.amount;
      combined.push({
        id: expense.id + '_' + income.id,
        date: expense.date,
        created_at: expense.created_at, // Include created_at for accurate time display
        fromAccount,
        toAccount,
        fromAmount: expense.amount,
        toAmount: income.amount,
        fromCurrency: fromAccount?.currency,
        toCurrency: toAccount?.currency,
        note: expense.note || income.note || expense.description || income.description,
        exchangeRate,
        // Remove the pre-computed time field to avoid caching issues
      });
    }
    
    console.log('Combined transfers result:', combined.slice(0, 2));
    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // Prepare unified transfer list - always call this useMemo
  const combinedTransfers = useMemo(() => {
    return getCombinedTransfers(transfers, accounts);
  }, [transfers, accounts]);
  
  // In-account transfers: same currency, neither account is DPS - always call this useMemo
  const inAccountTransfers = useMemo(() => {
    return combinedTransfers.filter(t => 
      t.fromCurrency === t.toCurrency && 
      !t.fromAccount?.name?.includes('(DPS)') && 
      !t.toAccount?.name?.includes('(DPS)')
    );
  }, [combinedTransfers]);
  
  // Currency conversion: different currency - always call this useMemo
  const currencyTransfers = useMemo(() => {
    return combinedTransfers.filter(t => t.fromCurrency !== t.toCurrency);
  }, [combinedTransfers]);

  // Tab filter logic - always call this useMemo
  const displayedTransfers = useMemo(() => {
    if (selectedTab === 'all') {
      return [
        ...combinedTransfers.map(t => ({ 
          ...t, 
          type: t.fromCurrency === t.toCurrency ? 'inbetween' : 'currency' 
        })),
        ...dpsTransfers.map(t => ({ ...t, type: 'dps' })),
      ];
    } else if (selectedTab === 'currency') {
      return currencyTransfers.map(t => ({ ...t, type: 'currency' }));
    } else if (selectedTab === 'dps') {
      return dpsTransfers.map(t => ({ ...t, type: 'dps' }));
    } else if (selectedTab === 'inbetween') {
      return inAccountTransfers.map(t => ({ ...t, type: 'inbetween' }));
    }
    return [];
  }, [selectedTab, combinedTransfers, dpsTransfers, currencyTransfers, inAccountTransfers]);

  // Calculate transfer counts for each tab
  const transferCounts = useMemo(() => ({
    all: combinedTransfers.length + dpsTransfers.length,
    currency: currencyTransfers.length,
    dps: dpsTransfers.length,
    inbetween: inAccountTransfers.length,
  }), [combinedTransfers.length, dpsTransfers.length, currencyTransfers.length, inAccountTransfers.length]);

  // Search functionality - always call this useMemo
  const filteredTransfers = useMemo(() => {
    if (!searchTerm) return displayedTransfers;
    
    return displayedTransfers.filter(transfer => {
      const searchLower = searchTerm.toLowerCase();
      const fromAccount = transfer.fromAccount?.name || transfer.from_account?.name || '';
      const toAccount = transfer.toAccount?.name || transfer.to_account?.name || '';
      const note = transfer.note || '';
      const type = transfer.type || '';
      
      return fromAccount.toLowerCase().includes(searchLower) ||
             toAccount.toLowerCase().includes(searchLower) ||
             note.toLowerCase().includes(searchLower) ||
             type.toLowerCase().includes(searchLower);
    });
  }, [displayedTransfers, searchTerm]);

  const handleCopyTransactionId = (transactionId: string) => {
    navigator.clipboard.writeText(transactionId);
    toast.success('Transaction ID copied to clipboard');
  };

  const getActiveTabLabel = () => {
    const activeTab = TABS.find(tab => tab.key === selectedTab);
    return activeTab ? activeTab.label : 'All Transfers';
  };

  const handleTabChange = (tabKey: string) => {
    setSelectedTab(tabKey);
    setIsMobileMenuOpen(false); // Close mobile menu when tab is selected
  };

  if (loading) {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <div className="text-xl text-gray-600 dark:text-gray-300">Loading transfers...</div>
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

  return (
    <div className="space-y-6">
      {/* Unified Transfers Container */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header Section with Search and New Transfer Button */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
          <div className="flex gap-3 items-center">
            {/* Search Field */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search transfers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
              />
            </div>
            
            {/* New Transfer Button - Same height as search field */}
            <button
              className="flex items-center justify-center h-10 w-10 bg-gradient-primary text-white rounded-md hover:bg-gradient-primary-hover transition-colors"
              onClick={() => setShowTransferTypeModal(true)}
              title="New Transfer"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Mobile Tab Dropdown */}
        <div className="block sm:hidden border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
          <div className="relative" ref={mobileMenuRef}>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="w-full flex items-center justify-between p-3 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-100 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 text-left shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                  <Filter className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <span className="font-medium text-gray-900 dark:text-white text-sm">
                    {getActiveTabLabel()}
                  </span>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {transferCounts[selectedTab as keyof typeof transferCounts]} transfers
                  </div>
                </div>
              </div>
              <ChevronDown 
                className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                  isMobileMenuOpen ? 'rotate-180' : ''
                }`} 
              />
            </button>
            
            {/* Mobile Dropdown Menu */}
            {isMobileMenuOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50 overflow-hidden">
                {TABS.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => handleTabChange(tab.key)}
                    className={`w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                      selectedTab === tab.key 
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span className="font-medium">{tab.label}</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      selectedTab === tab.key 
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}>
                      {transferCounts[tab.key as keyof typeof transferCounts]}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Desktop Tabs */}
        <div className="hidden sm:block border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex">
            {TABS.map(tab => (
              <button
                key={tab.key}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 relative ${
                  selectedTab === tab.key 
                    ? 'text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-900 border-b-2 border-blue-600 dark:border-blue-400' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                onClick={() => handleTabChange(tab.key)}
              >
                <div className="flex items-center justify-center gap-2">
                  <span>{tab.label}</span>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    selectedTab === tab.key 
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}>
                    {transferCounts[tab.key as keyof typeof transferCounts]}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 max-h-96 overflow-y-auto bg-white dark:bg-gray-900">
          {filteredTransfers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 dark:text-gray-500 mb-2">
                {searchTerm ? (
                  <Search className="h-12 w-12 mx-auto" />
                ) : (
                  <div className="h-12 w-12 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <ArrowRight className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                  </div>
                )}
              </div>
              <div className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                {searchTerm ? 'No transfers found' : 'No transfers yet'}
              </div>
              <div className="text-gray-500 dark:text-gray-400">
                {searchTerm 
                  ? 'Try adjusting your search terms' 
                  : 'Create your first transfer to get started'
                }
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransfers.map((transfer, idx) => {
                const isSelected = selectedTransferId === transfer.id || selectedTransferId === transfer.transaction_id;
                const transferId = transfer.id || transfer.transaction_id || `transfer-${idx}`;
                
                if (transfer.type === 'dps') {
                  const mainAccount = accounts.find(a => a.id === transfer.from_account_id);
                  const dpsAccount = accounts.find(a => a.id === transfer.to_account_id);
                  if (!mainAccount || !dpsAccount) return null;
                  const mainAccountBalance = mainAccount ? calculateRunningBalance(mainAccount.id, transfer.date, accounts, allTransactions) : 0;
                  const dpsAccountBalance = dpsAccount ? calculateRunningBalance(dpsAccount.id, transfer.date, accounts, allTransactions) : 0;
                  
                  return (
                    <div 
                      key={transfer.id || idx} 
                      id={`transfer-${transferId}`}
                      className={`border border-gray-200 dark:border-gray-600 rounded-lg p-4 transition-all duration-200 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 bg-white dark:bg-gray-800 ${isSelected ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
                    >
                      {/* Transfer Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium">DPS Transfer</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {format(new Date(transfer.date), 'MMM d, yyyy')} • {format(new Date(transfer.date), 'h:mm a')}
                          </span>
                        </div>
                        {transfer.transaction_id && (
                          <button
                            onClick={() => handleCopyTransactionId(transfer.transaction_id!)}
                            className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                          >
                            <span className="font-mono">#{formatTransactionId(transfer.transaction_id)}</span>
                            <Copy className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Transfer Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                        {/* From Account */}
                        <div className="text-center sm:text-left">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">{mainAccount?.name}</div>
                          <div className="text-lg font-bold text-red-600">{formatCurrency(transfer.amount, mainAccount?.currency || 'USD')}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Balance: {formatCurrency(mainAccountBalance, mainAccount?.currency || 'USD')}</div>
                        </div>
                        
                        {/* Center Arrow */}
                        <div className="flex justify-center">
                          <ArrowRight className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                        </div>
                        
                        {/* To Account */}
                        <div className="text-center sm:text-right">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">{dpsAccount?.name}</div>
                          <div className="text-lg font-bold text-green-600">{formatCurrency(transfer.amount, dpsAccount?.currency || 'USD')}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Balance: {formatCurrency(dpsAccountBalance, dpsAccount?.currency || 'USD')}</div>
                        </div>
                      </div>
                      
                      {/* Note */}
                      {transfer.note && (
                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                          <div className="text-sm text-gray-600 dark:text-gray-400">{transfer.note}</div>
                        </div>
                      )}
                    </div>
                  );
                }

                const fromAccountBalance = transfer.fromAccount ? calculateRunningBalance(transfer.fromAccount.id, transfer.date, accounts, allTransactions) : 0;
                const toAccountBalance = transfer.toAccount ? calculateRunningBalance(transfer.toAccount.id, transfer.date, accounts, allTransactions) : 0;
                
                return (
                  <div 
                    key={transfer.id || idx} 
                    id={`transfer-${transferId}`}
                    className={`border border-gray-200 dark:border-gray-600 rounded-lg p-4 transition-all duration-200 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 bg-white dark:bg-gray-800 ${isSelected ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
                  >
                    {/* Transfer Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {transfer.type === 'currency' && (
                          <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 font-medium">Currency Transfer</span>
                        )}
                        {transfer.type === 'inbetween' && (
                          <span className="text-xs px-2 py-1 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 font-medium">In-account Transfer</span>
                        )}
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(transfer.date), 'MMM d, yyyy')} • {transfer.created_at ? format(new Date(transfer.created_at), 'h:mm a') : '12:00 AM'}
                        </span>
                      </div>
                      {transfer.transaction_id && (
                        <button
                          onClick={() => handleCopyTransactionId(transfer.transaction_id!)}
                          className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                        >
                          <span className="font-mono">#{formatTransactionId(transfer.transaction_id)}</span>
                          <Copy className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Transfer Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                      {/* From Account */}
                      <div className="text-center sm:text-left">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">{transfer.fromAccount?.name}</div>
                        <div className="text-lg font-bold text-red-600">{formatCurrency(transfer.fromAmount, transfer.fromCurrency || 'USD')}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Balance: {formatCurrency(fromAccountBalance, transfer.fromCurrency || 'USD')}</div>
                      </div>
                      
                      {/* Center Arrow + Exchange Rate */}
                      <div className="flex flex-col items-center">
                        <ArrowRight className="h-6 w-6 text-gray-400 dark:text-gray-500 mb-2" />
                        {transfer.exchangeRate && transfer.exchangeRate !== 1 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 text-center bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            {transfer.exchangeRate.toFixed(4)}<br/>{transfer.fromCurrency}→{transfer.toCurrency}
                          </div>
                        )}
                      </div>
                      
                      {/* To Account */}
                      <div className="text-center sm:text-right">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">{transfer.toAccount?.name}</div>
                        <div className="text-lg font-bold text-green-600">{formatCurrency(transfer.toAmount, transfer.toCurrency || 'USD')}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Balance: {formatCurrency(toAccountBalance, transfer.toCurrency || 'USD')}</div>
                      </div>
                    </div>
                    
                    {/* Note */}
                    {transfer.note && (
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <div className="text-sm text-gray-600 dark:text-gray-400">{transfer.note}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {/* Transfer Type Selection Modal */}
      <Dialog open={showTransferTypeModal} onClose={() => setShowTransferTypeModal(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-xs rounded-lg bg-white p-6 shadow-xl">
            <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
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
                className="bg-gray-200 text-gray-900 px-4 py-3 rounded-lg hover:bg-gray-300 transition-colors text-left"
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