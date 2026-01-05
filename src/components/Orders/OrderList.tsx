import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, Package, Calendar, DollarSign, Loader2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useClientStore } from '../../store/useClientStore';
import { Order } from '../../types/client';
import { OrderForm } from './OrderForm';
import { Loader } from '../common/Loader';
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { format } from 'date-fns';
import { getCurrencySymbol } from '../../utils/currency';

export const OrderList: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const clientIdFromUrl = searchParams.get('clientId');
  
  const {
    orders,
    clients,
    loading,
    error,
    fetchOrders,
    fetchClients,
    deleteOrder
  } = useClientStore();

  const { isMobile } = useMobileDetection();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded'>('all');
  const [clientFilter, setClientFilter] = useState<string>(clientIdFromUrl || 'all');
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null);
  const [initialClientId, setInitialClientId] = useState<string | null>(clientIdFromUrl);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const loadOrders = async () => {
      if (clientIdFromUrl) {
        await fetchOrders(clientIdFromUrl);
        if (isMounted) {
          setClientFilter(clientIdFromUrl);
          setInitialClientId(clientIdFromUrl);
        }
      } else {
        await fetchOrders();
        if (isMounted) {
          setClientFilter('all');
          setInitialClientId(null);
        }
      }
    };
    
    loadOrders();
    
    return () => {
      isMounted = false;
    };
  }, [clientIdFromUrl]); // Only depend on clientIdFromUrl

  // Track if we've fetched orders at least once to prevent infinite loading
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);

  useEffect(() => {
    if (!loading && !hasFetchedOnce) {
      setHasFetchedOnce(true);
    }
  }, [loading, hasFetchedOnce]);

  // Force loading state to false after a timeout to prevent infinite loading
  useEffect(() => {
    if (loading && !hasFetchedOnce) {
      const timeoutId = setTimeout(() => {
        console.warn('[OrderList] Loading timeout - orders may have been fetched but loading state not cleared');
        setHasFetchedOnce(true); // Allow content to show even if loading is stuck
      }, 8000); // 8 second timeout
      
      return () => clearTimeout(timeoutId);
    }
  }, [loading, hasFetchedOnce]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.client?.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.tracking_number?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesClient = clientFilter === 'all' || order.client_id === clientFilter;

      return matchesSearch && matchesStatus && matchesClient;
    });
  }, [orders, searchTerm, statusFilter, clientFilter]);

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (deletingOrder) {
      await deleteOrder(deletingOrder.id);
      setDeletingOrder(null);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingOrder(null);
    // Refresh list after form closes, maintaining client filter if set
    if (clientIdFromUrl) {
      fetchOrders(clientIdFromUrl);
    } else {
      fetchOrders();
    }
  };

  const getStatusBadge = (status: Order['status']) => {
    const styles = {
      pending: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
      processing: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
      completed: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
      cancelled: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
      refunded: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatCurrency = (amount: number, currency: string) => {
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${amount.toFixed(2)}`;
  };

  // Only show loading if we haven't fetched once yet, or if we're loading and have no orders
  if (loading && orders.length === 0 && !error && !hasFetchedOnce) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600 dark:text-gray-400">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error && orders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md mx-auto px-4">
          <Package className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Error Loading Orders
          </h3>
          <p className="text-red-600 dark:text-red-400 mb-4 text-sm">{error}</p>
          {error.includes('table not found') || error.includes('relation') ? (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4 text-left">
              <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                <strong>Database Setup Required:</strong>
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                The orders table may not exist. Please run the database migration script: <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">create_orders_tables.sql</code>
              </p>
            </div>
          ) : null}
          <button
            onClick={() => {
              if (clientIdFromUrl) {
                fetchOrders(clientIdFromUrl);
              } else {
                fetchOrders();
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Orders</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage your customer orders
            </p>
          </div>
          <button
            onClick={() => {
              setEditingOrder(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Order
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search orders by number, client, or tracking..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Clients</option>
            {clients
              .filter((c) => c.status === 'active')
              .map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Orders</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{orders.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">
              {orders.filter((o) => o.status === 'pending').length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">Processing</p>
            <p className="text-2xl font-bold text-blue-600">
              {orders.filter((o) => o.status === 'processing').length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
            <p className="text-2xl font-bold text-green-600">
              {orders.filter((o) => o.status === 'completed').length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Value</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(
                orders.reduce((sum, o) => sum + o.total_amount, 0),
                orders[0]?.currency || 'USD'
              )}
            </p>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || statusFilter !== 'all' || clientFilter !== 'all'
                ? 'No orders match your filters'
                : 'No orders yet. Create your first order to get started.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {order.order_number}
                      </h3>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Client:</span> {order.client?.name || 'Unknown'}
                        {order.client?.company_name && ` (${order.client.company_name})`}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(order.order_date), 'MMM dd, yyyy')}
                      </p>
                      {order.tracking_number && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Tracking:</span> {order.tracking_number}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-1 justify-end sm:justify-start">
                      <DollarSign className="w-5 h-5" />
                      {formatCurrency(order.total_amount, order.currency)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {order.items && order.items.length > 0 && (
                  <div className="mb-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Items:</p>
                    <div className="space-y-1">
                      {order.items.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                          <span>{item.description}</span>
                          <span>
                            {item.quantity} × {formatCurrency(item.unit_price, order.currency)} ={' '}
                            {formatCurrency(item.total, order.currency)}
                          </span>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <p className="text-sm text-gray-500 dark:text-gray-500">
                          +{order.items.length - 3} more item{order.items.length - 3 !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {order.currency} • Created {format(new Date(order.created_at), 'MMM dd, yyyy')}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(order)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      aria-label="Edit order"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingOrder(order)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      aria-label="Delete order"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order Form Modal */}
      <OrderForm
        isOpen={showForm}
        onClose={handleCloseForm}
        order={editingOrder}
        clientId={initialClientId || undefined}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!deletingOrder}
        onClose={() => setDeletingOrder(null)}
        onConfirm={handleDelete}
        title="Delete Order"
        message="Are you sure you want to delete this order? This action cannot be undone."
        recordDetails={
          deletingOrder ? (
            <div className="space-y-1">
              <p className="font-medium text-blue-900 dark:text-blue-200">{deletingOrder.order_number}</p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Client: {deletingOrder.client?.name || 'Unknown'}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Total: {formatCurrency(deletingOrder.total_amount, deletingOrder.currency)}
              </p>
            </div>
          ) : (
            <div>No order selected</div>
          )
        }
      />
    </>
  );
};

