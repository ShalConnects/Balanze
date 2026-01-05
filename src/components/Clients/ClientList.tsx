import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, Building2, Mail, Phone, MapPin, Tag, X, Filter, FileText, ShoppingCart, ChevronUp, ChevronDown, Info, ChevronRight } from 'lucide-react';
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
    deleteClient
  } = useClientStore();

  const { isMobile } = useMobileDetection();
  const { canCreateClient, usageStats, isAtLimit } = usePlanFeatures();
  
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
          status: parsed.status || 'all',
          currency: parsed.currency || '',
          source: parsed.source || ''
        };
      } catch {
        // If parsing fails, use defaults
      }
    }
    return {
      search: '',
      status: 'all', // 'all', 'active', 'inactive', 'archived'
      currency: '',
      source: ''
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

  // Menu states
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);
  const [showMobileFilterMenu, setShowMobileFilterMenu] = useState(false);

  // Temporary filter state for mobile modal
  const [tempFilters, setTempFilters] = useState(tableFilters);

  // Refs for dropdown menus
  const statusMenuRef = useRef<HTMLDivElement>(null);
  const currencyMenuRef = useRef<HTMLDivElement>(null);
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

  // Filter clients based on tableFilters
  const filteredClients = useMemo(() => {
    let filtered = clients.filter((client) => {
      const matchesSearch = !tableFilters.search || 
        client.name.toLowerCase().includes(tableFilters.search.toLowerCase()) ||
        client.email?.toLowerCase().includes(tableFilters.search.toLowerCase()) ||
        client.phone?.toLowerCase().includes(tableFilters.search.toLowerCase()) ||
        client.company_name?.toLowerCase().includes(tableFilters.search.toLowerCase());

      const matchesStatus = tableFilters.status === 'all' || client.status === tableFilters.status;
      const matchesCurrency = !tableFilters.currency || client.default_currency === tableFilters.currency;

      return matchesSearch && matchesStatus && matchesCurrency;
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
  }, [clients, tableFilters, sortConfig]);

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

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingClient(null);
    fetchClients(); // Refresh list after form closes
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
      <div>
        {/* Unified Table View - matching AccountsView structure */}
        <div className="space-y-6">
          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <span className="text-red-600 dark:text-red-400 font-medium">⚠️ Error loading clients:</span>
                <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
              </div>
              <p className="text-red-600 dark:text-red-400 text-sm mt-2">
                The page will still work, but client data may be incomplete. Please check your database connection or run the migration.
              </p>
            </div>
          )}
          
          {/* Client Tasks Widget - Outside table */}
          <ClientTasksWidget />
          
          {/* Unified Filters and Table */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 pb-[13px] lg:pb-0">
            {/* Filters Section */}
            <div className="p-2 sm:p-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1" style={{ marginBottom: 0 }}>
                {/* Search */}
                <div>
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
                        (tableFilters.currency || tableFilters.status !== 'all')
                          ? 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                      style={(tableFilters.currency || tableFilters.status !== 'all') ? { background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' } : {}}
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
                   {(tableFilters.search || tableFilters.currency || tableFilters.status !== 'all' || tableFilters.source) && (
                     <button
                       onClick={() => setTableFilters({ search: '', currency: '', status: 'all', source: '' })}
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
                        tableFilters.status !== 'all' 
                          ? 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                      style={tableFilters.status !== 'all' ? { background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' } : {}}
                    >
                      <span>{tableFilters.status === 'all' ? 'All Status' : tableFilters.status.charAt(0).toUpperCase() + tableFilters.status.slice(1)}</span>
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

                  {/* Clear Filters */}
                  {(tableFilters.search || tableFilters.currency || tableFilters.status !== 'all') && (
                    <button
                      onClick={() => setTableFilters({ search: '', currency: '', status: 'all', source: '' })}
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
                    className={`px-3 py-1.5 h-8 rounded-md transition-colors flex items-center space-x-1.5 text-[13px] ${
                      canCreateClient()
                        ? 'bg-gradient-primary text-white hover:bg-gradient-primary-hover'
                        : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Client</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Summary Cards - matching AccountsView pattern */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3 lg:gap-4 p-2 sm:p-3 lg:p-4">
              {(() => {
                const activeClients = filteredClients.filter(c => c.status === 'active');
                const inactiveClients = filteredClients.filter(c => c.status === 'inactive');
                const archivedClients = filteredClients.filter(c => c.status === 'archived');
                const totalOrders = filteredClients.reduce((sum, client) => {
                  return sum + getOrdersByClient(client.id).length;
                }, 0);
                const totalInvoices = filteredClients.reduce((sum, client) => {
                  return sum + getInvoicesByClient(client.id).length;
                }, 0);
                
                return (
                  <>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 sm:py-2 px-1.5 sm:px-2">
                      <div className="flex items-center justify-between">
                        <div className="text-left min-w-0 flex-1">
                          <p className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 truncate">{tableFilters.status === 'all' ? 'All Clients' : 'Active Clients'}</p>
                          <p className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-lg sm:text-xl lg:text-[1.2rem]">
                            {tableFilters.status === 'all' ? filteredClients.length : activeClients.length}
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
                              }
                              return `${activeClients.length} active clients`;
                            })()}
                          </p>
                        </div>
                        <Building2 className="text-blue-600 w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 sm:py-2 px-1.5 sm:px-2">
                      <div className="flex items-center justify-between">
                        <div className="text-left min-w-0 flex-1">
                          <p className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 truncate">Total Orders</p>
                          <p className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-lg sm:text-xl lg:text-[1.2rem]">{totalOrders}</p>
                          <p className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-[11px] truncate">
                            {totalOrders > 0 ? `${totalOrders} orders` : 'No orders'}
                          </p>
                        </div>
                        <span className="text-blue-600 text-lg sm:text-xl lg:text-[1.2rem] flex-shrink-0">#</span>
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
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 sm:py-2 px-1.5 sm:px-2">
                      <div className="flex items-center justify-between">
                        <div className="text-left min-w-0 flex-1">
                          <p className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 truncate">Inactive</p>
                          <p className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-lg sm:text-xl lg:text-[1.2rem]">
                            {inactiveClients.length}
                          </p>
                          <p className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-[11px] truncate">
                            {inactiveClients.length > 0 ? `${inactiveClients.length} inactive` : 'No inactive clients'}
                          </p>
                        </div>
                        <span className="text-yellow-600 text-lg sm:text-xl lg:text-[1.2rem] flex-shrink-0">⚠</span>
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
                        <td colSpan={6} className="py-16 text-center">
                          <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                            <Building2 className="w-12 h-12 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No client records found</h3>
                          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                            {tableFilters.search || tableFilters.currency || tableFilters.status !== 'all' || tableFilters.source
                              ? 'No clients match your filters'
                              : 'Start managing your clients by adding your first client'}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredClients.map((client) => {
                        const isSelected = selectedId === client.id;
                        const isFromSearchSelection = isFromSearch && isSelected;
                        
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
                                  <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {client.name}
                                  </div>
                                  {client.tags && client.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {client.tags.slice(0, 2).map((tag) => (
                                        <span
                                          key={tag}
                                          className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-[10px]"
                                        >
                                          <Tag className="w-2.5 h-2.5" />
                                          {tag}
                                        </span>
                                      ))}
                                      {client.tags.length > 2 && (
                                        <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-[10px]">
                                          +{client.tags.length - 2}
                                        </span>
                                      )}
                                    </div>
                                  )}
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
                              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(client);
                                  }}
                                  className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 p-1"
                                  aria-label="Edit client"
                                  title="Edit"
                                >
                                  <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeletingClient(client);
                                  }}
                                  className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-1"
                                  aria-label="Delete client"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                          
                          {/* Expanded Row Content */}
                          {isRowExpanded(client.id) && (
                          <tr className="bg-gray-50 dark:bg-gray-800">
                            <td colSpan={6} className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
                                  {/* Contact & Company */}
                                  <div className="space-y-2 sm:space-y-3">
                                    <h4 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">Contact & Company</h4>
                                    <div className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-300 space-y-1.5 sm:space-y-2">
                                      {/* Contact Information */}
                                      {(client.email || client.phone) && (
                                        <div className="space-y-1">
                                          {client.email && (
                                            <div className="flex items-center gap-1.5">
                                              <Mail className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                              <span className="break-words">{client.email}</span>
                                            </div>
                                          )}
                                          {client.phone && (
                                            <div className="flex items-center gap-1.5">
                                              <Phone className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                              <span>{client.phone}</span>
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
                                      
                                      {/* Notes */}
                                      {client.notes && (
                                        <div className="pt-1 space-y-1 border-t border-gray-200 dark:border-gray-700">
                                          <div>
                                            <span className="font-medium">Notes:</span>
                                            <div className="mt-1 text-gray-500 dark:text-gray-400 break-words">{client.notes}</div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Financial Summary */}
                                  <div className="space-y-2 sm:space-y-3">
                                    <h4 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">Financial Summary</h4>
                                    <div className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-300 space-y-2 sm:space-y-2.5">
                                      <div>
                                        <span className="font-medium">Created:</span> {new Date(client.created_at).toLocaleDateString()}
                                      </div>
                                      {(() => {
                                        const clientOrders = getOrdersByClient(client.id);
                                        const clientInvoices = getInvoicesByClient(client.id);
                                        const totalOrderValue = clientOrders.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);
                                        const totalInvoiceValue = clientInvoices.reduce((sum, invoice) => sum + (Number(invoice.total_amount) || 0), 0);
                                        const paidInvoices = clientInvoices.filter(inv => inv.payment_status === 'paid');
                                        const unpaidInvoices = clientInvoices.filter(inv => inv.payment_status === 'unpaid' || inv.payment_status === 'partial');
                                        const paidInvoiceValue = paidInvoices.reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0);
                                        const unpaidInvoiceValue = unpaidInvoices.reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0);
                                        const currency = client.default_currency || 'USD';
                                        const currencySymbol = {
                                          USD: '$', BDT: '৳', EUR: '€', GBP: '£', JPY: '¥', INR: '₹', CAD: '$', AUD: '$'
                                        }[currency] || currency;
                                        
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
                                            return <div className="text-gray-400 italic text-[10px]">No invoices yet</div>;
                                          }
                                          
                                          const currency = client.default_currency || 'USD';
                                          const currencySymbol = {
                                            USD: '$', BDT: '৳', EUR: '€', GBP: '£', JPY: '¥', INR: '₹', CAD: '$', AUD: '$'
                                          }[currency] || currency;
                                          
                                          return clientInvoices
                                            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                            .slice(0, 5)
                                            .map((invoice) => {
                                              const statusColors = {
                                                draft: 'text-gray-600 dark:text-gray-400',
                                                sent: 'text-blue-600 dark:text-blue-400',
                                                paid: 'text-green-600 dark:text-green-400',
                                                overdue: 'text-red-600 dark:text-red-400',
                                                cancelled: 'text-gray-400 dark:text-gray-500'
                                              };
                                              
                                              const paymentStatusColors = {
                                                unpaid: 'text-yellow-600 dark:text-yellow-400',
                                                partial: 'text-orange-600 dark:text-orange-400',
                                                paid: 'text-green-600 dark:text-green-400'
                                              };
                                              
                                              return (
                                                <div key={invoice.id} className="p-1.5 bg-gray-50 dark:bg-gray-800/50 rounded text-[10px]">
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
                                                          className={`text-[10px] font-medium px-2 py-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${statusColors[invoice.status] || 'text-gray-600'}`}
                                                        >
                                                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                                        </button>
                                                        {invoiceStatusMenuOpen === invoice.id && (
                                                          <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg min-w-[140px]">
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
                                                                className={`w-full text-left px-3 py-1.5 text-[11px] hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
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
                                                      <div className={`text-[10px] mt-0.5 ${paymentStatusColors[invoice.payment_status] || 'text-gray-400'}`}>
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
                                    <div className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-300 space-y-1.5 sm:space-y-2">
                                      {(() => {
                                        const clientTasks = getTasksByClient(client.id);
                                        
                                        if (clientTasks.length === 0) {
                                          return <div className="text-gray-400 italic">No tasks yet</div>;
                                        }
                                        
                                        return clientTasks
                                          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                          .slice(0, 5)
                                          .map((task) => {
                                            const priorityColors = {
                                              low: 'text-gray-600 dark:text-gray-400',
                                              medium: 'text-blue-600 dark:text-blue-400',
                                              high: 'text-orange-600 dark:text-orange-400',
                                              urgent: 'text-red-600 dark:text-red-400'
                                            };
                                            
                                            const statusColors = {
                                              in_progress: 'text-blue-600 dark:text-blue-400',
                                              waiting_on_client: 'text-yellow-600 dark:text-yellow-400',
                                              waiting_on_me: 'text-purple-600 dark:text-purple-400',
                                              completed: 'text-green-600 dark:text-green-400',
                                              cancelled: 'text-gray-400 dark:text-gray-500'
                                            };
                                            
                                            // Check if task is overdue
                                            const isOverdue = task.due_date && task.status !== 'completed' && task.status !== 'cancelled' 
                                              ? new Date(task.due_date) < new Date(new Date().setHours(0, 0, 0, 0))
                                              : false;
                                            const daysOverdue = isOverdue && task.due_date
                                              ? Math.floor((new Date().getTime() - new Date(task.due_date).getTime()) / (1000 * 60 * 60 * 24))
                                              : 0;
                                            
                                            return (
                                              <div key={task.id} className={`flex justify-between items-start p-2 rounded-md ${isOverdue ? 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/50' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
                                                <div className="flex-1 min-w-0">
                                                  <div className="font-medium truncate">{task.title}</div>
                                                  {task.description && (
                                                    <div className="text-gray-500 dark:text-gray-400 text-[10px] mt-0.5 line-clamp-1">
                                                      {task.description}
                                                    </div>
                                                  )}
                                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                    {task.due_date && (
                                                      <span className={`text-[10px] ${isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                                                        {isOverdue ? `Overdue ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''}` : `Due: ${new Date(task.due_date).toLocaleDateString()}`}
                                                      </span>
                                                    )}
                                                    {isOverdue && (
                                                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-medium">
                                                        Overdue
                                                      </span>
                                                    )}
                                                    <span className={`text-[10px] font-medium ${priorityColors[task.priority]}`}>
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
                                                      className={`text-[10px] font-medium px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${statusColors[task.status]}`}
                                                    >
                                                      {task.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                    </button>
                                                    {taskStatusMenuOpen === task.id && (
                                                      <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg min-w-[160px]">
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
                                                            className={`w-full text-left px-3 py-1.5 text-[11px] hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
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
                                                    <div className="text-[10px] text-gray-400 mt-0.5">
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

              {/* Mobile/Tablet Card View */}
              <div className="lg:hidden">
                {filteredClients.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Building2 className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No clients yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                      {tableFilters.search || tableFilters.currency || tableFilters.status !== 'all' || tableFilters.source
                        ? 'No clients match your filters'
                        : 'Start managing your clients by adding your first client'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 p-4">
                    {filteredClients.map((client) => {
                      const clientOrders = getOrdersByClient(client.id);
                      const clientInvoices = getInvoicesByClient(client.id);
                      
                      return (
                        <div
                          key={client.id}
                          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-all duration-200"
                        >
                          {/* Client Header */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div 
                                className={`w-3 h-3 rounded-full ${client.status === 'active' ? 'bg-green-500' : client.status === 'inactive' ? 'bg-yellow-500' : 'bg-gray-400'}`}
                                role="status"
                                aria-label={`${client.status} client`}
                              />
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {client.name}
                                </div>
                                {client.company_name && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    {client.company_name}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-500 dark:text-gray-400">{client.default_currency || 'USD'}</div>
                              {getStatusBadge(client.status)}
                            </div>
                          </div>

                          {/* Client Stats */}
                          <div className="flex items-center justify-between mb-3 text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-3">
                              <span>{clientOrders.length} orders</span>
                              <span>{clientInvoices.length} invoices</span>
                            </div>
                            {client.source && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                {client.source}
                              </span>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                            <button
                              onClick={() => toggleRowExpansion(client.id)}
                              className="flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium"
                            >
                              <Info className="w-4 h-4 mr-1" />
                              Details
                              <ChevronRight className={`w-4 h-4 ml-1 transition-transform ${isRowExpanded(client.id) ? 'rotate-90' : ''}`} />
                            </button>
                            
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
                                onClick={() => setDeletingClient(client)}
                                className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Delete client"
                                aria-label={`Delete ${client.name} client`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Expanded Content - Mobile */}
                          {isRowExpanded(client.id) && (
                            <div className="mt-3 pt-3 sm:pt-4 border-t border-gray-100 dark:border-gray-700">
                              <div className="space-y-3 sm:space-y-4">
                                {/* Contact Info */}
                                {(client.email || client.phone || client.address || client.city || client.state || client.postal_code || client.country) && (
                                  <div>
                                    <h4 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1.5 sm:mb-2">Contact</h4>
                                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 space-y-1 sm:space-y-1.5">
                                      {client.email && (
                                        <div className="flex items-center gap-1.5">
                                          <Mail className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                          <span className="truncate">{client.email}</span>
                                        </div>
                                      )}
                                      {client.phone && (
                                        <div className="flex items-center gap-1.5">
                                          <Phone className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                          <span>{client.phone}</span>
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

                                {/* Company Info */}
                                {(client.company_name || client.tax_id || client.website || client.source) && (
                                  <div>
                                    <h4 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1.5 sm:mb-2">Company</h4>
                                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 space-y-1 sm:space-y-1.5">
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
                                  const clientOrders = getOrdersByClient(client.id);
                                  const clientInvoices = getInvoicesByClient(client.id);
                                  const totalOrderValue = clientOrders.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);
                                  const totalInvoiceValue = clientInvoices.reduce((sum, invoice) => sum + (Number(invoice.total_amount) || 0), 0);
                                  const currency = client.default_currency || 'USD';
                                  const currencySymbol = {
                                    USD: '$', BDT: '৳', EUR: '€', GBP: '£', JPY: '¥', INR: '₹', CAD: '$', AUD: '$'
                                  }[currency] || currency;
                                  
                                  if (clientOrders.length === 0 && clientInvoices.length === 0) {
                                    return null;
                                  }
                                  
                                  return (
                                    <div>
                                      <h4 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1.5 sm:mb-2">Financial Summary</h4>
                                      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 space-y-1 sm:space-y-1.5">
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

                                      {/* Invoices List - Inside Financial Summary */}
                                      <div className="pt-2 sm:pt-3 border-t border-gray-200 dark:border-gray-700 mt-2 sm:mt-3">
                                        <div className="flex items-center justify-between mb-1.5 sm:mb-2 gap-2">
                                          <h5 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Invoices</h5>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setInvoiceClientId(client.id);
                                              setShowInvoiceForm(true);
                                            }}
                                            className="flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors whitespace-nowrap"
                                          >
                                            <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                            Create
                                          </button>
                                        </div>
                                        <div className="space-y-1.5 sm:space-y-2">
                                    {(() => {
                                      const clientInvoices = getInvoicesByClient(client.id);
                                      
                                      if (clientInvoices.length === 0) {
                                        return <div className="text-gray-400 italic text-[10px]">No invoices yet</div>;
                                      }
                                      
                                      const currency = client.default_currency || 'USD';
                                      const currencySymbol = {
                                        USD: '$', BDT: '৳', EUR: '€', GBP: '£', JPY: '¥', INR: '₹', CAD: '$', AUD: '$'
                                      }[currency] || currency;
                                      
                                      return clientInvoices
                                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                        .slice(0, 5)
                                        .map((invoice) => {
                                          const statusColors = {
                                            draft: 'text-gray-600 dark:text-gray-400',
                                            sent: 'text-blue-600 dark:text-blue-400',
                                            paid: 'text-green-600 dark:text-green-400',
                                            overdue: 'text-red-600 dark:text-red-400',
                                            cancelled: 'text-gray-400 dark:text-gray-500'
                                          };
                                          
                                          const paymentStatusColors = {
                                            unpaid: 'text-yellow-600 dark:text-yellow-400',
                                            partial: 'text-orange-600 dark:text-orange-400',
                                            paid: 'text-green-600 dark:text-green-400'
                                          };
                                          
                                          return (
                                            <div key={invoice.id} className="p-1.5 bg-gray-50 dark:bg-gray-800/50 rounded text-[10px]">
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
                                                      className={`text-[10px] font-medium px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${statusColors[invoice.status] || 'text-gray-600'}`}
                                                    >
                                                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                                    </button>
                                                    {invoiceStatusMenuOpen === invoice.id && (
                                                      <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg min-w-[140px]">
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
                                                            className={`w-full text-left px-3 py-1.5 text-[11px] hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
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
                                                  <div className={`text-[10px] mt-0.5 ${paymentStatusColors[invoice.payment_status] || 'text-gray-400'}`}>
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
                                    </div>
                                  );
                                })()}

                                {/* Tags */}
                                {client.tags && client.tags.length > 0 && (
                                  <div>
                                    <h4 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1.5 sm:mb-2">Tags</h4>
                                    <div className="flex flex-wrap gap-1 sm:gap-1.5">
                                      {client.tags.map((tag) => (
                                        <span
                                          key={tag}
                                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-xs"
                                        >
                                          <Tag className="w-2.5 h-2.5" />
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Tasks */}
                                <div>
                                  <div className="flex items-center justify-between mb-1.5 sm:mb-2 gap-2">
                                    <h4 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Tasks</h4>
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
                                        return <div className="text-gray-400 italic text-[10px]">No tasks yet</div>;
                                      }
                                      
                                      return clientTasks
                                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                        .slice(0, 3)
                                        .map((task) => {
                                          const priorityColors = {
                                            low: 'text-gray-600 dark:text-gray-400',
                                            medium: 'text-blue-600 dark:text-blue-400',
                                            high: 'text-orange-600 dark:text-orange-400',
                                            urgent: 'text-red-600 dark:text-red-400'
                                          };
                                          
                                          const statusColors = {
                                            in_progress: 'text-blue-600 dark:text-blue-400',
                                            waiting_on_client: 'text-yellow-600 dark:text-yellow-400',
                                            waiting_on_me: 'text-purple-600 dark:text-purple-400',
                                            completed: 'text-green-600 dark:text-green-400',
                                            cancelled: 'text-gray-400 dark:text-gray-500'
                                          };
                                          
                                          // Check if task is overdue
                                          const isOverdue = task.due_date && task.status !== 'completed' && task.status !== 'cancelled' 
                                            ? new Date(task.due_date) < new Date(new Date().setHours(0, 0, 0, 0))
                                            : false;
                                          const daysOverdue = isOverdue && task.due_date
                                            ? Math.floor((new Date().getTime() - new Date(task.due_date).getTime()) / (1000 * 60 * 60 * 24))
                                            : 0;
                                          
                                          return (
                                            <div key={task.id} className={`p-1.5 rounded text-[10px] ${isOverdue ? 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/50' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
                                              <div className="font-medium truncate">{task.title}</div>
                                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                {task.due_date && (
                                                  <span className={isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-500 dark:text-gray-400'}>
                                                    {isOverdue ? `Overdue ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''}` : `Due: ${new Date(task.due_date).toLocaleDateString()}`}
                                                  </span>
                                                )}
                                                {isOverdue && (
                                                  <span className="px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-medium">
                                                    Overdue
                                                  </span>
                                                )}
                                                <span className={`font-medium ${priorityColors[task.priority]}`}>
                                                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                                </span>
                                                <div className="relative">
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setTaskStatusMenuOpen(taskStatusMenuOpen === task.id ? null : task.id);
                                                    }}
                                                    className={`font-medium px-2 py-0.5 rounded text-[10px] hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${statusColors[task.status]}`}
                                                  >
                                                    {task.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                  </button>
                                                  {taskStatusMenuOpen === task.id && (
                                                    <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg min-w-[160px]">
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
                                                          className={`w-full text-left px-3 py-1.5 text-[11px] hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
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
                      (tempFilters.currency || tempFilters.status !== 'all' || tempFilters.source)
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
                      setTableFilters({ search: '', currency: '', status: 'all', source: '' });
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
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!deletingClient}
        onClose={() => setDeletingClient(null)}
        onConfirm={handleDelete}
        title="Delete Client"
        message="Are you sure you want to delete this client? This action cannot be undone."
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

