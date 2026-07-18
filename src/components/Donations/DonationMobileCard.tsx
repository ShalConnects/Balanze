import React from 'react';
import { CheckCircle, Clock, Info, Trash2 } from 'lucide-react';
import { DonationSavingRecord } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { Tooltip } from '../common/Tooltip';

const ACTION_BTN =
  'p-1.5 text-gray-500 dark:text-gray-400 rounded-md transition-colors hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900/20';

interface DonationMobileCardProps {
  record: DonationSavingRecord;
  currency: string;
  dateLabel: string;
  idLabel: string;
  onToggleStatus: () => void;
  onShowInfo: () => void;
  onDelete: () => void;
}

export const DonationMobileCard: React.FC<DonationMobileCardProps> = ({
  record,
  currency,
  dateLabel,
  idLabel,
  onToggleStatus,
  onShowInfo,
  onDelete,
}) => {
  const isManual = !record.transaction_id;
  const isDonated = record.status === 'donated';
  const note = record.note?.replace(/\(?Currency:\s*[A-Z]{3}\)?/g, '').trim();

  return (
    <article
      id={`donation-${record.id}`}
      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-3 space-y-1.5"
      aria-labelledby={`donation-title-${record.id}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3
          id={`donation-title-${record.id}`}
          className="text-sm font-medium text-gray-900 dark:text-white"
        >
          {record.mode === 'fixed' ? 'Fixed' : 'Percentage'}
        </h3>
        <span
          className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
            isDonated
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
          }`}
        >
          {isDonated ? 'Donated' : 'Pending'}
        </span>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <span className="text-base font-bold text-gray-900 dark:text-white">
          {formatCurrency(record.amount, currency)}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">{dateLabel}</span>
      </div>

      <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-gray-100 dark:border-gray-800">
        <span className="text-xs text-gray-500 dark:text-gray-400 truncate min-w-0">{idLabel}</span>
        <div className="flex items-center gap-1 shrink-0">
          {isManual ? (
            <>
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                role="status"
                aria-label="Manual donation"
              >
                Manual
              </span>
              <Tooltip content="Delete manual donation" placement="top">
                <button
                  onClick={onDelete}
                  className={`${ACTION_BTN} hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20`}
                  aria-label="Delete manual donation"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
            </>
          ) : (
            <>
              <button
                onClick={onToggleStatus}
                className={ACTION_BTN}
                title={isDonated ? 'Mark as Pending' : 'Mark as Donated'}
                aria-label={isDonated ? 'Mark as Pending' : 'Mark as Donated'}
              >
                {isDonated ? <Clock className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
              </button>
              <Tooltip content="Transaction-linked donation info" placement="top">
                <button
                  onClick={onShowInfo}
                  className={ACTION_BTN}
                  aria-label="Transaction-linked donation info"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
            </>
          )}
        </div>
      </div>

      {note ? (
        <p className="text-xs text-gray-600 dark:text-gray-400 italic truncate">Note: {note}</p>
      ) : null}
    </article>
  );
};
