import React, { useState, useEffect, useMemo } from 'react';
import { useClientStore } from '../../store/useClientStore';
import { StatCard } from './StatCard';
import { formatCurrency } from '../../utils/currency';
import { usePersistedToggle } from '../../hooks/usePersistedToggle';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';
import { DashboardCardShell } from './DashboardCardShell';

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

  const [showClientsWidget, setShowClientsWidget] = usePersistedToggle(
    'showClientsWidget',
    true,
    user?.id,
    { syncFromDb: true }
  );

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

  const hideClientsWidget = () => {
    setShowClientsWidget(false);
    toast.success('Preference saved!', { description: 'Clients widget hidden' });
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

  const clientsInfoBody = useMemo(
    () => (
      <div className="space-y-2 sm:space-y-3">
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div className="min-w-0">
            <div className="mb-0.5 truncate text-[11px] font-semibold text-gray-900 dark:text-gray-100 sm:text-xs">
              Active ({clientStats.active}):
            </div>
            <div className="break-words bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-[11px] font-medium text-transparent sm:text-xs">
              {clientStats.active} clients
            </div>
          </div>
          <div className="min-w-0">
            <div className="mb-0.5 truncate text-[11px] font-semibold text-gray-900 dark:text-gray-100 sm:text-xs">
              Inactive ({clientStats.inactive}):
            </div>
            <div className="break-words bg-gradient-to-r from-gray-600 to-gray-400 bg-clip-text text-[11px] font-medium text-transparent sm:text-xs">
              {clientStats.inactive} clients
            </div>
          </div>
        </div>
        <div className="mt-2 border-t border-gray-200 pt-2 dark:border-gray-700">
          <div className="mb-0.5 text-[11px] font-semibold text-gray-900 dark:text-gray-100 sm:text-xs">Total Value:</div>
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-[11px] font-medium text-transparent sm:text-xs">
            {formatCurrency(clientStats.totalValue, 'USD')}
          </div>
        </div>
        {recentClients.length > 0 && (
          <>
            <div className="mt-2 border-t border-gray-200 dark:border-gray-700" />
            <div>
              <div className="mb-1">
                <div className="text-[10px] font-semibold text-gray-900 dark:text-gray-100 sm:text-[11px]">Recent Clients</div>
              </div>
              <ul className="max-h-32 space-y-0.5 overflow-y-auto sm:max-h-40">
                {recentClients.map((client) => {
                  const clientOrders = getOrdersByClient(client.id);
                  const clientInvoices = getInvoicesByClient(client.id);
                  const orderValue = clientOrders.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);
                  const invoiceValue = clientInvoices.reduce((sum, invoice) => sum + (Number(invoice.total_amount) || 0), 0);
                  const totalValue = orderValue + invoiceValue;
                  const currency = client.default_currency || 'USD';
                  return (
                    <li
                      key={client.id}
                      className="flex items-center justify-between rounded py-0.5 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <span className="min-w-0 flex-1 truncate text-[10px] text-gray-700 dark:text-gray-300 sm:text-[11px]" title={client.name}>
                        {client.name}
                      </span>
                      <span className="ml-2 flex-shrink-0 tabular-nums text-[10px] font-medium text-gray-900 dark:text-gray-100 sm:text-[11px]">
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
    ),
    [clientStats, recentClients, getOrdersByClient, getInvoicesByClient]
  );

  // Don't render if no clients
  if (!loading && clients.length === 0) {
    return null;
  }

  // Don't render if widget is hidden
  if (!showClientsWidget) {
    return null;
  }

  return (
    <DashboardCardShell
      title="Clients"
      viewAllTo="/clients"
      onHide={hideClientsWidget}
      hideAriaLabel="Hide Clients widget"
      info={clientsInfoBody}
      infoAriaLabel="Show clients info"
      loading={loading}
    >
      <div className="dashboard-stat-grid gap-3 sm:gap-4 flex-1">
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
    </DashboardCardShell>
  );
};

