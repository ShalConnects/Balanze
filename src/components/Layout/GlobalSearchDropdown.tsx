import React, { useState, useEffect, useRef } from 'react';
import { Search, DollarSign, Box } from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import Fuse from 'fuse.js';
import { useNavigate } from 'react-router-dom';

const TABS = [
  { key: 'transactions', label: 'Transactions', color: 'text-yellow-600', underline: 'bg-yellow-500' },
  { key: 'lendborrow', label: 'Lend & Borrow', color: 'text-pink-600', underline: 'bg-pink-500' },
  { key: 'purchases', label: 'Purchases', color: 'text-blue-600', underline: 'bg-blue-500' },
  { key: 'transfers', label: 'Transfers', color: 'text-green-600', underline: 'bg-green-500' },
];

interface GlobalSearchDropdownProps {
  isFocused: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  dropdownRef: React.RefObject<HTMLDivElement>;
  onClose: () => void;
  isOverlay?: boolean; // New prop to indicate if this is in an overlay
}

// Synonyms/aliases for search
const SYNONYMS: Record<string, string[]> = {
  deposit: ['income', 'credit'],
  withdrawal: ['expense', 'debit'],
  transfer: ['move', 'send'],
  purchase: ['buy', 'expense'],
  salary: ['income', 'payroll'],
};

function expandQuery(query: string): string[] {
  const words = query.split(/\s+/);
  let expanded = [...words];
  for (const word of words) {
    if (SYNONYMS[word]) expanded = expanded.concat(SYNONYMS[word]);
  }
  return expanded;
}

// Recent searches (localStorage)
  const RECENT_KEY = 'balanze_recent_searches';
function getRecentSearches(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
  } catch { return []; }
}
function addRecentSearch(term: string) {
  let recents = getRecentSearches();
  recents = [term, ...recents.filter(t => t !== term)].slice(0, 7);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recents));
}

