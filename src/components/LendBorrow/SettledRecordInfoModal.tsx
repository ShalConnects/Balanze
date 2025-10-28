import React from 'react';
import { X, Lock } from 'lucide-react';
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
          <div className="text-gray-700 dark:text-gray-300 leading-relaxed" style={{ marginTop: '10px' }}>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-center">
              <div className="flex justify-center mb-3">
                <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="font-medium text-blue-800 dark:text-blue-200 mb-3">
                Why can't this record be edited or deleted?
              </p>
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p>
                  This record is linked to an account and has created financial transactions. 
                  Editing or deleting it would affect your account balance and transaction history.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
