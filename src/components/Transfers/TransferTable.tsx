import React, { useMemo } from 'react';
import { Copy, ChevronUp, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '../../utils/currency';
import { formatTimeUTC } from '../../utils/timezoneUtils';

interface TransferTableProps {
  transfers: any[];
  onCopyTransactionId: (id: string) => void;
  sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
  onSort: (key: string) => void;
}

export const TransferTable: React.FC<TransferTableProps> = React.memo(({
  transfers,
  onCopyTransactionId,
  sortConfig,
  onSort
}) => {
  // Get sort icon
  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ChevronUp className="w-4 h-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-blue-600" />
      : <ChevronDown className="w-4 h-4 text-blue-600" />;
  };

  if (transfers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 dark:text-gray-500 mb-2">
          <Copy className="h-12 w-12 mx-auto" />
        </div>
        <div className="text-lg font-medium text-gray-900 dark:text-white mb-1">
          No transfers found
        </div>
        <div className="text-gray-500 dark:text-gray-400">
          Create your first transfer to get started
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => onSort('date')}
            >
              <div className="flex items-center space-x-1">
                <span>Date</span>
                {getSortIcon('date')}
              </div>
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => onSort('type')}
            >
              <div className="flex items-center space-x-1">
                <span>Type</span>
                {getSortIcon('type')}
              </div>
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => onSort('fromAccount')}
            >
              <div className="flex items-center space-x-1">
                <span>From Account</span>
                {getSortIcon('fromAccount')}
              </div>
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Amount
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => onSort('toAccount')}
            >
              <div className="flex items-center space-x-1">
                <span>To Account</span>
                {getSortIcon('toAccount')}
              </div>
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {transfers.map((transfer, idx) => {
            const fromAccount = transfer.fromAccount || transfer.from_account;
            const toAccount = transfer.toAccount || transfer.to_account;
            const amount = transfer.fromAmount || transfer.amount;
            const currency = transfer.fromCurrency || fromAccount?.currency;

            return (
              <tr key={transfer.id || idx} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                  <div>
                    <div className="font-medium">
                      {format(new Date(transfer.date), 'MMM d, yyyy')}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">
                      {formatTimeUTC(transfer.created_at, 'h:mm a')}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    transfer.type === 'currency' 
                      ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                      : transfer.type === 'dps'
                      ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                      : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                  }`}>
                    {transfer.type === 'currency' ? 'Currency' : 
                     transfer.type === 'dps' ? 'DPS' : 'In-Account'}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                  <div className="font-medium">{fromAccount?.name}</div>
                  <div className="text-gray-500 dark:text-gray-400">{fromAccount?.currency}</div>
                </td>
                <td className="px-4 py-4 text-sm text-center">
                  <div className="font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(amount, currency)}
                  </div>
                  {transfer.exchangeRate && transfer.exchangeRate !== 1 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Rate: {transfer.exchangeRate.toFixed(4)}
                    </div>
                  )}
                </td>
                <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                  <div className="font-medium">{toAccount?.name}</div>
                  <div className="text-gray-500 dark:text-gray-400">{toAccount?.currency}</div>
                </td>
                <td className="px-4 py-4 text-sm text-center">
                  {transfer.transaction_id && (
                    <button
                      onClick={() => onCopyTransactionId(transfer.transaction_id)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                      title="Copy Transaction ID"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});
