import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../../store/authStore';
import { StatCard } from './StatCard';
import { DashboardCardShell } from './DashboardCardShell';
import { formatCurrency } from '../../utils/currency';
import { usePersistedToggle } from '../../hooks/usePersistedToggle';
import { toast } from 'sonner';
import { fetchBusinessInvestmentContracts } from '../../lib/businessInvestmentService';
import type { InvestmentContract } from '../../types/businessInvestment';
import { aggregateActiveInvestmentSummary } from '../../utils/businessInvestmentStats';
import { getProfilePreferredCurrency } from '../../utils/usePreferredCurrency';

interface InvestmentSummaryCardProps {
  filterCurrency?: string;
}

export const InvestmentSummaryCard: React.FC<InvestmentSummaryCardProps> = ({ filterCurrency = '' }) => {
  const { user, profile } = useAuthStore();
  const displayCurrency = filterCurrency?.trim() || getProfilePreferredCurrency(profile);
  const [contracts, setContracts] = useState<InvestmentContract[]>([]);
  const [loading, setLoading] = useState(true);

  const [showInvestmentsWidget, setShowInvestmentsWidget] = usePersistedToggle(
    'showInvestmentsWidget',
    true,
    user?.id,
    { syncFromDb: true }
  );

  useEffect(() => {
    if (!user?.id) {
      setContracts([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchBusinessInvestmentContracts(user.id);
        if (!cancelled) setContracts(data);
      } catch (e) {
        console.error('InvestmentSummaryCard load:', e);
        if (!cancelled) setContracts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const summary = useMemo(
    () => aggregateActiveInvestmentSummary(contracts, filterCurrency),
    [contracts, filterCurrency]
  );

  const hasAnyInCurrency = useMemo(
    () => contracts.some((c) => !filterCurrency || c.currency === filterCurrency),
    [contracts, filterCurrency]
  );

  const contractsInCurrency = useMemo(
    () => contracts.filter((c) => !filterCurrency || c.currency === filterCurrency),
    [contracts, filterCurrency]
  );

  const infoBody = (
    <div className="space-y-2 sm:space-y-3">
      <p className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-400 leading-snug break-words">
        Totals use your <span className="font-medium text-gray-800 dark:text-gray-200">{displayCurrency}</span> dashboard filter and{' '}
        <span className="font-medium text-gray-800 dark:text-gray-200">active</span> contracts only. Deployed totals include reinvestments (capital contribution entries). Closed deals are excluded here.
      </p>
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className="min-w-0">
          <div className="font-semibold text-[11px] sm:text-xs text-gray-900 dark:text-gray-100 mb-0.5">Net (active)</div>
          <div
            className={`font-medium text-[11px] sm:text-xs tabular-nums ${summary.overallNet >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
          >
            {formatCurrency(summary.overallNet, displayCurrency)}
          </div>
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-[11px] sm:text-xs text-gray-900 dark:text-gray-100 mb-0.5">In this currency</div>
          <div className="font-medium text-[11px] sm:text-xs text-gray-700 dark:text-gray-300">
            {contractsInCurrency.length} contract{contractsInCurrency.length === 1 ? '' : 's'} (all statuses)
          </div>
        </div>
      </div>
      <div className="border-t border-gray-200 dark:border-gray-700 pt-2 grid grid-cols-2 gap-2">
        <div>
          <div className="font-semibold text-[11px] sm:text-xs text-gray-900 dark:text-gray-100 mb-0.5">Profit (active)</div>
          <div className="font-medium text-[11px] sm:text-xs text-green-600 dark:text-green-400 tabular-nums">
            {formatCurrency(summary.totalProfit, displayCurrency)}
          </div>
        </div>
        <div>
          <div className="font-semibold text-[11px] sm:text-xs text-gray-900 dark:text-gray-100 mb-0.5">Loss (active)</div>
          <div className="font-medium text-[11px] sm:text-xs text-red-600 dark:text-red-400 tabular-nums">
            {formatCurrency(summary.totalLoss, displayCurrency)}
          </div>
        </div>
      </div>
      <p className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-2">
        Use <span className="font-medium">View all</span> for entries, closed contracts, and edits.
      </p>
    </div>
  );

  const hideInvestmentsWidget = () => {
    setShowInvestmentsWidget(false);
    toast.success('Preference saved!', { description: 'Investments widget hidden' });
  };

  if (loading) {
    return (
      <DashboardCardShell
        title="Investments"
        viewAllTo="/investments"
        onHide={hideInvestmentsWidget}
        hideAriaLabel="Hide Investments widget"
        loading
      >
        {null}
      </DashboardCardShell>
    );
  }

  if (!hasAnyInCurrency || !showInvestmentsWidget) return null;

  return (
    <DashboardCardShell
      title="Investments"
      viewAllTo="/investments"
      onHide={hideInvestmentsWidget}
      hideAriaLabel="Hide Investments widget"
      info={infoBody}
      infoAriaLabel="Investments widget info"
    >
      <div className="dashboard-stat-grid gap-3 sm:gap-4 flex-1">
        <div className="min-w-0 w-full">
          <StatCard title="Active contracts" value={String(summary.activeCount)} color="blue" />
        </div>
        <div className="min-w-0 w-full">
          <StatCard
            title="Deployed (active)"
            value={formatCurrency(summary.totalPrincipal, displayCurrency)}
            color="purple"
          />
        </div>
      </div>
    </DashboardCardShell>
  );
};
