import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Search, DollarSign } from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { supabase } from '../../lib/supabase';
import Fuse from 'fuse.js';
import { useNavigate } from 'react-router-dom';
import { SearchSkeleton } from '../common/SearchSkeleton';

// Removed unused TABS constant

interface GlobalSearchDropdownProps {
  isFocused: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  dropdownRef: React.RefObject<HTMLDivElement>;
  onClose: () => void;
  isOverlay?: boolean; // New prop to indicate if this is in an overlay
}

// Enhanced synonyms/aliases for comprehensive financial search
const SYNONYMS: Record<string, string[]> = {
  // Income/Deposit synonyms
  deposit: ['income', 'credit', 'salary', 'wage', 'payroll', 'earnings', 'revenue', 'profit', 'bonus', 'commission'],
  income: ['deposit', 'credit', 'salary', 'wage', 'payroll', 'earnings', 'revenue', 'profit', 'bonus', 'commission'],
  salary: ['income', 'wage', 'payroll', 'earnings', 'salary', 'stipend', 'allowance'],
  
  // Expense/Withdrawal synonyms
  withdrawal: ['expense', 'debit', 'payment', 'cost', 'charge', 'fee', 'bill', 'spending', 'outgoing'],
  expense: ['withdrawal', 'debit', 'payment', 'cost', 'charge', 'fee', 'bill', 'spending', 'outgoing'],
  payment: ['expense', 'withdrawal', 'debit', 'cost', 'charge', 'fee', 'bill'],
  
  // Transfer synonyms
  transfer: ['move', 'send', 'shift', 'relocate', 'migrate', 'port', 'switch'],
  move: ['transfer', 'send', 'shift', 'relocate'],
  send: ['transfer', 'move', 'dispatch', 'transmit'],
  
  // Purchase/Buy synonyms
  purchase: ['buy', 'expense', 'acquisition', 'procurement', 'shopping', 'buying'],
  buy: ['purchase', 'acquire', 'obtain', 'procure', 'shop'],
  shopping: ['purchase', 'buying', 'retail', 'spending'],
  
  // Account types
  bank: ['checking', 'savings', 'account', 'financial'],
  credit: ['card', 'credit card', 'plastic', 'payment card'],
  cash: ['money', 'currency', 'bills', 'coins', 'physical'],
  
  // Transaction types
  recurring: ['repeating', 'regular', 'periodic', 'scheduled', 'automatic'],
  one_time: ['single', 'once', 'individual', 'unique'],
  
  // Status synonyms
  pending: ['waiting', 'processing', 'in progress', 'unconfirmed'],
  completed: ['done', 'finished', 'processed', 'confirmed', 'settled'],
  cancelled: ['aborted', 'terminated', 'stopped', 'voided'],
  
  // Amount/Currency synonyms
  amount: ['value', 'sum', 'total', 'cost', 'price'],
  balance: ['remaining', 'available', 'current', 'outstanding'],
  
  // Date/Time synonyms
  recent: ['latest', 'newest', 'current', 'today', 'this week'],
  old: ['previous', 'past', 'historical', 'archived'],
  
  // Common financial terms
  budget: ['allocation', 'planning', 'forecast', 'estimate'],
  savings: ['reserve', 'fund', 'nest egg', 'stash'],
  investment: ['portfolio', 'assets', 'securities', 'stocks', 'bonds'],
  debt: ['loan', 'borrowing', 'liability', 'obligation'],
  loan: ['debt', 'borrowing', 'advance', 'credit'],
  
  // Categories
  food: ['dining', 'restaurant', 'groceries', 'meals', 'eating'],
  transport: ['travel', 'commute', 'gas', 'fuel', 'transportation'],
  entertainment: ['fun', 'leisure', 'recreation', 'hobby', 'activity'],
  healthcare: ['medical', 'health', 'doctor', 'hospital', 'medicine'],
  education: ['school', 'learning', 'tuition', 'course', 'training'],
  utilities: ['bills', 'electricity', 'water', 'internet', 'phone'],
};

