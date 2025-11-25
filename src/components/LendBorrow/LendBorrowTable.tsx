import React, { useMemo, useState } from 'react';
import { Edit2, Trash2, InfoIcon, PlusCircle, Handshake, ChevronUp, ChevronDown, Eye } from 'lucide-react';
import { LendBorrow, LendBorrowReturn } from '../../types';
import { supabase } from '../../lib/supabase';

interface LendBorrowTableProps {
  records: LendBorrow[];
  expandedRows: Set<string>;
  onToggleRow: (recordId: string) => void;
  onEditRecord: (record: LendBorrow) => void;
  onDeleteRecord: (recordId: string) => void;
  onShowInfo: (record: LendBorrow) => void;
  isRearrangeMode: boolean;
  formatCurrency: (amount: number, currency: string) => string;
  selectedId?: string;
  selectedRecordRef?: React.RefObject<HTMLDivElement>;
  isFromSearch?: boolean;
}

export const LendBorrowTable: React.FC<LendBorrowTableProps> = React.memo(({
  records,
  expandedRows,
  onToggleRow,
  onEditRecord,
  onDeleteRecord,
  onShowInfo,
  isRearrangeMode,
  formatCurrency,
  selectedId,
  selectedRecordRef,
  isFromSearch
}) => {
  const [returnHistory, setReturnHistory] = useState<Record<string, LendBorrowReturn[]>>({});

  // Fetch return history for a record
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
      console.error('Error fetching return history:', error);
    }
  };

  // Handle row toggle with return history fetching
  const handleToggleRow = async (recordId: string) => {
    if (!expandedRows.has(recordId)) {
      await fetchReturnHistory(recordId);
    }
    onToggleRow(recordId);
  };

  // Memoize expensive calculations
  const recordData = useMemo(() => {
    return records.map(record => {
      // Calculate days since/until due date
      const now = new Date();
      const dueDate = new Date(record.due_date);
      const daysDiff = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      // Determine if overdue
      const isOverdue = record.status === 'active' && daysDiff < 0;
      
      return {
        record,
        daysDiff,
        isOverdue
      };
    });
  }, [records]);

  const isRowExpanded = (recordId: string) => expandedRows.has(recordId);

  if (recordData.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <Handshake className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No records found</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
          Start tracking your lending and borrowing by adding your first record
        </p>
      </div>
    );
  }

  // Get record type color
  const getRecordTypeColor = (type: string) => {
    switch (type) {
      case 'lend':
        return 'bg-green-100 text-green-800';
      case 'borrow':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get record status color
  const getRecordStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'settled':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900 text-[14px]">
        <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10 shadow-sm">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Person
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Due Date
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {recordData.map((data, index) => {
            const { record, daysDiff, isOverdue } = data;
            const isSelected = selectedId === record.id;
            const isFromSearchSelection = isFromSearch && isSelected;
            
            return (
              <React.Fragment key={record.id}>
                <tr 
                  id={`record-${record.id}`}
                  ref={isSelected ? selectedRecordRef : null}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${
                    isSelected 
                      ? isFromSearchSelection 
                        ? 'ring-2 ring-blue-500 ring-opacity-50 bg-blue-50 dark:bg-blue-900/20' 
                        : 'ring-2 ring-blue-500 ring-opacity-50'
                      : ''
                  }`} 
                          onClick={() => handleToggleRow(record.id)}
                >
                  <td className="px-6 py-[0.7rem]">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {record.person_name}
                        </div>
                        {record.description && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-32">
                            {record.description}
                          </div>
                        )}
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
                    <span className={`inline-flex items-center justify-center text-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRecordTypeColor(record.type)}`}>
                      {record.type === 'lend' ? 'Lend' : 'Borrow'}
                    </span>
                  </td>
                  <td className="px-6 py-[0.7rem] text-center">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(record.amount, record.currency)}
                    </span>
                  </td>
                  <td className="px-6 py-[0.7rem] text-center">
                    <span className={`inline-flex items-center justify-center text-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      isOverdue ? 'bg-red-100 text-red-800' : getRecordStatusColor(record.status)
                    }`}>
                      {isOverdue ? 'Overdue' : record.status}
                    </span>
                  </td>
                  <td className="px-6 py-[0.7rem] text-center">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {new Date(record.due_date).toLocaleDateString()}
                    </div>
                    {record.status === 'active' && (
                      <div className={`text-xs ${
                        isOverdue ? 'text-red-600' : daysDiff <= 7 ? 'text-orange-600' : 'text-gray-500'
                      }`}>
                        {isOverdue ? `${Math.abs(daysDiff)} days overdue` : 
                         daysDiff <= 7 ? `${daysDiff} days left` : 
                         `${daysDiff} days left`}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-[0.7rem] text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onShowInfo(record);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditRecord(record);
                        }}
                        className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteRecord(record.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                
                {/* Expanded Row Content */}
                {isRowExpanded(record.id) && (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 bg-gray-50 dark:bg-gray-800">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Record Details */}
                        <div className="space-y-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white">Record Details</h4>
                          <div className="space-y-1 text-sm">
                            <div><span className="font-medium">Person:</span> {record.person_name}</div>
                            <div><span className="font-medium">Type:</span> 
                              <span className={`ml-1 inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getRecordTypeColor(record.type)}`}>
                                {record.type === 'lend' ? 'Lend' : 'Borrow'}
                              </span>
                            </div>
                            <div><span className="font-medium">Amount:</span> {formatCurrency(record.amount, record.currency)}</div>
                            <div><span className="font-medium">Currency:</span> {record.currency}</div>
                            <div><span className="font-medium">Date:</span> {new Date(record.date).toLocaleDateString()}</div>
                            <div><span className="font-medium">Due Date:</span> {new Date(record.due_date).toLocaleDateString()}</div>
                            {record.description && (
                              <div><span className="font-medium">Description:</span> {record.description}</div>
                            )}
                          </div>
                        </div>

                        {/* Status Information */}
                        <div className="space-y-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white">Status Information</h4>
                          <div className="space-y-1 text-sm">
                            <div><span className="font-medium">Status:</span> 
                              <span className={`ml-1 inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                isOverdue ? 'bg-red-100 text-red-800' : getRecordStatusColor(record.status)
                              }`}>
                                {isOverdue ? 'Overdue' : record.status}
                              </span>
                            </div>
                            {record.status === 'active' && (
                              <div className={`font-medium ${
                                isOverdue ? 'text-red-600' : daysDiff <= 7 ? 'text-orange-600' : 'text-gray-600'
                              }`}>
                                {isOverdue ? `${Math.abs(daysDiff)} days overdue` : 
                                 daysDiff <= 7 ? `${daysDiff} days remaining` : 
                                 `${daysDiff} days remaining`}
                              </div>
                            )}
                            {(() => {
                              const recordReturns = returnHistory[record.id] || [];
                              const totalReturned = recordReturns.reduce((sum, ret) => sum + ret.amount, 0) + (record.partial_return_amount || 0);
                              if (totalReturned > 0) {
                                return (
                                  <div><span className="font-medium">Total Returned:</span> {formatCurrency(totalReturned, record.currency)}</div>
                                );
                              }
                              return null;
                            })()}
                            {record.status !== 'settled' && (() => {
                              const recordReturns = returnHistory[record.id] || [];
                              const totalReturned = recordReturns.reduce((sum, ret) => sum + ret.amount, 0) + (record.partial_return_amount || 0);
                              const remainingAmount = record.amount - totalReturned;
                              return (
                                <div><span className="font-medium">Remaining Amount:</span> {formatCurrency(remainingAmount, record.currency)}</div>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="space-y-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white">Quick Actions</h4>
                          <div className="flex flex-col space-y-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onShowInfo(record);
                              }}
                              className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
                            >
                              <InfoIcon className="w-4 h-4" />
                              <span>View Details</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditRecord(record);
                              }}
                              className="flex items-center space-x-2 px-3 py-2 text-sm bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                              <span>Edit Record</span>
                            </button>
                            {(record.status === 'active' || record.status === 'overdue') && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Handle settlement logic here
                                }}
                                className="flex items-center space-x-2 px-3 py-2 text-sm bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100 transition-colors"
                              >
                                <PlusCircle className="w-4 h-4" />
                                <span>Mark as Settled</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});
