import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Ticket, Trophy, RefreshCw, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useNotificationsStore } from '../../store/notificationsStore';
import { getDrawSchedule, PRIZE_BOND_DENOMINATION, PRIZE_BOND_PAGE_SIZE, winningBondIdSet } from '../../lib/prizeBondUtils';
import { paginateList } from '../../utils/paginateList';
import {
  deletePrizeBond, fetchPrizeBonds, fetchPrizeBondWins,
  triggerPrizeBondCheck, updatePrizeBond,
} from '../../lib/prizeBondService';
import type { PrizeBond, PrizeBondWin } from '../../types/prizeBond';
import {
  THEME_ACCENT_TEXT_CLASS,
  THEME_BRAND_GRADIENT_TEXT_CLASS,
  THEME_MUTED_CAPTION_CLASS,
} from '../../constants/appThemeClasses';
import { ListPager } from '../common/ListPager';
import { LP, ListPageFilterSearchField } from '../common/listPage/listPageLayout';
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';
import { PrizeBondAddModalHost } from './PrizeBondAddModalHost';
import { logPrizeBond } from '../../lib/prizeBondScanLog';
import { PrizeBondList } from './PrizeBondList';

export const PrizeBondView: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const fetchNotifications = useNotificationsStore((s) => s.fetchNotifications);
  const [bonds, setBonds] = useState<PrizeBond[]>([]);
  const [wins, setWins] = useState<PrizeBondWin[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [addSeed, setAddSeed] = useState('');
  const [editing, setEditing] = useState<PrizeBond | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const schedule = useMemo(() => getDrawSchedule(), []);

  const reload = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [b, w] = await Promise.all([fetchPrizeBonds(user.id), fetchPrizeBondWins(user.id)]);
      setBonds(b);
      setWins(w);
    } catch {
      toast.error(t('prizeBond.loadError'));
    } finally {
      setLoading(false);
    }
  }, [user?.id, t]);

  useEffect(() => { void reload(); }, [reload]);

  useEffect(() => {
    const q = searchParams.get('search');
    if (q) {
      setSearch(q);
      setAddSeed(q);
    }
    if (searchParams.get('add') === 'bond') setShowAdd(true);
    if (q || searchParams.get('add') === 'bond') {
      const next = new URLSearchParams(searchParams);
      next.delete('search');
      next.delete('add');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const filtered = useMemo(() => {
    const q = search.trim();
    if (!q) return bonds;
    return bonds.filter((b) => b.bond_number.includes(q));
  }, [bonds, search]);

  const paged = useMemo(
    () => paginateList(filtered, page, PRIZE_BOND_PAGE_SIZE),
    [filtered, page],
  );

  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => {
    if (page > paged.totalPages) setPage(paged.totalPages);
  }, [page, paged.totalPages]);

  const totalValue = bonds.length * PRIZE_BOND_DENOMINATION;
  const winningBondIds = useMemo(() => winningBondIdSet(wins), [wins]);

  const bondError = (e: unknown) => {
    const msg = (e as Error).message;
    toast.error(msg === 'DUPLICATE_BOND' ? t('prizeBond.duplicate') : t('prizeBond.invalidNumber'));
  };

  const handleCheck = async () => {
    setChecking(true);
    logPrizeBond('check', 'click', { bonds: bonds.length });
    try {
      const result = await triggerPrizeBondCheck();
      logPrizeBond('check', 'done', result);
      toast.success(t('prizeBond.checkDone', { wins: result.wins_found, checked: result.bonds_checked }));
      await reload();
      if (user?.id) await fetchNotifications();
    } catch (e) {
      logPrizeBond('check', 'failed', e);
      const msg = (e as Error)?.message;
      toast.error(
        msg === 'NO_SESSION' || msg === 'Unauthorized'
          ? 'Session expired — please sign in again'
          : t('prizeBond.checkError')
      );
    } finally {
      setChecking(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!user?.id || !editing) return;
    try {
      await updatePrizeBond(user.id, editing.id, editing.bond_number);
      setEditing(null);
      toast.success(t('prizeBond.updated'));
      await reload();
    } catch (e) {
      bondError(e);
    }
  };

  const confirmDelete = async () => {
    if (!user?.id || !deleteId) return;
    try {
      await deletePrizeBond(user.id, deleteId);
      setDeleteId(null);
      toast.success(t('prizeBond.deleted'));
      await reload();
    } catch {
      toast.error(t('prizeBond.deleteError'));
    }
  };

  if (loading && !bonds.length) {
    return <div className="p-6 text-center text-gray-500">{t('prizeBond.loading')}</div>;
  }

  const summaryCardClass = 'bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 px-2';
  const checkDisabled = checking || !bonds.length;
  const checkSpin = checking ? 'animate-spin' : '';

  return (
    <div className={`${LP.stack} w-full min-w-0 max-w-[1800px] mx-auto`}>
      <div className={LP.card}>
        <div className={LP.filterHeader}>
          <div className={LP.filterRow} style={{ marginBottom: 0 }}>
            <ListPageFilterSearchField value={search} onChange={setSearch} placeholder={t('prizeBond.search')} />
            <div className="flex-grow" />
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button type="button" onClick={() => void handleCheck()} disabled={checkDisabled}
                className="inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 h-8 rounded-md text-xs sm:text-[13px] bg-gradient-primary text-white disabled:opacity-50">
                <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${checkSpin}`} />
                <span className="hidden sm:inline">{t('prizeBond.checkNow')}</span>
              </button>
              {user?.id && (
                <>
                  <button type="button" onClick={() => setShowAdd(true)}
                    className="md:hidden px-2 py-1.5 h-8 w-8 rounded-md bg-gradient-primary text-white flex items-center justify-center"
                    title={t('prizeBond.addBond')} aria-label={t('prizeBond.addBond')}>
                    <Plus className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => setShowAdd(true)}
                    className="hidden md:flex px-2 sm:px-3 py-1.5 h-8 rounded-md items-center gap-1.5 text-xs sm:text-[13px] bg-gradient-primary text-white">
                    <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>{t('prizeBond.addBond')}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3">
          <div className={summaryCardClass}>
            <div className="flex items-center justify-between">
              <div className="text-left min-w-0">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{t('prizeBond.totalBonds')}</p>
                <p className={`font-bold ${THEME_ACCENT_TEXT_CLASS}`} style={{ fontSize: '1.2rem' }}>{bonds.length}</p>
                <p className={THEME_MUTED_CAPTION_CLASS} style={{ fontSize: '11px' }}>
                  {PRIZE_BOND_DENOMINATION} BDT each
                </p>
              </div>
              <Ticket className={THEME_ACCENT_TEXT_CLASS} style={{ width: '1.2rem', height: '1.2rem' }} />
            </div>
          </div>
          <div className={summaryCardClass}>
            <div className="flex items-center justify-between">
              <div className="text-left min-w-0">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{t('prizeBond.faceValue')}</p>
                <p className={THEME_BRAND_GRADIENT_TEXT_CLASS} style={{ fontSize: '1.2rem' }}>
                  ৳{totalValue.toLocaleString()}
                </p>
                <p className={THEME_MUTED_CAPTION_CLASS} style={{ fontSize: '11px' }}>
                  {bonds.length} bond{bonds.length === 1 ? '' : 's'} tracked
                </p>
              </div>
              <span className={THEME_ACCENT_TEXT_CLASS} style={{ fontSize: '1.2rem' }}>৳</span>
            </div>
          </div>
          <div className={summaryCardClass}>
            <div className="flex items-center justify-between">
              <div className="text-left min-w-0">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{t('prizeBond.totalWins')}</p>
                <p className={`font-bold ${THEME_ACCENT_TEXT_CLASS}`} style={{ fontSize: '1.2rem' }}>{wins.length}</p>
                <p className={THEME_MUTED_CAPTION_CLASS} style={{ fontSize: '11px' }}>
                  {wins.length === 0 ? 'No wins yet' : `${wins.length} prize${wins.length === 1 ? '' : 's'} won`}
                </p>
              </div>
              <Trophy className={THEME_ACCENT_TEXT_CLASS} style={{ width: '1.2rem', height: '1.2rem' }} />
            </div>
          </div>
          <div className={summaryCardClass}>
            <div className="flex items-center justify-between">
              <div className="text-left min-w-0">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{t('prizeBond.nextDraw')}</p>
                <p className={`font-bold ${THEME_ACCENT_TEXT_CLASS}`} style={{ fontSize: '1.2rem' }}>
                  {format(schedule.next, 'MMM d, yyyy')}
                </p>
                <p className={THEME_MUTED_CAPTION_CLASS} style={{ fontSize: '11px' }}>
                  {t('prizeBond.previousDraw')}: {format(schedule.previous, 'MMM d, yyyy')}
                </p>
              </div>
              <button type="button" onClick={() => void handleCheck()} disabled={checkDisabled}
                title={t('prizeBond.checkNow')} aria-label={t('prizeBond.checkNow')}
                className="p-0.5 rounded-md hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed">
                <RefreshCw className={`${THEME_ACCENT_TEXT_CLASS} ${checkSpin}`} style={{ width: '1.2rem', height: '1.2rem' }} />
              </button>
            </div>
          </div>
        </div>
        <PrizeBondList
          bonds={paged.items}
          rowOffset={paged.start}
          winningBondIds={winningBondIds}
          emptyMessage={t('prizeBond.empty')}
          bondNumberLabel={t('prizeBond.bondNumber')}
          actionsLabel={t('prizeBond.actions')}
          onEdit={setEditing}
          onDelete={setDeleteId}
          onCopyBond={() => toast.success(t('prizeBond.copied'))}
        />
        <ListPager
          page={paged.page}
          totalPages={paged.totalPages}
          total={paged.total}
          start={paged.start}
          end={paged.end}
          onPage={setPage}
        />
      </div>

      {wins.length > 0 && (
        <div className={LP.card}>
          <div className="p-3 md:p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-500" />{t('prizeBond.winHistory')}</h2>
          </div>
          <div className={LP.tableOuter}>
            <table className={LP.table}>
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-3 py-2 text-left text-xs">{t('prizeBond.bondNumber')}</th>
                  <th className="px-3 py-2 text-left text-xs">{t('prizeBond.prize')}</th>
                  <th className="px-3 py-2 text-left text-xs">{t('prizeBond.amount')}</th>
                  <th className="px-3 py-2 text-left text-xs">{t('prizeBond.drawDate')}</th>
                </tr>
              </thead>
              <tbody>
                {wins.map((w) => (
                  <tr key={w.id}>
                    <td className="px-3 py-2 text-sm font-mono">{w.bond_number}</td>
                    <td className="px-3 py-2 text-sm">{w.prize_tier}</td>
                    <td className="px-3 py-2 text-sm">৳{w.prize_amount.toLocaleString()}</td>
                    <td className="px-3 py-2 text-sm">{w.draw_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <PrizeBondAddModalHost open={showAdd} onClose={() => { setShowAdd(false); setAddSeed(''); }}
        onSuccess={reload} initialNumber={addSeed || undefined} />

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 w-full max-w-sm">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t('prizeBond.editBond')}</h3>
              <button type="button" onClick={() => setEditing(null)}><X className="w-4 h-4" /></button>
            </div>
            <input value={editing.bond_number} onChange={(e) => setEditing({ ...editing, bond_number: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 mb-3" />
            <button type="button" onClick={() => void handleSaveEdit()} className="w-full py-2 rounded-md bg-gradient-primary text-white text-sm">{t('prizeBond.save')}</button>
          </div>
        </div>
      )}

      <DeleteConfirmationModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => void confirmDelete()}
        title={t('prizeBond.deleteTitle')} message={t('prizeBond.deleteMessage')} />
    </div>
  );
};
