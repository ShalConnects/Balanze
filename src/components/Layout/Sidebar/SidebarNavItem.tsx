import React, { memo } from 'react';
import type { NavItem } from './navigation';

const ACTIVE_ICON_STYLE = {
  light: { background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' },
  dark: { background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' },
};

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
  isDarkMode: boolean;
}

export const SidebarNavItem = memo(function SidebarNavItem({ item, isActive, showLabel, isDemoPage, onNavigate, t, isDarkMode }: Props) {
  const Icon = item.icon;
  const iconStyle = isActive ? ACTIVE_ICON_STYLE[isDarkMode ? 'dark' : 'light'] : {};
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
      <Icon className={`w-5 h-5 ${isActive ? 'text-gradient-primary' : 'text-gray-400 dark:text-gray-500'}`} style={iconStyle} />
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
