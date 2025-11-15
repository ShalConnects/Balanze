import React from 'react';
import { Edit2, Trash2, Plus, Copy, Files, ArrowUpRight, ArrowDownRight, Calendar, Tag } from 'lucide-react';
import { Transaction, Account } from '../../types';
import { formatCurrency } from '../../utils/accountUtils';
import { format } from 'date-fns';
import { formatTransactionDescription } from '../../utils/transactionDescriptionFormatter';

interface TransactionMobileViewProps {
  transactions: Transaction[];
  accounts: Account[];
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (transactionId: string) => void;
  onCopyTransactionId: (transactionId: string) => void;
  onDuplicateTransaction?: (transaction: Transaction) => void;
  onAddTransaction: () => void;
  getAccountName: (accountId: string) => string;
}

export const TransactionMobileView: React.FC<TransactionMobileViewProps> = React.memo(({
  transactions,
  accounts,
  onEditTransaction,
  onDeleteTransaction,
  onCopyTransactionId,
  onDuplicateTransaction,
  onAddTransaction,
  getAccountName
}) => {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No transactions found</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
          No transactions match your current filters
        </p>
        <button
          onClick={onAddTransaction}
          className="bg-gradient-primary text-white px-6 py-3 rounded-lg hover:bg-gradient-primary-hover transition-colors flex items-center justify-center mx-auto"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Transaction
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Quick Actions Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Transactions ({transactions.length})
        </h2>
        <button
          onClick={onAddTransaction}
          className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
          aria-label="Add new transaction"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Transaction Cards */}
      <div className="space-y-3">
        {transactions.map((transaction) => {
          const account = accounts.find(a => a.id === transaction.account_id);
          const isTransfer = transaction.tags?.includes('transfer');

          return (
            <div
              key={transaction.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-all duration-200"
            >
              {/* Transaction Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isTransfer 
                      ? 'bg-purple-100 dark:bg-purple-900/30' 
                      : transaction.type === 'income'
                      ? 'bg-green-100 dark:bg-green-900/30'
                      : 'bg-red-100 dark:bg-red-900/30'
                  }`}>
                    {isTransfer ? (
                      <ArrowUpRight className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    ) : transaction.type === 'income' ? (
                      <ArrowUpRight className="w-5 h-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatTransactionDescription(transaction.description)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {format(new Date(transaction.date), 'MMM dd, yyyy HH:mm')}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${
                    transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}
                    {formatCurrency(transaction.amount, account?.currency || 'USD')}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {getAccountName(transaction.account_id)}
                  </div>
                </div>
              </div>

              {/* Transaction Details */}
              <div className="flex items-center justify-between mb-3 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-4">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                    {transaction.category}
                  </span>
                  {isTransfer ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200">
                      Transfer
                    </span>
                  ) : (
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      transaction.type === 'income'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                    }`}>
                      {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                    </span>
                  )}
                </div>
                {transaction.tags && transaction.tags.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <Tag className="w-3 h-3 text-gray-400" />
                    <span className="text-xs">{transaction.tags.length} tags</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onCopyTransactionId(transaction.id)}
                    className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Copy Transaction ID"
                    aria-label={`Copy ${transaction.description} transaction ID`}
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  {onDuplicateTransaction && !transaction.is_recurring && (
                    <button
                      onClick={() => onDuplicateTransaction(transaction)}
                      className="p-2 text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                      title="Duplicate transaction"
                      aria-label={`Duplicate ${transaction.description} transaction`}
                    >
                      <Files className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => onEditTransaction(transaction)}
                    className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Edit transaction"
                    aria-label={`Edit ${transaction.description} transaction`}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteTransaction(transaction.id)}
                    className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Delete transaction"
                    aria-label={`Delete ${transaction.description} transaction`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Additional Info */}
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {transaction.is_recurring && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200">
                      Recurring
                    </span>
                  )}
                </div>
              </div>

              {/* Tags Display */}
              {transaction.tags && transaction.tags.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex flex-wrap gap-1">
                    {transaction.tags.map((tag, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Stats Footer */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Quick Stats</h3>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Total Income:</span>
            <span className="ml-1 font-medium text-green-600 dark:text-green-400">
              {formatCurrency(
                transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
                accounts[0]?.currency || 'USD'
              )}
            </span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Total Expenses:</span>
            <span className="ml-1 font-medium text-red-600 dark:text-red-400">
              {formatCurrency(
                transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
                accounts[0]?.currency || 'USD'
              )}
            </span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Net Amount:</span>
            <span className={`ml-1 font-medium ${
              transactions.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0) >= 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              {formatCurrency(
                Math.abs(transactions.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0)),
                accounts[0]?.currency || 'USD'
              )}
            </span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Recurring:</span>
            <span className="ml-1 font-medium text-gray-900 dark:text-white">
              {transactions.filter(t => t.is_recurring).length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

TransactionMobileView.displayName = 'TransactionMobileView'; 

