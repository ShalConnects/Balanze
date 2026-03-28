import React from 'react';
import { X } from 'lucide-react';

export function listPageMobileFilterChipClass(selected: boolean): string {
  return selected
    ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200'
    : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700';
}

type ListPageMobileFilterModalProps = {
  open: boolean;
  onApply: () => void;
  onClearAll: () => void;
  onBackdropClick: () => void;
  applyActive?: boolean;
  children: React.ReactNode;
};

export function ListPageMobileFilterModal({
  open,
  onApply,
  onClearAll,
  onBackdropClick,
  applyActive,
  children
}: ListPageMobileFilterModalProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={onBackdropClick}
    >
      <div
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl w-full max-w-xs overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white dark:bg-gray-900 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">Filters</span>
              <div className="text-xs text-gray-500 dark:text-gray-400">Select filters and click ✓ to apply</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onApply();
                }}
                onTouchStart={(e) => e.stopPropagation()}
                className={`p-2 transition-colors touch-manipulation ${
                  applyActive
                    ? 'text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 active:opacity-70'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 active:opacity-70'
                }`}
                style={{ touchAction: 'manipulation' }}
                title="Apply Filters"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClearAll();
                }}
                onTouchStart={(e) => e.stopPropagation()}
                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-2 transition-colors touch-manipulation active:opacity-70"
                style={{ touchAction: 'manipulation' }}
                title="Clear All Filters"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

type ListPageMobileFilterSectionProps = {
  label: string;
  children: React.ReactNode;
  borderBottom?: boolean;
  borderTop?: boolean;
};

export function ListPageMobileFilterSection({
  label,
  children,
  borderBottom = true,
  borderTop = false
}: ListPageMobileFilterSectionProps) {
  return (
    <div
      className={`px-3 py-2 ${borderTop ? 'border-t border-gray-200 dark:border-gray-700' : ''} ${
        borderBottom ? 'border-b border-gray-200 dark:border-gray-700' : ''
      }`}
    >
      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{label}</div>
      <div className="flex flex-wrap gap-1">{children}</div>
    </div>
  );
}

type ListPageMobileFilterChipProps = {
  selected: boolean;
  onClick: (e: React.MouseEvent) => void;
  children: React.ReactNode;
};

export function ListPageMobileFilterChip({ selected, onClick, children }: ListPageMobileFilterChipProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      className={`px-2 py-1 text-xs rounded-full border transition-colors ${listPageMobileFilterChipClass(selected)}`}
    >
      {children}
    </button>
  );
}
