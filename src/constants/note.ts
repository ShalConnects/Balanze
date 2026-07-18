import {
  DASHBOARD_WIDGET_SHELL,
  DASHBOARD_WIDGET_VIEW_ALL,
} from './dashboardWidget';

export const NOTE_COLORS = [
  { name: 'Yellow', value: 'yellow', bg: 'bg-yellow-100 dark:bg-yellow-900/30', border: 'border-yellow-300 dark:border-yellow-700', dot: 'bg-yellow-400 dark:bg-yellow-500' },
  { name: 'Pink', value: 'pink', bg: 'bg-pink-100 dark:bg-pink-900/30', border: 'border-pink-300 dark:border-pink-700', dot: 'bg-pink-400 dark:bg-pink-500' },
  { name: 'Blue', value: 'blue', bg: 'bg-blue-100 dark:bg-blue-900/30', border: 'border-blue-300 dark:border-blue-700', dot: 'bg-blue-400 dark:bg-blue-500' },
  { name: 'Green', value: 'green', bg: 'bg-green-100 dark:bg-green-900/30', border: 'border-green-300 dark:border-green-700', dot: 'bg-green-400 dark:bg-green-500' },
] as const;

export const NOTE_SELECT =
  'id, user_id, title, text, color, pinned, entry_date, updated_at, created_at';

/** Matches dashboard widget shells (blue → indigo → purple). */
export const NOTE_SHELL = DASHBOARD_WIDGET_SHELL;

export const NOTE_PRIMARY_BTN =
  'inline-flex items-center justify-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50';

export const NOTE_ICON_BTN =
  'p-2 rounded-lg border border-blue-200/60 dark:border-blue-800/60 bg-white/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-300 dark:hover:border-blue-700 transition-colors';

export const NOTE_FIELD =
  'w-full rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors';

export const NOTE_LINK = DASHBOARD_WIDGET_VIEW_ALL;

export const todayDateKey = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** Parse `yyyy-MM-dd` as a local calendar date (avoids UTC skew from parseISO). */
export const parseNoteDate = (dateKey: string) => {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

export const noteColorClass = (color: string) =>
  NOTE_COLORS.find((c) => c.value === color) ?? NOTE_COLORS[0];
