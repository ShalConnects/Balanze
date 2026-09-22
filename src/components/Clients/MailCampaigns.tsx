import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Edit2,
  Eye,
  Filter,
  Mail,
  Megaphone,
  Plus,
  Tag,
  Trash2,
  Upload,
  UserMinus,
  Users,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useMailCampaignStore } from '../../store/useMailCampaignStore';
import { useClientStore } from '../../store/useClientStore';
import { usePlanFeatures } from '../../hooks/usePlanFeatures';
import { FREE_MAIL_CONTACT_LIMIT } from '../../types/mailCampaign';
import type { MailCampaign, MailCampaignMember, MailCampaignStatus, MailMemberStatus } from '../../types/mailCampaign';
import { downloadCsv, parseEmailCsv } from '../../utils/mailCsv';
import { includesNormalized, normalizeSearchText } from '../../utils/searchText';
import { isCancel, pickCsvFile } from '../../lib/nativeFile';
import {
  LP,
  LP_SEARCH_ACTIVE_STYLE,
  ListPageClearFiltersButton,
  ListPageErrorBanner,
  ListPageFilterSearchField,
  ListPageFilterSelect,
  ListPageMobileFilterChip,
  ListPageMobileFilterModal,
  ListPageMobileFilterSection,
  listPageMobileFilterIconButtonClass,
} from '../common/listPage/listPageLayout';
import { ListPager } from '../common/ListPager';
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';
import { AppModal } from '../common/AppModal';
import { Tooltip } from '../common/Tooltip';

type Tab = 'contacts' | 'campaigns';

const CAMPAIGN_STATUS_OPTIONS: { value: MailCampaignStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'ready', label: 'Ready' },
  { value: 'sending', label: 'Sending' },
  { value: 'sent', label: 'Sent' },
  { value: 'archived', label: 'Archived' },
];

const MEMBER_STATUS_OPTIONS: { value: MailMemberStatus; label: string }[] = [
  { value: 'marked', label: 'Marked' },
  { value: 'unsubscribed', label: 'Unsubscribed' },
  { value: 'skipped', label: 'Skipped' },
  { value: 'queued', label: 'Queued' },
  { value: 'sent', label: 'Sent' },
  { value: 'bounced', label: 'Bounced' },
  { value: 'failed', label: 'Failed' },
];

const PAGE_SIZE_OPTIONS = [25, 50, 100, 200, 500, 1000];
const PAGE_SIZE_KEY = 'mailCampaigns.pageSize';
const ICON = 'w-3.5 h-3.5 sm:w-4 sm:h-4';
const TH =
  'px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider';
const TD = 'px-3 sm:px-4 lg:px-6 py-2 sm:py-[0.6rem] lg:py-[0.7rem]';
const ACTION =
  'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-50 transition-colors';
const ACTION_DEL =
  'text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50 transition-colors';
const MOBILE_ACTION =
  'p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50 touch-manipulation';
const MOBILE_DEL =
  'p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 touch-manipulation';
const CARD =
  'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-200';
const TOOLBAR_ICON = 'w-4 h-4';

function loadPageSize(): number {
  const saved = Number(localStorage.getItem(PAGE_SIZE_KEY) || 100);
  return PAGE_SIZE_OPTIONS.includes(saved) ? saved : 100;
}

const chip = (active = false) =>
  `px-2 sm:px-3 py-1.5 h-8 rounded-md text-xs sm:text-[13px] transition-colors flex items-center space-x-1 sm:space-x-1.5 ${
    active
      ? 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
  }`;

const fieldCls =
  'flex-1 min-w-[9rem] px-2 py-1.5 h-8 text-[13px] rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

function campaignStatusLabel(status: MailCampaignStatus): string {
  return CAMPAIGN_STATUS_OPTIONS.find((o) => o.value === status)?.label || status;
}

function memberStatusBadgeClass(status: MailMemberStatus): string {
  switch (status) {
    case 'marked':
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    case 'unsubscribed':
      return 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    case 'skipped':
      return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600';
    case 'queued':
      return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
    case 'sent':
      return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    case 'bounced':
    case 'failed':
      return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
    default:
      return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600';
  }
}

function campaignStatusBadgeClass(status: MailCampaignStatus): string {
  switch (status) {
    case 'draft':
      return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600';
    case 'ready':
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    case 'sending':
      return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
    case 'sent':
      return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    case 'archived':
      return 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    default:
      return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600';
  }
}

