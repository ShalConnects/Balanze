import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, RefreshCw, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAuthStore } from '../../store/authStore';
import { loadPrizeBondDashboardSummary, triggerPrizeBondCheck } from '../../lib/prizeBondService';
import type { PrizeBondDashboardSummary } from '../../lib/prizeBondUtils';
import { summarizePrizeBonds } from '../../lib/prizeBondUtils';
import { investmentsBondsPath } from '../../lib/investmentsNav';
import { formatCurrency } from '../../utils/currency';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { getPreference, setPreference } from '../../lib/userPreferences';
import { StatCard } from './StatCard';
import { DashboardWidgetInfo } from './DashboardWidgetInfo';

const WIDGET_KEY = 'showPrizeBondsWidget';
const BDT = 'BDT';

interface PrizeBondSummaryCardProps {
  filterCurrency?: string;
}

export const PrizeBondSummaryCard: React.FC<PrizeBondSummaryCardProps> = ({ filterCurrency = '' }) => {
  const { user } = useAuthStore();
  const { isMobile } = useMobileDetection();
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [summary, setSummary] = useState<PrizeBondDashboardSummary>(() => summarizePrizeBonds([], []));
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showCrossTooltip, setShowCrossTooltip] = useState(false);
  const [showWidget, setShowWidget] = useState(() => {
    const saved = localStorage.getItem(WIDGET_KEY);
    return saved !== null ? JSON.parse(saved) : true;
  });

  const isBdtFilter = filterCurrency === BDT;

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === WIDGET_KEY && e.newValue !== null) setShowWidget(JSON.parse(e.newValue));
    };
    const onCustom = () => {
      const saved = localStorage.getItem(WIDGET_KEY);
      if (saved !== null) setShowWidget(JSON.parse(saved));
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener(`${WIDGET_KEY}Changed`, onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(`${WIDGET_KEY}Changed`, onCustom);
    };
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    void getPreference(user.id, WIDGET_KEY, true).then((visible) => {
      setShowWidget(visible);
      localStorage.setItem(WIDGET_KEY, JSON.stringify(visible));
    }).catch(() => {});
  }, [user?.id]);

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

  useEffect(() => () => {
    if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
  }, []);

  const handleToggle = async (show: boolean) => {
    localStorage.setItem(WIDGET_KEY, JSON.stringify(show));
    setShowWidget(show);
    window.dispatchEvent(new CustomEvent(`${WIDGET_KEY}Changed`));
    if (user?.id) {
      try {
        await setPreference(user.id, WIDGET_KEY, show);
        toast.success('Preference saved!', { description: show ? 'Prize bonds widget will be shown' : 'Prize bonds widget hidden' });
      } catch {
        toast.error('Failed to save preference', { description: 'Saved locally only' });
      }
    }
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

  const handleMouseEnter = () => {
    if (isMobile) return;
    setIsHovered(true);
    setShowCrossTooltip(true);
    if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
    tooltipTimeoutRef.current = setTimeout(() => setShowCrossTooltip(false), 1000);
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    setIsHovered(false);
    setShowCrossTooltip(false);
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = null;
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
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 shadow-sm border border-blue-200/50 dark:border-blue-800/50 h-full flex flex-col">
        <div className="grid grid-cols-2 gap-3 flex-1">
          {[0, 1].map((i) => (
            <div key={i} className="animate-pulse bg-gray-50 dark:bg-gray-700 rounded-lg p-4 h-20" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 border border-blue-200/50 dark:border-blue-800/50 hover:border-blue-300 dark:hover:border-blue-700 relative h-full flex flex-col"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {(isHovered || isMobile) && (
        <button
          type="button"
          onClick={() => void handleToggle(false)}
          className="absolute top-2 right-2 min-h-[40px] min-w-[40px] sm:min-h-0 sm:min-w-0 flex items-center justify-center p-2 sm:p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors z-10 touch-manipulation"
          aria-label="Hide Prize bonds widget"
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
          <h2 className="truncate text-base font-bold text-gray-900 dark:text-white sm:text-lg">Prize bonds</h2>
          <DashboardWidgetInfo title="Prize bonds" ariaLabel="Prize bonds widget info">{infoBody}</DashboardWidgetInfo>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
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
          <Link
            to={investmentsBondsPath()}
            className="text-sm font-medium flex items-center space-x-1 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-purple-700 transition-all duration-200 whitespace-nowrap touch-manipulation py-1"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="dashboard-stat-grid gap-3 sm:gap-4 flex-1">
        <div className="min-w-0 w-full">
          <StatCard title="Bonds held" value={String(summary.bondCount)} color="blue" />
        </div>
        <div className="min-w-0 w-full">
          <StatCard title="Next draw" value={format(summary.nextDraw, 'MMM d, yyyy')} color="purple" />
        </div>
      </div>
    </div>
  );
};
