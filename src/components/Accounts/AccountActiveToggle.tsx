import React from 'react';

const trackBase =
  'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/80 dark:focus-visible:ring-blue-400 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-gray-900';

const thumb =
  'inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform duration-200';

/** Small status dot on cards — matches primary gradient when active */
export const accountActiveStatusDotClass = (isActive: boolean) =>
  isActive ? 'bg-gradient-primary' : 'bg-gray-400 dark:bg-gray-500';

export const AccountActiveToggle: React.FC<{
  isActive: boolean;
  onToggle: () => void | Promise<void>;
  title?: string;
}> = ({ isActive, onToggle, title }) => (
  <button
    type="button"
    onClick={async e => {
      e.preventDefault();
      e.stopPropagation();
      await onToggle();
    }}
    className={`${trackBase} ${isActive ? 'bg-gradient-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
    title={title ?? (isActive ? 'Deactivate Account' : 'Activate Account')}
    aria-pressed={isActive}
  >
    <span className={`${thumb} ${isActive ? 'translate-x-5' : 'translate-x-1'}`} />
  </button>
);
