import React, { memo } from 'react';
import type { NavItem } from './navigation';

/** Solid colors for active icons — gradient text-fill breaks Lucide SVG stroke (looks thin/wrong vs inactive rows). */
const ACTIVE_ICON_CLASS = 'text-blue-600 dark:text-blue-400';

const BASE_BTN = 'w-full flex items-center rounded-lg sidebar-nav-item touch-active';
const ACTIVE_BTN = 'sidebar-active-simple font-semibold';
const INACTIVE_BTN = 'text-gray-600 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-50 hover:via-blue-50/30 hover:to-gray-50 dark:hover:from-gray-700/50 dark:hover:via-blue-900/10 dark:hover:to-gray-700/50 hover:text-gray-900 dark:hover:text-white';
const PADDING_COLLAPSED = 'px-2 py-3 justify-center';
const PADDING_EXPANDED = 'px-4 py-3 space-x-3';

interface Props {
  item: NavItem;
  isActive: boolean;
  showLabel: boolean;
  isDemoPage: boolean;
  onNavigate: (id: string) => void;
  t: (key: string) => string;
}

export const SidebarNavItem = memo(function SidebarNavItem({ item, isActive, showLabel, isDemoPage, onNavigate, t }: Props) {
  const Icon = item.icon;
  const padding = showLabel ? PADDING_EXPANDED : PADDING_COLLAPSED;

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDemoPage) onNavigate(item.id);
      }}
      data-tour={item.id === 'accounts' ? 'accounts-nav' : undefined}
      className={`${BASE_BTN} ${padding} ${isActive ? ACTIVE_BTN : INACTIVE_BTN}`}
      title={!showLabel ? t(item.name) : undefined}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? ACTIVE_ICON_CLASS : 'text-gray-400 dark:text-gray-500'}`} />
      {showLabel && (
        <>
          <span className={`${isActive ? 'text-gradient-primary' : ''} text-[14px] font-bold flex-1 text-left`}>{t(item.name)}</span>
          {item.isNew && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-gradient-to-r from-blue-500 to-purple-500 text-white">New</span>
          )}
        </>
      )}
    </button>
  );
});