function StatusBadge({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-medium border ${className}`}
    >
      {label}
    </span>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon,
  onClick,
  active,
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <div
      className={`${LP.statCard} ${
        onClick
          ? `cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
              active
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                : ''
            }`
          : ''
      }`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      <div className="flex items-center justify-between">
        <div className="text-left min-w-0 flex-1">
          <p className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 truncate">
            {label}
          </p>
          <p className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-lg sm:text-xl lg:text-[1.2rem]">
            {value}
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-[11px] truncate">{hint}</p>
        </div>
        <div className="text-blue-600 flex-shrink-0">{icon}</div>
      </div>
    </div>
  );
}

export const MailCampaigns: React.FC = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const {
    contacts,
    campaigns,
    loading,
    error,
    fetchAll,
    addContact,
    importContacts,
    addFromClients,
    deleteContacts,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    markMembers,
    unmarkMembers,
    setMemberStatus,
    fetchMembers,
    memberContactIds,
    contactLimit,
    canAddContacts,
  } = useMailCampaignStore();
  const { clients, fetchClients } = useClientStore();
  const { isPremiumPlan } = usePlanFeatures();

  const tab: Tab = params.get('tab') === 'campaigns' ? 'campaigns' : 'contacts';
  const setTab = (t: Tab) => {
    const next = new URLSearchParams(params);
    if (t === 'contacts') next.delete('tab');
    else next.set('tab', t);
    setParams(next, { replace: true });
  };

  const [search, setSearch] = useState('');
  const [campaignFilter, setCampaignFilter] = useState('');
  const [showMobileFilterMenu, setShowMobileFilterMenu] = useState(false);
  const [tempCampaignFilter, setTempCampaignFilter] = useState('');
  const [inCampaignIds, setInCampaignIds] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [campName, setCampName] = useState('');
  const [campNotes, setCampNotes] = useState('');
  const [bulkCampaignId, setBulkCampaignId] = useState('');
  const [targetCampaignId, setTargetCampaignId] = useState('');
  const [members, setMembers] = useState<MailCampaignMember[]>([]);
  const [membersCamp, setMembersCamp] = useState<{ id: string; name: string } | null>(null);
  const [deleteIds, setDeleteIds] = useState<string[] | null>(null);
  const [deleteCampId, setDeleteCampId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editingCamp, setEditingCamp] = useState<MailCampaign | null>(null);
  const [pageSize, setPageSize] = useState(loadPageSize);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchAll();
    fetchClients();
  }, [fetchAll, fetchClients]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!campaignFilter) {
        setInCampaignIds(new Set());
        return;
      }
      const ids = await memberContactIds(campaignFilter);
      if (!cancelled) setInCampaignIds(ids);
    })();
    return () => {
      cancelled = true;
    };
  }, [campaignFilter, memberContactIds, campaigns]);

  useEffect(() => {
    if (showMobileFilterMenu) setTempCampaignFilter(campaignFilter);
  }, [showMobileFilterMenu, campaignFilter]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (showMobileFilterMenu) {
        setShowMobileFilterMenu(false);
        return;
      }
      if (selected.size) setSelected(new Set());
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected.size, showMobileFilterMenu]);

  const limit = contactLimit();
  const totalMarked = campaigns.reduce((n, c) => n + (c.member_count || 0), 0);
  const clientSourced = contacts.filter((c) => c.client_id).length;

  const filtered = useMemo(() => {
    const q = normalizeSearchText(search);
    return contacts.filter((c) => {
      if (campaignFilter && !inCampaignIds.has(c.id)) return false;
      if (!q) return true;
      return includesNormalized(c.email, q) || includesNormalized(c.name, q);
    });
  }, [contacts, search, campaignFilter, inCampaignIds]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pageItems = useMemo(
    () => filtered.slice(startIndex, endIndex),
    [filtered, startIndex, endIndex]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, campaignFilter, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const hasFilters = !!search.trim() || !!campaignFilter;
  const campaignSelectOptions = useMemo(
    () => [
      { value: '', label: 'All emails' },
      ...campaigns.map((c) => ({
        value: c.id,
        label: `${c.name} (${c.member_count || 0})`,
      })),
    ],
    [campaigns]
  );
  const bulkCampaignOptions = useMemo(
    () => [
      { value: '', label: 'Pick campaign…' },
      ...campaigns.map((c) => ({
        value: c.id,
        label: `${c.name} (${c.member_count || 0})`,
      })),
    ],
    [campaigns]
  );
  const targetCampaignOptions = useMemo(
    () => [
      { value: '', label: 'List only' },
      ...campaigns.map((c) => ({
        value: c.id,
        label: c.name,
      })),
    ],
    [campaigns]
  );
  const memberStatusCounts = useMemo(() => {
    const counts: Partial<Record<MailMemberStatus, number>> = {};
    for (const m of members) {
      counts[m.status] = (counts[m.status] || 0) + 1;
    }
    return counts;
  }, [members]);
  const allPageSelected =
    pageItems.length > 0 && pageItems.every((c) => selected.has(c.id));
  const somePageSelected = pageItems.some((c) => selected.has(c.id));

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectPage = (on: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      pageItems.forEach((c) => (on ? next.add(c.id) : next.delete(c.id)));
      return next;
    });
  };

  const changePageSize = (n: number) => {
    const size = PAGE_SIZE_OPTIONS.includes(n) ? n : 100;
    setPageSize(size);
    localStorage.setItem(PAGE_SIZE_KEY, String(size));
    setCurrentPage(1);
  };

  const withBusy = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  const refreshCampaignMembership = async (campaignId: string) => {
    if (!campaignId) return;
    if (campaignFilter === campaignId) {
      setInCampaignIds(await memberContactIds(campaignId));
    }
    if (membersCamp?.id === campaignId) {
      setMembers(await fetchMembers(campaignId));
    }
  };

  const onAdd = () =>
    withBusy(async () => {
      if (!email.trim()) return toast.warning('Enter an email');
      const beforeIds = new Set(contacts.map((c) => c.id));
      const row = await addContact(
        { email, name },
        targetCampaignId ? { campaignId: targetCampaignId } : undefined
      );
      if (!row) return;
      setEmail('');
      setName('');
      const wasNew = !beforeIds.has(row.id);
      if (targetCampaignId) {
        toast.success(
          wasNew
            ? 'Added to list and marked for campaign'
            : 'Already in list · marked for campaign'
        );
        await refreshCampaignMembership(targetCampaignId);
      } else {
        toast.success('Email added');
      }
    });

  const onImport = (file: File | null) =>
    withBusy(async () => {
      if (!file) return;
      const text = await file.text();
      const { rows, skips, total_rows } = parseEmailCsv(text);
      if (!rows.length && !skips.length) return toast.warning('CSV is empty');
      const campaignId = targetCampaignId || undefined;
      if (rows.length >= 5000) {
        toast.message(`Importing ${rows.length.toLocaleString()} rows… this can take a few minutes`);
      }
      const { imported, skipped, limited, marked } = await importContacts(
        rows,
        campaignId ? { campaignId } : undefined
      );
      const skipTotal = skipped + skips.length;
      if (campaignId && imported === 0 && marked > 0) {
        toast.success(`Already in list · marked ${marked} for campaign`);
      } else {
        const parts = [
          `Imported ${imported.toLocaleString()} of ${total_rows.toLocaleString()}`,
          skipTotal ? `Skipped ${skipTotal.toLocaleString()}` : null,
          marked ? `Marked ${marked.toLocaleString()} for campaign` : null,
          limited
            ? `Hit free plan limit (${FREE_MAIL_CONTACT_LIMIT.toLocaleString()}). Premium is unlimited.`
            : null,
          !campaignId && imported === 0 && skipTotal > 0
            ? 'Pick a campaign next to Add to mark existing emails'
            : null,
        ].filter(Boolean);
        toast.success(parts.join('. '));
      }
      if (campaignId) await refreshCampaignMembership(campaignId);
    });

  const onPickImport = async () => {
    if (busy) return;
    try {
      const file = await pickCsvFile();
      await onImport(file);
    } catch (e: unknown) {
      if (isCancel(e)) return;
      toast.error(e instanceof Error ? e.message : 'Could not open file picker');
    }
  };

  const onAddFromClients = () =>
    withBusy(async () => {
      const withEmail = clients.filter((c) => c.email);
      if (!withEmail.length) return toast.warning('No clients have an email');
      const { imported, linked } = await addFromClients(withEmail);
      if (!imported && !linked) return toast.info('All client emails already in list');
      toast.success(
        [imported ? `Added ${imported}` : null, linked ? `linked ${linked} existing` : null]
          .filter(Boolean)
          .join(', ')
      );
    });

  const onMark = () =>
    withBusy(async () => {
      if (!campaigns.length) {
        toast.warning('Create a campaign first');
        setTab('campaigns');
        return;
      }
      if (!bulkCampaignId) return toast.warning('Pick a campaign');
      if (!selected.size) return;
      const n = await markMembers(bulkCampaignId, [...selected]);
      if (n) toast.success(`Marked ${n} for campaign`);
      if (campaignFilter === bulkCampaignId) {
        setInCampaignIds(await memberContactIds(bulkCampaignId));
      }
      if (membersCamp?.id === bulkCampaignId) {
        setMembers(await fetchMembers(bulkCampaignId));
      }
    });

  const onUnsubscribe = () =>
    withBusy(async () => {
      if (!campaigns.length) {
        toast.warning('Create a campaign first');
        setTab('campaigns');
        return;
      }
      if (!bulkCampaignId) return toast.warning('Pick a campaign');
      if (!selected.size) return;
      const n = await setMemberStatus(bulkCampaignId, [...selected], 'unsubscribed');
      if (n) toast.success(`Unsubscribed ${n} from campaign`);
      if (campaignFilter === bulkCampaignId) {
        setInCampaignIds(await memberContactIds(bulkCampaignId));
      }
      if (membersCamp?.id === bulkCampaignId) {
        setMembers(await fetchMembers(bulkCampaignId));
      }
    });

  const onUnmark = () =>
    withBusy(async () => {
      if (!bulkCampaignId) return toast.warning('Pick a campaign');
      if (!selected.size) return;
      const n = await unmarkMembers(bulkCampaignId, [...selected]);
      toast.success(n ? `Removed ${n} from campaign` : 'None were in this campaign');
      if (campaignFilter === bulkCampaignId) {
        setInCampaignIds(await memberContactIds(bulkCampaignId));
      }
      if (membersCamp?.id === bulkCampaignId) {
        setMembers(await fetchMembers(bulkCampaignId));
      }
    });

  const openMembers = useCallback(
    async (id: string, campName: string) => {
      setMembersCamp({ id, name: campName });
      setMembers(await fetchMembers(id));
    },
    [fetchMembers]
  );

  const onCreateCampaign = () =>
    withBusy(async () => {
      const c = await createCampaign(campName, campNotes);
      if (!c) return;
      setCampName('');
      setCampNotes('');
      setBulkCampaignId(c.id);
      setTargetCampaignId(c.id);
      toast.success('Campaign created');
    });

  const exportContacts = () => {
    if (!contacts.length) return toast.warning('Nothing to export');
    downloadCsv(
      'mail-contacts.csv',
      ['email', 'name'],
      contacts.map((c) => ({ email: c.email, name: c.name || '' }))
    );
  };

  const exportCampaignCsv = (c: MailCampaign) =>
    withBusy(async () => {
      const rows = await fetchMembers(c.id);
      if (!rows.length) return toast.warning('No emails in this campaign');
      downloadCsv(
        `${c.name.replace(/[^\w.-]+/g, '_').slice(0, 40) || 'campaign'}.csv`,
        ['email', 'name', 'status'],
        rows.map((m) => ({ email: m.email || '', name: m.name || '', status: m.status }))
      );
    });

  const campaignRowActions = (c: MailCampaign, mobile = false) =>
    mobile ? (
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={() => openMembers(c.id, c.name)}
          className={MOBILE_ACTION}
          disabled={busy}
          title="View campaign members"
          aria-label={`View ${c.name}`}
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => exportCampaignCsv(c)}
          className={MOBILE_ACTION}
          disabled={busy}
          title="Export CSV"
          aria-label={`Export ${c.name} CSV`}
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setEditingCamp(c)}
          className={MOBILE_ACTION}
          disabled={busy}
          title="Edit"
          aria-label={`Edit ${c.name}`}
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setDeleteCampId(c.id)}
          className={MOBILE_DEL}
          disabled={busy}
          title="Delete"
          aria-label={`Delete ${c.name}`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    ) : (
      <div className="flex items-center justify-center gap-2">
        <Tooltip content="View members" placement="top">
          <button
            type="button"
            onClick={() => openMembers(c.id, c.name)}
            className={ACTION}
            disabled={busy}
            aria-label={`View ${c.name}`}
          >
            <Eye className={ICON} />
          </button>
        </Tooltip>
        <Tooltip content="Export CSV" placement="top">
          <button
            type="button"
            onClick={() => exportCampaignCsv(c)}
            className={ACTION}
            disabled={busy}
            aria-label={`Export ${c.name} CSV`}
          >
            <Download className={ICON} />
          </button>
        </Tooltip>
        <Tooltip content="Edit" placement="top">
          <button
            type="button"
            onClick={() => setEditingCamp(c)}
            className={ACTION}
            disabled={busy}
            aria-label={`Edit ${c.name}`}
          >
            <Edit2 className={ICON} />
          </button>
        </Tooltip>
        <Tooltip content="Delete" placement="top">
          <button
            type="button"
            onClick={() => setDeleteCampId(c.id)}
            className={ACTION_DEL}
            disabled={busy}
            aria-label={`Delete ${c.name}`}
          >
            <Trash2 className={ICON} />
          </button>
        </Tooltip>
      </div>
    );

  return (
    <div className="w-full">
      <div className={LP.stack}>
        {error ? (
          <ListPageErrorBanner
            title="Could not load email campaigns:"
            message={error}
            hint="Run the mail_campaigns migration in Supabase if tables are missing."
          />
        ) : null}

        <div className={LP.card}>
          {/* Toolbar — matches ClientList filter header */}
          <div className={LP.clientFilterHeader}>
            <div className={LP.filterRow} style={{ marginBottom: 0 }}>
              <button
                type="button"
                onClick={() => navigate('/clients')}
                className={chip()}
                title="Back to clients"
              >
                <ArrowLeft className={ICON} />
                <span className="hidden sm:inline">Clients</span>
              </button>

              <div className="flex items-center gap-1 border-l border-gray-200 dark:border-gray-700 pl-2 ml-0.5">
                <button
                  type="button"
                  onClick={() => setTab('contacts')}
                  className={chip(tab === 'contacts')}
                  style={tab === 'contacts' ? LP_SEARCH_ACTIVE_STYLE : undefined}
                >
                  <Mail className={ICON} />
                  <span>Emails</span>
                  <span className="text-[11px] opacity-70">{contacts.length}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTab('campaigns')}
                  className={chip(tab === 'campaigns')}
                  style={tab === 'campaigns' ? LP_SEARCH_ACTIVE_STYLE : undefined}
                >
                  <Megaphone className={ICON} />
                  <span>Campaigns</span>
                  <span className="text-[11px] opacity-70">{campaigns.length}</span>
                </button>
              </div>

              {tab === 'contacts' && (
                <>
                  <ListPageFilterSearchField
                    value={search}
                    onChange={setSearch}
                    placeholder="Search emails…"
                  />
                  <div className="hidden md:block">
                    <ListPageFilterSelect
                      value={campaignFilter}
                      onChange={setCampaignFilter}
                      options={campaignSelectOptions}
                      highlight={!!campaignFilter}
                      menuScrollable
                      ariaLabel="Filter by campaign"
                    />
                  </div>
                  <div className="md:hidden">
                    <button
                      type="button"
                      onClick={() => setShowMobileFilterMenu(true)}
                      className={listPageMobileFilterIconButtonClass(!!campaignFilter)}
                      style={campaignFilter ? LP_SEARCH_ACTIVE_STYLE : undefined}
                      title="Filters"
                      aria-label="Filters"
                    >
                      <Filter className={TOOLBAR_ICON} />
                    </button>
                  </div>
                  {hasFilters && (
                    <ListPageClearFiltersButton
                      onClick={() => {
                        setSearch('');
                        setCampaignFilter('');
                      }}
                    />
                  )}
                </>
              )}

              <div className="flex-grow" />

              {tab === 'contacts' ? (
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
                  <button
                    type="button"
                    onClick={onPickImport}
                    className={`${chip(!!targetCampaignId)} touch-manipulation`}
                    style={targetCampaignId ? LP_SEARCH_ACTIVE_STYLE : undefined}
                    disabled={busy}
                    title={
                      targetCampaignId
                        ? 'Import CSV into list and mark for selected campaign'
                        : 'Import CSV'
                    }
                  >
                    <Upload className={ICON} />
                    <span className="hidden sm:inline">Import</span>
                  </button>
                  <button
                    type="button"
                    onClick={onAddFromClients}
                    className={`${chip()} touch-manipulation`}
                    disabled={busy}
                  >
                    <Users className={ICON} />
                    <span className="hidden sm:inline">From clients</span>
                  </button>
                  <button
                    type="button"
                    onClick={exportContacts}
                    className={`${chip()} touch-manipulation`}
                    disabled={busy}
                  >
                    <Download className={ICON} />
                    <span className="hidden sm:inline">Export</span>
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          {/* Summary — same gradient stats as Clients */}
          <div className={LP.clientSummaryGrid}>
            <StatCard
              label="Emails"
              value={contacts.length}
              hint={
                filtered.length !== contacts.length
                  ? `${filtered.length} matching filter`
                  : 'In your list'
              }
              icon={<Mail className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />}
              onClick={() => setTab('contacts')}
              active={tab === 'contacts'}
            />
            <StatCard
              label="Campaigns"
              value={campaigns.length}
              hint="Labels only · no sending"
              icon={<Megaphone className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />}
              onClick={() => setTab('campaigns')}
              active={tab === 'campaigns'}
            />
            <StatCard
              label="In campaigns"
              value={totalMarked}
              hint="Across all campaigns"
              icon={<Tag className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />}
            />
            <StatCard
              label="From clients"
              value={clientSourced}
              hint={`${contacts.length - clientSourced} list-only`}
              icon={<Users className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />}
            />
            {!isPremiumPlan && (
              <StatCard
                label="List limit"
                value={`${contacts.length}/${limit === -1 ? '∞' : limit}`}
                hint={`Free plan · ${FREE_MAIL_CONTACT_LIMIT.toLocaleString()} max`}
                icon={
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12l2 2l4 -4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                }
              />
            )}
          </div>

          {tab === 'contacts' ? (
            <>
              {/* Add / bulk bar */}
              <div className="px-3 lg:px-4 pb-3 space-y-2 border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap gap-2 items-end">
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && onAdd()}
                    placeholder="email@example.com"
                    className={fieldCls}
                    disabled={busy}
                  />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && onAdd()}
                    placeholder="Name (optional)"
                    className={fieldCls}
                    disabled={busy}
                  />
                  <ListPageFilterSelect
                    value={targetCampaignId}
                    onChange={setTargetCampaignId}
                    options={targetCampaignOptions}
                    highlight={!!targetCampaignId}
                    menuScrollable
                    ariaLabel="Also add to campaign"
                  />
                  <button
                    type="button"
                    onClick={onAdd}
                    disabled={busy || (!targetCampaignId && !canAddContacts(1))}
                    className="px-2 sm:px-3 py-1.5 h-8 rounded-md bg-gradient-primary text-white hover:bg-gradient-primary-hover text-xs sm:text-[13px] flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className={ICON} />
                    Add
                  </button>
                </div>
                {targetCampaignId ? (
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Add and Import also mark for{' '}
                    <span className="font-medium text-gray-700 dark:text-gray-200">
                      {campaigns.find((c) => c.id === targetCampaignId)?.name || 'campaign'}
                    </span>
                    . Emails stay on your main list.
                  </p>
                ) : null}

                {selected.size > 0 && (
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-900/20 px-2 py-2">
                    <span className="text-[12px] sm:text-[13px] font-medium text-blue-700 dark:text-blue-300 shrink-0">
                      {selected.size} selected
                    </span>
                    <ListPageFilterSelect
                      value={bulkCampaignId}
                      onChange={setBulkCampaignId}
                      options={bulkCampaignOptions}
                      highlight={!!bulkCampaignId}
                      menuScrollable
                      ariaLabel="Campaign for bulk actions"
                    />
                    <button
                      type="button"
                      onClick={onMark}
                      disabled={busy}
                      title="Mark for campaign"
                      className="px-2 sm:px-3 py-1.5 h-8 rounded-md bg-gradient-primary text-white hover:bg-gradient-primary-hover text-[13px] disabled:opacity-50 flex items-center gap-1 touch-manipulation"
                    >
                      <Tag className={ICON} />
                      <span>Mark</span>
                    </button>
                    <button
                      type="button"
                      onClick={onUnsubscribe}
                      className={`${chip()} touch-manipulation`}
                      disabled={busy}
                      title="Mark as unsubscribed"
                    >
                      <UserMinus className={ICON} />
                      <span className="hidden sm:inline">Unsubscribe</span>
                    </button>
                    <button
                      type="button"
                      onClick={onUnmark}
                      className={`${chip()} touch-manipulation`}
                      disabled={busy}
                      title="Remove from campaign"
                    >
                      <X className={ICON} />
                      <span className="hidden sm:inline">Remove</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteIds([...selected])}
                      className="px-2 py-1.5 h-8 text-[13px] rounded-md text-red-600 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-1 touch-manipulation disabled:opacity-50"
                      disabled={busy}
                      title="Delete from list"
                    >
                      <Trash2 className={ICON} />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelected(new Set())}
                      className={`${chip()} touch-manipulation`}
                      title="Clear selection"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {/* Desktop table */}
              <div className={LP.tableOuter} style={LP.tableOuterRadius}>
                <div className={LP.desktopTableScroll}>
                  <table className={LP.table}>
                    <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                      <tr>
                        <th className={`${TH} w-10`}>
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 dark:border-gray-600"
                            checked={allPageSelected}
                            ref={(el) => {
                              if (el) el.indeterminate = somePageSelected && !allPageSelected;
                            }}
                            onChange={(e) => selectPage(e.target.checked)}
                            disabled={!pageItems.length}
                            aria-label="Select page"
                          />
                        </th>
                        <th className={TH}>Email</th>
                        <th className={TH}>Name</th>
                        <th className={TH}>Source</th>
                        <th className={`${TH} text-center`}>Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {loading && !contacts.length ? (
                        <tr>
                          <td colSpan={5} className="py-16 text-center text-sm text-gray-500">
                            Loading…
                          </td>
                        </tr>
                      ) : filtered.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-16 text-center text-sm text-gray-500">
                            {contacts.length
                              ? 'No emails match this filter.'
                              : 'No emails yet. Add, import CSV, or pull from clients.'}
                          </td>
                        </tr>
                      ) : (
                        pageItems.map((c) => (
                          <tr
                            key={c.id}
                            className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${
                              selected.has(c.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                            }`}
                          >
                            <td className={TD}>
                              <input
                                type="checkbox"
                                checked={selected.has(c.id)}
                                onChange={() => toggle(c.id)}
                                className="rounded border-gray-300 dark:border-gray-600"
                              />
                            </td>
                            <td className={`${TD} font-mono text-xs sm:text-sm break-all text-gray-900 dark:text-white`}>
                              {c.email}
                            </td>
                            <td className={`${TD} text-xs sm:text-sm text-gray-600 dark:text-gray-300`}>
                              {c.name || '—'}
                            </td>
                            <td className={`${TD} text-xs`}>
                              {c.client_id ? (
                                <span className="px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                                  client
                                </span>
                              ) : (
                                <span className="text-gray-400 dark:text-gray-500">list</span>
                              )}
                            </td>
                            <td className={`${TD} text-center`}>
                              <div className="flex items-center justify-center gap-2">
                                <Tooltip content="Delete" placement="top">
                                  <button
                                    type="button"
                                    onClick={() => setDeleteIds([c.id])}
                                    className={ACTION_DEL}
                                    aria-label="Delete"
                                    disabled={busy}
                                  >
                                    <Trash2 className={ICON} />
                                  </button>
                                </Tooltip>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile cards */}
              <div className={LP.mobileScroll}>
                <div className="space-y-3 sm:space-y-4 px-3 sm:px-4 py-3">
                  {filtered.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-16">
                      {contacts.length
                        ? 'No emails match this filter.'
                        : 'No emails yet. Add, import CSV, or pull from clients.'}
                    </p>
                  ) : (
                    pageItems.map((c) => (
                      <div
                        key={c.id}
                        className={`${CARD} ${
                          selected.has(c.id)
                            ? 'ring-2 ring-blue-500 ring-opacity-50 border-blue-300 dark:border-blue-700'
                            : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selected.has(c.id)}
                            onChange={() => toggle(c.id)}
                            className="mt-1 rounded border-gray-300 dark:border-gray-600"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="font-mono text-xs sm:text-sm break-all text-gray-900 dark:text-white">
                              {c.email}
                            </div>
                            <div className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {c.name || 'No name'} · {c.client_id ? 'client' : 'list'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-end pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-gray-200 dark:border-gray-700">
                          <button
                            type="button"
                            onClick={() => setDeleteIds([c.id])}
                            className={MOBILE_DEL}
                            aria-label="Delete"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {filtered.length > 0 && (
                <ListPager
                  page={safePage}
                  totalPages={totalPages}
                  total={filtered.length}
                  start={startIndex}
                  end={Math.min(endIndex, filtered.length)}
                  onPage={setCurrentPage}
                  pageSize={pageSize}
                  pageSizeOptions={PAGE_SIZE_OPTIONS}
                  onPageSizeChange={changePageSize}
                  itemLabel="emails"
                />
              )}
            </>
          ) : (
            <>
              <div className="px-3 lg:px-4 pb-3 space-y-2 border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap gap-2 items-end">
                  <input
                    value={campName}
                    onChange={(e) => setCampName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && onCreateCampaign()}
                    placeholder="Campaign name"
                    className={fieldCls}
                    disabled={busy}
                  />
                  <input
                    value={campNotes}
                    onChange={(e) => setCampNotes(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && onCreateCampaign()}
                    placeholder="Notes (optional)"
                    className={fieldCls}
                    disabled={busy}
                  />
                  <button
                    type="button"
                    onClick={onCreateCampaign}
                    disabled={busy}
                    className="px-2 sm:px-3 py-1.5 h-8 rounded-md bg-gradient-primary text-white hover:bg-gradient-primary-hover text-xs sm:text-[13px] flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Plus className={ICON} />
                    Create
                  </button>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Labels only — mark or unsubscribe from the Emails tab. Status is ready for future sending.
                </p>
              </div>

              <div className={LP.mobileScroll}>
                <div className="space-y-3 sm:space-y-4 px-3 sm:px-4 py-3">
                  {!campaigns.length ? (
                    <p className="text-sm text-gray-500 text-center py-16">No campaigns yet.</p>
                  ) : (
                    campaigns.map((c) => (
                      <div key={c.id} className={CARD}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                              {c.name}
                            </div>
                            <div className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                              {c.notes || 'No notes'}
                            </div>
                          </div>
                          <StatusBadge
                            label={campaignStatusLabel(c.status)}
                            className={campaignStatusBadgeClass(c.status)}
                          />
                        </div>
                        <div className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-2">
                          {c.member_count || 0} in campaign
                        </div>
                        <div className="flex items-center justify-end pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-gray-200 dark:border-gray-700">
                          {campaignRowActions(c, true)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className={LP.tableOuter} style={LP.tableOuterRadius}>
                <div className={LP.desktopTableScroll}>
                  <table className={LP.table}>
                    <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                      <tr>
                        <th className={TH}>Name</th>
                        <th className={TH}>Notes</th>
                        <th className={TH}>Status</th>
                        <th className={TH}>In campaign</th>
                        <th className={`${TH} text-center`}>Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {!campaigns.length ? (
                        <tr>
                          <td colSpan={5} className="py-16 text-center text-sm text-gray-500">
                            No campaigns yet.
                          </td>
                        </tr>
                      ) : (
                        campaigns.map((c) => (
                          <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className={`${TD} text-xs sm:text-sm font-medium text-gray-900 dark:text-white`}>
                              {c.name}
                            </td>
                            <td className={`${TD} text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate max-w-[14rem]`}>
                              {c.notes || '—'}
                            </td>
                            <td className={TD}>
                              <StatusBadge
                                label={campaignStatusLabel(c.status)}
                                className={campaignStatusBadgeClass(c.status)}
                              />
                            </td>
                            <td className={`${TD} text-xs sm:text-sm text-gray-900 dark:text-white`}>
                              {c.member_count || 0}
                            </td>
                            <td className={TD}>{campaignRowActions(c)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <AppModal
        isOpen={!!membersCamp}
        onClose={() => setMembersCamp(null)}
        title={membersCamp ? `Campaign · ${membersCamp.name}` : 'Campaign members'}
        size="2xl"
      >
        {members.length > 0 && (
          <div className="px-4 pt-3 pb-1 flex flex-wrap gap-1.5 border-b border-gray-200 dark:border-gray-700">
            <StatusBadge
              label={`${members.length} total`}
              className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600"
            />
            {MEMBER_STATUS_OPTIONS.filter((o) => memberStatusCounts[o.value]).map((o) => (
              <StatusBadge
                key={o.value}
                label={`${o.label} ${memberStatusCounts[o.value]}`}
                className={memberStatusBadgeClass(o.value)}
              />
            ))}
          </div>
        )}
        <div className="max-h-[55vh] overflow-y-auto">
          <table className={LP.table}>
            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
              <tr>
                <th className={TH}>Email</th>
                <th className={TH}>Status</th>
                <th className={`${TH} text-center w-20`}>Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {!members.length ? (
                <tr>
                  <td colSpan={3} className="py-16 text-center text-sm text-gray-500">
                    No emails in this campaign yet. Select emails → Mark or Unsubscribe.
                  </td>
                </tr>
              ) : (
                members.map((m) => (
                  <tr key={m.contact_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className={`${TD} font-mono text-xs sm:text-sm break-all text-gray-900 dark:text-white`}>
                      <div>{m.email}</div>
                      {m.name ? (
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 font-sans">
                          {m.name}
                        </div>
                      ) : null}
                    </td>
                    <td className={TD}>
                      <ListPageFilterSelect
                        value={m.status}
                        onChange={(v) =>
                          withBusy(async () => {
                            if (!membersCamp) return;
                            await setMemberStatus(
                              membersCamp.id,
                              [m.contact_id],
                              v as MailMemberStatus
                            );
                            setMembers(await fetchMembers(membersCamp.id));
                          })
                        }
                        options={MEMBER_STATUS_OPTIONS}
                        highlight={m.status !== 'marked'}
                        menuScrollable
                        ariaLabel={`Status for ${m.email}`}
                      />
                    </td>
                    <td className={`${TD} text-center`}>
                      <Tooltip content="Remove from campaign" placement="top">
                        <button
                          type="button"
                          className={ACTION_DEL}
                          disabled={busy}
                          aria-label="Remove from campaign"
                          onClick={() =>
                            withBusy(async () => {
                              if (!membersCamp) return;
                              await unmarkMembers(membersCamp.id, [m.contact_id]);
                              setMembers(await fetchMembers(membersCamp.id));
                            })
                          }
                        >
                          <Trash2 className={ICON} />
                        </button>
                      </Tooltip>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => {
              if (!membersCamp) return;
              if (!members.length) return toast.warning('No emails in this campaign');
              downloadCsv(
                `${membersCamp.name.replace(/[^\w.-]+/g, '_').slice(0, 40) || 'campaign'}.csv`,
                ['email', 'name', 'status'],
                members.map((m) => ({
                  email: m.email || '',
                  name: m.name || '',
                  status: m.status,
                }))
              );
            }}
            className={chip()}
          >
            <Download className={ICON} /> Export CSV
          </button>
          <button
            type="button"
            onClick={() => setMembersCamp(null)}
            className="px-3 py-1.5 h-8 rounded-md bg-gradient-primary text-white hover:bg-gradient-primary-hover text-[13px]"
          >
            Close
          </button>
        </div>
      </AppModal>

      <AppModal
        isOpen={!!editingCamp}
        onClose={() => setEditingCamp(null)}
        title="Edit campaign"
        size="md"
      >
        {editingCamp && (
          <div className="p-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Name
              </label>
              <input
                className={`${fieldCls} w-full`}
                value={editingCamp.name}
                onChange={(e) => setEditingCamp({ ...editingCamp, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Notes
              </label>
              <input
                className={`${fieldCls} w-full`}
                value={editingCamp.notes || ''}
                onChange={(e) => setEditingCamp({ ...editingCamp, notes: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Status
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge
                  label={campaignStatusLabel(editingCamp.status)}
                  className={campaignStatusBadgeClass(editingCamp.status)}
                />
                <ListPageFilterSelect
                  value={editingCamp.status}
                  onChange={(v) =>
                    setEditingCamp({
                      ...editingCamp,
                      status: v as MailCampaignStatus,
                    })
                  }
                  options={CAMPAIGN_STATUS_OPTIONS}
                  highlight={editingCamp.status !== 'draft'}
                  ariaLabel="Campaign status"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className={chip()} onClick={() => setEditingCamp(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="px-3 py-1.5 h-8 rounded-md bg-gradient-primary text-white hover:bg-gradient-primary-hover text-[13px] disabled:opacity-50"
                disabled={busy}
                onClick={() =>
                  withBusy(async () => {
                    const ok = await updateCampaign(editingCamp.id, {
                      name: editingCamp.name,
                      notes: editingCamp.notes,
                      status: editingCamp.status,
                    });
                    if (ok) {
                      toast.success('Campaign updated');
                      setEditingCamp(null);
                    }
                  })
                }
              >
                Save
              </button>
            </div>
          </div>
        )}
      </AppModal>

      <DeleteConfirmationModal
        isOpen={!!deleteIds}
        onClose={() => setDeleteIds(null)}
        onConfirm={async () => {
          if (deleteIds) {
            await deleteContacts(deleteIds);
            setSelected((prev) => {
              const next = new Set(prev);
              deleteIds.forEach((id) => next.delete(id));
              return next;
            });
            toast.success('Deleted');
          }
        }}
        title="Delete emails?"
        message={`Remove ${deleteIds?.length || 0} email(s) from your list? Campaign marks for them are removed too.`}
      />

      <DeleteConfirmationModal
        isOpen={!!deleteCampId}
        onClose={() => setDeleteCampId(null)}
        onConfirm={async () => {
          if (deleteCampId) {
            await deleteCampaign(deleteCampId);
            if (membersCamp?.id === deleteCampId) setMembersCamp(null);
            if (bulkCampaignId === deleteCampId) setBulkCampaignId('');
            if (targetCampaignId === deleteCampId) setTargetCampaignId('');
            if (campaignFilter === deleteCampId) setCampaignFilter('');
            toast.success('Campaign deleted');
          }
        }}
        title="Delete campaign?"
        message="Emails stay in your list. Only this campaign label is removed."
      />

      <ListPageMobileFilterModal
        open={showMobileFilterMenu}
        onBackdropClick={() => setShowMobileFilterMenu(false)}
        onApply={() => {
          setCampaignFilter(tempCampaignFilter);
          setShowMobileFilterMenu(false);
        }}
        onClearAll={() => {
          setTempCampaignFilter('');
          setCampaignFilter('');
          setShowMobileFilterMenu(false);
        }}
        applyActive={!!tempCampaignFilter}
      >
        <ListPageMobileFilterSection label="Campaign" borderBottom={false}>
          <ListPageMobileFilterChip
            selected={tempCampaignFilter === ''}
            onClick={() => setTempCampaignFilter('')}
          >
            All emails
          </ListPageMobileFilterChip>
          {campaigns.map((c) => (
            <ListPageMobileFilterChip
              key={c.id}
              selected={tempCampaignFilter === c.id}
              onClick={() => setTempCampaignFilter(c.id)}
            >
              {c.name}
              <span className="opacity-60 ml-1">({c.member_count || 0})</span>
            </ListPageMobileFilterChip>
          ))}
        </ListPageMobileFilterSection>
      </ListPageMobileFilterModal>
    </div>
  );
};

export default MailCampaigns;
