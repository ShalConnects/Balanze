import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, ChevronUp, Plus, Trash2, Wallet, TrendingUp, TrendingDown, Landmark, X, Building2, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '../../utils/currency';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useAuthStore } from '../../store/authStore';
import { CustomDropdown } from '../Purchases/CustomDropdown';
import { LazyDayPicker as DatePicker } from '../common/LazyDayPicker';
import { parseLocalDate } from '../../utils/taskDateUtils';
import { INVESTMENTS_FEATURE_ICON } from '../../lib/investmentFeatureIcon';
import {
  LP,
  LP_SEARCH_ACTIVE_STYLE,
  listPageMobileFilterIconButtonClass,
  ListPageErrorBanner,
  ListPageFilterSearchField,
  ListPageClearFiltersButton,
  ListPageFilterSelect,
  ListPageMobileFilterModal,
  ListPageMobileFilterSection,
  ListPageMobileFilterChip
} from '../common/listPage/listPageLayout';
import { InvestmentListSkeleton } from '../Investments/InvestmentListSkeleton';
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';
import type { ContractStatus, EntryType, InvestmentContract } from '../../types/businessInvestment';
import {
  deleteBusinessInvestmentContract,
  deleteBusinessInvestmentEntry,
  fetchBusinessInvestmentContracts,
  insertBusinessInvestmentContract,
  insertBusinessInvestmentEntry,
  updateBusinessInvestmentContractStatus
} from '../../lib/businessInvestmentService';
import { TRANSACTION_ORIGIN_BUSINESS_INVESTMENT } from '../../lib/transactionListLock';

type SortField = 'title' | 'funding_account_name' | 'status';
type SortDirection = 'asc' | 'desc';
const dateInputClass = 'bg-transparent outline-none border-none w-full cursor-pointer text-[14px] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400';
const compactInputClass = 'w-full pl-8 pr-2 py-1.5 text-[13px] h-8 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 transition-colors border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800';
const modalInputClass =
  'w-full px-4 py-2 text-[14px] h-10 rounded-lg border transition-colors bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600';
const compactDateShellClass =
  'flex items-center bg-gray-50 dark:bg-gray-800 px-3 pr-[10px] text-[13px] h-8 rounded-md border border-gray-300 dark:border-gray-700';
const modalDateShellClass =
  'flex items-center bg-gray-100 dark:bg-gray-700 px-3 pr-[10px] text-[14px] h-10 rounded-lg border border-gray-200 dark:border-gray-600';
const compactTextareaClass =
  'w-full px-3 py-2 text-[13px] rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400';
const compactDropdownClass =
  'px-3 py-1.5 pr-2 text-[13px] h-8 rounded-md transition-colors bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700';
const defaultContractForm = {
  title: '',
  principal: '',
  funding_account_id: '',
  start_date: '',
  end_date: '',
  note: ''
};
const defaultEntryForm = {
  contract_id: '',
  type: 'profit' as EntryType,
  amount: '',
  date: '',
  note: ''
};
const formatDateYmd = (date: Date | null) =>
  date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : '';

/** Prevents labels like "Cash Wallet (EUR) (EUR)" when `name` already ends with the currency. */
const accountDropdownLabel = (name: string, currency: string) => {
  const t = name.trim();
  const c = currency.trim();
  if (!c) return t;
  return t.toLowerCase().endsWith(`(${c.toLowerCase()})`) ? t : `${t} (${c})`;
};

const getContractStats = (contract: InvestmentContract) => {
  const totalProfit = contract.entries.filter((entry) => entry.type === 'profit').reduce((sum, entry) => sum + entry.amount, 0);
  const totalLoss = contract.entries.filter((entry) => entry.type === 'loss').reduce((sum, entry) => sum + entry.amount, 0);
  const principalReturned = contract.entries.filter((entry) => entry.type === 'principal_return').reduce((sum, entry) => sum + entry.amount, 0);
  const netResult = (totalProfit - totalLoss) + (principalReturned - contract.principal);
  return { totalProfit, totalLoss, principalReturned, netResult };
};

