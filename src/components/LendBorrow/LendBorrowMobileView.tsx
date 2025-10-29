import React from 'react';
import { Edit2, Trash2, Plus, Info, ChevronRight, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { LendBorrow } from '../../types';

interface LendBorrowMobileViewProps {
  records: LendBorrow[];
  onEditRecord: (record: LendBorrow) => void;
  onDeleteRecord: (recordId: string) => void;
  onAddRecord: () => void;
  onShowInfo: (record: LendBorrow) => void;
  onSettle: (record: LendBorrow) => void;
  onShowSettledInfo: (record: LendBorrow) => void;
  canDeleteRecord: (record: LendBorrow) => boolean;
  formatCurrency: (amount: number, currency: string) => string;
  selectedId?: string;
  selectedRecordRef?: React.RefObject<HTMLDivElement>;
  isFromSearch?: boolean;
}

export const LendBorrowMobileView: React.FC<LendBorrowMobileViewProps> = React.memo(({
  records,
  onEditRecord,
  onDeleteRecord,
  onAddRecord,
  onShowInfo,
  onSettle,
  onShowSettledInfo,
  canDeleteRecord,
  formatCurrency,
  selectedId,
  selectedRecordRef,
  isFromSearch
}) => {
  const [expandedRecordId, setExpandedRecordId] = React.useState<string | null>(null);
  if (records.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <Plus className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No records yet</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
          Start tracking your lending and borrowing by adding your first record
        </p>
        <button
          onClick={onAddRecord}
          className="bg-gradient-primary text-white px-6 py-3 rounded-lg hover:bg-gradient-primary-hover transition-colors flex items-center justify-center mx-auto"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Your First Record
        </button>
      </div>
    );
  }

  // Get record type color
  const getRecordTypeColor = (type: string) => {
    switch (type) {
      case 'lend':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'borrow':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Get record status color
  const getRecordStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'settled':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-4" style={{ paddingLeft: '10px', paddingRight: '10px' }}>
      {/* Record Cards */}
      <div className="space-y-3">
        {records.map((record) => {
          const now = new Date();
          const dueDate = new Date(record.due_date);
          const daysDiff = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          const isOverdue = record.status === 'active' && daysDiff < 0;
          const isSelected = selectedId === record.id;
          const isFromSearchSelection = isFromSearch && isSelected;

          return (
            <div
              key={record.id}
              id={`record-${record.id}`}
              ref={isSelected ? selectedRecordRef : null}
              className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-all duration-200 ${
                isSelected 
                  ? isFromSearchSelection 
                    ? 'ring-2 ring-blue-500 ring-opacity-50 bg-blue-50 dark:bg-blue-900/20' 
                    : 'ring-2 ring-blue-500 ring-opacity-50'
                  : ''
              }`}
            >
              {/* Record Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {record.person_name}
                    </div>
                    <div className="text-xs">
                      <span className={`inline-flex items-center justify-center text-center px-2 py-0.5 rounded-full text-xs font-medium ${getRecordTypeColor(record.type)}`}>
                        {record.type === 'lend' ? 'Lend' : 'Borrow'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatCurrency(record.amount, record.currency)}
                  </div>
                </div>
              </div>

              {/* Record Stats */}
              <div className="flex items-center justify-between mb-3 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    isOverdue ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : getRecordStatusColor(record.status)
                  }`}>
                    {isOverdue ? 'Overdue' : record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                  </span>
                  {record.status === 'active' && (
                    <span className={`text-xs ${
                      isOverdue ? 'text-red-600' : daysDiff <= 7 ? 'text-orange-600' : 'text-gray-500'
                    }`}>
                      {isOverdue ? `${Math.abs(daysDiff)} days overdue` : 
                       daysDiff <= 7 ? `${daysDiff} days left` : 
                       `${daysDiff} days left`}
                    </span>
                  )}
                </div>
                <div className="text-xs">
                  Due: {format(new Date(record.due_date), 'MMM dd, yyyy')}
                </div>
              </div>

              {/* Description */}
              {record.description && (
                <div className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                  {record.description}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end">
                <div className="flex items-center space-x-1">
                  {/* Info/Edit button based on record status */}
                  {record.status === 'settled' ? (
                    <button
                      onClick={() => onShowSettledInfo(record)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Settled record info"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  ) : record.account_id ? (
                    <button
                      onClick={() => onShowSettledInfo(record)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Account-linked record info"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => onEditRecord(record)}
                      className="p-1.5 text-gray-400 hover:text-green-600 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  
                  {/* Settlement button for active and overdue records */}
                  {(record.status === 'active' || record.status === 'overdue') && (
                    <button
                      onClick={() => onSettle(record)}
                      className="p-1.5 text-gray-400 hover:text-purple-600 transition-colors"
                      title="Settle"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  
                  {/* Delete button - only show if record can be deleted */}
                  {canDeleteRecord(record) && (
                    <button
                      onClick={() => onDeleteRecord(record.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => setExpandedRecordId(expandedRecordId === record.id ? null : record.id)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                    title="View details"
                  >
                    <ChevronRight className={`w-4 h-4 transition-transform ${expandedRecordId === record.id ? 'rotate-90' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedRecordId === record.id && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-1 gap-4">
                    {/* Record Details */}
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white">Record Details</h4>
                      <div className="space-y-1 text-sm" style={{ fontSize: '12px' }}>
                        <div style={{ marginTop: 0 }}><span className="font-medium">Person:</span> {record.person_name}</div>
                        <div style={{ marginTop: 0 }}><span className="font-medium">Type:</span> 
                          <span className={`ml-1 inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getRecordTypeColor(record.type)}`}>
                            {record.type === 'lend' ? 'Lend' : 'Borrow'}
                          </span>
                        </div>
                        <div style={{ marginTop: 0 }}><span className="font-medium">Amount:</span> {formatCurrency(record.amount, record.currency)}</div>
                        <div style={{ marginTop: 0 }}><span className="font-medium">Currency:</span> {record.currency}</div>
                        <div style={{ marginTop: 0 }}><span className="font-medium">Date:</span> {record.created_at ? (isNaN(new Date(record.created_at).getTime()) ? 'No date' : format(new Date(record.created_at), 'MMM dd, yyyy')) : 'No date'}</div>
                        <div style={{ marginTop: 0 }}><span className="font-medium">Due Date:</span> {format(new Date(record.due_date), 'MMM dd, yyyy')}</div>
                        {record.description && (
                          <div style={{ marginTop: 0 }}><span className="font-medium">Description:</span> {record.description}</div>
                        )}
                      </div>
                    </div>

                    {/* Status Information */}
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white">Status Information</h4>
                      <div className="space-y-1 text-sm" style={{ fontSize: '12px' }}>
                        <div style={{ marginTop: 0 }}><span className="font-medium">Status:</span> 
                          <span className={`ml-1 inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            isOverdue ? 'bg-red-100 text-red-800' : getRecordStatusColor(record.status)
                          }`}>
                            {isOverdue ? 'Overdue' : record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                          </span>
                        </div>
                        {record.status === 'active' && (
                          <div style={{ marginTop: 0 }} className={`font-medium ${
                            isOverdue ? 'text-red-600' : daysDiff <= 7 ? 'text-orange-600' : 'text-gray-600'
                          }`}>
                            {isOverdue ? `${Math.abs(daysDiff)} days overdue` : 
                             daysDiff <= 7 ? `${daysDiff} days remaining` : 
                             `${daysDiff} days remaining`}
                          </div>
                        )}
                        {record.partial_return_amount && record.partial_return_amount > 0 && (
                          <div style={{ marginTop: 0 }}><span className="font-medium">Partial Return:</span> {formatCurrency(record.partial_return_amount, record.currency)}</div>
                        )}
                        {record.partial_return_date && !isNaN(new Date(record.partial_return_date).getTime()) && (
                          <div style={{ marginTop: 0 }}><span className="font-medium">Partial Return Date:</span> {format(new Date(record.partial_return_date), 'MMM dd, yyyy')}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Settled Records Info */}
              {record.status === 'settled' && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1 text-green-600">
                      <CheckCircle className="w-3 h-3" />
                      <span>Settled on {format(new Date(record.due_date), 'MMM dd, yyyy')}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});
