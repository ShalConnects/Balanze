import React, { useMemo, useState } from 'react';
import { X, Calendar, RefreshCw, Pause, Play, Hash, Infinity, ArrowRight, Repeat } from 'lucide-react';
import { Transaction } from '../../types/index';
import { format } from 'date-fns';
import { formatCurrency } from '../../utils/currency';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Tooltip } from '../common/Tooltip';

interface RecurringTransactionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  allTransactions: Transaction[];
  getAccountName: (accountId: string) => string;
  selectedCurrency: string;
}

export const RecurringTransactionDetailsModal: React.FC<RecurringTransactionDetailsModalProps> = ({
  isOpen,
  onClose,
  transaction,
  allTransactions,
  getAccountName,
  selectedCurrency,
}) => {
  const forceNextOccurrence = useFinanceStore(state => state.forceNextOccurrence);
  const [isForcing, setIsForcing] = useState(false);

  if (!isOpen || !transaction) return null;

  // Determine if this is a parent recurring transaction or a child instance
  const isParentRecurring = transaction.is_recurring;
  const parentTransaction = useMemo(() => {
    if (!isParentRecurring && transaction.parent_recurring_id) {
      return allTransactions.find(t => t.id === transaction.parent_recurring_id);
    }
    return null;
  }, [transaction, allTransactions, isParentRecurring]);

  // Get all child instances if this is a parent recurring transaction
  const childInstances = useMemo(() => {
    if (isParentRecurring) {
      return allTransactions
        .filter(t => t.parent_recurring_id === transaction.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Most recent first
    }
    return [];
  }, [isParentRecurring, transaction, allTransactions]);

  // The transaction to display details for
  const displayTransaction = isParentRecurring ? transaction : (parentTransaction || transaction);

  if (!displayTransaction) return null;

  const getFrequencyLabel = (frequency?: string) => {
    if (!frequency) return 'N/A';
    const labels: { [key: string]: string } = {
      daily: 'Daily',
      weekly: 'Weekly',
      biweekly: 'Bi-weekly',
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      yearly: 'Yearly',
      annually: 'Annually',
    };
    return labels[frequency.toLowerCase()] || frequency;
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        
        {/* Content */}
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Recurring Transaction Details
          </h2>

          {/* Transaction Info */}
          <div className="mb-6">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Description</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{displayTransaction.description}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Amount</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(displayTransaction.amount, selectedCurrency)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Account</p>
                  <p className="text-sm text-gray-900 dark:text-white">{getAccountName(displayTransaction.account_id)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Category</p>
                  <p className="text-sm text-gray-900 dark:text-white">{displayTransaction.category}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Type</p>
                  <p className="text-sm text-gray-900 dark:text-white capitalize">{displayTransaction.type}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Created</p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {format(new Date(displayTransaction.created_at), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Recurring Details */}
          {isParentRecurring ? (
            <>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Recurring Schedule
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <RefreshCw className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Frequency</p>
                      <p className="text-sm text-gray-900 dark:text-white">{getFrequencyLabel(displayTransaction.recurring_frequency)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Next Occurrence</p>
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm text-gray-900 dark:text-white">
                          {displayTransaction.next_occurrence_date
                            ? format(new Date(displayTransaction.next_occurrence_date), 'MMM dd, yyyy')
                            : 'N/A'}
                        </p>
                        {!displayTransaction.is_paused && displayTransaction.next_occurrence_date && (
                          <Tooltip content="Force Next Occurrence" placement="top">
                            <button
                              onClick={async () => {
                                if (isForcing) return;
                                setIsForcing(true);
                                try {
                                  await forceNextOccurrence(displayTransaction.id);
                                } catch (error) {
                                  // Error already handled in store
                                } finally {
                                  setIsForcing(false);
                                }
                              }}
                              disabled={isForcing}
                              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Repeat className={`w-3.5 h-3.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 ${isForcing ? 'animate-spin text-blue-600 dark:text-blue-400' : ''}`} />
                            </button>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    {displayTransaction.is_paused ? (
                      <Pause className="w-5 h-5 text-yellow-500 mt-0.5" />
                    ) : (
                      <Play className="w-5 h-5 text-green-500 mt-0.5" />
                    )}
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Status</p>
                      <p className={`text-sm font-medium ${displayTransaction.is_paused ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`}>
                        {displayTransaction.is_paused ? 'Paused' : 'Active'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    {displayTransaction.recurring_end_date ? (
                      <Calendar className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                    ) : (
                      <Infinity className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                    )}
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">End Date</p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {displayTransaction.recurring_end_date
                          ? format(new Date(displayTransaction.recurring_end_date), 'MMM dd, yyyy')
                          : 'No end date (infinite)'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Hash className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Occurrence Count</p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {displayTransaction.occurrence_count || 0} {displayTransaction.occurrence_count === 1 ? 'time' : 'times'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Child Instances */}
              {childInstances.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <ArrowRight className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    Generated Instances ({childInstances.length})
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {childInstances.map((instance) => (
                      <div
                        key={instance.id}
                        className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {format(new Date(instance.date), 'MMM dd, yyyy')}
                            </p>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatCurrency(instance.amount, selectedCurrency)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{instance.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : parentTransaction ? (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <ArrowRight className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Parent Recurring Transaction
              </h3>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Frequency</p>
                    <p className="text-sm text-gray-900 dark:text-white">{getFrequencyLabel(parentTransaction.recurring_frequency)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Next Occurrence</p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {parentTransaction.next_occurrence_date
                        ? format(new Date(parentTransaction.next_occurrence_date), 'MMM dd, yyyy')
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Status</p>
                    <p className={`text-sm font-medium ${parentTransaction.is_paused ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`}>
                      {parentTransaction.is_paused ? 'Paused' : 'Active'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Occurrence Count</p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {parentTransaction.occurrence_count || 0} {parentTransaction.occurrence_count === 1 ? 'time' : 'times'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