/** Same disclosure chevron as AccountsView (row expand). */
function ContractRowChevron({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${expanded ? 'rotate-90' : ''}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

export const BusinessInvestmentTracker: React.FC = () => {
  const [contracts, setContracts] = useState<InvestmentContract[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showContractModal, setShowContractModal] = useState(false);
  const [expandedContractIds, setExpandedContractIds] = useState<Set<string>>(() => new Set());
  const [contractForm, setContractForm] = useState(defaultContractForm);
  const [createPrincipalExpense, setCreatePrincipalExpense] = useState(false);
  const [entryForm, setEntryForm] = useState(defaultEntryForm);
  const [postProfitAsIncome, setPostProfitAsIncome] = useState(true);
  const [incomeAccountId, setIncomeAccountId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ContractStatus>('all');
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [isContractUpdateOpen, setIsContractUpdateOpen] = useState(true);
  const [showMobileFilterMenu, setShowMobileFilterMenu] = useState(false);
  const [summaryCurrency, setSummaryCurrency] = useState('');
  const [tempMobileFilters, setTempMobileFilters] = useState({
    summaryCurrency: '',
    status: 'all' as 'all' | ContractStatus
  });
  const [contractIdToDelete, setContractIdToDelete] = useState<string | null>(null);

  const { accounts, addTransaction, fetchTransactions, fetchAccounts } = useFinanceStore();
  const { user, profile } = useAuthStore();
  const userDefaultCurrency = profile?.local_currency?.trim() || 'USD';
  const formatAmount = (amount: number, currency: string) => formatCurrency(amount, currency || userDefaultCurrency);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoadError(null);
      if (!user?.id) {
        setContracts([]);
        setHydrated(true);
        return;
      }
      try {
        const data = await fetchBusinessInvestmentContracts(user?.id);
        if (!cancelled) setContracts(data);
      } catch (error) {
        console.error('Failed to load business investments:', error);
        if (!cancelled) setLoadError(error instanceof Error ? error.message : 'Failed to load saved investments');
      } finally {
        if (!cancelled) setHydrated(true);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const fundingAccounts = useMemo(
    () => accounts.filter((account) => account.type !== 'credit' && account.isActive),
    [accounts]
  );
  const postingAccounts = useMemo(
    () => accounts.filter((account) => account.type !== 'credit'),
    [accounts]
  );
  const selectedFundingAccount = useMemo(
    () => fundingAccounts.find((account) => account.id === contractForm.funding_account_id),
    [fundingAccounts, contractForm.funding_account_id]
  );
  const selectedContract = useMemo(
    () => contracts.find((contract) => contract.id === entryForm.contract_id),
    [contracts, entryForm.contract_id]
  );
  const selectedIncomeAccount = useMemo(
    () => postingAccounts.find((account) => account.id === incomeAccountId),
    [postingAccounts, incomeAccountId]
  );
  useEffect(() => {
    if (incomeAccountId && postingAccounts.some((account) => account.id === incomeAccountId)) return;
    const defaultAccount = postingAccounts.find((account) => account.isActive) || postingAccounts[0];
    if (defaultAccount) setIncomeAccountId(defaultAccount.id);
  }, [postingAccounts, incomeAccountId]);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const searchPending = searchTerm !== debouncedSearch;

  /** Distinct currencies from the user's accounts; else from contracts; else profile default — no "All" row. */
  const currencyFilterCodes = useMemo(() => {
    const fromAccounts = [...new Set(accounts.map((a) => a.currency).filter(Boolean))].sort();
    if (fromAccounts.length > 0) return fromAccounts;
    const fromContracts = [...new Set(contracts.map((c) => c.currency).filter(Boolean))].sort();
    if (fromContracts.length > 0) return fromContracts;
    return [userDefaultCurrency];
  }, [accounts, contracts, userDefaultCurrency]);

  const showCurrencyFilter = currencyFilterCodes.length > 1;

  useEffect(() => {
    setSummaryCurrency((prev) => (currencyFilterCodes.includes(prev) ? prev : currencyFilterCodes[0]));
  }, [currencyFilterCodes]);

  const filterCurrency = currencyFilterCodes.includes(summaryCurrency) ? summaryCurrency : currencyFilterCodes[0];
  const currencyFilterActive = showCurrencyFilter && filterCurrency !== currencyFilterCodes[0];

  useEffect(() => {
    if (!showMobileFilterMenu) return;
    setTempMobileFilters({ summaryCurrency: filterCurrency, status: statusFilter });
  }, [showMobileFilterMenu, filterCurrency, statusFilter]);

  const currencyFilterOptions = useMemo(
    () => currencyFilterCodes.map((c) => ({ value: c, label: c })),
    [currencyFilterCodes]
  );

  const visibleContracts = useMemo(
    () => contracts.filter((c) => c.currency === filterCurrency),
    [contracts, filterCurrency]
  );

  const contractCurrencyCodes = useMemo(
    () => [...new Set(visibleContracts.map((c) => c.currency))].filter(Boolean).sort(),
    [visibleContracts]
  );
  const summaryMixedCurrencies = contractCurrencyCodes.length > 1;
  const summaryListForTotals = useMemo(() => {
    if (contractCurrencyCodes.length <= 1) return visibleContracts;
    return visibleContracts.filter((c) => c.currency === contractCurrencyCodes[0]);
  }, [visibleContracts, contractCurrencyCodes]);

  const summaryDisplayCurrency =
    contractCurrencyCodes[0] ?? filterCurrency ?? fundingAccounts[0]?.currency ?? accounts[0]?.currency ?? userDefaultCurrency;

  const summary = useMemo(() => {
    const list = summaryListForTotals;
    const totalPrincipal = list.reduce((sum, contract) => sum + contract.principal, 0);
    const totalProfit = list.reduce((sum, contract) => sum + getContractStats(contract).totalProfit, 0);
    const totalLoss = list.reduce((sum, contract) => sum + getContractStats(contract).totalLoss, 0);
    const totalPrincipalReturned = list.reduce((sum, contract) => sum + getContractStats(contract).principalReturned, 0);
    const overallNet = list.reduce((sum, contract) => sum + getContractStats(contract).netResult, 0);
    return { totalPrincipal, totalProfit, totalLoss, totalPrincipalReturned, overallNet };
  }, [summaryListForTotals]);

  const pendingDeleteTitle = useMemo(
    () => contracts.find((c) => c.id === contractIdToDelete)?.title,
    [contracts, contractIdToDelete]
  );
  const contractOptions = useMemo(
    () => contracts.map((contract) => ({ value: contract.id, label: `${contract.title} (${contract.currency})` })),
    [contracts]
  );
  const statusFilterOptions = useMemo(
    () => [
      { value: 'all', label: 'All Status' },
      { value: 'active', label: 'Active' },
      { value: 'closed', label: 'Closed' }
    ],
    []
  );
  const entryTypeOptions = useMemo(
    () => [
      { value: 'profit', label: 'Profit' },
      { value: 'loss', label: 'Loss' },
      { value: 'principal_return', label: 'Principal Returned' }
    ],
    []
  );
  const fundingAccountOptions = useMemo(
    () =>
      fundingAccounts.map((account) => ({
        value: account.id,
        label: accountDropdownLabel(account.name, account.currency)
      })),
    [fundingAccounts]
  );
  const postingAccountOptions = useMemo(
    () =>
      postingAccounts.map((account) => ({
        value: account.id,
        label: accountDropdownLabel(account.name, account.currency)
      })),
    [postingAccounts]
  );
  const fundingAccountNameMap = useMemo(() => new Map(accounts.map((account) => [account.id, account.name])), [accounts]);
  const getFundingAccountName = (contract: InvestmentContract) =>
    fundingAccountNameMap.get(contract.funding_account_id) || contract.funding_account_name || 'Unknown';
  const clearFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setStatusFilter('all');
    setSortField('title');
    setSortDirection('asc');
    if (showCurrencyFilter) setSummaryCurrency(currencyFilterCodes[0]);
  };
  const hasVisibleFilters =
    searchTerm.trim().length > 0 || statusFilter !== 'all' || currencyFilterActive;
  const mobileFilterApplyActive =
    (showCurrencyFilter && tempMobileFilters.summaryCurrency !== filterCurrency) ||
    tempMobileFilters.status !== statusFilter;
  const processedContracts = useMemo(() => {
    const normalizedSearch = debouncedSearch.trim().toLowerCase();
    const filtered = visibleContracts.filter((contract) => {
      if (statusFilter !== 'all' && contract.status !== statusFilter) return false;
      if (!normalizedSearch) return true;
      const fundingName = getFundingAccountName(contract).toLowerCase();
      return (
        contract.title.toLowerCase().includes(normalizedSearch) ||
        fundingName.includes(normalizedSearch) ||
        (contract.note || '').toLowerCase().includes(normalizedSearch)
      );
    });
    return filtered.sort((a, b) => {
      const direction = sortDirection === 'asc' ? 1 : -1;
      if (sortField === 'status') return a.status.localeCompare(b.status) * direction;
      if (sortField === 'funding_account_name') return getFundingAccountName(a).localeCompare(getFundingAccountName(b)) * direction;
      return a.title.localeCompare(b.title) * direction;
    });
  }, [visibleContracts, debouncedSearch, statusFilter, sortField, sortDirection, fundingAccountNameMap]);
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortField(field);
    setSortDirection('asc');
  };
  const getSortIcon = (field: SortField) =>
    sortField === field ? (
      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />
    ) : (
      <ChevronUp className="w-4 h-4 text-gray-300 dark:text-gray-600" />
    );

  const contractsEmptyBody = (
    <>
      <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
        <INVESTMENTS_FEATURE_ICON className="w-12 h-12 text-gray-400" />
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">No contract records found</h3>
      <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-4 sm:mb-6 max-w-sm mx-auto px-4">
        {hasVisibleFilters ? 'No contracts match your filters' : 'Start managing your contracts by adding your first contract'}
      </p>
    </>
  );

  const handleAddContract = async (e: React.FormEvent) => {
    e.preventDefault();
    const principal = Number(contractForm.principal);
    if (!contractForm.title.trim() || !contractForm.funding_account_id || !principal || principal <= 0 || !contractForm.start_date) {
      toast.error('Please complete contract title, account, principal, and start date');
      return;
    }

    const fundingAccount = fundingAccounts.find((account) => account.id === contractForm.funding_account_id);
    if (!fundingAccount) {
      toast.error('Please select a valid funding account');
      return;
    }

    if (!user?.id) {
      toast.error('Sign in to save contracts');
      return;
    }

    try {
      const newContract = await insertBusinessInvestmentContract({
        title: contractForm.title.trim(),
        principal,
        currency: fundingAccount.currency || 'USD',
        funding_account_id: fundingAccount.id,
        funding_account_name: fundingAccount.name,
        start_date: contractForm.start_date,
        end_date: contractForm.end_date || undefined,
        status: 'active',
        note: contractForm.note.trim() || undefined
      });

      setContracts((prev) => [newContract, ...prev]);
      setEntryForm((prev) => ({ ...prev, contract_id: prev.contract_id || newContract.id }));
      setContractForm(defaultContractForm);
      setShowContractModal(false);
      setCreatePrincipalExpense(false);
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

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(entryForm.amount);
    if (!entryForm.contract_id || !amount || amount <= 0 || !entryForm.date) {
      toast.error('Please complete contract, type, amount, and date');
      return;
    }
    if (!selectedContract) return;

    try {
      const newEntry = await insertBusinessInvestmentEntry(entryForm.contract_id, {
        type: entryForm.type,
        amount,
        date: entryForm.date,
        note: entryForm.note.trim() || undefined
      });

      setContracts((prev) =>
        prev.map((contract) =>
          contract.id === entryForm.contract_id ? { ...contract, entries: [newEntry, ...contract.entries] } : contract
        )
      );
      setEntryForm((prev) => ({ ...prev, amount: '', date: '', note: '' }));

      if (entryForm.type === 'profit' && postProfitAsIncome && incomeAccountId && user) {
        try {
          if (selectedIncomeAccount && selectedIncomeAccount.currency !== selectedContract.currency) {
            toast.warning('Posting to different currency account');
          }
          await addTransaction({
            user_id: user.id,
            account_id: incomeAccountId,
            type: 'income',
            amount,
            description: `Investment profit: ${selectedContract.title}${entryForm.note ? ` - ${entryForm.note}` : ''}`,
            date: entryForm.date,
            category: 'Investment',
            is_recurring: false,
            origin: TRANSACTION_ORIGIN_BUSINESS_INVESTMENT,
            business_investment_contract_id: selectedContract.id
          });
          toast.success('Profit also posted as income transaction');
        } catch (error) {
          console.error('Failed to post profit as income transaction:', error);
          toast.error('Profit saved in tracker, income posting failed');
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Failed to save entry');
    }
  };

  const removeContract = async (contractId: string) => {
    try {
      await deleteBusinessInvestmentContract(contractId);
      setContracts((prev) => prev.filter((contract) => contract.id !== contractId));
      setEntryForm((prev) => ({ ...prev, contract_id: prev.contract_id === contractId ? '' : prev.contract_id }));
      setExpandedContractIds((prev) => {
        if (!prev.has(contractId)) return prev;
        const next = new Set(prev);
        next.delete(contractId);
        return next;
      });
      await Promise.all([fetchTransactions(), fetchAccounts()]);
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove contract');
    }
  };
  const removeEntry = async (contractId: string, entryId: string) => {
    try {
      await deleteBusinessInvestmentEntry(entryId);
      setContracts((prev) =>
        prev.map((contract) =>
          contract.id === contractId ? { ...contract, entries: contract.entries.filter((entry) => entry.id !== entryId) } : contract
        )
      );
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove entry');
    }
  };
  const toggleContractStatus = async (contractId: string) => {
    const row = contracts.find((c) => c.id === contractId);
    if (!row) return;
    const next = row.status === 'active' ? 'closed' : 'active';
    try {
      await updateBusinessInvestmentContractStatus(contractId, next);
      setContracts((prev) => prev.map((c) => (c.id === contractId ? { ...c, status: next } : c)));
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
    }
  };
  const toggleRowExpansion = (contractId: string) => {
    setExpandedContractIds((prev) => {
      const next = new Set(prev);
      if (next.has(contractId)) next.delete(contractId);
      else next.add(contractId);
      return next;
    });
  };
  const isContractRowExpanded = (contractId: string) => expandedContractIds.has(contractId);

  const renderContractDetails = (contract: InvestmentContract) => {
    const stats = getContractStats(contract);
    const fundingAccountName = getFundingAccountName(contract);
    return (
      <div className="space-y-3">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Principal: {formatAmount(contract.principal, contract.currency)} | Start: {new Date(contract.start_date).toLocaleDateString()}
          {contract.end_date ? ` | End: ${new Date(contract.end_date).toLocaleDateString()}` : ''}
          {` | Funding: ${fundingAccountName}`}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
          <div className="rounded-lg bg-gray-50 dark:bg-gray-700/40 p-2">
            <p className="text-gray-500 dark:text-gray-400">Profit</p>
            <p className="font-semibold text-green-600">{formatAmount(stats.totalProfit, contract.currency)}</p>
          </div>
          <div className="rounded-lg bg-gray-50 dark:bg-gray-700/40 p-2">
            <p className="text-gray-500 dark:text-gray-400">Loss</p>
            <p className="font-semibold text-red-600">{formatAmount(stats.totalLoss, contract.currency)}</p>
          </div>
          <div className="rounded-lg bg-gray-50 dark:bg-gray-700/40 p-2">
            <p className="text-gray-500 dark:text-gray-400">Principal Returned</p>
            <p className="font-semibold text-gray-900 dark:text-white">{formatAmount(stats.principalReturned, contract.currency)}</p>
          </div>
          <div className="rounded-lg bg-gray-50 dark:bg-gray-700/40 p-2">
            <p className="text-gray-500 dark:text-gray-400">Net Result</p>
            <p className={`font-semibold ${stats.netResult >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatAmount(stats.netResult, contract.currency)}
            </p>
          </div>
        </div>
        {contract.note && <p className="text-xs text-gray-600 dark:text-gray-400">{contract.note}</p>}
        <div className="space-y-1.5">
          {contract.entries.length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">No updates yet.</p>
          ) : (
            contract.entries
              .slice()
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((entry) => (
                <div key={entry.id} className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 dark:bg-gray-700/30 p-2">
                  <div>
                    <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
                      {entry.type === 'principal_return' ? 'Principal Returned' : entry.type === 'profit' ? 'Profit' : 'Loss'} -{' '}
                      {new Date(entry.date).toLocaleDateString()}
                    </p>
                    {entry.note && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{entry.note}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <p className={`text-xs font-semibold ${entry.type === 'loss' ? 'text-red-600' : 'text-green-600'}`}>
                      {entry.type === 'loss' ? '-' : '+'}
                      {formatAmount(entry.amount, contract.currency)}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeEntry(contract.id, entry.id)}
                      className="p-1 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    );
  };

  if (!hydrated) {
    return (
      <div className="w-full">
        <InvestmentListSkeleton />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className={LP.stack}>
        {loadError ? (
          <ListPageErrorBanner
            title="⚠️ Error loading investments:"
            message={loadError}
            hint="The page will still work, but saved contracts may be incomplete."
          />
        ) : null}
      {contracts.length > 0 && (
        <div className={LP.card}>
          <button
            type="button"
            onClick={() => setIsContractUpdateOpen((prev) => !prev)}
            className="w-full flex items-center justify-between p-2 sm:p-3 md:p-4 text-left"
          >
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">Add Contract Update</h3>
            {isContractUpdateOpen ? (
              <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            )}
          </button>
          {isContractUpdateOpen && (
            <form onSubmit={handleAddEntry} className="p-2 sm:p-3 md:p-4 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
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
                  className="px-2 sm:px-3 py-1.5 h-8 rounded-md transition-colors flex items-center justify-center text-xs sm:text-[13px] bg-gradient-primary text-white hover:bg-gradient-primary-hover"
                >
                  Add Entry
                </button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3">
                <label className="inline-flex items-center gap-2 text-[13px] text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={postProfitAsIncome}
                    onChange={(e) => setPostProfitAsIncome(e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  Post profit entries as income transaction
                </label>
                <CustomDropdown
                  value={incomeAccountId}
                  onChange={setIncomeAccountId}
                  options={postingAccountOptions}
                  placeholder="Select income account"
                  disabled={!postProfitAsIncome}
                  className={compactDropdownClass}
                />
              </div>
              <textarea
                value={entryForm.note}
                onChange={(e) => setEntryForm((prev) => ({ ...prev, note: e.target.value }))}
                placeholder="Optional note for this update"
                rows={2}
                className={compactTextareaClass}
              />
            </form>
          )}
        </div>
      )}

      <div className={LP.card}>
        <div className={LP.filterHeader}>
          <div className={LP.filterRow} style={{ marginBottom: 0 }}>
            <ListPageFilterSearchField
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search contracts..."
              pending={searchPending}
            />

            <div className="md:hidden flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowMobileFilterMenu(true)}
                className={listPageMobileFilterIconButtonClass(hasVisibleFilters)}
                style={hasVisibleFilters ? LP_SEARCH_ACTIVE_STYLE : undefined}
                title="Filters"
                aria-label="Filters"
              >
                <Filter className="w-4 h-4" />
              </button>
            </div>

            <div className="md:hidden">
              <button
                type="button"
                onClick={() => setShowContractModal(true)}
                className="px-2 py-1.5 rounded-md transition-colors flex items-center justify-center text-[13px] h-8 w-8 bg-gradient-primary text-white hover:bg-gradient-primary-hover"
                title="Add Contract"
                aria-label="Add Contract"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="md:hidden">
              {hasVisibleFilters ? <ListPageClearFiltersButton onClick={clearFilters} /> : null}
            </div>

            <div className="hidden md:flex items-center gap-x-2">
              {showCurrencyFilter ? (
                <ListPageFilterSelect
                  value={filterCurrency}
                  onChange={setSummaryCurrency}
                  options={currencyFilterOptions}
                  highlight
                  ariaLabel="Currency"
                  menuScrollable
                />
              ) : null}
              <ListPageFilterSelect
                value={statusFilter}
                onChange={(v) => setStatusFilter(v as 'all' | ContractStatus)}
                options={statusFilterOptions}
                highlight={statusFilter !== 'all'}
                ariaLabel="Status"
              />
              {hasVisibleFilters ? <ListPageClearFiltersButton onClick={clearFilters} /> : null}
            </div>
            <div className="flex-grow" />
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setShowContractModal(true)}
                className="hidden md:flex px-2 sm:px-3 py-1.5 h-8 rounded-md transition-colors flex items-center space-x-1 sm:space-x-1.5 text-xs sm:text-[13px] bg-gradient-primary text-white hover:bg-gradient-primary-hover"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Add Contract</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          </div>
        </div>
            <div className={LP.summaryGrid}>
              <div className={LP.statCard}>
              <div className="flex items-center justify-between">
                <div className="text-left min-w-0 flex-1">
                  <p className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 truncate">Total Principal</p>
                  <p className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-lg sm:text-xl lg:text-[1.2rem]">
                    {formatAmount(summary.totalPrincipal, summaryDisplayCurrency)}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-[11px] truncate">
                    {visibleContracts.length} contract{visibleContracts.length === 1 ? '' : 's'}
                    {summaryMixedCurrencies ? ` · Totals in ${summaryDisplayCurrency} only` : ''}
                  </p>
                </div>
                <Wallet className="text-blue-600 w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              </div>
            </div>
            <div className={LP.statCard}>
              <div className="flex items-center justify-between">
                <div className="text-left min-w-0 flex-1">
                  <p className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 truncate">Total Profit</p>
                  <p className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-lg sm:text-xl lg:text-[1.2rem]">
                    {formatAmount(summary.totalProfit, summaryDisplayCurrency)}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-[11px] truncate">Profit total</p>
                </div>
                <TrendingUp className="text-blue-600 w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              </div>
            </div>
            <div className={LP.statCard}>
              <div className="flex items-center justify-between">
                <div className="text-left min-w-0 flex-1">
                  <p className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 truncate">Total Loss</p>
                  <p className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-lg sm:text-xl lg:text-[1.2rem]">
                    {formatAmount(summary.totalLoss, summaryDisplayCurrency)}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-[11px] truncate">Loss total</p>
                </div>
                <TrendingDown className="text-blue-600 w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              </div>
            </div>
            <div className={LP.statCard}>
              <div className="flex items-center justify-between">
                <div className="text-left min-w-0 flex-1">
                  <p className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 truncate">Overall Net</p>
                  <p className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-lg sm:text-xl lg:text-[1.2rem]">
                    {formatAmount(summary.overallNet, summaryDisplayCurrency)}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-[11px] truncate">Net position</p>
                </div>
                <Landmark className="text-blue-600 w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              </div>
            </div>
            <div className={LP.statCard}>
              <div className="flex items-center justify-between">
                <div className="text-left min-w-0 flex-1">
                  <p className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 truncate">Contracts</p>
                  <p className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-lg sm:text-xl lg:text-[1.2rem]">
                    {visibleContracts.length}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-[11px] truncate">Tracked items</p>
                </div>
                <Building2 className="text-blue-600 w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              </div>
            </div>
          </div>

        <div className={LP.tableOuter} style={LP.tableOuterRadius}>
          <div className={LP.desktopTableScroll}>
            <table className={LP.table}>
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                <tr>
                  <th
                    onClick={() => handleSort('title')}
                    className="cursor-pointer px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center space-x-0.5 sm:space-x-1">
                      <span>Contract</span>
                      {getSortIcon('title')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('funding_account_name')}
                    className="cursor-pointer px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center space-x-0.5 sm:space-x-1">
                      <span>Funding Account</span>
                      {getSortIcon('funding_account_name')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('status')}
                    className="cursor-pointer px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 text-center text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-center space-x-0.5 sm:space-x-1">
                      <span>Status</span>
                      {getSortIcon('status')}
                    </div>
                  </th>
                  <th className="px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 text-center text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {processedContracts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-16 text-center">
                      {contractsEmptyBody}
                    </td>
                  </tr>
                ) : (
                  processedContracts.map((contract) => {
                    const fundingAccountName = getFundingAccountName(contract);
                    const isExpanded = isContractRowExpanded(contract.id);
                    return (
                      <React.Fragment key={contract.id}>
                        <tr
                          onClick={() => toggleRowExpansion(contract.id)}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                        >
                          <td className="px-3 sm:px-4 lg:px-6 py-2 sm:py-[0.6rem] lg:py-[0.7rem]">
                            <div className="flex items-center">
                              <div className="flex-1 min-w-0">
                                <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">{contract.title}</div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Principal: {formatAmount(contract.principal, contract.currency)} | Start: {new Date(contract.start_date).toLocaleDateString()}
                                  {contract.end_date ? ` | End: ${new Date(contract.end_date).toLocaleDateString()}` : ''}
                                </p>
                              </div>
                              <div className="ml-2 flex-shrink-0">
                                <ContractRowChevron expanded={isExpanded} />
                              </div>
                            </div>
                          </td>
                          <td className="px-3 sm:px-4 lg:px-6 py-2 sm:py-[0.6rem] lg:py-[0.7rem] text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                            <span className="block truncate">{fundingAccountName}</span>
                          </td>
                          <td
                            className="px-3 sm:px-4 lg:px-6 py-2 sm:py-[0.6rem] lg:py-[0.7rem] text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => void toggleContractStatus(contract.id)}
                              className={`px-2.5 py-1 text-xs rounded-full ${
                                contract.status === 'active'
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {contract.status === 'active' ? 'Active' : 'Closed'}
                            </button>
                          </td>
                          <td className="px-3 sm:px-4 lg:px-6 py-2 sm:py-[0.6rem] lg:py-[0.7rem]" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => setContractIdToDelete(contract.id)}
                                className="p-1.5 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                title="Delete contract"
                              >
                                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-gray-50 dark:bg-gray-800">
                            <td colSpan={4} className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5">
                              {renderContractDetails(contract)}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className={LP.mobileScroll}>
            {processedContracts.length === 0 ? (
              <div className="text-center py-12 px-4">{contractsEmptyBody}</div>
            ) : (
              <div className="space-y-3 sm:space-y-4 px-3 sm:px-4">
                {processedContracts.map((contract) => {
                  const fundingAccountName = getFundingAccountName(contract);
                  const isExpanded = isContractRowExpanded(contract.id);
                  return (
                    <div
                      key={contract.id}
                      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <div
                        className="p-4 sm:p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors"
                        onClick={() => toggleRowExpansion(contract.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-white truncate">{contract.title}</p>
                              <ContractRowChevron expanded={isExpanded} />
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              Principal: {formatAmount(contract.principal, contract.currency)} | Start: {new Date(contract.start_date).toLocaleDateString()}
                              {contract.end_date ? ` | End: ${new Date(contract.end_date).toLocaleDateString()}` : ''}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">Funding: {fundingAccountName}</p>
                          </div>
                        </div>
                      </div>
                      <div
                        className="px-4 sm:px-5 pb-3 sm:pb-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => void toggleContractStatus(contract.id)}
                          className={`px-2.5 py-1 text-xs rounded-full ${
                            contract.status === 'active'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {contract.status === 'active' ? 'Active' : 'Closed'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setContractIdToDelete(contract.id)}
                          className="p-1.5 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="Delete contract"
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                      {isExpanded && (
                        <div
                          className="px-4 sm:px-5 pb-4 border-t border-gray-200 dark:border-gray-700 pt-3 sm:pt-4"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {renderContractDetails(contract)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <ListPageMobileFilterModal
        open={showMobileFilterMenu}
        onBackdropClick={() => setShowMobileFilterMenu(false)}
        onApply={() => {
          setSummaryCurrency(tempMobileFilters.summaryCurrency);
          setStatusFilter(tempMobileFilters.status);
          setShowMobileFilterMenu(false);
        }}
        onClearAll={() => {
          clearFilters();
          setShowMobileFilterMenu(false);
        }}
        applyActive={mobileFilterApplyActive}
      >
        {showCurrencyFilter ? (
          <ListPageMobileFilterSection label="Currency">
            {currencyFilterOptions.map((opt) => (
              <ListPageMobileFilterChip
                key={opt.value}
                selected={tempMobileFilters.summaryCurrency === opt.value}
                onClick={() => setTempMobileFilters((p) => ({ ...p, summaryCurrency: opt.value }))}
              >
                {opt.label}
              </ListPageMobileFilterChip>
            ))}
          </ListPageMobileFilterSection>
        ) : null}
        <ListPageMobileFilterSection label="Status" borderBottom={false}>
          {statusFilterOptions.map((opt) => (
            <ListPageMobileFilterChip
              key={opt.value}
              selected={tempMobileFilters.status === opt.value}
              onClick={() => setTempMobileFilters((p) => ({ ...p, status: opt.value as 'all' | ContractStatus }))}
            >
              {opt.label}
            </ListPageMobileFilterChip>
          ))}
        </ListPageMobileFilterSection>
      </ListPageMobileFilterModal>

      {showContractModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowContractModal(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Add Contract</h3>
              <button type="button" onClick={() => setShowContractModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1">
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <form onSubmit={handleAddContract} className="p-4 sm:p-5 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-[1.15rem] gap-y-[1.20rem] sm:gap-y-[1.40rem]">
                <input
                  type="text"
                  value={contractForm.title}
                  onChange={(e) => setContractForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Contract title"
                  className={modalInputClass}
                  required
                />
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
                <CustomDropdown
                  value={contractForm.funding_account_id}
                  onChange={(value) => setContractForm((prev) => ({ ...prev, funding_account_id: value }))}
                  options={fundingAccountOptions}
                  placeholder="Funding account *"
                />
                <div className="flex items-center px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                  Currency: {selectedFundingAccount?.currency || '-'}
                </div>
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
              <textarea
                value={contractForm.note}
                onChange={(e) => setContractForm((prev) => ({ ...prev, note: e.target.value }))}
                placeholder="Optional note"
                rows={2}
                className={`${modalInputClass} min-h-[80px] mt-3 sm:mt-4`}
              />
              <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 mt-3">
                <input
                  type="checkbox"
                  checked={createPrincipalExpense}
                  onChange={(e) => setCreatePrincipalExpense(e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600"
                />
                Also create expense transaction for principal from funding account
              </label>
              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-4 sm:mt-5">
                <button
                  type="button"
                  onClick={() => setShowContractModal(false)}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-gradient-primary text-white rounded-lg hover:bg-gradient-primary-hover transition-colors flex items-center justify-center min-w-[80px] text-sm sm:text-base"
                >
                  Save Contract
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={contractIdToDelete !== null}
        onClose={() => setContractIdToDelete(null)}
        onConfirm={() => {
          if (contractIdToDelete) void removeContract(contractIdToDelete);
        }}
        title="Delete contract?"
        message="This will permanently remove the contract and all its updates. Linked transactions created from Investments (principal or profit) will also be removed. This cannot be undone."
        recordDetails={
          pendingDeleteTitle ? (
            <p className="text-sm font-medium text-gray-900 dark:text-white">{pendingDeleteTitle}</p>
          ) : undefined
        }
        confirmLabel="Delete contract"
      />
      </div>
    </div>
  );
};