function expandQuery(query: string): string[] {
  const words = query.toLowerCase().split(/\s+/);
  let expanded = [...words];
  
  // Add synonyms for each word
  for (const word of words) {
    if (SYNONYMS[word]) {
      expanded = expanded.concat(SYNONYMS[word]);
    }
  }
  
  // Add phrase-based synonyms for common financial phrases
  const phrase = query.toLowerCase();
  if (phrase.includes('credit card') || phrase.includes('creditcard')) {
    expanded.push('card', 'plastic', 'payment');
  }
  if (phrase.includes('bank account') || phrase.includes('bankaccount')) {
    expanded.push('checking', 'savings', 'financial');
  }
  if (phrase.includes('cash flow') || phrase.includes('cashflow')) {
    expanded.push('income', 'expense', 'money', 'flow');
  }
  if (phrase.includes('monthly') || phrase.includes('recurring')) {
    expanded.push('regular', 'periodic', 'scheduled');
  }
  
  // Remove duplicates and return
  return [...new Set(expanded)];
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
  const { globalSearchTerm, transactions, accounts, setGlobalSearchTerm, purchases, lendBorrowRecords, donationSavingRecords } = useFinanceStore();
  const navigate = useNavigate();
  const [transfers, setTransfers] = useState<any[]>([]);
  const [dpsTransfers, setDpsTransfers] = useState<any[]>([]);
  const [highlightedIdx, setHighlightedIdx] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>(getRecentSearches());
  const [isSearching, setIsSearching] = useState(false);
  const search = globalSearchTerm.trim();

  // Search performance optimization
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [searchCache] = useState<Map<string, any>>(new Map());
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Search suggestions and autocomplete
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Accordion state for each section
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [showAllPurchases, setShowAllPurchases] = useState(false);
  const [showAllTransfers, setShowAllTransfers] = useState(false);
  const [showAllAccounts, setShowAllAccounts] = useState(false);

  // Handle result click navigation
  const handleResultClick = (type: string, item: any) => {




    
    addRecentSearch(search);
    setGlobalSearchTerm('');
    
    // Close the dropdown
    onClose();
    inputRef.current?.blur();
    
    // Get the correct ID based on item type
    let itemId = item?.id;
    
    
    switch (type) {
      case 'account':

        navigate(`/accounts?selected=${itemId}&from=search`);
        break;
      case 'transaction':

        navigate(`/transactions?selected=${itemId}&from=search`);
        break;
      case 'purchase':

        navigate(`/purchases?selected=${itemId}&from=search`);
        break;
      case 'transfer':

        navigate(`/transfers?selected=${itemId}&from=search`);
        break;
      case 'lendborrow':

        navigate(`/lent-borrow?selected=${itemId}&from=search`);
        break;
      case 'donation':

        navigate(`/donations?selected=${itemId}&from=search`);
        break;
      default:

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

  // Generate search suggestions based on available data
  const generateSearchSuggestions = useCallback((query: string) => {
    if (!query || query.length < 2) return [];
    
    const suggestions: string[] = [];
    const queryLower = query.toLowerCase();
    
    // Get suggestions from transactions
    transactions.forEach(transaction => {
      if (transaction.description?.toLowerCase().includes(queryLower)) {
        suggestions.push(transaction.description);
      }
      if (transaction.category?.toLowerCase().includes(queryLower)) {
        suggestions.push(transaction.category);
      }
    });
    
    // Get suggestions from accounts
    accounts.forEach(account => {
      if (account.name?.toLowerCase().includes(queryLower)) {
        suggestions.push(account.name);
      }
    });
    
    // Get suggestions from purchases
    (purchases || []).forEach(purchase => {
      if (purchase.item_name?.toLowerCase().includes(queryLower)) {
        suggestions.push(purchase.item_name);
      }
      if (purchase.category?.toLowerCase().includes(queryLower)) {
        suggestions.push(purchase.category);
      }
    });
    
    // Get suggestions from lend/borrow records
    (lendBorrowRecords || []).forEach(record => {
      if (record.person_name?.toLowerCase().includes(queryLower)) {
        suggestions.push(record.person_name);
      }
    });
    
    // Remove duplicates and limit to 3 suggestions
    return [...new Set(suggestions)].slice(0, 3);
  }, [transactions, accounts, purchases, lendBorrowRecords]);

  // Debounce search input for performance
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set loading state when search starts
    if (search && search.length >= 2) {
      setIsSearching(true);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setIsSearching(false);
      // Generate suggestions for autocomplete
      if (search && search.length >= 2) {
        const suggestions = generateSearchSuggestions(search);
        setSearchSuggestions(suggestions);
        setShowSuggestions(suggestions.length > 0);
      } else {
        setSearchSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300); // 300ms debounce delay
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search, generateSearchSuggestions]);

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

  // Removed unused filter logic - now using fuzzy search

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
  // Removed unused filteredTransfers - now using fuzzy search

  // Enhanced fuzzy search configuration with optimized thresholds and weights
  const fuseOptions = {
    threshold: 0.3, // Lower threshold for more sensitive matching
    keys: [
      { name: 'description', weight: 0.4 },
      { name: 'category', weight: 0.25 },
      { name: 'tags', weight: 0.15 },
      { name: 'transaction_id', weight: 0.1 },
      { name: 'name', weight: 0.4 },
      { name: 'type', weight: 0.15 },
      { name: 'currency', weight: 0.05 },
    ],
    includeMatches: true,
    minMatchCharLength: 1, // Allow single character matches for better UX
    findAllMatches: true, // Find all matches, not just the first
    ignoreLocation: true, // Ignore location of match in string
    useExtendedSearch: true, // Enable extended search features
  };
  const fuseTransactions = new Fuse(transactions, fuseOptions);
  const fuseAccounts = new Fuse(accounts, fuseOptions);
  const fuseTransfers = new Fuse(allTransfers, fuseOptions);
  const fusePurchases = new Fuse(purchases || [], {
    threshold: 0.3,
    keys: [
      { name: 'item_name', weight: 0.4 },
      { name: 'category', weight: 0.25 },
      { name: 'notes', weight: 0.15 },
      { name: 'status', weight: 0.1 },
      { name: 'price', weight: 0.1 },
    ],
    includeMatches: true,
    minMatchCharLength: 1,
    findAllMatches: true,
    ignoreLocation: true,
    useExtendedSearch: true,
  });
  const fuseLendBorrow = new Fuse(lendBorrowRecords || [], {
    threshold: 0.3,
    keys: [
      { name: 'person_name', weight: 0.4 },
      { name: 'type', weight: 0.25 },
      { name: 'notes', weight: 0.15 },
      { name: 'status', weight: 0.1 },
      { name: 'currency', weight: 0.1 },
    ],
    includeMatches: true,
    minMatchCharLength: 1,
    findAllMatches: true,
    ignoreLocation: true,
    useExtendedSearch: true,
  });
  const fuseDonations = new Fuse(donationSavingRecords || [], {
    threshold: 0.3,
    keys: [
      { name: 'type', weight: 0.4 },
      { name: 'note', weight: 0.3 },
      { name: 'status', weight: 0.2 },
      { name: 'mode', weight: 0.1 },
    ],
    includeMatches: true,
    minMatchCharLength: 1,
    findAllMatches: true,
    ignoreLocation: true,
    useExtendedSearch: true,
  });

  // Memoized search results with caching
  const searchResults = useMemo(() => {
    if (!debouncedSearch) {
      return {
        fuzzyTransactions: [],
        fuzzyAccounts: [],
        fuzzyTransfers: [],
        fuzzyPurchases: [],
        fuzzyLendBorrow: [],
        fuzzyDonations: []
      };
    }

    // Check cache first
    const cacheKey = debouncedSearch.toLowerCase();
    if (searchCache.has(cacheKey)) {
      return searchCache.get(cacheKey);
    }

    // Expand query with synonyms
    const expandedQuery = expandQuery(debouncedSearch.toLowerCase()).join(' ');

    // Perform fuzzy search
    const results = {
      fuzzyTransactions: fuseTransactions.search(expandedQuery),
      fuzzyAccounts: fuseAccounts.search(expandedQuery),
      fuzzyTransfers: fuseTransfers.search(expandedQuery),
      fuzzyPurchases: fusePurchases.search(expandedQuery),
      fuzzyLendBorrow: fuseLendBorrow.search(expandedQuery),
      fuzzyDonations: fuseDonations.search(expandedQuery)
    };

    // Cache results (limit cache size to prevent memory issues)
    if (searchCache.size > 50) {
      const firstKey = searchCache.keys().next().value;
      if (firstKey) {
        searchCache.delete(firstKey);
      }
    }
    searchCache.set(cacheKey, results);

    return results;
  }, [debouncedSearch, fuseTransactions, fuseAccounts, fuseTransfers, fusePurchases, fuseLendBorrow, fuseDonations, searchCache]);

  const { fuzzyTransactions, fuzzyAccounts, fuzzyTransfers, fuzzyPurchases, fuzzyLendBorrow, fuzzyDonations } = searchResults;

  // Enhanced result ranking function
  const rankSearchResults = (results: any[], type: string) => {
    return results.map(result => {
      let score = result.score || 0;
      
      // Recency boost (more recent items get higher scores)
      const itemDate = new Date(result.item.date || result.item.created_at || result.item.updated_at || 0);
      const now = new Date();
      const daysDiff = (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24);
      const recencyBoost = Math.max(0, 1 - (daysDiff / 365)); // Boost decreases over a year
      score += recencyBoost * 0.2;
      
      // Frequency boost (items with higher amounts or more activity)
      if (result.item.amount) {
        const amountBoost = Math.min(0.1, Math.log10(parseFloat(result.item.amount) || 1) / 10);
        score += amountBoost;
      }
      
      // User behavior boost (if we had click tracking)
      // This would be enhanced with actual user behavior data
      const behaviorBoost = 0; // Placeholder for future enhancement
      score += behaviorBoost;
      
      // Type-specific boosts
      if (type === 'transaction' && result.item.type === 'income') {
        score += 0.05; // Slightly boost income transactions
      }
      if (type === 'account' && result.item.isActive) {
        score += 0.1; // Boost active accounts
      }
      
      return { ...result, finalScore: score };
    }).sort((a, b) => a.finalScore - b.finalScore); // Lower score = better match in Fuse.js
  };

  // Apply ranking to all result sets
  const rankedTransactions = search ? rankSearchResults(fuzzyTransactions, 'transaction') : [];
  const rankedAccounts = search ? rankSearchResults(fuzzyAccounts, 'account') : [];
  const rankedTransfers = search ? rankSearchResults(fuzzyTransfers, 'transfer') : [];
  const rankedPurchases = search ? rankSearchResults(fuzzyPurchases, 'purchase') : [];
  const rankedLendBorrow = search ? rankSearchResults(fuzzyLendBorrow, 'lendborrow') : [];
  const rankedDonations = search ? rankSearchResults(fuzzyDonations, 'donation') : [];

  // Debug logging - REMOVED to prevent console flooding

  // Calculate total results for keyboard navigation
  const totalResults = rankedTransactions.length + rankedPurchases.length + rankedTransfers.length + rankedAccounts.length + rankedLendBorrow.length + rankedDonations.length;

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

  // Enhanced keyboard navigation with accessibility
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!isFocused) return;
      
      // Prevent default behavior for navigation keys
      if (['ArrowDown', 'ArrowUp', 'Enter', 'Escape', 'Tab'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
      }
      
      if (e.key === 'ArrowDown') {
        setHighlightedIdx(idx => Math.min(idx + 1, totalResults - 1));
      }
      if (e.key === 'ArrowUp') {
        setHighlightedIdx(idx => Math.max(idx - 1, 0));
      }
      if (e.key === 'Home') {
        setHighlightedIdx(0);
      }
      if (e.key === 'End') {
        setHighlightedIdx(totalResults - 1);
      }
      if (e.key === 'PageDown') {
        setHighlightedIdx(idx => Math.min(idx + 5, totalResults - 1));
      }
      if (e.key === 'PageUp') {
        setHighlightedIdx(idx => Math.max(idx - 5, 0));
      }
      if (e.key === 'Enter') {
        let item;
        if (search) {
          if (rankedTransactions.length > 0 && highlightedIdx < rankedTransactions.length) {
            item = rankedTransactions[highlightedIdx]?.item;
          } else if (rankedPurchases.length > 0 && highlightedIdx >= rankedTransactions.length && highlightedIdx < rankedTransactions.length + rankedPurchases.length) {
            item = rankedPurchases[highlightedIdx - rankedTransactions.length]?.item;
          } else if (rankedTransfers.length > 0 && highlightedIdx >= rankedTransactions.length + rankedPurchases.length && highlightedIdx < rankedTransactions.length + rankedPurchases.length + rankedTransfers.length) {
            item = rankedTransfers[highlightedIdx - rankedTransactions.length - rankedPurchases.length]?.item;
          } else if (rankedAccounts.length > 0 && highlightedIdx >= rankedTransactions.length + rankedPurchases.length + rankedTransfers.length && highlightedIdx < rankedTransactions.length + rankedPurchases.length + rankedTransfers.length + rankedAccounts.length) {
            item = rankedAccounts[highlightedIdx - rankedTransactions.length - rankedPurchases.length - rankedTransfers.length]?.item;
          } else if (rankedLendBorrow.length > 0 && highlightedIdx >= rankedTransactions.length + rankedPurchases.length + rankedTransfers.length + rankedAccounts.length) {
            item = rankedLendBorrow[highlightedIdx - rankedTransactions.length - rankedPurchases.length - rankedTransfers.length - rankedAccounts.length]?.item;
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
  }, [isFocused, search, highlightedIdx, rankedTransactions, rankedPurchases, rankedTransfers, rankedAccounts, rankedLendBorrow, recentSearches, setGlobalSearchTerm]);

  // Show recent searches if input is focused and empty
  
  if ((!search || search.length === 0) && isFocused) {
    return (
      <div className={`${isOverlay ? 'relative w-full' : 'absolute left-0 top-full w-[125%] ml-[-12.5%]'} z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg dark:shadow-xl p-4 animate-fadein`}>
        <div className="font-semibold text-gray-700 dark:text-gray-300 mb-2 text-sm">Recent Searches</div>
        {recentSearches.length === 0 ? (
          <div className="text-gray-400 dark:text-gray-500 text-sm">No recent searches</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {recentSearches.slice(0, 3).map((term, idx) => (
              <button
                key={term}
                className={`px-3 py-1.5 rounded-full cursor-pointer text-gray-700 dark:text-gray-300 text-xs border transition-colors ${highlightedIdx === idx ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600'}`}
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

                    inputRef.current?.focus();


                  }, 10);
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                {term}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  
  if (!search || !isFocused) return null;

  // Show skeleton loading while searching
  if (isSearching) {
    return (
      <div
        ref={dropdownRef}
        role="listbox"
        aria-label="Search results"
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: isOverlay ? 'relative' : 'absolute',
          left: isOverlay ? 'auto' : 0,
          top: isOverlay ? 'auto' : '100%',
          width: isOverlay ? '100%' : '125%',
          marginLeft: isOverlay ? 'auto' : '-12.5%',
          zIndex: 9999,
          boxSizing: 'border-box',
          maxHeight: '70vh',
          borderRadius: '12px',
          paddingTop: 0,
          overflow: 'visible',
          pointerEvents: 'auto',
        }}
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-[0_4px_24px_0_rgba(0,0,0,0.10)] dark:shadow-[0_4px_24px_0_rgba(0,0,0,0.30)] animate-fadein flex flex-col overflow-visible"
      >
        <SearchSkeleton />
      </div>
    );
  }



  return (
    <div
      ref={dropdownRef}
      role="listbox"
      aria-label="Search results"
      aria-live="polite"
      aria-atomic="true"
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
        paddingTop: 0,
        overflow: 'visible',
        pointerEvents: 'auto',
      }}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-[0_4px_24px_0_rgba(0,0,0,0.10)] dark:shadow-[0_4px_24px_0_rgba(0,0,0,0.30)] animate-fadein flex flex-col overflow-visible"
      onClick={(e) => {

        e.stopPropagation();
      }}
      onMouseDown={(e) => {

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

                    e.preventDefault();
                    e.stopPropagation();

                    setGlobalSearchTerm(search);
                    addRecentSearch(search);

                    // Focus the input to show results for this term
                    setTimeout(() => {

                      inputRef.current?.focus();

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

        {/* Search Suggestions */}
        {showSuggestions && searchSuggestions.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2 text-sm">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Suggestions
            </h3>
            <div className="flex flex-wrap gap-2">
              {searchSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setGlobalSearchTerm(suggestion);
                    addRecentSearch(suggestion);
                    setShowSuggestions(false);
                    setTimeout(() => {
                      inputRef.current?.focus();
                    }, 10);
                  }}
                  className="px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-600 transition-colors text-xs"
                  style={{ fontSize: '13px', lineHeight: '18px' }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Transactions Section */}
        {rankedTransactions.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
              Transactions ({rankedTransactions.length})
            </h3>
            <div className="space-y-2">
              {(showAllTransactions ? rankedTransactions : rankedTransactions.slice(0, 3)).map((res, index) => (
                <button
                  key={`transaction-${index}`}
                  role="option"
                  aria-selected={highlightedIdx === index}
                  aria-label={`Transaction: ${res.item.description}`}
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
                        {highlight(res.item.description || '', (res.matches?.filter((m: any) => m.key === 'description') ?? []) as any[])}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {highlight(res.item.category || '', (res.matches?.filter((m: any) => m.key === 'category') ?? []) as any[])} • {res.item.amount} • {res.item.type}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
              {rankedTransactions.length > 3 && (
                <button
                  className="w-full text-center text-xs text-blue-600 dark:text-blue-400 mt-2"
                  onClick={() => setShowAllTransactions(v => !v)}
                >
                  {showAllTransactions ? 'Show less' : `Show more (${rankedTransactions.length - 3})`}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Purchases Section */}
        {rankedPurchases.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              Purchases ({rankedPurchases.length})
            </h3>
            <div className="space-y-2">
              {(showAllPurchases ? rankedPurchases : rankedPurchases.slice(0, 3)).map((res, index) => (
                <button
                  key={`purchase-${index}`}
                  onClick={() => handleResultClick('purchase', res.item)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    highlightedIdx === rankedTransactions.length + index ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
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
                        {highlight(res.item.item_name || '', (res.matches?.filter((m: any) => m.key === 'item_name') ?? []) as any[])}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {highlight(res.item.category || '', (res.matches?.filter((m: any) => m.key === 'category') ?? []) as any[])} • {res.item.price} • {res.item.status}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
              {rankedPurchases.length > 3 && (
                <button
                  className="w-full text-center text-xs text-blue-600 dark:text-blue-400 mt-2"
                  onClick={() => setShowAllPurchases(v => !v)}
                >
                  {showAllPurchases ? 'Show less' : `Show more (${rankedPurchases.length - 3})`}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Transfers Section */}
        {rankedTransfers.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Transfers ({rankedTransfers.length})
            </h3>
            <div className="space-y-2">
              {(showAllTransfers ? rankedTransfers : rankedTransfers.slice(0, 3)).map((res, index) => (
                <button
                  key={`transfer-${index}`}
                  onClick={() => handleResultClick('transfer', res.item)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    highlightedIdx === rankedTransactions.length + rankedPurchases.length + index ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
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
                        {highlight(res.item.fromAccount?.name || res.item.from_account?.name || 'From', (res.matches?.filter((m: any) => m.key === 'fromAccount' || m.key === 'from_account') ?? []) as any[])}
                        {' → '}
                        {highlight(res.item.toAccount?.name || res.item.to_account?.name || 'To', (res.matches?.filter((m: any) => m.key === 'toAccount' || m.key === 'to_account') ?? []) as any[])}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {res.item.fromAmount || res.item.amount} {res.item.fromCurrency || res.item.currency || ''} → {res.item.toAmount || res.item.amount} {res.item.toCurrency || res.item.currency || ''} • {res.item.note || ''}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
              {rankedTransfers.length > 3 && (
                <button
                  className="w-full text-center text-xs text-blue-600 dark:text-blue-400 mt-2"
                  onClick={() => setShowAllTransfers(v => !v)}
                >
                  {showAllTransfers ? 'Show less' : `Show more (${rankedTransfers.length - 3})`}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Accounts Section */}
        {rankedAccounts.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Accounts ({rankedAccounts.length})
            </h3>
            <div className="space-y-2">
              {(showAllAccounts ? rankedAccounts : rankedAccounts.slice(0, 3)).map((res, index) => (
                <button
                  key={`account-${index}`}
                  onClick={() => handleResultClick('account', res.item)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    highlightedIdx === rankedTransactions.length + rankedPurchases.length + rankedTransfers.length + index ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
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
                        {highlight(res.item.name || '', (res.matches?.filter((m: any) => m.key === 'name') ?? []) as any[])}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {res.item.currency} • Balance: {res.item.calculated_balance}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
              {rankedAccounts.length > 3 && (
                <button
                  className="w-full text-center text-xs text-blue-600 dark:text-blue-400 mt-2"
                  onClick={() => setShowAllAccounts(v => !v)}
                >
                  {showAllAccounts ? 'Show less' : `Show more (${rankedAccounts.length - 3})`}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Lend & Borrow Section */}
        {rankedLendBorrow.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
              Lend & Borrow ({rankedLendBorrow.length})
            </h3>
            <div className="space-y-2">
              {rankedLendBorrow.slice(0, 3).map((res, index) => (
                <button
                  key={`lendborrow-${index}`}
                  onClick={() => handleResultClick('lendborrow', res.item)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    highlightedIdx === rankedTransactions.length + rankedPurchases.length + rankedTransfers.length + rankedAccounts.length + index ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
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
                        {highlight(res.item.person_name || '', (res.matches?.filter((m: any) => m.key === 'person_name') ?? []) as any[])}
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

        {/* Donations Section */}
        {rankedDonations.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              Donations ({rankedDonations.length})
            </h3>
            <div className="space-y-2">
              {rankedDonations.slice(0, 3).map((res, index) => (
                <button
                  key={`donation-${index}`}
                  onClick={() => handleResultClick('donation', res.item)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    highlightedIdx === rankedTransactions.length + rankedPurchases.length + rankedTransfers.length + rankedAccounts.length + rankedLendBorrow.length + index ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {highlight(res.item.type || '', (res.matches?.filter((m: any) => m.key === 'type') ?? []) as any[])}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        ${res.item.amount} • {res.item.mode} • {res.item.status}
                        {res.item.note && typeof res.item.note === 'string' && res.item.note.trim() && ` • ${res.item.note.substring(0, 30)}${res.item.note.length > 30 ? '...' : ''}`}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {search && rankedTransactions.length === 0 && rankedPurchases.length === 0 && rankedTransfers.length === 0 && rankedAccounts.length === 0 && rankedLendBorrow.length === 0 && rankedDonations.length === 0 && (
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

