import React, { useState, useEffect } from 'react';
import { LendBorrow, LendBorrowReturn } from '../../types/index';
import { useTranslation } from 'react-i18next';
import { Edit2, Trash2, InfoIcon, CheckCircle, Clock, AlertTriangle, DollarSign, ChevronUp, ChevronDown, Handshake, RotateCcw, Info } from 'lucide-react';
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';
import { SettlementModal } from './SettlementModal';
import { supabase } from '../../lib/supabase';
import { EnhancedTooltip } from '../common/EnhancedTooltip';
import { Tooltip } from '../common/Tooltip';
import { useFinanceStore } from '../../store/useFinanceStore';

interface LendBorrowListProps {
  records: LendBorrow[];
  loading: boolean;
  onEdit: (record: LendBorrow) => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: LendBorrow['status']) => void;
  onSettle: (record: LendBorrow, accountId: string) => void;
  onShowSettledInfo: (record: LendBorrow) => void;
  analytics?: any;
  formatCurrency?: (amount: number, currency: string) => string;
  selectedId?: string | null;
  isFromSearch?: boolean;
  selectedRecordRef?: React.RefObject<HTMLDivElement>;
}

export const LendBorrowList: React.FC<LendBorrowListProps> = ({ records, loading, onEdit, onDelete, onUpdateStatus, onSettle, onShowSettledInfo, analytics, formatCurrency, selectedId, isFromSearch, selectedRecordRef }) => {
  const { t } = useTranslation();
  const { fetchLendBorrowRecords, accounts } = useFinanceStore();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [returnHistory, setReturnHistory] = useState<Record<string, LendBorrowReturn[]>>({});

  // Helper function to get account information
  const getAccountInfo = (accountId?: string) => {
    if (!accountId) return null;
    const account = accounts.find(a => a.id === accountId);
    return account ? { name: account.name, type: account.type } : null;
  };
  
  // Add sorting state
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    recordId: string;
    recordName: string;
    recordType: 'lend' | 'borrow';
    recordAmount: number;
    recordCurrency: string;
  }>({
    isOpen: false,
    recordId: '',
    recordName: '',
    recordType: 'lend',
    recordAmount: 0,
    recordCurrency: 'USD'
  });

  const [settlementModal, setSettlementModal] = useState<{
    isOpen: boolean;
    record: LendBorrow | null;
  }>({
    isOpen: false,
    record: null
  });


  // Sorting function
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Get sort icon
  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ChevronUp className="w-4 h-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-blue-600" />
      : <ChevronDown className="w-4 h-4 text-blue-600" />;
  };

  // Sort function
  const sortData = (data: LendBorrow[]) => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.key) {
        case 'person_name':
          aValue = a.person_name.toLowerCase();
          bValue = b.person_name.toLowerCase();
          break;
        case 'type':
          aValue = a.type.toLowerCase();
          bValue = b.type.toLowerCase();
          break;
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'status':
          aValue = a.status.toLowerCase();
          bValue = b.status.toLowerCase();
          break;
        case 'due_date':
          aValue = a.due_date ? new Date(a.due_date).getTime() : 0;
          bValue = b.due_date ? new Date(b.due_date).getTime() : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  const toggleRowExpansion = async (recordId: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(recordId)) {
      newExpandedRows.delete(recordId);
    } else {
      newExpandedRows.add(recordId);
      // Fetch return history when expanding
      await fetchReturnHistory(recordId);
    }
    setExpandedRows(newExpandedRows);
  };

  const fetchReturnHistory = async (recordId: string) => {
    try {
      const { data, error } = await supabase
        .from('lend_borrow_returns')
        .select('*')
        .eq('lend_borrow_id', recordId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReturnHistory(prev => ({
        ...prev,
        [recordId]: data || []
      }));
    } catch (error) {

    }
  };

  const isRowExpanded = (recordId: string) => expandedRows.has(recordId);

  const handleDeleteClick = (record: LendBorrow) => {
    setDeleteModal({
      isOpen: true,
      recordId: record.id,
      recordName: record.person_name,
      recordType: record.type,
      recordAmount: record.amount,
      recordCurrency: record.currency
    });
  };

  const handleConfirmDelete = () => {
    onDelete(deleteModal.recordId);
    setDeleteModal({ ...deleteModal, isOpen: false });
  };

  // Use the formatCurrency prop, or fallback to a default implementation
  const defaultFormatCurrency = (amount: number, currency: string) => {
    if (currency === 'BDT') {
      return `৳${amount.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusIcon = (status: LendBorrow['status']) => {
    switch (status) {
      // No icon for 'active' or 'settled'
      // case 'settled':
      //   return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'overdue':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      default:
        return null;
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  
  return (
    <>
      {/* Mobile/Tablet Stacked Table View */}
      <div className="lg:hidden max-h-[500px] overflow-y-auto">
        <div className="space-y-4 px-2.5">
          {records.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <Handshake className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No lend & borrow records found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                Start tracking your lending and borrowing activities by adding your first record
              </p>
            </div>
          ) : (
            sortData(records).map((record) => {
              const recordReturns = returnHistory[record.id] || [];
              return (
                <div
                  key={record.id}
                  className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Row 1: Person Name and Amount on same line, Actions */}
                  <div className="grid grid-cols-12 gap-1 sm:gap-2 p-2 sm:p-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="col-span-8 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium text-gray-900 dark:text-white truncate flex-shrink">
                          {record.person_name}
                        </div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white truncate flex-shrink-0">
                          {formatCurrency ? formatCurrency(record.amount, record.currency) : defaultFormatCurrency(record.amount, record.currency)}
                        </div>
                      </div>
                    </div>
                    <div className="col-span-4 flex items-center justify-end gap-1 min-w-0 flex-shrink-0">
                      {(record.status === 'active' || record.status === 'overdue') && (
                        <button
                          onClick={() => {
                            setSettlementModal({ isOpen: true, record });
                          }}
                          className="p-1 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                          title="Settle"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {record.status === 'settled' ? (
                        <Tooltip content="Settled record info" placement="top">
                          <button
                            onClick={() => onShowSettledInfo(record)}
                            className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                        </Tooltip>
                      ) : record.account_id ? (
                        <Tooltip content="Account-linked record info" placement="top">
                          <button
                            onClick={() => onShowSettledInfo(record)}
                            className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                        </Tooltip>
                      ) : (
                        <>
                          <Tooltip content="Edit" placement="top">
                            <button
                              onClick={() => onEdit(record)}
                              className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </Tooltip>
                          <Tooltip content="Delete" placement="top">
                            <button
                              onClick={() => handleDeleteClick(record)}
                              className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </Tooltip>
                        </>
                      )}
                    </div>
                  </div>
                
                  {/* Row 2: Status and Type badges stacked, Due Date, Currency */}
                  <div className="grid grid-cols-12 gap-2 p-3">
                    <div className="col-span-4 flex flex-col">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Status & Type</div>
                      <div className="flex flex-col space-y-1.5">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium w-fit ${
                          record.status === 'active' 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                            : record.status === 'settled' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : record.status === 'overdue'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {getStatusIcon(record.status)}
                          <span className="ml-1">{record.status}</span>
                        </span>
                        <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium w-fit ${
                          record.type === 'lend' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        }`}>
                          {record.type === 'lend' ? 'Lend' : 'Borrow'}
                        </span>
                      </div>
                    </div>
                    <div className="col-span-4 flex flex-col">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Due Date</div>
                      <div className="text-sm text-gray-900 dark:text-white">
                        {record.due_date ? formatDate(record.due_date) : '-'}
                      </div>
                      {record.due_date && getDaysUntilDue(record.due_date) < 0 && (
                        <div className="text-xs text-orange-600 dark:text-orange-400 font-medium">Overdue</div>
                      )}
                    </div>
                    <div className="col-span-4 flex flex-col">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Currency</div>
                      <div className="text-sm text-gray-900 dark:text-white">
                        {record.currency}
                      </div>
                    </div>
                  </div>

                  {/* Expandable Record Details */}
                  <div className="border-t border-gray-100 dark:border-gray-800">
                  <button
                    onClick={() => toggleRowExpansion(record.id)}
                    className="w-full px-3 py-2 text-left text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-between"
                  >
                    <span>Record Details</span>
                    <svg
                      className={`w-4 h-4 transition-transform ${isRowExpanded(record.id) ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {isRowExpanded(record.id) && (
                    <div className="px-3 pb-3 space-y-3">
                      {/* Record Details */}
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <div className="text-gray-500 dark:text-gray-400 mb-1">Created</div>
                          <div className="text-gray-900 dark:text-white">
                            {record.created_at ? formatDate(record.created_at) : '-'}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 dark:text-gray-400 mb-1">Updated</div>
                          <div className="text-gray-900 dark:text-white">
                            {record.updated_at ? formatDate(record.updated_at) : '-'}
                          </div>
                        </div>
                      </div>

                      {/* Account Information */}
                      {record.account_id && (() => {
                        const accountInfo = getAccountInfo(record.account_id);
                        return (
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Account</div>
                            <div className="text-sm text-gray-900 dark:text-white">
                              {accountInfo ? (
                                <span className="break-words">
                                  {accountInfo.name}
                                  <span className="text-gray-500 dark:text-gray-400"> ({accountInfo.type})</span>
                                </span>
                              ) : (
                                <span className="text-gray-500 dark:text-gray-400">Unknown Account</span>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Transaction Information */}
                      {record.transaction_id && (
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Transaction ID</div>
                          <div className="text-xs text-gray-900 dark:text-white font-mono break-all">
                            {record.transaction_id}
                          </div>
                        </div>
                      )}

                      {/* Settlement Information */}
                      {record.status === 'settled' && record.repayment_transaction_id && (
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Settlement Transaction</div>
                          <div className="text-xs text-gray-900 dark:text-white font-mono break-all">
                            {record.repayment_transaction_id}
                          </div>
                        </div>
                      )}

                      {/* Partial Return Information */}
                      {record.partial_return_amount && record.partial_return_amount > 0 && (
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Partial Return</div>
                          <div className="text-sm font-medium text-green-600 dark:text-green-400">
                            {formatCurrency ? formatCurrency(record.partial_return_amount, record.currency) : defaultFormatCurrency(record.partial_return_amount, record.currency)}
                          </div>
                          {record.partial_return_date && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Date: {formatDate(record.partial_return_date)}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Total Returned */}
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Returned</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency ? formatCurrency((recordReturns.reduce((sum: number, ret: any) => sum + ret.amount, 0) + (record.partial_return_amount || 0)), record.currency) : defaultFormatCurrency((recordReturns.reduce((sum: number, ret: any) => sum + ret.amount, 0) + (record.partial_return_amount || 0)), record.currency)}
                        </div>
                        {record.partial_return_amount && record.partial_return_amount > 0 && (
                          <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                            Including partial return: {formatCurrency ? formatCurrency(record.partial_return_amount, record.currency) : defaultFormatCurrency(record.partial_return_amount, record.currency)}
                          </div>
                        )}
                      </div>

                      {/* Remaining Amount */}
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Remaining Amount</div>
                        <div className="text-sm font-medium text-orange-600 dark:text-orange-400">
                          {formatCurrency ? formatCurrency(record.amount - (recordReturns.reduce((sum: number, ret: any) => sum + ret.amount, 0) + (record.partial_return_amount || 0)), record.currency) : defaultFormatCurrency(record.amount - (recordReturns.reduce((sum: number, ret: any) => sum + ret.amount, 0) + (record.partial_return_amount || 0)), record.currency)}
                        </div>
                      </div>

                      {/* Return/Payment History */}
                      {recordReturns.length > 0 && (
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            {record.type === 'lend' ? 'Return History' : 'Payment History'}
                          </div>
                          <div className="space-y-2">
                            {recordReturns.map((ret: any, index: number) => (
                              <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded px-2 py-2">
                                <div className="flex items-center justify-between text-xs mb-1">
                                <div className="text-gray-600 dark:text-gray-300">
                                  {formatDate(ret.return_date)}
                                </div>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {formatCurrency ? formatCurrency(ret.amount, record.currency) : defaultFormatCurrency(ret.amount, record.currency)}
                                </div>
                                </div>
                                
                                {/* Account Information for Payment */}
                                {ret.account_id && (() => {
                                  const accountInfo = getAccountInfo(ret.account_id);
                                  return accountInfo ? (
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      <span className="font-medium">Account:</span> 
                                      <span className="break-words ml-1">{accountInfo.name}</span>
                                    </div>
                                  ) : null;
                                })()}
                                
                                {/* Payment Notes */}
                                {ret.notes && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    <span className="font-medium">Note:</span> 
                                    <span className="break-words ml-1">{ret.notes}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {record.notes && (
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Notes</div>
                          <div className="text-xs text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 rounded px-2 py-1">
                            {record.notes}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>
            );
          })
        )}
        </div>
      </div>
      
      {/* Desktop Table View */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900 text-[14px]">
                  <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10 shadow-sm">
        <tr>
          <th 
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            onClick={() => handleSort('person_name')}
          >
            <div className="flex items-center space-x-1">
              <span>Person Name</span>
              {getSortIcon('person_name')}
            </div>
          </th>
          <th 
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            onClick={() => handleSort('type')}
          >
            <div className="flex items-center space-x-1">
              <span>Type</span>
              {getSortIcon('type')}
            </div>
          </th>
          <th 
            className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            onClick={() => handleSort('amount')}
          >
            <div className="flex items-center justify-center space-x-1">
              <span>Amount</span>
              {getSortIcon('amount')}
            </div>
          </th>
          <th 
            className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            onClick={() => handleSort('status')}
          >
            <div className="flex items-center justify-center space-x-1">
              <span>Status</span>
              {getSortIcon('status')}
            </div>
          </th>
          <th 
            className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            onClick={() => handleSort('due_date')}
          >
            <div className="flex items-center justify-center space-x-1">
              <span>Due Date</span>
              {getSortIcon('due_date')}
            </div>
          </th>
          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
        </tr>
      </thead>
      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
      {/* Analytics summary row */}
      {analytics && formatCurrency && (
        <tr>
          <td colSpan={6} className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 px-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Lend</p>
                    <p className="font-bold text-green-600 dark:text-green-400" style={{ fontSize: '1.2rem' }}>
                      {formatCurrency(analytics.total_lent, analytics.currency)}
                    </p>
                  </div>
                  <DollarSign className="text-green-600" style={{ fontSize: '1.2rem', width: '1.2rem', height: '1.2rem' }} />
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 px-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Borrowed</p>
                    <p className="font-bold text-red-600 dark:text-red-400" style={{ fontSize: '1.2rem' }}>
                      {formatCurrency(analytics.total_borrowed, analytics.currency)}
                    </p>
                  </div>
                  <DollarSign className="text-red-600" style={{ fontSize: '1.2rem', width: '1.2rem', height: '1.2rem' }} />
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 px-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Outstanding</p>
                    <p className="font-bold text-blue-600 dark:text-blue-400" style={{ fontSize: '1.2rem' }}>
                      {formatCurrency(analytics.outstanding_lent - analytics.outstanding_borrowed, analytics.currency)}
                    </p>
                  </div>
                  <Clock className="text-blue-600" style={{ fontSize: '1.2rem', width: '1.2rem', height: '1.2rem' }} />
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 px-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Overdue</p>
                    <p className="font-bold text-orange-600 dark:text-orange-400" style={{ fontSize: '1.2rem' }}>
                      {analytics.overdue_count}
                    </p>
                  </div>
                  <AlertTriangle className="text-orange-600" style={{ fontSize: '1.2rem', width: '1.2rem', height: '1.2rem' }} />
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
        {loading ? (
          <tr>
            <td colSpan={6} className="py-12 text-center text-gray-500 dark:text-gray-400 text-lg">Loading records...</td>
          </tr>
        ) : records.length === 0 ? (
          <tr>
            <td colSpan={6} className="py-16 text-center">
              <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <Handshake className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No lend & borrow records found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                Start tracking your lending and borrowing activities by adding your first record
              </p>
            </td>
          </tr>
        ) : (
          sortData(records).map((record, index) => {
            const isOverdue = record.due_date && new Date(record.due_date) < new Date() && record.status === 'active';
            const daysUntilDue = record.due_date ? getDaysUntilDue(record.due_date) : null;
            const recordReturns = returnHistory[record.id] || [];
            const totalReturned = recordReturns.reduce((sum, ret) => sum + ret.amount, 0);
            const isEven = index % 2 === 0;
            
            const isSelected = selectedId === record.id;
            const isFromSearchSelection = isFromSearch && isSelected;
            
            
            return (
              <React.Fragment key={record.id}>
                <tr 
                  id={`lendborrow-${record.id}`}
                  ref={isSelected ? selectedRecordRef : null}
                  className={`
                    transition-all duration-200 ease-in-out cursor-pointer
                    ${isSelected 
                      ? isFromSearchSelection 
                        ? 'ring-2 ring-blue-500 ring-opacity-50 bg-blue-50 dark:bg-blue-900/20 !important' 
                        : 'ring-2 ring-blue-500 ring-opacity-50'
                      : isEven ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800/50'
                    }
                    ${!isSelected ? 'hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:shadow-sm' : ''}
                  `} 
                  onClick={() => toggleRowExpansion(record.id)}
                >
                  <td className="px-6 py-[0.7rem]">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <div 
                          className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer relative group"
                          title={record.notes || 'No notes available'}
                        >
                          {record.person_name}
                          {record.notes && (
                            <div className="absolute left-0 top-full mt-2 w-64 px-3 py-2 bg-gray-800 dark:bg-gray-700 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                              {record.notes}
                              <div className="absolute top-0 left-4 transform -translate-y-1/2 w-2 h-2 bg-gray-800 dark:bg-gray-700 rotate-45"></div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="ml-2">
                        <svg 
                          className={`w-4 h-4 text-gray-400 transition-transform ${isRowExpanded(record.id) ? 'rotate-90' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-[0.7rem]">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      record.type === 'lend' ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300'
                    }`}>
                      {record.type === 'lend' ? t('lendBorrow.lend') : t('lendBorrow.borrow')}
                    </span>
                  </td>
                  <td className="px-6 py-[0.7rem] text-center">
                    <span className={`text-sm font-semibold ${
                      record.type === 'lend' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {(formatCurrency || defaultFormatCurrency)(record.amount, record.currency)}
                    </span>
                  </td>
                  <td className="px-6 py-[0.7rem] text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        record.status === 'active' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300' :
                        record.status === 'settled' ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300' :
                        record.status === 'overdue' ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300' :
                        'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                      }`}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                      {getStatusIcon(record.status)}
                    </div>
                  </td>
                  <td className="px-6 py-[0.7rem] text-center">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {record.due_date ? formatDate(record.due_date) : '-'}
                    </div>
                    {record.due_date && record.status !== 'settled' && (
                      <div className={`text-xs ${
                        isOverdue ? 'text-orange-600 dark:text-orange-400 font-medium' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {isOverdue ? 'Overdue' : daysUntilDue !== null && daysUntilDue > 0 ? `${daysUntilDue} days left` : ''}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-[0.7rem] text-center">
                    <div className="flex justify-center gap-2 items-center" onClick={(e) => e.stopPropagation()}>
                      {record.status === 'settled' ? (
                        <button
                          onClick={() => onShowSettledInfo(record)}
                          className="text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          title="Settled record info"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      ) : record.account_id ? (
                        <button
                          onClick={() => onShowSettledInfo(record)}
                          className="text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          title="Account-linked record info"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      ) : (
                        <>
                      <button
                        onClick={() => onEdit(record)}
                        className="text-gray-500 hover:text-blue-600"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(record)}
                        className="text-gray-500 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                        </>
                      )}
                      
                      {/* Settlement button for active records (all records) */}
                      {record.status === 'active' && (
                        <button
                          onClick={() => {
                            setSettlementModal({ isOpen: true, record });
                          }}
                          className="text-gray-500 hover:text-green-600"
                          title="Settle"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                
                {/* Expanded Row Content */}
                {isRowExpanded(record.id) && (
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <td colSpan={6} className="px-6 py-4">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Record Details */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">Record Details</h4>
                          <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                            <div><span className="font-medium">Created:</span> {formatDate(record.created_at)}</div>
                            <div><span className="font-medium">Updated:</span> {record.updated_at ? formatDate(record.updated_at) : 'Never'}</div>
                            
                            {/* Account Information */}
                            {record.account_id && (() => {
                              const accountInfo = getAccountInfo(record.account_id);
                              return accountInfo ? (
                                <div className="break-words">
                                  <span className="font-medium">{t('lendBorrow.account')}:</span> 
                                  <span className="break-words">{accountInfo.name}</span>
                                  <span className="text-gray-500 dark:text-gray-400"> ({accountInfo.type})</span>
                                </div>
                              ) : (
                                <div><span className="font-medium">{t('lendBorrow.account')}:</span> {t('lendBorrow.unknownAccount')}</div>
                              );
                            })()}
                            
                            {/* Transaction Information */}
                            {record.transaction_id && (
                              <div className="break-all">
                                <span className="font-medium">{t('lendBorrow.transactionId')}:</span> 
                                <span className="font-mono text-xs">{record.transaction_id}</span>
                              </div>
                            )}
                            
                            {/* Settlement Information */}
                            {record.status === 'settled' && record.repayment_transaction_id && (
                              <div className="break-all">
                                <span className="font-medium">{t('lendBorrow.settlementTransaction')}:</span> 
                                <span className="font-mono text-xs">{record.repayment_transaction_id}</span>
                              </div>
                            )}

                            {record.notes && (
                              <div><span className="font-medium">Notes:</span> {record.notes}</div>
                            )}
                            {totalReturned > 0 && (
                              <div>
                                <span className="font-medium">Total Returned:</span> {(formatCurrency || defaultFormatCurrency)(totalReturned, record.currency)}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Return/Payment History */}
                        {recordReturns.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                              {record.type === 'lend' ? t('lendBorrow.returnHistory') : t('lendBorrow.paymentHistory')}
                            </h4>
                            <div className="text-xs text-gray-600 dark:text-gray-300 space-y-2 max-h-32 overflow-y-auto">
                              {recordReturns.map((ret) => (
                                <div key={ret.id} className="border-b border-gray-200 dark:border-gray-700 pb-2 last:border-b-0">
                                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                                    <span className="font-medium">{(formatCurrency || defaultFormatCurrency)(ret.amount, record.currency)}</span>
                                    <span className="text-gray-500 dark:text-gray-400">{formatDate(ret.return_date)}</span>
                                  </div>
                                  
                                  {/* Account Information for Payment */}
                                  {ret.account_id && (() => {
                                    const accountInfo = getAccountInfo(ret.account_id);
                                    return accountInfo ? (
                                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        <span className="font-medium">{t('lendBorrow.account')}:</span> 
                                        <span className="break-words">{accountInfo.name}</span>
                                      </div>
                                    ) : null;
                                  })()}
                                  
                                  {/* Payment Notes */}
                                  {ret.notes && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      <span className="font-medium">{t('lendBorrow.note')}:</span> 
                                      <span className="break-words">{ret.notes}</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
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

    {/* Delete Confirmation Modal */}
    <DeleteConfirmationModal
      isOpen={deleteModal.isOpen}
      onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
      onConfirm={handleConfirmDelete}
      title="Confirm Deletion"
      message={`Are you sure you want to delete this ${deleteModal.recordType} record? This action cannot be undone.`}
      recordDetails={
        <>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="font-medium text-red-800">Record Details:</span>
          </div>
          <div className="text-sm text-red-700 space-y-1">
            <div><span className="font-medium">Person:</span> {deleteModal.recordName}</div>
            <div><span className="font-medium">Type:</span> {deleteModal.recordType === 'lend' ? 'Lend' : 'Borrow'}</div>
            <div><span className="font-medium">Amount:</span> {deleteModal.recordCurrency} {deleteModal.recordAmount.toLocaleString()}</div>
          </div>
        </>
      }
      confirmLabel="Delete Record"
      cancelLabel="Cancel"
    />

    {/* Settlement Modal */}
    {settlementModal.isOpen && settlementModal.record && (
      <SettlementModal
        record={settlementModal.record}
        onClose={() => {
          setSettlementModal({ isOpen: false, record: null });
        }}
        onSettle={(accountId) => {
          onSettle(settlementModal.record!, accountId);
          setSettlementModal({ isOpen: false, record: null });
        }}
        onRecordUpdated={async () => {
          // Refresh the lend/borrow records to show updated status
          await fetchLendBorrowRecords();
        }}
      />
    )}

    
    </>
  );
}; 

