import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Building2, ArrowRight, Info, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useClientStore } from '../../store/useClientStore';
import { StatCard } from './StatCard';
import { formatCurrency } from '../../utils/currency';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { getPreference, setPreference } from '../../lib/userPreferences';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';

interface ClientsOverviewCardProps {
  filterCurrency?: string;
  timeFilter?: '1m' | '3m' | '6m' | '1y' | 'all';
}

export const ClientsOverviewCard: React.FC<ClientsOverviewCardProps> = ({ 
  filterCurrency = '',
  timeFilter = 'all'
}) => {
  const { user } = useAuthStore();
  const { 
    clients, 
    orders,
    invoices,
    loading: storeLoading, 
    fetchClients,
    fetchOrders,
    fetchInvoices,
    getOrdersByClient,
    getInvoicesByClient
  } = useClientStore();
  
  const [loading, setLoading] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showMobileModal, setShowMobileModal] = useState(false);
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

  // Fetch data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchClients(),
          fetchOrders(),
          fetchInvoices()
        ]);
      } catch (error) {
        console.error('Error loading clients data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user, fetchClients, fetchOrders, fetchInvoices]);

  // Set loading to false when we have data
  useEffect(() => {
    if (clients !== undefined) {
      setLoading(false);
    }
  }, [clients]);

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
    localStorage.setItem('showClientsWidget', JSON.stringify(show));
    setShowClientsWidget(show);
    window.dispatchEvent(new CustomEvent('showClientsWidgetChanged'));
    
    if (user?.id) {
      try {
        await setPreference(user.id, 'showClientsWidget', show);
        toast.success('Preference saved!', {
          description: show ? 'Clients widget will be shown' : 'Clients widget hidden'
        });
      } catch (error) {
        toast.error('Failed to save preference', {
          description: 'Your preference will be saved locally only'
        });
      }
    } else {
      toast.info('Preference saved locally', {
        description: 'Sign in to sync preferences across devices'
      });
    }
  };

  // Date range logic based on time filter - memoized for performance
  const { startDate, endDate } = useMemo(() => {
    if (timeFilter === 'all') {
      return { startDate: null, endDate: null };
    }
    
    const now = new Date();
    let start: Date;
    let end: Date;
    
    if (timeFilter === '1m') {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else if (timeFilter === '3m') {
      start = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else if (timeFilter === '6m') {
      start = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else { // '1y'
      start = new Date(now.getFullYear(), now.getMonth() - 11, 1, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }
    
    return { startDate: start, endDate: end };
  }, [timeFilter]);

  // Helper function to check if date is within range (normalize to date only for comparison)
  const isDateInRange = (dateString: string | null | undefined): boolean => {
    if (timeFilter === 'all' || !startDate || !endDate || !dateString) return true;
    const date = new Date(dateString);
    // Normalize dates to midnight for comparison
    const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const normalizedStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const normalizedEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    return normalizedDate >= normalizedStart && normalizedDate <= normalizedEnd;
  };

  // Calculate client statistics
  const clientStats = useMemo(() => {
    const activeClients = clients.filter(c => c.status === 'active');
    const inactiveClients = clients.filter(c => c.status === 'inactive');
    
    // Calculate total value (orders + invoices) filtered by currency and date
    let totalValue = 0;
    clients.forEach(client => {
      const clientOrders = getOrdersByClient(client.id);
      const clientInvoices = getInvoicesByClient(client.id);
      
      // Filter orders by currency and date
      const filteredOrders = clientOrders.filter(order => {
        if (filterCurrency && order.currency !== filterCurrency) return false;
        return isDateInRange(order.order_date || order.created_at);
      });
      
      // Filter invoices by currency and date
      const filteredInvoices = clientInvoices.filter(invoice => {
        if (filterCurrency && invoice.currency !== filterCurrency) return false;
        return isDateInRange(invoice.invoice_date || invoice.created_at);
      });
      
      const orderValue = filteredOrders.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);
      const invoiceValue = filteredInvoices.reduce((sum, invoice) => sum + (Number(invoice.total_amount) || 0), 0);
      totalValue += orderValue + invoiceValue;
    });

    return {
      total: clients.length,
      active: activeClients.length,
      inactive: inactiveClients.length,
      totalValue
    };
  }, [clients, getOrdersByClient, getInvoicesByClient, filterCurrency, timeFilter, startDate, endDate]);

  // Get recent clients for tooltip
  const recentClients = useMemo(() => {
    return clients
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3);
  }, [clients]);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 shadow-sm border border-blue-200/50 dark:border-blue-800/50 h-full flex flex-col">
        <div className="flex items-center justify-between mb-3">
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 flex-1">
          <div className="w-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24 mb-2"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
            </div>
          </div>
          <div className="w-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24 mb-2"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Don't render if no clients
  if (clients.length === 0) {
    return null;
  }

  // Don't render if widget is hidden
  if (!showClientsWidget) {
    return null;
  }

  return (
    <div 
      className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 border border-blue-200/50 dark:border-blue-800/50 hover:border-blue-300 dark:hover:border-blue-700 relative h-full flex flex-col"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Hide button - hover on desktop, always visible on mobile */}
      {(isHovered || isMobile) && (
        <button
          onClick={() => handleClientsWidgetToggle(false)}
          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors z-10"
          aria-label="Hide Clients widget"
        >
          <X className="w-4 h-4" />
          {/* Tooltip - only on desktop */}
          {showCrossTooltip && !isMobile && (
            <div className="absolute bottom-full right-0 mb-1 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded shadow-lg whitespace-nowrap z-20">
              Click to hide this widget
              <div className="absolute -bottom-1 right-2 w-2 h-2 bg-gray-900 dark:bg-gray-100 rotate-45"></div>
            </div>
          )}
        </button>
      )}
      
      {/* Header - Responsive layout */}
      <div className="flex items-center justify-between mb-2 pr-8">
        {/* Left side - Info button */}
        <div className="flex items-center gap-2 flex-1">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Clients</h2>
          <div className="relative flex items-center">
            <button
              type="button"
              className="ml-1 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 focus:outline-none transition-all duration-200 hover:scale-110 active:scale-95"
              onMouseEnter={() => !isMobile && setShowTooltip(true)}
              onMouseLeave={() => !isMobile && setShowTooltip(false)}
              onFocus={() => !isMobile && setShowTooltip(true)}
              onBlur={() => !isMobile && setShowTooltip(false)}
              onClick={() => {
                if (isMobile) {
                  setShowMobileModal(true);
                } else {
                  setShowTooltip(v => !v);
                }
              }}
              tabIndex={0}
              aria-label="Show clients info"
            >
              <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200" />
            </button>
            {showTooltip && !isMobile && (
              <div className="absolute left-1/2 top-full z-50 mt-2 w-72 sm:w-80 md:w-96 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl p-3 sm:p-4 text-xs text-gray-700 dark:text-gray-200 animate-fadein">
                <div className="space-y-2 sm:space-y-3">
                  {/* Client Stats - Side by Side */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {/* Active Clients */}
                    <div className="min-w-0">
                      <div className="font-semibold text-[11px] sm:text-xs text-gray-900 dark:text-gray-100 mb-0.5 truncate">Active ({clientStats.active}):</div>
                      <div className="font-medium text-[11px] sm:text-xs bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent break-words">
                        {clientStats.active} clients
                      </div>
                    </div>

                    {/* Inactive Clients */}
                    <div className="min-w-0">
                      <div className="font-semibold text-[11px] sm:text-xs text-gray-900 dark:text-gray-100 mb-0.5 truncate">Inactive ({clientStats.inactive}):</div>
                      <div className="font-medium text-[11px] sm:text-xs bg-gradient-to-r from-gray-600 to-gray-400 bg-clip-text text-transparent break-words">
                        {clientStats.inactive} clients
                      </div>
                    </div>
                  </div>

                  {/* Total Value */}
                  <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                    <div className="font-semibold text-[11px] sm:text-xs text-gray-900 dark:text-gray-100 mb-0.5">Total Value:</div>
                    <div className="font-medium text-[11px] sm:text-xs bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {formatCurrency(clientStats.totalValue, 'USD')}
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
                          {recentClients.map((client) => {
                            const clientOrders = getOrdersByClient(client.id);
                            const clientInvoices = getInvoicesByClient(client.id);
                            const orderValue = clientOrders.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);
                            const invoiceValue = clientInvoices.reduce((sum, invoice) => sum + (Number(invoice.total_amount) || 0), 0);
                            const totalValue = orderValue + invoiceValue;
                            const currency = client.default_currency || 'USD';
                            
                            return (
                              <li key={client.id} className="flex items-center justify-between rounded hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors py-0.5">
                                <span className="truncate flex-1 text-[10px] sm:text-[11px] text-gray-700 dark:text-gray-300 min-w-0" title={client.name}>{client.name}</span>
                                <span className="ml-2 tabular-nums font-medium text-[10px] sm:text-[11px] text-gray-900 dark:text-gray-100 flex-shrink-0">
                                  {formatCurrency(totalValue, currency)}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Right side - Controls */}
        <div className="flex items-center gap-3">
          <Link 
            to="/clients" 
            className="text-sm font-medium flex items-center space-x-1 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-purple-700 transition-all duration-200 whitespace-nowrap"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 flex-1">
        <div className="w-full">
          <StatCard
            title="Total Clients"
            value={clientStats.total.toString()}
            color="blue"
          />
        </div>
        <div className="w-full">
          <StatCard
            title="Total Value"
            value={formatCurrency(clientStats.totalValue, 'USD')}
            color="purple"
          />
        </div>
      </div>

      {/* Mobile Modal for Client Info */}
      {showMobileModal && isMobile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowMobileModal(false)} />
          <div className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg p-3 sm:p-4 w-[90vw] sm:w-80 md:w-96 max-w-md animate-fadein">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="font-semibold text-xs sm:text-sm text-gray-700 dark:text-gray-200">Clients Info</div>
              <button
                onClick={() => setShowMobileModal(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ml-2 touch-manipulation"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="font-semibold text-[11px] sm:text-xs text-gray-900 dark:text-gray-100 mb-1">Active:</div>
                  <div className="font-medium text-sm sm:text-base text-green-600 dark:text-green-400">
                    {clientStats.active}
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-[11px] sm:text-xs text-gray-900 dark:text-gray-100 mb-1">Inactive:</div>
                  <div className="font-medium text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    {clientStats.inactive}
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                <div className="font-semibold text-[11px] sm:text-xs text-gray-900 dark:text-gray-100 mb-1">Total Value:</div>
                <div className="font-medium text-sm sm:text-base text-blue-600 dark:text-blue-400">
                  {formatCurrency(clientStats.totalValue, 'USD')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

