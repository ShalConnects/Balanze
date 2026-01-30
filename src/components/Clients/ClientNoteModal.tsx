import React, { useState, useEffect, useRef } from 'react';
import { X, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

interface ClientNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  currentNote: string | undefined;
  onSave: (note: string) => Promise<void>;
}

export const ClientNoteModal: React.FC<ClientNoteModalProps> = ({
  isOpen,
  onClose,
  clientId,
  currentNote,
  onSave
}) => {
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const MAX_LENGTH = 2000;

  useEffect(() => {
    if (isOpen) {
      setNote(currentNote || '');
      setIsEditMode(false); // Always start in view mode
      // Focus textarea after modal opens (only in edit mode)
      if (isEditMode) {
        setTimeout(() => {
          textareaRef.current?.focus();
          textareaRef.current?.setSelectionRange(
            textareaRef.current.value.length,
            textareaRef.current.value.length
          );
        }, 100);
      }
    }
  }, [isOpen, currentNote, clientId]);

  useEffect(() => {
    // Focus textarea when switching to edit mode
    if (isEditMode && isOpen) {
      setTimeout(() => {
        textareaRef.current?.focus();
        textareaRef.current?.setSelectionRange(
          textareaRef.current.value.length,
          textareaRef.current.value.length
        );
      }, 100);
    }
  }, [isEditMode, isOpen]);

  const handleSave = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (note.length > MAX_LENGTH) {
      toast.error(`Note cannot exceed ${MAX_LENGTH} characters`);
      return;
    }

    setIsLoading(true);
    try {
      // Close modal FIRST to prevent reopening during store update
      onClose();
      setIsEditMode(false);
      
      await onSave(note.trim());
      toast.success('Note saved successfully');
    } catch (error) {
      toast.error('Failed to save note. Please try again.');
      // Don't close on error - let user try again
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setNote(currentNote || ''); // Reset to original note
    setIsEditMode(false); // Switch back to view mode
  };

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleDelete = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setIsLoading(true);
    try {
      // Close modal FIRST to prevent reopening during store update
      onClose();
      
      await onSave('');
      toast.success('Note deleted successfully');
    } catch (error) {
      toast.error('Failed to delete note. Please try again.');
      // Don't close on error - let user try again
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
    // Prevent Enter from submitting (allow Shift+Enter for new line)
    if (e.key === 'Enter' && !e.shiftKey && e.ctrlKey) {
      e.preventDefault();
      if (note.trim().length > 0 && note.length <= MAX_LENGTH) {
        handleSave();
      }
    }
  };

  if (!isOpen) return null;

  const hasNote = currentNote && currentNote.trim().length > 0;
  const charCount = note.length;
  const isOverLimit = charCount > MAX_LENGTH;
  const canSave = !isOverLimit && (note.trim() !== (currentNote || '').trim());

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100]"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-[101] pointer-events-none p-3 sm:p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="note-modal-title"
          className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 w-full max-w-md shadow-2xl pointer-events-auto max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 id="note-modal-title" className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
              {isEditMode ? (hasNote ? 'Edit Note' : 'Add Note') : 'View Note'}
            </h3>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* View Mode */}
          {!isEditMode && (
            <div className="mb-4">
              {hasNote ? (
                <div className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white min-h-[120px] whitespace-pre-wrap">
                  {currentNote}
                </div>
              ) : (
                <div className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-500 min-h-[120px] flex items-center justify-center">
                  No note available
                </div>
              )}
            </div>
          )}

          {/* Edit Mode - Textarea */}
          {isEditMode && (
            <div className="mb-4">
              <textarea
                ref={textareaRef}
                value={note}
                onChange={(e) => {
                  const newValue = e.target.value;
                  if (newValue.length <= MAX_LENGTH) {
                    setNote(newValue);
                  }
                }}
                onKeyDown={handleKeyDown}
                placeholder="Enter a note for this client..."
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-400 focus:border-transparent resize-none min-h-[120px]"
                rows={5}
                maxLength={MAX_LENGTH}
                disabled={isLoading}
              />
              {/* Character counter */}
              <div className="flex items-center justify-between mt-1">
                <span className={`text-xs ${isOverLimit ? 'text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  {charCount}/{MAX_LENGTH} characters
                </span>
              </div>
            </div>
          )}

          {/* Error message if over limit */}
          {isOverLimit && (
            <div className="mb-4 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-xs text-red-600 dark:text-red-400">
                Note cannot exceed {MAX_LENGTH} characters. Please shorten your note.
              </p>
            </div>
          )}

          {/* Action buttons */}
          {!isEditMode ? (
            /* View Mode Actions */
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleEdit}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-primary hover:bg-gradient-primary-hover rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <Edit2 className="w-4 h-4" />
                {hasNote ? 'Edit' : 'Add Note'}
              </button>
            </div>
          ) : (
            /* Edit Mode Actions */
            <div className="flex items-center justify-between gap-2">
              <div>
                {hasNote && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isLoading}
                    className="px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isLoading || !canSave || isOverLimit}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-primary hover:bg-gradient-primary-hover rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

