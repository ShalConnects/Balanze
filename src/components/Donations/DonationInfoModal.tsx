import React from 'react';
import { X, Lock } from 'lucide-react';

interface DonationInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DonationInfoModal: React.FC<DonationInfoModalProps> = ({ isOpen, onClose }) => {
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
          <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
             <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-center" style={{ marginTop: '20px' }}>
               <div className="flex justify-center mb-3">
                 <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
               </div>
               <p className="font-medium text-blue-800 dark:text-blue-200 mb-3">Why is this donation protected?</p>
               <div className="text-sm text-blue-800 dark:text-blue-200">
                 <p>
                   Transaction-linked donations are automatically created and managed to ensure 
                   accurate financial tracking and account balance synchronization.
                 </p>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
