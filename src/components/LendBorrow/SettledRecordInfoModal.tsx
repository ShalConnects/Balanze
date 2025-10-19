import React from 'react';
import { X, Info, Lock } from 'lucide-react';
import { LendBorrow } from '../../types/index';

interface SettledRecordInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  record?: LendBorrow | null;
}

export const SettledRecordInfoModal: React.FC<SettledRecordInfoModalProps> = ({ 
  isOpen, 
  onClose, 
  record 
}) => {
  if (!isOpen) return null;

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 relative">
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
          <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="flex justify-center mb-3">
                <Info className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {record?.status === 'settled' ? 'Settled Record Information' : 'Account-Linked Record Information'}
              </h3>
            </div>

            {/* Record Details */}
            {record && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600 dark:text-gray-400">Person:</span>
                    <span className="text-gray-900 dark:text-white">{record.person_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600 dark:text-gray-400">Type:</span>
                    <span className="text-gray-900 dark:text-white capitalize">{record.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600 dark:text-gray-400">Amount:</span>
                    <span className="text-gray-900 dark:text-white">{formatCurrency(record.amount, record.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600 dark:text-gray-400">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      record.status === 'active' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                      record.status === 'settled' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                      'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                    }`}>
                      {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </span>
                  </div>
                  {record.due_date && (
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600 dark:text-gray-400">Due Date:</span>
                      <span className="text-gray-900 dark:text-white">{new Date(record.due_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Explanation */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-center">
               <div className="flex justify-center mb-3">
                 <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
               </div>
              <p className="font-medium text-blue-800 dark:text-blue-200 mb-3">
                {record?.status === 'settled' 
                  ? 'Why can\'t this record be edited or deleted?' 
                  : 'Why can\'t this record be edited or deleted?'
                }
              </p>
               <div className="text-sm text-blue-800 dark:text-blue-200">
                {record?.status === 'settled' ? (
                  <p>
                    This record has been settled and is linked to financial transactions. 
                    Editing or deleting it would affect your account balance and transaction history.
                  </p>
                ) : (
                  <p>
                    This record is linked to an account and has created financial transactions. 
                    Editing or deleting it would affect your account balance and transaction history.
                  </p>
                )}
               </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};
