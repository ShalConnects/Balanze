import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, Building2, Mail, Phone, MapPin, Tag, X, Filter, Eye, ShoppingCart, ChevronUp, ChevronDown, Info, ChevronRight, Copy, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useClientStore } from '../../store/useClientStore';
import { Client } from '../../types/client';
import { ClientForm } from './ClientForm';
import { TaskForm } from '../Tasks/TaskForm';
import { InvoiceForm } from '../Invoices/InvoiceForm';
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { useRecordSelection } from '../../hooks/useRecordSelection';
import { SelectionFilter } from '../common/SelectionFilter';
import { usePlanFeatures } from '../../hooks/usePlanFeatures';
import { toast } from 'sonner';
import { 
  ClientCardSkeleton, 
  ClientTableSkeleton, 
  ClientSummaryCardsSkeleton, 
  ClientFiltersSkeleton 
} from './ClientSkeleton';
import { ClientTasksWidget } from '../Dashboard/ClientTasksWidget';
import { ClientNoteModal } from './ClientNoteModal';
import { ClientEmailSuggestions } from './ClientEmailSuggestions';
import { getCurrencySymbol } from '../../utils/currency';
import { Tooltip } from '../common/Tooltip';
import { 
  getInvoiceStatusColor, 
  getPaymentStatusColor, 
  getTaskPriorityColor, 
  getTaskStatusColor,
  formatKnownSinceDate
} from '../../utils/clientUtils';
import { isTaskOverdue, getDaysOverdue } from '../../utils/taskDateUtils';

// Tag Management Component
interface ClientTagManagerProps {
  client: Client;
  onTagAdded: () => void;
  onTagRemoved: () => void;
}

