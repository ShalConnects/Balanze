import React from 'react';
import { Copy, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '../../utils/currency';
import { formatTimeUTC } from '../../utils/timezoneUtils';

interface TransferMobileViewProps {
  transfers: any[];
  onCopyTransactionId: (id: string) => void;
}

export const TransferMobileView: React.FC<TransferMobileViewProps> = ({
  transfers,
  onCopyTransactionId
}) => {
  if (transfers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 dark:text-gray-500 mb-2">
          <ArrowRight className="h-12 w-12 mx-auto" />
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
    <div className="space-y-3 p-4">
      {transfers.map((transfer, idx) => {
        const fromAccount = transfer.fromAccount || transfer.from_account;
        const toAccount = transfer.toAccount || transfer.to_account;
        const amount = transfer.fromAmount || transfer.amount;
        const currency = transfer.fromCurrency || fromAccount?.currency;

        return (
          <div key={transfer.id || idx} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
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
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {format(new Date(transfer.date), 'MMM d')} • {formatTimeUTC(transfer.created_at, 'h:mm a')}
                </span>
              </div>
              {transfer.transaction_id && (
                <button
                  onClick={() => onCopyTransactionId(transfer.transaction_id)}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                  title="Copy Transaction ID"
                >
                  <Copy className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Transfer Details */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">From</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">{fromAccount?.name}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">To</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">{toAccount?.name}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">Amount</div>
                <div className="text-sm font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(amount, currency)}
                </div>
              </div>
              {transfer.exchangeRate && transfer.exchangeRate !== 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Exchange Rate</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {transfer.exchangeRate.toFixed(4)}
                  </div>
                </div>
              )}
              {transfer.note && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-500 dark:text-gray-400">{transfer.note}</div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
