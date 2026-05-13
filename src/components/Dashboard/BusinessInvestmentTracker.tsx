import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Pencil,
  Trash2,
  Wallet,
  TrendingUp,
  TrendingDown,
  Landmark,
  X,
  Filter,
  Info,
  Ban,
  PlayCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '../../utils/currency';
import { formatAppDate } from '../../utils/timezoneUtils';
import { getTodayLocalDateString } from '../../utils/taskDateUtils';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useAuthStore } from '../../store/authStore';
import {
  accountsToTransactionDropdownOptions,
  prepareAccountsForTransactionDropdown,
  resolveDefaultAccountIdForTransactionDropdown
} from '../../utils/transactionAccountDropdown';
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
import { businessInvestmentStatusConfirmCopy } from '../../utils/businessInvestmentStatusConfirm';
import { BusinessInvestmentContractModal } from './BusinessInvestmentContractModal';
import { InvestmentContractEntriesTimeline } from './InvestmentContractEntriesTimeline';
import { BusinessInvestmentUpdateModal, type ContractUpdateFormState } from './BusinessInvestmentUpdateModal';

type SortField = 'title' | 'funding_account_name' | 'status';
type SortDirection = 'asc' | 'desc';
const defaultEntryForm: ContractUpdateFormState = {
  contract_id: '',
  type: 'profit' as EntryType,
  amount: '',
  date: '',
  note: ''
};

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
  'absolute right-0 top-full z-50 mt-2 w-[min(18rem,calc(100vw-1rem))] max-w-[calc(100vw-1rem)] rounded-lg border border-gray-200 bg-white p-2.5 text-[10px] leading-snug text-gray-700 shadow-xl animate-fadein dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 sm:mt-2 sm:w-72 sm:max-w-[calc(100vw-1.5rem)] sm:p-3 sm:text-xs sm:leading-snug';

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
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showContractUpdateTooltip, setShowContractUpdateTooltip] = useState(false);
  const [showContractUpdateInfoMobile, setShowContractUpdateInfoMobile] = useState(false);
  const [showMobileFilterMenu, setShowMobileFilterMenu] = useState(false);
  const [summaryCurrency, setSummaryCurrency] = useState('');
  const [tempMobileFilters, setTempMobileFilters] = useState({
    summaryCurrency: '',
    status: 'all' as 'all' | ContractStatus
  });
  const [contractIdToDelete, setContractIdToDelete] = useState<string | null>(null);
  const [pendingContractStatus, setPendingContractStatus] = useState<{ id: string; next: ContractStatus } | null>(null);

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
  const pendingStatusConfirmModal = useMemo(() => {
    const p = pendingContractStatus;
    if (!p) return null;
    const name = contracts.find((c) => c.id === p.id)?.title ?? '';
    return businessInvestmentStatusConfirmCopy(p.next, name);
  }, [pendingContractStatus, contracts]);
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
  const hasActiveContracts = contractOptions.length > 0;
  const getFundingAccountName = useCallback(
    (contract: InvestmentContract) =>
      fundingAccountNameMap.get(contract.funding_account_id) || contract.funding_account_name || 'Unknown',
    [fundingAccountNameMap]
  );
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
  const updateActionTitle = hasActiveContracts ? 'Update' : 'Add a contract first';
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
  }, [visibleContracts, debouncedSearch, statusFilter, sortField, sortDirection, getFundingAccountName]);
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
    if (!entryForm.contract_id || !amount || amount <= 0) {
      toast.error('Please select a contract, type, and amount');
      return;
    }
    if (!selectedContract) return;
    if (postEntryAsTransaction && !postingAccountId) {
      toast.error('Select an account to post this transaction, or turn off “Post transaction”.');
      return;
    }

    const entryDate = entryForm.date.trim() || getTodayLocalDateString();

    try {
      const newEntry = await insertBusinessInvestmentEntry(entryForm.contract_id, {
        type: entryForm.type,
        amount,
        date: entryDate,
        note: entryForm.note.trim() || undefined
      });

      setContracts((prev) =>
        prev.map((contract) =>
          contract.id === entryForm.contract_id ? { ...contract, entries: [newEntry, ...contract.entries] } : contract
        )
      );
      setEntryForm((prev) => ({ ...prev, amount: '', date: '', note: '' }));
      setShowUpdateModal(false);

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
            date: entryDate,
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
  const queueContractStatusChange = (contractId: string) => {
    const row = contracts.find((c) => c.id === contractId);
    if (!row) return;
    setPendingContractStatus({ id: contractId, next: row.status === 'active' ? 'closed' : 'active' });
  };

  const confirmPendingContractStatus = () => {
    const p = pendingContractStatus;
    if (!p) return;
    void (async () => {
      try {
        await updateBusinessInvestmentContractStatus(p.id, p.next);
        setContracts((prev) => prev.map((c) => (c.id === p.id ? { ...c, status: p.next } : c)));
        toast.success(p.next === 'closed' ? 'Contract ended' : 'Contract reopened');
      } catch (err) {
        console.error(err);
        toast.error(p.next === 'closed' ? 'Failed to end contract' : 'Failed to reopen contract');
      }
    })();
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

  useEffect(() => {
    if (!showUpdateModal) return;
    setShowContractUpdateTooltip(false);
    setShowContractUpdateInfoMobile(false);
  }, [showUpdateModal]);

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
        <div>
          {contract.entries.length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">No updates yet.</p>
          ) : (
            <InvestmentContractEntriesTimeline
              entries={contract.entries}
              currency={contract.currency}
              formatAmount={formatAmount}
              formatDate={formatAppDate}
              removeButtonClassName={entryRemoveIconButtonClass}
              onRemoveEntry={(entryId) => removeEntry(contract.id, entryId)}
            />
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
      <div className={LP.card}>
        <div className={LP.investmentFilterHeader}>
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
              <div className="inline-flex items-center rounded-md">
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(true)}
                  disabled={!hasActiveContracts}
                  className="px-2 py-1.5 rounded-l-md transition-colors flex items-center justify-center gap-1 text-[13px] h-8 bg-gradient-primary text-white hover:bg-gradient-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
                  title={updateActionTitle}
                  aria-label={updateActionTitle}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span className="hidden sm:inline">Update</span>
                </button>
                <button
                  type="button"
                  disabled={!hasActiveContracts}
                  className="h-8 px-1.5 rounded-r-md border-l border-white/20 bg-gradient-primary text-white transition-colors hover:bg-gradient-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="About Update"
                  title="About Update"
                  onClick={() => setShowContractUpdateInfoMobile(true)}
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </div>
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
              <div className="relative hidden md:inline-flex items-center rounded-md">
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(true)}
                  disabled={!hasActiveContracts}
                  className="px-2 sm:px-3 py-1.5 h-8 rounded-l-md transition-colors flex items-center space-x-1 sm:space-x-1.5 text-xs sm:text-[13px] bg-gradient-primary text-white hover:bg-gradient-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
                  title={updateActionTitle}
                >
                  <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Update</span>
                </button>
                <button
                  type="button"
                  disabled={!hasActiveContracts}
                  className="h-8 px-1.5 rounded-r-md border-l border-white/20 bg-gradient-primary text-white transition-colors hover:bg-gradient-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="About Update"
                  onMouseEnter={() => setShowContractUpdateTooltip(true)}
                  onMouseLeave={() => setShowContractUpdateTooltip(false)}
                  onFocus={() => setShowContractUpdateTooltip(true)}
                  onBlur={() => setShowContractUpdateTooltip(false)}
                  onClick={() => setShowContractUpdateTooltip((v) => !v)}
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
                {showContractUpdateTooltip ? (
                  <div className={CONTRACT_UPDATE_TOOLTIP_PANEL_CLASS} role="tooltip">
                    {CONTRACT_UPDATE_SECTION_HINT}
                  </div>
                ) : null}
              </div>
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
                              onClick={() => queueContractStatusChange(contract.id)}
                              title={contract.status === 'active' ? 'Click to close contract' : 'Click to reopen contract'}
                              aria-label={
                                contract.status === 'active'
                                  ? 'Status Active. Click to close this contract.'
                                  : 'Status Closed. Click to reopen this contract.'
                              }
                              className={`px-2.5 py-1 text-xs rounded-full cursor-pointer transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-gray-900 ${
                                contract.status === 'active'
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 hover:ring-2 hover:ring-green-300/80 dark:hover:ring-green-600/50'
                                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-500'
                              }`}
                            >
                              {contract.status === 'active' ? 'Active' : 'Closed'}
                            </button>
                          </td>
                          <td className="px-3 sm:px-4 lg:px-6 py-2 sm:py-[0.6rem] lg:py-[0.7rem]" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-0.5">
                              <button
                                type="button"
                                onClick={() => queueContractStatusChange(contract.id)}
                                className={rowActionIconButtonClass}
                                title={contract.status === 'active' ? 'End contract' : 'Reopen contract'}
                                aria-label={contract.status === 'active' ? 'End contract' : 'Reopen contract'}
                              >
                                {contract.status === 'active' ? (
                                  <Ban className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                ) : (
                                  <PlayCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                )}
                              </button>
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
                          onClick={() => queueContractStatusChange(contract.id)}
                          title={contract.status === 'active' ? 'Tap to close contract' : 'Tap to reopen contract'}
                          aria-label={
                            contract.status === 'active'
                              ? 'Status Active. Tap to close this contract.'
                              : 'Status Closed. Tap to reopen this contract.'
                          }
                          className={`shrink-0 px-2.5 py-1 text-xs rounded-full cursor-pointer transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-gray-900 ${
                            contract.status === 'active'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 hover:ring-2 hover:ring-green-300/80 dark:hover:ring-green-600/50'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-500'
                          }`}
                        >
                          {contract.status === 'active' ? 'Active' : 'Closed'}
                        </button>
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => queueContractStatusChange(contract.id)}
                            className={rowActionIconButtonClass}
                            title={contract.status === 'active' ? 'End contract' : 'Reopen contract'}
                            aria-label={contract.status === 'active' ? 'End contract' : 'Reopen contract'}
                          >
                            {contract.status === 'active' ? (
                              <Ban className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            ) : (
                              <PlayCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            )}
                          </button>
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
                ? {
                    ...c,
                    title: payload.title,
                    start_date: payload.start_date,
                    end_date: payload.end_date,
                    note: payload.note,
                    status: payload.status
                  }
                : c
            )
          );
        }}
      />

      <BusinessInvestmentUpdateModal
        open={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        entryForm={entryForm}
        setEntryForm={setEntryForm}
        contractOptions={contractOptions}
        entryTypeOptions={entryTypeOptions}
        postEntryAsTransaction={postEntryAsTransaction}
        setPostEntryAsTransaction={setPostEntryAsTransaction}
        postingAccountId={postingAccountId}
        setPostingAccountId={setPostingAccountId}
        postingAccountOptions={postingAccountOptions}
        onSubmit={handleAddEntry}
      />

      {showContractUpdateInfoMobile ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowContractUpdateInfoMobile(false)} aria-hidden />
          <div
            className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col min-h-0"
            role="dialog"
            aria-labelledby="contract-update-info-title"
          >
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div
                id="contract-update-info-title"
                className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white"
              >
                Update
              </div>
              <button
                type="button"
                onClick={() => setShowContractUpdateInfoMobile(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
                aria-label="Close"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 min-h-0 overscroll-contain">
              <p className="text-sm sm:text-base leading-relaxed text-gray-700 dark:text-gray-300">{CONTRACT_UPDATE_SECTION_HINT}</p>
            </div>
          </div>
        </div>
      ) : null}

      <DeleteConfirmationModal
        isOpen={pendingContractStatus !== null}
        onClose={() => setPendingContractStatus(null)}
        onConfirm={confirmPendingContractStatus}
        title={pendingStatusConfirmModal?.title ?? ''}
        message={pendingStatusConfirmModal?.message ?? ''}
        recordDetails={
          pendingStatusConfirmModal?.recordTitle ? (
            <p className="text-sm font-medium text-gray-900 dark:text-white">{pendingStatusConfirmModal.recordTitle}</p>
          ) : undefined
        }
        confirmLabel={pendingStatusConfirmModal?.confirmLabel ?? 'Confirm'}
        cancelLabel="Cancel"
      />

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

