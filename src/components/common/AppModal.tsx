import React from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { X } from 'lucide-react';

const SIZE_CLASS = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
} as const;

export type AppModalSize = keyof typeof SIZE_CLASS;

export interface AppModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  size?: AppModalSize;
  /** Extra classes on the panel */
  className?: string;
  hideCloseButton?: boolean;
  /** When true, Escape / backdrop / X do not close */
  closeDisabled?: boolean;
  /** Overlay stacking, default z-50 */
  zClassName?: string;
  initialFocus?: React.RefObject<HTMLElement | null>;
}

/**
 * Shared modal shell: backdrop, focus trap, Escape, scroll, dark mode.
 * Domain forms own field markup; put padding in children as needed.
 */
export const AppModal: React.FC<AppModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  className = '',
  hideCloseButton = false,
  closeDisabled = false,
  zClassName = 'z-50',
  initialFocus,
}) => {
  const requestClose = () => {
    if (!closeDisabled) onClose();
  };

  return (
    <Dialog open={isOpen} onClose={requestClose} className={`relative ${zClassName}`} initialFocus={initialFocus}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <DialogPanel
          className={`relative w-full ${SIZE_CLASS[size]} bg-white dark:bg-gray-800 rounded-xl shadow-xl max-h-[90vh] overflow-y-auto ${className}`}
        >
          {(title != null || !hideCloseButton) && (
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10 rounded-t-xl">
              {title != null ? (
                <DialogTitle as="div" className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white min-w-0 flex-1">
                  {title}
                </DialogTitle>
              ) : (
                <span />
              )}
              {!hideCloseButton && (
                <button
                  type="button"
                  onClick={requestClose}
                  disabled={closeDisabled}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0 disabled:opacity-50 disabled:pointer-events-none"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
          {children}
        </DialogPanel>
      </div>
    </Dialog>
  );
};
