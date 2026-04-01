/** Shared with sidebar “New” chip: padding, radius, font size/weight. */
export const SIDEBAR_NAV_BADGE_BASE =
  'inline-flex items-center flex-shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-semibold text-white';

/** Sidebar Pro pill: same shell as “New”, yellow → orange gradient. */
export function ProBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`${SIDEBAR_NAV_BADGE_BASE} bg-gradient-to-r from-yellow-400 to-orange-500 ${className}`.trim()}
    >
      Pro
    </span>
  );
}
