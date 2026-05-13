import React from 'react';
import { X } from 'lucide-react';
import { CustomDropdown } from '../Purchases/CustomDropdown';
import { LazyDayPicker as DatePicker } from '../common/LazyDayPicker';
import { parseLocalDate, toBusinessDateString } from '../../utils/taskDateUtils';
import type { EntryType } from '../../types/businessInvestment';
import {
  invModalDateInputClass,
  invModalInputClass,
  invModalDateShellClass,
  invModalFormGridClass,
  invModalFormFooterClass,
  invModalCancelBtnClass,
  invModalSubmitBtnClass
} from './businessInvestmentModalFormTokens';

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
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Record contract update</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1">
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-4 sm:p-5 overflow-y-auto flex-1 min-h-0 overscroll-contain">
          <div className={invModalFormGridClass}>
            <CustomDropdown
              value={entryForm.contract_id}
              onChange={(value) => setEntryForm((prev) => ({ ...prev, contract_id: value }))}
              options={contractOptions}
              placeholder="Contract"
              fullWidth
            />
            <CustomDropdown
              value={entryForm.type}
              onChange={(value) => setEntryForm((prev) => ({ ...prev, type: value as EntryType }))}
              options={entryTypeOptions}
              placeholder="Type"
              fullWidth
            />
            <input
              type="number"
              min="0"
              step="0.01"
              value={entryForm.amount}
              onChange={(e) => setEntryForm((prev) => ({ ...prev, amount: e.target.value }))}
              placeholder="Amount"
              className={invModalInputClass}
              required
            />
            <div className={invModalDateShellClass}>
              <DatePicker
                selected={parseLocalDate(entryForm.date)}
                onChange={(date) =>
                  setEntryForm((prev) => ({ ...prev, date: date ? toBusinessDateString(date) : '' }))
                }
                placeholderText="Entry date"
                dateFormat="yyyy-MM-dd"
                className={invModalDateInputClass}
                todayButton="Today"
                isClearable
                autoComplete="off"
              />
            </div>
          </div>

          <div className="mt-3 space-y-3 sm:mt-4">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
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
              fullWidth
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Profit and principal returned → income. Loss and capital contribution → expense.
            </p>
          </div>

          <textarea
            value={entryForm.note}
            onChange={(e) => setEntryForm((prev) => ({ ...prev, note: e.target.value }))}
            placeholder="Optional note for this update"
            rows={2}
            className={`${invModalInputClass} min-h-[80px] mt-3 sm:mt-4`}
          />

          <div className={invModalFormFooterClass}>
            <button type="button" onClick={onClose} className={invModalCancelBtnClass}>
              Cancel
            </button>
            <button type="submit" className={invModalSubmitBtnClass}>
              Add entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
