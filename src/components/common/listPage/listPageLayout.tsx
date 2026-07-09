import React from 'react';
import { Search } from 'lucide-react';

/** Stat row under AccountsView / TransactionList filters (5 columns from `md`). */
export const TABLE_SUMMARY_CARDS_GRID =
  'grid grid-cols-2 md:grid-cols-5 gap-3 p-3';

/** Shared layout tokens for Clients, Investments, and similar list pages (matches AccountsView-derived pattern). */
export const LP = {
  stack: 'space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6',
  card: 'bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 pb-2 sm:pb-3 lg:pb-0',
  filterHeader: 'p-3 border-b border-gray-200 dark:border-gray-700',
  /** Investments-only filter row spacing to match Lent & Borrow mobile rhythm. */
  investmentFilterHeader: 'p-3 md:p-4 border-b border-gray-200 dark:border-gray-700',
  /** Clients-only filter row spacing to match Lent & Borrow mobile rhythm. */
  clientFilterHeader: 'p-3 md:p-4 border-b border-gray-200 dark:border-gray-700',
  /** Same flex row as Purchases / list toolbars (`gap-2`). */
  filterRow: 'flex flex-wrap items-center gap-2',
  summaryGrid: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 lg:gap-4 p-2 sm:p-3 lg:p-4 min-w-0 overflow-hidden',
  /** Clients summary spacing aligned with Lent & Borrow mobile rhythm. */
  clientSummaryGrid: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 lg:gap-4 p-3 lg:p-4 min-w-0 overflow-hidden',
  /** Business investments summary — five stat cards, full-width row on large screens. */
  investmentSummaryGrid:
    'grid grid-cols-1 min-[400px]:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3 lg:gap-4 p-3 lg:p-4 min-w-0 overflow-hidden',
  statCard: 'bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 sm:py-2 px-1.5 sm:px-2',
  tableOuter: 'overflow-x-auto lg:rounded-b-xl',
  tableOuterRadius: { borderBottomLeftRadius: '0.75rem', borderBottomRightRadius: '0.75rem' } as React.CSSProperties,
  desktopTableScroll: 'hidden lg:block max-h-[400px] xl:max-h-[500px] overflow-y-auto',
  mobileScroll: 'lg:hidden max-h-[400px] sm:max-h-[450px] md:max-h-[500px] overflow-y-auto',
  table: 'min-w-full divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900 text-sm lg:text-[14px]'
} as const;

export const LP_SEARCH_ACTIVE_STYLE: React.CSSProperties = {
  background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)'
};

/** Mobile toolbar Filter icon — same active/inactive shell as ClientList. */
export function listPageMobileFilterIconButtonClass(active: boolean): string {
  return `px-2 py-1.5 text-[13px] h-8 w-8 rounded-md transition-colors flex items-center justify-center ${
    active
      ? 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
  }`;
}

export function lpSearchInputClass(active: boolean): string {
  return `w-full pl-8 pr-2 py-1.5 text-[13px] h-8 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 transition-colors ${
    active ? 'border-blue-300 dark:border-blue-600' : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
  }`;
}

type ListPageErrorBannerProps = {
  title: string;
  message: string;
  hint?: string;
};

export function ListPageErrorBanner({ title, message, hint }: ListPageErrorBannerProps) {
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
        <span className="text-red-600 dark:text-red-400 font-medium text-xs sm:text-sm">{title}</span>
        <span className="text-red-700 dark:text-red-300 text-xs sm:text-sm">{message}</span>
      </div>
      {hint ? <p className="text-red-600 dark:text-red-400 text-xs sm:text-sm mt-2">{hint}</p> : null}
    </div>
  );
}

type ListPageFilterSearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  /** True while input differs from debounced value (pulse icon, matches client UX). */
  pending?: boolean;
};

export function ListPageFilterSearchInput({ value, onChange, placeholder, pending }: ListPageFilterSearchInputProps) {
  const active = !!value.trim();
  return (
    <div className="relative">
      <Search
        className={`absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 ${
          pending ? 'animate-pulse text-blue-500' : active ? 'text-blue-500' : 'text-gray-400'
        }`}
        aria-hidden
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={lpSearchInputClass(active)}
        style={active ? LP_SEARCH_ACTIVE_STYLE : undefined}
        placeholder={placeholder}
      />
    </div>
  );
}

/** Search slot — same outer structure as AccountsView (unstyled wrapper + compact input). */
export function ListPageFilterSearchField(props: ListPageFilterSearchInputProps) {
  return (
    <div>
      <ListPageFilterSearchInput {...props} />
    </div>
  );
}

type ListPageClearFiltersButtonProps = { onClick: () => void; title?: string };

export function ListPageClearFiltersButton({ onClick, title = 'Clear all filters' }: ListPageClearFiltersButtonProps) {
  return (
    <button type="button" onClick={onClick} className="text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center" title={title}>
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );
}

export { ListPageFilterSelect } from './ListPageFilterSelect';
export type { ListPageFilterOption } from './ListPageFilterSelect';
export {
  ListPageMobileFilterModal,
  ListPageMobileFilterSection,
  ListPageMobileFilterChip,
  listPageMobileFilterChipClass
} from './ListPageMobileFilterModal';
