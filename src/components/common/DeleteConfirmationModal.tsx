import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { AppModal } from './AppModal';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  message?: string | React.ReactNode;
  recordDetails?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Deletion',
  message = 'Are you sure you want to delete this record? This action cannot be undone.',
  recordDetails,
  confirmLabel = 'Delete Record',
  cancelLabel = 'Cancel',
}) => {
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isOpen) setBusy(false);
  }, [isOpen]);

  const handleConfirm = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onConfirm();
      onClose();
    } catch {
      // Keep open so the user can retry or cancel
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      closeDisabled={busy}
      size="md"
      title={
        <span className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          {title}
        </span>
      }
    >
      <div className="p-4 sm:p-6">
        <div className="mb-6">
          <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-4">{message}</p>
          {recordDetails && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4">
              {recordDetails}
            </div>
          )}
        </div>
        <div className="flex flex-row gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex-1 sm:w-auto px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy}
            className="flex-1 sm:w-auto px-4 py-2 bg-gradient-primary text-white rounded-lg hover:bg-gradient-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </AppModal>
  );
};
