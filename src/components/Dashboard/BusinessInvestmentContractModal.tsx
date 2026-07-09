import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '../../utils/currency';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useAuthStore } from '../../store/authStore';
import { CustomDropdown } from '../Purchases/CustomDropdown';
import {
  accountsToTransactionDropdownOptions,
  prepareAccountsForTransactionDropdown,
  resolveDefaultAccountIdForTransactionDropdown
} from '../../utils/transactionAccountDropdown';
import { LazyDayPicker as DatePicker } from '../common/LazyDayPicker';
import { parseLocalDate, getTodayLocalDateString } from '../../utils/taskDateUtils';
import { insertBusinessInvestmentContract, updateBusinessInvestmentContractDetails } from '../../lib/businessInvestmentService';
import { getProfilePreferredCurrency } from '../../utils/usePreferredCurrency';
import { TRANSACTION_ORIGIN_BUSINESS_INVESTMENT } from '../../lib/transactionListLock';
import type { ContractStatus, InvestmentContract } from '../../types/businessInvestment';
import {
  invModalDateInputClass as dateInputClass,
  invModalInputClass as modalInputClass,
  invModalDateShellClass as modalDateShellClass,
  invModalFormGridClass,
  invModalFormFooterClass,
  invModalCancelBtnClass,
  invModalSubmitBtnClass
} from './businessInvestmentModalFormTokens';

const defaultContractForm = {
  title: '',
  principal: '',
  funding_account_id: '',
  start_date: '',
  end_date: '',
  note: '',
  status: 'active' as ContractStatus
};

const formatDateYmd = (date: Date | null) =>
  date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : '';

/** Trimmed start date, or today (local) when empty — not used for end_date. */
const resolveContractStartDateYmd = (raw: string) => raw.trim() || getTodayLocalDateString();

const PRINCIPAL_COMMIT_HINT =
  'Committed principal cannot be changed after saving. If the amount is wrong, adjust the linked expense transaction or delete this contract and add it again.';

export interface BusinessInvestmentContractModalProps {
  open: boolean;
  onClose: () => void;
  editingContract?: InvestmentContract | null;
  onAdded?: (contract: InvestmentContract) => void;
  onUpdated?: (payload: {
    id: string;
    title: string;
    start_date: string;
    end_date?: string;
    note?: string;
    status: ContractStatus;
  }) => void;
}