const ClientTagManager: React.FC<ClientTagManagerProps> = React.memo(({ client, onTagAdded, onTagRemoved }) => {
  const { updateClient } = useClientStore();
  const [tagInput, setTagInput] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const tagSuggestionsRef = useRef<HTMLDivElement>(null);
  
  const commonTags = [
    'Fiverr', 'Upwork', 'Freelancer', 'Premium', 'Long-term',
    'One-time', 'Referral', 'Website', 'Social Media', 'Repeat Client', 'VIP', 'Corporate'
  ];
  
  const getFilteredSuggestions = () => {
    return commonTags.filter(tag => 
      !client.tags?.includes(tag) &&
      tag.toLowerCase().includes(tagInput.toLowerCase())
    );
  };
  
  const handleAddTag = async (tag?: string) => {
    const tagToAdd = tag || tagInput.trim();
    if (tagToAdd && !client.tags?.includes(tagToAdd)) {
      const updatedTags = [...(client.tags || []), tagToAdd];
      try {
        await updateClient(client.id, { tags: updatedTags });
        setTagInput('');
        setShowTagSuggestions(false);
        toast.success('Tag added successfully');
        onTagAdded();
      } catch (error) {
        toast.error('Failed to add tag');
      }
    }
  };
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tagSuggestionsRef.current && !tagSuggestionsRef.current.contains(event.target as Node)) {
        setShowTagSuggestions(false);
      }
    }
    if (showTagSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showTagSuggestions]);
  
  return (
    <div className="relative" ref={tagSuggestionsRef}>
      <div className="flex gap-1">
        <input
          type="text"
          ref={tagInputRef}
          value={tagInput}
          onChange={(e) => {
            setTagInput(e.target.value);
            setShowTagSuggestions(true);
          }}
          onFocus={() => setShowTagSuggestions(true)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddTag();
            }
          }}
          className="flex-1 px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Add tag..."
        />
        <button
          type="button"
          onClick={() => handleAddTag()}
          className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!tagInput.trim()}
        >
          Add
        </button>
      </div>
      
      {/* Tag Suggestions */}
      {showTagSuggestions && getFilteredSuggestions().length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-32 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 px-1">Suggestions:</div>
            <div className="flex flex-wrap gap-1">
              {getFilteredSuggestions().map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleAddTag(tag)}
                  className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

ClientTagManager.displayName = 'ClientTagManager';

export const ClientList: React.FC = () => {
  const navigate = useNavigate();
  const {
    clients,
    orders,
    invoices,
    tasks,
    loading,
    error,
    fetchClients,
    fetchOrders,
    fetchInvoices,
    fetchTasks,
    getOrdersByClient,
    getInvoicesByClient,
    getTasksByClient,
    updateTask,
    updateInvoice,
    updateClient,
    deleteClient
  } = useClientStore();

  const { isMobile } = useMobileDetection();
  const { canCreateClient, usageStats, isAtLimit, isPremiumPlan, loadUsageStats } = usePlanFeatures();
  
  // Record selection functionality
  const {
    selectedRecord,
    selectedId,
    isFromSearch,
    selectedRecordRef,
    clearSelection,
    hasSelection
  } = useRecordSelection({
    records: clients,
    recordIdField: 'id',
    scrollToRecord: true
  });

  // Unified table filters state - matching AccountsView pattern
  const [tableFilters, setTableFilters] = useState(() => {
    const saved = localStorage.getItem('clientFilters');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          search: parsed.search || '',
          status: parsed.status || 'active',
          currency: parsed.currency || '',
          source: parsed.source || '',
          tag: parsed.tag || ''
        };
      } catch {
        // If parsing fails, use defaults
      }
    }
    return {
      search: '',
      status: 'active', // 'all', 'active', 'inactive', 'archived'
      currency: '',
      source: '',
      tag: ''
    };
  });

  // Save filters to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('clientFilters', JSON.stringify(tableFilters));
  }, [tableFilters]);

  // Enhanced search state
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  // Debounced search value for filtering
  const [debouncedSearch, setDebouncedSearch] = useState(tableFilters.search);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Debounce search input (300ms delay)
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(tableFilters.search);
    }, 300);
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [tableFilters.search]);

  // Menu states
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [showMobileFilterMenu, setShowMobileFilterMenu] = useState(false);

  // Temporary filter state for mobile modal
  const [tempFilters, setTempFilters] = useState(tableFilters);

  // Refs for dropdown menus
  const statusMenuRef = useRef<HTMLDivElement>(null);
  const currencyMenuRef = useRef<HTMLDivElement>(null);
  const tagMenuRef = useRef<HTMLDivElement>(null);
  const mobileFilterMenuRef = useRef<HTMLDivElement>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskClientId, setTaskClientId] = useState<string | null>(null);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invoiceClientId, setInvoiceClientId] = useState<string | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [taskStatusMenuOpen, setTaskStatusMenuOpen] = useState<string | null>(null);
  const [invoiceStatusMenuOpen, setInvoiceStatusMenuOpen] = useState<string | null>(null);
  const [noteModalClient, setNoteModalClient] = useState<Client | null>(null);
  const isSavingNoteRef = useRef(false);

  // Tag editing state for inline tag addition in table
  const [addingTagClientId, setAddingTagClientId] = useState<string | null>(null);
  const [tagInputValue, setTagInputValue] = useState<string>('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const inlineTagSuggestionsRef = useRef<HTMLDivElement>(null);

  // Sorting state
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  // Row expansion state
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  // Track which clients have loaded their tasks/invoices (for lazy loading)
  const [loadedClientData, setLoadedClientData] = useState<Set<string>>(new Set());
  
  // Loading states for individual clients
  const [loadingClientData, setLoadingClientData] = useState<Set<string>>(new Set());

  // Update tempFilters when mobile menu opens
  useEffect(() => {
    if (showMobileFilterMenu) {
      setTempFilters(tableFilters);
    }
  }, [showMobileFilterMenu, tableFilters]);

  // Handle click outside for inline tag suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (inlineTagSuggestionsRef.current && !inlineTagSuggestionsRef.current.contains(event.target as Node)) {
        setShowTagSuggestions(false);
      }
    }
    if (showTagSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showTagSuggestions]);

  // Initial load - only fetch clients (orders are optional and loaded on demand)
  useEffect(() => {
    let isMounted = true;
    let hasFetched = false;
    
    const loadData = async () => {
      if (hasFetched || !isMounted) return;
      hasFetched = true;
      
      try {
        // Fetch clients first (required)
        await fetchClients();
        // Don't fetch orders here - they're not needed for the client list
        // Orders will be fetched on demand when needed (e.g., in OrderList component)
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array - only run once on mount
  
  // Lazy load tasks and invoices when a client row is expanded
  // Only fetch once when the first client is expanded (fetchTasks/fetchInvoices get all data)
  useEffect(() => {
    const hasExpandedRows = expandedRows.size > 0;
    const hasLoadedData = loadedClientData.size > 0;
    const isLoading = loadingClientData.size > 0;
    
    // Only fetch if we have expanded rows and haven't loaded data yet
    if (!hasExpandedRows || hasLoadedData || isLoading) return;
    
    const loadClientData = async () => {
      // Mark as loading
      setLoadingClientData(new Set(expandedRows));
      
      try {
        // Fetch all tasks and invoices once (they're cached in the store)
        // This is more efficient than fetching per-client since we need all data anyway
        await Promise.all([
          fetchTasks(),
          fetchInvoices()
        ]);
        
        // Mark all expanded rows as loaded
        setLoadedClientData(new Set(expandedRows));
      } catch (error) {
        console.error('Error loading client data:', error);
      } finally {
        // Remove from loading state
        setLoadingClientData(new Set());
      }
    };
    
    loadClientData();
  }, [expandedRows.size, loadedClientData.size, loadingClientData.size, fetchTasks, fetchInvoices]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
        setShowStatusMenu(false);
      }
      if (currencyMenuRef.current && !currencyMenuRef.current.contains(event.target as Node)) {
        setShowCurrencyMenu(false);
      }
      if (tagMenuRef.current && !tagMenuRef.current.contains(event.target as Node)) {
        setShowTagMenu(false);
      }
      if (mobileFilterMenuRef.current && !mobileFilterMenuRef.current.contains(event.target as Node)) {
        setShowMobileFilterMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [taskStatusMenuOpen, invoiceStatusMenuOpen]);

  // Get unique currencies from clients
  const currencyOptions = useMemo(() => {
    const currencies = new Set(clients.map(c => c.default_currency).filter(Boolean));
    return Array.from(currencies).sort();
  }, [clients]);

  // Get unique tags from clients
  const tagOptions = useMemo(() => {
    const allTags = new Set<string>();
    clients.forEach(client => {
      client.tags?.forEach(tag => allTags.add(tag));
    });
    return Array.from(allTags).sort();
  }, [clients]);

  // Filter clients based on tableFilters (using debounced search)
  const filteredClients = useMemo(() => {
    let filtered = clients.filter((client) => {
      const matchesSearch = !debouncedSearch || 
        client.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        client.email?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        client.phone?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        client.company_name?.toLowerCase().includes(debouncedSearch.toLowerCase());

      const matchesStatus = tableFilters.status === 'all' || client.status === tableFilters.status;
      const matchesCurrency = !tableFilters.currency || client.default_currency === tableFilters.currency;
      const matchesTag = !tableFilters.tag || client.tags?.includes(tableFilters.tag);

      return matchesSearch && matchesStatus && matchesCurrency && matchesTag;
    });

    // Apply sorting
    if (sortConfig) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: any = a[sortConfig.key as keyof Client];
        let bValue: any = b[sortConfig.key as keyof Client];
        
        if (sortConfig.key === 'name' || sortConfig.key === 'email' || sortConfig.key === 'company_name') {
          aValue = (aValue || '').toLowerCase();
          bValue = (bValue || '').toLowerCase();
        }
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [clients, debouncedSearch, tableFilters.status, tableFilters.currency, tableFilters.tag, sortConfig]);

  // Check if there are active tasks (same logic as ClientTasksWidget)
  const hasActiveTasks = useMemo(() => {
    const allActiveTasks = tasks.filter(task => task.status !== 'completed' && task.status !== 'cancelled');
    return allActiveTasks.length > 0;
  }, [tasks]);

  // Memoized client financial calculations
  const clientFinancialData = useMemo(() => {
    const dataMap = new Map<string, {
      orders: ReturnType<typeof getOrdersByClient>;
      invoices: ReturnType<typeof getInvoicesByClient>;
      totalOrderValue: number;
      totalInvoiceValue: number;
      currency: string;
      currencySymbol: string;
    }>();

    filteredClients.forEach(client => {
      const clientOrders = getOrdersByClient(client.id);
      const clientInvoices = getInvoicesByClient(client.id);
      const totalOrderValue = clientOrders.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);
      const totalInvoiceValue = clientInvoices.reduce((sum, invoice) => sum + (Number(invoice.total_amount) || 0), 0);
      const currency = client.default_currency || 'USD';
      const currencySymbol = getCurrencySymbol(currency);

      dataMap.set(client.id, {
        orders: clientOrders,
        invoices: clientInvoices,
        totalOrderValue,
        totalInvoiceValue,
        currency,
        currencySymbol
      });
    });

    return dataMap;
  }, [filteredClients, getOrdersByClient, getInvoicesByClient]);

  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        return prev.direction === 'asc' 
          ? { key, direction: 'desc' }
          : null;
      }
      return { key, direction: 'asc' };
    });
  };

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ChevronUp className="w-4 h-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-blue-600" />
      : <ChevronDown className="w-4 h-4 text-blue-600" />;
  };

  // Row expansion handlers
  const toggleRowExpansion = (clientId: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(clientId)) {
      newExpandedRows.delete(clientId);
    } else {
      newExpandedRows.add(clientId);
    }
    setExpandedRows(newExpandedRows);
  };

  const isRowExpanded = (clientId: string) => expandedRows.has(clientId);

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (deletingClient) {
      await deleteClient(deletingClient.id);
      setDeletingClient(null);
    }
  };

  const handleRemoveTag = async (clientId: string, tagToRemove: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    
    const updatedTags = (client.tags || []).filter(tag => tag !== tagToRemove);
    try {
      await updateClient(clientId, { tags: updatedTags });
      toast.success('Tag removed successfully');
    } catch (error) {
      toast.error('Failed to remove tag');
    }
  };

  const commonTags = [
    'Fiverr', 'Upwork', 'Freelancer', 'Premium', 'Long-term',
    'One-time', 'Referral', 'Website', 'Social Media', 'Repeat Client', 'VIP', 'Corporate'
  ];

  const getFilteredTagSuggestions = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return { existing: [], new: [] };
    
    const inputLower = tagInputValue.toLowerCase();
    const existingTags = (client.tags || []).filter(tag => 
      tag.toLowerCase().includes(inputLower)
    );
    const newTags = commonTags.filter(tag => 
      !client.tags?.includes(tag) &&
      tag.toLowerCase().includes(inputLower)
    );
    
    return { existing: existingTags, new: newTags };
  };

  const handleAddTagInline = async (clientId: string, tag?: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    
    const tagToAdd = tag || tagInputValue.trim();
    if (!tagToAdd) return;
    
    if (client.tags?.includes(tagToAdd)) {
      toast.error('Tag already exists');
      return;
    }
    
    const updatedTags = [...(client.tags || []), tagToAdd];
    try {
      await updateClient(clientId, { tags: updatedTags });
      setTagInputValue('');
      setAddingTagClientId(null);
      setShowTagSuggestions(false);
      toast.success('Tag added successfully');
    } catch (error) {
      toast.error('Failed to add tag');
    }
  };

  const handleCopyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${type} copied to clipboard`);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleNoteSave = async (note: string) => {
    isSavingNoteRef.current = true;
    try {
      if (noteModalClient) {
        await updateClient(noteModalClient.id, { notes: note });
        // Don't update noteModalClient state here - let the modal close
        // The store's optimistic update will handle the UI update automatically
      }
    } catch (error) {
      throw error; // Re-throw so modal can handle it
    } finally {
      // Small delay to prevent modal from reopening during re-render
      setTimeout(() => {
        isSavingNoteRef.current = false;
      }, 100);
    }
  };

  const handleCloseForm = async () => {
    setShowForm(false);
    setEditingClient(null);
    fetchClients(); // Refresh list after form closes
    await loadUsageStats(); // Refresh usage stats to update limit display
  };

  const getStatusBadge = (status: Client['status']) => {
    const styles = {
      active: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
      inactive: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
      archived: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Show skeleton only briefly for initial load (max 2 seconds)
  // After that, always show content (even if loading) to prevent infinite skeleton for new users
  const [showSkeleton, setShowSkeleton] = useState(true);
  
  useEffect(() => {
    // Hide skeleton when loading completes
    if (!loading) {
      setShowSkeleton(false);
      return;
    }
    
    // Also hide skeleton after 2 seconds even if still loading (graceful degradation)
    const timeout = setTimeout(() => {
      setShowSkeleton(false);
    }, 2000);
    
    return () => clearTimeout(timeout);
  }, [loading]);
  
  // Show skeleton only briefly on initial load
  // For new users with no data, show empty state after 2 seconds max
  if (loading && !error && showSkeleton) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Enhanced skeleton for clients page - matching AccountsView */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 pb-[13px] lg:pb-0 relative overflow-hidden">
          {/* Shimmer effect for the entire container */}
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
          
          {/* Filters skeleton */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 relative z-10">
            <ClientFiltersSkeleton />
          </div>
          
          {/* Summary cards skeleton */}
          <div className="p-4 relative z-10">
            <ClientSummaryCardsSkeleton />
          </div>
          
          {/* Responsive skeleton - Desktop table, Mobile cards */}
          <div className="hidden md:block p-4 relative z-10">
            <ClientTableSkeleton rows={6} />
          </div>
          <div className="md:hidden relative z-10">
            <ClientCardSkeleton count={4} />
          </div>
        </div>
      </div>
    );
  }
  
  // Show error banner but still render the page
  if (error) {
    // Error will be shown in the page, but we continue to render
  }

  return (
    <>
      <div className="w-full">
        {/* Unified Table View - matching AccountsView structure */}
        <div className="space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6">
          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span className="text-red-600 dark:text-red-400 font-medium text-xs sm:text-sm">⚠️ Error loading clients:</span>
                <span className="text-red-700 dark:text-red-300 text-xs sm:text-sm">{error}</span>
              </div>
              <p className="text-red-600 dark:text-red-400 text-xs sm:text-sm mt-2">
                The page will still work, but client data may be incomplete. Please check your database connection or run the migration.
              </p>
            </div>
          )}
          
          {/* Client Tasks Widget - Outside table */}
          <ClientTasksWidget />
          
          {/* Unified Filters and Table */}
          <div className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 pb-2 sm:pb-3 lg:pb-0" style={hasActiveTasks ? { marginTop: '15px' } : undefined}>
            {/* Filters Section */}
            <div className="p-2 sm:p-3 md:p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap items-center gap-x-1.5 sm:gap-x-2 gap-y-1.5 sm:gap-y-2" style={{ marginBottom: 0 }}>
                {/* Search */}
                <div className="flex-1 min-w-[150px] sm:min-w-[200px] md:min-w-[250px]">
                  <div className="relative">
                    <Search className={`absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 ${isSearching ? 'animate-pulse text-blue-500' : tableFilters.search ? 'text-blue-500' : 'text-gray-400'}`} />
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
                      placeholder="Search clients..."
                    />
                  </div>
                </div>

                {/* Selection Filter */}
                {hasSelection && selectedRecord && (
                  <SelectionFilter
                    label="Selected"
                    value={selectedRecord.name || 'Client'}
                    onClear={clearSelection}
                  />
                )}

                {/* Mobile Filter Button */}
                <div className="md:hidden">
                  <div className="relative" ref={mobileFilterMenuRef}>
                    <button
                      onClick={() => setShowMobileFilterMenu(v => !v)}
                      className={`px-2 py-1.5 text-[13px] h-8 w-8 rounded-md transition-colors flex items-center justify-center ${
                        (tableFilters.currency || tableFilters.status !== 'active' || tableFilters.source || tableFilters.tag)
                          ? 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                      style={(tableFilters.currency || tableFilters.status !== 'active' || tableFilters.source || tableFilters.tag) ? { background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' } : {}}
                      title="Filters"
                    >
                      <Filter className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Mobile Add Client Button */}
                <div className="md:hidden">
                  <button
                    onClick={() => {
                      if (!canCreateClient()) {
                        const currentCount = clients.length;
                        const limit = usageStats?.clients?.limit ?? 5;
                        toast.error(`Client limit exceeded! You have ${currentCount}/${limit} clients. Upgrade to Premium for unlimited clients.`);
                        setTimeout(() => {
                          window.location.href = '/settings?tab=plans-usage';
                        }, 2000);
                        return;
                      }
                      setEditingClient(null);
                      setShowForm(true);
                    }}
                    disabled={!canCreateClient()}
                    className={`px-2 py-1.5 rounded-md transition-colors flex items-center justify-center text-[13px] h-8 w-8 ${
                      canCreateClient()
                        ? 'bg-gradient-primary text-white hover:bg-gradient-primary-hover'
                        : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    }`}
                    title={canCreateClient() ? "Add Client" : "Client limit reached"}
                    aria-label="Add Client"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                 {/* Mobile Clear Filters Button */}
                 <div className="md:hidden">
                   {(tableFilters.search || tableFilters.currency || tableFilters.status !== 'active' || tableFilters.source || tableFilters.tag) && (
                     <button
                       onClick={() => setTableFilters({ search: '', currency: '', status: 'active', source: '', tag: '' })}
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
                  {/* Currency Filter */}
                  {currencyOptions.length > 0 && (
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
                  )}

                  {/* Status Filter */}
                  <div className="relative" ref={statusMenuRef}>
                    <button
                      onClick={() => setShowStatusMenu(v => !v)}
                      className={`px-3 py-1.5 pr-2 text-[13px] h-8 rounded-md transition-colors flex items-center space-x-1.5 ${
                        tableFilters.status === 'active' || tableFilters.status === 'inactive' || tableFilters.status === 'archived' || tableFilters.status === 'all'
                          ? 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                      style={(tableFilters.status === 'active' || tableFilters.status === 'inactive' || tableFilters.status === 'archived' || tableFilters.status === 'all') ? { background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' } : {}}
                    >
                      <span>{tableFilters.status === 'active' ? 'Active' : tableFilters.status === 'all' ? 'All Status' : tableFilters.status.charAt(0).toUpperCase() + tableFilters.status.slice(1)}</span>
                      <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showStatusMenu && (
                      <div className="absolute left-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                        <button
                          onClick={() => { setTableFilters({ ...tableFilters, status: 'all' }); setShowStatusMenu(false); }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${tableFilters.status === 'all' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' : ''}`}
                        >
                          All Status
                        </button>
                        <button
                          onClick={() => { setTableFilters({ ...tableFilters, status: 'active' }); setShowStatusMenu(false); }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${tableFilters.status === 'active' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' : ''}`}
                        >
                          Active
                        </button>
                        <button
                          onClick={() => { setTableFilters({ ...tableFilters, status: 'inactive' }); setShowStatusMenu(false); }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${tableFilters.status === 'inactive' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' : ''}`}
                        >
                          Inactive
                        </button>
                        <button
                          onClick={() => { setTableFilters({ ...tableFilters, status: 'archived' }); setShowStatusMenu(false); }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${tableFilters.status === 'archived' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' : ''}`}
                        >
                          Archived
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Tag Filter */}
                  {tagOptions.length > 0 && (
                    <div className="relative" ref={tagMenuRef}>
                      <button
                        onClick={() => setShowTagMenu(v => !v)}
                        className={`px-3 py-1.5 pr-2 text-[13px] h-8 rounded-md transition-colors flex items-center space-x-1.5 ${
                          tableFilters.tag 
                            ? 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                        style={tableFilters.tag ? { background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' } : {}}
                      >
                        <span>{tableFilters.tag === '' ? 'All Tags' : tableFilters.tag}</span>
                        <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {showTagMenu && (
                        <div className="absolute left-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                          <button
                            onClick={() => { setTableFilters({ ...tableFilters, tag: '' }); setShowTagMenu(false); }}
                            className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${tableFilters.tag === '' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' : ''}`}
                          >
                            All Tags
                          </button>
                          {tagOptions.map(tag => (
                            <button
                              key={tag}
                              onClick={() => { setTableFilters({ ...tableFilters, tag }); setShowTagMenu(false); }}
                              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${tableFilters.tag === tag ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' : ''}`}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Clear Filters */}
                  {(tableFilters.search || tableFilters.currency || tableFilters.status !== 'active' || tableFilters.tag) && (
                    <button
                      onClick={() => setTableFilters({ search: '', currency: '', status: 'active', source: '', tag: '' })}
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
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    onClick={() => {
                      if (!canCreateClient()) {
                        const currentCount = clients.length;
                        const limit = usageStats?.clients?.limit ?? 5;
                        toast.error(`Client limit exceeded! You have ${currentCount}/${limit} clients. Upgrade to Premium for unlimited clients.`);
                        setTimeout(() => {
                          window.location.href = '/settings?tab=plans-usage';
                        }, 2000);
                        return;
                      }
                      setEditingClient(null);
                      setShowForm(true);
                    }}
                    disabled={!canCreateClient()}
                    className={`px-2 sm:px-3 py-1.5 h-8 rounded-md transition-colors flex items-center space-x-1 sm:space-x-1.5 text-xs sm:text-[13px] ${
                      canCreateClient()
                        ? 'bg-gradient-primary text-white hover:bg-gradient-primary-hover'
                        : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Add Client</span>
                    <span className="sm:hidden">Add</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Summary Cards - matching AccountsView pattern */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 lg:gap-4 p-2 sm:p-3 lg:p-4">
              {(() => {
                const activeClients = filteredClients.filter(c => c.status === 'active');
                const inactiveClients = filteredClients.filter(c => c.status === 'inactive');
                const allInactiveClients = clients.filter(c => c.status === 'inactive');
                const archivedClients = filteredClients.filter(c => c.status === 'archived');
                const totalInvoices = filteredClients.reduce((sum, client) => {
                  return sum + getInvoicesByClient(client.id).length;
                }, 0);
                
                return (
                  <>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 sm:py-2 px-1.5 sm:px-2">
                      <div className="flex items-center justify-between">
                        <div className="text-left min-w-0 flex-1">
                          <p className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 truncate">{tableFilters.status === 'active' ? 'Active Clients' : tableFilters.status === 'all' ? 'All Clients' : tableFilters.status.charAt(0).toUpperCase() + tableFilters.status.slice(1) + ' Clients'}</p>
                          <p className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-lg sm:text-xl lg:text-[1.2rem]">
                            {tableFilters.status === 'active' ? activeClients.length : tableFilters.status === 'all' ? filteredClients.length : filteredClients.filter(c => c.status === tableFilters.status).length}
                          </p>
                          <p className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-[11px] truncate">
                            {(() => {
                              if (tableFilters.status === 'all') {
                                const activeCount = activeClients.length;
                                const inactiveCount = inactiveClients.length;
                                const archivedCount = archivedClients.length;
                                const parts = [];
                                if (activeCount > 0) parts.push(`${activeCount} active`);
                                if (inactiveCount > 0) parts.push(`${inactiveCount} inactive`);
                                if (archivedCount > 0) parts.push(`${archivedCount} archived`);
                                return parts.join(', ') || 'No clients';
                              } else if (tableFilters.status === 'active') {
                                return `${activeClients.length} active clients`;
                              } else {
                                const statusClients = filteredClients.filter(c => c.status === tableFilters.status);
                                return `${statusClients.length} ${tableFilters.status} client${statusClients.length !== 1 ? 's' : ''}`;
                              }
                            })()}
                          </p>
                        </div>
                        <Building2 className="text-blue-600 w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 sm:py-2 px-1.5 sm:px-2">
                      <div className="flex items-center justify-between">
                        <div className="text-left min-w-0 flex-1">
                          <p className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 truncate">Total Invoices</p>
                          <p className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-lg sm:text-xl lg:text-[1.2rem]">{totalInvoices}</p>
                          <p className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-[11px] truncate">
                            {totalInvoices > 0 ? `${totalInvoices} invoices` : 'No invoices'}
                          </p>
                        </div>
                        <span className="text-blue-600 text-lg sm:text-xl lg:text-[1.2rem] flex-shrink-0">📄</span>
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 sm:py-2 px-1.5 sm:px-2">
                      <div className="flex items-center justify-between">
                        <div className="text-left min-w-0 flex-1">
                          <p className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 truncate">Currencies</p>
                          <p className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-lg sm:text-xl lg:text-[1.2rem]">
                            {(() => {
                              const currencies = [...new Set(filteredClients.map(client => client.default_currency).filter(Boolean))];
                              return currencies.length;
                            })()}
                          </p>
                          <p className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-[11px] truncate">
                            {(() => {
                              const currencies = [...new Set(filteredClients.map(client => client.default_currency).filter(Boolean))];
                              return currencies.length > 1 ? currencies.join(', ') : currencies[0] || 'No currencies';
                            })()}
                          </p>
                        </div>
                        <svg className="text-blue-600 w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" /></svg>
                      </div>
                    </div>
                    <div 
                      className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 sm:py-2 px-1.5 sm:px-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => {
                        setTableFilters({
                          search: '',
                          status: 'inactive',
                          currency: '',
                          source: '',
                          tag: ''
                        });
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-left min-w-0 flex-1">
                          <p className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 truncate">Inactive</p>
                          <p className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-lg sm:text-xl lg:text-[1.2rem]">
                            {allInactiveClients.length}
                          </p>
                          <p className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-[11px] truncate">
                            {allInactiveClients.length > 0 ? `${allInactiveClients.length} inactive` : 'No inactive clients'}
                          </p>
                        </div>
                        <span className="text-yellow-600 text-lg sm:text-xl lg:text-[1.2rem] flex-shrink-0">⚠</span>
                      </div>
                    </div>
                    {!isPremiumPlan && (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 sm:py-2 px-1.5 sm:px-2">
                        <div className="flex items-center justify-between">
                          <div className="text-left min-w-0 flex-1">
                            <p className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 truncate">Client Limit</p>
                            <p className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-lg sm:text-xl lg:text-[1.2rem]">
                              {(() => {
                                if (isPremiumPlan) return '∞';
                                if (usageStats && usageStats.clients) {
                                  const current = usageStats.clients.current || 0;
                                  let limit = usageStats.clients.limit;
                                  // If limit is -1 (unlimited) or invalid, default to 5 for free users
                                  if (!limit || limit === -1 || limit < 0) {
                                    limit = 5;
                                  }
                                  return `${current}/${limit}`;
                                }
                                // Fallback for free users
                                return `${clients.length}/5`;
                              })()}
                            </p>
                            <p className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-[11px] truncate">
                              {isPremiumPlan ? 'Unlimited clients' : 'Free plan limit'}
                            </p>
                          </div>
                          <svg className="text-blue-600 w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2l4 -4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
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
              <div className="hidden lg:block max-h-[400px] xl:max-h-[500px] overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900 text-sm lg:text-[14px]">
                  <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                    <tr>
                      <th 
                        className="px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center space-x-0.5 sm:space-x-1">
                          <span>Client Name</span>
                          {getSortIcon('name')}
                        </div>
                      </th>
                      <th className="px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Tags</th>
                      <th className="px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                      <th className="px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 text-center text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                      <th 
                        className="px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 text-center text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => handleSort('default_currency')}
                      >
                        <div className="flex items-center justify-center space-x-0.5 sm:space-x-1">
                          <span>Currency</span>
                          {getSortIcon('default_currency')}
                        </div>
                      </th>
                      <th 
                        className="px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 text-center text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center justify-center space-x-0.5 sm:space-x-1">
                          <span>Status</span>
                          {getSortIcon('status')}
                        </div>
                      </th>
                      <th className="px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 text-center text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredClients.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-16 text-center">
                          <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                            <Building2 className="w-12 h-12 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No client records found</h3>
                          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                            {tableFilters.search || tableFilters.currency || tableFilters.status !== 'active' || tableFilters.source || tableFilters.tag
                              ? 'No clients match your filters'
                              : 'Start managing your clients by adding your first client'}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredClients.map((client) => {
                        const isSelected = selectedId === client.id;
                        const isFromSearchSelection = isFromSearch && isSelected;
                        const financialData = clientFinancialData.get(client.id);
                        
                        return (
                          <React.Fragment key={client.id}>
                          <tr
                            id={`client-${client.id}`}
                            ref={isSelected ? selectedRecordRef : null}
                            className={`hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${
                              isSelected 
                                ? isFromSearchSelection 
                                  ? 'ring-2 ring-blue-500 ring-opacity-50 bg-blue-50 dark:bg-blue-900/20' 
                                  : 'ring-2 ring-blue-500 ring-opacity-50'
                                : ''
                            }`}
                            onClick={() => toggleRowExpansion(client.id)}
                          >
                            <td className="px-3 sm:px-4 lg:px-6 py-2 sm:py-[0.6rem] lg:py-[0.7rem]">
                              <div className="flex items-center">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                                      {client.name}
                                    </div>
                                    {(() => {
                                      const clientTasks = getTasksByClient(client.id);
                                      const activeTasks = clientTasks.filter(task => task.status !== 'completed' && task.status !== 'cancelled');
                                      const overdueTasks = clientTasks.filter(task => isTaskOverdue(task.due_date, task.status));
                                      const hasOverdue = overdueTasks.length > 0;
                                      if (activeTasks.length > 0) {
                                        return (
                                          <span 
                                            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-medium border ${
                                              hasOverdue
                                                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
                                                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                                            }`}
                                            title={hasOverdue 
                                              ? `${overdueTasks.length} overdue task${overdueTasks.length !== 1 ? 's' : ''}, ${activeTasks.length} active task${activeTasks.length !== 1 ? 's' : ''}`
                                              : `${activeTasks.length} active task${activeTasks.length !== 1 ? 's' : ''}`
                                            }
                                          >
                                            {hasOverdue && <AlertCircle className="w-2.5 h-2.5" />}
                                            {activeTasks.length}
                                          </span>
                                        );
                                      }
                                      return null;
                                    })()}
                                  </div>
                                </div>
                                <div className="ml-1 sm:ml-2 flex-shrink-0">
                                  <svg 
                                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 transition-transform ${isRowExpanded(client.id) ? 'rotate-90' : ''}`} 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 sm:px-4 lg:px-6 py-2 sm:py-[0.6rem] lg:py-[0.7rem]">
                              <div className="group/tags relative" ref={inlineTagSuggestionsRef}>
                                {addingTagClientId === client.id ? (
                                  <div className="flex items-center gap-1 sm:gap-1.5" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex-1 relative">
                                      <input
                                        type="text"
                                        value={tagInputValue}
                                        onChange={(e) => {
                                          setTagInputValue(e.target.value);
                                          setShowTagSuggestions(true);
                                        }}
                                        onFocus={() => setShowTagSuggestions(true)}
                                        onKeyPress={(e) => {
                                          if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddTagInline(client.id);
                                          } else if (e.key === 'Escape') {
                                            setAddingTagClientId(null);
                                            setTagInputValue('');
                                            setShowTagSuggestions(false);
                                          }
                                        }}
                                        onBlur={(e) => {
                                          // Don't close if clicking on a suggestion
                                          if (inlineTagSuggestionsRef.current?.contains(e.relatedTarget as Node)) {
                                            return;
                                          }
                                          if (tagInputValue.trim()) {
                                            handleAddTagInline(client.id);
                                          } else {
                                            setAddingTagClientId(null);
                                            setTagInputValue('');
                                            setShowTagSuggestions(false);
                                          }
                                        }}
                                        autoFocus
                                        className="w-full px-2 py-1 sm:px-1.5 sm:py-0.5 text-[11px] sm:text-[10px] rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[80px] sm:min-w-[70px]"
                                        placeholder="Add tag..."
                                      />
                                      {/* Tag Suggestions */}
                                      {showTagSuggestions && (() => {
                                        const suggestions = getFilteredTagSuggestions(client.id);
                                        const hasSuggestions = suggestions.existing.length > 0 || suggestions.new.length > 0;
                                        return hasSuggestions && (
                                          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 sm:max-h-40 overflow-y-auto">
                                            <div className="p-2.5 sm:p-2 space-y-2.5 sm:space-y-2">
                                              {suggestions.existing.length > 0 && (
                                                <div>
                                                  <div className="text-[11px] sm:text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1.5 sm:mb-1 px-1">Existing Tags:</div>
                                                  <div className="flex flex-wrap gap-1.5 sm:gap-1">
                                                    {suggestions.existing.map((tag) => (
                                                      <button
                                                        key={tag}
                                                        type="button"
                                                        onMouseDown={(e) => {
                                                          e.preventDefault();
                                                          toast.info('Tag already exists');
                                                        }}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1 sm:px-2 sm:py-0.5 text-[11px] sm:text-[10px] bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 active:bg-gray-400 dark:active:bg-gray-500 transition-colors touch-manipulation cursor-pointer"
                                                        title="Tag already added"
                                                      >
                                                        <Tag className="w-3 h-3 sm:w-2.5 sm:h-2.5" />
                                                        {tag}
                                                      </button>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}
                                              {suggestions.new.length > 0 && (
                                                <div>
                                                  <div className="text-[11px] sm:text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1.5 sm:mb-1 px-1">Suggestions:</div>
                                                  <div className="flex flex-wrap gap-1.5 sm:gap-1">
                                                    {suggestions.new.map((tag) => (
                                                      <button
                                                        key={tag}
                                                        type="button"
                                                        onMouseDown={(e) => {
                                                          e.preventDefault();
                                                          handleAddTagInline(client.id, tag);
                                                        }}
                                                        className="px-2.5 py-1 sm:px-2 sm:py-0.5 text-[11px] sm:text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900 hover:text-blue-700 dark:hover:text-blue-300 active:bg-blue-200 dark:active:bg-blue-800 transition-colors touch-manipulation"
                                                      >
                                                        {tag}
                                                      </button>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })()}
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAddTagInline(client.id);
                                      }}
                                      className="px-2 py-1 sm:px-1.5 sm:py-0.5 text-[11px] sm:text-[10px] bg-blue-600 text-white rounded hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                                      disabled={!tagInputValue.trim()}
                                      title="Add tag"
                                      aria-label="Add tag"
                                    >
                                      <Plus className="w-3 h-3 sm:w-2.5 sm:h-2.5" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setAddingTagClientId(null);
                                        setTagInputValue('');
                                        setShowTagSuggestions(false);
                                      }}
                                      className="px-2 py-1 sm:px-1.5 sm:py-0.5 text-[11px] sm:text-[10px] text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 active:text-gray-900 dark:active:text-gray-100 transition-colors touch-manipulation"
                                      title="Cancel"
                                      aria-label="Cancel"
                                    >
                                      <X className="w-3 h-3 sm:w-2.5 sm:h-2.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex flex-wrap items-center gap-1 sm:gap-1">
                                    {client.tags && client.tags.length > 0 ? (
                                      <>
                                        {client.tags.map((tag) => (
                                          <span
                                            key={tag}
                                            className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-[10px] group/tag"
                                          >
                                            <Tag className="w-2.5 h-2.5" />
                                            {tag}
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveTag(client.id, tag);
                                              }}
                                              className="text-blue-800 dark:text-blue-200 hover:text-blue-900 dark:hover:text-blue-100 active:text-blue-950 dark:active:text-blue-50 transition-colors ml-0.5 touch-manipulation"
                                              title="Remove tag"
                                              aria-label={`Remove ${tag} tag`}
                                            >
                                              <X className="w-2.5 h-2.5 sm:w-2.5 sm:h-2.5" />
                                            </button>
                                          </span>
                                        ))}
                                      </>
                                    ) : (
                                      <span className="text-xs sm:text-sm text-gray-400 dark:text-gray-500">-</span>
                                    )}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setAddingTagClientId(client.id);
                                        setTagInputValue('');
                                      }}
                                      className="inline-flex items-center justify-center w-5 h-5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 active:bg-blue-100 dark:active:bg-blue-900/50 rounded transition-all ml-1 touch-manipulation"
                                      title="Add tag"
                                      aria-label="Add tag"
                                    >
                                      <Plus className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-3 sm:px-4 lg:px-6 py-2 sm:py-[0.6rem] lg:py-[0.7rem]">
                              <div className="text-xs sm:text-sm text-gray-900 dark:text-white truncate">
                                {client.company_name || '-'}
                              </div>
                            </td>
                            <td className="px-3 sm:px-4 lg:px-6 py-2 sm:py-[0.6rem] lg:py-[0.7rem] text-center">
                              <span className="text-xs sm:text-sm text-gray-900 dark:text-white truncate">
                                {client.source || '-'}
                              </span>
                            </td>
                            <td className="px-3 sm:px-4 lg:px-6 py-2 sm:py-[0.6rem] lg:py-[0.7rem] text-center">
                              <span className="text-xs sm:text-sm text-gray-900 dark:text-white">
                                {client.default_currency || 'USD'}
                              </span>
                            </td>
                            <td className="px-3 sm:px-4 lg:px-6 py-2 sm:py-[0.6rem] lg:py-[0.7rem] text-center">
                              {getStatusBadge(client.status)}
                            </td>
                            <td className="px-3 sm:px-4 lg:px-6 py-2 sm:py-[0.6rem] lg:py-[0.7rem] text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Tooltip content="Edit" placement="top">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEdit(client);
                                    }}
                                    className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                                    aria-label={`Edit ${client.name} client`}
                                  >
                                    <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  </button>
                                </Tooltip>
                                <Tooltip content="Create Task" placement="top">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setTaskClientId(client.id);
                                      setShowTaskForm(true);
                                    }}
                                    className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                                    aria-label={`Create task for ${client.name}`}
                                  >
                                    <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  </button>
                                </Tooltip>
                                <Tooltip content={client.notes && client.notes.trim().length > 0 ? "View Note" : "Add Note"} placement="top">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Prevent if modal is already open for this client
                                      if (noteModalClient?.id === client.id || isSavingNoteRef.current) {
                                        return;
                                      }
                                      setNoteModalClient(client);
                                    }}
                                    className={client.notes && client.notes.trim().length > 0 
                                      ? "text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300" 
                                      : "text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"}
                                    aria-label={client.notes && client.notes.trim().length > 0 ? `View note for ${client.name}` : `Add note for ${client.name}`}
                                  >
                                    <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  </button>
                                </Tooltip>
                                <Tooltip content="Delete" placement="top">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeletingClient(client);
                                    }}
                                    className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                    aria-label={`Delete ${client.name} client`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  </button>
                                </Tooltip>
                              </div>
                            </td>
                          </tr>
                          
                          {/* Expanded Row Content */}
                          {isRowExpanded(client.id) && (
                          <tr className="bg-gray-50 dark:bg-gray-800">
                            <td colSpan={7} className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
                                  {/* Contact & Company */}
                                  <div className="space-y-2 sm:space-y-3">
                                    <h4 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">Contact & Company</h4>
                                    <div className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-300 space-y-1.5 sm:space-y-2">
                                      {/* Known Since / Created Date */}
                                      <div className="font-medium">
                                        <span>{client.known_since ? 'Known Since:' : 'Created:'}</span>{' '}
                                        {formatKnownSinceDate(client.known_since || client.created_at)}
                                      </div>
                                      
                                      {/* Contact Information */}
                                      {(client.email || client.phone) && (
                                        <div className="space-y-1">
                                          {client.email && (
                                            <div className="flex items-center gap-1.5">
                                              <Mail className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                              <span className="break-words">{client.email}</span>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleCopyToClipboard(client.email!, 'Email');
                                                }}
                                                className="ml-1 p-0.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                                title="Copy email"
                                                aria-label="Copy email"
                                              >
                                                <Copy className="w-3 h-3" />
                                              </button>
                                            </div>
                                          )}
                                          {client.phone && (
                                            <div className="flex items-center gap-1.5">
                                              <Phone className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                              <span>{client.phone}</span>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleCopyToClipboard(client.phone!, 'Phone');
                                                }}
                                                className="ml-1 p-0.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                                title="Copy phone"
                                                aria-label="Copy phone"
                                              >
                                                <Copy className="w-3 h-3" />
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                      
                                      {/* Address */}
                                      {(client.address || client.city || client.state || client.postal_code || client.country) && (
                                        <div className="flex items-start gap-1.5 pt-1">
                                          <MapPin className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                                          <div className="flex-1">
                                            {client.address && <div>{client.address}</div>}
                                            <div>
                                              {[client.city, client.state, client.postal_code].filter(Boolean).join(', ')}
                                              {client.country && (client.city || client.state || client.postal_code) && ', '}
                                              {client.country}
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                      
                                      {/* Company Information */}
                                      {(client.company_name || client.tax_id || client.website) && (
                                        <div className="pt-1 space-y-1 border-t border-gray-200 dark:border-gray-700">
                                          {client.company_name && (
                                            <div>
                                              <span className="font-medium">Company:</span> {client.company_name}
                                            </div>
                                          )}
                                          {client.tax_id && (
                                            <div>
                                              <span className="font-medium">Tax ID:</span> {client.tax_id}
                                            </div>
                                          )}
                                          {client.website && (
                                            <div>
                                              <span className="font-medium">Website:</span>{' '}
                                              <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline break-all">
                                                {client.website}
                                              </a>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                      
                                      {/* Tags */}
                                      <div className="pt-1 space-y-1 border-t border-gray-200 dark:border-gray-700">
                                        <div className="font-medium mb-1">Tags:</div>
                                        {client.tags && client.tags.length > 0 ? (
                                          <div className="flex flex-wrap gap-1 mb-2">
                                            {client.tags.map((tag) => (
                                              <span
                                                key={tag}
                                                className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded text-[10px] group"
                                              >
                                                <Tag className="w-2.5 h-2.5" />
                                                {tag}
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemoveTag(client.id, tag);
                                                  }}
                                                  className="opacity-0 group-hover:opacity-100 hover:text-blue-900 dark:hover:text-blue-100 transition-opacity ml-0.5"
                                                  title="Remove tag"
                                                  aria-label={`Remove ${tag} tag`}
                                                >
                                                  <X className="w-2.5 h-2.5" />
                                                </button>
                                              </span>
                                            ))}
                                          </div>
                                        ) : (
                                          <div className="text-gray-400 italic text-xs mb-2">No tags</div>
                                        )}
                                        {/* Tag Management */}
                                        <ClientTagManager 
                                          key={`tag-manager-${client.id}`}
                                          client={client} 
                                          onTagAdded={() => {}}
                                          onTagRemoved={() => {}}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Financial Summary */}
                                  <div className="space-y-2 sm:space-y-3">
                                    <h4 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">Financial Summary</h4>
                                    <div className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-300 space-y-2 sm:space-y-2.5">
                                      {(() => {
                                        if (!financialData) {
                                          return (
                                            <div className="text-gray-400 italic">No financial activity yet</div>
                                          );
                                        }
                                        
                                        const { orders: clientOrders, invoices: clientInvoices, totalOrderValue, totalInvoiceValue, currencySymbol } = financialData;
                                        const paidInvoices = clientInvoices.filter(inv => inv.payment_status === 'paid');
                                        const unpaidInvoices = clientInvoices.filter(inv => inv.payment_status === 'unpaid' || inv.payment_status === 'partial');
                                        const paidInvoiceValue = paidInvoices.reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0);
                                        const unpaidInvoiceValue = unpaidInvoices.reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0);
                                        
                                        if (clientOrders.length === 0 && clientInvoices.length === 0) {
                                          return (
                                            <div className="text-gray-400 italic">No financial activity yet</div>
                                          );
                                        }
                                        
                                        return (
                                          <>
                                            {/* Orders Section */}
                                            {clientOrders.length > 0 && (
                                              <div className="pb-2 border-b border-gray-200 dark:border-gray-700">
                                                <div className="font-medium text-gray-700 dark:text-gray-200 mb-1">Orders</div>
                                                <div className="space-y-0.5">
                                                  <div className="flex justify-between">
                                                    <span>Count:</span>
                                                    <span className="font-medium">{clientOrders.length}</span>
                                                  </div>
                                                  <div className="flex justify-between">
                                                    <span>Total Value:</span>
                                                    <span className="font-medium text-blue-600 dark:text-blue-400">
                                                      {currencySymbol}{totalOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                  </div>
                                                </div>
                                              </div>
                                            )}
                                            
                                            {/* Invoices Section */}
                                            {clientInvoices.length > 0 && (
                                              <div className={clientOrders.length > 0 ? 'pt-2' : ''}>
                                                <div className="font-medium text-gray-700 dark:text-gray-200 mb-1">Invoices</div>
                                                <div className="space-y-0.5">
                                                  <div className="flex justify-between">
                                                    <span>Count:</span>
                                                    <span className="font-medium">{clientInvoices.length}</span>
                                                  </div>
                                                  <div className="flex justify-between">
                                                    <span>Total Value:</span>
                                                    <span className="font-medium text-blue-600 dark:text-blue-400">
                                                      {currencySymbol}{totalInvoiceValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                  </div>
                                                  {paidInvoices.length > 0 && (
                                                    <div className="flex justify-between pt-1">
                                                      <span className="text-green-600 dark:text-green-400">Paid ({paidInvoices.length}):</span>
                                                      <span className="font-medium text-green-600 dark:text-green-400">
                                                        {currencySymbol}{paidInvoiceValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                      </span>
                                                    </div>
                                                  )}
                                                  {unpaidInvoices.length > 0 && (
                                                    <div className="flex justify-between">
                                                      <span className="text-yellow-600 dark:text-yellow-400">Unpaid ({unpaidInvoices.length}):</span>
                                                      <span className="font-medium text-yellow-600 dark:text-yellow-400">
                                                        {currencySymbol}{unpaidInvoiceValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                      </span>
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            )}
                                          </>
                                        );
                                      })()}
                                    </div>

                                    {/* Invoices List */}
                                    {loadingClientData.has(client.id) && !loadedClientData.has(client.id) ? (
                                      <div className="pt-2 sm:pt-3 border-t border-gray-200 dark:border-gray-700 mt-2 sm:mt-3 text-center py-4 text-gray-400 dark:text-gray-500 text-xs">
                                        Loading invoices...
                                      </div>
                                    ) : (
                                      <div className="pt-2 sm:pt-3 border-t border-gray-200 dark:border-gray-700 mt-2 sm:mt-3">
                                      <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                                        <h5 className="text-[11px] sm:text-xs font-medium text-gray-700 dark:text-gray-300">Invoices</h5>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setInvoiceClientId(client.id);
                                            setShowInvoiceForm(true);
                                          }}
                                          className="flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                                        >
                                          <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                          <span className="hidden sm:inline">Create</span>
                                        </button>
                                      </div>
                                      <div className="space-y-1.5 sm:space-y-2">
                                        {(() => {
                                          const clientInvoices = getInvoicesByClient(client.id);
                                          
                                          if (clientInvoices.length === 0) {
                                            return <div className="text-gray-400 italic text-xs">No invoices yet</div>;
                                          }
                                          
                                          const currency = client.default_currency || 'USD';
                                          const currencySymbol = {
                                            USD: '$', BDT: '৳', EUR: '€', GBP: '£', JPY: '¥', INR: '₹', CAD: '$', AUD: '$'
                                          }[currency] || currency;
                                          
                                          return clientInvoices
                                            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                            .slice(0, 5)
                                            .map((invoice) => {
                                              return (
                                                <div key={invoice.id} className="p-1.5 bg-gray-50 dark:bg-gray-800/50 rounded text-xs">
                                                  <div className="flex items-center justify-between">
                                                    <div className="flex-1 min-w-0">
                                                      <div className="font-medium truncate">{invoice.invoice_number}</div>
                                                      <div className="text-gray-500 dark:text-gray-400 mt-0.5">
                                                        {currencySymbol}{Number(invoice.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                      </div>
                                                    </div>
                                                    <div className="ml-2 text-right relative">
                                                      <div className="relative">
                                                        <button
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            setInvoiceStatusMenuOpen(invoiceStatusMenuOpen === invoice.id ? null : invoice.id);
                                                          }}
                                                          className={`text-xs font-medium px-2 py-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${getInvoiceStatusColor(invoice.status)}`}
                                                        >
                                                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                                        </button>
                                                        {invoiceStatusMenuOpen === invoice.id && (
                                                          <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg min-w-[140px] max-w-[calc(100vw-2rem)]">
                                                            {[
                                                              { label: 'Draft', value: 'draft' },
                                                              { label: 'Sent', value: 'sent' },
                                                              { label: 'Paid', value: 'paid' },
                                                              { label: 'Overdue', value: 'overdue' },
                                                              { label: 'Cancelled', value: 'cancelled' },
                                                            ].map((statusOption) => (
                                                              <button
                                                                key={statusOption.value}
                                                                onClick={(e) => {
                                                                  e.stopPropagation();
                                                                  updateInvoice(invoice.id, { status: statusOption.value as any });
                                                                  setInvoiceStatusMenuOpen(null);
                                                                  // Refresh all invoices to ensure data consistency
                                                                  fetchInvoices();
                                                                }}
                                                                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                                                                  invoice.status === statusOption.value
                                                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                                                    : 'text-gray-700 dark:text-gray-300'
                                                                }`}
                                                              >
                                                                {statusOption.label}
                                                              </button>
                                                            ))}
                                                          </div>
                                                        )}
                                                      </div>
                                                      <div className={`text-xs mt-0.5 ${getPaymentStatusColor(invoice.payment_status)}`}>
                                                        {invoice.payment_status.charAt(0).toUpperCase() + invoice.payment_status.slice(1)}
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              );
                                            });
                                        })()}
                                      </div>
                                    </div>
                                    )}
                                  </div>
                                  
                                  {/* Tasks */}
                                  <div className="space-y-2 sm:space-y-3">
                                    {loadingClientData.has(client.id) && !loadedClientData.has(client.id) ? (
                                      <div className="text-center py-4 text-gray-400 dark:text-gray-500 text-xs">
                                        Loading tasks...
                                      </div>
                                    ) : (
                                      <>
                                    <div className="flex items-center justify-between gap-2">
                                      <h4 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">Tasks</h4>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setTaskClientId(client.id);
                                          setShowTaskForm(true);
                                        }}
                                        className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 text-[10px] sm:text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap"
                                      >
                                        <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                        <span className="hidden sm:inline">Create Task</span>
                                        <span className="sm:hidden">Create</span>
                                      </button>
                                    </div>
                                    <div className="text-[11px] sm:text-xs lg:text-[11px] text-gray-600 dark:text-gray-300 space-y-1.5 sm:space-y-2">
                                      {(() => {
                                        const clientTasks = getTasksByClient(client.id);
                                        
                                        if (clientTasks.length === 0) {
                                          return <div className="text-gray-400 italic text-[11px] lg:text-[11px]">No tasks yet</div>;
                                        }
                                        
                                        return clientTasks
                                          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                          .slice(0, 5)
                                          .map((task) => {
                                            // Check if task is overdue
                                            const isOverdue = isTaskOverdue(task.due_date, task.status);
                                            const daysOverdue = getDaysOverdue(task.due_date, task.status);
                                            
                                            return (
                                              <div key={task.id} className={`flex justify-between items-start p-2 rounded-md ${isOverdue ? 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/50' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
                                                <div className="flex-1 min-w-0">
                                                  <div className="font-medium truncate text-xs sm:text-sm lg:text-[11px]">{task.title}</div>
                                                  {task.description && (
                                                    <div className="text-gray-500 dark:text-gray-400 text-xs lg:text-[10px] mt-0.5 line-clamp-2 lg:line-clamp-1">
                                                      {task.description}
                                                    </div>
                                                  )}
                                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                    {task.due_date ? (
                                                      <span className={`text-xs lg:text-[10px] ${isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                                                        {isOverdue ? `Overdue ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''}` : `Due: ${new Date(task.due_date).toLocaleDateString()}`}
                                                      </span>
                                                    ) : (
                                                      <span className="text-xs lg:text-[10px] text-gray-400 dark:text-gray-500 italic">
                                                        No due date
                                                      </span>
                                                    )}
                                                    {isOverdue && (
                                                      <span className="text-xs lg:text-[10px] px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-medium">
                                                        Overdue
                                                      </span>
                                                    )}
                                                    <span className={`text-xs lg:text-[10px] font-medium ${getTaskPriorityColor(task.priority)}`}>
                                                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                                    </span>
                                                  </div>
                                                </div>
                                                <div className="ml-2 text-right relative">
                                                  <div className="relative">
                                                    <button
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        setTaskStatusMenuOpen(taskStatusMenuOpen === task.id ? null : task.id);
                                                      }}
                                                      className={`text-xs lg:text-[10px] font-medium px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${getTaskStatusColor(task.status)}`}
                                                    >
                                                      {task.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                    </button>
                                                    {taskStatusMenuOpen === task.id && (
                                                      <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg min-w-[160px] max-w-[calc(100vw-2rem)]">
                                                        {[
                                                          { label: 'In Progress', value: 'in_progress' },
                                                          { label: 'Waiting on Client', value: 'waiting_on_client' },
                                                          { label: 'Waiting on Me', value: 'waiting_on_me' },
                                                          { label: 'Completed', value: 'completed' },
                                                          { label: 'Cancelled', value: 'cancelled' },
                                                        ].map((statusOption) => (
                                                          <button
                                                            key={statusOption.value}
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              updateTask(task.id, { status: statusOption.value as any });
                                                              setTaskStatusMenuOpen(null);
                                                              // Refresh all tasks to ensure data consistency
                                                              fetchTasks();
                                                            }}
                                                            className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                                                              task.status === statusOption.value
                                                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                                                : 'text-gray-700 dark:text-gray-300'
                                                            }`}
                                                          >
                                                            {statusOption.label}
                                                          </button>
                                                        ))}
                                                      </div>
                                                    )}
                                                  </div>
                                                  {task.completed_date && (
                                                    <div className="text-xs text-gray-400 mt-0.5">
                                                      {new Date(task.completed_date).toLocaleDateString()}
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            );
                                          });
                                      })()}
                                    </div>
                                    </>
                                    )}
                                  </div>
                                  
                                  {/* AI Email Suggestions */}
                                  <ClientEmailSuggestions
                                    client={client}
                                    orders={getOrdersByClient(client.id)}
                                    invoices={getInvoicesByClient(client.id)}
                                    tasks={getTasksByClient(client.id)}
                                  />
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

              {/* Mobile/Tablet Card View */}
              <div className="lg:hidden max-h-[400px] sm:max-h-[450px] md:max-h-[500px] overflow-y-auto">
                {filteredClients.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Building2 className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">No clients yet</h3>
                    <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-4 sm:mb-6 max-w-sm mx-auto px-4">
                      {tableFilters.search || tableFilters.currency || tableFilters.status !== 'active' || tableFilters.source || tableFilters.tag
                        ? 'No clients match your filters'
                        : 'Start managing your clients by adding your first client'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4 px-3 sm:px-4">
                    {filteredClients.map((client) => {
                      const financialData = clientFinancialData.get(client.id);
                      if (!financialData) return null;
                      
                      const { orders: clientOrders, invoices: clientInvoices, totalOrderValue, totalInvoiceValue, currencySymbol } = financialData;
                      
                      return (
                        <div
                          key={client.id}
                          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-200"
                        >
                          {/* Card Header - Client Name */}
                          <div className="mb-3 sm:mb-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="flex items-center gap-1.5">
                                <div className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
                                  {client.name}
                                </div>
                                {(() => {
                                  const clientTasks = getTasksByClient(client.id);
                                  const activeTasks = clientTasks.filter(task => task.status !== 'completed' && task.status !== 'cancelled');
                                  const overdueTasks = clientTasks.filter(task => isTaskOverdue(task.due_date, task.status));
                                  const hasOverdue = overdueTasks.length > 0;
                                  if (activeTasks.length > 0) {
                                    return (
                                      <span 
                                        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-medium border ${
                                          hasOverdue
                                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
                                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                                        }`}
                                        title={hasOverdue 
                                          ? `${overdueTasks.length} overdue task${overdueTasks.length !== 1 ? 's' : ''}, ${activeTasks.length} active task${activeTasks.length !== 1 ? 's' : ''}`
                                          : `${activeTasks.length} active task${activeTasks.length !== 1 ? 's' : ''}`
                                        }
                                      >
                                        {hasOverdue && <AlertCircle className="w-2.5 h-2.5" />}
                                        {activeTasks.length}
                                      </span>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                              {client.company_name && (
                                <>
                                  <span className="text-gray-400 dark:text-gray-500">•</span>
                                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate max-w-[150px]">
                                    {client.company_name}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          
                          {/* Card Body - Status badge and Source badge */}
                          <div className="mb-3 sm:mb-4">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center space-x-2 sm:space-x-2.5 flex-wrap">
                                <span className={`inline-flex items-center px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium ${
                                  client.status === 'active' 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                    : client.status === 'inactive'
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                                }`}>
                                  {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                                </span>
                              </div>
                              {client.source && (
                                <span className={`inline-flex items-center justify-center px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium flex-shrink-0 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300`}>
                                  {client.source}
                                </span>
                              )}
                            </div>
                            {/* Tags */}
                            {client.tags && client.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2 sm:mt-2.5">
                                {client.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-[10px] sm:text-xs"
                                  >
                                    <Tag className="w-2.5 h-2.5" />
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          {/* Card Footer - Created Date and Actions */}
                          <div className="flex items-center justify-between pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="text-xs sm:text-sm">
                              <div className="text-gray-600 dark:text-gray-400 font-medium">
                                <span>{client.known_since ? 'Known Since:' : 'Created:'}</span>{' '}
                                {formatKnownSinceDate(client.known_since || client.created_at)}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleEdit(client)}
                                className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                title="Edit client"
                                aria-label={`Edit ${client.name} client`}
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTaskClientId(client.id);
                                  setShowTaskForm(true);
                                }}
                                className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                title="Create task"
                                aria-label={`Create task for ${client.name}`}
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (noteModalClient?.id === client.id || isSavingNoteRef.current) {
                                    return;
                                  }
                                  setNoteModalClient(client);
                                }}
                                className={`p-2 rounded-lg transition-colors ${
                                  client.notes && client.notes.trim().length > 0
                                    ? 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                                    : 'text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                                }`}
                                title={client.notes && client.notes.trim().length > 0 ? "View note" : "Add note"}
                                aria-label={client.notes && client.notes.trim().length > 0 ? `View note for ${client.name}` : `Add note for ${client.name}`}
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeletingClient(client)}
                                className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Delete client"
                                aria-label={`Delete ${client.name} client`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => toggleRowExpansion(client.id)}
                                className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                title={isRowExpanded(client.id) ? "Hide details" : "View details"}
                                aria-label={isRowExpanded(client.id) ? `Hide details for ${client.name}` : `View details for ${client.name}`}
                              >
                                <svg 
                                  className={`w-4 h-4 transition-transform ${isRowExpanded(client.id) ? 'rotate-90' : ''}`} 
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m9 18 6-6-6-6" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          {/* Expandable Content */}
                          {isRowExpanded(client.id) && (
                            <div className="mt-4 sm:mt-5 pt-4 sm:pt-5 px-0 sm:px-2 border-t border-gray-200 dark:border-gray-700">
                              <div className="space-y-4 sm:space-y-5">
                                {/* Contact Information */}
                                {(client.email || client.phone || client.address || client.city || client.state || client.postal_code || client.country) && (
                                  <div className="space-y-2 sm:space-y-3">
                                    <h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">Contact Information</h4>
                                    <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                                      {client.email && (
                                        <div className="flex items-center gap-1.5">
                                          <Mail className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                          <span className="truncate">{client.email}</span>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleCopyToClipboard(client.email!, 'Email');
                                            }}
                                            className="ml-1 p-0.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                            title="Copy email"
                                            aria-label="Copy email"
                                          >
                                            <Copy className="w-3 h-3" />
                                          </button>
                                        </div>
                                      )}
                                      {client.phone && (
                                        <div className="flex items-center gap-1.5">
                                          <Phone className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                          <span>{client.phone}</span>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleCopyToClipboard(client.phone!, 'Phone');
                                            }}
                                            className="ml-1 p-0.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                            title="Copy phone"
                                            aria-label="Copy phone"
                                          >
                                            <Copy className="w-3 h-3" />
                                          </button>
                                        </div>
                                      )}
                                      {(client.address || client.city || client.state || client.postal_code || client.country) && (
                                        <div className="flex items-start gap-1.5">
                                          <MapPin className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                                          <div className="text-xs">
                                            {client.address && <div>{client.address}</div>}
                                            <div>
                                              {[client.city, client.state, client.postal_code].filter(Boolean).join(', ')}
                                              {client.country && (client.city || client.state || client.postal_code) && ', '}
                                              {client.country}
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Company Information */}
                                {(client.company_name || client.tax_id || client.website || client.source) && (
                                  <div className="space-y-2 sm:space-y-3 mt-4 sm:mt-5">
                                    <h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">Company Information</h4>
                                    <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                                      {client.company_name && (
                                        <div>
                                          <span className="font-medium">Name:</span> {client.company_name}
                                        </div>
                                      )}
                                      {client.tax_id && (
                                        <div>
                                          <span className="font-medium">Tax ID:</span> {client.tax_id}
                                        </div>
                                      )}
                                      {client.website && (
                                        <div>
                                          <span className="font-medium">Website:</span>{' '}
                                          <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline truncate">
                                            {client.website}
                                          </a>
                                        </div>
                                      )}
                                      {client.source && (
                                        <div>
                                          <span className="font-medium">Source:</span> {client.source}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Financial Summary */}
                                {(() => {
                                  if (!financialData) {
                                    return null;
                                  }
                                  
                                  const { orders: clientOrders, invoices: clientInvoices, totalOrderValue, totalInvoiceValue, currencySymbol } = financialData;
                                  
                                  if (clientOrders.length === 0 && clientInvoices.length === 0) {
                                    return null;
                                  }
                                  
                                  return (
                                    <div className="space-y-2 sm:space-y-3 mt-4 sm:mt-5">
                                      <h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">Financial Summary</h4>
                                      <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                                        {clientOrders.length > 0 && (
                                          <div>
                                            <span className="font-medium">Orders:</span> {clientOrders.length} ({currencySymbol}{totalOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                                          </div>
                                        )}
                                        {clientInvoices.length > 0 && (
                                          <div>
                                            <span className="font-medium">Invoices:</span> {clientInvoices.length} ({currencySymbol}{totalInvoiceValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })()}

                                {/* Invoices */}
                                <div className="space-y-2 sm:space-y-3 mt-4 sm:mt-5">
                                  <div className="flex items-center justify-between mb-1.5 sm:mb-2 gap-2">
                                    <h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">Invoices</h4>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setInvoiceClientId(client.id);
                                        setShowInvoiceForm(true);
                                      }}
                                      className="flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 text-xs bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors whitespace-nowrap"
                                    >
                                      <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                      Create
                                    </button>
                                  </div>
                                  <div className="space-y-1.5 sm:space-y-2">
                                    {(() => {
                                      const clientInvoices = getInvoicesByClient(client.id);
                                      
                                      if (clientInvoices.length === 0) {
                                        return <div className="text-gray-400 italic text-xs">No invoices yet</div>;
                                      }
                                      
                                      const currency = client.default_currency || 'USD';
                                      const currencySymbol = {
                                        USD: '$', BDT: '৳', EUR: '€', GBP: '£', JPY: '¥', INR: '₹', CAD: '$', AUD: '$'
                                      }[currency] || currency;
                                      
                                      return clientInvoices
                                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                        .slice(0, 5)
                                        .map((invoice) => {
                                          return (
                                            <div key={invoice.id} className="p-1.5 bg-gray-50 dark:bg-gray-800/50 rounded text-xs">
                                              <div className="flex items-center justify-between">
                                                <div className="flex-1 min-w-0">
                                                  <div className="font-medium truncate">{invoice.invoice_number}</div>
                                                  <div className="text-gray-500 dark:text-gray-400 mt-0.5">
                                                    {currencySymbol}{Number(invoice.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                  </div>
                                                </div>
                                                <div className="ml-2 text-right relative">
                                                  <div className="relative">
                                                    <button
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        setInvoiceStatusMenuOpen(invoiceStatusMenuOpen === invoice.id ? null : invoice.id);
                                                      }}
                                                      className={`text-xs font-medium px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${getInvoiceStatusColor(invoice.status)}`}
                                                    >
                                                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                                    </button>
                                                    {invoiceStatusMenuOpen === invoice.id && (
                                                      <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg min-w-[140px] max-w-[calc(100vw-2rem)]">
                                                        {[
                                                          { label: 'Draft', value: 'draft' },
                                                          { label: 'Sent', value: 'sent' },
                                                          { label: 'Paid', value: 'paid' },
                                                          { label: 'Overdue', value: 'overdue' },
                                                          { label: 'Cancelled', value: 'cancelled' },
                                                        ].map((statusOption) => (
                                                          <button
                                                            key={statusOption.value}
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              updateInvoice(invoice.id, { status: statusOption.value as any });
                                                              setInvoiceStatusMenuOpen(null);
                                                              fetchInvoices(client.id);
                                                            }}
                                                            className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                                                              invoice.status === statusOption.value
                                                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                                                : 'text-gray-700 dark:text-gray-300'
                                                            }`}
                                                          >
                                                            {statusOption.label}
                                                          </button>
                                                        ))}
                                                      </div>
                                                    )}
                                                  </div>
                                                  <div className={`text-xs mt-0.5 ${getPaymentStatusColor(invoice.payment_status)}`}>
                                                    {invoice.payment_status.charAt(0).toUpperCase() + invoice.payment_status.slice(1)}
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        });
                                    })()}
                                  </div>
                                </div>

                                {/* Tags */}
                                <div className="space-y-2 sm:space-y-3 mt-4 sm:mt-5">
                                  <h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">Tags</h4>
                                  {client.tags && client.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-2">
                                      {client.tags.map((tag) => (
                                        <span
                                          key={tag}
                                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-xs group"
                                        >
                                          <Tag className="w-2.5 h-2.5" />
                                          {tag}
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleRemoveTag(client.id, tag);
                                            }}
                                            className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 hover:text-blue-900 dark:hover:text-blue-100 transition-opacity ml-0.5"
                                            title="Remove tag"
                                            aria-label={`Remove ${tag} tag`}
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  {/* Tag Management */}
                                  <ClientTagManager 
                                    key={`tag-manager-card-${client.id}`}
                                    client={client} 
                                    onTagAdded={() => {}}
                                    onTagRemoved={() => {}}
                                  />
                                </div>

                                {/* Tasks */}
                                <div className="space-y-2 sm:space-y-3 mt-4 sm:mt-5">
                                  <div className="flex items-center justify-between mb-1.5 sm:mb-2 gap-2">
                                    <h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">Tasks</h4>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setTaskClientId(client.id);
                                        setShowTaskForm(true);
                                      }}
                                      className="flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap"
                                    >
                                      <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                      <span className="hidden sm:inline">Create Task</span>
                                      <span className="sm:hidden">Create</span>
                                    </button>
                                  </div>
                                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 space-y-1.5 sm:space-y-2">
                                    {(() => {
                                      const clientTasks = getTasksByClient(client.id);
                                      
                                      if (clientTasks.length === 0) {
                                        return <div className="text-gray-400 italic text-xs">No tasks yet</div>;
                                      }
                                      
                                      return clientTasks
                                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                        .slice(0, 3)
                                        .map((task) => {
                                          // Check if task is overdue
                                          const isOverdue = isTaskOverdue(task.due_date, task.status);
                                          const daysOverdue = getDaysOverdue(task.due_date, task.status);
                                          
                                          return (
                                            <div key={task.id} className={`p-1.5 rounded text-xs ${isOverdue ? 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/50' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
                                              <div className="font-medium truncate">{task.title}</div>
                                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                {task.due_date ? (
                                                  <span className={isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-500 dark:text-gray-400'}>
                                                    {isOverdue ? `Overdue ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''}` : `Due: ${new Date(task.due_date).toLocaleDateString()}`}
                                                  </span>
                                                ) : (
                                                  <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                                                    No due date
                                                  </span>
                                                )}
                                                {isOverdue && (
                                                  <span className="px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-medium">
                                                    Overdue
                                                  </span>
                                                )}
                                                <span className={`font-medium ${getTaskPriorityColor(task.priority)}`}>
                                                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                                </span>
                                                <div className="relative">
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setTaskStatusMenuOpen(taskStatusMenuOpen === task.id ? null : task.id);
                                                    }}
                                                    className={`font-medium px-2 py-0.5 rounded text-xs hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${getTaskStatusColor(task.status)}`}
                                                  >
                                                    {task.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                  </button>
                                                  {taskStatusMenuOpen === task.id && (
                                                    <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg min-w-[160px] max-w-[calc(100vw-2rem)]">
                                                      {[
                                                        { label: 'In Progress', value: 'in_progress' },
                                                        { label: 'Waiting on Client', value: 'waiting_on_client' },
                                                        { label: 'Waiting on Me', value: 'waiting_on_me' },
                                                        { label: 'Completed', value: 'completed' },
                                                        { label: 'Cancelled', value: 'cancelled' },
                                                      ].map((statusOption) => (
                                                        <button
                                                          key={statusOption.value}
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            updateTask(task.id, { status: statusOption.value as any });
                                                            setTaskStatusMenuOpen(null);
                                                            fetchTasks(client.id);
                                                          }}
                                                          className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                                                            task.status === statusOption.value
                                                              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                                              : 'text-gray-700 dark:text-gray-300'
                                                          }`}
                                                        >
                                                          {statusOption.label}
                                                        </button>
                                                      ))}
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        });
                                    })()}
                                  </div>
                                </div>

                                {/* AI Email Suggestions */}
                                <ClientEmailSuggestions
                                  client={client}
                                  orders={getOrdersByClient(client.id)}
                                  invoices={getInvoicesByClient(client.id)}
                                  tasks={getTasksByClient(client.id)}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Client Form Modal */}
      <ClientForm
        isOpen={showForm}
        onClose={handleCloseForm}
        client={editingClient}
      />

      {/* Task Form Modal */}
      {showTaskForm && (
        <TaskForm
          isOpen={showTaskForm}
          onClose={() => {
            setShowTaskForm(false);
            setTaskClientId(null);
            if (taskClientId) {
              fetchTasks(taskClientId);
            }
          }}
          clientId={taskClientId || undefined}
        />
      )}

      {/* Invoice Form Modal */}
      {showInvoiceForm && (
        <InvoiceForm
          isOpen={showInvoiceForm}
          onClose={() => {
            setShowInvoiceForm(false);
            setInvoiceClientId(null);
            if (invoiceClientId) {
              fetchInvoices(invoiceClientId);
            }
          }}
          clientId={invoiceClientId || undefined}
        />
      )}

      {/* Mobile Filter Modal */}
      {showMobileFilterMenu && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black bg-opacity-50" onClick={() => setShowMobileFilterMenu(false)}>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl w-full max-w-xs overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
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
                      (tempFilters.currency || tempFilters.status !== 'active' || tempFilters.source || tempFilters.tag)
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
                      setTableFilters({ search: '', currency: '', status: 'active', source: '', tag: '' });
                      setShowMobileFilterMenu(false);
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                    }}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-2 transition-colors touch-manipulation active:opacity-70"
                    style={{ touchAction: 'manipulation' }}
                    title="Clear All Filters"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Filter Options */}
            <div className="max-h-[60vh] overflow-y-auto">
              {/* Currency Filter */}
              {currencyOptions.length > 0 && (
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
              )}

              {/* Status Filter */}
              <div className="px-3 py-2">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Status</div>
                <div className="flex flex-wrap gap-1">
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
                      setTempFilters({ ...tempFilters, status: 'inactive' });
                    }}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                      tempFilters.status === 'inactive' 
                        ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200' 
                        : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    Inactive
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTempFilters({ ...tempFilters, status: 'archived' });
                    }}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                      tempFilters.status === 'archived' 
                        ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200' 
                        : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    Archived
                  </button>
                </div>
              </div>

              {/* Tag Filter */}
              {tagOptions.length > 0 && (
                <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Tags</div>
                  <div className="flex flex-wrap gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTempFilters({ ...tempFilters, tag: '' });
                      }}
                      className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                        tempFilters.tag === '' 
                          ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200' 
                          : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      All
                    </button>
                    {tagOptions.map(tag => (
                      <button
                        key={tag}
                        onClick={(e) => {
                          e.stopPropagation();
                          setTempFilters({ ...tempFilters, tag });
                        }}
                        className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                          tempFilters.tag === tag 
                            ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200' 
                            : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Client Note Modal */}
      {noteModalClient && (
        <ClientNoteModal
          isOpen={!!noteModalClient}
          onClose={() => {
            isSavingNoteRef.current = false;
            setNoteModalClient(null);
          }}
          clientId={noteModalClient.id}
          currentNote={noteModalClient.notes}
          onSave={handleNoteSave}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!deletingClient}
        onClose={() => setDeletingClient(null)}
        onConfirm={handleDelete}
        title="Delete Client"
        message={
          deletingClient ? (
            <>
              <p className="mb-2">Are you sure you want to delete this client? This action cannot be undone.</p>
              {(() => {
                const clientTasks = deletingClient ? getTasksByClient(deletingClient.id) : [];
                const clientInvoices = deletingClient ? getInvoicesByClient(deletingClient.id) : [];
                const clientOrders = deletingClient ? getOrdersByClient(deletingClient.id) : [];
                const totalRelated = clientTasks.length + clientInvoices.length + clientOrders.length;
                
                if (totalRelated > 0) {
                  return (
                    <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                        ⚠️ This will also delete {totalRelated} related record{totalRelated !== 1 ? 's' : ''}:
                      </p>
                      <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1 list-disc list-inside">
                        {clientTasks.length > 0 && (
                          <li>{clientTasks.length} task{clientTasks.length !== 1 ? 's' : ''}</li>
                        )}
                        {clientInvoices.length > 0 && (
                          <li>{clientInvoices.length} invoice{clientInvoices.length !== 1 ? 's' : ''}</li>
                        )}
                        {clientOrders.length > 0 && (
                          <li>{clientOrders.length} order{clientOrders.length !== 1 ? 's' : ''}</li>
                        )}
                      </ul>
                    </div>
                  );
                }
                return null;
              })()}
            </>
          ) : (
            'Are you sure you want to delete this client? This action cannot be undone.'
          )
        }
        recordDetails={
          deletingClient ? (
            <div className="space-y-1">
              <p className="font-medium text-blue-900 dark:text-blue-200">{deletingClient.name}</p>
              {deletingClient.email && (
                <p className="text-sm text-blue-700 dark:text-blue-300">{deletingClient.email}</p>
              )}
              {deletingClient.company_name && (
                <p className="text-sm text-blue-700 dark:text-blue-300">{deletingClient.company_name}</p>
              )}
            </div>
          ) : (
            <div>No client selected</div>
          )
        }
      />
    </>
  );
};

