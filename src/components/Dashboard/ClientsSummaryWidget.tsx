import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { ArrowRight, Info, X, RefreshCw, AlertCircle, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useClientStore } from '../../store/useClientStore';
import { StatCard } from './StatCard';
import { formatCurrency } from '../../utils/currency';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { getPreference, setPreference } from '../../lib/userPreferences';
import { useAuthStore } from '../../store/authStore';

interface ClientsSummaryWidgetProps {
  filterCurrency?: string;
}

export const ClientsSummaryWidget: React.FC<ClientsSummaryWidgetProps> = ({ 
  filterCurrency 
}) => {
  const { user } = useAuthStore();
  const { 
    clients, 
    invoices, 
    loading: storeLoading, 
    error: storeError,
    fetchClients, 
    fetchInvoices 
  } = useClientStore();
  const [localLoading, setLocalLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [showInfoMobileModal, setShowInfoMobileModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showCrossTooltip, setShowCrossTooltip] = useState(false);
  const { isMobile } = useMobileDetection();
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Widget visibility state - hybrid approach (localStorage + database)
  const [showClientsWidget, setShowClientsWidget] = useState(() => {
    const saved = localStorage.getItem('showClientsWidget');
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  // Listen for localStorage changes to sync with other pages
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'showClientsWidget' && e.newValue !== null) {
        setShowClientsWidget(JSON.parse(e.newValue));
      }
    };

    const handleCustomStorageChange = () => {
      const saved = localStorage.getItem('showClientsWidget');
      if (saved !== null) {
        setShowClientsWidget(JSON.parse(saved));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('showClientsWidgetChanged', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('showClientsWidgetChanged', handleCustomStorageChange);
    };
  }, []);
  
  const tooltipRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Load user preferences for Clients widget visibility
  useEffect(() => {
    if (user?.id) {
      const loadPreferences = async () => {
        try {
          const showWidget = await getPreference(user.id, 'showClientsWidget', true);
          setShowClientsWidget(showWidget);
          localStorage.setItem('showClientsWidget', JSON.stringify(showWidget));
        } catch (error) {
          // Keep current localStorage value if database fails
        }
      };
      loadPreferences();
    }
  }, [user?.id]);

  // Track if we've fetched to prevent infinite loops
  const [hasFetched, setHasFetched] = useState(false);
  
  // Fetch data with proper error handling
  const loadData = useCallback(async () => {
    if (hasFetched) return; // Prevent multiple calls
    
    try {
      setLocalLoading(true);
      setError(null);
      await Promise.all([
        fetchClients(),
        fetchInvoices()
      ]);
      setHasFetched(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to load clients data');
      console.error('Error loading clients data:', err);
      setHasFetched(true); // Mark as fetched even on error to prevent retry loops
    } finally {
      setLocalLoading(false);
    }
  }, [fetchClients, fetchInvoices, hasFetched]);

  // Initial data fetch - only once
  useEffect(() => {
    if (!hasFetched) {
    loadData();
    }
  }, [loadData, hasFetched]);

  // Listen for global refresh events
  useEffect(() => {
    const handleDataRefresh = () => {
      loadData();
    };

    window.addEventListener('dataRefreshed', handleDataRefresh);
    return () => {
      window.removeEventListener('dataRefreshed', handleDataRefresh);
    };
  }, [loadData]);

  // Sync with store loading and error states
  useEffect(() => {
    if (storeError) {
      setError(storeError);
    }
  }, [storeError]);

  // Combine local and store loading states
  const loading = localLoading || storeLoading;

  // Handle hover events for cross icon (desktop only)
  const handleMouseEnter = () => {
    if (!isMobile) {
      setIsHovered(true);
      setShowCrossTooltip(true);
      
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
      
      tooltipTimeoutRef.current = setTimeout(() => {
        setShowCrossTooltip(false);
      }, 1000);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setIsHovered(false);
      setShowCrossTooltip(false);
      
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
        tooltipTimeoutRef.current = null;
      }
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);

  // Save Clients widget visibility preference (hybrid approach)
  const handleClientsWidgetToggle = async (show: boolean) => {
    // Immediate UI update (optimistic update)
    setShowClientsWidget(show);
    localStorage.setItem('showClientsWidget', JSON.stringify(show));
    window.dispatchEvent(new CustomEvent('showClientsWidgetChanged'));
    
    // Save to database asynchronously (non-blocking)
    if (user?.id) {
      setPreference(user.id, 'showClientsWidget', show).catch(() => {
        // Silent fail - already saved locally
      });
    }
  };

  // Memoize filtered invoices to avoid multiple filters
  const filteredInvoices = useMemo(() => {
    if (!filterCurrency) return invoices;
    return invoices.filter(i => i.currency === filterCurrency);
  }, [invoices, filterCurrency]);

  // Memoize client status counts to avoid repeated filtering
  const clientStatusCounts = useMemo(() => {
    return {
      active: clients.filter(c => c.status === 'active').length,
      inactive: clients.filter(c => c.status === 'inactive').length,
      archived: clients.filter(c => c.status === 'archived').length,
    };
  }, [clients]);

  // Calculate statistics with optimized calculations
  const stats = useMemo(() => {
    const totalClients = clients.length;
    const activeClients = clientStatusCounts.active;
    
    const totalRevenue = filteredInvoices
      .filter(i => i.payment_status === 'paid')
      .reduce((sum, i) => sum + (i.total_amount || 0), 0);
    
    const outstandingInvoices = filteredInvoices
      .filter(i => i.payment_status !== 'paid' && i.payment_status !== 'cancelled')
      .length;

    return {
      totalClients,
      activeClients,
      totalRevenue,
      outstandingInvoices
    };
  }, [clients.length, clientStatusCounts.active, filteredInvoices]);

  // Get recent clients (last 5) - optimized
  const recentClients = useMemo(() => {
    if (clients.length === 0) return [];
    return [...clients]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [clients]);

  // Don't render if widget is hidden
  if (!showClientsWidget) {
    return null;
  }

  // Show empty state with helpful message instead of returning null
  const showEmptyState = !loading && !error && clients.length === 0;

  if (loading && clients.length === 0) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-xl p-3 sm:p-4 md:p-5 lg:p-6 shadow-sm border border-blue-200/50 dark:border-blue-800/50 animate-pulse flex flex-col min-h-[200px] sm:min-h-[240px]">
        <div className="flex items-center justify-between gap-2 sm:gap-3 mb-2 sm:mb-3 min-w-0">
          <div className="h-4 sm:h-5 md:h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 sm:w-40 md:w-48"></div>
          <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-12 sm:w-16 md:w-20 flex-shrink-0"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3 md:gap-4 lg:gap-5 mb-0 flex-1">
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-2 sm:p-3 md:p-4">
            <div className="h-3 sm:h-4 md:h-5 bg-gray-200 dark:bg-gray-700 rounded w-16 sm:w-20 md:w-24 mb-1 sm:mb-2"></div>
            <div className="h-4 sm:h-5 md:h-6 lg:h-7 bg-gray-200 dark:bg-gray-700 rounded w-12 sm:w-16 md:w-20"></div>
          </div>
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-2 sm:p-3 md:p-4">
            <div className="h-3 sm:h-4 md:h-5 bg-gray-200 dark:bg-gray-700 rounded w-16 sm:w-20 md:w-24 mb-1 sm:mb-2"></div>
            <div className="h-4 sm:h-5 md:h-6 lg:h-7 bg-gray-200 dark:bg-gray-700 rounded w-12 sm:w-16 md:w-20"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && clients.length === 0) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-xl p-3 sm:p-4 md:p-5 lg:p-6 shadow-sm border border-red-200/50 dark:border-red-800/50 flex flex-col items-center justify-center min-h-[200px] sm:min-h-[240px] gap-3 sm:gap-4">
        <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 text-red-500 dark:text-red-400" />
        <div className="text-center">
          <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
            Failed to load clients
          </p>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 px-2">
            {error}
          </p>
          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            aria-label="Retry loading clients"
          >
            <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (showEmptyState) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-xl p-3 sm:p-4 md:p-5 lg:p-6 shadow-sm border border-blue-200/50 dark:border-blue-800/50 flex flex-col items-center justify-center min-h-[200px] sm:min-h-[240px] gap-3 sm:gap-4 text-center">
        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
            No clients yet
          </p>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 px-2 max-w-xs sm:max-w-sm">
            Start managing your clients by adding your first client
          </p>
          <Link
            to="/clients?action=add"
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
            Add First Client
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-xl p-3 sm:p-4 md:p-5 lg:p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-blue-200/50 dark:border-blue-800/50 hover:border-blue-300 dark:hover:border-blue-700 relative h-full flex flex-col min-h-[200px] sm:min-h-[240px]"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      ref={cardRef}
    >
      {/* Action buttons - hover on desktop, always visible on mobile */}
      {(isHovered || isMobile) && (
        <div className="absolute top-2 right-2 flex items-center gap-1 sm:gap-2 z-10">
          {/* Refresh button */}
          <button
            onClick={loadData}
            disabled={loading}
            className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
            aria-label="Refresh clients data"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {/* Hide button */}
          <button
            onClick={() => handleClientsWidgetToggle(false)}
            className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors touch-manipulation"
            aria-label="Hide Clients widget"
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {/* Tooltip - only on desktop */}
            {showCrossTooltip && !isMobile && (
              <div className="absolute bottom-full right-0 mb-1 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded shadow-lg whitespace-nowrap z-20">
                Click to hide this widget
                <div className="absolute -bottom-1 right-2 w-2 h-2 bg-gray-900 dark:bg-gray-100 rotate-45"></div>
              </div>
            )}
          </button>
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between gap-2 sm:gap-3 mb-2 sm:mb-3 md:mb-4 min-w-0 pr-12 sm:pr-16">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate">Clients</h2>
          <div className="relative flex items-center">
            <button
              type="button"
              className="ml-1 p-1 sm:p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 focus:outline-none transition-all duration-200 hover:scale-110 active:scale-95 touch-manipulation"
              onMouseEnter={() => !isMobile && setShowInfoTooltip(true)}
              onMouseLeave={() => !isMobile && setShowInfoTooltip(false)}
              onFocus={() => !isMobile && setShowInfoTooltip(true)}
              onBlur={() => !isMobile && setShowInfoTooltip(false)}
              onClick={() => {
                if (isMobile) {
                  setShowInfoMobileModal(true);
                } else {
                  setShowInfoTooltip(v => !v);
                }
              }}
              tabIndex={0}
              aria-label="Show clients info"
            >
              <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200" />
            </button>
            {showInfoTooltip && !isMobile && (
              <div 
                ref={tooltipRef}
                className="absolute left-1/2 top-full z-40 mt-2 w-72 sm:w-80 md:w-96 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl p-3 sm:p-4 md:p-5 text-xs sm:text-sm text-gray-700 dark:text-gray-200 animate-fadein"
              >
                <div className="space-y-2 sm:space-y-3 md:space-y-4">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                    <div className="min-w-0">
                      <div className="font-semibold text-[11px] sm:text-xs md:text-sm text-gray-900 dark:text-gray-100 mb-0.5 sm:mb-1 truncate">Active:</div>
                      <div className="font-medium text-[11px] sm:text-xs md:text-sm bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                        {clientStatusCounts.active}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-[11px] sm:text-xs md:text-sm text-gray-900 dark:text-gray-100 mb-0.5 sm:mb-1 truncate">Inactive:</div>
                      <div className="font-medium text-[11px] sm:text-xs md:text-sm bg-gradient-to-r from-gray-600 to-gray-600 bg-clip-text text-transparent">
                        {clientStatusCounts.inactive}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-[11px] sm:text-xs md:text-sm text-gray-900 dark:text-gray-100 mb-0.5 sm:mb-1 truncate">Archived:</div>
                      <div className="font-medium text-[11px] sm:text-xs md:text-sm bg-gradient-to-r from-gray-600 to-gray-600 bg-clip-text text-transparent">
                        {clientStatusCounts.archived}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-[11px] sm:text-xs md:text-sm text-gray-900 dark:text-gray-100 mb-0.5 sm:mb-1 truncate">Total Revenue:</div>
                      <div className="font-medium text-[11px] sm:text-xs md:text-sm bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent break-words">
                        {formatCurrency(stats.totalRevenue, filterCurrency || 'USD')}
                      </div>
                    </div>
                  </div>

                  {/* Recent Clients */}
                  {recentClients.length > 0 && (
                    <>
                      <div className="border-t border-gray-200 dark:border-gray-700 mt-2"></div>
                      <div>
                        <div className="mb-1">
                          <div className="font-semibold text-gray-900 dark:text-gray-100 text-[10px] sm:text-[11px]">Recent Clients</div>
                        </div>
                        <ul className="space-y-0.5 max-h-32 sm:max-h-40 overflow-y-auto">
                          {recentClients.map((client) => (
                            <li key={client.id} className="flex items-center justify-between rounded hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors py-0.5">
                              <span className="truncate flex-1 text-[10px] sm:text-[11px] text-gray-700 dark:text-gray-300 min-w-0" title={client.name}>
                                {client.name}
                              </span>
                              <span className={`ml-2 text-[10px] sm:text-[11px] font-medium flex-shrink-0 ${
                                client.status === 'active' ? 'text-green-600 dark:text-green-400' :
                                client.status === 'inactive' ? 'text-gray-500 dark:text-gray-400' :
                                'text-gray-400 dark:text-gray-500'
                              }`}>
                                {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        <Link 
          to="/clients" 
          className="text-xs sm:text-sm md:text-base font-medium flex items-center space-x-1 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-purple-700 transition-all duration-200 touch-manipulation"
        >
          <span className="hidden sm:inline">View All</span>
          <span className="sm:hidden">All</span>
          <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </Link>
      </div>

      {/* Error banner if there's an error but we have data */}
      {error && clients.length > 0 && (
        <div className="mb-2 sm:mb-3 p-2 sm:p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg flex items-center gap-2 text-xs sm:text-sm">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
          <span className="text-red-700 dark:text-red-300 flex-1 truncate">{error}</span>
          <button
            onClick={loadData}
            disabled={loading}
            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-50"
            aria-label="Retry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      )}

      {/* Two Main Sections */}
      <div className="grid grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3 md:gap-4 lg:gap-5 mb-0 flex-1">
        <div className="w-full relative min-w-0">
          <StatCard
            title="Total Clients"
            value={stats.totalClients.toString()}
            color="blue"
          />
        </div>
        <div className="w-full relative min-w-0">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats.totalRevenue, filterCurrency || 'USD')}
            color="purple"
          />
        </div>
      </div>

      {/* Mobile Info Modal */}
      {showInfoMobileModal && isMobile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowInfoMobileModal(false)} />
          <div className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg p-3 sm:p-4 md:p-5 w-[90vw] sm:w-80 md:w-96 max-w-md animate-fadein max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3 sm:mb-4 sticky top-0 bg-white dark:bg-gray-900 pb-2 border-b border-gray-200 dark:border-gray-700">
              <div className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100">Clients Info</div>
              <button
                onClick={() => setShowInfoMobileModal(false)}
                className="p-1.5 sm:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-manipulation"
                aria-label="Close modal"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="space-y-3 sm:space-y-4 md:space-y-5">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                <div className="min-w-0">
                  <div className="font-semibold text-xs sm:text-sm md:text-base text-gray-900 dark:text-gray-100 mb-1 sm:mb-1.5 truncate">Active:</div>
                  <div className="font-medium text-xs sm:text-sm md:text-base bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                    {clientStatusCounts.active}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-xs sm:text-sm md:text-base text-gray-900 dark:text-gray-100 mb-1 sm:mb-1.5 truncate">Inactive:</div>
                  <div className="font-medium text-xs sm:text-sm md:text-base bg-gradient-to-r from-gray-600 to-gray-600 bg-clip-text text-transparent">
                    {clientStatusCounts.inactive}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-xs sm:text-sm md:text-base text-gray-900 dark:text-gray-100 mb-1 sm:mb-1.5 truncate">Archived:</div>
                  <div className="font-medium text-xs sm:text-sm md:text-base bg-gradient-to-r from-gray-600 to-gray-600 bg-clip-text text-transparent">
                    {clientStatusCounts.archived}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-xs sm:text-sm md:text-base text-gray-900 dark:text-gray-100 mb-1 sm:mb-1.5 truncate">Total Revenue:</div>
                  <div className="font-medium text-xs sm:text-sm md:text-base bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent break-words">
                    {formatCurrency(stats.totalRevenue, filterCurrency || 'USD')}
                  </div>
                </div>
              </div>

              {/* Recent Clients */}
              {recentClients.length > 0 && (
                <>
                  <div className="border-t border-gray-200 dark:border-gray-700 mt-3"></div>
                  <div>
                    <div className="mb-1">
                      <div className="font-semibold text-[10px] sm:text-xs text-gray-900 dark:text-gray-100">Recent Clients</div>
                    </div>
                    <ul className="space-y-1 max-h-32 sm:max-h-40 overflow-y-auto">
                      {recentClients.map((client) => (
                        <li key={client.id} className="flex items-center justify-between rounded hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors py-0.5">
                          <span className="truncate flex-1 text-[10px] sm:text-xs text-gray-700 dark:text-gray-300 min-w-0" title={client.name}>
                            {client.name}
                          </span>
                          <span className={`ml-2 text-[10px] sm:text-xs font-medium flex-shrink-0 ${
                            client.status === 'active' ? 'text-green-600 dark:text-green-400' :
                            client.status === 'inactive' ? 'text-gray-500 dark:text-gray-400' :
                            'text-gray-400 dark:text-gray-500'
                          }`}>
                            {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

