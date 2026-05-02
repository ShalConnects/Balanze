import React from 'react';
import { X } from 'lucide-react';
import { CustomDropdown } from '../Purchases/CustomDropdown';
import { LazyDayPicker as DatePicker } from '../common/LazyDayPicker';
import { parseLocalDate } from '../../utils/taskDateUtils';
import type { EntryType } from '../../types/businessInvestment';

export interface ContractUpdateFormState {
  contract_id: string;
  type: EntryType;
  amount: string;
  date: string;
  note: string;
}

interface Option {
  value: string;
  label: string;
}

interface BusinessInvestmentUpdateModalProps {
  open: boolean;
  onClose: () => void;
  entryForm: ContractUpdateFormState;
  setEntryForm: React.Dispatch<React.SetStateAction<ContractUpdateFormState>>;
  contractOptions: Option[];
  entryTypeOptions: Option[];
  postEntryAsTransaction: boolean;
  setPostEntryAsTransaction: React.Dispatch<React.SetStateAction<boolean>>;
  postingAccountId: string;
  setPostingAccountId: React.Dispatch<React.SetStateAction<string>>;
  postingAccountOptions: Option[];
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

const dateInputClass =
  'bg-transparent outline-none border-none w-full cursor-pointer text-[14px] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400';
const compactInputClass =
  'w-full pl-8 pr-2 py-1.5 text-[13px] h-8 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 transition-colors border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800';
const compactDateShellClass =
  'flex items-center bg-gray-50 dark:bg-gray-800 px-3 pr-[10px] text-[13px] h-8 rounded-md border border-gray-300 dark:border-gray-700';
const compactTextareaClass =
  'w-full px-3 py-2 text-[13px] rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400';
const compactDropdownClass =
  'px-3 py-1.5 pr-2 text-[13px] h-8 rounded-md transition-colors bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700';

const formatDateYmd = (date: Date | null) =>
  date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : '';

export const BusinessInvestmentUpdateModal: React.FC<BusinessInvestmentUpdateModalProps> = ({
  open,
  onClose,
  entryForm,
  setEntryForm,
  contractOptions,
  entryTypeOptions,
  postEntryAsTransaction,
  setPostEntryAsTransaction,
  postingAccountId,
  setPostingAccountId,
  postingAccountOptions,
  onSubmit
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div
        className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col min-h-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Update Contract</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1">
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3 p-4 sm:p-5 overflow-y-auto flex-1 min-h-0 overscroll-contain">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-5">
            <CustomDropdown
              value={entryForm.contract_id}
              onChange={(value) => setEntryForm((prev) => ({ ...prev, contract_id: value }))}
              options={contractOptions}
              placeholder="Contract"
              className={compactDropdownClass}
            />
            <CustomDropdown
              value={entryForm.type}
              onChange={(value) => setEntryForm((prev) => ({ ...prev, type: value as EntryType }))}
              options={entryTypeOptions}
              placeholder="Type"
              className={compactDropdownClass}
            />
            <input
              type="number"
              min="0"
              step="0.01"
              value={entryForm.amount}
              onChange={(e) => setEntryForm((prev) => ({ ...prev, amount: e.target.value }))}
              placeholder="Amount"
              className={compactInputClass}
              required
            />
            <div className={compactDateShellClass}>
              <DatePicker
                selected={parseLocalDate(entryForm.date)}
                onChange={(date) => setEntryForm((prev) => ({ ...prev, date: formatDateYmd(date) }))}
                placeholderText="Entry date *"
                dateFormat="yyyy-MM-dd"
                className={dateInputClass}
                todayButton="Today"
                isClearable
                autoComplete="off"
              />
            </div>
            <button
              type="submit"
              className="flex h-10 w-full min-h-10 items-center justify-center rounded-md bg-gradient-primary px-3 text-xs text-white transition-colors hover:bg-gradient-primary-hover sm:h-8 sm:min-h-0 sm:w-auto sm:px-2 sm:text-[13px] md:px-3 touch-manipulation"
            >
              Add Entry
            </button>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:gap-3 lg:grid-cols-2">
            <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 text-xs text-gray-700 dark:text-gray-300 sm:min-h-0 sm:text-[13px]">
              <input
                type="checkbox"
                checked={postEntryAsTransaction}
                onChange={(e) => setPostEntryAsTransaction(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              Post transaction to account
            </label>
            <CustomDropdown
              value={postingAccountId}
              onChange={setPostingAccountId}
              options={postingAccountOptions}
              placeholder="Select account *"
              disabled={!postEntryAsTransaction}
              className={compactDropdownClass}
              fullWidth
            />
            <p className="text-[11px] leading-snug text-gray-500 dark:text-gray-400 lg:col-span-2">
              Profit and principal returned → income. Loss and capital contribution → expense.
            </p>
          </div>
          <textarea
            value={entryForm.note}
            onChange={(e) => setEntryForm((prev) => ({ ...prev, note: e.target.value }))}
            placeholder="Optional note for this update"
            rows={2}
            className={`${compactTextareaClass} min-h-[4.5rem] sm:min-h-0`}
          />
        </form>
      </div>
    </div>
  );
};
