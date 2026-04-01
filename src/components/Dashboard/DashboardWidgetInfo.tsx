import React, { useState } from 'react';
import { Info, X } from 'lucide-react';
import { useMobileDetection } from '../../hooks/useMobileDetection';

export interface DashboardWidgetInfoProps {
  title: string;
  ariaLabel: string;
  children: React.ReactNode;
  /** Appended to modal panel (e.g. max height + scroll for long content) */
  modalPanelClassName?: string;
}

const BTN =
  'ml-1 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 focus:outline-none transition-all duration-200 hover:scale-110 active:scale-95';

const TOOLTIP =
  'absolute left-1/2 top-full z-50 mt-2 w-72 sm:w-80 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl p-3 sm:p-4 text-xs text-gray-700 dark:text-gray-200 animate-fadein';

export const DashboardWidgetInfo: React.FC<DashboardWidgetInfoProps> = ({
  title,
  ariaLabel,
  children,
  modalPanelClassName = '',
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showMobileModal, setShowMobileModal] = useState(false);
  const { isMobile } = useMobileDetection();

  return (
    <>
      <div className="relative flex flex-shrink-0 items-center">
        <button
          type="button"
          className={BTN}
          onMouseEnter={() => !isMobile && setShowTooltip(true)}
          onMouseLeave={() => !isMobile && setShowTooltip(false)}
          onFocus={() => !isMobile && setShowTooltip(true)}
          onBlur={() => !isMobile && setShowTooltip(false)}
          onClick={() => {
            if (isMobile) setShowMobileModal(true);
            else setShowTooltip((v) => !v);
          }}
          tabIndex={0}
          aria-label={ariaLabel}
        >
          <Info className="h-3.5 w-3.5 text-gray-400 transition-colors duration-200 hover:text-gray-600 dark:hover:text-gray-300 sm:h-4 sm:w-4" />
        </button>
        {showTooltip && !isMobile && <div className={TOOLTIP}>{children}</div>}
      </div>
      {showMobileModal && isMobile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setShowMobileModal(false)}
            role="presentation"
          />
          <div
            className={`relative w-[90vw] max-w-md animate-fadein rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-900 sm:w-80 sm:p-4 ${modalPanelClassName}`.trim()}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</div>
              <button
                type="button"
                onClick={() => setShowMobileModal(false)}
                className="rounded-full p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Close"
              >
                <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            {children}
          </div>
        </div>
      )}
    </>
  );
};
