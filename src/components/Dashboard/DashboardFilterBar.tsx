import React from 'react';
import { Settings } from 'lucide-react';
import { CustomDropdown } from '../Purchases/CustomDropdown';

const PERIOD_OPTIONS = [
  { value: 'all', label: 'All Time' },
  { value: '1m', label: '1 Month' },
  { value: '3m', label: '3 Months' },
  { value: '6m', label: '6 Months' },
  { value: '1y', label: '1 Year' },
] as const;

const chipClass = 'bg-white dark:bg-gray-700 border border-blue-200 dark:border-blue-600 text-gray-700 dark:text-gray-200 text-xs sm:text-sm h-8 min-h-[32px] hover:bg-blue-50 dark:hover:bg-blue-900/30 focus:ring-2 focus:ring-blue-500 rounded-full px-3 sm:px-4 py-1 min-w-0';

interface DashboardFilterBarProps {
  filterCurrency: string;
  onCurrencyChange: (v: string) => void;
  timeFilter: '1m' | '3m' | '6m' | '1y' | 'all';
  onTimeFilterChange: (v: '1m' | '3m' | '6m' | '1y' | 'all') => void;
  currencies: string[];
  onOpenWidgets: () => void;
}

export const DashboardFilterBar: React.FC<DashboardFilterBarProps> = ({
  filterCurrency,
  onCurrencyChange,
  timeFilter,
  onTimeFilterChange,
  currencies,
  onOpenWidgets,
}) => {
  const hasMultipleCurrencies = currencies.length > 1;

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-lg p-2 sm:p-2.5 border border-blue-200/50 dark:border-blue-800/50 shadow-sm">
      <div className="flex items-center gap-2 flex-1 min-w-0">
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