export const GlobalSearchDropdown: React.FC<GlobalSearchDropdownProps> = ({ 
  isFocused, 
  inputRef, 
  dropdownRef, 
  onClose, 
  isOverlay = false 
}) => {
  const { globalSearchTerm, transactions, accounts, setGlobalSearchTerm, purchases, lendBorrowRecords } = useFinanceStore();
  const navigate = useNavigate();
  const [transfers, setTransfers] = useState<any[]>([]);
  const [dpsTransfers, setDpsTransfers] = useState<any[]>([]);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [highlightedIdx, setHighlightedIdx] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>(getRecentSearches());
  const search = globalSearchTerm.trim();
  const [activeTab, setActiveTab] = useState('transactions');

  // Accordion state for each section
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [showAllPurchases, setShowAllPurchases] = useState(false);
  const [showAllTransfers, setShowAllTransfers] = useState(false);
  const [showAllAccounts, setShowAllAccounts] = useState(false);

  // Handle result click navigation
  const handleResultClick = (type: string, item: any) => {
    console.log('handleResultClick called:', { type, item });
    console.log('Item structure:', JSON.stringify(item, null, 2));
    console.log('Item ID:', item?.id);
    console.log('Item transaction_id:', item?.transaction_id);
    
    addRecentSearch(search);
    setGlobalSearchTerm('');
    
    // Close the dropdown
    onClose();
    inputRef.current?.blur();
    
    // Get the correct ID based on item type
    let itemId = item?.id;
    if (type === 'transaction' && item?.transaction_id) {
      itemId = item.transaction_id;
    }
    
    console.log('Using itemId:', itemId);
    
    switch (type) {
      case 'account':
        console.log('Navigating to account:', itemId);
        navigate(`/accounts?selected=${itemId}`);
        break;
      case 'transaction':
        console.log('Navigating to transaction:', itemId);
        navigate(`/transactions?selected=${itemId}`);
        break;
      case 'purchase':
        console.log('Navigating to purchase:', itemId);
        navigate(`/purchases?selected=${itemId}`);
        break;
      case 'transfer':
        console.log('Navigating to transfer:', itemId);
        navigate(`/transfers?selected=${itemId}`);
        break;
      case 'lendborrow':
        console.log('Navigating to lend & borrow:', itemId);
        navigate(`/lend-borrow?selected=${itemId}`);
        break;
      default:
        console.log('Unknown result type:', type);
    }
  };

  useEffect(() => {
    // Fetch transfer data for the Transfers tab
    const fetchTransfers = async () => {
      // Fetch regular transfers
      const { data: transferData } = await supabase
        .from('transactions')
        .select('*, account:accounts(name, currency)')
        .contains('tags', ['transfer'])
        .order('date', { ascending: false });
      // Fetch DPS transfers
      const { data: dpsData } = await supabase
        .from('dps_transfers')
        .select('*')
        .order('date', { ascending: false });
      setTransfers(transferData || []);
      setDpsTransfers(dpsData || []);
    };
    fetchTransfers();
  }, [search]);

  // Fetch lend & borrow records when component loads
  useEffect(() => {
    const { fetchLendBorrowRecords } = useFinanceStore.getState();
    fetchLendBorrowRecords();
  }, []);

  // Hide dropdown on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setGlobalSearchTerm('');
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setGlobalSearchTerm, inputRef]);

  // Filter logic
  const filteredTransactions = search
    ? transactions
        .filter(t => !t.tags?.some(tag => tag.includes('transfer') || tag.includes('dps_transfer') || tag === 'dps_deletion'))
        .filter(t =>
          (t.description?.toLowerCase() || '').includes(search) ||
          (t.category?.toLowerCase() || '').includes(search) ||
          t.tags?.some(tag => (tag?.toLowerCase() || '').includes(search)) ||
          (t.transaction_id && (t.transaction_id?.toLowerCase() || '').includes(search))
        )
    : [];
  const filteredAccounts = search
    ? accounts.filter(a =>
        (a.name?.toLowerCase() || '').includes(search) ||
        (a.type?.toLowerCase() || '').includes(search) ||
        (a.currency?.toLowerCase() || '').includes(search)
      )
    : [];

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
        fromAccount,
        toAccount,
        fromAmount: expense.amount,
        toAmount: income.amount,
        fromCurrency: fromAccount?.currency,
        toCurrency: toAccount?.currency,
        note: expense.note || income.note || expense.description || income.description,
        exchangeRate,
        created_at: expense.created_at, // Include created_at for accurate time display
        transaction_id: expense.transaction_id || income.transaction_id,
      });
    }
    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  const combinedTransfers = getCombinedTransfers(transfers, accounts);
  const allTransfers = [
    ...combinedTransfers.map(t => ({
      ...t,
      type: t.fromCurrency === t.toCurrency ? 'inbetween' : 'currency',
    })),
    ...dpsTransfers.map(t => ({ ...t, type: 'dps' })),
  ];
  const filteredTransfers = search
    ? allTransfers.filter(transfer => {
        const fromAccount = transfer.fromAccount?.name || transfer.from_account?.name || '';
        const toAccount = transfer.toAccount?.name || transfer.to_account?.name || '';
        const note = transfer.note || '';
        const type = transfer.type || '';
        const transactionId = transfer.transaction_id || '';
        return (
          (fromAccount?.toLowerCase() || '').includes(search) ||
          (toAccount?.toLowerCase() || '').includes(search) ||
          (note?.toLowerCase() || '').includes(search) ||
          (type?.toLowerCase() || '').includes(search) ||
          (transactionId?.toLowerCase() || '').includes(search)
        );
      })
    : [];

  // Fuzzy search setup
  const fuseOptions = {
    threshold: 0.35,
    keys: [
      { name: 'description', weight: 0.5 },
      { name: 'category', weight: 0.3 },
      { name: 'tags', weight: 0.2 },
      { name: 'transaction_id', weight: 0.2 },
      { name: 'name', weight: 0.5 },
      { name: 'type', weight: 0.2 },
      { name: 'currency', weight: 0.1 },
    ],
    includeMatches: true,
    minMatchCharLength: 2,
  };
  const fuseTransactions = new Fuse(transactions, fuseOptions);
  const fuseAccounts = new Fuse(accounts, fuseOptions);
  const fuseTransfers = new Fuse(allTransfers, fuseOptions);
  const fusePurchases = new Fuse(purchases || [], {
    threshold: 0.35,
    keys: [
      { name: 'item_name', weight: 0.5 },
      { name: 'category', weight: 0.3 },
      { name: 'notes', weight: 0.2 },
      { name: 'status', weight: 0.2 },
      { name: 'price', weight: 0.2 },
    ],
    includeMatches: true,
    minMatchCharLength: 2,
  });
  const fuseLendBorrow = new Fuse(lendBorrowRecords || [], {
    threshold: 0.35,
    keys: [
      { name: 'person_name', weight: 0.5 },
      { name: 'type', weight: 0.3 },
      { name: 'notes', weight: 0.2 },
      { name: 'status', weight: 0.2 },
      { name: 'currency', weight: 0.1 },
    ],
    includeMatches: true,
    minMatchCharLength: 2,
  });

  // Expand query with synonyms
  const expandedQuery = expandQuery(search.toLowerCase()).join(' ');

  // Fuzzy search results
  const fuzzyTransactions = search ? fuseTransactions.search(expandedQuery) : [];
  const fuzzyAccounts = search ? fuseAccounts.search(expandedQuery) : [];
  const fuzzyTransfers = search ? fuseTransfers.search(expandedQuery) : [];
  const fuzzyPurchases = search ? fusePurchases.search(expandedQuery) : [];
  const fuzzyLendBorrow = search ? fuseLendBorrow.search(expandedQuery) : [];

  // Debug logging - REMOVED to prevent console flooding

  // Calculate total results for keyboard navigation
  const totalResults = fuzzyTransactions.length + fuzzyPurchases.length + fuzzyTransfers.length + fuzzyAccounts.length + fuzzyLendBorrow.length;

  // Highlight helper
  function highlight(text: string, matches: any[]): React.ReactNode {
    if (!matches || matches.length === 0) return text;
    let result: React.ReactNode[] = [];
    let lastIdx = 0;
    for (const match of matches) {
      const { indices } = match;
      for (const [start, end] of indices) {
        if (start > lastIdx) {
          result.push(text.slice(lastIdx, start));
        }
        result.push(
          <mark key={`${start}-${end}`} className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">
            {text.slice(start, end + 1)}
          </mark>
        );
        lastIdx = end + 1;
      }
    }
    if (lastIdx < text.length) {
      result.push(text.slice(lastIdx));
    }
    return result.length > 0 ? result : text;
  }

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!isFocused) return;
      if (e.key === 'ArrowDown') setHighlightedIdx(idx => Math.min(idx + 1, totalResults - 1));
      if (e.key === 'ArrowUp') setHighlightedIdx(idx => Math.max(idx - 1, 0));
      if (e.key === 'Enter') {
        let item;
        if (search) {
          if (fuzzyTransactions.length > 0 && highlightedIdx < fuzzyTransactions.length) {
            item = fuzzyTransactions[highlightedIdx]?.item;
          } else if (fuzzyPurchases.length > 0 && highlightedIdx >= fuzzyTransactions.length && highlightedIdx < fuzzyTransactions.length + fuzzyPurchases.length) {
            item = fuzzyPurchases[highlightedIdx - fuzzyTransactions.length]?.item;
          } else if (fuzzyTransfers.length > 0 && highlightedIdx >= fuzzyTransactions.length + fuzzyPurchases.length && highlightedIdx < fuzzyTransactions.length + fuzzyPurchases.length + fuzzyTransfers.length) {
            item = fuzzyTransfers[highlightedIdx - fuzzyTransactions.length - fuzzyPurchases.length]?.item;
          } else if (fuzzyAccounts.length > 0 && highlightedIdx >= fuzzyTransactions.length + fuzzyPurchases.length + fuzzyTransfers.length && highlightedIdx < fuzzyTransactions.length + fuzzyPurchases.length + fuzzyTransfers.length + fuzzyAccounts.length) {
            item = fuzzyAccounts[highlightedIdx - fuzzyTransactions.length - fuzzyPurchases.length - fuzzyTransfers.length]?.item;
          } else if (fuzzyLendBorrow.length > 0 && highlightedIdx >= fuzzyTransactions.length + fuzzyPurchases.length + fuzzyTransfers.length + fuzzyAccounts.length) {
            item = fuzzyLendBorrow[highlightedIdx - fuzzyTransactions.length - fuzzyPurchases.length - fuzzyTransfers.length - fuzzyAccounts.length]?.item;
          }
        } else {
          item = recentSearches[highlightedIdx];
        }
        if (item) {
          addRecentSearch(search);
          setRecentSearches(getRecentSearches());
          // TODO: handle selection (navigate, open, etc.)
          setGlobalSearchTerm('');
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isFocused, search, highlightedIdx, fuzzyTransactions, fuzzyPurchases, fuzzyTransfers, fuzzyAccounts, fuzzyLendBorrow, recentSearches, setGlobalSearchTerm]);

  // Show recent searches if input is focused and empty
  // console.log('Checking dropdown visibility:', { search, isFocused, searchLength: search?.length });
  if ((!search || search.length === 0) && isFocused) {
    return (
      <div className={`${isOverlay ? 'relative w-full' : 'absolute left-0 top-full w-[125%] ml-[-12.5%]'} z-50 bg-white border border-gray-200 rounded-xl shadow-lg p-4 animate-fadein`}>
        <div className="font-semibold text-gray-700 mb-2">Recent Searches</div>
        {recentSearches.length === 0 ? (
          <div className="text-gray-400 text-sm">No recent searches</div>
        ) : (
          <ul>
            {recentSearches.slice(0, 3).map((term, idx) => (
              <li
                key={term}
                className={`py-2 px-3 rounded cursor-pointer ${highlightedIdx === idx ? 'bg-blue-50' : ''}`}
                style={{ fontSize: '13px', lineHeight: '18px' }}
                onMouseEnter={() => setHighlightedIdx(idx)}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setGlobalSearchTerm(term);
                  addRecentSearch(term);
                  setRecentSearches(getRecentSearches());
                  // Focus the input to show results for this term
                  setTimeout(() => {
                    console.log('Focusing input, current value:', inputRef.current?.value);
                    inputRef.current?.focus();
                    console.log('Input focused, new value:', inputRef.current?.value);
                    console.log('Dropdown should still be visible');
                  }, 10);
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                {term}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  // console.log('Checking search results visibility:', { search, isFocused });
  if (!search || !isFocused) return null;

  console.log('Rendering dropdown with search:', search, 'fuzzyTransactions:', fuzzyTransactions.length);

  return (
    <div
      ref={dropdownRef}
      style={{
        position: isOverlay ? 'relative' : 'absolute',
        left: isOverlay ? 'auto' : 0,
        top: isOverlay ? 'auto' : '100%',
        width: isOverlay ? '100%' : '125%',
        marginLeft: isOverlay ? 'auto' : '-12.5%',
        zIndex: 9999,
        boxSizing: 'border-box',
        maxHeight: search ? '70vh' : '55vh',
        borderRadius: '12px',
        background: 'white',
        boxShadow: '0 4px 24px 0 rgba(0,0,0,0.10)',
        border: '1px solid #f3f4f6',
        paddingTop: 0,
        overflow: 'visible',
        pointerEvents: 'auto',
      }}
      className="shadow-[0_4px_24px_0_rgba(0,0,0,0.10)] animate-fadein flex flex-col overflow-visible"
      onClick={(e) => {
        console.log('Dropdown container clicked!');
        e.stopPropagation();
      }}
      onMouseDown={(e) => {
        console.log('Dropdown container mouse down!');
        e.stopPropagation();
      }}
    >
      <div
        className="px-4 pt-4 pb-8 min-h-[160px] sm:px-6 flex-1"
        style={{
          maxHeight: search ? '65vh' : '50vh',
          overflowY: 'auto',
        }}
      >
        {/* Recent Searches */}
        {!search && recentSearches.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3" style={{ fontSize: '14px !important', lineHeight: '20px !important', fontWeight: 600 }}>Recent Searches</h3>
            <div className="space-y-2">
              {recentSearches.slice(0, 3).map((search, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    console.log('Recent search button clicked:', search);
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Setting global search term to:', search);
                    setGlobalSearchTerm(search);
                    addRecentSearch(search);
                    console.log('About to focus input');
                    // Focus the input to show results for this term
                    setTimeout(() => {
                      console.log('Focusing input, current value:', inputRef.current?.value);
                      inputRef.current?.focus();
                      console.log('Input focused, new value:', inputRef.current?.value);
                    }, 10);
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  className="w-full text-left px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  style={{ fontSize: '13px !important', lineHeight: '18px !important' }}
                >
                  {search}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Transactions Section */}
        {fuzzyTransactions.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
              Transactions ({fuzzyTransactions.length})
            </h3>
            <div className="space-y-2">
              {(showAllTransactions ? fuzzyTransactions : fuzzyTransactions.slice(0, 3)).map((res, index) => (
                <button
                  key={`transaction-${index}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleResultClick('transaction', res.item);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    highlightedIdx === index ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {highlight(res.item.description, (res.matches?.filter(m => m.key === 'description') ?? []) as any[])}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {highlight(res.item.category, (res.matches?.filter(m => m.key === 'category') ?? []) as any[])} • {res.item.amount} • {res.item.type}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
              {fuzzyTransactions.length > 3 && (
                <button
                  className="w-full text-center text-xs text-blue-600 dark:text-blue-400 mt-2"
                  onClick={() => setShowAllTransactions(v => !v)}
                >
                  {showAllTransactions ? 'Show less' : `Show more (${fuzzyTransactions.length - 3})`}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Purchases Section */}
        {fuzzyPurchases.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              Purchases ({fuzzyPurchases.length})
            </h3>
            <div className="space-y-2">
              {(showAllPurchases ? fuzzyPurchases : fuzzyPurchases.slice(0, 3)).map((res, index) => (
                <button
                  key={`purchase-${index}`}
                  onClick={() => handleResultClick('purchase', res.item)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    highlightedIdx === fuzzyTransactions.length + index ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {highlight(res.item.item_name, (res.matches?.filter(m => m.key === 'item_name') ?? []) as any[])}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {highlight(res.item.category, (res.matches?.filter(m => m.key === 'category') ?? []) as any[])} • {res.item.price} • {res.item.status}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
              {fuzzyPurchases.length > 3 && (
                <button
                  className="w-full text-center text-xs text-blue-600 dark:text-blue-400 mt-2"
                  onClick={() => setShowAllPurchases(v => !v)}
                >
                  {showAllPurchases ? 'Show less' : `Show more (${fuzzyPurchases.length - 3})`}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Transfers Section */}
        {fuzzyTransfers.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Transfers ({fuzzyTransfers.length})
            </h3>
            <div className="space-y-2">
              {(showAllTransfers ? fuzzyTransfers : fuzzyTransfers.slice(0, 3)).map((res, index) => (
                <button
                  key={`transfer-${index}`}
                  onClick={() => handleResultClick('transfer', res.item)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    highlightedIdx === fuzzyTransactions.length + fuzzyPurchases.length + index ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {highlight(res.item.fromAccount?.name || res.item.from_account?.name || 'From', (res.matches?.filter(m => m.key === 'fromAccount' || m.key === 'from_account') ?? []) as any[])}
                        {' → '}
                        {highlight(res.item.toAccount?.name || res.item.to_account?.name || 'To', (res.matches?.filter(m => m.key === 'toAccount' || m.key === 'to_account') ?? []) as any[])}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {res.item.fromAmount || res.item.amount} {res.item.fromCurrency || res.item.currency || ''} → {res.item.toAmount || res.item.amount} {res.item.toCurrency || res.item.currency || ''} • {res.item.note || ''}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
              {fuzzyTransfers.length > 3 && (
                <button
                  className="w-full text-center text-xs text-blue-600 dark:text-blue-400 mt-2"
                  onClick={() => setShowAllTransfers(v => !v)}
                >
                  {showAllTransfers ? 'Show less' : `Show more (${fuzzyTransfers.length - 3})`}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Accounts Section */}
        {fuzzyAccounts.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Accounts ({fuzzyAccounts.length})
            </h3>
            <div className="space-y-2">
              {(showAllAccounts ? fuzzyAccounts : fuzzyAccounts.slice(0, 3)).map((res, index) => (
                <button
                  key={`account-${index}`}
                  onClick={() => handleResultClick('account', res.item)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    highlightedIdx === fuzzyTransactions.length + fuzzyPurchases.length + fuzzyTransfers.length + index ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {highlight(res.item.name, (res.matches?.filter(m => m.key === 'name') ?? []) as any[])}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {res.item.currency} • Balance: {res.item.calculated_balance}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
              {fuzzyAccounts.length > 3 && (
                <button
                  className="w-full text-center text-xs text-blue-600 dark:text-blue-400 mt-2"
                  onClick={() => setShowAllAccounts(v => !v)}
                >
                  {showAllAccounts ? 'Show less' : `Show more (${fuzzyAccounts.length - 3})`}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Lend & Borrow Section */}
        {fuzzyLendBorrow.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
              Lend & Borrow ({fuzzyLendBorrow.length})
            </h3>
            <div className="space-y-2">
              {fuzzyLendBorrow.slice(0, 3).map((res, index) => (
                <button
                  key={`lendborrow-${index}`}
                  onClick={() => handleResultClick('lendborrow', res.item)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    highlightedIdx === fuzzyTransactions.length + fuzzyPurchases.length + fuzzyTransfers.length + fuzzyAccounts.length + index ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-pink-100 dark:bg-pink-900/20 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {highlight(res.item.person_name, (res.matches?.filter(m => m.key === 'person_name') ?? []) as any[])}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {res.item.type} • {res.item.amount} {res.item.currency} • {res.item.status}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {search && fuzzyTransactions.length === 0 && fuzzyPurchases.length === 0 && fuzzyTransfers.length === 0 && fuzzyAccounts.length === 0 && fuzzyLendBorrow.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-400 dark:text-gray-500 mb-2">
              <Search className="w-8 h-8 mx-auto" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">No results found for "{search}"</p>
          </div>
        )}
      </div>
    </div>
  );
};