import React, { useState } from 'react';
import { format } from 'date-fns';
import { 
  Edit, 
  DollarSign, 
  Package,
  Calendar,
  Clock,
  Search,
  Copy,
  Hash,
  User,
  ArrowRight
} from 'lucide-react';

interface TransactionUpdate {
  id: number;
  transaction_id: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  updated_at: string;
  updated_by: string;
  metadata: any;
  transaction_description: string | null;
  transaction_amount: number | null;
  transaction_type: string | null;
  transaction_category: string | null;
  account_name: string | null;
  updated_by_email: string | null;
}

interface PurchaseUpdate {
  id: number;
  purchase_id: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  updated_at: string;
  updated_by: string;
  metadata: any;
  purchase_item_name: string | null;
  purchase_price: number | null;
  purchase_category: string | null;
  purchase_status: string | null;
  purchase_priority: string | null;
  updated_by_email: string | null;
}

interface TransactionPurchaseUpdatesProps {
  transactionUpdates: TransactionUpdate[];
  purchaseUpdates: PurchaseUpdate[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  copyTransactionId: (id: string) => void;
}

export const TransactionPurchaseUpdates: React.FC<TransactionPurchaseUpdatesProps> = ({
  transactionUpdates,
  purchaseUpdates,
  loading,
  searchTerm,
  setSearchTerm,
  copyTransactionId
}) => {
  const [activeSection, setActiveSection] = useState<'transactions' | 'purchases'>('transactions');
  const [openDate, setOpenDate] = useState<string | null>(null);

  const getFieldDisplayName = (fieldName: string) => {
    const fieldMap: Record<string, string> = {
      'amount': 'Amount',
      'type': 'Type',
      'category': 'Category',
      'description': 'Description',
      'date': 'Date',
      'tags': 'Tags',
      'saving_amount': 'Saving Amount',
      'is_recurring': 'Recurring',
      'recurring_frequency': 'Recurring Frequency',
      'item_name': 'Item Name',
      'price': 'Price',
      'purchase_date': 'Purchase Date',
      'status': 'Status',
      'priority': 'Priority',
      'notes': 'Notes',
      'currency': 'Currency'
    };
    return fieldMap[fieldName] || fieldName;
  };

  const getFieldIcon = (fieldName: string) => {
    switch (fieldName) {
      case 'amount':
      case 'price':
        return <DollarSign className="w-3 h-3" />;
      case 'description':
      case 'item_name':
        return <Edit className="w-3 h-3" />;
      case 'category':
        return <Package className="w-3 h-3" />;
      case 'date':
      case 'purchase_date':
        return <Calendar className="w-3 h-3" />;
      default:
        return <Edit className="w-3 h-3" />;
    }
  };

  const filteredTransactionUpdates = transactionUpdates.filter(update => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        update.transaction_id.toLowerCase().includes(searchLower) ||
        update.field_name.toLowerCase().includes(searchLower) ||
        (update.old_value && update.old_value.toLowerCase().includes(searchLower)) ||
        (update.new_value && update.new_value.toLowerCase().includes(searchLower)) ||
        (update.transaction_description && update.transaction_description.toLowerCase().includes(searchLower)) ||
        (update.account_name && update.account_name.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });

  const filteredPurchaseUpdates = purchaseUpdates.filter(update => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        update.purchase_id.toLowerCase().includes(searchLower) ||
        update.field_name.toLowerCase().includes(searchLower) ||
        (update.old_value && update.old_value.toLowerCase().includes(searchLower)) ||
        (update.new_value && update.new_value.toLowerCase().includes(searchLower)) ||
        (update.purchase_item_name && update.purchase_item_name.toLowerCase().includes(searchLower)) ||
        (update.purchase_category && update.purchase_category.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });

  const groupedTransactionUpdates = filteredTransactionUpdates.reduce((groups, update) => {
    const date = format(new Date(update.updated_at), 'MMM dd, yyyy');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(update);
    return groups;
  }, {} as Record<string, TransactionUpdate[]>);

  const groupedPurchaseUpdates = filteredPurchaseUpdates.reduce((groups, update) => {
    const date = format(new Date(update.updated_at), 'MMM dd, yyyy');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(update);
    return groups;
  }, {} as Record<string, PurchaseUpdate[]>);

  React.useEffect(() => {
    const currentGrouped = activeSection === 'transactions' ? groupedTransactionUpdates : groupedPurchaseUpdates;
    if (openDate === null && Object.keys(currentGrouped).length > 0) {
      setOpenDate(Object.keys(currentGrouped)[0]);
    }
  }, [activeSection, groupedTransactionUpdates, groupedPurchaseUpdates]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading update history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by ID, field name, or values..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        />
      </div>

      {/* Section Tabs */}
      <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveSection('transactions')}
          className={`py-2 px-4 border-b-2 font-medium text-sm ${
            activeSection === 'transactions'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Transaction Updates ({filteredTransactionUpdates.length})
          </div>
        </button>
        <button
          onClick={() => setActiveSection('purchases')}
          className={`py-2 px-4 border-b-2 font-medium text-sm ${
            activeSection === 'purchases'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Purchase Updates ({filteredPurchaseUpdates.length})
          </div>
        </button>
      </div>

      {/* Content */}
      {activeSection === 'transactions' ? (
        filteredTransactionUpdates.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-2">
              <Edit className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">No transaction updates found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm ? 'No transaction updates match your search criteria' : 'Transaction updates will appear here when you edit transactions'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {Object.entries(groupedTransactionUpdates).map(([date, dateUpdates]) => (
              <div key={date} className="border rounded bg-white dark:bg-gray-900">
                <button
                  className="w-full flex items-center justify-between px-3 py-2 focus:outline-none hover:bg-gray-100 dark:hover:bg-gray-800 rounded-t"
                  onClick={() => setOpenDate(openDate === date ? null : date)}
                  aria-expanded={openDate === date}
                >
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-base font-semibold text-gray-900 dark:text-white">{date}</span>
                    <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {dateUpdates.length} update{dateUpdates.length !== 1 ? 's' : ''}
                    </span>
                  </span>
                  <svg className={`w-4 h-4 transform transition-transform ${openDate === date ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
                {openDate === date && (
                  <div className="grid gap-2 px-3 pb-2">
                    {dateUpdates.map(update => (
                      <div key={update.id} className="p-3 rounded border bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-1.5 flex-1 min-w-0">
                            <div className="flex items-center gap-0.5 flex-shrink-0 mt-0.5">
                              {getFieldIcon(update.field_name)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                Updated {getFieldDisplayName(update.field_name)}
                              </h4>
                              <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 mt-1">
                                <Clock className="w-3 h-3" />
                                <span>{format(new Date(update.updated_at), 'h:mm a')}</span>
                                {update.transaction_description && (
                                  <span className="text-gray-500 truncate">• {update.transaction_description}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 mt-2">
                                <Hash className="w-3 h-3 text-gray-400" />
                                <span className="text-xs text-gray-500 font-mono">ID:</span>
                                <span className="text-xs text-blue-600 dark:text-blue-400 font-mono bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded">
                                  {update.transaction_id}
                                </span>
                                <button
                                  onClick={() => copyTransactionId(update.transaction_id)}
                                  className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                  title="Copy transaction ID"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="flex items-center gap-2 mt-2 text-xs">
                                <span className="text-gray-500">From:</span>
                                <span className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-2 py-1 rounded">
                                  {update.old_value || 'N/A'}
                                </span>
                                <ArrowRight className="w-3 h-3 text-gray-400" />
                                <span className="text-gray-500">To:</span>
                                <span className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-1 rounded">
                                  {update.new_value || 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <User className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {update.updated_by_email || 'Unknown'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        filteredPurchaseUpdates.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-2">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">No purchase updates found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm ? 'No purchase updates match your search criteria' : 'Purchase updates will appear here when you edit purchases'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {Object.entries(groupedPurchaseUpdates).map(([date, dateUpdates]) => (
              <div key={date} className="border rounded bg-white dark:bg-gray-900">
                <button
                  className="w-full flex items-center justify-between px-3 py-2 focus:outline-none hover:bg-gray-100 dark:hover:bg-gray-800 rounded-t"
                  onClick={() => setOpenDate(openDate === date ? null : date)}
                  aria-expanded={openDate === date}
                >
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-base font-semibold text-gray-900 dark:text-white">{date}</span>
                    <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {dateUpdates.length} update{dateUpdates.length !== 1 ? 's' : ''}
                    </span>
                  </span>
                  <svg className={`w-4 h-4 transform transition-transform ${openDate === date ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
                {openDate === date && (
                  <div className="grid gap-2 px-3 pb-2">
                    {dateUpdates.map(update => (
                      <div key={update.id} className="p-3 rounded border bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-1.5 flex-1 min-w-0">
                            <div className="flex items-center gap-0.5 flex-shrink-0 mt-0.5">
                              {getFieldIcon(update.field_name)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                Updated {getFieldDisplayName(update.field_name)}
                              </h4>
                              <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 mt-1">
                                <Clock className="w-3 h-3" />
                                <span>{format(new Date(update.updated_at), 'h:mm a')}</span>
                                {update.purchase_item_name && (
                                  <span className="text-gray-500 truncate">• {update.purchase_item_name}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 mt-2">
                                <Hash className="w-3 h-3 text-gray-400" />
                                <span className="text-xs text-gray-500 font-mono">ID:</span>
                                <span className="text-xs text-purple-600 dark:text-purple-400 font-mono bg-purple-50 dark:bg-purple-900/20 px-1.5 py-0.5 rounded">
                                  {update.purchase_id}
                                </span>
                                <button
                                  onClick={() => copyTransactionId(update.purchase_id)}
                                  className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                  title="Copy purchase ID"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="flex items-center gap-2 mt-2 text-xs">
                                <span className="text-gray-500">From:</span>
                                <span className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-2 py-1 rounded">
                                  {update.old_value || 'N/A'}
                                </span>
                                <ArrowRight className="w-3 h-3 text-gray-400" />
                                <span className="text-gray-500">To:</span>
                                <span className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-1 rounded">
                                  {update.new_value || 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <User className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {update.updated_by_email || 'Unknown'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}; 

