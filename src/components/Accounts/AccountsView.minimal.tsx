import React from 'react';
import { CreditCard } from 'lucide-react';

export const AccountsView: React.FC = () => {
  return (
    <>
      <div>
        <h1>Accounts View</h1>
        <p>Minimal test version</p>
      </div>
      
      <div className="text-center py-12">
        <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <CreditCard className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Minimal test</h3>
      </div>
    </>
  );
};
