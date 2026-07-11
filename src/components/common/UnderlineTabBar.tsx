import React from 'react';

export const UNDERLINE_TAB_BTN =
  'px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 -mb-px transition-colors';
export const UNDERLINE_TAB_ACTIVE = 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400';
export const UNDERLINE_TAB_IDLE =
  'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200';

export const UnderlineTabBar: React.FC<{
  tabs: readonly { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}> = ({ tabs, value, onChange, className = '' }) => (
  <div className={`flex border-b border-gray-200 dark:border-gray-700 ${className}`} role="tablist">
    {tabs.map((t) => {
      const active = value === t.id;
      return (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={active}
          onClick={() => onChange(t.id)}
          className={`${UNDERLINE_TAB_BTN} ${active ? UNDERLINE_TAB_ACTIVE : UNDERLINE_TAB_IDLE}`}
        >
          {t.label}
        </button>
      );
    })}
  </div>
);
