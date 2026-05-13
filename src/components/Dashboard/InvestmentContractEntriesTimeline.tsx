import { useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { InvestmentEntry } from '../../types/businessInvestment';
import { ENTRY_TYPE_LABELS } from '../../types/businessInvestment';
import {
  amountClass,
  chipClass,
  sortInvestmentEntriesByDateDesc,
  investmentEntryIsOutflow
} from '../../utils/investmentContractEntryPresentation';
import { LP } from '../common/listPage/listPageLayout';
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';

const thBase =
  'px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400';
const tdClass = 'px-3 py-2 align-middle text-xs text-gray-800 dark:text-gray-200';

/** Same character as desktop Note column when empty. */
const emptyInvestmentEntryNote = '—';

const mobileEntryNoteRowClass =
  'mt-1.5 border-t border-gray-200 pt-1.5 text-[11px] leading-snug break-words dark:border-gray-600';

export type InvestmentContractEntriesTimelineProps = {
  entries: InvestmentEntry[];
  currency: string;
  formatAmount: (amount: number, currency: string) => string;
  formatDate: (isoDate: string) => string;
  removeButtonClassName: string;
  onRemoveEntry: (entryId: string) => void;
};

export function InvestmentContractEntriesTimeline({
  entries,
  currency,
  formatAmount,
  formatDate,
  removeButtonClassName,
  onRemoveEntry
}: InvestmentContractEntriesTimelineProps) {
  const sorted = useMemo(() => sortInvestmentEntriesByDateDesc(entries), [entries]);
  const [pendingEntryId, setPendingEntryId] = useState<string | null>(null);
  const pendingEntry = useMemo(
    () => (pendingEntryId ? sorted.find((e) => e.id === pendingEntryId) : undefined),
    [pendingEntryId, sorted]
  );

  if (sorted.length === 0 && !pendingEntryId) return null;

  const queueRemoveEntry = (entryId: string) => setPendingEntryId(entryId);

  return (
    <>
      {sorted.length > 0 ? (
        <>
      <ul className="mt-0.5 list-none space-y-2 p-0 sm:space-y-3 md:hidden" role="list">
        {sorted.map((entry) => {
          const outflow = investmentEntryIsOutflow(entry.type);
          const hasNote = Boolean(entry.note);
          return (
            <li key={entry.id} className="min-w-0">
              <div className="rounded-md border border-gray-200 bg-gray-50/90 p-2 dark:border-gray-600 dark:bg-gray-800/50 sm:p-2.5">
                <div className="flex min-w-0 flex-nowrap items-center gap-1.5 sm:gap-2">
                  <p className="shrink-0 text-xs font-medium tabular-nums text-gray-800 dark:text-gray-100">{formatDate(entry.date)}</p>
                  <span
                    className={`inline-flex max-w-[min(8rem,38%)] shrink-0 truncate rounded-full px-1.5 py-px text-[10px] font-semibold leading-tight sm:max-w-none sm:px-2 sm:py-0.5 sm:text-[11px] ${chipClass[entry.type]}`}
                  >
                    {ENTRY_TYPE_LABELS[entry.type]}
                  </span>
                  <span className="min-w-0 flex-1" aria-hidden />
                  <p className={`shrink-0 text-xs font-semibold tabular-nums sm:text-sm ${amountClass[entry.type]}`}>
                    {outflow ? '-' : '+'}
                    {formatAmount(entry.amount, currency)}
                  </p>
                  <button
                    type="button"
                    onClick={() => queueRemoveEntry(entry.id)}
                    className={`shrink-0 ${removeButtonClassName}`}
                    aria-label="Remove entry"
                  >
                    <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </button>
                </div>
                <p
                  className={`${mobileEntryNoteRowClass} ${
                    hasNote ? 'text-gray-600 dark:text-gray-400' : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {hasNote ? entry.note : emptyInvestmentEntryNote}
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="hidden md:block overflow-x-auto rounded-md border border-gray-200 dark:border-gray-700">
        <table className={LP.table}>
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className={`${thBase} text-left`}>Date</th>
              <th className={`${thBase} text-center`}>Type</th>
              <th className={`${thBase} text-right`}>Amount</th>
              <th className={`${thBase} text-left`}>Note</th>
              <th className={`${thBase} w-12 text-center`}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {sorted.map((entry) => {
              const outflow = investmentEntryIsOutflow(entry.type);
              return (
                <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/80">
                  <td className={`${tdClass} whitespace-nowrap tabular-nums text-gray-600 dark:text-gray-400`}>
                    {formatDate(entry.date)}
                  </td>
                  <td className={`${tdClass} text-center`}>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${chipClass[entry.type]}`}>
                      {ENTRY_TYPE_LABELS[entry.type]}
                    </span>
                  </td>
                  <td className={`${tdClass} text-right font-semibold tabular-nums ${amountClass[entry.type]}`}>
                    {outflow ? '-' : '+'}
                    {formatAmount(entry.amount, currency)}
                  </td>
                  <td className={`${tdClass} max-w-[min(100%,14rem)]`}>
                    {entry.note ? (
                      <span className="line-clamp-2 break-words text-gray-600 dark:text-gray-400" title={entry.note}>
                        {entry.note}
                      </span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">{emptyInvestmentEntryNote}</span>
                    )}
                  </td>
                  <td className={`${tdClass} text-center`}>
                    <button
                      type="button"
                      onClick={() => queueRemoveEntry(entry.id)}
                      className={removeButtonClassName}
                      aria-label="Remove entry"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
        </>
      ) : null}

      <DeleteConfirmationModal
        isOpen={pendingEntryId !== null}
        onClose={() => setPendingEntryId(null)}
        onConfirm={() => {
          const id = pendingEntryId;
          if (id) onRemoveEntry(id);
        }}
        title="Remove this update?"
        message="This removes the entry from the contract history. This cannot be undone."
        recordDetails={
          pendingEntry ? (
            <div className="space-y-1 text-xs text-gray-800 dark:text-gray-200 sm:text-sm">
              <p>
                <span className="font-medium">Type:</span> {ENTRY_TYPE_LABELS[pendingEntry.type]}
              </p>
              <p className="tabular-nums">
                <span className="font-medium">Date:</span> {formatDate(pendingEntry.date)}
              </p>
              <p className={`font-semibold tabular-nums ${amountClass[pendingEntry.type]}`}>
                <span className="font-medium text-gray-700 dark:text-gray-300">Amount:</span>{' '}
                {investmentEntryIsOutflow(pendingEntry.type) ? '-' : '+'}
                {formatAmount(pendingEntry.amount, currency)}
              </p>
              {pendingEntry.note ? (
                <p className="text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Note:</span> {pendingEntry.note}
                </p>
              ) : null}
            </div>
          ) : undefined
        }
        confirmLabel="Remove entry"
      />
    </>
  );
}
