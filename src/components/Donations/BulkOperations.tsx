import React, { useState } from 'react';
import { CheckSquare, Square, Trash2, Download, Edit, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface BulkOperationsProps {
  records: any[];
  selectedRecords: string[];
  setSelectedRecords: (ids: string[]) => void;
  onBulkStatusChange: (ids: string[], status: 'donated' | 'pending') => Promise<void>;
  onBulkDelete: (ids: string[]) => Promise<void>;
  onBulkExport: (ids: string[]) => void;
}

export const BulkOperations: React.FC<BulkOperationsProps> = ({
  records,
  selectedRecords,
  setSelectedRecords,
  onBulkStatusChange,
  onBulkDelete,
  onBulkExport
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const allSelected = selectedRecords.length === records.length && records.length > 0;
  const someSelected = selectedRecords.length > 0 && selectedRecords.length < records.length;

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(records.map(record => record.id));
    }
  };

  const handleSelectRecord = (recordId: string) => {
    if (selectedRecords.includes(recordId)) {
      setSelectedRecords(selectedRecords.filter(id => id !== recordId));
    } else {
      setSelectedRecords([...selectedRecords, recordId]);
    }
  };

  const handleBulkStatusChange = async (status: 'donated' | 'pending') => {
    if (selectedRecords.length === 0) {
      toast.error('Please select at least one donation');
      return;
    }

    setIsProcessing(true);
    try {
      await onBulkStatusChange(selectedRecords, status);
      toast.success(`Successfully updated ${selectedRecords.length} donation(s) to ${status}`);
      setSelectedRecords([]); // Clear selection after successful operation
    } catch (error) {
      toast.error('Failed to update donations');

    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRecords.length === 0) {
      toast.error('Please select at least one donation');
      return;
    }

    setShowConfirmDelete(true);
  };

  const confirmBulkDelete = async () => {
    setIsProcessing(true);
    try {
      await onBulkDelete(selectedRecords);
      toast.success(`Successfully deleted ${selectedRecords.length} donation(s)`);
      setSelectedRecords([]); // Clear selection after successful operation
    } catch (error) {
      toast.error('Failed to delete donations');

    } finally {
      setIsProcessing(false);
      setShowConfirmDelete(false);
    }
  };

  const handleBulkExport = () => {
    if (selectedRecords.length === 0) {
      toast.error('Please select at least one donation');
      return;
    }

    onBulkExport(selectedRecords);
    toast.success(`Exported ${selectedRecords.length} donation(s)`);
  };

  // Calculate totals for selected records
  const selectedRecordsData = records.filter(record => selectedRecords.includes(record.id));
  const totalSelectedAmount = selectedRecordsData.reduce((sum, record) => sum + (record.amount || 0), 0);
  const donatedCount = selectedRecordsData.filter(record => record.status === 'donated').length;
  const pendingCount = selectedRecordsData.filter(record => record.status === 'pending').length;

  if (records.length === 0) {
    return null;
  }

  return (
    <>
      {/* Bulk Operations Bar */}
      {selectedRecords.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <CheckSquare className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  {selectedRecords.length} donation(s) selected
                </span>
              </div>
              
              {/* Selection Stats */}
              <div className="flex items-center space-x-4 text-sm text-blue-700 dark:text-blue-300">
                <span>Total: ${totalSelectedAmount.toFixed(2)}</span>
                <span>Donated: {donatedCount}</span>
                <span>Pending: {pendingCount}</span>
              </div>
            </div>

            {/* Bulk Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleBulkStatusChange('donated')}
                disabled={isProcessing}
                className="flex items-center space-x-1 px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-sm rounded-lg transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Mark Donated</span>
              </button>

              <button
                onClick={() => handleBulkStatusChange('pending')}
                disabled={isProcessing}
                className="flex items-center space-x-1 px-3 py-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white text-sm rounded-lg transition-colors"
              >
                <Clock className="w-4 h-4" />
                <span>Mark Pending</span>
              </button>

              <button
                onClick={handleBulkExport}
                disabled={isProcessing}
                className="flex items-center space-x-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>

              <button
                onClick={handleBulkDelete}
                disabled={isProcessing}
                className="flex items-center space-x-1 px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white text-sm rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>

              <button
                onClick={() => setSelectedRecords([])}
                className="flex items-center space-x-1 px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors"
              >
                <span>Clear</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Header with Select All */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleSelectAll}
              className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              {allSelected ? (
                <CheckSquare className="w-4 h-4 text-blue-600" />
              ) : someSelected ? (
                <div className="w-4 h-4 border-2 border-blue-600 rounded bg-blue-600 flex items-center justify-center">
                  <div className="w-1 h-1 bg-white rounded"></div>
                </div>
              ) : (
                <Square className="w-4 h-4 text-gray-400" />
              )}
              <span>
                {allSelected ? 'Deselect All' : someSelected ? `${selectedRecords.length} Selected` : 'Select All'}
              </span>
            </button>
            
            {selectedRecords.length > 0 && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({selectedRecords.length} of {records.length})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Bulk Delete */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Confirm Bulk Delete</h3>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete {selectedRecords.length} selected donation(s)? This action cannot be undone.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={confirmBulkDelete}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                {isProcessing ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={() => setShowConfirmDelete(false)}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Higher-order component to add selection functionality to table rows
export const withSelection = (Component: React.ComponentType<any>) => {
  return (props: any) => {
    const { record, selectedRecords, onSelectRecord, ...restProps } = props;
    const isSelected = selectedRecords.includes(record.id);

    return (
      <div className="flex items-center space-x-3">
        <button
          onClick={() => onSelectRecord(record.id)}
          className="flex-shrink-0"
        >
          {isSelected ? (
            <CheckSquare className="w-4 h-4 text-blue-600" />
          ) : (
            <Square className="w-4 h-4 text-gray-400 hover:text-gray-600" />
          )}
        </button>
        <Component {...restProps} />
      </div>
    );
  };
}; 