export const BusinessInvestmentContractModal: React.FC<BusinessInvestmentContractModalProps> = ({
  open,
  onClose,
  editingContract = null,
  onAdded,
  onUpdated
}) => {
  const { accounts, addTransaction } = useFinanceStore();
  const { user, profile } = useAuthStore();
  const userDefaultCurrency = getProfilePreferredCurrency(profile);
  const [contractForm, setContractForm] = useState(defaultContractForm);
  const [createPrincipalExpense, setCreatePrincipalExpense] = useState(false);

  const basePreparedAccounts = useMemo(
    () => prepareAccountsForTransactionDropdown(accounts, userDefaultCurrency, null),
    [accounts, userDefaultCurrency]
  );
  const fundingAccountOptions = useMemo(
    () => accountsToTransactionDropdownOptions(basePreparedAccounts),
    [basePreparedAccounts]
  );
  const selectedFundingAccount = useMemo(
    () => accounts.find((account) => account.id === contractForm.funding_account_id),
    [accounts, contractForm.funding_account_id]
  );
  const isEditingContract = Boolean(editingContract);

  const formatAmount = (amount: number, currency: string) => formatCurrency(amount, currency || userDefaultCurrency);
  const fundingNameForEdit = editingContract
    ? accounts.find((a) => a.id === editingContract.funding_account_id)?.name ||
      editingContract.funding_account_name ||
      'Unknown'
    : '';

  useEffect(() => {
    if (!open) return;
    if (editingContract) {
      setContractForm({
        title: editingContract.title,
        principal: String(editingContract.principal),
        funding_account_id: editingContract.funding_account_id,
        start_date: editingContract.start_date?.trim() ? editingContract.start_date : resolveContractStartDateYmd(''),
        end_date: editingContract.end_date ?? '',
        note: editingContract.note ?? '',
        status: editingContract.status
      });
    } else {
      setContractForm({
        ...defaultContractForm,
        funding_account_id: resolveDefaultAccountIdForTransactionDropdown(basePreparedAccounts, profile),
        start_date: resolveContractStartDateYmd('')
      });
    }
    setCreatePrincipalExpense(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- form init when open / contract id changes only
  }, [open, editingContract?.id, basePreparedAccounts, profile]);

  const handleAddContract = async (e: React.FormEvent) => {
    e.preventDefault();
    const principal = Number(contractForm.principal);
    if (!contractForm.title.trim() || !contractForm.funding_account_id || !principal || principal <= 0) {
      toast.error('Please complete contract title, account, and principal');
      return;
    }

    const fundingAccount = basePreparedAccounts.find((account) => account.id === contractForm.funding_account_id);
    if (!fundingAccount) {
      toast.error('Please select a valid funding account');
      return;
    }

    if (!user?.id) {
      toast.error('Sign in to save contracts');
      return;
    }

    const startDate = resolveContractStartDateYmd(contractForm.start_date);

    try {
      const newContract = await insertBusinessInvestmentContract({
        title: contractForm.title.trim(),
        principal,
        currency: fundingAccount.currency || 'USD',
        funding_account_id: fundingAccount.id,
        funding_account_name: fundingAccount.name,
        start_date: startDate,
        end_date: contractForm.end_date.trim() ? contractForm.end_date : undefined,
        status: 'active',
        note: contractForm.note.trim() || undefined
      });

      onAdded?.(newContract);
      onClose();
      toast.success('Contract added');

      if (createPrincipalExpense && user) {
        try {
          await addTransaction({
            user_id: user.id,
            account_id: fundingAccount.id,
            type: 'expense',
            amount: principal,
            description: `Investment principal: ${newContract.title}`,
            date: newContract.start_date,
            category: 'Investment',
            is_recurring: false,
            origin: TRANSACTION_ORIGIN_BUSINESS_INVESTMENT,
            business_investment_contract_id: newContract.id
          });
          toast.success('Principal expense transaction created');
        } catch (error) {
          console.error('Failed to create principal expense transaction:', error);
          toast.warning('Contract saved, but principal expense transaction failed');
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Failed to save contract');
    }
  };

  const handleUpdateContractDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContract) return;
    if (!contractForm.title.trim()) {
      toast.error('Please complete title');
      return;
    }
    const startDate = resolveContractStartDateYmd(contractForm.start_date);
    try {
      await updateBusinessInvestmentContractDetails(editingContract.id, {
        title: contractForm.title.trim(),
        start_date: startDate,
        end_date: contractForm.end_date.trim() ? contractForm.end_date : null,
        note: contractForm.note.trim() ? contractForm.note.trim() : null,
        status: contractForm.status
      });
      onUpdated?.({
        id: editingContract.id,
        title: contractForm.title.trim(),
        start_date: startDate,
        end_date: contractForm.end_date.trim() || undefined,
        note: contractForm.note.trim() || undefined,
        status: contractForm.status
      });
      onClose();
      toast.success('Contract updated');
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Failed to update contract');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div
        className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col min-h-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            {isEditingContract ? 'Edit contract' : 'Add Contract'}
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1">
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <form
          onSubmit={isEditingContract ? handleUpdateContractDetails : handleAddContract}
          className="p-4 sm:p-5 overflow-y-auto flex-1 min-h-0 overscroll-contain"
        >
          <div className={invModalFormGridClass}>
            <input
              type="text"
              value={contractForm.title}
              onChange={(e) => setContractForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Contract title"
              className={modalInputClass}
              required
            />
            {isEditingContract ? (
              <div
                className={`${modalInputClass} flex items-center cursor-default text-gray-700 dark:text-gray-200`}
                title="Principal is tied to saved transactions"
              >
                {editingContract ? formatAmount(editingContract.principal, editingContract.currency) : (contractForm.principal || '—')}
              </div>
            ) : (
              <input
                type="number"
                min="0"
                step="0.01"
                value={contractForm.principal}
                onChange={(e) => setContractForm((prev) => ({ ...prev, principal: e.target.value }))}
                placeholder="Principal amount"
                className={modalInputClass}
                required
              />
            )}
            {!isEditingContract ? (
              <p className="sm:col-span-2 text-xs sm:text-sm text-amber-800 dark:text-amber-200/90 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 rounded-lg px-3 py-2 break-words leading-snug">
                {PRINCIPAL_COMMIT_HINT}
              </p>
            ) : null}
            {isEditingContract ? (
              <>
                <div
                  className={`${modalInputClass} flex items-center cursor-default text-gray-700 dark:text-gray-200 sm:col-span-1`}
                  title="Funding account is tied to the principal transaction"
                >
                  {fundingNameForEdit}
                </div>
                <div className="flex items-center px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                  Currency: {editingContract?.currency ?? selectedFundingAccount?.currency ?? '-'}
                </div>
                <CustomDropdown
                  value={contractForm.status}
                  onChange={(value) =>
                    setContractForm((prev) => ({ ...prev, status: value as ContractStatus }))
                  }
                  options={[
                    { value: 'active', label: 'Active' },
                    { value: 'closed', label: 'Closed' }
                  ]}
                  placeholder="Status"
                  fullWidth
                />
              </>
            ) : (
              <>
                <CustomDropdown
                  value={contractForm.funding_account_id}
                  onChange={(value) => setContractForm((prev) => ({ ...prev, funding_account_id: value }))}
                  options={fundingAccountOptions}
                  placeholder="Select account *"
                  fullWidth
                />
                <div className="flex items-center px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                  Currency: {selectedFundingAccount?.currency || '-'}
                </div>
              </>
            )}
            <div className={modalDateShellClass}>
              <DatePicker
                selected={parseLocalDate(contractForm.start_date)}
                onChange={(date) => setContractForm((prev) => ({ ...prev, start_date: formatDateYmd(date) }))}
                placeholderText="Start date *"
                dateFormat="yyyy-MM-dd"
                className={dateInputClass}
                todayButton="Today"
                isClearable
                autoComplete="off"
              />
            </div>
            <div className={modalDateShellClass}>
              <DatePicker
                selected={parseLocalDate(contractForm.end_date)}
                onChange={(date) => setContractForm((prev) => ({ ...prev, end_date: formatDateYmd(date) }))}
                placeholderText="End date"
                dateFormat="yyyy-MM-dd"
                className={dateInputClass}
                todayButton="Today"
                isClearable
                autoComplete="off"
              />
            </div>
          </div>
          {isEditingContract ? (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 sm:mt-2.5">
              Status matches the badge in your list. Closed contracts cannot receive new profit/loss entries until reopened.
            </p>
          ) : null}
          <textarea
            value={contractForm.note}
            onChange={(e) => setContractForm((prev) => ({ ...prev, note: e.target.value }))}
            placeholder="Optional note"
            rows={2}
            className={`${modalInputClass} min-h-[80px] mt-3 sm:mt-4`}
          />
          {!isEditingContract ? (
            <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 mt-3">
              <input
                type="checkbox"
                checked={createPrincipalExpense}
                onChange={(e) => setCreatePrincipalExpense(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              Also create expense transaction for principal from funding account
            </label>
          ) : null}
          <div className={invModalFormFooterClass}>
            <button type="button" onClick={onClose} className={invModalCancelBtnClass}>
              Cancel
            </button>
            <button type="submit" className={invModalSubmitBtnClass}>
              {isEditingContract ? 'Save changes' : 'Save Contract'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
