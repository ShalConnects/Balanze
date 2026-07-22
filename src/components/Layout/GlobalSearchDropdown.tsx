import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Search, DollarSign, Users, CheckSquare, FileText, Sprout, BookOpen, CreditCard, ShoppingBag, Handshake, Ticket } from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useClientStore } from '../../store/useClientStore';
import { useHabitStore } from '../../store/useHabitStore';
import { useCourseStore } from '../../store/useCourseStore';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { createGlobalFuseIndex } from '../../utils/createGlobalFuseIndex';
import {
  GLOBAL_SEARCH_INV_ASSET_KEYS,
  GLOBAL_SEARCH_INV_TX_KEYS,
  GLOBAL_SEARCH_INV_GOAL_KEYS,
  GLOBAL_SEARCH_INV_CATEGORY_KEYS,
  GLOBAL_SEARCH_BUSINESS_CONTRACT_KEYS,
  GLOBAL_SEARCH_PRIZE_BOND_KEYS,
} from '../../utils/globalSearchInvestmentKeys';
import { globalSearchCacheFingerprint } from '../../utils/globalSearchCacheFingerprint';
import { SearchSkeleton } from '../common/SearchSkeleton';
import { formatCurrency } from '../../utils/currency';
import { fetchBusinessInvestmentContracts } from '../../lib/businessInvestmentService';
import { fetchPrizeBonds } from '../../lib/prizeBondService';
import { INVESTMENTS_BONDS_TAB } from '../../lib/investmentsNav';
import { INVESTMENTS_FEATURE_ICON } from '../../lib/investmentFeatureIcon';
import { formatAppDate } from '../../utils/timezoneUtils';
import {
  GLOBAL_SEARCH_PREFIX_HINTS,
  buildGlobalSearchOffsets,
  globalSearchSectionCssOrder,
  parseGlobalSearchQuery,
} from '../../utils/globalSearchScope';
import { format } from 'date-fns';
import type { PrizeBond } from '../../types/prizeBond';

// Date formatting utility
const formatSearchDate = (dateString: string): string => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  
  return date.getFullYear() !== now.getFullYear() ? formatAppDate(date) : format(date, 'MMM dd');
};


// Removed unused TABS constant

interface GlobalSearchDropdownProps {
  isFocused: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  dropdownRef: React.RefObject<HTMLDivElement>;
  onClose: () => void;
  isOverlay?: boolean; // New prop to indicate if this is in an overlay
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
  const {
    globalSearchTerm,
    transactions,
    accounts,
    setGlobalSearchTerm,
    purchases,
    lendBorrowRecords,
    donationSavingRecords,
    investmentAssets,
    investmentTransactions,
    investmentGoals,
    investmentCategories,
  } = useFinanceStore();
  const { clients, tasks, invoices } = useClientStore();
  const { habits } = useHabitStore();
  const { courses } = useCourseStore();
  const user = useAuthStore(s => s.user);
  const navigate = useNavigate();
  const [transfers, setTransfers] = useState<any[]>([]);
  const [dpsTransfers, setDpsTransfers] = useState<any[]>([]);
  const [businessInvestmentContracts, setBusinessInvestmentContracts] = useState<any[]>([]);
  const [prizeBonds, setPrizeBonds] = useState<PrizeBond[]>([]);
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
  const [showAllClients, setShowAllClients] = useState(false);
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [showAllInvoices, setShowAllInvoices] = useState(false);
  const [showAllHabits, setShowAllHabits] = useState(false);
  const [showAllCourses, setShowAllCourses] = useState(false);
  const [showAllInvestments, setShowAllInvestments] = useState(false);

