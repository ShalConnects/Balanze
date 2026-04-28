import React from 'react';
import { ExternalLink, Heart, Quote, RefreshCw, Settings } from 'lucide-react';
import { CustomDropdown } from '../Purchases/CustomDropdown';
import { OverflowMarquee } from '../common/OverflowMarquee';

const PERIOD_OPTIONS = [
  { value: 'all', label: 'All Time' },
  { value: '1m', label: '1 Month' },
  { value: '3m', label: '3 Months' },
  { value: '6m', label: '6 Months' },
  { value: '1y', label: '1 Year' },
] as const;

const chipClass = 'bg-white dark:bg-gray-700 border border-blue-200 dark:border-blue-600 text-gray-700 dark:text-gray-200 text-xs sm:text-sm h-8 min-h-[32px] hover:bg-blue-50 dark:hover:bg-blue-900/30 focus:ring-2 focus:ring-blue-500 rounded-full px-3 sm:px-4 py-1 min-w-0 max-w-[44vw] sm:max-w-none';

interface DashboardFilterBarProps {
  filterCurrency: string;
  onCurrencyChange: (v: string) => void;
  timeFilter: '1m' | '3m' | '6m' | '1y' | 'all';
  onTimeFilterChange: (v: '1m' | '3m' | '6m' | '1y' | 'all') => void;
  currencies: string[];
  inspirationText?: string;
  isInspirationFavorited?: boolean;
  onRefreshInspiration?: () => void;
  onToggleInspirationFavorite?: () => void;
  onOpenFavoriteQuotes?: () => void;
  onOpenWidgets: () => void;
}

export const DashboardFilterBar: React.FC<DashboardFilterBarProps> = ({
  filterCurrency,
  onCurrencyChange,
  timeFilter,
  onTimeFilterChange,
  currencies,
  inspirationText,
  isInspirationFavorited = false,
  onRefreshInspiration,
  onToggleInspirationFavorite,
  onOpenFavoriteQuotes,
  onOpenWidgets,
}) => {
  const hasMultipleCurrencies = currencies.length > 1;

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-lg p-2 sm:p-2.5 border border-blue-200/50 dark:border-blue-800/50 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
        {hasMultipleCurrencies && (
          <CustomDropdown
            options={currencies.map(c => ({ value: c, label: c }))}
            value={filterCurrency}
            onChange={onCurrencyChange}
            fullWidth={false}
            className={chipClass}
            dropdownMenuClassName="!bg-white dark:!bg-gray-800 !border-gray-200 dark:!border-gray-600 !shadow-lg"
          />
        )}
        <CustomDropdown
          options={[...PERIOD_OPTIONS]}
          value={timeFilter}
          onChange={v => onTimeFilterChange(v as typeof timeFilter)}
          fullWidth={false}
          className={chipClass}
          dropdownMenuClassName="!bg-white dark:!bg-gray-800 !border-gray-200 dark:!border-gray-600 !shadow-lg"
        />
      </div>
      {inspirationText ? (
        <div
          className="hidden lg:flex min-w-0 flex-1 items-center gap-1.5 rounded-full bg-white dark:bg-gray-700 border border-blue-200 dark:border-blue-600 px-3 py-1 text-xs text-gray-700 dark:text-gray-200"
          title={inspirationText}
          aria-label="Daily inspiration quote"
        >
          <Quote className="w-3.5 h-3.5 flex-shrink-0 text-purple-500" />
          <OverflowMarquee text={inspirationText} className="flex-1 overflow-x-auto hide-scrollbar" scrollOnOverflow />
          <div className="ml-auto flex items-center gap-0.5">
            <button
              type="button"
              onClick={onRefreshInspiration}
              className="p-1 rounded-full hover:bg-purple-100 dark:hover:bg-purple-800/30 transition-colors"
              title="Refresh quote"
              aria-label="Refresh quote"
            >
              <RefreshCw className="w-3.5 h-3.5 text-purple-500" />
            </button>
            <button
              type="button"
              onClick={onToggleInspirationFavorite}
              className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-800/30 transition-colors"
              title={isInspirationFavorited ? 'Remove from favorites' : 'Add to favorites'}
              aria-label={isInspirationFavorited ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart className={`w-3.5 h-3.5 ${isInspirationFavorited ? 'text-red-500 fill-red-500' : 'text-gray-400'}`} />
            </button>
            <button
              type="button"
              onClick={onOpenFavoriteQuotes}
              className="p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors"
              title="View favorite quotes"
              aria-label="View favorite quotes"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
            </button>
          </div>
        </div>
      ) : null}
      <button
        type="button"
        onClick={onOpenWidgets}
        className="flex-shrink-0 p-2 rounded-full bg-white dark:bg-gray-700 border border-blue-200 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
        title="Customize widgets"
        aria-label="Customize widgets"
      >
        <Settings className="w-4 h-4 text-blue-600 dark:text-blue-400" />
      </button>
    </div>
  );
};
