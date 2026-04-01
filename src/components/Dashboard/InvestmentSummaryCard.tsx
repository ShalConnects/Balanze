import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { StatCard } from './StatCard';
import { formatCurrency } from '../../utils/currency';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { getPreference, setPreference } from '../../lib/userPreferences';
import { toast } from 'sonner';
import { fetchBusinessInvestmentContracts } from '../../lib/businessInvestmentService';
import type { InvestmentContract } from '../../types/businessInvestment';
import { aggregateActiveInvestmentSummary } from '../../utils/businessInvestmentStats';
import { DashboardWidgetInfo } from './DashboardWidgetInfo';

interface InvestmentSummaryCardProps {
  filterCurrency?: string;
}

export const InvestmentSummaryCard: React.FC<InvestmentSummaryCardProps> = ({ filterCurrency = '' }) => {
  const { user, profile } = useAuthStore();
  const displayCurrency = filterCurrency?.trim() || profile?.local_currency?.trim() || 'USD';
  const [contracts, setContracts] = useState<InvestmentContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [showCrossTooltip, setShowCrossTooltip] = useState(false);
  const { isMobile } = useMobileDetection();
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [showInvestmentsWidget, setShowInvestmentsWidget] = useState(() => {
    const saved = localStorage.getItem('showInvestmentsWidget');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'showInvestmentsWidget' && e.newValue !== null) setShowInvestmentsWidget(JSON.parse(e.newValue));
    };
    const onCustom = () => {
      const saved = localStorage.getItem('showInvestmentsWidget');
      if (saved !== null) setShowInvestmentsWidget(JSON.parse(saved));
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('showInvestmentsWidgetChanged', onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('showInvestmentsWidgetChanged', onCustom);
    };
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const showWidget = await getPreference(user.id, 'showInvestmentsWidget', true);
        setShowInvestmentsWidget(showWidget);
        localStorage.setItem('showInvestmentsWidget', JSON.stringify(showWidget));
      } catch {
        /* keep localStorage */
      }
    })();
  }, [user?.id]);

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

  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
    };
  }, []);

  const handleMouseEnter = () => {
    if (!isMobile) {
      setIsHovered(true);
      setShowCrossTooltip(true);
      if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = setTimeout(() => setShowCrossTooltip(false), 1000);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setIsHovered(false);
      setShowCrossTooltip(false);
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
        tooltipTimeoutRef.current = null;
      }
    }
  };

  const handleToggle = async (show: boolean) => {
    localStorage.setItem('showInvestmentsWidget', JSON.stringify(show));
    setShowInvestmentsWidget(show);
    window.dispatchEvent(new CustomEvent('showInvestmentsWidgetChanged'));
    if (user?.id) {
      try {
        await setPreference(user.id, 'showInvestmentsWidget', show);
        toast.success('Preference saved!', { description: show ? 'Investments widget will be shown' : 'Investments widget hidden' });
      } catch {
        toast.error('Failed to save preference', { description: 'Saved locally only' });
      }
    } else {
      toast.info('Preference saved locally', { description: 'Sign in to sync across devices' });
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 shadow-sm border border-blue-200/50 dark:border-blue-800/50 h-full flex flex-col">
        <div className="grid grid-cols-2 gap-3 flex-1">
          {[0, 1].map((i) => (
            <div key={i} className="animate-pulse bg-gray-50 dark:bg-gray-700 rounded-lg p-4 h-20" />
          ))}
        </div>
      </div>
    );
  }

  if (!hasAnyInCurrency || !showInvestmentsWidget) return null;

  return (
    <div
      className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 border border-blue-200/50 dark:border-blue-800/50 hover:border-blue-300 dark:hover:border-blue-700 relative h-full flex flex-col"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {(isHovered || isMobile) && (
        <button
          type="button"
          onClick={() => handleToggle(false)}
          className="absolute top-2 right-2 min-h-[40px] min-w-[40px] sm:min-h-0 sm:min-w-0 flex items-center justify-center p-2 sm:p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors z-10 touch-manipulation"
          aria-label="Hide Investments widget"
        >
          <X className="w-4 h-4" />
          {showCrossTooltip && !isMobile && (
            <div className="absolute bottom-full right-0 mb-1 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded shadow-lg whitespace-nowrap z-20">
              Click to hide this widget
              <div className="absolute -bottom-1 right-2 w-2 h-2 bg-gray-900 dark:bg-gray-100 rotate-45" />
            </div>
          )}
        </button>
      )}

      <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-2 mb-2 pr-8">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <h2 className="truncate text-base font-bold text-gray-900 dark:text-white sm:text-lg">Investments</h2>
          <DashboardWidgetInfo title="Investments" ariaLabel="Investments widget info">
            {infoBody}
          </DashboardWidgetInfo>
        </div>
        <div className="flex flex-shrink-0 items-center gap-3">
          <Link
            to="/investments"
            className="text-sm font-medium flex items-center space-x-1 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-purple-700 transition-all duration-200 whitespace-nowrap touch-manipulation py-1"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-3 sm:gap-4 flex-1">
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

    </div>
  );
};
