import React from 'react';

export type BadgeTone = 'alert' | 'positive' | 'soft';

export type DashboardCardBadgeSpec = {
  count?: number;
  label?: string;
  text?: string;
  tone?: BadgeTone;
};

const TONES: Record<BadgeTone, string> = {
  alert:
    'rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400',
  positive:
    'rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400',
  soft:
    'rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

/** True for plain badge specs (not React nodes). */
export const isDashboardCardBadgeSpec = (
  value: unknown
): value is DashboardCardBadgeSpec =>
  !!value &&
  typeof value === 'object' &&
  !React.isValidElement(value) &&
  ('text' in value || 'count' in value || 'label' in value);

export const DashboardCardBadge: React.FC<DashboardCardBadgeSpec> = ({
  count = 0,
  label,
  text,
  tone = 'alert',
}) => {
  const content = text || (count > 0 && label ? `${count} ${label}` : null);
  if (!content) return null;
  return <span className={TONES[tone]}>{content}</span>;
};

/** Count pill; omitted when count is 0. */
export const countBadge = (
  count: number,
  label: string,
  tone: BadgeTone = 'alert'
): DashboardCardBadgeSpec | undefined =>
  count > 0 ? { count, label, tone } : undefined;

export const profitBadge = (
  amount: number,
  formatted: string
): DashboardCardBadgeSpec | undefined =>
  amount > 0 ? { tone: 'positive', text: `${formatted} profit` } : undefined;

export const drawSoonBadge = (
  nextDraw: Date,
  withinDays = 7
): DashboardCardBadgeSpec | undefined => {
  const days = Math.ceil((nextDraw.getTime() - Date.now()) / 86_400_000);
  return days >= 0 && days <= withinDays ? { text: 'draw soon' } : undefined;
};

export const learningNudge = (progress: number): DashboardCardBadgeSpec => ({
  tone: 'soft',
  text: progress >= 100 ? 'well done' : progress > 0 ? 'keep going' : 'stay curious',
});

/** Prefer overdue planned purchases; else high-priority planned. */
export const purchaseAttentionBadge = (
  purchases: { status?: string; purchase_date?: string | null; priority?: string }[]
): DashboardCardBadgeSpec | undefined => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  let overdue = 0;
  let high = 0;
  for (const p of purchases) {
    if (p.status !== 'planned') continue;
    if (p.purchase_date && new Date(p.purchase_date) < start) overdue++;
    else if (p.priority === 'high') high++;
  }
  return countBadge(overdue, 'overdue') ?? countBadge(high, 'high');
};
