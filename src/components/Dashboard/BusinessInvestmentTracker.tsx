import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, ChevronUp, Plus, Pencil, Trash2, Wallet, TrendingUp, TrendingDown, Landmark, X, Filter, Info } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '../../utils/currency';
import { formatAppDate } from '../../utils/timezoneUtils';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useAuthStore } from '../../store/authStore';
import { CustomDropdown } from '../Purchases/CustomDropdown';
import {
  accountsToTransactionDropdownOptions,
  prepareAccountsForTransactionDropdown,
  resolveDefaultAccountIdForTransactionDropdown
} from '../../utils/transactionAccountDropdown';
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
import { ENTRY_TYPE_LABELS, type ContractStatus, type EntryType, type InvestmentContract } from '../../types/businessInvestment';
import {
  deleteBusinessInvestmentContract,
  deleteBusinessInvestmentEntry,
  fetchBusinessInvestmentContracts,
  insertBusinessInvestmentEntry,
  updateBusinessInvestmentContractStatus
} from '../../lib/businessInvestmentService';
import { TRANSACTION_ORIGIN_BUSINESS_INVESTMENT } from '../../lib/transactionListLock';
import { getContractStats, getEffectivePrincipal } from '../../utils/businessInvestmentStats';
import { entryPostingDescription, entryPostingTransactionType } from '../../utils/businessInvestmentEntryPosting';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { BusinessInvestmentContractModal } from './BusinessInvestmentContractModal';

type SortField = 'title' | 'funding_account_name' | 'status';
type SortDirection = 'asc' | 'desc';
const dateInputClass = 'bg-transparent outline-none border-none w-full cursor-pointer text-[14px] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400';
const compactInputClass = 'w-full pl-8 pr-2 py-1.5 text-[13px] h-8 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 transition-colors border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800';
const compactDateShellClass =
  'flex items-center bg-gray-50 dark:bg-gray-800 px-3 pr-[10px] text-[13px] h-8 rounded-md border border-gray-300 dark:border-gray-700';
const compactTextareaClass =
  'w-full px-3 py-2 text-[13px] rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400';
const compactDropdownClass =
  'px-3 py-1.5 pr-2 text-[13px] h-8 rounded-md transition-colors bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700';
const defaultEntryForm = {
  contract_id: '',
  type: 'profit' as EntryType,
  amount: '',
  date: '',
  note: ''
};
const formatDateYmd = (date: Date | null) =>
  date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : '';

const contractMetaRowClass =
  'flex min-w-0 flex-col gap-1.5 text-xs text-gray-500 dark:text-gray-400 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-2 sm:gap-y-0';

const rowActionIconButtonClass =
  'p-1.5 rounded text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700';
const entryRemoveIconButtonClass =
  'min-h-[40px] min-w-[40px] sm:min-h-0 sm:min-w-0 p-2 sm:p-1 rounded text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 touch-manipulation';

const investmentSummaryMetricCopy = {
  profit: { label: 'Profit', caption: 'Sum of profit entries' },
  loss: { label: 'Loss', caption: 'Sum of loss entries' },
  principalReturned: { label: 'Principal Returned', caption: 'Sum of principal return entries' },
  net: { label: 'Net', caption: 'Profit minus loss' }
} as const;

const CONTRACT_UPDATE_SECTION_HINT =
  'Record profit, loss, principal return, or capital contribution (reinvest). Optionally post a linked transaction: profit and principal returned as income; loss and capital contribution as expense — pick any cash account.';

