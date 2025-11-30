import React, { useState, useEffect, useCallback } from 'react';
import { 
  CreditCard, 
  Calendar, 
  Filter, 
  Download, 
  Search, 
  ChevronDown, 
  ChevronUp,
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertTriangle,
  DollarSign,
  FileText,
  ExternalLink,
  Eye,
  EyeOff,
  Wallet
} from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Link } from 'react-router-dom';
import { useMobileDetection } from '../../hooks/useMobileDetection';

interface PaymentTransaction {
  id: string;
  user_id: string;
  subscription_id?: string;
  plan_id: string;
  amount: number;
  currency: string;
  payment_provider: 'stripe' | 'paypal';
  provider_transaction_id: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  payment_method?: string;
  billing_cycle: 'monthly' | 'one-time';
  transaction_type: 'payment' | 'refund' | 'chargeback';
  metadata?: any;
  created_at: string;
  updated_at?: string;
  plan_name?: string;
}

interface PaymentHistoryProps {
  hideTitle?: boolean;
}

export const PaymentHistory: React.FC<PaymentHistoryProps> = ({ hideTitle = false }) => {
  const { paymentTransactions, loading, fetchPaymentTransactions } = useFinanceStore();
  const { user } = useAuthStore();
  const [filteredTransactions, setFilteredTransactions] = useState<PaymentTransaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showTransactionDetails, setShowTransactionDetails] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);
  const { isMobile } = useMobileDetection();

  // Fetch payment transactions
  useEffect(() => {
    fetchPaymentTransactions();
  }, [fetchPaymentTransactions]);

  // Fetch payment methods with transaction stats
  const loadPaymentMethods = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoadingPaymentMethods(true);
      const { data, error } = await supabase.rpc('get_user_payment_methods', {
        p_user_id: user.id
      });

      if (error) {
        console.error('Error loading payment methods:', error);
        setPaymentMethods([]);
        return;
      }

      // Enrich with transaction stats
      const enrichedMethods = (data || []).map((method: any) => {
        // Find transactions using this payment method
        const methodTransactions = paymentTransactions.filter(tx => {
          // Match by last4 if available, or by payment method string
          if (method.last4) {
            return tx.payment_method?.includes(method.last4);
          }
          return false;
        });

        return {
          ...method,
          transactionCount: methodTransactions.length,
          totalAmount: methodTransactions.reduce((sum, tx) => sum + tx.amount, 0),
          lastUsed: methodTransactions.length > 0 
            ? methodTransactions[0].created_at 
            : method.created_at
        };
      });

      setPaymentMethods(enrichedMethods);
    } catch (error) {
      console.error('Error loading payment methods:', error);
      setPaymentMethods([]);
    } finally {
      setLoadingPaymentMethods(false);
    }
  }, [user, paymentTransactions]);

  useEffect(() => {
    loadPaymentMethods();
  }, [loadPaymentMethods]);

  // Apply filters
  useEffect(() => {
    let filtered = paymentTransactions;

    // For the settings tab, only show recent transactions (last 5)
    if (hideTitle) {
      filtered = filtered.slice(0, 5);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(tx => 
        tx.provider_transaction_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.plan_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.payment_method?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(tx => tx.status === statusFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'last7days':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'last30days':
          filterDate.setDate(now.getDate() - 30);
          break;
        case 'last90days':
          filterDate.setDate(now.getDate() - 90);
          break;
        case 'thisyear':
          filterDate.setFullYear(now.getFullYear(), 0, 1);
          break;
      }
      
      filtered = filtered.filter(tx => new Date(tx.created_at) >= filterDate);
    }

    setFilteredTransactions(filtered);
  }, [paymentTransactions, searchTerm, statusFilter, dateFilter]);

  // Get status icon and color
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />;
      case 'failed':
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />;
      case 'refunded':
        return <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'refunded':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    let y = 10;

    // Header
    doc.setFontSize(16);
    doc.text('Payment History', 14, y);
    y += 8;
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, y);
    y += 15;

    // Transactions table
    if (filteredTransactions.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['Date', 'Plan', 'Amount', 'Status', 'Payment Method', 'Transaction ID']],
        body: filteredTransactions.map(tx => [
          formatDate(tx.created_at),
          tx.plan_name || 'Unknown',
          formatCurrency(tx.amount, tx.currency),
          tx.status.charAt(0).toUpperCase() + tx.status.slice(1),
          tx.payment_method || 'N/A',
          tx.provider_transaction_id.substring(0, 12) + '...'
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [41, 128, 185] },
      });
    } else {
      doc.text('No payment transactions found.', 14, y);
    }

    doc.save(`payment-history-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('Payment history exported successfully');
  };

  // Calculate summary statistics
  const summaryStats = {
    totalTransactions: filteredTransactions.length,
    totalAmount: filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0),
    completedTransactions: filteredTransactions.filter(tx => tx.status === 'completed').length,
    pendingTransactions: filteredTransactions.filter(tx => tx.status === 'pending').length,
    failedTransactions: filteredTransactions.filter(tx => tx.status === 'failed').length,
    refundedTransactions: filteredTransactions.filter(tx => tx.status === 'refunded').length
  };

  // Get payment method icon
  const getPaymentMethodIcon = (type: string, brand?: string) => {
    if (type === 'paypal') {
      return <Wallet className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
    }
    if (type === 'bank') {
      return <CreditCard className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
    }
    return <CreditCard className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
  };

  if (!hideTitle) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="border-b border-gray-200 dark:border-gray-700 pb-3 sm:pb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">Payment History</h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            View and manage your payment transactions
          </p>
        </div>
        <PaymentHistory hideTitle />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Payment Methods Cards */}
      {paymentMethods.length > 0 && (
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3">Payment Methods</h3>
          <div className={`grid gap-3 sm:gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-2 sm:mb-3">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="p-1.5 sm:p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex-shrink-0">
                      {getPaymentMethodIcon(method.type, method.brand)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {method.brand ? method.brand.charAt(0).toUpperCase() + method.brand.slice(1) : method.type.charAt(0).toUpperCase() + method.type.slice(1)}
                      </p>
                      {method.last4 && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">•••• {method.last4}</p>
                      )}
                    </div>
                  </div>
                  {method.is_default && (
                    <span className="px-2 py-0.5 sm:py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full flex-shrink-0 ml-2">
                      Default
                    </span>
                  )}
                </div>
                
                {method.expiry_month && method.expiry_year && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    Expires {method.expiry_month}/{method.expiry_year}
                  </p>
                )}
                
                <div className="pt-2 sm:pt-3 border-t border-gray-200 dark:border-gray-700 mt-2 sm:mt-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Transactions</span>
                    <span className="font-medium text-gray-900 dark:text-white">{method.transactionCount || 0}</span>
                  </div>
                  {method.totalAmount > 0 && (
                    <div className="flex items-center justify-between text-xs mt-1">
                      <span className="text-gray-600 dark:text-gray-400">Total Amount</span>
                      <span className="font-medium text-gray-900 dark:text-white truncate ml-2">{formatCurrency(method.totalAmount)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment History Section */}
      <div className="space-y-3 sm:space-y-4">
        {/* Summary Statistics */}
        <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Transactions</p>
              <p className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400 truncate">{summaryStats.totalTransactions}</p>
            </div>
            <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0 ml-2">
              <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Amount</p>
              <p className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400 truncate">
                {formatCurrency(summaryStats.totalAmount)}
              </p>
            </div>
            <div className="p-1.5 sm:p-2 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0 ml-2">
              <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
        </div>

        {/* Filters and Search - Only show in full page */}
        {!hideTitle && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4 shadow-sm">
        <div className={`flex gap-2 sm:gap-4 ${isMobile ? 'flex-col' : 'flex-col sm:flex-row'}`}>
          {/* Search */}
          <div className="flex-1 min-w-0">
            <div className="relative">
              <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center px-3 sm:px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm sm:text-base ${isMobile ? 'touch-button' : ''}`}
          >
            <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            <span className="hidden xs:inline">Filters</span>
            <span className="xs:hidden">Filter</span>
            <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1.5 sm:ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {/* Export Button */}
          <button
            onClick={exportToPDF}
            className={`flex items-center justify-center px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base ${isMobile ? 'touch-button' : ''}`}
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            <span className="hidden xs:inline">Export PDF</span>
            <span className="xs:hidden">Export</span>
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className={`grid gap-3 sm:gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                  Date Range
                </label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Time</option>
                  <option value="last7days">Last 7 Days</option>
                  <option value="last30days">Last 30 Days</option>
                  <option value="last90days">Last 90 Days</option>
                  <option value="thisyear">This Year</option>
                </select>
              </div>
            </div>
          </div>
        )}
        </div>
        )}

        {/* Transactions List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        {loading ? (
          <div className="p-6 sm:p-8 text-center">
            <div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3 sm:mb-4"></div>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Loading payment history...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-6 sm:p-8 text-center">
            <CreditCard className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">No Payment Transactions</h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4">
              {paymentTransactions.length === 0 
                ? "You haven't made any payments yet."
                : "No transactions match your current filters."
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredTransactions.map((transaction) => (
              <div key={transaction.id} className={`${isMobile ? 'p-3' : 'p-4'} hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors`}>
                {isMobile ? (
                  // Mobile Layout
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div className="flex-shrink-0">
                          {getStatusIcon(transaction.status)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {transaction.plan_name}
                            </p>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(transaction.status)} flex-shrink-0`}>
                              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {formatDate(transaction.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right ml-2">
                        <p className="text-base font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(transaction.amount, transaction.currency)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>{transaction.payment_method || 'N/A'}</span>
                        <span>•</span>
                        <span>{transaction.billing_cycle.charAt(0).toUpperCase() + transaction.billing_cycle.slice(1)}</span>
                      </div>
                      <button
                        onClick={() => setShowTransactionDetails(
                          showTransactionDetails === transaction.id ? null : transaction.id
                        )}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors touch-button"
                      >
                        {showTransactionDetails === transaction.id ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  // Desktop Layout
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {getStatusIcon(transaction.status)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {transaction.plan_name}
                          </p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(transaction.status)}`}>
                            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 mt-1">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(transaction.created_at)}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {transaction.payment_method || 'N/A'}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {transaction.billing_cycle.charAt(0).toUpperCase() + transaction.billing_cycle.slice(1)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(transaction.amount, transaction.currency)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          ID: {transaction.provider_transaction_id.substring(0, 8)}...
                        </p>
                      </div>
                      
                      <button
                        onClick={() => setShowTransactionDetails(
                          showTransactionDetails === transaction.id ? null : transaction.id
                        )}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        {showTransactionDetails === transaction.id ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Transaction Details */}
                {showTransactionDetails === transaction.id && (
                  <div className={`${isMobile ? 'mt-3 pt-3' : 'mt-4 pt-4'} border-t border-gray-200 dark:border-gray-700`}>
                    <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Transaction ID</p>
                        <p className="text-sm text-gray-900 dark:text-white font-mono">{transaction.provider_transaction_id}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Payment Provider</p>
                        <p className="text-sm text-gray-900 dark:text-white capitalize">{transaction.payment_provider}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Transaction Type</p>
                        <p className="text-sm text-gray-900 dark:text-white capitalize">{transaction.transaction_type}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Created</p>
                        <p className="text-sm text-gray-900 dark:text-white">{formatDate(transaction.created_at)}</p>
                      </div>
                      {transaction.updated_at && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Updated</p>
                          <p className="text-sm text-gray-900 dark:text-white">{formatDate(transaction.updated_at)}</p>
                        </div>
                      )}
                      {transaction.metadata && Object.keys(transaction.metadata).length > 0 && (
                        <div className={`${isMobile ? 'col-span-1' : 'sm:col-span-2 lg:col-span-3'}`}>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Metadata</p>
                          <pre className={`text-xs text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 rounded overflow-x-auto ${isMobile ? 'p-2' : 'p-2'}`}>
                            {JSON.stringify(transaction.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

