/**
 * Shared visual tokens for Balanze (blue–purple brand + chart-aligned cashflow).
 */

export const THEME_BRAND_GRADIENT_TEXT_CLASS =
  'font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent';

export const THEME_ACCENT_TEXT_CLASS = 'text-blue-600 dark:text-blue-400';

/** Card subtitles, “No previous data”, velocity. */
export const THEME_MUTED_CAPTION_CLASS = 'text-gray-500 dark:text-gray-400';

/** Cashflow — matches Dashboard TransactionChart (#10B981 / #EF4444). */
export const CASHFLOW_INCOME_TEXT_CLASS = 'text-emerald-600 dark:text-emerald-400';
export const CASHFLOW_EXPENSE_TEXT_CLASS = 'text-red-600 dark:text-red-400';

export const CASHFLOW_INCOME_CHIP_CLASS =
  'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300';
export const CASHFLOW_EXPENSE_CHIP_CLASS =
  'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300';

export const THEME_TRANSFER_CHIP_CLASS =
  'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200';

/** Recurring: running (emerald family) vs paused (amber, pairs with skip/pause affordances). */
export const THEME_STATUS_ACTIVE_TEXT_CLASS = CASHFLOW_INCOME_TEXT_CLASS;
export const THEME_STATUS_PAUSED_TEXT_CLASS = 'text-amber-600 dark:text-amber-400';

/** Row / toolbar action hovers */
export const THEME_ACTION_HOVER_INCOME_CLASS =
  'hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20';
export const THEME_ACTION_HOVER_EXPENSE_CLASS =
  'hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20';
export const THEME_ACTION_HOVER_PAUSE_CLASS =
  'hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20';

export const THEME_ICON_HOVER_AMBER_CLASS = 'hover:text-amber-600 dark:hover:text-amber-400';
export const THEME_ICON_HOVER_BLUE_CLASS = 'hover:text-blue-600 dark:hover:text-blue-400';
export const THEME_ICON_HOVER_EMERALD_CLASS = 'hover:text-emerald-600 dark:hover:text-emerald-400';
export const THEME_ICON_HOVER_RED_CLASS = 'hover:text-red-600 dark:hover:text-red-400';

export const THEME_FILTER_APPLY_ACTIVE_CLASS =
  'text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 active:opacity-70';
