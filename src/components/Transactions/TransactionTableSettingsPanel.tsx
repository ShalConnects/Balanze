import React from 'react';
import { Check, Repeat } from 'lucide-react';
import { ListPageFilterSelect } from '../common/listPage/ListPageFilterSelect';

type AccountOption = { id: string; name: string };

type TransactionTableSettingsPanelProps = {
  account: string;
  onAccountChange: (accountId: string) => void;
  accounts: AccountOption[];
  showRecurringOnly: boolean;
  onRecurringChange: (value: boolean) => void;
  isPremiumPlan: boolean;
  columnVisibility: Record<string, boolean>;
  onColumnVisibilityChange: (next: Record<string, boolean>) => void;
};

const SECTION_HEADER =
  'px-3 py-2 text-xs font-semibold text-gradient-primary uppercase border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex-shrink-0';

export function TransactionTableSettingsPanel({
  account,
  onAccountChange,
  accounts,
  showRecurringOnly,
  onRecurringChange,
  isPremiumPlan,
  columnVisibility,
  onColumnVisibilityChange,
}: TransactionTableSettingsPanelProps) {
  const setColumn = (key: string, visible: boolean) => {
    onColumnVisibilityChange({ ...columnVisibility, [key]: visible });
  };

  return (
    <>
      <div className={SECTION_HEADER}>Filters</div>
      <div className="px-3 py-2.5 border-b border-gray-200 dark:border-gray-700 space-y-3 flex-shrink-0">
        <ListPageFilterSelect
          value={account}
          onChange={onAccountChange}
          options={[{ value: 'all', label: 'All Accounts' }, ...accounts.map((a) => ({ value: a.id, label: a.name }))]}
          highlight={account !== 'all'}
          menuScrollable
          className="w-full [&>button]:w-full [&>button]:justify-between"
          ariaLabel="Account filter"
        />
        <label
          className={`flex items-center gap-2 ${isPremiumPlan ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
          title={isPremiumPlan ? undefined : 'Premium feature'}
        >
          <input
            type="checkbox"
            checked={showRecurringOnly}
            disabled={!isPremiumPlan}
            onChange={(e) => onRecurringChange(e.target.checked)}
            className="rounded border-gray-300 dark:border-gray-600"
          />
          <Repeat className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
          <span className="text-sm text-gray-700 dark:text-gray-300">Recurring only</span>
        </label>
      </div>

      <div className={SECTION_HEADER}>Show Columns</div>
      <div className="py-1 overflow-y-auto flex-1 min-h-0">
        {Object.entries(columnVisibility).map(([key, visible]) => {
          const label = key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ');
          return (
            <label
              key={key}
              className={`flex items-center px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm cursor-pointer transition-colors duration-150 touch-manipulation ${
                visible
                  ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              role="menuitemcheckbox"
              aria-checked={visible}
            >
              <div className="relative mr-2 sm:mr-3 flex-shrink-0">
                <input
                  type="checkbox"
                  checked={visible}
                  onChange={(e) => setColumn(key, e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`w-4 h-4 rounded border-2 transition-all duration-150 flex items-center justify-center ${
                    visible
                      ? 'border-transparent bg-gradient-primary'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                  }`}
                >
                  {visible && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </div>
              </div>
              <span
                className={`text-xs sm:text-sm flex-1 min-w-0 ${visible ? 'text-gray-900 dark:text-gray-100 font-medium' : 'text-gray-600 dark:text-gray-400'}`}
              >
                {label}
              </span>
            </label>
          );
        })}
      </div>
      <div className="border-t border-gray-200 dark:border-gray-700 px-2 py-2 flex gap-1 flex-shrink-0 bg-white dark:bg-gray-800">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onColumnVisibilityChange(Object.fromEntries(Object.keys(columnVisibility).map((key) => [key, true])));
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className="flex-1 px-2 sm:px-3 py-1.5 text-xs font-medium text-gradient-primary hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-all duration-150 touch-manipulation"
        >
          Show All
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onColumnVisibilityChange(Object.fromEntries(Object.keys(columnVisibility).map((key) => [key, false])));
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className="flex-1 px-2 sm:px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors touch-manipulation"
        >
          Hide All
        </button>
      </div>
    </>
  );
}

export function hasActiveTableSettings(
  account: string,
  showRecurringOnly: boolean,
  columnVisibility: Record<string, boolean>
): boolean {
  return (
    account !== 'all' ||
    showRecurringOnly ||
    Object.values(columnVisibility).some((visible) => !visible)
  );
}
