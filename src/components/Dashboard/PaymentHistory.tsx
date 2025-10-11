import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Calendar, 
  Filter, 
  Download, 
  Search, 
  ChevronDown, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertTriangle,
  DollarSign,
  FileText,
  ExternalLink,
  Eye,
  EyeOff
} from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Link } from 'react-router-dom';

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
  const [filteredTransactions, setFilteredTransactions] = useState<PaymentTransaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showTransactionDetails, setShowTransactionDetails] = useState<string | null>(null);

  // Fetch payment transactions
  useEffect(() => {
    fetchPaymentTransactions();
  }, [fetchPaymentTransactions]);

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

  if (!hideTitle) {
    return (
      <div className="space-y-6">
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Payment History</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            View and manage your payment transactions
          </p>
        </div>
        <PaymentHistory hideTitle />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Link to Full Page */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Payment History</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Recent payment transactions</p>
        </div>
        <Link
          to="/payment-history"
          className="flex items-center px-3 py-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors text-sm font-medium"
        >
          View Full History
          <ExternalLink className="w-4 h-4 ml-1" />
        </Link>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Transactions</p>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{summaryStats.totalTransactions}</p>
            </div>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
              <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Amount</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(summaryStats.totalAmount)}
              </p>
            </div>
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0">
              <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{summaryStats.completedTransactions}</p>
            </div>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex-shrink-0">
              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{summaryStats.pendingTransactions}</p>
            </div>
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex-shrink-0">
              <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search - Only show in full page */}
      {!hideTitle && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {/* Export Button */}
          <button
            onClick={exportToPDF}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date Range
                </label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading payment history...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-8 text-center">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Payment Transactions</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {paymentTransactions.length === 0 
                ? "You haven't made any payments yet."
                : "No transactions match your current filters."
              }
            </p>
            {paymentTransactions.length === 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                  <strong>Developer Note:</strong> To see real payment data, set up the payment tables in your database.
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-300">
                  Run the SQL scripts in the project root to create sample payment data.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
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

                {/* Transaction Details */}
                {showTransactionDetails === transaction.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                        <div className="sm:col-span-2 lg:col-span-3">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Metadata</p>
                          <pre className="text-xs text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-x-auto">
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
  );
};
