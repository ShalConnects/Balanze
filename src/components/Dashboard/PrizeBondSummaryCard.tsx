import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAuthStore } from '../../store/authStore';
import { loadPrizeBondDashboardSummary, triggerPrizeBondCheck } from '../../lib/prizeBondService';
import type { PrizeBondDashboardSummary } from '../../lib/prizeBondUtils';
import { summarizePrizeBonds } from '../../lib/prizeBondUtils';
import { investmentsBondsPath } from '../../lib/investmentsNav';
import { formatCurrency } from '../../utils/currency';
import { usePersistedToggle } from '../../hooks/usePersistedToggle';
import { StatCard } from './StatCard';
import { DashboardCardShell } from './DashboardCardShell';
import { drawSoonBadge } from './DashboardCardBadge';

const WIDGET_KEY = 'showPrizeBondsWidget';
const BDT = 'BDT';

interface PrizeBondSummaryCardProps {
  filterCurrency?: string;
}

export const PrizeBondSummaryCard: React.FC<PrizeBondSummaryCardProps> = ({ filterCurrency = '' }) => {
  const { user } = useAuthStore();
  const [summary, setSummary] = useState<PrizeBondDashboardSummary>(() => summarizePrizeBonds([], []));
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [showWidget, setShowWidget] = usePersistedToggle(
    WIDGET_KEY,
    true,
    user?.id,
    { syncFromDb: true }
  );

  const isBdtFilter = filterCurrency === BDT;

  const reload = async () => {
    if (!user?.id) return;
    const data = await loadPrizeBondDashboardSummary(user.id);
    setSummary(data);
  };

  useEffect(() => {
    if (!user?.id || !isBdtFilter) {
      setSummary(summarizePrizeBonds([], []));
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await loadPrizeBondDashboardSummary(user.id);
        if (!cancelled) setSummary(data);
      } catch (e) {
        console.error('PrizeBondSummaryCard load:', e);
        if (!cancelled) setSummary(summarizePrizeBonds([], []));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id, isBdtFilter]);

  const hideWidget = () => {
    setShowWidget(false);
    toast.success('Preference saved!', { description: 'Prize bonds widget hidden' });
  };

  const handleCheck = async () => {
    setChecking(true);
    try {
      const result = await triggerPrizeBondCheck();
      toast.success(`Checked ${result.bonds_checked} bond(s) — ${result.wins_found} new win(s)`);
      await reload();
    } catch (e) {
      const msg = (e as Error)?.message;
      toast.error(
        msg === 'NO_SESSION' || msg === 'Unauthorized'
          ? 'Session expired — please sign in again'
          : 'Could not check draw results'
      );
    } finally {
      setChecking(false);
    }
  };

  if (!isBdtFilter || !showWidget || (!loading && summary.bondCount === 0)) return null;

  const infoBody = (
    <div className="space-y-2 sm:space-y-3">
      <p className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-400 leading-snug break-words">
        Bangladesh <span className="font-medium text-gray-800 dark:text-gray-200">100 BDT</span> prize bonds. Shown when your dashboard currency filter is{' '}
        <span className="font-medium text-gray-800 dark:text-gray-200">BDT</span>.
      </p>
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className="min-w-0">
          <div className="font-semibold text-[11px] sm:text-xs text-gray-900 dark:text-gray-100 mb-0.5">Face value</div>
          <div className="font-medium text-[11px] sm:text-xs text-gray-700 dark:text-gray-300 tabular-nums">
            {formatCurrency(summary.faceValue, BDT)}
          </div>
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-[11px] sm:text-xs text-gray-900 dark:text-gray-100 mb-0.5">Wins</div>
          <div className="font-medium text-[11px] sm:text-xs text-gray-700 dark:text-gray-300">
            {summary.winCount} prize{summary.winCount === 1 ? '' : 's'}
          </div>
        </div>
      </div>
      <div className="border-t border-gray-200 dark:border-gray-700 pt-2 grid grid-cols-2 gap-2">
        <div>
          <div className="font-semibold text-[11px] sm:text-xs text-gray-900 dark:text-gray-100 mb-0.5">Previous draw</div>
          <div className="font-medium text-[11px] sm:text-xs text-gray-700 dark:text-gray-300">
            {format(summary.previousDraw, 'MMM d, yyyy')}
          </div>
        </div>
        <div>
          <div className="font-semibold text-[11px] sm:text-xs text-gray-900 dark:text-gray-100 mb-0.5">Next draw</div>
          <div className="font-medium text-[11px] sm:text-xs text-gray-700 dark:text-gray-300">
            {format(summary.nextDraw, 'MMM d, yyyy')}
          </div>
        </div>
      </div>
      <p className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-2">
        Use <span className="font-medium">View all</span> to manage bonds, or the refresh icon to check the latest draw.
      </p>
    </div>
  );

  if (loading) {
    return (
      <DashboardCardShell
        title="Prize bonds"
        viewAllTo={investmentsBondsPath()}
        onHide={hideWidget}
        hideAriaLabel="Hide Prize bonds widget"
        loading
      >
        {null}
      </DashboardCardShell>
    );
  }

  return (
    <DashboardCardShell
      title="Prize bonds"
      viewAllTo={investmentsBondsPath()}
      onHide={hideWidget}
      hideAriaLabel="Hide Prize bonds widget"
      info={infoBody}
      infoAriaLabel="Prize bonds widget info"
      badge={drawSoonBadge(summary.nextDraw)}
      headerExtra={
        <button
          type="button"
          onClick={() => void handleCheck()}
          disabled={checking}
          title="Check draw"
          aria-label="Check draw"
          className="p-1.5 rounded-md text-blue-600 dark:text-blue-400 hover:bg-blue-100/80 dark:hover:bg-blue-900/30 disabled:opacity-50 touch-manipulation"
        >
          <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
        </button>
      }
    >
      <div className="dashboard-stat-grid gap-3 sm:gap-4 flex-1">
        <div className="min-w-0 w-full">
          <StatCard title="Bonds held" value={String(summary.bondCount)} color="blue" />
        </div>
        <div className="min-w-0 w-full">
          <StatCard title="Next draw" value={format(summary.nextDraw, 'MMM d, yyyy')} color="purple" />
        </div>
      </div>
    </DashboardCardShell>
  );
};
