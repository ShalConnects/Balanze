import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, X } from 'lucide-react';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { useUnifiedDashboardCards } from '../../hooks/useUnifiedDashboardCards';
import { DashboardWidgetInfo } from './DashboardWidgetInfo';
import {
  DashboardCardBadge,
  isDashboardCardBadgeSpec,
  type DashboardCardBadgeSpec,
} from './DashboardCardBadge';

const CLASSIC_SHELL =
  'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-lg transition-all duration-300 border border-blue-200/50 dark:border-blue-800/50 hover:border-blue-300 dark:hover:border-blue-700 relative h-full flex flex-col';

const UNIFIED_SHELL =
  'bg-white dark:bg-gray-800/90 rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors relative h-full flex flex-col shadow-sm';

const CLASSIC_LINK =
  'text-xs sm:text-sm font-medium flex items-center gap-1 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-purple-700 transition-all duration-200 whitespace-nowrap touch-manipulation py-1';

const UNIFIED_LINK =
  'text-xs sm:text-sm font-medium flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 whitespace-nowrap touch-manipulation py-1';

export type DashboardCardShellProps = {
  title: string;
  viewAllTo: string;
  viewAllLabel?: string;
  onHide: () => void;
  hideAriaLabel: string;
  info?: React.ReactNode;
  infoAriaLabel?: string;
  headerExtra?: React.ReactNode;
  /** React node or compact badge spec — shell owns pill rendering. */
  badge?: React.ReactNode | DashboardCardBadgeSpec | null;
  loading?: boolean;
  skeletonSlots?: number;
  children: React.ReactNode;
};

/**
 * Shared responsive chrome for main dashboard overview cards.
 * Toggle classic vs unified via Widget Settings (dashboardUnifiedCards).
 */
export const DashboardCardShell: React.FC<DashboardCardShellProps> = ({
  title,
  viewAllTo,
  viewAllLabel = 'View All',
  onHide,
  hideAriaLabel,
  info,
  infoAriaLabel,
  headerExtra,
  badge,
  loading = false,
  skeletonSlots = 2,
  children,
}) => {
  const [unified] = useUnifiedDashboardCards();
  const { isMobile } = useMobileDetection();
  const [hovered, setHovered] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const tipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (tipTimer.current) clearTimeout(tipTimer.current);
    },
    []
  );

  const onEnter = () => {
    if (isMobile) return;
    setHovered(true);
    setShowTip(true);
    if (tipTimer.current) clearTimeout(tipTimer.current);
    tipTimer.current = setTimeout(() => setShowTip(false), 1000);
  };

  const onLeave = () => {
    if (isMobile) return;
    setHovered(false);
    setShowTip(false);
    if (tipTimer.current) {
      clearTimeout(tipTimer.current);
      tipTimer.current = null;
    }
  };

  return (
    <div
      className={unified ? UNIFIED_SHELL : CLASSIC_SHELL}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {(hovered || isMobile) && (
        <button
          type="button"
          onClick={onHide}
          className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10 flex min-h-[40px] min-w-[40px] items-center justify-center p-2 text-gray-400 transition-colors touch-manipulation hover:text-gray-600 dark:hover:text-gray-300 sm:min-h-0 sm:min-w-0 sm:p-1"
          aria-label={hideAriaLabel}
        >
          <X className="h-4 w-4" />
          {showTip && !isMobile && (
            <span className="absolute bottom-full right-0 z-20 mb-1 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white shadow-lg dark:bg-gray-100 dark:text-gray-900">
              Click to hide this widget
              <span className="absolute -bottom-1 right-2 h-2 w-2 rotate-45 bg-gray-900 dark:bg-gray-100" />
            </span>
          )}
        </button>
      )}

      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 pr-8 sm:pr-9">
        <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
          <h2 className="truncate text-base font-bold text-gray-900 dark:text-white sm:text-lg">
            {title}
          </h2>
          {isDashboardCardBadgeSpec(badge) ? <DashboardCardBadge {...badge} /> : badge}
          {info != null && (
            <DashboardWidgetInfo title={title} ariaLabel={infoAriaLabel ?? `Show ${title} info`}>
              {info}
            </DashboardWidgetInfo>
          )}
        </div>
        <div className="flex flex-shrink-0 items-center gap-1.5 sm:gap-2">
          {headerExtra}
          <Link to={viewAllTo} className={unified ? UNIFIED_LINK : CLASSIC_LINK}>
            <span>{viewAllLabel}</span>
            <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="dashboard-stat-grid flex-1 gap-2 sm:gap-3">
          {Array.from({ length: skeletonSlots }, (_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-700/80 sm:h-20"
            />
          ))}
        </div>
      ) : (
        children
      )}
    </div>
  );
};