const CONTRACT_UPDATE_TOOLTIP_PANEL_CLASS =
  'absolute left-0 top-full z-50 mt-2 w-[min(18rem,calc(100vw-1.5rem))] rounded-lg border border-gray-200 bg-white p-2.5 text-[10px] leading-snug text-gray-700 shadow-xl animate-fadein dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 sm:mt-2 sm:w-72 sm:p-3 sm:text-xs sm:leading-snug';

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
  const [editingContractId, setEditingContractId] = useState<string | null>(null);
  const [expandedContractIds, setExpandedContractIds] = useState<Set<string>>(() => new Set());
  const [entryForm, setEntryForm] = useState(defaultEntryForm);
  const [postEntryAsTransaction, setPostEntryAsTransaction] = useState(true);
  const [postingAccountId, setPostingAccountId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ContractStatus>('all');
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [isContractUpdateOpen, setIsContractUpdateOpen] = useState(false);
  const [showContractUpdateTooltip, setShowContractUpdateTooltip] = useState(false);
  const [showContractUpdateInfoMobile, setShowContractUpdateInfoMobile] = useState(false);
  const [showMobileFilterMenu, setShowMobileFilterMenu] = useState(false);
  const [summaryCurrency, setSummaryCurrency] = useState('');
  const [tempMobileFilters, setTempMobileFilters] = useState({
    summaryCurrency: '',
    status: 'all' as 'all' | ContractStatus
  });
  const [contractIdToDelete, setContractIdToDelete] = useState<string | null>(null);

  const { accounts, addTransaction, fetchTransactions, fetchAccounts } = useFinanceStore();
  const { user, profile } = useAuthStore();
  const { isMobile } = useMobileDetection();
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

  const basePreparedAccounts = useMemo(
    () => prepareAccountsForTransactionDropdown(accounts, userDefaultCurrency, null),
    [accounts, userDefaultCurrency]
  );
  const selectedContract = useMemo(
    () => contracts.find((contract) => contract.id === entryForm.contract_id),
    [contracts, entryForm.contract_id]
  );

  useEffect(() => {
    if (!entryForm.contract_id) return;
    const sel = contracts.find((c) => c.id === entryForm.contract_id);
    if (sel?.status === 'closed') {
      setEntryForm((prev) => ({ ...prev, contract_id: '' }));
    }
  }, [contracts, entryForm.contract_id]);

  useEffect(() => {
    const withCurrent = prepareAccountsForTransactionDropdown(accounts, userDefaultCurrency, postingAccountId || null);
    if (postingAccountId && withCurrent.some((a) => a.id === postingAccountId)) return;
    const id = resolveDefaultAccountIdForTransactionDropdown(basePreparedAccounts, profile);
    if (id) setPostingAccountId(id);
  }, [accounts, userDefaultCurrency, postingAccountId, basePreparedAccounts, profile]);

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
  /** Summary cards: active deals only (closed excluded from totals and counts). */
  const activeVisibleContracts = useMemo(
    () => visibleContracts.filter((c) => c.status === 'active'),
    [visibleContracts]
  );

  const contractCurrencyCodes = useMemo(
    () => [...new Set(activeVisibleContracts.map((c) => c.currency))].filter(Boolean).sort(),
    [activeVisibleContracts]
  );
  const summaryMixedCurrencies = contractCurrencyCodes.length > 1;
  const summaryListForTotals = useMemo(() => {
    if (contractCurrencyCodes.length <= 1) return activeVisibleContracts;
    return activeVisibleContracts.filter((c) => c.currency === contractCurrencyCodes[0]);
  }, [activeVisibleContracts, contractCurrencyCodes]);

  const summaryDisplayCurrency =
    contractCurrencyCodes[0] ??
    filterCurrency ??
    basePreparedAccounts[0]?.currency ??
    accounts[0]?.currency ??
    userDefaultCurrency;

  const summary = useMemo(() => {
    const list = summaryListForTotals;
    const totalPrincipal = list.reduce((sum, contract) => sum + getContractStats(contract).effectivePrincipal, 0);
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
    () =>
      contracts
        .filter((contract) => contract.status === 'active')
        .map((contract) => ({ value: contract.id, label: `${contract.title} (${contract.currency})` })),
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
    () =>
      (Object.keys(ENTRY_TYPE_LABELS) as EntryType[]).map((value) => ({ value, label: ENTRY_TYPE_LABELS[value] })),
    []
  );
  const postingAccountOptions = useMemo(
    () =>
      accountsToTransactionDropdownOptions(
        prepareAccountsForTransactionDropdown(accounts, userDefaultCurrency, postingAccountId || null)
      ),
    [accounts, userDefaultCurrency, postingAccountId]
  );
  const fundingAccountNameMap = useMemo(() => new Map(accounts.map((account) => [account.id, account.name])), [accounts]);
  const getFundingAccountName = (contract: InvestmentContract) =>
    fundingAccountNameMap.get(contract.funding_account_id) || contract.funding_account_name || 'Unknown';
  const editingContract = useMemo(
    () => (editingContractId ? contracts.find((c) => c.id === editingContractId) : undefined),
    [contracts, editingContractId]
  );
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

  const closeContractModal = () => {
    setShowContractModal(false);
    setEditingContractId(null);
  };
  const openAddContractModal = () => {
    setEditingContractId(null);
    setShowContractModal(true);
  };
  const openEditContractModal = (contract: InvestmentContract) => {
    setEditingContractId(contract.id);
    setShowContractModal(true);
  };

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

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(entryForm.amount);
    if (!entryForm.contract_id || !amount || amount <= 0 || !entryForm.date) {
      toast.error('Please complete contract, type, amount, and date');
      return;
    }
    if (!selectedContract) return;
    if (postEntryAsTransaction && !postingAccountId) {
      toast.error('Select an account to post this transaction, or turn off “Post transaction”.');
      return;
    }

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

      if (postEntryAsTransaction && postingAccountId && user) {
        const postingAcc = accounts.find((a) => a.id === postingAccountId);
        try {
          if (postingAcc && postingAcc.currency !== selectedContract.currency) {
            toast.warning('Account currency differs from contract currency');
          }
          await addTransaction({
            user_id: user.id,
            account_id: postingAccountId,
            type: entryPostingTransactionType(entryForm.type),
            amount,
            description: entryPostingDescription(entryForm.type, selectedContract.title, entryForm.note),
            date: entryForm.date,
            category: 'Investment',
            is_recurring: false,
            origin: TRANSACTION_ORIGIN_BUSINESS_INVESTMENT,
            business_investment_contract_id: selectedContract.id
          });
          toast.success('Transaction posted');
        } catch (error) {
          console.error('Investment entry transaction failed:', error);
          toast.error('Entry saved, transaction posting failed');
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

  const toggleContractUpdateSection = () => setIsContractUpdateOpen((prev) => !prev);

  useEffect(() => {
    if (isContractUpdateOpen) {
      setShowContractUpdateTooltip(false);
      setShowContractUpdateInfoMobile(false);
    }
  }, [isContractUpdateOpen]);

  const renderContractDetails = (contract: InvestmentContract) => {
    const stats = getContractStats(contract);
    const fundingAccountName = getFundingAccountName(contract);
    const deployed = getEffectivePrincipal(contract);
    return (
      <div className="space-y-3 min-w-0">
        <div className={contractMetaRowClass}>
          <span className="break-words">
            Initial principal: {formatAmount(contract.principal, contract.currency)} · Start: {formatAppDate(contract.start_date)}
            {contract.end_date ? ` · End: ${formatAppDate(contract.end_date)}` : ''}
          </span>
          <span className="break-words sm:max-w-[min(100%,24rem)]">Funding: {fundingAccountName}</span>
        </div>
        <p className="text-xs font-medium text-gray-700 dark:text-gray-200">
          Total deployed: {formatAmount(deployed, contract.currency)}
          {stats.capitalContributed > 0 ? (
            <span className="font-normal text-gray-500 dark:text-gray-400">
              {' '}
              ({formatAmount(contract.principal, contract.currency)} initial + {formatAmount(stats.capitalContributed, contract.currency)}{' '}
              reinvested)
            </span>
          ) : null}
        </p>
        <div className="grid grid-cols-2 min-[480px]:grid-cols-4 gap-2 text-xs">
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
                <div
                  key={entry.id}
                  className="flex flex-col gap-2 rounded-lg bg-gray-50 dark:bg-gray-700/30 p-2 sm:flex-row sm:items-center sm:justify-between sm:gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-800 dark:text-gray-200 break-words">
                      {ENTRY_TYPE_LABELS[entry.type]} — {formatAppDate(entry.date)}
                    </p>
                    {entry.note && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 break-words">{entry.note}</p>}
                  </div>
                  <div className="flex shrink-0 items-center justify-end gap-2">
                    <p
                      className={`text-xs font-semibold tabular-nums ${
                        entry.type === 'loss'
                          ? 'text-red-600'
                          : entry.type === 'capital_contribution'
                            ? 'text-amber-600 dark:text-amber-500'
                            : 'text-green-600'
                      }`}
                    >
                      {entry.type === 'loss' || entry.type === 'capital_contribution' ? '-' : '+'}
                      {formatAmount(entry.amount, contract.currency)}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeEntry(contract.id, entry.id)}
                      className={entryRemoveIconButtonClass}
                      aria-label="Remove entry"
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
      <div className="w-full min-w-0">
        <InvestmentListSkeleton />
      </div>
    );
  }

  return (
    <div className="w-full min-w-0">
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
          <div
            className="flex w-full cursor-pointer flex-wrap items-center gap-x-2 gap-y-2 py-2 px-4 sm:flex-nowrap sm:gap-1"
            onClick={toggleContractUpdateSection}
          >
            <div className="flex min-h-11 min-w-0 flex-1 items-center gap-2 sm:min-h-0 sm:gap-1">
              <h3 className="min-w-0 flex-1 text-left text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 sm:flex-none sm:line-clamp-none sm:text-base">
                Add Contract Update
              </h3>
              {!isContractUpdateOpen ? (
                <div className="relative flex shrink-0 items-center">
                  <button
                    type="button"
                    className="touch-manipulation rounded-full p-2 transition-colors hover:bg-gray-100 focus:bg-gray-100 focus:outline-none sm:p-1 dark:hover:bg-gray-700 dark:focus:bg-gray-700"
                    aria-label="About Add Contract Update"
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseEnter={() => !isMobile && setShowContractUpdateTooltip(true)}
                    onMouseLeave={() => !isMobile && setShowContractUpdateTooltip(false)}
                    onFocus={() => !isMobile && setShowContractUpdateTooltip(true)}
                    onBlur={() => !isMobile && setShowContractUpdateTooltip(false)}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isMobile) setShowContractUpdateInfoMobile(true);
                      else setShowContractUpdateTooltip((v) => !v);
                    }}
                  >
                    <Info className="h-4 w-4 text-gray-400 transition-colors hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300" />
                  </button>
                  {showContractUpdateTooltip && !isMobile ? (
                    <div className={CONTRACT_UPDATE_TOOLTIP_PANEL_CLASS} role="tooltip">
                      {CONTRACT_UPDATE_SECTION_HINT}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleContractUpdateSection();
              }}
              className="ml-auto flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 sm:ml-0 sm:h-9 sm:w-9 dark:text-gray-400 dark:hover:bg-gray-700"
              aria-expanded={isContractUpdateOpen}
              aria-label={isContractUpdateOpen ? 'Collapse section' : 'Expand section'}
            >
              {isContractUpdateOpen ? (
                <ChevronDown className="h-5 w-5 sm:h-4 sm:w-4" />
              ) : (
                <ChevronRight className="h-5 w-5 sm:h-4 sm:w-4" />
              )}
            </button>
          </div>
          {isContractUpdateOpen && (
            <form
              onSubmit={handleAddEntry}
              className="space-y-3 border-t border-gray-200 p-2 pt-3 dark:border-gray-700 sm:p-3 sm:pt-4 md:p-4"
            >
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
                onClick={() => openAddContractModal()}
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
                onClick={() => openAddContractModal()}
                className="hidden md:flex px-2 sm:px-3 py-1.5 h-8 rounded-md transition-colors flex items-center space-x-1 sm:space-x-1.5 text-xs sm:text-[13px] bg-gradient-primary text-white hover:bg-gradient-primary-hover"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Add Contract</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          </div>
        </div>
            <div className={LP.investmentSummaryGrid}>
              <div className={LP.statCard}>
              <div className="flex items-center justify-between gap-2">
                <div className="text-left min-w-0 flex-1">
                  <p className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 truncate">Total deployed</p>
                  <p className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-lg sm:text-xl lg:text-[1.2rem] break-words tabular-nums">
                    {formatAmount(summary.totalPrincipal, summaryDisplayCurrency)}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-[11px] truncate">
                    {activeVisibleContracts.length} active contract{activeVisibleContracts.length === 1 ? '' : 's'}
                    {summaryMixedCurrencies ? ` · Totals in ${summaryDisplayCurrency} only` : ''}
                  </p>
                </div>
                <Wallet className="text-blue-600 w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              </div>
            </div>
            <div className={LP.statCard}>
              <div className="flex items-center justify-between gap-2">
                <div className="text-left min-w-0 flex-1">
                  <p className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 truncate">
                    {investmentSummaryMetricCopy.profit.label}
                  </p>
                  <p className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-lg sm:text-xl lg:text-[1.2rem] break-words tabular-nums">
                    {formatAmount(summary.totalProfit, summaryDisplayCurrency)}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-[11px] truncate">
                    {investmentSummaryMetricCopy.profit.caption}
                  </p>
                </div>
                <TrendingUp className="text-blue-600 w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              </div>
            </div>
            <div className={LP.statCard}>
              <div className="flex items-center justify-between gap-2">
                <div className="text-left min-w-0 flex-1">
                  <p className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 truncate">
                    {investmentSummaryMetricCopy.loss.label}
                  </p>
                  <p className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-lg sm:text-xl lg:text-[1.2rem] break-words tabular-nums">
                    {formatAmount(summary.totalLoss, summaryDisplayCurrency)}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-[11px] truncate">
                    {investmentSummaryMetricCopy.loss.caption}
                  </p>
                </div>
                <TrendingDown className="text-blue-600 w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              </div>
            </div>
            <div className={LP.statCard}>
              <div className="flex items-center justify-between gap-2">
                <div className="text-left min-w-0 flex-1">
                  <p className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 truncate">
                    {investmentSummaryMetricCopy.principalReturned.label}
                  </p>
                  <p className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-lg sm:text-xl lg:text-[1.2rem] break-words tabular-nums">
                    {formatAmount(summary.totalPrincipalReturned, summaryDisplayCurrency)}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-[11px] truncate">
                    {investmentSummaryMetricCopy.principalReturned.caption}
                  </p>
                </div>
                <Landmark className="text-blue-600 w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              </div>
            </div>
            <div className={LP.statCard}>
              <div className="flex items-center justify-between gap-2">
                <div className="text-left min-w-0 flex-1">
                  <p className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 truncate">
                    {investmentSummaryMetricCopy.net.label}
                  </p>
                  <p className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-lg sm:text-xl lg:text-[1.2rem] break-words tabular-nums">
                    {formatAmount(summary.overallNet, summaryDisplayCurrency)}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-[11px] truncate">
                    {investmentSummaryMetricCopy.net.caption}
                  </p>
                </div>
                <Landmark className="text-blue-600 w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
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
                                <div className={contractMetaRowClass}>
                                  <span className="break-words">
                                    Deployed: {formatAmount(getEffectivePrincipal(contract), contract.currency)} · Start:{' '}
                                    {formatAppDate(contract.start_date)}
                                    {contract.end_date
                                      ? ` · End: ${formatAppDate(contract.end_date)}`
                                      : ''}
                                  </span>
                                </div>
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
                            <div className="flex items-center justify-center gap-0.5">
                              <button
                                type="button"
                                onClick={() => openEditContractModal(contract)}
                                className={rowActionIconButtonClass}
                                title="Edit contract details"
                              >
                                <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setContractIdToDelete(contract.id)}
                                className={rowActionIconButtonClass}
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
                            <div className={`${contractMetaRowClass} mt-0.5`}>
                              <span className="break-words">
                                Deployed: {formatAmount(getEffectivePrincipal(contract), contract.currency)} · Start:{' '}
                                {formatAppDate(contract.start_date)}
                                {contract.end_date
                                  ? ` · End: ${formatAppDate(contract.end_date)}`
                                  : ''}
                              </span>
                              <span className="break-words">Funding: {fundingAccountName}</span>
                            </div>
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
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => openEditContractModal(contract)}
                            className={rowActionIconButtonClass}
                            title="Edit contract details"
                          >
                            <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setContractIdToDelete(contract.id)}
                            className={rowActionIconButtonClass}
                            title="Delete contract"
                          >
                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        </div>
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

      <BusinessInvestmentContractModal
        open={showContractModal}
        onClose={closeContractModal}
        editingContract={editingContract ?? null}
        onAdded={(newContract) => {
          setContracts((prev) => [newContract, ...prev]);
          setEntryForm((prev) => ({ ...prev, contract_id: prev.contract_id || newContract.id }));
        }}
        onUpdated={(payload) => {
          setContracts((prev) =>
            prev.map((c) =>
              c.id === payload.id
                ? { ...c, title: payload.title, start_date: payload.start_date, end_date: payload.end_date, note: payload.note }
                : c
            )
          );
        }}
      />

      {showContractUpdateInfoMobile && isMobile ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 pb-[env(safe-area-inset-bottom,0px)] sm:items-center sm:p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowContractUpdateInfoMobile(false)} aria-hidden />
          <div
            className="relative max-h-[min(85vh,100%)] w-full max-w-md animate-fadein overflow-y-auto overscroll-contain rounded-t-2xl border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-900 sm:rounded-lg sm:p-5 touch-manipulation"
            role="dialog"
            aria-labelledby="contract-update-info-title"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div
                id="contract-update-info-title"
                className="pr-2 text-base font-semibold leading-snug text-gray-900 dark:text-white"
              >
                Add Contract Update
              </div>
              <button
                type="button"
                onClick={() => setShowContractUpdateInfoMobile(false)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{CONTRACT_UPDATE_SECTION_HINT}</p>
          </div>
        </div>
      ) : null}

      <DeleteConfirmationModal
        isOpen={contractIdToDelete !== null}
        onClose={() => setContractIdToDelete(null)}
        onConfirm={() => {
          if (contractIdToDelete) void removeContract(contractIdToDelete);
        }}
        title="Delete contract?"
        message="This will permanently remove the contract and all its updates. Linked transactions created from Investments (principal, capital contributions, or profit) will also be removed. This cannot be undone."
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