  // Handle result click navigation
  const handleResultClick = (type: string, item: any) => {




    
    addRecentSearch(search);
    setGlobalSearchTerm('');
    
    // Close the dropdown
    onClose();
    inputRef.current?.blur();
    
    // Get the correct ID based on item type
    const itemId = item?.id;
    
    
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
      case 'client':
        navigate(`/clients?selected=${itemId}&from=search`);
        break;
      case 'task':
        // Navigate to client page with task highlighted
        if (item?.client_id) {
          navigate(`/clients?selected=${item.client_id}&from=search&highlight=task-${itemId}`);
        } else {
          navigate(`/clients?from=search`);
        }
        break;
      case 'invoice':
        // Navigate to client page with invoice highlighted
        if (item?.client_id) {
          navigate(`/clients?selected=${item.client_id}&from=search&highlight=invoice-${itemId}`);
        } else {
          navigate(`/clients?from=search`);
        }
        break;
      case 'habit':
        navigate(`/personal-growth?tab=habits&from=search`);
        break;
      case 'course':
        navigate(`/personal-growth?tab=learning&from=search`);
        break;
      case 'investment_asset':
        navigate(`/investments?tab=assets&from=search`);
        break;
      case 'investment_transaction':
        navigate(`/investments?tab=transactions&from=search`);
        break;
      case 'investment_goal':
        navigate(`/investments?tab=goals&from=search`);
        break;
      case 'investment_category':
        navigate(`/investments?tab=assets&from=search`);
        break;
      case 'business_investment_contract':
        navigate(`/investments?from=search`);
        break;
      case 'prize_bond':
        navigate(`/investments?tab=${INVESTMENTS_BONDS_TAB}&search=${encodeURIComponent(item.bond_number)}&from=search`);
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    let isMounted = true;
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
      if (!isMounted) return;
      setTransfers(transferData || []);
      setDpsTransfers(dpsData || []);
    };
    fetchTransfers();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch lend & borrow records when component loads
  useEffect(() => {
    const { fetchLendBorrowRecords } = useFinanceStore.getState();
    fetchLendBorrowRecords();
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const {
      fetchInvestmentAssets,
      fetchInvestmentTransactions,
      fetchInvestmentGoals,
      fetchInvestmentCategories,
    } = useFinanceStore.getState();
    void Promise.all([
      fetchInvestmentAssets(),
      fetchInvestmentTransactions(),
      fetchInvestmentGoals(),
      fetchInvestmentCategories(),
    ]);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    void fetchBusinessInvestmentContracts(user.id)
      .then(setBusinessInvestmentContracts)
      .catch(() => setBusinessInvestmentContracts([]));
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    void fetchPrizeBonds(user.id).then(setPrizeBonds).catch(() => setPrizeBonds([]));
  }, [user?.id]);

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
      if (account.type?.toLowerCase().includes(queryLower)) {
        suggestions.push(account.type);
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
    
    // Get suggestions from clients
    (clients || []).forEach(client => {
      if (client.name?.toLowerCase().includes(queryLower)) {
        suggestions.push(client.name);
      }
      if (client.company_name?.toLowerCase().includes(queryLower)) {
        suggestions.push(client.company_name);
      }
      if (client.email?.toLowerCase().includes(queryLower)) {
        suggestions.push(client.email);
      }
      if (client.phone?.toLowerCase().includes(queryLower)) {
        suggestions.push(client.phone);
      }
    });
    
    // Get suggestions from tasks
    (tasks || []).forEach(task => {
      if (task.title?.toLowerCase().includes(queryLower)) {
        suggestions.push(task.title);
      }
      if (task.description?.toLowerCase().includes(queryLower)) {
        suggestions.push(task.description);
      }
    });
    
    // Get suggestions from invoices
    (invoices || []).forEach(invoice => {
      if (invoice.invoice_number?.toLowerCase().includes(queryLower)) {
        suggestions.push(invoice.invoice_number);
      }
      if (invoice.notes?.toLowerCase().includes(queryLower)) {
        suggestions.push(invoice.notes);
      }
    });
    
    // Get suggestions from habits
    (habits || []).forEach(habit => {
      if (habit.title?.toLowerCase().includes(queryLower)) {
        suggestions.push(habit.title);
      }
    });

    (investmentAssets || []).forEach(a => {
      if (a.name?.toLowerCase().includes(queryLower)) suggestions.push(a.name);
      if (a.symbol?.toLowerCase().includes(queryLower)) suggestions.push(a.symbol);
    });
    (investmentGoals || []).forEach(g => {
      if (g.name?.toLowerCase().includes(queryLower)) suggestions.push(g.name);
    });
    (investmentCategories || []).forEach(c => {
      if (c.name?.toLowerCase().includes(queryLower)) suggestions.push(c.name);
    });
    (businessInvestmentContracts || []).forEach(c => {
      if (c.title?.toLowerCase().includes(queryLower)) suggestions.push(c.title);
    });
    (prizeBonds || []).forEach(b => {
      if (b.bond_number.includes(query.trim())) suggestions.push(b.bond_number);
    });

    // Remove duplicates and limit to 3 suggestions
    return [...new Set(suggestions)].slice(0, 3);
  }, [transactions, accounts, purchases, lendBorrowRecords, clients, tasks, invoices, habits, investmentAssets, investmentGoals, investmentCategories, businessInvestmentContracts, prizeBonds]);

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
      const parsedSearch = parseGlobalSearchQuery(search).query;
      // Generate suggestions for autocomplete
      if (parsedSearch && parsedSearch.length >= 2) {
        const suggestions = generateSearchSuggestions(parsedSearch);
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

  const investmentTransactionsForSearch = useMemo(() => {
    const byId = new Map((investmentAssets || []).map(a => [a.id, a]));
    return (investmentTransactions || []).map(t => {
      const asset = t.asset_id ? byId.get(t.asset_id) : undefined;
      return {
        ...t,
        asset_symbol: asset?.symbol ?? '',
        asset_name: asset?.name ?? '',
      };
    });
  }, [investmentTransactions, investmentAssets]);

  const combinedTransfers = getCombinedTransfers(transfers, accounts);
  const allTransfers = [
    ...combinedTransfers.map(t => ({
      ...t,
      type: t.fromCurrency === t.toCurrency ? 'inbetween' : 'currency',
    })),
    ...dpsTransfers.map(t => ({ ...t, type: 'dps' })),
  ];
  // Removed unused filteredTransfers - now using fuzzy search

  const {
    fuseTransactions,
    fuseAccounts,
    fuseTransfers,
    fusePurchases,
    fuseLendBorrow,
    fuseDonations,
    fuseClients,
    fuseTasks,
    fuseInvoices,
    fuseHabits,
    fuseCourses,
    fuseInvAssets,
    fuseInvTransactions,
    fuseInvGoals,
    fuseInvCategories,
    fuseBusinessInvestmentContracts,
    fusePrizeBonds,
  } = useMemo(() => {
    const financeFuzzyKeys: Array<{ name: string; weight: number }> = [
      { name: 'description', weight: 0.4 },
      { name: 'category', weight: 0.25 },
      { name: 'tags', weight: 0.15 },
      { name: 'transaction_id', weight: 0.1 },
      { name: 'name', weight: 0.4 },
      { name: 'type', weight: 0.15 },
      { name: 'currency', weight: 0.05 },
    ];

    return {
      fuseTransactions: createGlobalFuseIndex(transactions, financeFuzzyKeys),
      fuseAccounts: createGlobalFuseIndex(accounts, financeFuzzyKeys),
      fuseTransfers: createGlobalFuseIndex(allTransfers, financeFuzzyKeys),
      fusePurchases: createGlobalFuseIndex(purchases, [
        { name: 'item_name', weight: 0.4 },
        { name: 'category', weight: 0.25 },
        { name: 'notes', weight: 0.15 },
        { name: 'status', weight: 0.1 },
        { name: 'price', weight: 0.1 },
      ]),
      fuseLendBorrow: createGlobalFuseIndex(lendBorrowRecords, [
        { name: 'person_name', weight: 0.4 },
        { name: 'type', weight: 0.25 },
        { name: 'notes', weight: 0.15 },
        { name: 'status', weight: 0.1 },
        { name: 'currency', weight: 0.1 },
      ]),
      fuseDonations: createGlobalFuseIndex(donationSavingRecords, [
        { name: 'type', weight: 0.4 },
        { name: 'note', weight: 0.3 },
        { name: 'status', weight: 0.2 },
        { name: 'mode', weight: 0.1 },
      ]),
      fuseClients: createGlobalFuseIndex(clients, [
        { name: 'name', weight: 0.35 },
        { name: 'company_name', weight: 0.25 },
        { name: 'email', weight: 0.15 },
        { name: 'source', weight: 0.1 },
        { name: 'tags', weight: 0.1 },
        { name: 'phone', weight: 0.05 },
      ]),
      fuseTasks: createGlobalFuseIndex(tasks, [
        { name: 'title', weight: 0.4 },
        { name: 'description', weight: 0.25 },
        { name: 'status', weight: 0.15 },
        { name: 'priority', weight: 0.1 },
      ]),
      fuseInvoices: createGlobalFuseIndex(invoices, [
        { name: 'invoice_number', weight: 0.35 },
        { name: 'status', weight: 0.15 },
        { name: 'total', weight: 0.1 },
        { name: 'notes', weight: 0.1 },
        { name: 'payment_status', weight: 0.05 },
      ]),
      fuseHabits: createGlobalFuseIndex(habits, [
        { name: 'title', weight: 0.5 },
        { name: 'description', weight: 0.3 },
      ]),
      fuseCourses: createGlobalFuseIndex(courses, [
        { name: 'name', weight: 0.5 },
        { name: 'description', weight: 0.3 },
      ]),
      fuseInvAssets: createGlobalFuseIndex(investmentAssets, GLOBAL_SEARCH_INV_ASSET_KEYS),
      fuseInvTransactions: createGlobalFuseIndex(
        investmentTransactionsForSearch,
        GLOBAL_SEARCH_INV_TX_KEYS
      ),
      fuseInvGoals: createGlobalFuseIndex(investmentGoals, GLOBAL_SEARCH_INV_GOAL_KEYS),
      fuseInvCategories: createGlobalFuseIndex(investmentCategories, GLOBAL_SEARCH_INV_CATEGORY_KEYS),
      fuseBusinessInvestmentContracts: createGlobalFuseIndex(
        businessInvestmentContracts,
        GLOBAL_SEARCH_BUSINESS_CONTRACT_KEYS
      ),
      fusePrizeBonds: createGlobalFuseIndex(prizeBonds, GLOBAL_SEARCH_PRIZE_BOND_KEYS),
    };
  }, [
    transactions,
    accounts,
    allTransfers,
    purchases,
    lendBorrowRecords,
    donationSavingRecords,
    clients,
    tasks,
    invoices,
    habits,
    courses,
    investmentAssets,
    investmentTransactionsForSearch,
    investmentGoals,
    investmentCategories,
    businessInvestmentContracts,
    prizeBonds,
  ]);

  // Memoized search results with caching
  const searchResults = useMemo(() => {
    if (!debouncedSearch) {
      return {
        fuzzyTransactions: [],
        fuzzyAccounts: [],
        fuzzyTransfers: [],
        fuzzyPurchases: [],
        fuzzyLendBorrow: [],
        fuzzyDonations: [],
        fuzzyClients: [],
        fuzzyTasks: [],
        fuzzyInvoices: [],
        fuzzyHabits: [],
        fuzzyCourses: [],
        fuzzyInvestments: [],
      };
    }

    const cacheKey = `${debouncedSearch.toLowerCase()}\0${globalSearchCacheFingerprint({
      transactions,
      accounts,
      purchases,
      lendBorrowRecords,
      donationSavingRecords,
      clients,
      tasks,
      invoices,
      habits,
      courses,
      investmentAssets,
      investmentTransactions,
      investmentGoals,
      investmentCategories,
      businessInvestmentContracts,
      prizeBonds,
      transfers,
      dpsTransfers,
    })}`;
    if (searchCache.has(cacheKey)) {
      return searchCache.get(cacheKey);
    }

    const { scope, query } = parseGlobalSearchQuery(debouncedSearch);
    // Single string for Fuse (Bitap). Concatenating synonym lists made the pattern
    // too long and effectively matched almost nothing.
    const fuseQuery = query.toLowerCase().trim();
    const inScope = (target: string) => scope === 'all' || scope === target;
    if (!fuseQuery) {
      return {
        fuzzyTransactions: [],
        fuzzyAccounts: [],
        fuzzyTransfers: [],
        fuzzyPurchases: [],
        fuzzyLendBorrow: [],
        fuzzyDonations: [],
        fuzzyClients: [],
        fuzzyTasks: [],
        fuzzyInvoices: [],
        fuzzyHabits: [],
        fuzzyCourses: [],
        fuzzyInvestments: [],
      };
    }

    const bondHits = (inScope('bonds') || inScope('investments') || scope === 'all')
      ? fusePrizeBonds.search(fuseQuery).map(r => ({ ...r, invKind: 'prize_bond' as const }))
      : [];
    const invCore = inScope('investments') || scope === 'all'
      ? [
          ...fuseInvAssets.search(fuseQuery).map(r => ({ ...r, invKind: 'investment_asset' as const })),
          ...fuseInvTransactions.search(fuseQuery).map(r => ({ ...r, invKind: 'investment_transaction' as const })),
          ...fuseInvGoals.search(fuseQuery).map(r => ({ ...r, invKind: 'investment_goal' as const })),
          ...fuseInvCategories.search(fuseQuery).map(r => ({ ...r, invKind: 'investment_category' as const })),
          ...fuseBusinessInvestmentContracts.search(fuseQuery).map(r => ({ ...r, invKind: 'business_investment_contract' as const })),
        ]
      : [];
    const invMerged = (inScope('bonds') ? bondHits : [...invCore, ...bondHits]).sort((a, b) => {
      const ta = new Date((a.item as { transaction_date?: string; created_at?: string }).transaction_date || a.item.created_at || 0).getTime();
      const tb = new Date((b.item as { transaction_date?: string; created_at?: string }).transaction_date || b.item.created_at || 0).getTime();
      return tb - ta;
    });

    const results = {
      fuzzyTransactions: inScope('transactions') ? fuseTransactions.search(fuseQuery) : [],
      fuzzyAccounts: inScope('accounts') ? fuseAccounts.search(fuseQuery) : [],
      fuzzyTransfers: inScope('transfers') ? fuseTransfers.search(fuseQuery) : [],
      fuzzyPurchases: inScope('purchases') ? fusePurchases.search(fuseQuery) : [],
      fuzzyLendBorrow: inScope('lendBorrow') ? fuseLendBorrow.search(fuseQuery) : [],
      fuzzyDonations: inScope('donations') ? fuseDonations.search(fuseQuery) : [],
      fuzzyClients: inScope('clients') ? fuseClients.search(fuseQuery) : [],
      fuzzyTasks: inScope('tasks') ? fuseTasks.search(fuseQuery) : [],
      fuzzyInvoices: inScope('invoices') ? fuseInvoices.search(fuseQuery) : [],
      fuzzyHabits: inScope('habits') ? fuseHabits.search(fuseQuery) : [],
      fuzzyCourses: inScope('courses') ? fuseCourses.search(fuseQuery) : [],
      fuzzyInvestments: invMerged,
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
  }, [
    debouncedSearch,
    transactions,
    accounts,
    purchases,
    lendBorrowRecords,
    donationSavingRecords,
    clients,
    tasks,
    invoices,
    habits,
    courses,
    investmentAssets,
    investmentTransactions,
    investmentGoals,
    investmentCategories,
    businessInvestmentContracts,
    prizeBonds,
    transfers,
    dpsTransfers,
    fuseTransactions,
    fuseAccounts,
    fuseTransfers,
    fusePurchases,
    fuseLendBorrow,
    fuseDonations,
    fuseClients,
    fuseTasks,
    fuseInvoices,
    fuseHabits,
    fuseCourses,
    fuseInvAssets,
    fuseInvTransactions,
    fuseInvGoals,
    fuseInvCategories,
    fuseBusinessInvestmentContracts,
    fusePrizeBonds,
    searchCache,
  ]);

  const {
    fuzzyTransactions,
    fuzzyAccounts,
    fuzzyTransfers,
    fuzzyPurchases,
    fuzzyLendBorrow,
    fuzzyDonations,
    fuzzyClients,
    fuzzyTasks,
    fuzzyInvoices,
    fuzzyHabits,
    fuzzyCourses,
    fuzzyInvestments = [],
  } = searchResults;

  // Simple date-based sorting function - latest first within each category
  const sortByLatest = (results: any[]) => {
    return results.sort((a, b) => {
      // Get the most relevant date for each item
      const dateA = new Date(a.item.date || a.item.created_at || a.item.updated_at || 0);
      const dateB = new Date(b.item.date || b.item.created_at || b.item.updated_at || 0);
      
      // Sort by date descending (most recent first)
      return dateB.getTime() - dateA.getTime();
    });
  };

  // Apply simple date sorting to all result sets - latest first within each category
  const rankedTransactions = search ? sortByLatest(fuzzyTransactions) : [];
  const rankedAccounts = search ? sortByLatest(fuzzyAccounts) : [];
  const rankedTransfers = search ? sortByLatest(fuzzyTransfers) : [];
  const rankedPurchases = search ? sortByLatest(fuzzyPurchases) : [];
  const rankedLendBorrow = search ? sortByLatest(fuzzyLendBorrow) : [];
  const rankedDonations = search ? sortByLatest(fuzzyDonations) : [];
  const rankedClients = search ? sortByLatest(fuzzyClients) : [];
  const rankedTasks = search ? sortByLatest(fuzzyTasks) : [];
  const rankedInvoices = search ? sortByLatest(fuzzyInvoices) : [];
  const rankedHabits = search ? sortByLatest(fuzzyHabits) : [];
  const rankedCourses = search ? sortByLatest(fuzzyCourses) : [];
  const rankedInvestments = search ? fuzzyInvestments : [];

  const searchOffsets = useMemo(() => {
    return buildGlobalSearchOffsets({
      tx: rankedTransactions.length,
      acc: rankedAccounts.length,
      pur: rankedPurchases.length,
      lb: rankedLendBorrow.length,
      inv: rankedInvestments.length,
      cli: rankedClients.length,
      trf: rankedTransfers.length,
      don: rankedDonations.length,
      tas: rankedTasks.length,
      invdoc: rankedInvoices.length,
      hab: rankedHabits.length,
      cou: rankedCourses.length,
    });
  }, [
    rankedAccounts.length,
    rankedTransactions.length,
    rankedPurchases.length,
    rankedLendBorrow.length,
    rankedInvestments.length,
    rankedClients.length,
    rankedTransfers.length,
    rankedDonations.length,
    rankedTasks.length,
    rankedInvoices.length,
    rankedHabits.length,
    rankedCourses.length,
  ]);

  const totalResults =
    rankedAccounts.length +
    rankedTransactions.length +
    rankedPurchases.length +
    rankedLendBorrow.length +
    rankedInvestments.length +
    rankedClients.length +
    rankedTransfers.length +
    rankedDonations.length +
    rankedTasks.length +
    rankedInvoices.length +
    rankedHabits.length +
    rankedCourses.length;

  // Highlight helper
  function highlight(text: string, matches: any[]): React.ReactNode {
    if (!matches || matches.length === 0) return text;
    const result: React.ReactNode[] = [];
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
        let itemType = '';
        if (search) {
          const accLen = rankedAccounts.length;
          const txLen = rankedTransactions.length;
          const purLen = rankedPurchases.length;
          const lbLen = rankedLendBorrow.length;
          const invLen = rankedInvestments.length;
          const cliLen = rankedClients.length;
          const trfLen = rankedTransfers.length;
          const donLen = rankedDonations.length;
          const tasLen = rankedTasks.length;
          const invdocLen = rankedInvoices.length;
          const habLen = rankedHabits.length;
          const couLen = rankedCourses.length;

          if (txLen > 0 && highlightedIdx >= searchOffsets.txStart && highlightedIdx < searchOffsets.accStart) {
            item = rankedTransactions[highlightedIdx - searchOffsets.txStart]?.item;
            itemType = 'transaction';
          } else if (accLen > 0 && highlightedIdx >= searchOffsets.accStart && highlightedIdx < searchOffsets.purStart) {
            item = rankedAccounts[highlightedIdx - searchOffsets.accStart]?.item;
            itemType = 'account';
          } else if (purLen > 0 && highlightedIdx >= searchOffsets.purStart && highlightedIdx < searchOffsets.lbStart) {
            item = rankedPurchases[highlightedIdx - searchOffsets.purStart]?.item;
            itemType = 'purchase';
          } else if (lbLen > 0 && highlightedIdx >= searchOffsets.lbStart && highlightedIdx < searchOffsets.invStart) {
            item = rankedLendBorrow[highlightedIdx - searchOffsets.lbStart]?.item;
            itemType = 'lendborrow';
          } else if (invLen > 0 && highlightedIdx >= searchOffsets.invStart && highlightedIdx < searchOffsets.cliStart) {
            const hit = rankedInvestments[highlightedIdx - searchOffsets.invStart];
            item = hit.item;
            itemType = hit.invKind;
          } else if (cliLen > 0 && highlightedIdx >= searchOffsets.cliStart && highlightedIdx < searchOffsets.trfStart) {
            item = rankedClients[highlightedIdx - searchOffsets.cliStart]?.item;
            itemType = 'client';
          } else if (trfLen > 0 && highlightedIdx >= searchOffsets.trfStart && highlightedIdx < searchOffsets.donStart) {
            item = rankedTransfers[highlightedIdx - searchOffsets.trfStart]?.item;
            itemType = 'transfer';
          } else if (donLen > 0 && highlightedIdx >= searchOffsets.donStart && highlightedIdx < searchOffsets.tasStart) {
            item = rankedDonations[highlightedIdx - searchOffsets.donStart]?.item;
            itemType = 'donation';
          } else if (tasLen > 0 && highlightedIdx >= searchOffsets.tasStart && highlightedIdx < searchOffsets.invdocStart) {
            item = rankedTasks[highlightedIdx - searchOffsets.tasStart]?.item;
            itemType = 'task';
          } else if (invdocLen > 0 && highlightedIdx >= searchOffsets.invdocStart && highlightedIdx < searchOffsets.habStart) {
            item = rankedInvoices[highlightedIdx - searchOffsets.invdocStart]?.item;
            itemType = 'invoice';
          } else if (habLen > 0 && highlightedIdx >= searchOffsets.habStart && highlightedIdx < searchOffsets.couStart) {
            item = rankedHabits[highlightedIdx - searchOffsets.habStart]?.item;
            itemType = 'habit';
          } else if (couLen > 0 && highlightedIdx >= searchOffsets.couStart && highlightedIdx < searchOffsets.couStart + couLen) {
            item = rankedCourses[highlightedIdx - searchOffsets.couStart]?.item;
            itemType = 'course';
          }
        } else {
          item = recentSearches[highlightedIdx];
        }
        if (item) {
          if (itemType) {
            handleResultClick(itemType, item);
          } else {
            addRecentSearch(search);
            setRecentSearches(getRecentSearches());
            setGlobalSearchTerm('');
          }
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isFocused, search, highlightedIdx, rankedTransactions, rankedPurchases, rankedTransfers, rankedAccounts, rankedInvestments, rankedLendBorrow, rankedDonations, rankedClients, rankedTasks, rankedInvoices, rankedHabits, rankedCourses, recentSearches, searchOffsets, setGlobalSearchTerm]);

  // Show recent searches if input is focused and empty
  
  if ((!search || search.length === 0) && isFocused) {
    return (
      <div 
        className={`${isOverlay ? 'relative w-full' : 'fixed'} z-[100] bg-white dark:bg-gray-800 md:border md:border-gray-200 md:dark:border-gray-700 rounded-xl shadow-lg dark:shadow-xl p-4 animate-fadein`}
        style={!isOverlay && inputRef.current ? {
          left: `${inputRef.current.getBoundingClientRect().left - (inputRef.current.getBoundingClientRect().width * 0.125)}px`,
          top: `${inputRef.current.getBoundingClientRect().bottom + 8}px`,
          width: `${inputRef.current.getBoundingClientRect().width * 1.25}px`,
        } : {}}
      >
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
        <div className="mt-3">
          <div className="text-xs text-gray-400 dark:text-gray-500 mb-2">Try scoped search</div>
          <div className="flex flex-wrap gap-2">
            {GLOBAL_SEARCH_PREFIX_HINTS.map(prefix => (
              <button
                key={prefix}
                className="px-2 py-1 rounded-full text-xs border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setGlobalSearchTerm(prefix);
                  setTimeout(() => inputRef.current?.focus(), 10);
                }}
              >
                {prefix}
              </button>
            ))}
          </div>
        </div>
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
          position: isOverlay ? 'relative' : 'fixed',
          left: isOverlay ? 'auto' : (inputRef.current ? `${inputRef.current.getBoundingClientRect().left - (inputRef.current.getBoundingClientRect().width * 0.125)}px` : '50%'),
          top: isOverlay ? 'auto' : (inputRef.current ? `${inputRef.current.getBoundingClientRect().bottom + 8}px` : '64px'),
          width: isOverlay ? '100%' : (inputRef.current ? `${inputRef.current.getBoundingClientRect().width * 1.25}px` : '400px'),
          zIndex: 9999,
          boxSizing: 'border-box',
          maxHeight: '70vh',
          borderRadius: '12px',
          paddingTop: 0,
          overflow: 'visible',
          pointerEvents: 'auto',
        }}
        className="bg-white dark:bg-gray-800 md:border md:border-gray-200 md:dark:border-gray-700 shadow-[0_4px_24px_0_rgba(0,0,0,0.10)] dark:shadow-[0_4px_24px_0_rgba(0,0,0,0.30)] animate-fadein flex flex-col overflow-visible"
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
        position: isOverlay ? 'relative' : 'fixed',
        left: isOverlay ? 'auto' : (inputRef.current ? `${inputRef.current.getBoundingClientRect().left - (inputRef.current.getBoundingClientRect().width * 0.125)}px` : '50%'),
        top: isOverlay ? 'auto' : (inputRef.current ? `${inputRef.current.getBoundingClientRect().bottom + 8}px` : '64px'),
        width: isOverlay ? '100%' : (inputRef.current ? `${inputRef.current.getBoundingClientRect().width * 1.25}px` : '400px'),
        zIndex: 9999,
        boxSizing: 'border-box',
        maxHeight: search ? '70vh' : '55vh',
        borderRadius: '12px',
        paddingTop: 0,
        overflow: 'visible',
        pointerEvents: 'auto',
      }}
      className="bg-white dark:bg-gray-800 md:border md:border-gray-200 md:dark:border-gray-700 shadow-[0_4px_24px_0_rgba(0,0,0,0.10)] dark:shadow-[0_4px_24px_0_rgba(0,0,0,0.30)] animate-fadein flex flex-col overflow-visible"
      onClick={(e) => {

        e.stopPropagation();
      }}
      onMouseDown={(e) => {

        e.stopPropagation();
      }}
    >
      <div
        className="px-4 pt-4 pb-8 min-h-[160px] sm:px-6 flex-1 flex flex-col"
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
          <div className="mb-3">
            <h3 className="font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wide">
              Suggestions
            </h3>
            <div className="flex flex-wrap gap-1">
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
                  className="max-w-full truncate px-2 py-0.5 text-[11px] leading-4 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-600 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Transactions Section */}
        {rankedTransactions.length > 0 && (
          <div className="mb-6" style={{ order: globalSearchSectionCssOrder('transactions') }}>
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
                    highlightedIdx === searchOffsets.txStart + index ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
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
                        {formatCurrency(res.item.amount, accounts.find(acc => acc.id === res.item.account_id)?.currency || 'USD')} • {formatSearchDate(res.item.date || res.item.created_at)}
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
          <div className="mb-6" style={{ order: globalSearchSectionCssOrder('purchases') }}>
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
                    highlightedIdx === searchOffsets.purStart + index ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                      <ShoppingBag className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {highlight(res.item.item_name || '', (res.matches?.filter((m: any) => m.key === 'item_name') ?? []) as any[])}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {formatCurrency(res.item.price, res.item.currency || 'USD')} • {formatSearchDate(res.item.created_at || res.item.updated_at)}
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
          <div className="mb-6" style={{ order: globalSearchSectionCssOrder('transfers') }}>
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
                    highlightedIdx === searchOffsets.trfStart + index ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
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
                        {formatSearchDate(res.item.date || res.item.created_at)} • {formatCurrency(res.item.fromAmount || res.item.amount, res.item.fromCurrency || res.item.currency || 'USD')} → {formatCurrency(res.item.toAmount || res.item.amount, res.item.toCurrency || res.item.currency || 'USD')}
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
          <div className="mb-6" style={{ order: globalSearchSectionCssOrder('accounts') }}>
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
                    highlightedIdx === searchOffsets.accStart + index ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
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

        {rankedInvestments.length > 0 && (
          <div className="mb-6" style={{ order: globalSearchSectionCssOrder('investments') }}>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-violet-500 rounded-full"></span>
              Investments ({rankedInvestments.length})
            </h3>
            <div className="space-y-2">
              {(showAllInvestments ? rankedInvestments : rankedInvestments.slice(0, 3)).map((res: (typeof rankedInvestments)[number], index: number) => {
                const invIdx = searchOffsets.invStart + index;
                const matchKeys =
                  res.invKind === 'prize_bond'
                    ? ['bond_number']
                    : res.invKind === 'investment_asset'
                    ? ['name', 'symbol', 'asset_type', 'notes']
                    : res.invKind === 'investment_goal'
                      ? ['name', 'description', 'status', 'priority']
                      : res.invKind === 'investment_category'
                        ? ['name', 'description', 'icon']
                        : res.invKind === 'business_investment_contract'
                          ? ['title']
                        : [
                            'transaction_type',
                            'notes',
                            'currency',
                            'asset_symbol',
                            'asset_name',
                          ];
                const primary =
                  res.invKind === 'prize_bond'
                    ? res.item.bond_number
                    : res.invKind === 'investment_asset'
                    ? [res.item.symbol, res.item.name].filter(Boolean).join(' · ') || res.item.name
                    : res.invKind === 'investment_goal'
                      ? res.item.name || ''
                      : res.invKind === 'investment_category'
                        ? res.item.name || 'Category'
                        : res.invKind === 'business_investment_contract'
                          ? res.item.title || 'Contract'
                        : [res.item.asset_symbol, res.item.asset_name].filter(Boolean).join(' · ') ||
                          res.item.transaction_type ||
                          'Transaction';
                const sub =
                  res.invKind === 'prize_bond'
                    ? 'Prize bond · 100 BDT'
                    : res.invKind === 'investment_asset'
                    ? `${String(res.item.asset_type || '').replace(/_/g, ' ')} · ${formatCurrency(res.item.total_value, res.item.currency)}`
                    : res.invKind === 'investment_goal'
                      ? `${res.item.status || ''} · ${formatCurrency(res.item.current_amount, 'USD')} / ${formatCurrency(res.item.target_amount, 'USD')}`
                      : res.invKind === 'investment_category'
                        ? (res.item.description?.trim() || 'Investment category')
                        : res.invKind === 'business_investment_contract'
                          ? `${res.item.status || ''} · ${formatCurrency(res.item.principal || 0, res.item.currency || 'USD')}`
                        : `${String(res.item.transaction_type || '').replace(/_/g, ' ')} · ${formatCurrency(res.item.total_amount, res.item.currency)} · ${formatSearchDate(res.item.transaction_date || res.item.created_at)}`;
                return (
                  <button
                    key={`${res.invKind}-${res.item.id}-${index}`}
                    onClick={() => handleResultClick(res.invKind, res.item)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      highlightedIdx === invIdx ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-violet-100 dark:bg-violet-900/20 rounded-lg flex items-center justify-center">
                        {res.invKind === 'prize_bond'
                          ? <Ticket className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                          : <INVESTMENTS_FEATURE_ICON className="w-4 h-4 text-violet-600 dark:text-violet-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {highlight(primary, (res.matches?.filter((m: any) => matchKeys.includes(m.key)) ?? []) as any[])}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{sub}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
              {rankedInvestments.length > 3 && (
                <button
                  className="w-full text-center text-xs text-blue-600 dark:text-blue-400 mt-2"
                  onClick={() => setShowAllInvestments(v => !v)}
                >
                  {showAllInvestments ? 'Show less' : `Show more (${rankedInvestments.length - 3})`}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Lend & Borrow Section */}
        {rankedLendBorrow.length > 0 && (
          <div className="mb-6" style={{ order: globalSearchSectionCssOrder('lendBorrow') }}>
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
                    highlightedIdx === searchOffsets.lbStart + index ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-pink-100 dark:bg-pink-900/20 rounded-lg flex items-center justify-center">
                      <Handshake className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {highlight(res.item.person_name || '', (res.matches?.filter((m: any) => m.key === 'person_name') ?? []) as any[])}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {formatCurrency(res.item.amount, res.item.currency || 'USD')} • {formatSearchDate(res.item.created_at || res.item.updated_at)}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Clients Section */}
        {rankedClients.length > 0 && (
          <div className="mb-6" style={{ order: globalSearchSectionCssOrder('clients') }}>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
              Clients ({rankedClients.length})
            </h3>
            <div className="space-y-2">
              {(showAllClients ? rankedClients : rankedClients.slice(0, 3)).map((res, index) => {
                const clientOffset = searchOffsets.cliStart;
                return (
                  <button
                    key={`client-${index}`}
                    onClick={() => handleResultClick('client', res.item)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      highlightedIdx === clientOffset + index ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900/20 rounded-lg flex items-center justify-center">
                        <Users className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {highlight(res.item.name || '', (res.matches?.filter((m: any) => m.key === 'name') ?? []) as any[])}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {res.item.company_name || res.item.email || ''} • {res.item.source || 'No source'}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
              {rankedClients.length > 3 && (
                <button
                  className="w-full text-center text-xs text-blue-600 dark:text-blue-400 mt-2"
                  onClick={() => setShowAllClients(v => !v)}
                >
                  {showAllClients ? 'Show less' : `Show more (${rankedClients.length - 3})`}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tasks Section */}
        {rankedTasks.length > 0 && (
          <div className="mb-6" style={{ order: globalSearchSectionCssOrder('tasks') }}>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
              Tasks ({rankedTasks.length})
            </h3>
            <div className="space-y-2">
              {(showAllTasks ? rankedTasks : rankedTasks.slice(0, 3)).map((res, index) => {
                const taskOffset = searchOffsets.tasStart;
                const client = clients?.find(c => c.id === res.item.client_id);
                return (
                  <button
                    key={`task-${index}`}
                    onClick={() => handleResultClick('task', res.item)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      highlightedIdx === taskOffset + index ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center">
                        <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {highlight(res.item.title || '', (res.matches?.filter((m: any) => m.key === 'title') ?? []) as any[])}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {client?.name || 'Unknown Client'} • {res.item.status?.replace('_', ' ') || ''} • {res.item.priority || ''}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
              {rankedTasks.length > 3 && (
                <button
                  className="w-full text-center text-xs text-blue-600 dark:text-blue-400 mt-2"
                  onClick={() => setShowAllTasks(v => !v)}
                >
                  {showAllTasks ? 'Show less' : `Show more (${rankedTasks.length - 3})`}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Invoices Section */}
        {rankedInvoices.length > 0 && (
          <div className="mb-6" style={{ order: globalSearchSectionCssOrder('invoices') }}>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-cyan-500 rounded-full"></span>
              Invoices ({rankedInvoices.length})
            </h3>
            <div className="space-y-2">
              {(showAllInvoices ? rankedInvoices : rankedInvoices.slice(0, 3)).map((res, index) => {
                const invoiceOffset = searchOffsets.invdocStart;
                const client = clients?.find(c => c.id === res.item.client_id);
                return (
                  <button
                    key={`invoice-${index}`}
                    onClick={() => handleResultClick('invoice', res.item)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      highlightedIdx === invoiceOffset + index ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-cyan-100 dark:bg-cyan-900/20 rounded-lg flex items-center justify-center">
                        <FileText className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {highlight(res.item.invoice_number || '', (res.matches?.filter((m: any) => m.key === 'invoice_number') ?? []) as any[])}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {client?.name || 'Unknown Client'} • {formatCurrency(res.item.total || 0, res.item.currency || 'USD')} • {res.item.status || ''}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
              {rankedInvoices.length > 3 && (
                <button
                  className="w-full text-center text-xs text-blue-600 dark:text-blue-400 mt-2"
                  onClick={() => setShowAllInvoices(v => !v)}
                >
                  {showAllInvoices ? 'Show less' : `Show more (${rankedInvoices.length - 3})`}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Donations Section */}
        {rankedDonations.length > 0 && (
          <div className="mb-6" style={{ order: globalSearchSectionCssOrder('donations') }}>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              Donations ({rankedDonations.length})
            </h3>
            <div className="space-y-2">
              {rankedDonations.slice(0, 3).map((res, index) => {
                const donationOffset = searchOffsets.donStart;
                return (
                  <button
                    key={`donation-${index}`}
                    onClick={() => handleResultClick('donation', res.item)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      highlightedIdx === donationOffset + index ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
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
                        {(() => {
                          // For donations, we need to find the currency from the linked transaction
                          let currency = 'USD';
                          if (res.item.transaction_id) {
                            const transaction = transactions.find(t => t.id === res.item.transaction_id);
                            if (transaction) {
                              const account = accounts.find(a => a.id === transaction.account_id);
                              currency = account?.currency || 'USD';
                            }
                          } else if (res.item.note) {
                            // For manual donations, extract currency from note
                            const currencyMatch = res.item.note.match(/Currency:\s*([A-Z]{3})/);
                            currency = currencyMatch ? currencyMatch[1] : 'USD';
                          }
                          return formatCurrency(res.item.amount, currency);
                        })()} • {formatSearchDate(res.item.created_at || res.item.updated_at)}
                        {res.item.note && typeof res.item.note === 'string' && res.item.note.trim() && (() => {
                          // Remove currency information from note for cleaner display
                          const cleanNote = res.item.note.replace(/\(?Currency:\s*[A-Z]{3}\)?/g, '').trim();
                          return cleanNote ? ` • ${cleanNote.substring(0, 30)}${cleanNote.length > 30 ? '...' : ''}` : '';
                        })()}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Habits Section */}
        {rankedHabits.length > 0 && (
          <div className="mb-6" style={{ order: globalSearchSectionCssOrder('habits') }}>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Habits ({rankedHabits.length})
            </h3>
            <div className="space-y-2">
              {(showAllHabits ? rankedHabits : rankedHabits.slice(0, 3)).map((res, index) => {
                const habitOffset = searchOffsets.habStart;
                return (
                  <button
                    key={`habit-${index}`}
                    onClick={() => handleResultClick('habit', res.item)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      highlightedIdx === habitOffset + index ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                        <Sprout className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {highlight(res.item.title || '', (res.matches?.filter((m: any) => m.key === 'title') ?? []) as any[])}
                        </div>
                        {res.item.description && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {highlight(res.item.description, (res.matches?.filter((m: any) => m.key === 'description') ?? []) as any[])}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
              {rankedHabits.length > 3 && (
                <button
                  className="w-full text-center text-xs text-blue-600 dark:text-blue-400 mt-2"
                  onClick={() => setShowAllHabits(v => !v)}
                >
                  {showAllHabits ? 'Show less' : `Show more (${rankedHabits.length - 3})`}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Courses Section */}
        {rankedCourses.length > 0 && (
          <div className="mb-6" style={{ order: globalSearchSectionCssOrder('courses') }}>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Courses ({rankedCourses.length})
            </h3>
            <div className="space-y-2">
              {(showAllCourses ? rankedCourses : rankedCourses.slice(0, 3)).map((res, index) => {
                const courseOffset = searchOffsets.couStart;
                return (
                  <button
                    key={`course-${index}`}
                    onClick={() => handleResultClick('course', res.item)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      highlightedIdx === courseOffset + index ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {highlight(res.item.name || '', (res.matches?.filter((m: any) => m.key === 'name') ?? []) as any[])}
                        </div>
                        {res.item.description && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {highlight(res.item.description, (res.matches?.filter((m: any) => m.key === 'description') ?? []) as any[])}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
              {rankedCourses.length > 3 && (
                <button
                  className="w-full text-center text-xs text-blue-600 dark:text-blue-400 mt-2"
                  onClick={() => setShowAllCourses(v => !v)}
                >
                  {showAllCourses ? 'Show less' : `Show more (${rankedCourses.length - 3})`}
                </button>
              )}
            </div>
          </div>
        )}

        {/* No Results */}
        {search && rankedTransactions.length === 0 && rankedPurchases.length === 0 && rankedTransfers.length === 0 && rankedAccounts.length === 0 && rankedInvestments.length === 0 && rankedLendBorrow.length === 0 && rankedDonations.length === 0 && rankedClients.length === 0 && rankedTasks.length === 0 && rankedInvoices.length === 0 && rankedHabits.length === 0 && rankedCourses.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-400 dark:text-gray-500 mb-2">
              <Search className="w-8 h-8 mx-auto" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">No results found for "{search}"</p>
            {/^\d{7}$/.test(parseGlobalSearchQuery(search).query) && (
              <button
                type="button"
                className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                onClick={() => {
                  const n = parseGlobalSearchQuery(search).query;
                  setGlobalSearchTerm('');
                  onClose();
                  navigate(`/investments?tab=${INVESTMENTS_BONDS_TAB}&add=bond&search=${encodeURIComponent(n)}`);
                }}
              >
                Add prize bond {parseGlobalSearchQuery(search).query}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

