import React, { useEffect, useRef, useState } from 'react';

/** Same gradient as list-page search / client filter chips (kept local to avoid circular import with listPageLayout re-exports). */
const FILTER_BTN_ACTIVE_STYLE: React.CSSProperties = {
  background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)'
};

export type ListPageFilterOption = { value: string; label: string };

type ListPageFilterSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: ListPageFilterOption[];
  /** When true, use the same “active” gradient + border as Clients filter chips. */
  highlight: boolean;
  ariaLabel?: string;
  /** When true, menu panel uses max-h-48 overflow-y (currency / long lists). */
  menuScrollable?: boolean;
  /** Open menu above the button (e.g. footer pager). */
  dropUp?: boolean;
  className?: string;
};

/** Matches ClientList desktop filter buttons (content width, not full-row). */
const BTN =
  'px-3 py-1.5 pr-2 text-[13px] h-8 rounded-md transition-colors flex items-center space-x-1.5 min-w-0';

export function ListPageFilterSelect({
  value,
  onChange,
  options,
  highlight,
  ariaLabel,
  menuScrollable,
  dropUp,
  className = ''
}: ListPageFilterSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  const label = options.find((o) => o.value === value)?.label ?? options[0]?.label ?? '';

  return (
    <div className={`relative ${className}`.trim()} ref={rootRef}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`${BTN} ${
          highlight
            ? 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
        style={highlight ? FILTER_BTN_ACTIVE_STYLE : undefined}
      >
        <span className="truncate">{label}</span>
        <svg className="w-3.5 h-3.5 ml-1 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && options.length > 0 ? (
        <div
          className={`absolute left-0 ${dropUp ? 'bottom-full mb-2' : 'mt-2'} bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 min-w-full ${
            menuScrollable ? 'max-h-48 overflow-y-auto' : ''
          }`}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                value === opt.value ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' : ''
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
